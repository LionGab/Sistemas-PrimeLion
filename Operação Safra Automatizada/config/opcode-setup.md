# OPCODE INTEGRATION - OPERAÇÃO SAFRA AUTOMATIZADA
## GUI Setup para Sistema NFP-e

**Objetivo**: Criar interface visual profissional para demonstração e operação do sistema NFP-e

---

## 🚀 INSTALAÇÃO E CONFIGURAÇÃO

### **1. Instalação opcode**

```bash
# Via npm (recomendado)
npm install -g @getasterisk/opcode

# Verificar instalação
opcode --version

# Inicializar no projeto
cd Operacao-Safra-Automatizada
opcode init --agro-profile
```

### **2. Configuração Inicial**

```bash
# Setup com Claude Code existente
opcode config --claude-code-integration
opcode config --mcp-servers-file .mcp.json
opcode config --project-type agribusiness
```

---

## 🎯 AGENTES PERSONALIZADOS NFP-e

### **Agentes Especializados**

#### **1. fiscal-compliance-agent**
```yaml
name: "Fiscal Compliance Agent"
role: "Especialista em NFP-e e SEFAZ-MT"
system_prompt: |
  Você é um especialista em compliance fiscal para agronegócio brasileiro.
  Expertise em:
  - NFP-e (Nota Fiscal de Produtor Eletrônica)
  - SEFAZ-MT regulamentações v4.0
  - TOTVS Agro Multicultivo
  - Cálculos FUNRURAL/SENAR/ICMS
  - Certificados digitais A1/A3
  
  SEMPRE validar compliance antes de qualquer operação fiscal.
  NUNCA processar sem validação SEFAZ schema.
tools:
  - filesystem
  - sequential-thinking
  - basic-memory
capabilities:
  - Validação NFP-e completa
  - Análise compliance SEFAZ-MT
  - Troubleshooting integrações fiscais
```

#### **2. agro-operations-optimizer**
```yaml
name: "Agro Operations Optimizer"
role: "Otimizador de operações agrícolas"
system_prompt: |
  Especialista em otimização de operações de safra e automação agrícola.
  Foco em:
  - Workflow plantio → cultivo → colheita → NFP-e
  - Performance targets: 120 NFP-e/hora
  - Integração TOTVS Agro
  - Monitoramento performance safra
  - Análise de dados geoespaciais
  
  Priorizar eficiência operacional e compliance.
tools:
  - playwright
  - serena
  - filesystem
capabilities:
  - Análise performance safra
  - Otimização workflows NFP-e
  - Relatórios operacionais
```

#### **3. demo-presenter-agent**
```yaml
name: "Demo Presenter Agent"
role: "Apresentador de demonstrações comerciais"
system_prompt: |
  Agente especializado em apresentações comerciais do sistema NFP-e.
  Objetivos:
  - Demonstrar valor comercial para fazendas
  - Explicar compliance fiscal de forma didática
  - Mostrar ROI da automação
  - Facilitar processo de vendas
  
  Linguagem acessível para produtores rurais.
  Focar em benefícios práticos e economia de tempo/custos.
tools:
  - playwright
  - basic-memory
capabilities:
  - Demos interativas
  - Explicações didáticas
  - Cálculos ROI
```

---

## 📊 DASHBOARD PERSONALIZADO

### **Layout Principal**

```javascript
// dashboard-config.js
const AgroSafraLayout = {
  title: "Operação Safra Automatizada",
  theme: "agro-professional",
  
  panels: [
    {
      name: "NFP-e Status",
      type: "metrics",
      metrics: [
        { label: "NFP-e Processadas", value: "processadas_hoje" },
        { label: "Success Rate", value: "taxa_sucesso" },
        { label: "SEFAZ Status", value: "status_sefaz" },
        { label: "Performance", value: "nfpe_por_hora" }
      ]
    },
    {
      name: "TOTVS Integration",
      type: "status",
      endpoints: [
        { label: "TOTVS API", status: "totvs_api_status" },
        { label: "Sync Status", status: "ultima_sincronizacao" },
        { label: "Queue Size", status: "tamanho_fila" }
      ]
    },
    {
      name: "Compliance Monitor",
      type: "compliance",
      checks: [
        { name: "Certificado Digital", status: "cert_status" },
        { name: "Schema SEFAZ v4.0", status: "schema_valid" },
        { name: "Audit Trail", status: "audit_active" },
        { name: "LGPD Compliance", status: "lgpd_status" }
      ]
    },
    {
      name: "Quick Actions",
      type: "actions",
      actions: [
        { name: "Processar NFP-e", command: "process_nfpe" },
        { name: "Sync TOTVS", command: "sync_totvs" },
        { name: "Validate System", command: "npm run validate" },
        { name: "Health Check", command: "npm run health" }
      ]
    }
  ]
};
```

---

## 🎨 TEMAS E BRANDING

### **Tema Agronegócio**

```css
/* agro-theme.css */
:root {
  --primary-color: #2E7D32;    /* Verde safra */
  --secondary-color: #FFC107;  /* Amarelo grão */
  --accent-color: #795548;     /* Marrom terra */
  --success-color: #4CAF50;    /* Verde aprovado */
  --warning-color: #FF9800;    /* Laranja alerta */
  --error-color: #F44336;      /* Vermelho erro */
  
  --bg-primary: #F1F8E9;       /* Verde claro */
  --bg-secondary: #FFFFFF;     /* Branco limpo */
  --text-primary: #1B5E20;     /* Verde escuro */
  --text-secondary: #424242;   /* Cinza */
}

.agro-dashboard {
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  font-family: 'Roboto', sans-serif;
}

.nfpe-card {
  border-left: 4px solid var(--primary-color);
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.compliance-indicator.valid {
  color: var(--success-color);
}

.compliance-indicator.warning {
  color: var(--warning-color);
}

.compliance-indicator.error {
  color: var(--error-color);
}
```

---

## 🔗 INTEGRAÇÃO MCP SERVERS

### **Configuração MCP**

```json
{
  "opcode_mcp_integration": {
    "enabled_servers": [
      {
        "name": "sequential-thinking",
        "purpose": "Análise multi-etapas workflows fiscais",
        "usage": "Cálculos complexos NFP-e"
      },
      {
        "name": "filesystem", 
        "purpose": "Acesso seguro diretórios NFP-e",
        "usage": "Navegação projeto fiscal"
      },
      {
        "name": "basic-memory",
        "purpose": "Base conhecimento TOTVS + SEFAZ-MT", 
        "usage": "Consultas regulamentações"
      },
      {
        "name": "serena",
        "purpose": "Navegação semântica código fiscal",
        "usage": "Code review automático"
      },
      {
        "name": "playwright",
        "purpose": "Testes automatizados interfaces NFP-e",
        "usage": "Validação UI/UX"
      }
    ]
  }
}
```

---

## 🚀 SCRIPTS DE AUTOMAÇÃO

### **Setup Completo**

```bash
#!/bin/bash
# setup-opcode-integration.sh

echo "🚀 Configurando opcode para Operação Safra Automatizada..."

# 1. Instalar opcode
npm install -g @getasterisk/opcode

# 2. Inicializar configuração
opcode init --project-type agribusiness

# 3. Configurar agentes personalizados
mkdir -p .opcode/agents
cp config/agents/* .opcode/agents/

# 4. Setup tema agronegócio
mkdir -p .opcode/themes
cp config/themes/agro-theme.css .opcode/themes/

# 5. Configurar dashboard
cp config/dashboard-config.js .opcode/

# 6. Integrar com MCP servers existentes
opcode config --mcp-file .mcp.json

# 7. Configurar variáveis ambiente
cp .env.example .opcode/.env

echo "✅ Setup opcode concluído!"
echo "Para iniciar: opcode start --project agro-safra"
```

---

## 📈 MÉTRICAS E MONITORAMENTO

### **KPIs Dashboard**

```yaml
agro_kpis:
  nfpe_metrics:
    - processadas_hoje: "SELECT COUNT(*) FROM nfpe WHERE DATE(created_at) = CURRENT_DATE"
    - taxa_sucesso: "SELECT (COUNT(*) FILTER (WHERE status='AUTORIZADA')) * 100.0 / COUNT(*) FROM nfpe WHERE DATE(created_at) = CURRENT_DATE"
    - tempo_medio: "SELECT AVG(processing_time_seconds) FROM nfpe WHERE DATE(created_at) = CURRENT_DATE"
    - nfpe_por_hora: "SELECT COUNT(*) FROM nfpe WHERE created_at >= NOW() - INTERVAL '1 hour'"
  
  totvs_metrics:
    - sync_status: "SELECT status FROM totvs_sync_log ORDER BY created_at DESC LIMIT 1"
    - ultima_sync: "SELECT MAX(created_at) FROM totvs_sync_log WHERE status = 'SUCCESS'"
    - filas_pendentes: "SELECT COUNT(*) FROM celery_taskmeta WHERE status = 'PENDING'"
  
  compliance_metrics:
    - cert_expiry: "SELECT dias_restantes FROM certificado_digital WHERE ativo = true"
    - audit_trails: "SELECT COUNT(*) FROM audit_log WHERE DATE(created_at) = CURRENT_DATE"
    - sefaz_availability: "SELECT availability_percent FROM sefaz_health_check WHERE DATE(check_date) = CURRENT_DATE"
```

---

## 🎯 COMANDOS OPCODE PERSONALIZADOS

### **Comandos Específicos NFP-e**

```bash
# Processar lote NFP-e
opcode exec fiscal-compliance-agent "process_nfpe_batch --fazenda=Brasil --talhao=A1"

# Validação compliance completa
opcode exec fiscal-compliance-agent "validate_full_compliance --environment=production"

# Demo para cliente
opcode exec demo-presenter-agent "create_demo --client=FazendaSantaFe --duration=30min"

# Otimização safra
opcode exec agro-operations-optimizer "optimize_harvest_workflow --safra=2024/2025"

# Relatório performance
opcode report --type=agro-performance --period=last-month
```

---

## 🔧 TROUBLESHOOTING

### **Problemas Comuns**

1. **opcode não reconhece MCP servers**
   ```bash
   opcode config --reset-mcp
   opcode config --mcp-file .mcp.json --force
   ```

2. **Agentes não carregam**
   ```bash
   opcode agents --list
   opcode agents --reload fiscal-compliance-agent
   ```

3. **Dashboard não atualiza métricas**
   ```bash
   opcode dashboard --refresh-data
   opcode config --database-url $DATABASE_URL
   ```

---

## 📋 CHECKLIST IMPLEMENTAÇÃO

- [ ] Instalar opcode globalmente
- [ ] Criar agentes personalizados (fiscal, agro, demo)
- [ ] Configurar dashboard com métricas NFP-e
- [ ] Aplicar tema agronegócio
- [ ] Integrar com MCP servers existentes
- [ ] Testar comandos personalizados
- [ ] Configurar relatórios automáticos
- [ ] Validar acesso banco de dados
- [ ] Testar demos comerciais
- [ ] Documentar workflows para equipe

---

**PRÓXIMO PASSO**: Executar `setup-opcode-integration.sh` e testar interface com dados reais do sistema NFP-e.