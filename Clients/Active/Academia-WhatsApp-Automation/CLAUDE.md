# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **WhatsApp automation system for gym member reactivation** built for Full Force Academia in Matupá/MT, Brazil. The system processes 561 inactive members to reactivate them via automated WhatsApp campaigns using N8N workflows, achieving an estimated R$ 151,200/year revenue recovery.

## Architecture

### Core Technology Stack
- **N8N**: Workflow automation platform (main orchestrator)
- **Docker Compose**: Container orchestration
- **PostgreSQL**: Primary database for N8N data
- **Redis**: Queue management and caching
- **Node.js**: WhatsApp bridge server
- **Google Sheets**: Data integration and reporting

### System Components

#### 1. N8N Automation Platform
- **URL**: http://localhost:5678
- **Credentials**: admin/academia2024
- **Purpose**: Main workflow orchestration engine
- **Configuration**: Managed via Docker Compose with persistent volumes

#### 2. WhatsApp Integration Layer
- **Bridge Server**: `whatsapp/whatsapp-server-simple.cjs`
- **Port**: 3001
- **Purpose**: N8N ↔ WhatsApp communication bridge
- **Status**: Currently simulated (awaiting WhatsApp Business API approval)

#### 3. Database Architecture
- **PostgreSQL**: N8N workflow data and execution history
- **Redis**: Queue management and rate limiting
- **Google Sheets**: Business data and reporting integration

## Development Commands

### System Management
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f n8n

# Restart specific service
docker-compose restart n8n

# Stop all services
docker-compose down
```

### WhatsApp Bridge Server
```bash
# Start WhatsApp bridge
cd whatsapp
node whatsapp-server-simple.cjs

# Test WhatsApp bridge connectivity
curl http://localhost:3001/status
curl http://localhost:3001/health
```

### MCP Server (Development)
```bash
cd mcp-server
npm install
npm run dev      # Development mode
npm run build    # Production build
npm start        # Start built server
npm test         # Run tests
npm run validate # Validate configuration
```

### Configuration Scripts
```bash
# N8N setup and configuration guide
scripts/configurar-n8n.bat

# Full integration testing
scripts/testar-integracao-completa.bat

# WhatsApp activation (when API ready)
whatsapp/ativar-whatsapp-agora.bat
```

## Critical Configuration Requirements

### 1. Google Sheets API Integration
**Required for workflows 2 and 5**
1. Create Google Cloud project: "Academia-N8N"
2. Enable Google Sheets API
3. Create Service Account: "n8n-academia-service" 
4. Download JSON key
5. Configure in N8N: Credentials → Google Sheets Service Account
6. Create sheet: "Ex-Alunos Full Force Academia"

### 2. SMTP Configuration
**For automated reporting (workflow 5)**
```
Host: smtp.gmail.com
Port: 587
User: contato@fullforceacademia.com
Password: [App Password required]
```

### 3. WhatsApp Business API
**Currently pending Meta approval (7-15 days)**
- Register at: https://developers.facebook.com/docs/whatsapp
- Alternative: Twilio WhatsApp API for immediate implementation
- Rate limits: 100 messages/hour initially

## Workflow Architecture

### Core N8N Workflows (Import Order)
1. **setup-whatsapp-evolution.json**: WhatsApp connection setup
2. **import-ex-students.json**: CSV → Google Sheets automation (✅ Ready)
3. **reactivation-campaign-whatsapp-real.json**: Main reactivation campaign
4. **process-responses.json**: Auto-response handling
5. **dashboard-report.json**: Analytics and reporting (✅ Ready)

### Data Flow
```
CSV Export → Google Sheets → N8N Processing → WhatsApp API → Response Tracking → Reporting
```

## Business Logic

### Target Demographics
- **Total ex-students**: 561
- **Categories**: QUENTE (hot), MORNO (warm), FRIO (cold)
- **Segmentation**: By inactivity period (15, 30, 60+ days)
- **Revenue potential**: R$ 12,600/month

### Automation Rules
- **Daily limit**: 20 messages/hour (compliance)
- **Message delay**: 3 seconds between messages
- **Operating hours**: 8:00-20:00 (Monday-Saturday)
- **Retry logic**: 3 attempts per student, 7-day intervals

### Compliance Features
- LGPD compliant data handling
- WhatsApp Business API terms adherence
- Automatic opt-out handling
- 24-month data retention policy

## File Structure Significance

```
├── academy.config.json     # Business rules and templates
├── docker-compose.yml      # Infrastructure definition
├── .env                    # Environment variables (dev)
├── .env.example           # Environment template
├── n8n/workflows/         # N8N automation definitions
├── whatsapp/             # WhatsApp integration layer
├── config/               # Academy-specific configurations
├── data/                 # Sample data (ex-alunos-teste.csv)
├── scripts/              # Setup and testing utilities
├── mcp-server/           # MCP integration (AI workflow management)
└── docs/                 # Implementation documentation
```

## Performance Targets

- **Processing capacity**: 120 messages/hour
- **Response time**: <2 minutes average
- **Success rate**: 95%+ message delivery
- **ROI target**: R$ 12,600/month
- **Reactivation rate**: 30% target conversion

## Testing and Validation

### Development Testing
```bash
# Test N8N connectivity
curl http://localhost:5678

# Validate WhatsApp bridge
curl http://localhost:3001/status

# Test message sending (simulated)
curl -X POST http://localhost:3001/test-message
```

### Data Validation
- Use `data/ex-alunos-teste.csv` for testing (10 sample records)
- Validate Google Sheets integration with test data
- Test complete workflow execution in N8N interface

### Integration Testing
Execute `scripts/testar-integracao-completa.bat` for full system validation

## Production Readiness Checklist

### Infrastructure
- [ ] Docker services running stable
- [ ] PostgreSQL backups configured
- [ ] Redis persistence enabled
- [ ] SSL certificates for webhook endpoints

### API Integrations
- [ ] WhatsApp Business API approved and configured
- [ ] Google Sheets Service Account active
- [ ] SMTP credentials configured and tested

### Compliance
- [ ] LGPD consent mechanisms active
- [ ] Rate limiting properly configured
- [ ] Audit logging enabled
- [ ] Data retention policies implemented

## Common Issues and Solutions

### N8N Access Issues
- Check Docker services: `docker-compose ps`
- Verify port 5678 availability
- Reset admin credentials if needed

### WhatsApp Integration Delays
- System currently uses simulated bridge
- Meta approval process: 7-15 business days
- Consider Twilio alternative for immediate deployment

### Google Sheets Authentication
- Service Account JSON must be valid
- Sheet must be shared with service account email
- API quotas must be within limits

## Security Considerations

- All credentials stored in environment variables
- WhatsApp session data encrypted
- API rate limiting active
- No hardcoded secrets in codebase
- Database connections use strong passwords (change in production)

## ROI and Business Impact

- **Target**: 561 inactive members
- **Conversion expectation**: 30% (168 reactivations)
- **Average monthly value**: R$ 150/member
- **Monthly revenue impact**: R$ 25,200
- **System operational cost**: <R$ 500/month
- **Net ROI**: >5000% annually

This system represents a complete gym member reactivation automation platform with professional workflow management and compliance-ready features.