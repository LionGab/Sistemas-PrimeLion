---
title: TOTVS Agro Multicultivo Integration
created: 2025-09-02
updated: 2025-09-02
tags: [totvs, agro, erp, integration, api]
type: technical-guide
status: active
---

# TOTVS Agro Multicultivo Integration

## Overview
TOTVS Agro Multicultivo is the leading ERP system for agricultural management in Brazil, providing comprehensive farm management capabilities including crop planning, inventory management, and financial control.

## API Authentication
- **Method**: OAuth2 with farm-specific tokens
- **Rate Limits**: 1000 requests/hour per farm
- **Token Expiry**: 24 hours (refresh required)
- **Environment**: Production vs Homologação

## Key Endpoints
### Farm Management
- `/api/v1/talhoes` - Field/plot management
- `/api/v1/safra` - Crop cycle data
- `/api/v1/estoque` - Inventory tracking
- `/api/v1/movimentacoes` - Stock movements

### Integration Patterns
- **Sync Frequency**: Real-time for critical operations, batch for analytics
- **Error Handling**: Retry logic with exponential backoff
- **Data Validation**: Schema validation before API calls
- **Audit Trail**: Complete logging for compliance

## Relationships
- **integrates_with**: NFP-e Generation System
- **provides**: Farm Management Data
- **connects_to**: SEFAZ-MT Services
- **supports**: Multi-farm Operations

## Implementation Notes
- Always validate farm permissions before API calls
- Use webhooks for real-time inventory updates
- Implement circuit breaker pattern for reliability
- Cache frequently accessed data (talhões, produtos)

## Fazenda Brasil Case Study
- **Scale**: 5000+ hectares, 200+ talhões
- **Integration Complexity**: High (legacy + modern systems)
- **Performance**: Sub-2s response time for critical operations
- **Compliance**: 100% SEFAZ-MT adherence