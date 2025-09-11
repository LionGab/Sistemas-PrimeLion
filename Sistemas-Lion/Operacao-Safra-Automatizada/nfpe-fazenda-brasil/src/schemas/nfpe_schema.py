"""
Schemas Pydantic para NFP-e
Validação de dados de entrada e saída da API
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import re


class NFPeItemCreate(BaseModel):
    """Schema para criação de item da NFP-e"""
    numero_item: int = Field(..., ge=1, description="Número sequencial do item")
    produto_id: Optional[int] = Field(None, description="ID do produto cadastrado")
    codigo_produto: str = Field(..., max_length=60, description="Código do produto")
    descricao: str = Field(..., max_length=120, description="Descrição do produto")
    ncm: str = Field(..., regex="^[0-9]{8}$", description="NCM (8 dígitos)")
    cfop: str = Field(..., regex="^[0-9]{4}$", description="CFOP (4 dígitos)")
    unidade: str = Field(..., max_length=6, description="Unidade de medida")
    
    # Quantidades e valores
    quantidade: Decimal = Field(..., gt=0, max_digits=15, decimal_places=4)
    valor_unitario: Decimal = Field(..., gt=0, max_digits=21, decimal_places=10)
    valor_total: Decimal = Field(..., gt=0, max_digits=15, decimal_places=2)
    valor_desconto: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_frete: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_seguro: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_outros: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    
    # Impostos
    icms_cst: Optional[str] = Field(None, max_length=3, description="CST do ICMS")
    icms_aliquota: Decimal = Field(0, ge=0, le=100, max_digits=5, decimal_places=2)
    icms_valor: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    icms_base_calculo: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    
    pis_cst: Optional[str] = Field(None, max_length=2, description="CST do PIS")
    pis_aliquota: Decimal = Field(0, ge=0, le=100, max_digits=5, decimal_places=2)
    pis_valor: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    
    cofins_cst: Optional[str] = Field(None, max_length=2, description="CST do COFINS")
    cofins_aliquota: Decimal = Field(0, ge=0, le=100, max_digits=5, decimal_places=2)
    cofins_valor: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    
    # Informações adicionais
    informacoes_adicionais: Optional[str] = Field(None, description="Informações adicionais do item")
    
    # Rastreabilidade agro
    lote: Optional[str] = Field(None, max_length=20, description="Lote do produto")
    talhao_origem: Optional[str] = Field(None, max_length=50, description="Talhão de origem")
    safra: Optional[str] = Field(None, max_length=10, description="Safra (ex: 2024/2025)")

    @validator('valor_total')
    def validar_valor_total(cls, v, values):
        """Valida se valor total condiz com quantidade * valor unitário"""
        if 'quantidade' in values and 'valor_unitario' in values:
            calculado = values['quantidade'] * values['valor_unitario']
            if abs(calculado - v) > Decimal('0.01'):  # Tolerância de 1 centavo
                raise ValueError('Valor total deve ser quantidade × valor unitário')
        return v


class NFPeCreate(BaseModel):
    """Schema para criação de NFP-e"""
    fazenda_id: int = Field(..., description="ID da fazenda emitente")
    serie: Optional[int] = Field(1, ge=1, le=999, description="Série da NFP-e")
    
    # Operação
    tipo_operacao: int = Field(..., ge=0, le=1, description="0=Entrada, 1=Saída")
    natureza_operacao: str = Field(..., max_length=60, description="Natureza da operação")
    cfop: str = Field(..., regex="^[0-9]{4}$", description="CFOP principal")
    finalidade: int = Field(1, ge=1, le=4, description="1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução")
    indicador_presenca: int = Field(0, ge=0, le=9, description="Indicador de presença do comprador")
    
    # Datas
    data_emissao: Optional[datetime] = Field(None, description="Data de emissão (default: agora)")
    data_saida: Optional[datetime] = Field(None, description="Data de saída/entrada")
    
    # Destinatário
    destinatario_tipo: str = Field(..., regex="^(CPF|CNPJ)$", description="Tipo do documento")
    destinatario_documento: str = Field(..., description="CPF ou CNPJ (apenas números)")
    destinatario_nome: str = Field(..., max_length=60, description="Nome/Razão social")
    destinatario_ie: Optional[str] = Field(None, max_length=14, description="Inscrição Estadual")
    destinatario_endereco: Dict[str, Any] = Field(..., description="Endereço completo do destinatário")
    
    # Valores totais
    valor_total_produtos: Decimal = Field(..., gt=0, max_digits=15, decimal_places=2)
    valor_total_frete: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_total_seguro: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_total_desconto: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_total_outros: Decimal = Field(0, ge=0, max_digits=15, decimal_places=2)
    valor_total_nfe: Decimal = Field(..., gt=0, max_digits=15, decimal_places=2)
    
    # Transporte
    modalidade_frete: int = Field(0, ge=0, le=9, description="Modalidade do frete")
    transportador_documento: Optional[str] = Field(None, description="CPF/CNPJ transportador")
    transportador_nome: Optional[str] = Field(None, max_length=60)
    veiculo_placa: Optional[str] = Field(None, max_length=8)
    veiculo_uf: Optional[str] = Field(None, max_length=2)
    
    # Informações adicionais
    informacoes_complementares: Optional[str] = Field(None, description="Informações complementares")
    informacoes_fisco: Optional[str] = Field(None, description="Informações adicionais de interesse do Fisco")
    
    # Itens da NFP-e
    itens: List[NFPeItemCreate] = Field(..., min_items=1, description="Itens da NFP-e")

    @validator('destinatario_documento')
    def validar_documento(cls, v, values):
        """Valida CPF/CNPJ do destinatário"""
        if not v.isdigit():
            raise ValueError('Documento deve conter apenas números')
        
        if 'destinatario_tipo' in values:
            if values['destinatario_tipo'] == 'CPF' and len(v) != 11:
                raise ValueError('CPF deve ter 11 dígitos')
            elif values['destinatario_tipo'] == 'CNPJ' and len(v) != 14:
                raise ValueError('CNPJ deve ter 14 dígitos')
        
        return v

    @validator('valor_total_nfe')
    def validar_valor_total_nfe(cls, v, values):
        """Valida valor total da NFP-e"""
        if all(k in values for k in ['valor_total_produtos', 'valor_total_frete', 
                                     'valor_total_seguro', 'valor_total_desconto', 'valor_total_outros']):
            calculado = (
                values['valor_total_produtos'] +
                values['valor_total_frete'] +
                values['valor_total_seguro'] +
                values['valor_total_outros'] -
                values['valor_total_desconto']
            )
            if abs(calculado - v) > Decimal('0.01'):
                raise ValueError('Valor total da NFP-e não confere com a soma dos valores')
        return v

    @validator('destinatario_endereco')
    def validar_endereco(cls, v):
        """Valida estrutura do endereço"""
        campos_obrigatorios = ['logradouro', 'numero', 'bairro', 'municipio', 'uf', 'cep', 'codigo_municipio']
        
        for campo in campos_obrigatorios:
            if campo not in v or not v[campo]:
                raise ValueError(f'Campo obrigatório no endereço: {campo}')
        
        # Valida UF
        if not re.match(r'^[A-Z]{2}$', v['uf']):
            raise ValueError('UF deve ter 2 letras maiúsculas')
        
        # Valida CEP
        if not re.match(r'^[0-9]{8}$', str(v['cep']).replace('-', '').replace('.', '')):
            raise ValueError('CEP deve ter 8 dígitos')
        
        # Valida código do município
        if not re.match(r'^[0-9]{7}$', str(v['codigo_municipio'])):
            raise ValueError('Código do município deve ter 7 dígitos')
        
        return v


class NFPeItemResponse(BaseModel):
    """Schema de resposta para item da NFP-e"""
    id: int
    numero_item: int
    codigo_produto: str
    descricao: str
    ncm: str
    cfop: str
    unidade: str
    quantidade: Decimal
    valor_unitario: Decimal
    valor_total: Decimal
    valor_desconto: Decimal
    valor_frete: Decimal
    valor_seguro: Decimal
    valor_outros: Decimal
    
    # Impostos
    icms_cst: Optional[str]
    icms_aliquota: Decimal
    icms_valor: Decimal
    icms_base_calculo: Decimal
    pis_cst: Optional[str]
    pis_aliquota: Decimal
    pis_valor: Decimal
    cofins_cst: Optional[str]
    cofins_aliquota: Decimal
    cofins_valor: Decimal
    
    # Rastreabilidade
    lote: Optional[str]
    talhao_origem: Optional[str]
    safra: Optional[str]
    
    class Config:
        orm_mode = True


class NFPeResponse(BaseModel):
    """Schema de resposta para NFP-e"""
    id: int
    chave_acesso: Optional[str]
    numero_nfe: int
    serie: int
    modelo: str
    
    # Datas
    data_emissao: datetime
    data_saida: Optional[datetime]
    data_autorizacao: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Operação
    tipo_operacao: int
    natureza_operacao: str
    cfop: str
    finalidade: int
    indicador_presenca: int
    
    # Fazenda
    fazenda_id: int
    
    # Destinatário
    destinatario_tipo: str
    destinatario_documento: str
    destinatario_nome: str
    destinatario_ie: Optional[str]
    destinatario_endereco: Dict[str, Any]
    
    # Valores
    valor_total_produtos: Decimal
    valor_total_frete: Decimal
    valor_total_seguro: Decimal
    valor_total_desconto: Decimal
    valor_total_outros: Decimal
    valor_total_nfe: Decimal
    
    # Impostos totais
    valor_total_icms: Decimal
    valor_total_ipi: Decimal
    valor_total_pis: Decimal
    valor_total_cofins: Decimal
    
    # Transporte
    modalidade_frete: int
    transportador_documento: Optional[str]
    transportador_nome: Optional[str]
    veiculo_placa: Optional[str]
    veiculo_uf: Optional[str]
    
    # Status
    status: str
    protocolo_autorizacao: Optional[str]
    digest_value: Optional[str]
    mensagem_sefaz: Optional[str]
    codigo_retorno_sefaz: Optional[str]
    
    # TOTVS
    totvs_id: Optional[str]
    totvs_sync_at: Optional[datetime]
    totvs_sync_status: Optional[str]
    
    # Informações adicionais
    informacoes_complementares: Optional[str]
    informacoes_fisco: Optional[str]
    
    # Relacionamentos
    itens: List[NFPeItemResponse] = []
    
    class Config:
        orm_mode = True


class NFPeListResponse(BaseModel):
    """Schema de resposta para lista de NFP-e"""
    items: List[NFPeResponse]
    total: int
    skip: int
    limit: int


class NFPeStatus(BaseModel):
    """Schema para consulta de status da NFP-e"""
    id: int
    numero_nfe: int
    serie: int
    status: str
    chave_acesso: Optional[str]
    protocolo_autorizacao: Optional[str]
    data_emissao: datetime
    data_autorizacao: Optional[datetime]
    mensagem_sefaz: Optional[str]
    codigo_retorno_sefaz: Optional[str]
    status_sefaz: Optional[Dict[str, Any]] = None


class NFPeTransmitir(BaseModel):
    """Schema para transmissão de NFP-e"""
    forcar_retransmissao: bool = Field(False, description="Forçar retransmissão mesmo se já processada")


class NFPeCancelar(BaseModel):
    """Schema para cancelamento de NFP-e"""
    justificativa: str = Field(..., min_length=15, max_length=255, description="Justificativa do cancelamento")

    @validator('justificativa')
    def validar_justificativa(cls, v):
        """Valida justificativa do cancelamento"""
        v = v.strip()
        if len(v) < 15:
            raise ValueError('Justificativa deve ter pelo menos 15 caracteres')
        
        # Remove caracteres especiais problemáticos
        caracteres_invalidos = ['<', '>', '&', '"', "'"]
        for char in caracteres_invalidos:
            if char in v:
                raise ValueError(f'Justificativa não pode conter o caractere: {char}')
        
        return v


class NFPeEstatisticas(BaseModel):
    """Schema para estatísticas de NFP-e"""
    total_nfpe: int
    por_status: Dict[str, int]
    valor_total_periodo: Decimal
    media_processamento_segundos: Optional[float]
    taxa_sucesso_percent: float
    periodo_inicio: datetime
    periodo_fim: datetime


class NFPeRelatorio(BaseModel):
    """Schema para relatórios de NFP-e"""
    fazenda_id: int
    periodo_inicio: datetime
    periodo_fim: datetime
    total_nfpe_emitidas: int
    total_nfpe_autorizadas: int
    total_nfpe_rejeitadas: int
    valor_total_faturado: Decimal
    produtos_mais_vendidos: List[Dict[str, Any]]
    destinos_principais: List[Dict[str, Any]]