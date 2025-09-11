"""
Modelos de dados para NFP-e (Nota Fiscal do Produtor Eletrônica)
Conformidade com SEFAZ-MT versão 4.00
"""
from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, Text, Boolean,
    ForeignKey, Index, UniqueConstraint, CheckConstraint, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from ..core.database import Base


class NFPe(Base):
    """Modelo principal da Nota Fiscal do Produtor Eletrônica"""
    __tablename__ = "nfpe"
    
    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    chave_acesso = Column(String(44), unique=True, nullable=True, index=True)
    numero_nfe = Column(Integer, nullable=False)
    serie = Column(Integer, default=1, nullable=False)
    modelo = Column(String(2), default="55", nullable=False)
    
    # Datas e controle
    data_emissao = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    data_saida = Column(DateTime(timezone=True), nullable=True)
    data_autorizacao = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Informações da operação
    tipo_operacao = Column(Integer, nullable=False)  # 0=Entrada, 1=Saída
    tipo_emissao = Column(Integer, default=1, nullable=False)  # 1=Normal
    finalidade = Column(Integer, default=1, nullable=False)  # 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
    natureza_operacao = Column(String(60), nullable=False)
    
    # CFOP e tributação
    cfop = Column(String(4), nullable=False, index=True)
    indicador_presenca = Column(Integer, default=0)  # 0=Não se aplica
    
    # Emitente (Fazenda)
    fazenda_id = Column(Integer, ForeignKey("fazenda.id"), nullable=False)
    
    # Destinatário
    destinatario_tipo = Column(String(10), nullable=False)  # CPF ou CNPJ
    destinatario_documento = Column(String(14), nullable=False)
    destinatario_nome = Column(String(60), nullable=False)
    destinatario_ie = Column(String(14), nullable=True)
    destinatario_endereco = Column(JSON, nullable=False)  # JSON com dados completos do endereço
    
    # Valores totais
    valor_total_produtos = Column(Numeric(15, 2), nullable=False)
    valor_total_frete = Column(Numeric(15, 2), default=0)
    valor_total_seguro = Column(Numeric(15, 2), default=0)
    valor_total_desconto = Column(Numeric(15, 2), default=0)
    valor_total_outros = Column(Numeric(15, 2), default=0)
    valor_total_nfe = Column(Numeric(15, 2), nullable=False)
    
    # Impostos totais
    valor_total_icms = Column(Numeric(15, 2), default=0)
    valor_total_ipi = Column(Numeric(15, 2), default=0)
    valor_total_pis = Column(Numeric(15, 2), default=0)
    valor_total_cofins = Column(Numeric(15, 2), default=0)
    
    # Transporte
    modalidade_frete = Column(Integer, default=0)  # 0=Emitente, 1=Destinatário
    transportador_documento = Column(String(14), nullable=True)
    transportador_nome = Column(String(60), nullable=True)
    veiculo_placa = Column(String(8), nullable=True)
    veiculo_uf = Column(String(2), nullable=True)
    
    # Status e processamento
    status = Column(String(20), default="PENDENTE", nullable=False, index=True)
    protocolo_autorizacao = Column(String(15), nullable=True)
    digest_value = Column(String(255), nullable=True)
    
    # XML e mensagens
    xml_nfe = Column(Text, nullable=True)  # XML completo da NFe
    xml_protocolo = Column(Text, nullable=True)  # XML do protocolo de autorização
    mensagem_sefaz = Column(Text, nullable=True)  # Mensagens de retorno da SEFAZ
    codigo_retorno_sefaz = Column(String(3), nullable=True)
    
    # Integração TOTVS
    totvs_id = Column(String(50), nullable=True, index=True)
    totvs_sync_at = Column(DateTime(timezone=True), nullable=True)
    totvs_sync_status = Column(String(20), nullable=True)
    
    # Informações adicionais
    informacoes_complementares = Column(Text, nullable=True)
    informacoes_fisco = Column(Text, nullable=True)
    
    # Relacionamentos
    fazenda = relationship("Fazenda", back_populates="nfpes")
    itens = relationship("NFPeItem", back_populates="nfpe", cascade="all, delete-orphan")
    eventos = relationship("NFPeEvento", back_populates="nfpe", cascade="all, delete-orphan")
    
    # Índices compostos
    __table_args__ = (
        Index("idx_nfpe_fazenda_data", "fazenda_id", "data_emissao"),
        Index("idx_nfpe_status_fazenda", "status", "fazenda_id"),
        Index("idx_nfpe_numero_serie", "numero_nfe", "serie"),
        CheckConstraint("tipo_operacao IN (0, 1)", name="ck_tipo_operacao"),
        CheckConstraint("status IN ('PENDENTE', 'PROCESSANDO', 'AUTORIZADA', 'REJEITADA', 'CANCELADA', 'INUTILIZADA', 'ERRO')", 
                       name="ck_status"),
    )
    
    def __repr__(self):
        return f"<NFPe {self.numero_nfe}/{self.serie} - {self.status}>"


class NFPeItem(Base):
    """Itens da NFP-e"""
    __tablename__ = "nfpe_item"
    
    id = Column(Integer, primary_key=True, index=True)
    nfpe_id = Column(Integer, ForeignKey("nfpe.id"), nullable=False)
    numero_item = Column(Integer, nullable=False)
    
    # Produto
    produto_id = Column(Integer, ForeignKey("produto.id"), nullable=False)
    codigo_produto = Column(String(60), nullable=False)
    descricao = Column(String(120), nullable=False)
    ncm = Column(String(8), nullable=False)
    cfop = Column(String(4), nullable=False)
    unidade = Column(String(6), nullable=False)
    
    # Quantidades e valores
    quantidade = Column(Numeric(15, 4), nullable=False)
    valor_unitario = Column(Numeric(21, 10), nullable=False)
    valor_total = Column(Numeric(15, 2), nullable=False)
    valor_desconto = Column(Numeric(15, 2), default=0)
    valor_frete = Column(Numeric(15, 2), default=0)
    valor_seguro = Column(Numeric(15, 2), default=0)
    valor_outros = Column(Numeric(15, 2), default=0)
    
    # Impostos
    icms_cst = Column(String(3), nullable=True)
    icms_aliquota = Column(Numeric(5, 2), default=0)
    icms_valor = Column(Numeric(15, 2), default=0)
    icms_base_calculo = Column(Numeric(15, 2), default=0)
    
    pis_cst = Column(String(2), nullable=True)
    pis_aliquota = Column(Numeric(5, 2), default=0)
    pis_valor = Column(Numeric(15, 2), default=0)
    
    cofins_cst = Column(String(2), nullable=True)
    cofins_aliquota = Column(Numeric(5, 2), default=0)
    cofins_valor = Column(Numeric(15, 2), default=0)
    
    # Informações adicionais do item
    informacoes_adicionais = Column(Text, nullable=True)
    
    # Rastreabilidade agro
    lote = Column(String(20), nullable=True)
    data_validade = Column(DateTime, nullable=True)
    talhao_origem = Column(String(50), nullable=True)
    safra = Column(String(10), nullable=True)  # Ex: "2024/2025"
    
    # Relacionamentos
    nfpe = relationship("NFPe", back_populates="itens")
    produto = relationship("Produto")
    
    __table_args__ = (
        UniqueConstraint("nfpe_id", "numero_item", name="uq_nfpe_item"),
        Index("idx_item_produto", "produto_id"),
    )
    
    def __repr__(self):
        return f"<NFPeItem {self.numero_item}: {self.descricao}>"


class NFPeEvento(Base):
    """Eventos da NFP-e (cancelamento, carta correção, etc)"""
    __tablename__ = "nfpe_evento"
    
    id = Column(Integer, primary_key=True, index=True)
    nfpe_id = Column(Integer, ForeignKey("nfpe.id"), nullable=False)
    
    tipo_evento = Column(String(20), nullable=False)  # CANCELAMENTO, CARTA_CORRECAO, etc
    sequencia = Column(Integer, default=1, nullable=False)
    data_evento = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    justificativa = Column(Text, nullable=False)
    protocolo = Column(String(15), nullable=True)
    status = Column(String(20), default="PENDENTE", nullable=False)
    
    xml_evento = Column(Text, nullable=True)
    xml_retorno = Column(Text, nullable=True)
    
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    nfpe = relationship("NFPe", back_populates="eventos")
    usuario = relationship("Usuario")
    
    __table_args__ = (
        Index("idx_evento_nfpe_tipo", "nfpe_id", "tipo_evento"),
    )
    
    def __repr__(self):
        return f"<NFPeEvento {self.tipo_evento} - NFPe {self.nfpe_id}>"