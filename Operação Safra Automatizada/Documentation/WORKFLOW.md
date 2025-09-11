# WORKFLOW PADRÃO CLAUDE CODE - LION CONSULTORIA
## Baseado em Best Practices Anthropic + SuperClaude Framework

---

## 🎯 WORKFLOW CORE: EXPLORE → PLAN → CODE → COMMIT

### **FASE 1: EXPLORE** (Sempre Primeiro!)
```bash
# Comandos essenciais de exploração
git status && git branch    # Verificar estado do repo
ls -la                      # Estrutura de arquivos
grep -r "pattern" .         # Buscar padrões no código
```

**Checklist de Exploração:**
- [ ] Ler TODOS os arquivos relevantes antes de codificar
- [ ] Usar `sequential-thinking` MCP para análise complexa
- [ ] Verificar `CLAUDE.md` do projeto para convenções
- [ ] Identificar dependências e padrões existentes
- [ ] **NUNCA pular esta fase** - entendimento > velocidade

### **FASE 2: PLAN** (Documentado)
```markdown
## Keywords de ativação:
- "ultrathink" - Para raciocínio estendido (32K tokens)
- "think-hard" - Para análise profunda (10K tokens)
- "think" - Para análise padrão (4K tokens)
```

**Template de Planejamento:**
```markdown
## IMPLEMENTATION_PLAN.md
### Objetivo: [Descrição clara]
### Análise de Paralelização:
- Operações paralelas: [listar]
- Dependências sequenciais: [listar]
### Tarefas (3-5 incrementos):
1. [ ] Tarefa testável e revisável
2. [ ] Próximo incremento lógico
3. [ ] Validação e testes
### Riscos Identificados:
- Risco 1: [descrição] → Mitigação: [ação]
### Estimativa: [tempo/complexidade]
```

### **FASE 3: CODE** (Incremental)
```bash
# Padrão de implementação
TodoWrite → Uma tarefa in_progress por vez
→ Implementar → Testar → Validar → Próxima tarefa
```

**Quality Gates Obrigatórios:**
```bash
npm run lint        # Ou equivalente do projeto
npm run typecheck   # Verificação de tipos
npm run test        # Testes automatizados
npm run build       # Build sem erros
```

### **FASE 4: COMMIT** (Contextual)
```bash
# Padrão de commit Lion
git add -A
git commit -m "feat: [funcionalidade] 

- Implementado [o que]
- Testado com [cenários]
- ROI esperado: [métrica]

🦁 Lion Consultoria - Claude Code"

# Sempre em feature branch
git checkout -b feature/nome-descritivo
```

---

## ⚡ FLAGS DE OTIMIZAÇÃO (SuperClaude)

### **Flags de Modo**
```markdown
--brainstorm     # Requisitos vagos, descoberta colaborativa
--introspect     # Auto-análise, debugging complexo
--task-manage    # Operações multi-step (>3 etapas)
--token-efficient # Contexto >75%, operações grandes
--uc             # Ultra-comprimido (30-50% menos tokens)
```

### **Flags MCP Servers**
```markdown
--seq            # Sequential-thinking para análise
--magic          # UI components (21st.dev)
--all-mcp        # Máxima complexidade
--no-mcp         # Performance priority
```

### **Flags de Análise**
```markdown
--think          # Análise padrão (~4K tokens)
--think-hard     # Análise profunda (~10K tokens)
--ultrathink     # Máxima profundidade (~32K tokens)
```

---

## 📊 MÉTRICAS DE SUCESSO

### **Performance Targets**
- TFFF: ≤1-2 dias (Time to First Functional Feature)
- Velocidade: 3-5 commits/hora em desenvolvimento ativo
- Qualidade: ≤15% retrabalho por fase
- ROI Cliente: ≥3:1 em 90 dias

### **Quality Metrics**
- Lighthouse Score: >90
- Core Web Vitals: <2.5s LCP
- Conversão: >3% landing pages
- Zero vulnerabilidades de segurança

---

## 🚨 ANTI-PATTERNS (EVITAR!)

### **❌ NÃO FAZER:**
1. **Pular direto para código** sem explorar/planejar
2. **Deixar TODOs** no código principal
3. **Criar features não solicitadas** (YAGNI)
4. **Ignorar convenções existentes** do projeto
5. **Commitar direto na main/master**
6. **Usar ferramentas complexas** quando simples resolve
7. **Esquecer de limpar** arquivos temporários
8. **Skippar testes** para "fazer funcionar"

### **✅ SEMPRE FAZER:**
1. **Explore → Plan → Code → Commit** (nesta ordem)
2. **Uma tarefa in_progress** por vez
3. **Testar antes de marcar completo**
4. **Documentar decisões importantes**
5. **Feature branches** para todo trabalho
6. **Validar ROI** de cada implementação
7. **Limpar workspace** após operações
8. **Root cause analysis** em falhas

---

## 🔧 COMANDOS RÁPIDOS LION

### **Início de Sessão**
```bash
# Sempre começar com:
git status && git branch
cat CLAUDE.md
ls -la
```

### **Desenvolvimento**
```bash
# Criar feature branch
git checkout -b feature/lion-[nome]

# Rodar quality gates
npm run lint && npm run typecheck && npm test

# Deploy local
python -m http.server 8000
```

### **Finalização**
```bash
# Limpar temporários
rm -rf temp/ *.log debug.*

# Commit contextual
git add -A && git commit -m "feat: [descrição]"

# Push para review
git push -u origin feature/lion-[nome]
```

---

## 📝 CHECKLIST DIÁRIO

### **Manhã - Setup**
- [ ] `git pull` nas branches relevantes
- [ ] Revisar `CLAUDE.md` e `TODO_MVP.md`
- [ ] Verificar MCPs instalados
- [ ] Limpar workspace de ontem

### **Durante - Desenvolvimento**
- [ ] Seguir Explore → Plan → Code → Commit
- [ ] TodoWrite para tracking
- [ ] Quality gates antes de commits
- [ ] Documentar decisões em `IMPLEMENTATION_PLAN.md`

### **Noite - Cleanup**
- [ ] Commit de trabalho em progresso
- [ ] Atualizar documentação
- [ ] Limpar arquivos temporários
- [ ] Push para backup remoto

---

## 🎯 REGRA DE OURO

> "Se você não consegue explicar o ROI em uma frase, não implemente."

**Foco Lion**: Cada linha de código deve ter propósito de negócio claro e mensurável.

---

*Última atualização: Workflow otimizado com SuperClaude Framework + Anthropic Best Practices*