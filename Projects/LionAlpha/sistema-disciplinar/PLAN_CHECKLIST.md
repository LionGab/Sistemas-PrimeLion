# PLAN_CHECKLIST.md - Resumo Executivo e Checklist

## 🎯 RESUMO EXECUTIVO

**Projeto**: Sistema Disciplinar - Auditoria de Segurança e Organização para Deploy  
**Problemas Críticos**: 5 vulnerabilidades de segurança identificadas  
**Estimativa**: 8-10 horas de trabalho em 4 fases  
**Objetivo**: Deploy seguro no GitHub Pages com Firestore protegido

### 🔴 VULNERABILIDADES CRÍTICAS IDENTIFICADAS
1. **Firestore ABERTO**: `allow read, write: if true` - qualquer um pode acessar todos os dados
2. **Páginas administrativas expostas**: debug.html, limpar-tudo.html serão públicas no deploy
3. **Estrutura duplicada**: pasta `sistema-disciplinar/` inteira duplicada aumenta superfície de ataque
4. **Workflows mal posicionados**: `github/workflows/` não funcionará, deve ser `.github/workflows/`
5. **Scripts Node misturados**: sem separação produção/desenvolvimento

### 🎖️ RESULTADOS ESPERADOS
- ✅ Deploy automático seguro (GitHub Pages)
- ✅ Firestore com RBAC (admin/gestor/professor)
- ✅ Páginas administrativas isoladas em `/tools` (versionadas, não publicadas)
- ✅ Autenticação obrigatória para acesso
- ✅ Scripts organizados e documentados

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### 🔧 FASE 1: ORGANIZAÇÃO E DEPLOY SEGURO
**Status**: ⏳ Aguardando aprovação

#### Estruturas e Workflows
- [ ] **1.1** Corrigir localização workflows: `github/workflows/*` → `.github/workflows/*`
- [ ] **1.2** Criar workflow GitHub Pages em `.github/workflows/gh-pages.yml`
- [ ] **1.3** Criar estrutura `/public` limpa para produção

#### Isolamento de Arquivos Perigosos
- [ ] **1.4** Mover páginas perigosas para `/tools`:
  - [ ] `debug.html` → `tools/`
  - [ ] `debug-dados.html` → `tools/`
  - [ ] `debug-quick.html` → `tools/`
  - [ ] `test-deploy.html` → `tools/`
  - [ ] `test-configuracoes.html` → `tools/`
  - [ ] `limpar-tudo.html` → `tools/`
  - [ ] `teste-*.html` → `tools/`

#### Limpeza e Proteção
- [ ] **1.5** Remover pasta duplicada `sistema-disciplinar/`
- [ ] **1.6** Criar `.gitignore` robusto (sem ignorar `/tools`)
- [ ] **1.7** Atualizar `package.json` com scripts de desenvolvimento
- [ ] **1.8** Criar `scripts/build-public.js` robusto com validações

#### Testes e Commit
- [ ] **1.9** Testar `npm run build` e `npm run dev`
- [ ] **1.10** Verificar que páginas perigosas não estão em `/public`
- [ ] **1.11** Commit: `chore(ci): Pages + /public + isolamento de /tools e build estático`

### 🔒 FASE 2: SEGURANÇA (FIRESTORE + AUTH)
**Status**: 🔒 Bloqueada (depende da Fase 1)

#### Firestore Security Rules
- [ ] **2.1** Reescrever `firestore.rules` com RBAC seguro
- [ ] **2.2** Implementar claims: admin, gestor, professor
- [ ] **2.3** Bloquear por padrão, permitir apenas autenticados com permissões

#### Sistema de Autenticação
- [ ] **2.4** Criar guard de autenticação frontend
- [ ] **2.5** Melhorar `pages/login.html` com Firebase Auth
- [ ] **2.6** Implementar redirecionamento se não logado
- [ ] **2.7** Criar `assets/js/auth-utils.js` com helpers de permissão

#### Testes e Commit
- [ ] **2.8** Testar fluxo login → dashboard
- [ ] **2.9** Commit: `feat(auth): guardas, login e regras Firestore RBAC`

### ⚙️ FASE 3: SCRIPTS E AUTOMAÇÃO  
**Status**: 🔒 Bloqueada (depende da Fase 2)

#### Organização de Scripts
- [ ] **3.1** Criar pasta `/scripts` e mover utilitários Node:
  - [ ] `import-csv-completo.js` → `scripts/`
  - [ ] `consolidar-dados.js` → `scripts/`
  - [ ] `process-medidas.js` → `scripts/`
  - [ ] `gerar-frequencia-completa.js` → `scripts/`
  - [ ] `firebase-admin.js` → `scripts/`
  - [ ] `auto-sync-github.js` → `scripts/`

#### Gestão de Ambiente
- [ ] **3.2** Criar `.env.example` com placeholders
- [ ] **3.3** Ajustar scripts para usar `process.env`
- [ ] **3.4** Adicionar scripts npm para utilitários

#### Commit
- [ ] **3.5** Commit: `refactor(scripts): organização e env`

### 📚 FASE 4: DOCUMENTAÇÃO VIVA
**Status**: 🔒 Bloqueada (depende da Fase 3)

#### Documentação
- [ ] **4.1** Criar `CLAUDE.md` com padrões do projeto
- [ ] **4.2** Atualizar `README.md` completo
- [ ] **4.3** Documentar índices Firestore necessários

#### Commit
- [ ] **4.4** Commit: `docs: CLAUDE.md + README`

---

## 🚀 CRITÉRIOS DE PRONTO GLOBAIS (DoD)

### ✅ Requisitos Técnicos
- [ ] `npm run dev` serve de `localhost:5173`
- [ ] Deploy automático do `/public` via GitHub Actions
- [ ] Páginas de debug NÃO existem no site publicado
- [ ] Firestore protegido - sem leitura/escrita anônima
- [ ] Autenticação obrigatória para acessar dashboard

### ✅ Requisitos de Segurança
- [ ] Regras Firestore implementadas com RBAC
- [ ] Páginas administrativas perigosas fora do deploy público
- [ ] Credenciais não hardcoded em scripts de produção
- [ ] `.gitignore` protegendo arquivos sensíveis

### ✅ Requisitos de Documentação
- [ ] `README.md` atualizado com setup completo
- [ ] `CLAUDE.md` criado com padrões do projeto
- [ ] Scripts de desenvolvimento funcionais

---

## ⚠️ RISCOS E MITIGAÇÕES - FASE 1

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Paths relativos quebram ao mover para `/public` | Médio | Revisar `href/src` absolutos; ajustar se necessário |
| Exclusão incorreta de `sistema-disciplinar/` | Alto | Inspecionar conteúdo antes da exclusão |
| `npm ci` falha sem lockfile | Baixo | Workflow alterna automaticamente para `npm i` |
| Build falha por dependências ausentes | Médio | Instalar `http-server` e `rimraf` como devDependencies |

**Rollback Fase 1**: `git reset --hard HEAD~1` para reverter commit

---

## 🧪 TESTES MÍNIMOS - FASE 1

```bash
# 1. Build funciona sem erros
npm run build
ls -la public/  # Deve conter apenas: index.html, assets/, pages/, components/

# 2. Servidor local funciona  
npm run dev  # http://localhost:5173 deve carregar index.html

# 3. Páginas perigosas não estão em /public
ls public/ | grep -E "(debug|test|limpar)"  # Deve retornar vazio

# 4. Workflow existe e é válido
cat .github/workflows/gh-pages.yml  # Deve existir e ter sintaxe YAML válida
```

---

**🛑 STATUS ATUAL**: Aguardando **APROVADO FASE 1** para implementar os diffs planejados.

**📋 PROGRESSO GERAL**: 0/4 fases concluídas