"""
Serviço de integração com TOTVS Protheus Agro
Sincronização de dados de movimentação para NFP-e
"""
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import logging
from sqlalchemy.orm import Session

from ..core.config import get_settings
from ..core.database import get_db_session
from ..models import Fazenda, Produto, NFPe, NFPeItem

logger = logging.getLogger(__name__)
settings = get_settings()


class MovimentacaoTOTVS(BaseModel):
    """Schema para dados de movimentação do TOTVS"""
    id: str
    filial: str
    documento: str
    serie: str
    data_emissao: datetime
    data_saida: Optional[datetime] = None
    
    # Cliente/Fornecedor
    cliente_fornecedor: str
    loja: str
    nome: str
    cnpj_cpf: str
    inscricao_estadual: Optional[str] = None
    
    # Endereço
    endereco: Dict[str, Any]
    
    # Itens
    itens: List[Dict[str, Any]]
    
    # Valores totais
    valor_total: float
    valor_produtos: float
    valor_frete: float = 0.0
    valor_desconto: float = 0.0
    
    # Transporte
    modalidade_frete: int = 0
    transportador: Optional[Dict[str, Any]] = None
    
    # Natureza da operação
    tes: str
    cfop: str
    natureza_operacao: str
    
    # Status
    status: str = "PENDENTE"


class ItemTOTVS(BaseModel):
    """Schema para itens da movimentação TOTVS"""
    item: str
    produto: str
    descricao: str
    ncm: str
    cfop: str
    unidade: str
    quantidade: float
    preco_unitario: float
    valor_total: float
    valor_desconto: float = 0.0
    
    # Impostos
    cst_icms: Optional[str] = None
    aliquota_icms: float = 0.0
    valor_icms: float = 0.0
    base_icms: float = 0.0
    
    cst_pis: Optional[str] = None
    aliquota_pis: float = 0.0
    valor_pis: float = 0.0
    
    cst_cofins: Optional[str] = None
    aliquota_cofins: float = 0.0
    valor_cofins: float = 0.0
    
    # Dados agrícolas
    lote: Optional[str] = None
    talhao: Optional[str] = None
    safra: Optional[str] = None


class TOTVSIntegrationService:
    """Serviço de integração com TOTVS Protheus Agro"""
    
    def __init__(self):
        self.base_url = settings.TOTVS_API_URL
        self.api_key = settings.TOTVS_API_KEY
        self.api_secret = settings.TOTVS_API_SECRET
        self.company_id = settings.TOTVS_COMPANY_ID
        self.branch_id = settings.TOTVS_BRANCH_ID
        self.timeout = settings.TOTVS_TIMEOUT
        
        # Headers padrão
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-API-Secret": self.api_secret,
            "X-Company-Id": self.company_id,
            "X-Branch-Id": self.branch_id
        }
    
    async def test_connection(self) -> bool:
        """Testa conectividade com TOTVS API"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/health",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Erro ao testar conexão TOTVS: {str(e)}")
            return False
    
    async def buscar_movimentacoes_pendentes(
        self, 
        data_inicio: datetime,
        data_fim: datetime,
        tipos_operacao: List[str] = ["VENDA", "TRANSFERENCIA"]
    ) -> List[MovimentacaoTOTVS]:
        """
        Busca movimentações pendentes de NFP-e no TOTVS
        
        Args:
            data_inicio: Data inicial do período
            data_fim: Data final do período
            tipos_operacao: Tipos de operação a buscar
        """
        try:
            params = {
                "dataInicio": data_inicio.strftime("%Y-%m-%d"),
                "dataFim": data_fim.strftime("%Y-%m-%d"),
                "tiposOperacao": ",".join(tipos_operacao),
                "status": "PENDENTE_NFE",
                "filial": self.branch_id
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/movimentacoes",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                movimentacoes = []
                
                for item in data.get("items", []):
                    try:
                        movimentacao = MovimentacaoTOTVS(**item)
                        movimentacoes.append(movimentacao)
                    except Exception as e:
                        logger.warning(f"Erro ao processar movimentação {item.get('id')}: {str(e)}")
                
                logger.info(f"Encontradas {len(movimentacoes)} movimentações pendentes")
                return movimentacoes
                
        except Exception as e:
            logger.error(f"Erro ao buscar movimentações TOTVS: {str(e)}")
            raise
    
    async def buscar_detalhes_movimentacao(self, movimentacao_id: str) -> Optional[MovimentacaoTOTVS]:
        """Busca detalhes completos de uma movimentação específica"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/movimentacoes/{movimentacao_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                
                data = response.json()
                return MovimentacaoTOTVS(**data)
                
        except Exception as e:
            logger.error(f"Erro ao buscar detalhes da movimentação {movimentacao_id}: {str(e)}")
            return None
    
    async def sincronizar_produtos(self, fazenda_id: int) -> int:
        """
        Sincroniza produtos do TOTVS com o banco local
        
        Returns:
            Número de produtos sincronizados
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/produtos",
                    headers=self.headers,
                    params={"ativo": True, "filial": self.branch_id}
                )
                response.raise_for_status()
                
                produtos_totvs = response.json().get("items", [])
                produtos_sincronizados = 0
                
                with get_db_session() as db:
                    for produto_data in produtos_totvs:
                        produto = self._sincronizar_produto_individual(
                            db, fazenda_id, produto_data
                        )
                        if produto:
                            produtos_sincronizados += 1
                
                logger.info(f"Sincronizados {produtos_sincronizados} produtos do TOTVS")
                return produtos_sincronizados
                
        except Exception as e:
            logger.error(f"Erro ao sincronizar produtos TOTVS: {str(e)}")
            raise
    
    def _sincronizar_produto_individual(
        self, 
        db: Session, 
        fazenda_id: int, 
        produto_data: Dict[str, Any]
    ) -> Optional[Produto]:
        """Sincroniza um produto individual"""
        try:
            # Busca produto existente
            produto = db.query(Produto).filter(
                Produto.fazenda_id == fazenda_id,
                Produto.codigo_totvs == produto_data["codigo"]
            ).first()
            
            if not produto:
                # Cria novo produto
                produto = Produto(
                    fazenda_id=fazenda_id,
                    codigo_totvs=produto_data["codigo"],
                    codigo_interno=produto_data["codigo"],
                    descricao=produto_data["descricao"][:120],
                    ncm=produto_data.get("ncm", "00000000"),
                    cfop_padrao=produto_data.get("cfop_padrao", "5101"),
                    unidade_medida=produto_data.get("unidade", "KG"),
                    tipo_produto=self._determinar_tipo_produto(produto_data),
                    categoria=produto_data.get("grupo", "OUTROS"),
                    ativo=True
                )
                db.add(produto)
            else:
                # Atualiza produto existente
                produto.descricao = produto_data["descricao"][:120]
                produto.ncm = produto_data.get("ncm", produto.ncm)
                produto.unidade_medida = produto_data.get("unidade", produto.unidade_medida)
                produto.updated_at = datetime.utcnow()
            
            db.commit()
            return produto
            
        except Exception as e:
            logger.error(f"Erro ao sincronizar produto {produto_data.get('codigo')}: {str(e)}")
            db.rollback()
            return None
    
    def _determinar_tipo_produto(self, produto_data: Dict[str, Any]) -> str:
        """Determina tipo do produto baseado nos dados do TOTVS"""
        descricao = produto_data.get("descricao", "").upper()
        grupo = produto_data.get("grupo", "").upper()
        
        if any(palavra in descricao for palavra in ["SOJA", "MILHO", "FEIJAO", "ARROZ", "TRIGO"]):
            return "GRAO"
        elif any(palavra in descricao for palavra in ["ALGODAO", "FIBRA"]):
            return "FIBRA"
        elif "SEMENTE" in descricao:
            return "SEMENTE"
        elif any(palavra in grupo for palavra in ["INSUMO", "DEFENSIVO", "FERTILIZANTE"]):
            return "INSUMO"
        else:
            return "OUTROS"
    
    async def atualizar_status_movimentacao(
        self, 
        movimentacao_id: str, 
        status: str,
        chave_nfe: Optional[str] = None,
        numero_nfe: Optional[int] = None,
        serie_nfe: Optional[int] = None
    ) -> bool:
        """
        Atualiza status da movimentação no TOTVS após processamento da NFP-e
        
        Args:
            movimentacao_id: ID da movimentação no TOTVS
            status: Novo status (NFE_EMITIDA, NFE_AUTORIZADA, NFE_REJEITADA)
            chave_nfe: Chave de acesso da NFe
            numero_nfe: Número da NFe
            serie_nfe: Série da NFe
        """
        try:
            payload = {
                "status": status,
                "dataAtualizacao": datetime.utcnow().isoformat(),
            }
            
            if chave_nfe:
                payload["chaveNfe"] = chave_nfe
            if numero_nfe:
                payload["numeroNfe"] = numero_nfe
            if serie_nfe:
                payload["serieNfe"] = serie_nfe
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.put(
                    f"{self.base_url}/movimentacoes/{movimentacao_id}/status",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                
                logger.info(f"Status da movimentação {movimentacao_id} atualizado para {status}")
                return True
                
        except Exception as e:
            logger.error(f"Erro ao atualizar status da movimentação {movimentacao_id}: {str(e)}")
            return False
    
    async def processar_movimentacoes_automaticas(self) -> Dict[str, int]:
        """
        Processa automaticamente movimentações pendentes do TOTVS
        Cria NFP-e para movimentações elegíveis
        
        Returns:
            Estatísticas do processamento
        """
        stats = {
            "total_encontradas": 0,
            "processadas_sucesso": 0,
            "erros": 0,
            "nfes_criadas": 0
        }
        
        try:
            # Busca movimentações dos últimos 7 dias
            data_inicio = datetime.now() - timedelta(days=7)
            data_fim = datetime.now()
            
            movimentacoes = await self.buscar_movimentacoes_pendentes(
                data_inicio, data_fim
            )
            
            stats["total_encontradas"] = len(movimentacoes)
            
            for movimentacao in movimentacoes:
                try:
                    # Processa cada movimentação
                    nfe_criada = await self._processar_movimentacao_individual(movimentacao)
                    
                    if nfe_criada:
                        stats["nfes_criadas"] += 1
                        stats["processadas_sucesso"] += 1
                    
                except Exception as e:
                    logger.error(f"Erro ao processar movimentação {movimentacao.id}: {str(e)}")
                    stats["erros"] += 1
            
            logger.info(f"Processamento automático concluído: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Erro no processamento automático: {str(e)}")
            stats["erros"] += 1
            return stats
    
    async def _processar_movimentacao_individual(self, movimentacao: MovimentacaoTOTVS) -> bool:
        """Processa uma movimentação individual criando NFP-e"""
        try:
            with get_db_session() as db:
                # Busca fazenda
                fazenda = db.query(Fazenda).filter(
                    Fazenda.cnpj == self._limpar_documento(movimentacao.cliente_fornecedor)
                ).first()
                
                if not fazenda:
                    logger.warning(f"Fazenda não encontrada para CNPJ {movimentacao.cliente_fornecedor}")
                    return False
                
                # Verifica se NFP-e já existe
                nfe_existente = db.query(NFPe).filter(
                    NFPe.totvs_id == movimentacao.id
                ).first()
                
                if nfe_existente:
                    logger.info(f"NFP-e já existe para movimentação {movimentacao.id}")
                    return False
                
                # Cria nova NFP-e
                nfe = NFPe(
                    fazenda_id=fazenda.id,
                    numero_nfe=fazenda.proximo_numero_nfe(),
                    serie=fazenda.serie_nfe_padrao,
                    tipo_operacao=1,  # Saída
                    natureza_operacao=movimentacao.natureza_operacao,
                    cfop=movimentacao.cfop,
                    data_emissao=movimentacao.data_emissao,
                    data_saida=movimentacao.data_saida,
                    destinatario_tipo="CNPJ" if len(movimentacao.cnpj_cpf) == 14 else "CPF",
                    destinatario_documento=self._limpar_documento(movimentacao.cnpj_cpf),
                    destinatario_nome=movimentacao.nome,
                    destinatario_ie=movimentacao.inscricao_estadual,
                    destinatario_endereco=movimentacao.endereco,
                    valor_total_produtos=movimentacao.valor_produtos,
                    valor_total_frete=movimentacao.valor_frete,
                    valor_total_desconto=movimentacao.valor_desconto,
                    valor_total_nfe=movimentacao.valor_total,
                    modalidade_frete=movimentacao.modalidade_frete,
                    totvs_id=movimentacao.id,
                    status="PENDENTE"
                )
                
                db.add(nfe)
                db.flush()  # Para obter o ID da NFP-e
                
                # Adiciona itens
                for idx, item_data in enumerate(movimentacao.itens, 1):
                    item = NFPeItem(
                        nfpe_id=nfe.id,
                        numero_item=idx,
                        codigo_produto=item_data["produto"],
                        descricao=item_data["descricao"],
                        ncm=item_data["ncm"],
                        cfop=item_data["cfop"],
                        unidade=item_data["unidade"],
                        quantidade=item_data["quantidade"],
                        valor_unitario=item_data["preco_unitario"],
                        valor_total=item_data["valor_total"],
                        valor_desconto=item_data["valor_desconto"],
                        icms_cst=item_data.get("cst_icms"),
                        icms_aliquota=item_data.get("aliquota_icms", 0),
                        icms_valor=item_data.get("valor_icms", 0),
                        icms_base_calculo=item_data.get("base_icms", 0),
                        pis_cst=item_data.get("cst_pis"),
                        pis_aliquota=item_data.get("aliquota_pis", 0),
                        pis_valor=item_data.get("valor_pis", 0),
                        cofins_cst=item_data.get("cst_cofins"),
                        cofins_aliquota=item_data.get("aliquota_cofins", 0),
                        cofins_valor=item_data.get("valor_cofins", 0),
                        lote=item_data.get("lote"),
                        talhao_origem=item_data.get("talhao"),
                        safra=item_data.get("safra")
                    )
                    db.add(item)
                
                db.commit()
                
                logger.info(f"NFP-e criada: {nfe.numero_nfe}/{nfe.serie} para movimentação {movimentacao.id}")
                return True
                
        except Exception as e:
            logger.error(f"Erro ao processar movimentação {movimentacao.id}: {str(e)}")
            return False
    
    def _limpar_documento(self, documento: str) -> str:
        """Remove formatação de CPF/CNPJ"""
        return ''.join(filter(str.isdigit, documento))


# Instância global do serviço
totvs_service = TOTVSIntegrationService()