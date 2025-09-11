"""
API de Integração TOTVS
Sincronização e gestão de dados do TOTVS Protheus Agro
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..core.database import get_db
from ..models import Fazenda, Produto
from ..services.totvs_integration import totvs_service
from .auth import get_current_user_dependency

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status", response_model=Dict[str, Any])
async def status_totvs():
    """
    Verifica status da integração TOTVS
    
    Testa conectividade e retorna informações da API
    """
    try:
        conectado = await totvs_service.test_connection()
        
        return {
            "status": "online" if conectado else "offline",
            "timestamp": datetime.now(),
            "url_base": totvs_service.base_url,
            "company_id": totvs_service.company_id,
            "branch_id": totvs_service.branch_id,
            "timeout": totvs_service.timeout
        }
        
    except Exception as e:
        logger.error(f"Erro ao verificar status TOTVS: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao verificar TOTVS"
        )


@router.post("/sincronizar-produtos/{fazenda_id}", response_model=Dict[str, Any])
async def sincronizar_produtos(
    fazenda_id: int,
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Forçar sincronização completa"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Sincroniza produtos do TOTVS com a fazenda
    
    Atualiza cadastro de produtos para geração de NFP-e
    """
    try:
        # Verifica se fazenda existe
        fazenda = db.query(Fazenda).filter(Fazenda.id == fazenda_id).first()
        if not fazenda:
            raise HTTPException(
                status_code=404,
                detail="Fazenda não encontrada"
            )
        
        # Agenda sincronização em background
        background_tasks.add_task(
            sincronizar_produtos_async,
            fazenda_id,
            force
        )
        
        return {
            "message": "Sincronização iniciada",
            "fazenda_id": fazenda_id,
            "force": force,
            "timestamp": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao iniciar sincronização produtos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na sincronização"
        )


@router.get("/movimentacoes-pendentes", response_model=Dict[str, Any])
async def buscar_movimentacoes_pendentes(
    data_inicio: Optional[datetime] = Query(None, description="Data início (default: 7 dias atrás)"),
    data_fim: Optional[datetime] = Query(None, description="Data fim (default: hoje)"),
    tipos_operacao: str = Query("VENDA,TRANSFERENCIA", description="Tipos separados por vírgula"),
    current_user = Depends(get_current_user_dependency)
):
    """
    Busca movimentações pendentes de NFP-e no TOTVS
    
    Retorna movimentações que precisam gerar NFP-e
    """
    try:
        # Define período padrão
        if not data_inicio:
            data_inicio = datetime.now() - timedelta(days=7)
        if not data_fim:
            data_fim = datetime.now()
        
        # Converte tipos para lista
        tipos_lista = [t.strip() for t in tipos_operacao.split(",")]
        
        # Busca movimentações
        movimentacoes = await totvs_service.buscar_movimentacoes_pendentes(
            data_inicio=data_inicio,
            data_fim=data_fim,
            tipos_operacao=tipos_lista
        )
        
        # Converte para dicionário para resposta
        movimentacoes_dict = []
        for mov in movimentacoes:
            movimentacoes_dict.append({
                "id": mov.id,
                "filial": mov.filial,
                "documento": mov.documento,
                "serie": mov.serie,
                "data_emissao": mov.data_emissao,
                "data_saida": mov.data_saida,
                "cliente_fornecedor": mov.cliente_fornecedor,
                "nome": mov.nome,
                "cnpj_cpf": mov.cnpj_cpf,
                "valor_total": float(mov.valor_total),
                "valor_produtos": float(mov.valor_produtos),
                "cfop": mov.cfop,
                "natureza_operacao": mov.natureza_operacao,
                "status": mov.status,
                "total_itens": len(mov.itens)
            })
        
        return {
            "total_encontradas": len(movimentacoes_dict),
            "periodo": {
                "inicio": data_inicio,
                "fim": data_fim
            },
            "tipos_operacao": tipos_lista,
            "movimentacoes": movimentacoes_dict
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar movimentações TOTVS: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao buscar movimentações"
        )


@router.get("/movimentacao/{movimentacao_id}", response_model=Dict[str, Any])
async def obter_movimentacao(
    movimentacao_id: str,
    current_user = Depends(get_current_user_dependency)
):
    """
    Obtém detalhes completos de uma movimentação TOTVS
    
    Inclui todos os itens e dados fiscais
    """
    try:
        movimentacao = await totvs_service.buscar_detalhes_movimentacao(movimentacao_id)
        
        if not movimentacao:
            raise HTTPException(
                status_code=404,
                detail="Movimentação não encontrada"
            )
        
        # Converte para dicionário
        return {
            "id": movimentacao.id,
            "filial": movimentacao.filial,
            "documento": movimentacao.documento,
            "serie": movimentacao.serie,
            "data_emissao": movimentacao.data_emissao,
            "data_saida": movimentacao.data_saida,
            "cliente_fornecedor": movimentacao.cliente_fornecedor,
            "loja": movimentacao.loja,
            "nome": movimentacao.nome,
            "cnpj_cpf": movimentacao.cnpj_cpf,
            "inscricao_estadual": movimentacao.inscricao_estadual,
            "endereco": movimentacao.endereco,
            "valor_total": float(movimentacao.valor_total),
            "valor_produtos": float(movimentacao.valor_produtos),
            "valor_frete": float(movimentacao.valor_frete),
            "valor_desconto": float(movimentacao.valor_desconto),
            "modalidade_frete": movimentacao.modalidade_frete,
            "transportador": movimentacao.transportador,
            "tes": movimentacao.tes,
            "cfop": movimentacao.cfop,
            "natureza_operacao": movimentacao.natureza_operacao,
            "status": movimentacao.status,
            "itens": [
                {
                    "item": item["item"],
                    "produto": item["produto"],
                    "descricao": item["descricao"],
                    "ncm": item["ncm"],
                    "cfop": item["cfop"],
                    "unidade": item["unidade"],
                    "quantidade": float(item["quantidade"]),
                    "preco_unitario": float(item["preco_unitario"]),
                    "valor_total": float(item["valor_total"]),
                    "valor_desconto": float(item["valor_desconto"]),
                    "icms": {
                        "cst": item.get("cst_icms"),
                        "aliquota": float(item.get("aliquota_icms", 0)),
                        "valor": float(item.get("valor_icms", 0)),
                        "base": float(item.get("base_icms", 0))
                    },
                    "pis": {
                        "cst": item.get("cst_pis"),
                        "aliquota": float(item.get("aliquota_pis", 0)),
                        "valor": float(item.get("valor_pis", 0))
                    },
                    "cofins": {
                        "cst": item.get("cst_cofins"),
                        "aliquota": float(item.get("aliquota_cofins", 0)),
                        "valor": float(item.get("valor_cofins", 0))
                    },
                    "lote": item.get("lote"),
                    "talhao": item.get("talhao"),
                    "safra": item.get("safra")
                }
                for item in movimentacao.itens
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter movimentação {movimentacao_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao obter movimentação"
        )


@router.post("/processar-automatico", response_model=Dict[str, Any])
async def processar_movimentacoes_automatico(
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user_dependency)
):
    """
    Processa automaticamente movimentações TOTVS
    
    Cria NFP-e para movimentações elegíveis dos últimos 7 dias
    """
    try:
        # Agenda processamento em background
        background_tasks.add_task(processar_movimentacoes_async)
        
        return {
            "message": "Processamento automático iniciado",
            "timestamp": datetime.now(),
            "periodo": "Últimos 7 dias"
        }
        
    except Exception as e:
        logger.error(f"Erro ao iniciar processamento automático: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno no processamento"
        )


@router.put("/movimentacao/{movimentacao_id}/status", response_model=Dict[str, Any])
async def atualizar_status_movimentacao(
    movimentacao_id: str,
    status: str = Query(..., description="Novo status"),
    chave_nfe: Optional[str] = Query(None, description="Chave da NFe"),
    numero_nfe: Optional[int] = Query(None, description="Número da NFe"),
    serie_nfe: Optional[int] = Query(None, description="Série da NFe"),
    current_user = Depends(get_current_user_dependency)
):
    """
    Atualiza status de movimentação no TOTVS
    
    Usado após processamento de NFP-e
    """
    try:
        sucesso = await totvs_service.atualizar_status_movimentacao(
            movimentacao_id=movimentacao_id,
            status=status,
            chave_nfe=chave_nfe,
            numero_nfe=numero_nfe,
            serie_nfe=serie_nfe
        )
        
        if not sucesso:
            raise HTTPException(
                status_code=400,
                detail="Falha ao atualizar status no TOTVS"
            )
        
        return {
            "message": "Status atualizado com sucesso",
            "movimentacao_id": movimentacao_id,
            "novo_status": status,
            "chave_nfe": chave_nfe,
            "timestamp": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar status movimentação {movimentacao_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na atualização"
        )


@router.get("/produtos-fazenda/{fazenda_id}", response_model=List[Dict[str, Any]])
async def listar_produtos_fazenda(
    fazenda_id: int,
    ativo: bool = Query(True, description="Filtrar produtos ativos"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Lista produtos sincronizados da fazenda
    
    Mostra produtos disponíveis para NFP-e
    """
    try:
        # Verifica se fazenda existe
        fazenda = db.query(Fazenda).filter(Fazenda.id == fazenda_id).first()
        if not fazenda:
            raise HTTPException(
                status_code=404,
                detail="Fazenda não encontrada"
            )
        
        # Busca produtos
        query = db.query(Produto).filter(Produto.fazenda_id == fazenda_id)
        
        if ativo:
            query = query.filter(Produto.ativo == True)
        
        produtos = query.order_by(Produto.descricao).offset(skip).limit(limit).all()
        
        # Converte para resposta
        produtos_lista = []
        for produto in produtos:
            produtos_lista.append({
                "id": produto.id,
                "codigo_interno": produto.codigo_interno,
                "codigo_totvs": produto.codigo_totvs,
                "descricao": produto.descricao,
                "ncm": produto.ncm,
                "cfop_padrao": produto.cfop_padrao,
                "unidade_medida": produto.unidade_medida,
                "tipo_produto": produto.tipo_produto,
                "categoria": produto.categoria,
                "valor_unitario_padrao": float(produto.valor_unitario_padrao) if produto.valor_unitario_padrao else None,
                "ativo": produto.ativo,
                "created_at": produto.created_at,
                "updated_at": produto.updated_at
            })
        
        return produtos_lista
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao listar produtos da fazenda {fazenda_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao listar produtos"
        )


# Funções auxiliares para processamento em background

async def sincronizar_produtos_async(fazenda_id: int, force: bool = False):
    """Sincroniza produtos em background"""
    try:
        total_sincronizados = await totvs_service.sincronizar_produtos(fazenda_id)
        logger.info(f"Sincronizados {total_sincronizados} produtos para fazenda {fazenda_id}")
    except Exception as e:
        logger.error(f"Erro na sincronização de produtos fazenda {fazenda_id}: {str(e)}")


async def processar_movimentacoes_async():
    """Processa movimentações em background"""
    try:
        stats = await totvs_service.processar_movimentacoes_automaticas()
        logger.info(f"Processamento automático concluído: {stats}")
    except Exception as e:
        logger.error(f"Erro no processamento automático: {str(e)}")