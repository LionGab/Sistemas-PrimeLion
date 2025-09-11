"""
Configurações centralizadas do sistema NFP-e
Fazenda Brasil - Campo Verde/MT
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações do sistema com validação Pydantic"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "NFP-e Automation - Fazenda Brasil"
    API_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    REDIS_SSL: bool = False
    
    # TOTVS Integration
    TOTVS_API_URL: str
    TOTVS_API_KEY: str
    TOTVS_API_SECRET: str
    TOTVS_COMPANY_ID: str = "01"
    TOTVS_BRANCH_ID: str = "01"
    TOTVS_TIMEOUT: int = 30
    
    # SEFAZ-MT Configuration
    SEFAZ_ENVIRONMENT: str = "homologacao"  # homologacao ou producao
    SEFAZ_UF: str = "MT"
    SEFAZ_VERSAO_NFE: str = "4.00"
    SEFAZ_TIMEOUT: int = 60
    SEFAZ_TENTATIVAS: int = 3
    
    # WebService URLs SEFAZ-MT
    SEFAZ_URL_AUTORIZACAO_HOM: str
    SEFAZ_URL_RETORNO_HOM: str
    SEFAZ_URL_CONSULTA_HOM: str
    SEFAZ_URL_STATUS_HOM: str
    SEFAZ_URL_AUTORIZACAO_PROD: str
    SEFAZ_URL_RETORNO_PROD: str
    SEFAZ_URL_CONSULTA_PROD: str
    SEFAZ_URL_STATUS_PROD: str
    
    # Certificado Digital
    CERTIFICADO_PATH: str
    CERTIFICADO_PASSWORD: str
    CERTIFICADO_TIPO: str = "A1"
    
    # Fazenda Brasil Info
    FAZENDA_CNPJ: str
    FAZENDA_IE: str
    FAZENDA_RAZAO_SOCIAL: str
    FAZENDA_NOME_FANTASIA: str
    FAZENDA_ENDERECO: str
    FAZENDA_MUNICIPIO: str
    FAZENDA_CODIGO_MUNICIPIO: str
    FAZENDA_UF: str = "MT"
    FAZENDA_CEP: str
    FAZENDA_TELEFONE: str
    
    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str
    CELERY_TASK_TIME_LIMIT: int = 300
    CELERY_TASK_SOFT_TIME_LIMIT: int = 240
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = True
    PROMETHEUS_PORT: int = 9090
    
    # Email Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM: str
    NOTIFICATION_EMAILS: List[str] = []
    
    # Backup
    BACKUP_ENABLED: bool = True
    BACKUP_INTERVAL_HOURS: int = 6
    BACKUP_RETENTION_DAYS: int = 90
    BACKUP_S3_BUCKET: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "sa-east-1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def sefaz_url_autorizacao(self) -> str:
        """Retorna URL de autorização baseada no ambiente"""
        if self.SEFAZ_ENVIRONMENT == "producao":
            return self.SEFAZ_URL_AUTORIZACAO_PROD
        return self.SEFAZ_URL_AUTORIZACAO_HOM
    
    @property
    def sefaz_url_retorno(self) -> str:
        """Retorna URL de retorno baseada no ambiente"""
        if self.SEFAZ_ENVIRONMENT == "producao":
            return self.SEFAZ_URL_RETORNO_PROD
        return self.SEFAZ_URL_RETORNO_HOM
    
    @property
    def sefaz_url_consulta(self) -> str:
        """Retorna URL de consulta baseada no ambiente"""
        if self.SEFAZ_ENVIRONMENT == "producao":
            return self.SEFAZ_URL_CONSULTA_PROD
        return self.SEFAZ_URL_CONSULTA_HOM
    
    @property
    def sefaz_url_status(self) -> str:
        """Retorna URL de status baseada no ambiente"""
        if self.SEFAZ_ENVIRONMENT == "producao":
            return self.SEFAZ_URL_STATUS_PROD
        return self.SEFAZ_URL_STATUS_HOM
    
    @property
    def is_production(self) -> bool:
        """Verifica se está em produção"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_homologacao(self) -> bool:
        """Verifica se está em homologação SEFAZ"""
        return self.SEFAZ_ENVIRONMENT == "homologacao"


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância única das configurações (singleton)"""
    return Settings()


# Constantes do sistema
class NFPeConstants:
    """Constantes específicas para NFP-e MT"""
    
    # Códigos de regime tributário
    REGIME_TRIBUTARIO = {
        "SIMPLES_NACIONAL": 1,
        "SIMPLES_EXCESSO": 2,
        "NORMAL": 3,
        "MEI": 4
    }
    
    # Tipos de operação
    TIPO_OPERACAO = {
        "ENTRADA": 0,
        "SAIDA": 1
    }
    
    # Finalidades da NFP-e
    FINALIDADE = {
        "NORMAL": 1,
        "COMPLEMENTAR": 2,
        "AJUSTE": 3,
        "DEVOLUCAO": 4
    }
    
    # Indicador de presença
    INDICADOR_PRESENCA = {
        "NAO_SE_APLICA": 0,
        "PRESENCIAL": 1,
        "INTERNET": 2,
        "TELEATENDIMENTO": 3,
        "DOMICILIO": 4,
        "PRESENCIAL_FORA": 5,
        "OUTROS": 9
    }
    
    # Modalidade do frete
    MODALIDADE_FRETE = {
        "POR_CONTA_EMITENTE": 0,
        "POR_CONTA_DESTINATARIO": 1,
        "POR_CONTA_TERCEIROS": 2,
        "TRANSPORTE_PROPRIO_EMITENTE": 3,
        "TRANSPORTE_PROPRIO_DESTINATARIO": 4,
        "SEM_FRETE": 9
    }
    
    # Status de processamento
    STATUS_PROCESSAMENTO = {
        "PENDENTE": "PENDENTE",
        "PROCESSANDO": "PROCESSANDO",
        "AUTORIZADA": "AUTORIZADA",
        "REJEITADA": "REJEITADA",
        "CANCELADA": "CANCELADA",
        "INUTILIZADA": "INUTILIZADA",
        "ERRO": "ERRO"
    }
    
    # Produtos agrícolas comuns
    NCM_AGRICOLAS = {
        "SOJA_GRAO": "12019000",
        "MILHO_GRAO": "10059010",
        "ALGODAO_CAROCO": "52010020",
        "ALGODAO_PLUMA": "52010010",
        "ARROZ_CASCA": "10061092",
        "FEIJAO": "07133390",
        "TRIGO": "10019900",
        "GIRASSOL": "12060090"
    }
    
    # CFOP mais utilizados no agronegócio MT
    CFOP_AGRO = {
        "VENDA_PRODUCAO": "5101",  # Venda produção própria dentro do estado
        "VENDA_PRODUCAO_FORA": "6101",  # Venda produção própria fora do estado
        "VENDA_PRODUCAO_EXTERIOR": "7101",  # Venda produção própria para exterior
        "TRANSFERENCIA": "5151",  # Transferência produção própria
        "REMESSA_ARMAZENAMENTO": "5905",  # Remessa para armazenamento
        "RETORNO_ARMAZENAMENTO": "5906",  # Retorno de armazenamento
        "VENDA_COOPERATIVA": "5111",  # Venda para cooperativa
        "DEVOLUCAO_COMPRA": "5202",  # Devolução de compra
    }
    
    # Unidades de medida comuns no agro
    UNIDADES_MEDIDA = {
        "KG": "Quilograma",
        "TON": "Tonelada",
        "SC": "Saca",
        "ARR": "Arroba",
        "FD": "Fardo",
        "M3": "Metro cúbico",
        "L": "Litro",
        "UN": "Unidade"
    }