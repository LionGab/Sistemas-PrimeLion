# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture

This is a **WhatsApp Business automation system** for fitness academies, built with TypeScript/Node.js and focused on member reactivation, lead nurturing, and billing automation. The system integrates with WhatsApp Business API via Baileys and uses enterprise-grade patterns for reliability and compliance.

**Important Note**: The current repository contains both a React frontend (Create React App) structure and a Node.js backend system. The main application entry point is `src/index.js` which implements a Fastify-based WhatsApp automation server.

### Core Technology Stack
- **WhatsApp Integration**: @whiskeysockets/baileys (WhatsApp Web API)
- **Backend Framework**: Fastify (high-performance HTTP server)  
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: BullMQ with Redis
- **Message Templates**: JSON-based template system with variable substitution
- **Logging**: Pino structured logging
- **Authentication**: JWT with refresh tokens
- **Frontend**: React with TypeScript (Create React App)

### System Architecture
The application follows a **Multi-Agent Controller Pattern (MCP)** where specialized agents handle different automation workflows:

- **ReactivationMCP**: Handles inactive member reactivation (15/30/60 day sequences)
- **NurturingMCP**: Manages lead conversion for visitors who didn't sign up
- **BillingController**: Automates payment reminders and renewal notifications
- **WhatsAppBusinessConnector**: Core messaging layer with rate limiting and queue management

### Key Business Flows
1. **Member Reactivation**: 3-stage sequence (15/30/60 days inactive) with personalized offers
2. **Lead Nurturing**: 5-step conversion funnel for gym visitors  
3. **Billing Automation**: Payment reminders, renewal notifications, and dunning management
4. **Real-time Analytics**: ROI tracking, conversion rates, and business metrics

## Development Commands

### Setup and Installation
```bash
# Install dependencies
npm install

# Database setup (when Prisma is configured)
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Create and apply migrations

# Development server (backend)
npm run dev                 # Start Fastify server with hot reload on port 3001

# Frontend development (React)
npm start                   # Start React development server (if using frontend)

# Production build
npm run build               # Compile TypeScript to dist/
npm start                   # Start production server (requires build first)
```

### Database Operations
```bash
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations  
npm run prisma:deploy      # Deploy to production
npm run prisma:seed        # Seed initial data
```

### Development Utilities
```bash
npm run lint              # ESLint code checking
npm test                 # Run test suite
npm run queue:dev        # BullMQ dashboard (Redis queue dashboard)
npm run docker:up        # Start all services (PostgreSQL, Redis)
npm run docker:down      # Stop all services
```

### MCP (Model Context Protocol) Operations
```bash
# MCP Integration Commands
npm run mcp:install       # Install MCP dependencies
npm run mcp:test          # Test all MCP connections
npm run mcp:setup         # Interactive credential setup

# Analytics and Reporting
npm run analytics:daily   # Generate daily analytics report
npm run backup:weekly     # Run weekly backup workflow

# Audit System
npm run audit:complete    # Full system audit
npm run audit:whatsapp   # WhatsApp-specific audit
npm run audit:compliance # LGPD compliance check
npm run audit:performance # Performance benchmarks
npm run audit:roi        # Business impact analysis
```

### Deployment
```bash
npm run deploy           # Production deployment script
```

## Key Implementation Details

### Main Server (`src/index.js`)
The main Fastify server implements a comprehensive REST API with:
- **WhatsApp Integration**: Full WhatsApp Business API integration via Baileys
- **Automation Engine**: Orchestrates member reactivation, lead nurturing, and billing flows
- **Database Manager**: Handles all database operations and member lifecycle tracking
- **API Endpoints**: Complete REST API for system management and monitoring
- **Graceful Shutdown**: Proper cleanup of WhatsApp connections, automation flows, and database

### Key API Endpoints
- `GET /health` - System health check with component status
- `GET /whatsapp/status` - WhatsApp connection status
- `POST /whatsapp/send` - Manual message sending (testing)
- `POST /automation/start` - Start automation engine
- `POST /automation/stop` - Stop automation engine
- `POST /automation/trigger/reactivation` - Manual reactivation trigger
- `POST /automation/trigger/nurturing` - Manual nurturing trigger
- `GET /analytics/dashboard` - Business analytics and metrics

### Frontend Structure (React/TypeScript)
The React frontend provides administrative interface for:
- **Dashboard Monitoring**: Real-time system status and performance metrics
- **Member Management**: View and manage academy member database
- **Automation Control**: Start/stop automation flows and configure sequences
- **Analytics Reporting**: ROI tracking, conversion rates, and business insights
- **Template Management**: Configure and test WhatsApp message templates

## Architecture Patterns

### WhatsApp Business Reliability
- **Connection Management**: Auto-reconnection with exponential backoff via Baileys
- **Rate Limiting**: 100 messages/hour with queue overflow handling  
- **Message Queue**: Persistent delivery with retry logic using BullMQ
- **Session Management**: Multi-file auth state with QR code handling
- **Event-Driven Architecture**: Message routing to appropriate automation controllers

### Database Design Principles
- **Member Lifecycle**: Status tracking (ATIVO, INATIVO, VISITANTE, SUSPENSO)
- **Message Tracking**: Full audit trail with delivery confirmation
- **Payment Integration**: Automated billing state management
- **Analytics Storage**: Time-series data for performance metrics

### Business Compliance Framework
- **LGPD Compliance**: Explicit consent, data retention, right to deletion
- **WhatsApp Business Policy**: Template approval, opt-out respect, content guidelines
- **Rate Limiting**: Strict adherence to API limits to prevent account suspension
- **Audit Trails**: Complete message history for compliance reporting

## Environment Configuration

### Required Environment Variables
```bash
# WhatsApp Configuration  
WHATSAPP_SESSION=academia_session_prod
MAX_MESSAGES_PER_HOUR=100
MESSAGE_DELAY_MS=2000

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/academia_db"

# Redis Queue
REDIS_URL="redis://localhost:6379"

# JWT Security
JWT_SECRET="your-secure-jwt-secret"

# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0
LOG_LEVEL=info

# MCP Integration
BRAVE_API_KEY=your_brave_api_key
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your_signing_secret
LINEAR_API_KEY=your_linear_key
LINEAR_TEAM_ID=your_team_id
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

## Business Metrics and Success Criteria

### Primary KPIs
- **Reactivation Rate**: Target 30% of inactive members returning
- **Lead Conversion**: Target 15% of cold leads converting to paid members  
- **Revenue Impact**: Target R$4,200/month additional revenue
- **System Reliability**: >99% WhatsApp connection uptime

### Performance Targets
- **Message Delivery Rate**: >95%
- **Response Time**: <2 seconds for API endpoints
- **System Uptime**: >99.5%
- **Member Reactivation**: >30% success rate
- **Lead Conversion**: >15% conversion rate
- **LGPD Compliance**: 100% compliance score

## MCP (Model Context Protocol) Integration

### Overview
The system integrates with **Model Context Protocol servers** to provide enhanced business intelligence, automation, and monitoring capabilities. The MCP integration expands the core WhatsApp automation with enterprise-grade tools for analytics, monitoring, and business operations.

### MCP Architecture
The system uses a **dual-MCP approach**:
- **Internal MCPs**: Custom automation controllers (ReactivationMCP, NurturingMCP, BillingController)
- **External MCPs**: Official MCP servers for specific capabilities

### Available MCP Servers

#### High Priority MCPs (Auto-start)
- **PostgreSQL MCP**: Direct database access for complex queries and analytics
- **Slack MCP**: Team notifications and performance alerts
- **Sentry MCP**: Advanced error monitoring and performance tracking

#### Medium Priority MCPs (On-demand)
- **Filesystem MCP**: Log management, backup operations, report generation
- **Gmail MCP**: Automated email reports and notifications
- **Google Drive MCP**: Document backup and report archival

#### Low Priority MCPs (Optional)
- **Brave Search MCP**: Market research and competitor analysis
- **Puppeteer MCP**: Web scraping for competitor monitoring
- **Linear MCP**: Development task management (development only)

### MCP Operations and Workflows

#### Daily Analytics Workflow
```bash
npm run analytics:daily
```
Automatically executes:
1. Database metrics extraction (PostgreSQL MCP)
2. Business intelligence report generation
3. Email distribution (Gmail MCP)
4. Slack notifications (Slack MCP)
5. Google Drive backup (Google Drive MCP)

#### Weekly Backup Workflow
```bash
npm run backup:weekly
```
Performs:
1. PostgreSQL database backup and compression
2. Log file archival and cleanup (Filesystem MCP)
3. Cloud storage upload (Google Drive MCP)
4. Backup verification and reporting

#### System Health Monitoring
Continuous monitoring via:
- **Error tracking**: Sentry MCP for real-time error detection
- **Performance metrics**: Database performance and queue health
- **Alert system**: Slack notifications for critical issues

### MCP Configuration and Setup

#### Initial Setup
```bash
# Install MCP dependencies
npm run mcp:install

# Interactive credential setup
npm run mcp:setup

# Test all MCP connections
npm run mcp:test
```

#### Configuration Files
- `mcp.config.json`: MCP server definitions and integration rules
- `.env`: Environment variables and API keys
- `config/`: Service-specific credential files (Gmail, Google Drive)

### MCP API Endpoints

#### Status and Management
- `GET /api/mcp/status`: Overall MCP system status
- `GET /api/mcp/servers/:serverId/status`: Individual server status
- `POST /api/mcp/servers/:serverId/start`: Start specific MCP server
- `POST /api/mcp/servers/:serverId/stop`: Stop specific MCP server

#### Business Operations
- `POST /api/mcp/analytics/generate`: Generate comprehensive analytics report
- `POST /api/mcp/competitor-analysis`: Run competitor analysis workflow
- `POST /api/mcp/health-check`: Execute system health monitoring

### Advanced MCP Features

#### Automation Workflows
The system includes pre-configured automation workflows:
- **Daily Analytics**: Scheduled at 8 AM daily
- **Weekly Backup**: Scheduled every Sunday at 2 AM
- **Competitor Analysis**: Weekly market intelligence
- **System Health Check**: Every 15 minutes

#### Error Handling and Resilience
- **Auto-restart**: High-priority servers automatically restart on failure
- **Graceful degradation**: System continues operating if optional MCPs fail
- **Connection pooling**: Efficient resource management
- **Retry logic**: Exponential backoff for failed operations

#### Security and Compliance
- **Credential encryption**: All API keys and tokens encrypted at rest
- **Audit logging**: Complete operation logs for compliance
- **Access control**: Role-based access to MCP operations
- **Rate limiting**: Prevents API quota exhaustion

### Troubleshooting MCP Integration

#### Common Issues
1. **MCP Server Failed to Start**
   - Check environment variables with `npm run mcp:test`
   - Verify credentials with `npm run mcp:setup`
   - Review logs for specific error messages

2. **Missing Dependencies**
   - Ensure all MCP packages installed: `npm run mcp:install`
   - Check system requirements (Node.js 18+, network access)

3. **Authentication Failures**
   - Reconfigure credentials: `npm run mcp:setup`
   - Verify API quotas and billing status
   - Check credential file permissions in `config/` directory

#### Debugging Commands
```bash
npm run mcp:test          # Test all MCP connections
npm run mcp:setup         # Reconfigure credentials
node scripts/test-mcp-connections.js --verbose  # Detailed testing
```

### Performance and Scalability

#### Resource Usage
- **Memory**: ~50-100MB per active MCP server
- **Network**: Dependent on API usage patterns
- **Disk**: Log rotation and backup management included

#### Scaling Considerations
- MCP servers can be distributed across multiple instances
- Database connections pooled for efficiency
- Rate limiting prevents API quota exhaustion
- Queue-based processing for high-volume operations

## 🔍 Comprehensive Audit System

The system includes a **sophisticated audit framework** based on the proven methodology from Operação Safra Automatizada, specifically adapted for WhatsApp automation in fitness academies.

### **Audit Architecture**

#### **Specialized Audit Agents**
- **WhatsApp Performance Auditor**: Message delivery, rate limiting, connection stability
- **Automation Flow Analyzer**: Reactivation, nurturing, billing effectiveness  
- **LGPD Compliance Validator**: Data protection, consent management, audit trails
- **Member Experience Auditor**: Message quality, response handling, UX optimization
- **Technical Infrastructure Auditor**: Database performance, system reliability, security
- **ROI & Business Impact Analyzer**: Revenue generation, cost savings, business metrics

### **Audit API Endpoints**

#### **Core Audit Operations**
```bash
POST /api/audit/complete        # Complete system audit (all categories)
POST /api/audit/whatsapp        # WhatsApp performance audit
POST /api/audit/compliance      # LGPD compliance audit  
POST /api/audit/performance     # System performance audit
POST /api/audit/roi             # ROI and business impact audit
```

#### **Audit Management**
```bash
GET /api/audit/dashboard        # Real-time audit dashboard
GET /api/audit/reports          # List all audit reports
GET /api/audit/reports/:id      # Get specific audit report
```

### **Audit Metrics & Benchmarks**

#### **Performance Targets**
- **Message Delivery Rate**: >95%
- **Response Time**: <2 seconds
- **System Uptime**: >99.5%
- **Member Reactivation**: >30%
- **Lead Conversion**: >15%
- **LGPD Compliance**: 100%

#### **Business Impact KPIs**
- **Revenue per Member**: R$150-300/month
- **Reactivation ROI**: >300%
- **Operational Efficiency**: >80% time savings
- **Member Satisfaction**: >4.5/5.0

### **Audit Output Formats**

#### **Executive Summary Report**
- **Format**: PDF with executive dashboard
- **Length**: 2-3 pages maximum
- **Content**: Key findings, ROI projections, priority actions
- **Audience**: Academy owners, managers

#### **Technical Analysis Report**
- **Format**: Detailed markdown with code snippets
- **Length**: 10-15 pages
- **Content**: System analysis, optimization recommendations
- **Audience**: Technical teams, developers

#### **Business Intelligence Dashboard**
- **Format**: Interactive web dashboard
- **Content**: Real-time metrics, ROI calculators, trend analysis
- **Features**: Drill-down capabilities, export functions

### **Automated Audit Schedule**
- **Daily**: Performance metrics collection
- **Weekly**: Business impact analysis
- **Monthly**: Comprehensive audit execution
- **Quarterly**: Strategic review and planning

### **Audit Framework Components**
- **AuditController** (`src/audit/AuditController.ts`): Core audit orchestration
- **Audit Framework** (`src/audit/audit_framework.md`): Methodology documentation
- **Claude Command** (`.claude/commands/audit.json`): Claude Code integration
- **Output Directory**: `audit_results/` for reports and dashboards

This comprehensive audit system ensures continuous optimization of the WhatsApp automation platform, delivering measurable business results while maintaining the highest standards of compliance and technical excellence.

## Project Structure

### Current Repository Layout
```
├── public/                 # React public assets
├── src/
│   ├── index.js           # Main Fastify server (WhatsApp automation backend)
│   ├── App.tsx            # React main component
│   ├── index.tsx          # React entry point
│   └── [React components] # Frontend components
├── package.json           # Dependencies and npm scripts
├── CLAUDE.md             # This file
└── [config files]        # Various configuration files
```

### Expected Backend Structure (to be implemented)
```
├── src/
│   ├── backend/           # Fastify server implementation
│   ├── whatsapp/          # WhatsApp Business API integration
│   ├── automation/        # Business automation flows
│   ├── mcps/              # Multi-Agent Controller implementations
│   ├── integrations/      # MCP and external service integrations
│   ├── fitness/           # Domain-specific business logic
│   └── database/          # Database operations and models
├── prisma/                # Database schema and migrations
├── tests/                 # Test suites
├── scripts/               # Deployment and maintenance scripts
├── config/                # Service configuration files
└── logs/                  # Application logs
```

### Critical Configuration Files (to be created)
- `automation_flows.json`: Complete automation sequence definitions
- `academy.config.json`: Academy-specific business settings
- `message_templates.json`: WhatsApp-approved message templates
- `mcp.config.json`: MCP server definitions and integration rules
- `prisma/schema.prisma`: Database schema definition
- `docker-compose.yml`: Development environment services

## Development Workflow

### Getting Started
1. **Clone and Setup**: `npm install` to install all dependencies
2. **Environment**: Configure `.env` file with required variables
3. **Database**: Set up PostgreSQL and run migrations (when Prisma is configured)
4. **Services**: Start Redis for queue management (`npm run docker:up`)
5. **Development**: Run `npm run dev` to start the backend server
6. **Frontend**: Run `npm start` for React development server (optional)

### Common Development Tasks
- **Add Automation Flow**: Modify automation engine and create new MCP controller
- **WhatsApp Templates**: Update message templates and test with WhatsApp Business API
- **Database Changes**: Create Prisma migrations and update schema
- **API Endpoints**: Add new routes to main server file
- **Frontend Components**: Create React components for admin interface

### Testing Strategy
- **Unit Tests**: Test automation logic and WhatsApp integration
- **Integration Tests**: Test end-to-end message flows and database operations
- **Compliance Tests**: Verify LGPD compliance and WhatsApp policy adherence
- **Performance Tests**: Load testing for message throughput and system reliability

---

This system represents a sophisticated integration of WhatsApp Business automation, CRM functionality, and enterprise-grade monitoring capabilities, specifically designed for the fitness industry's unique member retention and lead conversion challenges.