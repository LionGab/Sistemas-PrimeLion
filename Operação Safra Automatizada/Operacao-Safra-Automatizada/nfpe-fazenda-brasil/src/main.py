"""
Aplicação FastAPI - Sistema NFP-e Fazenda Brasil
API REST para automação de Nota Fiscal do Produtor Eletrônica
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import logging
import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client import REGISTRY, CollectorRegistry
import uvicorn

from .core.config import get_settings
from .core.database import init_db, check_db_connection
from .api import nfpe, totvs, monitoring, auth

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/nfpe/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Métricas Prometheus
REQUEST_COUNT = Counter('nfpe_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('nfpe_request_duration_seconds', 'Request duration')
NFPE_GENERATED = Counter('nfpe_generated_total', 'Total NFP-e generated', ['status'])
SEFAZ_REQUESTS = Counter('sefaz_requests_total', 'Total SEFAZ requests', ['operation', 'status'])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciamento do ciclo de vida da aplicação"""
    # Startup
    logger.info("Iniciando sistema NFP-e Fazenda Brasil...")
    
    try:
        # Inicializa banco de dados
        init_db()
        logger.info("✅ Banco de dados inicializado")
        
        # Verifica conectividade
        if not check_db_connection():
            raise Exception("Falha na conexão com banco de dados")
        
        # Verifica conectividade com TOTVS (se configurado)
        from .services.totvs_integration import totvs_service
        if await totvs_service.test_connection():
            logger.info("✅ Conectividade TOTVS verificada")
        else:
            logger.warning("⚠️  TOTVS não disponível - verifique configurações")
        
        # Verifica conectividade com SEFAZ
        from .services.sefaz_client import sefaz_client
        status = await sefaz_client.verificar_status_servico()
        if status.sucesso:
            logger.info("✅ SEFAZ-MT disponível")
        else:
            logger.warning(f"⚠️  SEFAZ-MT indisponível: {status.mensagem}")
        
        logger.info("🚀 Sistema NFP-e iniciado com sucesso!")
        
    except Exception as e:
        logger.error(f"❌ Erro na inicialização: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Finalizando sistema NFP-e...")


# Cria aplicação FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Sistema de automação para Nota Fiscal do Produtor Eletrônica integrado ao TOTVS Protheus Agro",
    contact={
        "name": "Fazenda Brasil - Suporte Técnico",
        "email": "suporte@fazenda-brasil.agro",
        "url": "https://fazenda-brasil.agro"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://fazenda-brasil.agro/license"
    },
    docs_url=None,  # Desabilita docs padrão para customizar
    redoc_url=None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"]
)

# Middleware de hosts confiáveis (produção)
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["fazenda-brasil.agro", "*.fazenda-brasil.agro"]
    )


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware para logging e métricas"""
    start_time = time.time()
    
    # Processa requisição
    response = await call_next(request)
    
    # Calcula duração
    duration = time.time() - start_time
    
    # Atualiza métricas
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(duration)
    
    # Log da requisição
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {duration:.3f}s - "
        f"IP: {request.client.host}"
    )
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global para exceções"""
    logger.error(f"Erro não tratado: {str(exc)}", exc_info=True)
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": str(exc),
                "path": request.url.path
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "Erro interno do servidor. Contate o suporte."
            }
        )


# Rotas personalizadas para documentação
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Documentação Swagger UI customizada"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Documentação API",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
        swagger_favicon_url="/static/favicon.ico"
    )


@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    """Documentação ReDoc"""
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Documentação API",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js",
        redoc_favicon_url="/static/favicon.ico"
    )


# Rota de health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Verificação de saúde da aplicação"""
    try:
        # Verifica banco de dados
        db_status = check_db_connection()
        
        # Verifica SEFAZ (com timeout rápido)
        from .services.sefaz_client import sefaz_client
        import asyncio
        try:
            sefaz_status = await asyncio.wait_for(
                sefaz_client.verificar_status_servico(),
                timeout=5.0
            )
        except asyncio.TimeoutError:
            sefaz_status = {"sucesso": False, "mensagem": "Timeout"}
        
        status = "healthy" if db_status and sefaz_status.sucesso else "degraded"
        
        return {
            "status": status,
            "timestamp": time.time(),
            "version": settings.API_VERSION,
            "environment": settings.ENVIRONMENT,
            "checks": {
                "database": "ok" if db_status else "error",
                "sefaz": "ok" if sefaz_status.sucesso else "error"
            },
            "uptime_seconds": time.time() - start_time if 'start_time' in globals() else 0
        }
        
    except Exception as e:
        logger.error(f"Erro no health check: {str(e)}")
        raise HTTPException(status_code=503, detail="Service Unavailable")


# Rota de métricas Prometheus
@app.get("/metrics", include_in_schema=False)
async def metrics():
    """Métricas Prometheus"""
    from fastapi.responses import Response
    return Response(
        generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST
    )


# Rota raiz
@app.get("/", tags=["Root"])
async def root():
    """Informações básicas da API"""
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "description": "Sistema de automação NFP-e para agronegócio",
        "docs_url": "/docs",
        "health_url": "/health",
        "fazenda": "Fazenda Brasil - Campo Verde/MT",
        "compliance": "SEFAZ-MT NFP-e v4.00"
    }


# Customiza OpenAPI schema
def custom_openapi():
    """Schema OpenAPI customizado"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        description="""
        ## Sistema NFP-e Fazenda Brasil
        
        Sistema completo de automação para **Nota Fiscal do Produtor Eletrônica** 
        integrado ao **TOTVS Protheus Agro** e em conformidade com **SEFAZ-MT**.
        
        ### Funcionalidades Principais:
        - ✅ Geração automática de NFP-e a partir de movimentações TOTVS
        - ✅ Assinatura digital com certificado A1/A3
        - ✅ Transmissão e consulta junto ao SEFAZ-MT
        - ✅ Monitoramento em tempo real
        - ✅ Compliance 100% com legislação MT
        
        ### Ambientes Disponíveis:
        - **Homologação**: Testes e validação
        - **Produção**: Operação real
        
        ### Suporte:
        - 📞 **Hotline Safra**: +55 65 99999-9999
        - 📧 **Email**: suporte@fazenda-brasil.agro
        - 📚 **Docs**: https://docs.fazenda-brasil.agro
        
        ---
        **Fazenda Brasil** - Campo Verde/MT
        """,
        routes=app.routes,
    )
    
    # Adiciona informações de segurança
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    # Adiciona tags customizadas
    openapi_schema["tags"] = [
        {
            "name": "NFP-e",
            "description": "Operações de Nota Fiscal do Produtor Eletrônica"
        },
        {
            "name": "TOTVS",
            "description": "Integração com TOTVS Protheus Agro"
        },
        {
            "name": "SEFAZ",
            "description": "Comunicação com SEFAZ-MT"
        },
        {
            "name": "Monitoring",
            "description": "Monitoramento e métricas"
        },
        {
            "name": "Auth",
            "description": "Autenticação e autorização"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Inclui routers da API
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Auth"])
app.include_router(nfpe.router, prefix=f"{settings.API_PREFIX}/nfpe", tags=["NFP-e"])
app.include_router(totvs.router, prefix=f"{settings.API_PREFIX}/totvs", tags=["TOTVS"])
app.include_router(monitoring.router, prefix=f"{settings.API_PREFIX}/monitoring", tags=["Monitoring"])


# Inicialização para desenvolvimento
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )