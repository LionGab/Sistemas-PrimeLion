# Explore Codebase (Phase 1 of EPCCE)

Perform comprehensive codebase exploration before any implementation:

**Target/Focus:** $ARGUMENTS

## EXPLORATION PROTOCOL (NEVER SKIP):

### 1. **Project Structure Analysis**
- Use `Glob` to map all relevant files and directories
- Identify main entry points and configuration files
- Understand build system and dependencies
- Document architecture patterns and conventions

### 2. **Context Gathering**
- Read ALL relevant files (use `Read` tool extensively)
- Use `/mcp basic-memory` to search Lion project context
- Identify similar implementations and patterns
- Understand business logic and data flows

### 3. **Dependency Mapping** 
- Analyze imports, exports, and module relationships
- Identify shared utilities and common patterns
- Map external integrations and APIs
- Document critical dependencies and constraints

### 4. **Current State Assessment**
- Evaluate existing functionality and performance
- Identify technical debt and improvement opportunities
- Assess security and compliance considerations
- Benchmark against Lion project standards

## USE ADVANCED TOOLS:
- **sequential-thinking MCP**: For complex architectural analysis
- **filesystem MCP**: For comprehensive file exploration
- **puppeteer MCP**: For live system analysis when needed
- **basic-memory**: For historical context and proven patterns

## DELIVERABLE:
Create detailed `EXPLORATION_REPORT.md` covering:
- **Architecture Overview**: High-level system design
- **Key Components**: Critical files and their responsibilities  
- **Dependencies**: Internal and external relationships
- **Constraints**: Technical limitations and requirements
- **Opportunities**: Identified improvement areas
- **Recommendations**: Approach for implementation phase

## QUALITY STANDARD:
- **Understanding > Speed** - thorough exploration prevents costly mistakes
- **Document assumptions** - make implicit knowledge explicit  
- **Identify risks early** - surface potential blockers
- **Map to business value** - connect technical details to outcomes

This exploration phase is MANDATORY before any code changes. Skip at your own risk.