@echo off
REM ================================================================
REM Script de Deploy - Operação Safra Automatizada
REM Lion Consultoria - Sistema de Automação NFP-e
REM ================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================
echo           OPERACAO SAFRA AUTOMATIZADA - DEPLOY
echo              Sistema de Automacao NFP-e Agro
echo ================================================================
echo.

REM Detecta o ambiente de deploy
set /p ENV="Selecione o ambiente [dev/staging/prod]: "
if "%ENV%"=="" set ENV=dev

echo.
echo [INFO] Iniciando deploy para ambiente: %ENV%
echo.

REM Verifica Python
echo [STEP 1/10] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python nao encontrado! Instale Python 3.10+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version

REM Verifica PostgreSQL
echo.
echo [STEP 2/10] Verificando PostgreSQL...
pg_config --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] PostgreSQL nao detectado no PATH
    echo Certifique-se de que o PostgreSQL esta instalado e rodando
) else (
    pg_config --version
)

REM Verifica Redis
echo.
echo [STEP 3/10] Verificando Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Redis nao esta respondendo
    echo Execute: redis-server para iniciar o Redis
) else (
    echo Redis: OK
)

REM Cria ambiente virtual se nao existir
echo.
echo [STEP 4/10] Configurando ambiente virtual...
if not exist "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
)

REM Ativa ambiente virtual
echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Atualiza pip
echo.
echo [STEP 5/10] Atualizando pip...
python -m pip install --upgrade pip

REM Instala dependencias
echo.
echo [STEP 6/10] Instalando dependencias...
pip install -r nfpe-fazenda-brasil\requirements.txt

REM Instala dependencias de teste
if "%ENV%"=="dev" (
    echo Instalando dependencias de desenvolvimento...
    pip install pytest pytest-asyncio playwright
    python -m playwright install chromium
)

REM Configura variaveis de ambiente
echo.
echo [STEP 7/10] Configurando variaveis de ambiente...
if not exist "nfpe-fazenda-brasil\.env" (
    if exist "nfpe-fazenda-brasil\.env.example" (
        copy nfpe-fazenda-brasil\.env.example nfpe-fazenda-brasil\.env
        echo [WARN] Arquivo .env criado a partir do exemplo
        echo [ACTION] Edite nfpe-fazenda-brasil\.env com suas credenciais!
    ) else (
        echo [ERROR] Arquivo .env.example nao encontrado!
        pause
        exit /b 1
    )
)

REM Executa migrations do banco de dados
echo.
echo [STEP 8/10] Executando migrations do banco de dados...
cd nfpe-fazenda-brasil
if exist "alembic.ini" (
    alembic upgrade head
) else (
    echo [WARN] Alembic nao configurado. Pulando migrations...
)
cd ..

REM Valida sistema
echo.
echo [STEP 9/10] Validando sistema...
if exist "scripts\validate_agro_automation.py" (
    python scripts\validate_agro_automation.py
    if %errorlevel% neq 0 (
        echo [ERROR] Validacao falhou! Verifique os logs.
        pause
        exit /b 1
    )
) else (
    echo [WARN] Script de validacao nao encontrado
)

REM Inicia servidor
echo.
echo [STEP 10/10] Iniciando servidor...
echo.
echo ================================================================
echo                    DEPLOY CONCLUIDO!
echo ================================================================
echo.

if "%ENV%"=="prod" (
    echo [PRODUCAO] Iniciando com Gunicorn...
    echo.
    cd nfpe-fazenda-brasil
    gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --log-level info
) else (
    echo [DESENVOLVIMENTO] Iniciando com Uvicorn (hot-reload ativado)...
    echo.
    echo Acesse a aplicacao em: http://localhost:8000
    echo Documentacao da API: http://localhost:8000/docs
    echo.
    echo Pressione Ctrl+C para parar o servidor
    echo.
    cd nfpe-fazenda-brasil
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
)

:end
cd ..
deactivate
endlocal