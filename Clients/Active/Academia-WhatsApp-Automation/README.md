# 🏋️ Academia WhatsApp Automation System

Sistema completo de automação WhatsApp para academias, focado em reativação de membros, nurturing de leads e captação de novos clientes.

## 🎯 Objetivos do Sistema

### Problemas Resolvidos
- ✅ **Membros Inativos**: Automatiza reativação de alunos que param de treinar (15+ dias)
- ✅ **Leads Perdidos**: Converte visitantes que não fecharam plano através de nurturing
- ✅ **Falta de Prospecção**: Captação ativa de novos clientes via outbound WhatsApp
- ✅ **Processo Manual**: Elimina follow-up manual das consultoras

### Resultados Esperados
- 📈 **+30-40%** reativação de membros inativos
- 📈 **+15-25%** conversão de leads frios
- 📈 **50-100** novos prospects mensais
- 💰 **+R$50k/ano** em receita adicional

## 🚀 Tecnologias Utilizadas

- **WhatsApp**: Baileys (WhatsApp Web API)
- **Backend**: Fastify + Node.js
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: Bull (Redis)
- **Logger**: Pino
- **Validation**: Zod

## 📁 Estrutura do Projeto

```
Academia-WhatsApp-Automation/
├── src/
│   ├── whatsapp/              # Integração WhatsApp
│   │   ├── WhatsAppBusinessConnector.js
│   │   ├── MessageTemplates.js
│   │   └── RateLimiter.js
│   ├── automation/            # Fluxos de automação
│   │   ├── AutomationEngine.js
│   │   ├── ReactivationFlow.js
│   │   ├── NurturingFlow.js
│   │   └── OutboundFlow.js
│   ├── fitness/              # Lógica específica de academia
│   │   ├── MemberService.js
│   │   └── ConversionAnalytics.js
│   ├── integrations/         # Integrações externas
│   │   └── AcademiaSystemAPI.js
│   └── database/             # Camada de dados
│       ├── DatabaseManager.js
│       └── models/
├── tests/                    # Testes automatizados
├── docs/                     # Documentação
├── config/                   # Configurações
├── scripts/                  # Scripts de deploy/manutenção
└── logs/                     # Logs do sistema
```

## ⚙️ Configuração e Instalação

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- WhatsApp Business Account

### 2. Instalação
```bash
# Clone e acesse o projeto
cd "C:/Users/User/OneDrive/Sistemas PrimeLion/Clients/Active/Academia-WhatsApp-Automation"

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Execute as migrações do banco
npm run migrate

# Inicie o sistema
npm run dev
```

### 3. Configuração do .env

```bash
# WhatsApp Configuration
WHATSAPP_SESSION=academia_session_prod
WHATSAPP_AUTO_REPLY=true
WHATSAPP_QR_TIMEOUT=60000

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/academia_whatsapp_db"

# Server Configuration
PORT=3001
NODE_ENV=production

# Academia Integration
ACADEMIA_SYSTEM_URL="http://sistema-academia.local/api"
ACADEMIA_API_KEY="sua_api_key_aqui"

# Automation Settings
MAX_MESSAGES_PER_HOUR=100
MESSAGE_DELAY_MS=2000
```

## 🔄 Fluxos de Automação

### 1. Reativação de Membros Inativos

**Gatilho**: Membro inativo há 15+ dias

```
Dia 0  → "Oi João! Sentimos sua falta na academia 💪"
Dia 3  → "Sabemos que a rotina pode apertar..."
Dia 7  → "Não queremos te perder! Temos opções flexíveis"
Dia 14 → "Última mensagem automática. Respeitamos sua decisão ❤️"
```

### 2. Nurturing de Leads Frios

**Gatilho**: Visitou mas não fechou há 3+ dias

```
Dia 1  → "Foi um prazer te receber na academia!"
Dia 3  → "Criei um plano personalizado baseado no seu perfil"
Dia 7  → "Proposta especial válida até amanhã!"
Dia 14 → "Última chance da promoção"
```

### 3. Captação Cold Outbound

**Gatilho**: Prospect local identificado

```
Passo 1 → "Oi! Você mora no [Bairro], certo? Você treina em algum lugar?"
Passo 2 → Resposta personalizada baseada na resposta
         • "Não treino" → Promoção para moradores do bairro
         • "Treino em outro lugar" → Day pass gratuito
         • "Não tenho tempo" → Treinos expressos de 20min
```

## 🎮 API Endpoints

### Status e Monitoramento
```bash
GET /health                    # Status geral do sistema
GET /whatsapp/status          # Status da conexão WhatsApp
GET /analytics/dashboard      # Dashboard de métricas
```

### Envio de Mensagens
```bash
POST /whatsapp/send           # Enviar mensagem manual
POST /whatsapp/send-template  # Enviar template aprovado
```

### Controle de Automação
```bash
POST /automation/start        # Iniciar automações
POST /automation/stop         # Parar automações
POST /automation/trigger/reactivation   # Trigger manual reativação
POST /automation/trigger/nurturing      # Trigger manual nurturing
```

## 📊 Métricas e Analytics

### KPIs Principais
- **Taxa de Resposta**: Meta >25% (reativação)
- **Taxa de Conversão**: Meta >15% (nurturing) 
- **Taxa de Aquisição**: Meta >5% (outbound)
- **ROI Mensal**: Meta >R$4.200/mês

### Dashboard em Tempo Real
- Mensagens enviadas/recebidas hoje
- Conversas ativas
- Fila de mensagens
- Status das automações
- Impacto na receita

## 🔐 Compliance e Segurança

### WhatsApp Business Policy
- ✅ Rate limiting (100 msg/hora máximo)
- ✅ Templates aprovados pelo WhatsApp
- ✅ Opt-out imediato ("STOP", "SAIR")
- ✅ Conteúdo dentro das diretrizes

### LGPD
- ✅ Consentimento explícito obrigatório
- ✅ Dados criptografados em repouso
- ✅ Direito ao esquecimento
- ✅ Retenção limitada (6 meses)

### Logs e Auditoria
- ✅ Todas as interações logadas
- ✅ Trilha de auditoria completa
- ✅ Monitoramento de falhas
- ✅ Alertas de segurança

## 🚀 Deployment

### Desenvolvimento
```bash
npm run dev     # Servidor em modo desenvolvimento
npm run test    # Executar testes
npm run lint    # Verificar código
```

### Produção
```bash
npm start                    # Iniciar em produção
npm run migrate             # Executar migrações
npm run seed                # Dados iniciais (opcional)
```

### Docker
```bash
docker-compose up -d        # Subir todos os serviços
docker-compose logs -f app  # Acompanhar logs
```

## 🛠️ Troubleshooting

### Problemas Comuns

**WhatsApp não conecta**
- Verificar se o QR code foi escaneado
- Checar se o número não está bloqueado
- Validar permissões da conta Business

**Mensagens não são entregues**
- Verificar rate limiting
- Checar status dos templates
- Validar formato dos números de telefone

**Banco de dados**
- Executar `npm run migrate` para updates
- Verificar conexão no .env
- Checar logs para erros SQL

### Logs Importantes
```bash
tail -f logs/app.log         # Log geral da aplicação
tail -f logs/whatsapp.log    # Log específico WhatsApp
tail -f logs/automation.log  # Log das automações
```

## 📞 Suporte

Para suporte técnico ou dúvidas sobre implementação:

- **Email**: suporte@lionconsultoria.com
- **WhatsApp**: +55 11 99999-9999
- **Documentação**: [Link para docs detalhadas]

---

## 💰 ROI Projetado

### Investimento
- **Setup**: R$15.000 (uma vez)
- **Mensalidade**: R$3.500/mês
- **Total Ano 1**: R$57.000

### Retorno (Academia 300 membros)
- **Reativação**: +20 membros × R$150 = R$3.000/mês
- **Nurturing**: +5 conversões × R$150 = R$750/mês  
- **Outbound**: +3 novos × R$150 = R$450/mês
- **Total**: R$4.200/mês = **R$50.400/ano**

**Payback**: 4 meses | **ROI**: 344% ao ano

---

**Desenvolvido por Lion Consultoria - Marketing Automation Specialists**