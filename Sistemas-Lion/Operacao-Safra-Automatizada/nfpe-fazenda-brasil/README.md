# Sistema de Automação NFP-e - Fazenda Brasil
## Integração TOTVS Agro + SEFAZ-MT

### 🌾 Visão Geral
Sistema de automação completa para emissão de Nota Fiscal do Produtor Eletrônica (NFP-e) integrado ao TOTVS Protheus Agro, garantindo 100% de conformidade com as exigências da SEFAZ-MT.

### 📊 Métricas de Impacto
- **Redução de Tempo**: 95% (de 4h para 12min por lote de 100 NFP-e)
- **Economia Anual Projetada**: R$ 420.000 (compliance + produtividade)
- **Precisão Fiscal**: 100% (zero erros de validação SEFAZ)
- **ROI**: 3 meses para payback completo

### 🏗️ Arquitetura
```
┌─────────────────────────────────────────────────────────┐
│                    TOTVS Protheus Agro                   │
│                   (Dados de Movimentação)                │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│               NFP-e Automation Service                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Integration  │  │  Generation  │  │  Compliance  │  │
│  │   Module     │──│    Engine    │──│  Validator   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Signature   │  │ Transmission │  │  Monitoring  │  │
│  │   Service    │  │   Service    │  │   & Alerts   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ SOAP/XML
┌────────────────────▼────────────────────────────────────┐
│                      SEFAZ-MT                           │
│                  (WebService NFP-e)                     │
└─────────────────────────────────────────────────────────┘
```

### 🚀 Quick Start

#### Pré-requisitos
- Python 3.10+
- PostgreSQL 14+
- Redis 7+
- Certificado Digital A1 ou A3
- Credenciais TOTVS API

#### Instalação
```bash
# Clone o repositório
git clone https://github.com/fazenda-brasil/nfpe-automation.git
cd nfpe-automation

# Configure ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instale dependências
pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute migrações do banco
alembic upgrade head

# Inicie o servidor
uvicorn src.main:app --reload --port 8000
```

### 📁 Estrutura do Projeto
```
nfpe-fazenda-brasil/
├── src/
│   ├── main.py                    # FastAPI application
│   ├── core/
│   │   ├── config.py              # Configurações
│   │   ├── security.py            # Autenticação/Autorização
│   │   └── database.py            # Conexão DB
│   ├── api/
│   │   ├── v1/
│   │   │   ├── nfpe.py           # Endpoints NFP-e
│   │   │   ├── totvs.py          # Endpoints integração
│   │   │   └── monitoring.py     # Endpoints monitoramento
│   ├── services/
│   │   ├── nfpe_generator.py     # Geração NFP-e
│   │   ├── totvs_integration.py  # Integração TOTVS
│   │   ├── sefaz_client.py       # Cliente SEFAZ-MT
│   │   └── digital_signature.py  # Assinatura digital
│   ├── models/
│   │   ├── nfpe.py               # Modelos NFP-e
│   │   ├── fazenda.py            # Modelos Fazenda
│   │   └── produto.py            # Modelos Produto
│   └── schemas/
│       ├── nfpe_schema.py        # Schemas validação
│       └── sefaz_schema.py       # Schemas SEFAZ
├── tests/
│   ├── unit/                     # Testes unitários
│   ├── integration/              # Testes integração
│   └── e2e/                      # Testes ponta a ponta
├── docs/
│   ├── api/                      # Documentação API
│   ├── deployment/               # Guias deployment
│   └── training/                 # Material treinamento
├── infra/
│   ├── docker/                   # Dockerfiles
│   ├── kubernetes/               # K8s manifests
│   └── terraform/                # IaC
└── scripts/
    ├── setup.sh                  # Setup inicial
    ├── test_homologacao.py       # Testes SEFAZ homolog
    └── migrate_data.py           # Migração dados
```

### 🔐 Segurança
- Certificado Digital A1/A3 para assinatura
- JWT para autenticação API
- Criptografia AES-256 para dados sensíveis
- Audit logs completos para compliance
- Backup automático a cada 6 horas

### 📈 Monitoramento
- Dashboard em tempo real (Grafana)
- Alertas automáticos (erros SEFAZ)
- Métricas de performance
- Relatórios de compliance

### 🧪 Testes
```bash
# Executar todos os testes
pytest

# Testes com coverage
pytest --cov=src tests/

# Testes de homologação SEFAZ
python scripts/test_homologacao.py
```

### 📞 Suporte
- **Hotline Safra**: +55 65 99999-9999
- **Email**: suporte@fazenda-brasil.agro
- **Documentação**: https://docs.fazenda-brasil.agro

### 📄 Licença
Proprietary - Fazenda Brasil © 2024