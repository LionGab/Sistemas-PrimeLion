# GUIA DE DEPLOYMENT PRODUÇÃO
## Sistema NFP-e Fazenda Brasil - SEFAZ-MT

**Data**: 01/09/2024  
**Versão**: 1.0  
**Ambiente**: Produção  
**Responsável**: Lion Consultoria + Fazenda Brasil IT

---

## 🎯 PRÉ-REQUISITOS DE INFRAESTRUTURA

### **Servidor Principal**
- **OS**: Ubuntu Server 22.04 LTS ou Windows Server 2022
- **CPU**: 8 cores / 3.2GHz (mínimo 4 cores)
- **RAM**: 32GB (mínimo 16GB)
- **Storage**: 1TB SSD NVMe
- **Network**: 1Gbps dedicado
- **Backup**: Storage secundário 2TB

### **Banco de Dados**
- **PostgreSQL**: 14.x ou superior
- **CPU**: 4 cores dedicados
- **RAM**: 16GB dedicados
- **Storage**: 500GB SSD para dados + 500GB backup
- **Connection Pool**: 100 conexões

### **Redis Cache**
- **Version**: 7.x
- **RAM**: 8GB dedicados
- **Persistence**: AOF + RDB
- **Cluster**: 3 nós (produção crítica)

---

## 🔐 CERTIFICADOS E SEGURANÇA

### **Certificado Digital A1/A3**
```bash
# Instalar certificado A1 (.pfx)
sudo mkdir -p /app/certificates
sudo chmod 700 /app/certificates
sudo cp fazenda_brasil.pfx /app/certificates/
sudo chown nfpe:nfpe /app/certificates/fazenda_brasil.pfx
sudo chmod 600 /app/certificates/fazenda_brasil.pfx

# Verificar certificado
openssl pkcs12 -info -in /app/certificates/fazenda_brasil.pfx -noout
```

### **SSL/TLS API**
```bash
# Certificado Let's Encrypt
sudo certbot certonly --nginx -d api.fazenda-brasil.agro

# Ou certificado comercial
sudo cp api.fazenda-brasil.agro.crt /etc/ssl/certs/
sudo cp api.fazenda-brasil.agro.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/api.fazenda-brasil.agro.key
```

### **Firewall (UFW)**
```bash
# Portas necessárias
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (redirect)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5432/tcp    # PostgreSQL (interno)
sudo ufw allow 6379/tcp    # Redis (interno)
sudo ufw enable

# Fechar acesso externo PostgreSQL/Redis
sudo ufw deny from any to any port 5432
sudo ufw allow from 10.0.0.0/24 to any port 5432  # Subnet interna
```

---

## 📦 DEPLOYMENT PASSO A PASSO

### **Passo 1: Preparação do Ambiente**

```bash
# Criar usuário do sistema
sudo adduser nfpe --system --group --shell /bin/bash --home /app

# Instalar Python 3.10+
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip postgresql-client redis-tools nginx

# Criar diretórios
sudo mkdir -p /app/{nfpe-api,logs,backups,certificates}
sudo chown -R nfpe:nfpe /app
```

### **Passo 2: Deploy da Aplicação**

```bash
# Como usuário nfpe
sudo su - nfpe
cd /app

# Clone do repositório (ajustar URL)
git clone https://github.com/fazenda-brasil/nfpe-automation.git nfpe-api
cd nfpe-api

# Virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt

# Copiar configuração produção
cp .env.example .env
```

### **Passo 3: Configuração Produção (.env)**

```bash
# Editar configuração
vim .env
```

```env
# === PRODUCTION ENVIRONMENT ===
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO

# === API CONFIGURATION ===
API_HOST=0.0.0.0
API_PORT=8000
API_TITLE=NFP-e Fazenda Brasil - Produção

# === DATABASE ===
DATABASE_URL=postgresql://nfpe_user:SENHA_SEGURA@localhost:5432/nfpe_producao
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# === REDIS ===
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=SENHA_REDIS_SEGURA

# === SEFAZ-MT PRODUÇÃO ===
SEFAZ_ENVIRONMENT=producao
SEFAZ_URL_AUTORIZACAO_PROD=https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeAutorizacao4
SEFAZ_URL_RETORNO_PROD=https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeRetAutorizacao4
SEFAZ_URL_CONSULTA_PROD=https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeConsulta4
SEFAZ_URL_STATUS_PROD=https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeStatusServico4

# === CERTIFICADO DIGITAL ===
CERTIFICADO_PATH=/app/certificates/fazenda_brasil.pfx
CERTIFICADO_PASSWORD=SENHA_CERTIFICADO
CERTIFICADO_TIPO=A1

# === FAZENDA BRASIL INFO ===
FAZENDA_CNPJ=12345678000190
FAZENDA_IE=1234567890
FAZENDA_RAZAO_SOCIAL=Fazenda Brasil Ltda
FAZENDA_NOME_FANTASIA=Fazenda Brasil
FAZENDA_ENDERECO=Rodovia MT-130, KM 45
FAZENDA_MUNICIPIO=Campo Verde
FAZENDA_CODIGO_MUNICIPIO=5102704
FAZENDA_UF=MT
FAZENDA_CEP=78840000
FAZENDA_TELEFONE=6534567890

# === SECURITY ===
SECRET_KEY=chave-super-secreta-produção-256-bits
JWT_EXPIRATION_HOURS=8
CORS_ORIGINS=["https://fazenda-brasil.agro","https://app.fazenda-brasil.agro"]

# === TOTVS PRODUÇÃO ===
TOTVS_API_URL=https://api.totvs.com.br/protheus/v1
TOTVS_API_KEY=key_producao_totvs
TOTVS_API_SECRET=secret_producao_totvs
TOTVS_COMPANY_ID=01
TOTVS_BRANCH_ID=01

# === MONITORING ===
SENTRY_DSN=https://sentry-dsn-producao
PROMETHEUS_ENABLED=True

# === EMAIL NOTIFICATIONS ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nfpe@fazenda-brasil.agro
SMTP_PASSWORD=senha_email_app
NOTIFICATION_EMAILS=["gestor@fazenda-brasil.agro","fiscal@fazenda-brasil.agro"]

# === BACKUP ===
BACKUP_ENABLED=True
BACKUP_INTERVAL_HOURS=6
BACKUP_S3_BUCKET=fazenda-brasil-backups-prod
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=secret_key_aws
```

### **Passo 4: Banco de Dados**

```bash
# Como postgres user
sudo su - postgres

# Criar usuário e database
createuser nfpe_user
createdb nfpe_producao -O nfpe_user

# Definir senha (via psql)
psql
\password nfpe_user
# Digitar senha segura
\q
exit

# Como nfpe user - executar migrações
sudo su - nfpe
cd /app/nfpe-api
source venv/bin/activate

# Executar migrações
alembic upgrade head

# Dados iniciais (se necessário)
python scripts/init_producao.py
```

### **Passo 5: Systemd Services**

```bash
# Criar serviço FastAPI
sudo vim /etc/systemd/system/nfpe-api.service
```

```ini
[Unit]
Description=NFP-e API Fazenda Brasil
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=exec
User=nfpe
Group=nfpe
WorkingDirectory=/app/nfpe-api
Environment=PATH=/app/nfpe-api/venv/bin
ExecStart=/app/nfpe-api/venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=append:/app/logs/nfpe-api.log
StandardError=append:/app/logs/nfpe-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Criar serviço Celery Worker
sudo vim /etc/systemd/system/nfpe-worker.service
```

```ini
[Unit]
Description=NFP-e Celery Worker
After=network.target redis.service
Wants=redis.service

[Service]
Type=exec
User=nfpe
Group=nfpe
WorkingDirectory=/app/nfpe-api
Environment=PATH=/app/nfpe-api/venv/bin
ExecStart=/app/nfpe-api/venv/bin/celery -A src.celery_app worker --loglevel=info --concurrency=4
Restart=always
RestartSec=10
StandardOutput=append:/app/logs/nfpe-worker.log
StandardError=append:/app/logs/nfpe-worker-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviços
sudo systemctl daemon-reload
sudo systemctl enable nfpe-api nfpe-worker
sudo systemctl start nfpe-api nfpe-worker

# Verificar status
sudo systemctl status nfpe-api
sudo systemctl status nfpe-worker
```

### **Passo 6: Nginx Proxy**

```bash
# Configurar Nginx
sudo vim /etc/nginx/sites-available/nfpe-api
```

```nginx
upstream nfpe_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.fazenda-brasil.agro;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.fazenda-brasil.agro;

    ssl_certificate /etc/ssl/certs/api.fazenda-brasil.agro.crt;
    ssl_certificate_key /etc/ssl/private/api.fazenda-brasil.agro.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    
    access_log /var/log/nginx/nfpe-api.access.log;
    error_log /var/log/nginx/nfpe-api.error.log;

    client_max_body_size 10M;
    
    location / {
        proxy_pass http://nfpe_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
    }

    location /health {
        proxy_pass http://nfpe_backend/health;
        access_log off;
    }

    location /metrics {
        proxy_pass http://nfpe_backend/metrics;
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/nfpe-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 MONITORAMENTO E LOGS

### **Log Rotation**
```bash
# Configurar logrotate
sudo vim /etc/logrotate.d/nfpe-api
```

```
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 nfpe nfpe
    postrotate
        systemctl reload nfpe-api nfpe-worker
    endscript
}
```

### **Monitoring Dashboard**
```bash
# Prometheus (opcional)
sudo apt install prometheus
sudo vim /etc/prometheus/prometheus.yml
```

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nfpe-api'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: /metrics
    scrape_interval: 30s
```

### **Health Check Script**
```bash
# Criar script monitoramento
sudo vim /app/scripts/health_check.sh
```

```bash
#!/bin/bash
# Health check NFP-e API

API_URL="https://api.fazenda-brasil.agro"
LOG_FILE="/app/logs/health_check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check API health
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)

if [ $HTTP_STATUS -eq 200 ]; then
    echo "[$DATE] API OK - Status: $HTTP_STATUS" >> $LOG_FILE
else
    echo "[$DATE] API ERROR - Status: $HTTP_STATUS" >> $LOG_FILE
    # Enviar alerta (email, Slack, etc.)
    echo "API Fazenda Brasil está com problemas!" | mail -s "ALERT: NFP-e API Down" gestor@fazenda-brasil.agro
fi

# Check SEFAZ connectivity
curl -s --max-time 10 "https://nfe.sefaz.mt.gov.br" > /dev/null
if [ $? -eq 0 ]; then
    echo "[$DATE] SEFAZ-MT OK" >> $LOG_FILE
else
    echo "[$DATE] SEFAZ-MT ERROR" >> $LOG_FILE
fi
```

```bash
# Tornar executável
sudo chmod +x /app/scripts/health_check.sh

# Agendar no crontab
sudo crontab -e
# Adicionar linha:
# */5 * * * * /app/scripts/health_check.sh
```

---

## 🔄 BACKUP E DISASTER RECOVERY

### **Backup Automático**
```bash
# Script backup
sudo vim /app/scripts/backup_nfpe.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nfpe_producao"

# Backup banco PostgreSQL
pg_dump $DB_NAME | gzip > $BACKUP_DIR/nfpe_db_$DATE.sql.gz

# Backup certificados e configs
tar -czf $BACKUP_DIR/nfpe_configs_$DATE.tar.gz /app/certificates/ /app/nfpe-api/.env

# Backup logs importantes
tar -czf $BACKUP_DIR/nfpe_logs_$DATE.tar.gz /app/logs/

# Sync para S3 (se configurado)
aws s3 sync $BACKUP_DIR/ s3://fazenda-brasil-backups-prod/nfpe/ --delete

# Limpeza backups locais (manter 7 dias)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Agendar backup (4x por dia)
sudo crontab -e
# Adicionar:
# 0 */6 * * * /app/scripts/backup_nfpe.sh
```

### **Disaster Recovery**
```bash
# Script restore
sudo vim /app/scripts/restore_nfpe.sh
```

```bash
#!/bin/bash
if [ $# -ne 1 ]; then
    echo "Usage: $0 backup_date (YYYYMMDD_HHMMSS)"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/app/backups"

# Parar serviços
sudo systemctl stop nfpe-api nfpe-worker

# Restaurar banco
gunzip -c $BACKUP_DIR/nfpe_db_$BACKUP_DATE.sql.gz | psql nfpe_producao

# Restaurar configs
tar -xzf $BACKUP_DIR/nfpe_configs_$BACKUP_DATE.tar.gz -C /

# Reiniciar serviços
sudo systemctl start nfpe-api nfpe-worker

echo "Restore completed from backup: $BACKUP_DATE"
```

---

## 🧪 TESTES PÓS-DEPLOYMENT

### **Smoke Tests**
```bash
# Como nfpe user
cd /app/nfpe-api
source venv/bin/activate

# Executar testes básicos
python -m pytest tests/smoke/ -v

# Teste específico SEFAZ
python -m pytest tests/integration/test_sefaz_integration.py::test_verificar_status_servico -v

# Teste geração NFP-e
curl -X GET https://api.fazenda-brasil.agro/health
curl -X GET https://api.fazenda-brasil.agro/api/v1/totvs/status
```

### **Validação Funcional**
1. **Login API**: Autenticação funcionando
2. **Consulta SEFAZ**: Status serviço = 107 (Operação)
3. **Integração TOTVS**: Conectividade OK
4. **Geração NFP-e**: XML válido gerado
5. **Assinatura Digital**: Certificado funcionando
6. **Backup**: Primeiro backup executado
7. **Monitoring**: Métricas sendo coletadas

---

## 📋 CHECKLIST GO-LIVE

### **Pré-Produção** ✅
- [ ] Servidor configurado com specs mínimas
- [ ] PostgreSQL 14+ instalado e configurado
- [ ] Redis 7+ instalado e funcionando
- [ ] Certificado digital válido instalado
- [ ] SSL/TLS configurado (HTTPS)
- [ ] Firewall configurado
- [ ] Backup automático funcionando
- [ ] Logs configurados e rotacionando
- [ ] Health check ativo
- [ ] TOTVS integração testada
- [ ] SEFAZ conectividade confirmada

### **Deploy** ✅
- [ ] Código aplicação deployado
- [ ] Configuração produção aplicada
- [ ] Migrações banco executadas
- [ ] Serviços systemd ativos
- [ ] Nginx proxy funcionando
- [ ] Certificado digital testado
- [ ] Primeira NFP-e teste gerada
- [ ] Monitoramento ativo

### **Validação** ✅
- [ ] API respondendo HTTPS
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] SEFAZ status: 107 Operação
- [ ] TOTVS conectado
- [ ] Logs sem erros críticos
- [ ] Backup executado
- [ ] Performance baseline coletada
- [ ] Equipe treinada
- [ ] Documentação atualizada

### **Go-Live** ✅
- [ ] Switch produção ativado
- [ ] Primeira NFP-e oficial autorizada
- [ ] Monitoramento 24h ativo
- [ ] SLA suporte ativo
- [ ] Processo manual backup disponível
- [ ] Contatos emergência atualizados

---

## 🚨 TROUBLESHOOTING

### **Problemas Comuns**

#### **API não responde**
```bash
# Verificar serviços
sudo systemctl status nfpe-api
sudo journalctl -u nfpe-api -f

# Verificar logs
tail -f /app/logs/nfpe-api.log
tail -f /app/logs/nfpe-error.log

# Reiniciar se necessário
sudo systemctl restart nfpe-api
```

#### **Erro certificado digital**
```bash
# Verificar certificado
openssl pkcs12 -info -in /app/certificates/fazenda_brasil.pfx -noout

# Verificar permissões
ls -la /app/certificates/
# Deve ser: -rw------- nfpe nfpe

# Testar certificado
cd /app/nfpe-api
source venv/bin/activate
python -c "from src.services.digital_signature import signature_service; print(signature_service.validar_certificado('/app/certificates/fazenda_brasil.pfx', 'senha'))"
```

#### **SEFAZ inacessível**
```bash
# Testar conectividade
curl -I https://nfe.sefaz.mt.gov.br
nslookup nfe.sefaz.mt.gov.br

# Verificar firewall
sudo ufw status
sudo iptables -L

# Logs SEFAZ
grep -i sefaz /app/logs/nfpe-api.log
```

#### **TOTVS desconectado**
```bash
# Testar API TOTVS
curl -H "Authorization: Bearer $TOTVS_API_KEY" https://api.totvs.com.br/protheus/v1/health

# Verificar credenciais
grep TOTVS /app/nfpe-api/.env

# Logs integração
grep -i totvs /app/logs/nfpe-api.log
```

### **Contatos Emergência**

| Tipo | Contato | Horário | SLA |
|------|---------|---------|-----|
| **Suporte Lion** | (65) 99999-9999 | 24/7 | 2h |
| **TOTVS Suporte** | 0800-TOTVS | 8h-18h | 4h |
| **SEFAZ-MT** | (65) 3648-6000 | 8h-17h | N/A |
| **Fazenda Brasil IT** | (65) 98888-8888 | 24/7 | 1h |

---

**🚀 Sistema NFP-e Fazenda Brasil - Produção**  
**Deployment Checklist: 100% ✅**  
**Status: READY FOR GO-LIVE** 🌾