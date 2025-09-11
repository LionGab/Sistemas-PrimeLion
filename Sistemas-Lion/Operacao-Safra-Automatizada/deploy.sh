#!/bin/bash
# ================================================================
# Script de Deploy - Operação Safra Automatizada
# Lion Consultoria - Sistema de Automação NFP-e
# ================================================================

set -e  # Para execução em caso de erro

echo ""
echo "================================================================"
echo "           OPERAÇÃO SAFRA AUTOMATIZADA - DEPLOY"
echo "              Sistema de Automação NFP-e Agro"
echo "================================================================"
echo ""

# Detecta o ambiente de deploy
read -p "Selecione o ambiente [dev/staging/prod]: " ENV
ENV=${ENV:-dev}

echo ""
echo "[INFO] Iniciando deploy para ambiente: $ENV"
echo ""

# Verifica Python
echo "[STEP 1/10] Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python não encontrado! Instale Python 3.10+"
    echo "Download: https://www.python.org/downloads/"
    exit 1
fi
python3 --version

# Verifica PostgreSQL
echo ""
echo "[STEP 2/10] Verificando PostgreSQL..."
if ! command -v pg_config &> /dev/null; then
    echo "[WARN] PostgreSQL não detectado no PATH"
    echo "Certifique-se de que o PostgreSQL está instalado e rodando"
else
    pg_config --version
fi

# Verifica Redis
echo ""
echo "[STEP 3/10] Verificando Redis..."
if ! redis-cli ping &> /dev/null; then
    echo "[WARN] Redis não está respondendo"
    echo "Execute: redis-server para iniciar o Redis"
else
    echo "Redis: OK"
fi

# Cria ambiente virtual se não existir
echo ""
echo "[STEP 4/10] Configurando ambiente virtual..."
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativa ambiente virtual
echo "Ativando ambiente virtual..."
source venv/bin/activate

# Atualiza pip
echo ""
echo "[STEP 5/10] Atualizando pip..."
pip install --upgrade pip

# Instala dependências
echo ""
echo "[STEP 6/10] Instalando dependências..."
pip install -r nfpe-fazenda-brasil/requirements.txt

# Instala dependências de teste
if [ "$ENV" == "dev" ]; then
    echo "Instalando dependências de desenvolvimento..."
    pip install pytest pytest-asyncio playwright
    python -m playwright install chromium
fi

# Configura variáveis de ambiente
echo ""
echo "[STEP 7/10] Configurando variáveis de ambiente..."
if [ ! -f "nfpe-fazenda-brasil/.env" ]; then
    if [ -f "nfpe-fazenda-brasil/.env.example" ]; then
        cp nfpe-fazenda-brasil/.env.example nfpe-fazenda-brasil/.env
        echo "[WARN] Arquivo .env criado a partir do exemplo"
        echo "[ACTION] Edite nfpe-fazenda-brasil/.env com suas credenciais!"
    else
        echo "[ERROR] Arquivo .env.example não encontrado!"
        exit 1
    fi
fi

# Executa migrations do banco de dados
echo ""
echo "[STEP 8/10] Executando migrations do banco de dados..."
cd nfpe-fazenda-brasil
if [ -f "alembic.ini" ]; then
    alembic upgrade head
else
    echo "[WARN] Alembic não configurado. Pulando migrations..."
fi
cd ..

# Valida sistema
echo ""
echo "[STEP 9/10] Validando sistema..."
if [ -f "scripts/validate_agro_automation.py" ]; then
    python scripts/validate_agro_automation.py
    if [ $? -ne 0 ]; then
        echo "[ERROR] Validação falhou! Verifique os logs."
        exit 1
    fi
else
    echo "[WARN] Script de validação não encontrado"
fi

# Inicia servidor
echo ""
echo "[STEP 10/10] Iniciando servidor..."
echo ""
echo "================================================================"
echo "                    DEPLOY CONCLUÍDO!"
echo "================================================================"
echo ""

if [ "$ENV" == "prod" ]; then
    echo "[PRODUÇÃO] Iniciando com Gunicorn..."
    echo ""
    cd nfpe-fazenda-brasil
    gunicorn src.main:app \
        -w 4 \
        -k uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --log-level info
else
    echo "[DESENVOLVIMENTO] Iniciando com Uvicorn (hot-reload ativado)..."
    echo ""
    echo "Acesse a aplicação em: http://localhost:8000"
    echo "Documentação da API: http://localhost:8000/docs"
    echo ""
    echo "Pressione Ctrl+C para parar o servidor"
    echo ""
    cd nfpe-fazenda-brasil
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
fi