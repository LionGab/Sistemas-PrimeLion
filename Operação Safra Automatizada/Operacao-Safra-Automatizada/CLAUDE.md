# CLAUDE.md - ENHANCED AGENTIC VERSION
## OPERAÇÃO SAFRA AUTOMATIZADA - SYSTEM PROMPT DEFINITIVO

This file serves as the **definitive system prompt** for Claude Code when working with the Operação Safra Automatizada codebase.

---

## 🎯 CRITICAL DIRECTIVES & KEYWORDS

### **IMPORTANT: Core Compliance Requirements**
- **ALWAYS** validate NFP-e schemas against SEFAZ-MT specifications v4.0
- **NEVER** process fiscal transactions without proper validation gates
- **PROACTIVELY** suggest compliance improvements and risk mitigation
- **ULTRATHINK** when dealing with complex fiscal calculations (FUNRURAL, SENAR)

### **Reasoning Depth Triggers**
- Use **`--think`** for standard fiscal validations
- Use **`--think-hard`** for multi-entity tax calculations
- Use **`--ultrathink`** for compliance architecture decisions
- **IMPORTANT**: All fiscal code changes require `--validate` flag

---

## 🤖 SUBAGENT ARCHITECTURE

### **Specialized Agent Definitions**

#### **1. FiscalComplianceAgent**
**Trigger**: Keywords: "NFP-e", "SPED", "compliance", "fiscal", "SEFAZ"
**Model**: Claude Opus (maximum precision for fiscal calculations)
**Responsibilities**:
- NFP-e generation and validation
- SPED Fiscal processing
- FUNRURAL/SENAR calculations
- SEFAZ-MT API interactions
- Compliance audit trails

**Communication Protocol**:
```markdown
Input: /docs/fiscal_request.md
Output: /docs/fiscal_response.md
Validation: /validation_results/fiscal_compliance_{timestamp}.json
```

#### **2. TOTVSIntegrationAgent**
**Trigger**: Keywords: "TOTVS", "ERP", "Multicultivo", "integração"
**Model**: Claude Sonnet (balanced performance)
**Responsibilities**:
- TOTVS Agro API integration
- Data synchronization workflows
- Schema mapping and transformation
- Error handling and retry logic
- Performance optimization

**Communication Protocol**:
```markdown
Input: /docs/totvs_request.md
Output: /docs/totvs_response.md
Logs: /logs/totvs_integration_{date}.log
```

#### **3. ValidationGateAgent**
**Trigger**: Automatic on all fiscal operations
**Model**: Claude Haiku (high-speed validation)
**Responsibilities**:
- Pre-validation of fiscal data
- Post-processing verification
- Test generation and execution
- Performance benchmarking
- Security scanning

**Communication Protocol**:
```markdown
Input: /docs/validation_request.md
Output: /validation_results/gate_report_{timestamp}.md
Status: /docs/validation_status.json
```

---

## 📋 FISCAL CODING CONVENTIONS

### **IMPORTANT: Compliance-First Development**

#### **NFP-e Generation Pattern**
```python
# ALWAYS use this pattern for NFP-e generation
class NFPeGenerator:
    """
    IMPORTANT: All NFP-e operations must follow SEFAZ-MT v4.0 schema
    PROACTIVELY validate all fiscal data before transmission
    """
    
    async def generate_nfpe(self, data: NFPeData) -> NFPeResult:
        # ULTRATHINK: Complex validation logic
        validation = await self._validate_fiscal_data(data)
        if not validation.is_valid:
            raise FiscalComplianceError(validation.errors)
        
        # Sequential processing with audit trail
        with self._audit_context(data) as audit:
            nfpe = await self._build_nfpe(data)
            signed = await self._sign_digitally(nfpe)
            result = await self._transmit_to_sefaz(signed)
            audit.record(result)
        
        return result
```

#### **TOTVS Integration Pattern**
```python
# IMPORTANT: Always use retry logic for TOTVS APIs
@retry(max_attempts=3, backoff="exponential")
async def sync_with_totvs(self, endpoint: str, data: dict) -> dict:
    """
    PROACTIVELY handle TOTVS API limitations and throttling
    """
    async with self._totvs_session() as session:
        response = await session.post(endpoint, json=data)
        return self._validate_totvs_response(response)
```

---

## 🔐 SECURITY & COMPLIANCE PROTOCOLS

### **CRITICAL: Data Protection Requirements**
- **ALWAYS** encrypt sensitive fiscal data at rest (AES-256)
- **NEVER** log full CPF/CNPJ numbers (mask: XXX.XXX.XXX-XX)
- **PROACTIVELY** validate digital certificates before operations
- **IMPORTANT**: Maintain complete audit trails for 7 years (fiscal requirement)

### **Permission Matrix**
```json
{
  "allowed_operations": {
    "read": ["*.py", "*.md", "*.json", "*.yaml"],
    "write": ["src/**", "tests/**", "docs/**"],
    "execute": ["pytest", "uvicorn", "alembic"],
    "restricted": ["rm", "del", "drop", "truncate"]
  },
  "require_approval": {
    "always": ["bash rm*", "sql DROP*", "sql TRUNCATE*"],
    "production": ["deploy", "migrate", "backup"]
  }
}
```

---

## 🚀 WORKFLOW ORCHESTRATION

### **Plan-Then-Implement Protocol**

#### **Phase 1: Strategic Planning (ULTRATHINK)**
```markdown
1. Analyze fiscal requirements using Sequential Thinking MCP
2. Decompose complex workflows into atomic operations
3. Identify compliance checkpoints and validation gates
4. Create detailed implementation plan with risk assessment
5. Document in /docs/implementation_plan_{feature}.md
```

#### **Phase 2: Implementation (PROACTIVELY)**
```markdown
1. Implement core fiscal logic with validation-first approach
2. Use Serena MCP for semantic code analysis and refactoring
3. Generate comprehensive test suites with ValidationGateAgent
4. Document all fiscal calculations and compliance decisions
```

#### **Phase 3: Validation (IMPORTANT)**
```markdown
1. Run automated compliance tests
2. Execute SEFAZ-MT homologation tests
3. Perform load testing for safra peak periods
4. Generate compliance audit reports
```

---

## 📁 PROJECT STRUCTURE & STANDARDS

### **Source Code Organization**
```
/nfpe-fazenda-brasil/
├── src/
│   ├── fiscal/           # CRITICAL: Fiscal compliance modules
│   │   ├── nfpe/         # NFP-e generation and validation
│   │   ├── sped/         # SPED Fiscal processing
│   │   └── validators/   # Schema and business rule validators
│   ├── integrations/     # IMPORTANT: ERP integrations
│   │   ├── totvs/        # TOTVS Agro Multicultivo
│   │   ├── sap/          # SAP Rural (when applicable)
│   │   └── cooperatives/ # Cooperfibra and others
│   └── core/             # PROACTIVELY maintained utilities
│       ├── security/     # Encryption and authentication
│       ├── audit/        # Compliance audit trails
│       └── monitoring/   # Performance and error tracking
```

### **Testing Standards**
```python
# IMPORTANT: Every fiscal operation must have tests
class TestNFPeGeneration:
    """
    ULTRATHINK: Test coverage must include:
    - Happy path scenarios
    - Edge cases and boundary conditions
    - SEFAZ rejection scenarios
    - Performance under load
    - Security vulnerabilities
    """
    
    @pytest.mark.critical
    async def test_nfpe_compliance(self):
        """CRITICAL: Validates SEFAZ-MT compliance"""
        pass
    
    @pytest.mark.integration
    async def test_totvs_sync(self):
        """IMPORTANT: Tests TOTVS integration reliability"""
        pass
```

---

## 🎮 CUSTOM SLASH COMMANDS

### **Fiscal Automation Commands**

#### `/validateNFPe`
**Description**: Validates NFP-e data against SEFAZ-MT requirements
**Usage**: `/validateNFPe [file_path|json_data]`
**Workflow**:
1. Invokes FiscalComplianceAgent
2. Performs schema validation
3. Checks business rules
4. Returns detailed compliance report

#### `/syncTOTVS`
**Description**: Synchronizes data with TOTVS Agro
**Usage**: `/syncTOTVS [entity_type] [date_range]`
**Workflow**:
1. Invokes TOTVSIntegrationAgent
2. Fetches data from TOTVS
3. Transforms and validates
4. Updates local database

#### `/auditCompliance`
**Description**: Runs complete fiscal compliance audit
**Usage**: `/auditCompliance [start_date] [end_date]`
**Workflow**:
1. Invokes ValidationGateAgent
2. Analyzes all fiscal transactions
3. Identifies compliance issues
4. Generates audit report

#### `/generateSPED`
**Description**: Generates SPED Fiscal files
**Usage**: `/generateSPED [period] [type]`
**Workflow**:
1. Collects fiscal data
2. Applies SPED layout rules
3. Validates completeness
4. Prepares for transmission

---

## 📊 PERFORMANCE BENCHMARKS

### **CRITICAL: Safra Period Requirements**
- NFP-e generation: < 3.2s per document
- Batch processing: 120 NFP-e/hour minimum
- TOTVS sync: < 30s for 1000 records
- Database queries: < 100ms for fiscal lookups
- API response time: < 500ms p95

### **Monitoring Metrics**
```python
# IMPORTANT: Track these KPIs continuously
FISCAL_METRICS = {
    "nfpe_success_rate": 0.989,  # Target: 98.9%
    "sefaz_availability": 0.999,  # Target: 99.9%
    "compliance_score": 1.0,      # Target: 100%
    "processing_time_p50": 2.8,   # Seconds
    "processing_time_p99": 5.0,   # Seconds
}
```

---

## 🧪 VALIDATION GATES

### **Pre-Implementation Validation**
- [ ] Fiscal requirements documented
- [ ] SEFAZ schemas updated
- [ ] Test data prepared
- [ ] Compliance checklist reviewed

### **Post-Implementation Validation**
- [ ] All tests passing (100% critical coverage)
- [ ] SEFAZ homologation successful
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Audit trail verified

---

## 🔄 CONTINUOUS IMPROVEMENT

### **PROACTIVELY Monitor and Optimize**
1. **Weekly**: Review SEFAZ rejection logs
2. **Monthly**: Analyze performance metrics
3. **Quarterly**: Update compliance protocols
4. **Annually**: Full security audit

### **IMPORTANT: Knowledge Management**
- Document all SEFAZ rejections and solutions
- Maintain pattern library for common scenarios
- Update MCP server memories with learnings
- Share insights across fazenda implementations

---

## 🚨 EMERGENCY PROTOCOLS

### **CRITICAL: Fiscal Emergency Response**
```markdown
1. **NFP-e Transmission Failure**
   - Switch to contingency mode
   - Queue for retry with exponential backoff
   - Alert fiscal team immediately
   - Document in /logs/fiscal_emergency.log

2. **TOTVS Integration Failure**
   - Activate local cache mode
   - Process with cached data
   - Schedule reconciliation
   - Notify integration team

3. **Compliance Violation Detected**
   - Halt all fiscal operations
   - Generate compliance report
   - Initiate correction workflow
   - Escalate to compliance officer
```

---

## 💡 OPTIMIZATION KEYWORDS

**Strategic Keywords for Enhanced Claude Performance:**

- **`IMPORTANT`**: Triggers careful attention to fiscal requirements
- **`CRITICAL`**: Ensures maximum validation and security
- **`PROACTIVELY`**: Encourages preventive measures and optimizations
- **`ULTRATHINK`**: Activates deep reasoning for complex fiscal logic
- **`VALIDATE`**: Forces comprehensive testing and verification

**Usage Example:**
```python
# CRITICAL: ULTRATHINK required for complex FUNRURAL calculation
# IMPORTANT: PROACTIVELY validate all input data
# This function handles multi-entity tax scenarios that require
# deep fiscal knowledge and careful validation
```

---

*This enhanced CLAUDE.md serves as the definitive guide for all Claude Code operations within the Operação Safra Automatizada project. It ensures compliance, performance, and reliability in every fiscal automation task.*