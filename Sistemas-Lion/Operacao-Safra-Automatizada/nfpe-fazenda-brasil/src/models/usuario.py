"""
Modelo de dados para Usuários
Sistema de autenticação e autorização
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Index, UniqueConstraint, Table, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from passlib.context import CryptContext

from ..core.database import Base

# Context para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tabela de associação para relacionamento many-to-many
usuario_fazenda_table = Table(
    'usuario_fazenda',
    Base.metadata,
    Column('usuario_id', Integer, ForeignKey('usuario.id'), primary_key=True),
    Column('fazenda_id', Integer, ForeignKey('fazenda.id'), primary_key=True),
    Column('role', String(20), default='VIEWER'),  # ADMIN, EDITOR, VIEWER
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)


class Usuario(Base):
    """Usuários do sistema"""
    __tablename__ = "usuario"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificação
    email = Column(String(80), unique=True, nullable=False, index=True)
    nome_completo = Column(String(100), nullable=False)
    cpf = Column(String(11), unique=True, nullable=True, index=True)
    
    # Autenticação
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Perfil
    telefone = Column(String(15), nullable=True)
    cargo = Column(String(50), nullable=True)
    departamento = Column(String(50), nullable=True)
    
    # Datas de controle
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Configurações do usuário
    timezone = Column(String(50), default="America/Cuiaba")
    language = Column(String(5), default="pt-BR")
    
    # Relacionamentos
    fazendas = relationship(
        "Fazenda", 
        secondary=usuario_fazenda_table, 
        back_populates="usuarios"
    )
    tokens = relationship("TokenAccess", back_populates="usuario", cascade="all, delete-orphan")
    log_acessos = relationship("LogAcesso", back_populates="usuario", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Usuario {self.email}>"
    
    def set_password(self, password: str):
        """Define senha com hash"""
        self.password_hash = pwd_context.hash(password)
        self.password_changed_at = func.now()
    
    def verify_password(self, password: str) -> bool:
        """Verifica senha"""
        return pwd_context.verify(password, self.password_hash)
    
    @property
    def is_password_expired(self) -> bool:
        """Verifica se a senha está expirada (90 dias)"""
        if not self.password_changed_at:
            return True
        
        from datetime import datetime, timedelta
        expiry = self.password_changed_at + timedelta(days=90)
        return datetime.utcnow() > expiry


class UsuarioFazenda(Base):
    """Relacionamento usuário-fazenda com permissões específicas"""
    __tablename__ = "usuario_fazenda"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    fazenda_id = Column(Integer, ForeignKey("fazenda.id"), nullable=False)
    
    # Permissões
    role = Column(String(20), default="VIEWER", nullable=False)
    
    # Permissões específicas
    pode_emitir_nfe = Column(Boolean, default=False)
    pode_cancelar_nfe = Column(Boolean, default=False)
    pode_consultar_nfe = Column(Boolean, default=True)
    pode_gerenciar_produtos = Column(Boolean, default=False)
    pode_configurar_sistema = Column(Boolean, default=False)
    
    # Dados de controle
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    
    # Relacionamentos
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    fazenda = relationship("Fazenda")
    criado_por = relationship("Usuario", foreign_keys=[created_by])
    
    __table_args__ = (
        UniqueConstraint("usuario_id", "fazenda_id", name="uq_usuario_fazenda"),
        Index("idx_usuario_fazenda_role", "fazenda_id", "role"),
    )
    
    def __repr__(self):
        return f"<UsuarioFazenda {self.usuario_id}-{self.fazenda_id} ({self.role})>"


class TokenAccess(Base):
    """Tokens de acesso JWT"""
    __tablename__ = "token_access"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    token_type = Column(String(20), default="access", nullable=False)  # access, refresh
    
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Dados do acesso
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    is_revoked = Column(Boolean, default=False)
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="tokens")
    
    __table_args__ = (
        Index("idx_token_usuario_type", "usuario_id", "token_type"),
        Index("idx_token_expires", "expires_at"),
    )
    
    def __repr__(self):
        return f"<TokenAccess {self.token_type} - Usuario {self.usuario_id}>"


class LogAcesso(Base):
    """Log de acessos ao sistema"""
    __tablename__ = "log_acesso"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)
    
    # Dados do acesso
    acao = Column(String(50), nullable=False)  # LOGIN, LOGOUT, NFE_EMITIDA, etc
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=True)
    
    # Dados adicionais
    fazenda_id = Column(Integer, ForeignKey("fazenda.id"), nullable=True)
    nfpe_id = Column(Integer, ForeignKey("nfpe.id"), nullable=True)
    detalhes = Column(Text, nullable=True)  # JSON com detalhes da ação
    
    # Status
    sucesso = Column(Boolean, default=True)
    erro_mensagem = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="log_acessos")
    
    __table_args__ = (
        Index("idx_log_usuario_timestamp", "usuario_id", "timestamp"),
        Index("idx_log_acao_timestamp", "acao", "timestamp"),
    )
    
    def __repr__(self):
        return f"<LogAcesso {self.acao} - Usuario {self.usuario_id}>"