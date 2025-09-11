"""
Modelo de dados para Fazenda
Informações do produtor rural emitente da NFP-e
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Numeric, JSON, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Fazenda(Base):
    """Dados da fazenda/produtor rural"""
    __tablename__ = "fazenda"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificação fiscal
    cnpj = Column(String(14), unique=True, nullable=False, index=True)
    inscricao_estadual = Column(String(14), nullable=False)
    inscricao_municipal = Column(String(15), nullable=True)
    
    # Dados cadastrais
    razao_social = Column(String(150), nullable=False)
    nome_fantasia = Column(String(60), nullable=True)
    regime_tributario = Column(Integer, nullable=False)  # 1=Simples, 2=Simples Excesso, 3=Normal
    
    # Endereço
    logradouro = Column(String(60), nullable=False)
    numero = Column(String(60), nullable=False)
    complemento = Column(String(60), nullable=True)
    bairro = Column(String(60), nullable=False)
    codigo_municipio = Column(String(7), nullable=False)
    municipio = Column(String(60), nullable=False)
    uf = Column(String(2), nullable=False)
    cep = Column(String(8), nullable=False)
    codigo_pais = Column(String(4), default="1058")  # Brasil
    pais = Column(String(60), default="BRASIL")
    
    # Contato
    telefone = Column(String(14), nullable=True)
    email = Column(String(80), nullable=True)
    
    # Certificado digital
    certificado_path = Column(String(255), nullable=True)
    certificado_senha_hash = Column(String(255), nullable=True)  # Senha criptografada
    certificado_validade = Column(DateTime, nullable=True)
    certificado_tipo = Column(String(2), default="A1")  # A1 ou A3
    
    # Dados agronômicos
    area_total_hectares = Column(Numeric(10, 2), nullable=True)
    area_produtiva_hectares = Column(Numeric(10, 2), nullable=True)
    culturas_principais = Column(JSON, nullable=True)  # ["soja", "milho", "algodão"]
    
    # Coordenadas geográficas (para integração futura com mapas)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    
    # Integração TOTVS
    totvs_filial = Column(String(10), nullable=True)
    totvs_codigo_fornecedor = Column(String(20), nullable=True)
    totvs_loja = Column(String(10), nullable=True)
    
    # Configurações NFP-e
    serie_nfe_padrao = Column(Integer, default=1)
    ultimo_numero_nfe = Column(Integer, default=0)
    ambiente_nfe = Column(Integer, default=2)  # 1=Produção, 2=Homologação
    
    # Controle
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Dados bancários (para futura integração financeira)
    dados_bancarios = Column(JSON, nullable=True)
    
    # Observações e informações adicionais
    observacoes = Column(Text, nullable=True)
    
    # Relacionamentos
    nfpes = relationship("NFPe", back_populates="fazenda")
    produtos = relationship("Produto", back_populates="fazenda")
    usuarios = relationship("UsuarioFazenda", back_populates="fazenda")
    
    def __repr__(self):
        return f"<Fazenda {self.nome_fantasia or self.razao_social}>"
    
    @property
    def endereco_completo(self):
        """Retorna endereço formatado"""
        endereco = f"{self.logradouro}, {self.numero}"
        if self.complemento:
            endereco += f" - {self.complemento}"
        endereco += f" - {self.bairro}"
        endereco += f" - {self.municipio}/{self.uf}"
        endereco += f" - CEP: {self.cep[:5]}-{self.cep[5:]}"
        return endereco
    
    def proximo_numero_nfe(self):
        """Retorna o próximo número de NFP-e disponível"""
        self.ultimo_numero_nfe += 1
        return self.ultimo_numero_nfe