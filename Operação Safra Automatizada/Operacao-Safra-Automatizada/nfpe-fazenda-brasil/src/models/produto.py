"""
Modelo de dados para Produtos Agrícolas
Cadastro de produtos para emissão de NFP-e
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Numeric, 
    ForeignKey, Index, UniqueConstraint, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Produto(Base):
    """Cadastro de produtos agrícolas"""
    __tablename__ = "produto"
    
    id = Column(Integer, primary_key=True, index=True)
    fazenda_id = Column(Integer, ForeignKey("fazenda.id"), nullable=False)
    
    # Identificação
    codigo_interno = Column(String(60), nullable=False)
    descricao = Column(String(120), nullable=False)
    descricao_complementar = Column(Text, nullable=True)
    
    # Classificação fiscal
    ncm = Column(String(8), nullable=False, index=True)
    cest = Column(String(7), nullable=True)
    cfop_padrao = Column(String(4), nullable=False)
    
    # Unidades de medida
    unidade_medida = Column(String(6), nullable=False)  # KG, TON, SC, etc
    peso_liquido = Column(Numeric(15, 4), nullable=True)  # Em KG
    peso_bruto = Column(Numeric(15, 4), nullable=True)  # Em KG
    
    # Tipo e categoria
    tipo_produto = Column(String(20), nullable=False)  # GRAO, FIBRA, SEMENTE, INSUMO
    categoria = Column(String(50), nullable=False)  # SOJA, MILHO, ALGODAO, etc
    
    # Valores padrão
    valor_unitario_padrao = Column(Numeric(21, 10), nullable=True)
    
    # Tributação padrão
    origem = Column(String(1), default="0")  # 0=Nacional
    cst_icms = Column(String(3), nullable=True)
    aliquota_icms = Column(Numeric(5, 2), default=0)
    reducao_base_icms = Column(Numeric(5, 2), default=0)
    
    cst_pis = Column(String(2), nullable=True)
    aliquota_pis = Column(Numeric(5, 2), default=0)
    
    cst_cofins = Column(String(2), nullable=True)
    aliquota_cofins = Column(Numeric(5, 2), default=0)
    
    # Rastreabilidade
    exige_lote = Column(Boolean, default=False)
    exige_validade = Column(Boolean, default=False)
    dias_validade_padrao = Column(Integer, nullable=True)
    
    # Informações agronômicas
    safra_padrao = Column(String(10), nullable=True)  # Ex: "2024/2025"
    variedade = Column(String(50), nullable=True)  # Variedade/cultivar
    classificacao = Column(String(20), nullable=True)  # Tipo 1, 2, etc
    
    # Integração TOTVS
    codigo_totvs = Column(String(30), nullable=True, index=True)
    grupo_totvs = Column(String(10), nullable=True)
    
    # Controle
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Observações
    observacoes = Column(Text, nullable=True)
    
    # Relacionamentos
    fazenda = relationship("Fazenda", back_populates="produtos")
    
    __table_args__ = (
        UniqueConstraint("fazenda_id", "codigo_interno", name="uq_produto_fazenda_codigo"),
        Index("idx_produto_tipo_categoria", "tipo_produto", "categoria"),
        Index("idx_produto_fazenda_ativo", "fazenda_id", "ativo"),
    )
    
    def __repr__(self):
        return f"<Produto {self.codigo_interno}: {self.descricao}>"
    
    @property
    def descricao_completa(self):
        """Retorna descrição completa do produto"""
        desc = self.descricao
        if self.variedade:
            desc += f" - {self.variedade}"
        if self.classificacao:
            desc += f" - {self.classificacao}"
        return desc


class ProdutoSafra(Base):
    """Controle de produtos por safra"""
    __tablename__ = "produto_safra"
    
    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produto.id"), nullable=False)
    
    safra = Column(String(10), nullable=False)  # Ex: "2024/2025"
    
    # Dados de produção
    area_plantada_hectares = Column(Numeric(10, 2), nullable=True)
    producao_estimada_kg = Column(Numeric(15, 2), nullable=True)
    producao_realizada_kg = Column(Numeric(15, 2), nullable=True)
    produtividade_kg_hectare = Column(Numeric(10, 2), nullable=True)
    
    # Custos e valores
    custo_producao_hectare = Column(Numeric(15, 2), nullable=True)
    preco_medio_venda = Column(Numeric(15, 2), nullable=True)
    
    # Datas
    data_plantio = Column(DateTime, nullable=True)
    data_colheita_inicio = Column(DateTime, nullable=True)
    data_colheita_fim = Column(DateTime, nullable=True)
    
    # Status
    status = Column(String(20), default="PLANEJADA")  # PLANEJADA, PLANTADA, COLHENDO, COLHIDA
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    produto = relationship("Produto")
    
    __table_args__ = (
        UniqueConstraint("produto_id", "safra", name="uq_produto_safra"),
        Index("idx_produto_safra_status", "safra", "status"),
    )
    
    def __repr__(self):
        return f"<ProdutoSafra {self.safra} - Produto {self.produto_id}>"