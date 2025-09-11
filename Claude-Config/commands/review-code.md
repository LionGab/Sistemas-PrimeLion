# Independent Code Review (Multi-Claude Strategy)

Perform systematic code review using independent Claude perspective:

**Code/PR to Review:** $ARGUMENTS

## REVIEW PROTOCOL (INDEPENDENT VERIFICATION):

### 1. **Architecture Review**
- **Design Patterns**: Adherence to established patterns
- **SOLID Principles**: Single responsibility, open/closed, etc.
- **Simplicity**: Avoid over-engineering, maintain clean architecture
- **Dependencies**: Appropriate use of external libraries
- **Scalability**: Future growth considerations

### 2. **Code Quality Assessment**
```markdown
## Quality Checklist:
- [ ] **Readability**: Clear variable/function names
- [ ] **Documentation**: Comments explain WHY, not WHAT
- [ ] **Error Handling**: Proper exception management
- [ ] **Performance**: No obvious bottlenecks
- [ ] **Security**: No exposed secrets or vulnerabilities
- [ ] **Testing**: Adequate test coverage
- [ ] **LGPD Compliance**: Data privacy considerations
```

### 3. **Business Logic Validation**
- **Requirements Alignment**: Code matches specifications
- **ROI Impact**: Changes deliver measurable business value
- **User Experience**: Maintains or improves UX
- **Performance Standards**: Meets Lion project benchmarks (<2.5s LCP)

### 4. **Integration Testing Focus**
- **API Integrations**: Calendly, WhatsApp, Analytics properly handled
- **Data Flow**: Correct information processing and storage
- **Error Recovery**: Graceful degradation and fallback mechanisms
- **Monitoring**: Proper logging and metrics collection

### 5. **Security and Compliance**
- **LGPD Requirements**: Personal data handling compliance
- **Input Validation**: SQL injection, XSS prevention
- **Authentication**: Proper session and token management
- **Secrets Management**: No hardcoded credentials

## REVIEW DELIVERABLES:
- **Executive Summary**: High-level assessment for business stakeholders
- **Technical Details**: Specific issues and recommendations for developers
- **Priority Matrix**: Critical/High/Medium/Low categorized findings
- **Action Items**: Specific steps to address identified issues
- **Approval/Rejection**: Clear recommendation with justification

## REVIEWER MINDSET:
- **Independent perspective** - assume nothing, verify everything
- **Business-first** - prioritize user and business impact
- **Security-conscious** - better safe than sorry
- **Performance-aware** - speed is a feature
- **Quality-focused** - technical debt is business debt

This review should be performed by a separate Claude instance from the implementer.