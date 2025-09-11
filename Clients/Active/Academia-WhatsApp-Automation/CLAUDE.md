# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture

This is a **WhatsApp Business automation system** for fitness academies, built with TypeScript/Node.js and focused on member reactivation, lead nurturing, and billing automation. The system integrates with WhatsApp Business API via Baileys and uses enterprise-grade patterns for reliability and compliance.

### Core Technology Stack
- **WhatsApp Integration**: @whiskeysockets/baileys (WhatsApp Web API)
- **Backend Framework**: Fastify (high-performance HTTP server)  
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: BullMQ with Redis
- **Message Templates**: JSON-based template system with variable substitution
- **Logging**: Pino structured logging
- **Authentication**: JWT with refresh tokens

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

# Database setup
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Create and apply migrations

# Development server
npm run dev                 # Start with hot reload on port 3001

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

# TypeScript compilation
npm run build            # Build TypeScript to dist/
npm run dev              # Development server with hot reload
```

### Deployment
```bash
npm run deploy           # Production deployment script
```

## Critical Configuration Files

### Automation Flow Configuration (`automation_flows.json`)
Defines the complete automation sequences with triggers, timing, personalization rules, and success metrics. Each flow includes:
- **Trigger conditions**: Days inactive, member status, consent requirements
- **Multi-stage sequences**: Timed messages with conditional logic  
- **Personalization rules**: Variable substitution, segmentation, offers
- **Compliance controls**: Rate limiting, opt-out handling, stop words

### Academy Configuration (`academy.config.json`)
Contains academy-specific settings:
- **Business details**: Name, contact info, operating hours
- **Integration settings**: Payment gateways, calendar sync, CRM connections
- **Automation parameters**: Message limits, delays, compliance settings
- **Template variables**: Academy-specific content for message personalization

### Message Templates (`message_templates.json`)
WhatsApp-approved templates with variable substitution:
- **Template categories**: Onboarding, financial, reminders, reactivation, educational
- **Variable mapping**: Dynamic content insertion (names, dates, amounts, links)
- **Media support**: Optional images/videos for enhanced engagement
- **A/B testing**: Multiple template versions for optimization

## Architecture Patterns

### WhatsApp Business Reliability
- **Connection Management**: Auto-reconnection with exponential backoff
- **Rate Limiting**: 100 messages/hour with queue overflow handling  
- **Message Queue**: Persistent delivery with retry logic
- **Session Management**: Multi-file auth state with QR code handling

### Database Design  
- **Member Lifecycle**: Status tracking (ATIVO, INATIVO, VISITANTE, SUSPENSO)
- **Message Tracking**: Full audit trail with delivery confirmation
- **Payment Integration**: Automated billing state management
- **Analytics Storage**: Time-series data for performance metrics

### MCP (Multi-Agent Controller) Pattern
Each automation type has a dedicated controller with:
- **Initialization**: Database connections, queue setup, scheduler configuration
- **Trigger Logic**: Member segmentation and condition checking
- **Sequence Management**: Multi-step workflow execution
- **Response Handling**: Inbound message processing and conversation state
- **Analytics**: Performance tracking and ROI calculation

### Business Compliance
- **LGPD Compliance**: Explicit consent, data retention, right to deletion
- **WhatsApp Business Policy**: Template approval, opt-out respect, content guidelines
- **Rate Limiting**: Strict adherence to API limits to prevent account suspension
- **Audit Trails**: Complete message history for compliance reporting

## Key Implementation Details

### Server Architecture (`src/backend/server.ts`)
The main Fastify server implements a comprehensive REST API with:
- **Authentication middleware**: JWT-based auth with role-based access  
- **Rate limiting**: Per-endpoint protection against abuse
- **Comprehensive routing**: Member management, automation control, analytics
- **Real-time monitoring**: Health checks, system status, performance metrics
- **Graceful shutdown**: Proper cleanup of connections and processes
- **Type safety**: Zod schemas for request/response validation
- **High performance**: Fastify framework optimized for speed

### WhatsApp Connector (`src/whatsapp/WhatsAppBusinessConnector.js`)
Robust WhatsApp integration featuring:
- **Event-driven architecture**: Incoming message routing to appropriate MCPs  
- **Media handling**: Support for images, videos, documents with type detection
- **Interactive messages**: Button and list support for enhanced UX
- **Connection resilience**: Auto-recovery from network issues and WhatsApp downtime

### Message Processing Pipeline
1. **Inbound messages** → Phone number lookup → Member identification
2. **Member status routing** → Appropriate MCP (Reactivation/Nurturing/Billing)
3. **Context handling** → Conversation state tracking and response generation
4. **Database logging** → Complete audit trail with timestamps and status

### Analytics and ROI Tracking
The system provides comprehensive business metrics:
- **Reactivation success**: Members who resume training within 30 days
- **Lead conversion**: Visitors who sign up after nurturing sequence  
- **Revenue impact**: Direct ROI calculation from automation activities
- **Performance monitoring**: Message delivery rates, response times, system health

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

# Server
PORT=3001
NODE_ENV=production
```

### Academia System Integration
The system expects integration with existing academy management software:
- **Member data sync**: Real-time status updates, payment confirmations
- **Attendance tracking**: Automatic inactivity detection
- **Billing integration**: Payment gateway webhooks for automation triggers

## Business Metrics and Success Criteria

### Primary KPIs
- **Reactivation Rate**: Target 30% of inactive members returning
- **Lead Conversion**: Target 15% of cold leads converting to paid members  
- **Revenue Impact**: Target R$4,200/month additional revenue
- **System Reliability**: >99% WhatsApp connection uptime

### Compliance Monitoring
- All automations respect WhatsApp Business Policy (rate limits, templates, opt-outs)
- LGPD compliance with explicit consent and data retention policies
- Complete audit trails for regulatory compliance
- Automated opt-out processing with immediate effect

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

#### Environment Variables
```bash
# Search and Analysis
BRAVE_API_KEY=your_brave_api_key

# Communication
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your_signing_secret

# Google Services
# (credentials stored in config/ directory)

# Development and Monitoring
LINEAR_API_KEY=your_linear_key
LINEAR_TEAM_ID=your_team_id
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

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

## Project File Structure

### Core Directories
- `src/backend/`: Fastify server implementation and API routes
- `src/whatsapp/`: WhatsApp Business API integration (Baileys)
- `src/automation/`: Business automation flows and logic
- `src/mcps/`: Multi-Agent Controller Pattern implementations
- `src/integrations/`: MCP and external service integrations
- `src/fitness/`: Domain-specific business logic for fitness academies
- `src/database/`: Database operations and models
- `prisma/`: Database schema and migrations
- `tests/`: Test suites for automation and integration testing
- `scripts/`: Deployment and maintenance scripts
- `config/`: Service configuration files
- `logs/`: Application and automation logs

### Key Configuration Files
- `automation_flows.json`: Complete automation sequence definitions
- `academy.config.json`: Academy-specific business settings
- `message_templates.json`: WhatsApp-approved message templates
- `mcp.config.json`: MCP server definitions and integration rules
- `package.json`: Dependencies and npm scripts
- `prisma/schema.prisma`: Database schema definition

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

### **Audit Execution Commands**

#### **NPM Scripts**
```bash
npm run audit:complete          # Full system audit
npm run audit:whatsapp         # WhatsApp-specific audit
npm run audit:compliance       # LGPD compliance check
npm run audit:performance      # Performance benchmarks
npm run audit:roi              # Business impact analysis
```

#### **Claude Code Integration**
```bash
/audit complete                # Complete audit via Claude Code
/audit whatsapp               # WhatsApp performance check
/audit compliance             # LGPD compliance validation
/audit performance            # System performance analysis  
/audit roi                    # ROI and business metrics
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

---

This system represents a sophisticated integration of marketing automation, CRM functionality, WhatsApp Business capabilities, and enterprise-grade MCP integrations, specifically designed for the fitness industry's unique retention and acquisition challenges.