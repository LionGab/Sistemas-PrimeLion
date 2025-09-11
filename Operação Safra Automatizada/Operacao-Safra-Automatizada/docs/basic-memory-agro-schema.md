# Basic-Memory Agro Knowledge Schema

## Domínios de Conhecimento Estruturados

### 1. TOTVS Agro Integration
```markdown
# Entity: TOTVS Multicultivo API
- **Type**: ERP System
- **Scope**: Agribusiness automation
- **Relations**: 
  - integrates_with → NFP-e Generation
  - provides → Farm Management Data
  - connects_to → SEFAZ-MT Services

## Observations:
- Authentication: OAuth2 with farm-specific tokens
- Rate Limits: 1000 req/hour per farm
- Key Endpoints: /talhoes, /safra, /estoque, /movimentacoes
```

### 2. NFP-e Compliance 
```markdown
# Entity: NFP-e SEFAZ-MT
- **Type**: Tax Compliance System  
- **Scope**: Fiscal automation
- **Relations**:
  - validates → Farm Tax Data
  - transmits_to → SEFAZ-MT Portal
  - requires → TOTVS Integration

## Observations:
- Schema Version: MT v4.00 (current)
- Validation Rules: XML Schema + Business Rules
- Transmission: Web Services SOAP/REST
- Backup Requirements: 7 years fiscal retention
```

### 3. Multi-Farm Operations
```markdown
# Entity: Fazenda Brasil (Cliente Reference)
- **Type**: Agricultural Enterprise
- **Scope**: Multi-talhão operations
- **Relations**:
  - uses → TOTVS Agro System
  - generates → NFP-e Documents  
  - manages → Crop Cycles (soja, milho, algodão)

## Observations:
- Scale: 5000+ hectares
- Integration Complexity: High (legacy + modern)
- Compliance Level: 100% SEFAZ-MT
- ROI Target: 300%+ efficiency improvement
```

### 4. Compliance Patterns
```markdown
# Entity: SPED Fiscal Automation
- **Type**: Tax Reporting System
- **Scope**: Automated compliance
- **Relations**:
  - processes → TOTVS Transaction Data
  - validates → Fiscal Entries
  - submits_to → Receita Federal

## Observations:
- Frequency: Monthly + Annual
- Data Sources: ERP + Manual Entries
- Validation: Pre-submission checks mandatory
- Error Handling: Retry logic + manual fallback
```

## Knowledge Indexing Strategy

### Search Patterns
- **Semantic**: "Como integrar TOTVS com NFP-e?"
- **Exact**: "SEFAZ-MT API endpoints"  
- **Contextual**: "Fazenda Brasil implementation patterns"
- **Temporal**: "Latest NFP-e schema updates"

### Relationship Mapping
- **Technical**: API → Schema → Implementation
- **Business**: Farm → Process → Compliance → ROI
- **Temporal**: Planning → Implementation → Validation → Optimization

### Update Triggers
- New TOTVS API versions
- SEFAZ-MT regulation changes
- Client implementation learnings
- Performance optimization patterns

Data: 2025-09-02
Status: Schema pronto para implementação ✅