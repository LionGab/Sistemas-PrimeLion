# Claude Code - Common Workflows

## Fonte
- URL: https://docs.anthropic.com/en/docs/claude-code/common-workflows
- Tipo: Documentação oficial Anthropic
- Status: ✅ Processado

## Principais Workflows Identificados

### 1. Entendimento de Codebases
- **Overview rápido**: `cd /path/to/project && claude` → `give me an overview of this codebase`
- **Arquitetura**: Perguntas sobre padrões arquiteturais, modelos de dados, autenticação
- **Busca de código**: Localizar funcionalidades específicas com linguagem de domínio

### 2. Correção de Bugs
- Compartilhar mensagens de erro com Claude
- Solicitar recomendações de correção
- Aplicar correções com verificação

### 3. Refatoração de Código
- Identificar código legado/deprecated
- Sugestões de modernização (ES2024, etc.)
- Aplicação incremental com testes

### 4. Subagentes Especializados
- **Comando**: `/agents` para visualizar disponíveis
- **Delegação automática**: Claude escolhe subagente apropriado
- **Criação customizada**: Subagentes específicos do projeto em `.claude/agents/`
- **Tipos**: code-reviewer, debugger, api-designer, performance-optimizer

### 5. Plan Mode (Modo Planejamento)
- **Ativação**: `claude --permission-mode plan` ou Shift+Tab
- **Uso**: Análise read-only, planejamento de mudanças complexas
- **Casos**: Multi-step implementation, exploração de código, desenvolvimento iterativo

### 6. Trabalho com Testes
- Identificar código não testado
- Gerar scaffolding de testes
- Casos edge e condições de erro
- Execução e verificação

### 7. Pull Requests
- Sumarização de mudanças
- Geração automática: `create a pr`
- Refinamento de descrições
- Detalhes de testes

### 8. Documentação
- Identificar código não documentado
- Gerar JSDoc/docstrings
- Verificar padrões do projeto

### 9. Trabalho com Imagens
- **Métodos**: Drag & drop, Ctrl+V, path reference
- **Análises**: UI elements, diagramas, screenshots de erro
- **Geração**: CSS/HTML a partir de mockups

### 10. Referência de Arquivos
- **Sintaxe**: `@src/utils/auth.js` (arquivo), `@src/components` (diretório)
- **MCP Resources**: `@github:repos/owner/repo/issues`
- **Contexto**: Inclui CLAUDE.md automaticamente

## Insights para ERPs Agro

### Aplicabilidade Direta
1. **Análise de Codebases Legados**: Útil para entender sistemas ERP existentes
2. **Refatoração Incremental**: Modernizar módulos fiscais/agro sem quebrar funcionalidades
3. **Subagentes Especializados**: 
   - `fiscal-compliance-reviewer`: Verificar conformidade SPED/NFe
   - `agro-operations-optimizer`: Otimizar fluxos de talhão/safra
   - `integration-tester`: Validar APIs com cooperativas/bancos

### Workflows Específicos para Agro
1. **Compliance Fiscal**: Plan Mode para analisar impacto de mudanças regulatórias
2. **Integração Cooperativas**: Subagentes para validar EDI/APIs específicas
3. **Offline-First**: Refatoração para suporte offline em aplicações de campo
4. **Documentação Técnica**: Gerar docs para integrações complexas (SEFAZ-MT, INDEA)

## Limitações Identificadas
- Não menciona integração com sistemas legados
- Falta de workflows específicos para compliance regulatório
- Ausência de padrões para sistemas offline-first
- Não aborda integração com protocolos proprietários (CNAB, EDI)

