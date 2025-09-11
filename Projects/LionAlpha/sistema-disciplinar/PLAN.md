# PLAN.md - Auditoria e Organização do Sistema Disciplinar

## 1. DIAGNÓSTICO DO ESTADO ATUAL

### Stack Tecnológico
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Firebase/Firestore
- **Autenticação**: Firebase Auth + sistema local híbrido
- **Deploy**: Pretendido para GitHub Pages
- **Scripts**: Node.js para utilitários de dados
- **Teste**: Jest configurado mas não utilizado

### Estrutura Atual
```
sistema-disciplinar/
├── index.html                  # Dashboard principal
├── assets/{css,js,images}/     # Recursos estáticos
├── pages/                      # Páginas internas
├── components/                 # Componentes HTML
├── data/                       # Dados locais (JSON)
├── dados/                      # Mais dados locais
├── *.js (na raiz)             # Scripts Node desorganizados
├── debug*.html                # ⚠️ PÁGINAS DE DEBUG EXPOSTAS
├── test-*.html                # ⚠️ PÁGINAS DE TESTE EXPOSTAS  
├── limpar-tudo.html           # ⚠️ PÁGINA PERIGOSA EXPOSTA
├── github/workflows/          # ⚠️ LOCALIZAÇÃO INCORRETA
└── sistema-disciplinar/       # ⚠️ PASTA DUPLICADA INTEIRA
```

### 🔴 PROBLEMAS CRÍTICOS DE SEGURANÇA

1. **Regras Firestore INSEGURAS**
   - `firestore.rules`: `allow read, write: if true;` (ACESSO PÚBLICO TOTAL)
   - Qualquer pessoa pode ler/escrever todos os dados

2. **Páginas de Debug/Teste Expostas**
   - `debug.html`, `debug-dados.html`, `debug-quick.html`
   - `test-deploy.html`, `test-configuracoes.html`
   - `limpar-tudo.html` (permite DELETAR TODOS OS DADOS)

3. **Credenciais Firebase Expostas**
   - `firebase-config.js` com chaves API em texto plano (comum mas requer cuidado)

4. **Estrutura Duplicada**
   - Pasta `sistema-disciplinar/` duplicada dentro do projeto

5. **Workflows GitHub Mal Posicionados**
   - `github/workflows/` deveria ser `.github/workflows/`

### Riscos de Deploy Atual
- ❌ Páginas administrativas perigosas serão públicas
- ❌ Firestore sem proteção adequada
- ❌ Scripts Node misturados com assets web
- ❌ Sem separação produção/desenvolvimento

## 2. TAREFAS POR FASES

### 🔧 FASE 1: ORGANIZAÇÃO E DEPLOY SEGURO

#### 1.1 Correção de Workflows
- **Tarefa**: Mover `github/workflows/` → `.github/workflows/`
- **Critério de Pronto**: Workflow funcionando em `.github/workflows/gh-pages.yml`

#### 1.2 Criação do Diretório `/public`
- **Tarefa**: Criar estrutura limpa para produção
- **Estrutura**:
  ```
  /public/
  ├── index.html
  ├── assets/
  ├── pages/
  ├── components/
  └── (apenas arquivos de produção)
  ```
- **Critério de Pronto**: Deploy funcional sem páginas de debug

#### 1.3 Separação de Arquivos Debug/Teste
- **Tarefa**: Mover para `/tools` (não publicado)
- **Arquivos a mover**:
  - `debug*.html` → `/tools/`
  - `test-*.html` → `/tools/`
  - `limpar-tudo.html` → `/tools/`
- **Critério de Pronto**: Arquivos perigosos fora do deploy

#### 1.4 Limpeza da Duplicação
- **Tarefa**: Remover pasta `sistema-disciplinar/` duplicada
- **Critério de Pronto**: Estrutura limpa sem duplicações

#### 1.5 Criação de .gitignore
- **Tarefa**: Adicionar proteções adequadas
- **Conteúdo**:
  ```
  *.csv
  /exports
  /logs
  service-account*.json
  .env*
  /tools
  node_modules/
  .DS_Store
  *.log
  ```
- **Critério de Pronto**: Arquivos sensíveis protegidos

#### 1.6 Workflow de Deploy GitHub Pages
- **Tarefa**: Criar `.github/workflows/gh-pages.yml`
- **Funcionalidade**: Deploy automático do `/public` a cada push main
- **Critério de Pronto**: Deploy automático funcionando

### 🔒 FASE 2: SEGURANÇA (FIRESTORE + AUTH)

#### 2.1 Regras Firestore Seguras
- **Tarefa**: Reescrever `firestore.rules` com RBAC
- **Regras propostas**:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Bloquear tudo por padrão
      match /{document=**} {
        allow read, write: if false;
      }
      
      // Permitir apenas usuários autenticados com claims adequados
      match /alunos/{document} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          (request.auth.token.admin == true || 
           request.auth.token.professor == true);
      }
      
      match /medidas/{document} {
        allow read, write: if request.auth != null && 
          (request.auth.token.admin == true || 
           request.auth.token.gestor == true ||
           request.auth.token.professor == true);
      }
      
      match /frequencia/{document=**} {
        allow read, write: if request.auth != null && 
          request.auth.token.professor == true;
      }
      
      // Dados administrativos - só admin
      match /configuracoes/{document=**} {
        allow read, write: if request.auth != null && 
          request.auth.token.admin == true;
      }
    }
  }
  ```
- **Critério de Pronto**: Firestore protegido com RBAC funcional

#### 2.2 Sistema de Autenticação Integrado
- **Tarefa**: Criar guard de autenticação no frontend
- **Implementar**:
  - Verificação de login em todas as páginas
  - Redirecionamento para login se não autenticado
  - `pages/login.html` simples (email/senha Firebase Auth)
- **Critério de Pronto**: Todas as páginas protegidas por autenticação

#### 2.3 Utilitário de Claims/Permissões
- **Tarefa**: Criar `assets/js/auth-utils.js`
- **Funcionalidades**:
  - Verificar claims do usuário (admin, gestor, professor)
  - Condicionar exibição de botões/rotas administrativas
  - Helper functions para verificação de permissões
- **Critério de Pronto**: Interface adaptativa baseada em permissões

#### 2.4 Página de Login Segura
- **Tarefa**: Melhorar `pages/login.html`
- **Recursos**:
  - Interface limpa com email/senha
  - Integração Firebase Auth
  - Redirecionamento pós-login
  - Tratamento de erros
- **Critério de Pronto**: Login funcional e seguro

### ⚙️ FASE 3: SCRIPTS E AUTOMAÇÃO

#### 3.1 Organização de Scripts Node
- **Tarefa**: Criar `/scripts` e mover utilitários
- **Scripts a organizar**:
  - `import-csv-completo.js` → `/scripts/`
  - `consolidar-dados.js` → `/scripts/`
  - `process-medidas.js` → `/scripts/`
  - `gerar-frequencia-completa.js` → `/scripts/`
  - `firebase-admin.js` → `/scripts/`
  - `auto-sync-github.js` → `/scripts/`
- **Critério de Pronto**: Scripts organizados e funcionais

#### 3.2 Padronização package.json
- **Tarefa**: Atualizar com scripts úteis
- **Scripts propostos**:
  ```json
  {
    "scripts": {
      "dev": "npx http-server public -p 5173 -c-1",
      "build": "echo 'Build: copiando arquivos para /public'",
      "lint": "eslint .",
      "test": "jest",
      "import:csv": "node scripts/import-csv-completo.js",
      "consolidar": "node scripts/consolidar-dados.js",
      "process:medidas": "node scripts/process-medidas.js",
      "clean": "rm -rf public && mkdir public"
    }
  }
  ```
- **Critério de Pronto**: Comandos de desenvolvimento funcionando

#### 3.3 Gestão de Variáveis de Ambiente
- **Tarefa**: Separar credenciais sensíveis
- **Implementar**:
  - `.env.example` com placeholders
  - Documentação de variáveis necessárias
  - Scripts Node usando process.env
- **Critério de Pronto**: Sem credenciais hardcoded nos scripts

#### 3.4 Script de Build/Deploy
- **Tarefa**: Automatizar cópia de arquivos para `/public`
- **Funcionalidade**: Copiar apenas arquivos necessários para produção
- **Critério de Pronto**: Build automatizado funcional

### 📚 FASE 4: DOCUMENTAÇÃO VIVA

#### 4.1 Criação CLAUDE.md
- **Tarefa**: Documentar padrões do projeto para Claude
- **Conteúdo**:
  - Comandos frequentes do projeto
  - Estilo de código preferido
  - Checklists de entrega
  - Locais de logs e debugging
  - "Sempre fazer" vs "Nunca fazer"
  - Estrutura de pastas
- **Critério de Pronto**: Documentação completa para colaboração

#### 4.2 Atualização README.md
- **Tarefa**: Documentar setup completo
- **Seções**:
  - Instalação e configuração
  - Comandos de desenvolvimento
  - Deploy e produção
  - Índices Firestore necessários
  - Configuração de claims/permissões
  - Troubleshooting comum
- **Critério de Pronto**: README completo e atualizado

#### 4.3 Documentação de Índices Firestore
- **Tarefa**: Listar índices necessários no Firestore
- **Baseado nas consultas dos scripts JavaScript**
- **Critério de Pronto**: Lista de índices documentada

## 3. MUDANÇAS DE SEGURANÇA DETALHADAS

### Firestore Rules - Antes vs Depois

**🔴 ATUAL (INSEGURO)**:
```javascript
allow read, write: if true; // QUALQUER UM PODE ACESSAR
```

**🟢 PROPOSTO (SEGURO)**:
```javascript
// Acesso baseado em autenticação + claims
allow read: if request.auth != null;
allow write: if request.auth != null && hasPermission();
```

### Páginas Removidas do Deploy
- `debug.html`, `debug-dados.html`, `debug-quick.html`
- `test-deploy.html`, `test-configuracoes.html`
- `limpar-tudo.html` (especialmente perigosa)

### Estrutura de Permissões Proposta
- **admin**: Acesso total
- **gestor**: Acesso a relatórios e medidas disciplinares
- **professor**: Acesso a frequência e consulta de alunos

## 4. PLANO DE DEPLOY (GITHUB PAGES)

### Estrutura Final para Deploy
```
/public/                    # Deploy root
├── index.html             # Dashboard principal
├── assets/
│   ├── css/              # Estilos
│   ├── js/               # Scripts frontend
│   └── images/           # Imagens
├── pages/                # Páginas internas
│   ├── login.html        # Página de login
│   ├── *.html            # Outras páginas
└── components/           # Componentes HTML

/scripts/                 # Scripts Node (não deployados)
/tools/                   # Ferramentas debug (não deployadas)
/.github/workflows/       # Actions do GitHub
```

### Workflow GitHub Actions
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v2
        with:
          folder: public
```

## 5. LISTA DE ARQUIVOS - MUDANÇAS PLANEJADAS

### 📁 ARQUIVOS A CRIAR
- `.github/workflows/gh-pages.yml` - Deploy automático
- `public/` - Diretório de produção (com cópia de arquivos necessários)
- `scripts/` - Scripts Node organizados
- `tools/` - Ferramentas de debug/teste
- `.gitignore` - Proteções adequadas
- `.env.example` - Template de variáveis
- `CLAUDE.md` - Documentação para Claude
- `firestore.rules` - Regras seguras (reescrita completa)

### ✏️ ARQUIVOS A ALTERAR
- `README.md` - Instruções completas atualizadas
- `package.json` - Scripts padronizados
- `assets/js/firebase-config.js` - Separar credenciais
- Todos os scripts Node - Usar variáveis de ambiente
- `pages/login.html` - Melhorias de segurança e UX

### 🗂️ ARQUIVOS A MOVER
- `github/workflows/claude.yml` → `.github/workflows/claude.yml`
- `debug*.html` → `tools/`
- `test-*.html` → `tools/`
- `limpar-tudo.html` → `tools/`
- `*.js` (raiz) → `scripts/` (scripts Node)

### 🗑️ ARQUIVOS A EXCLUIR
- Pasta `sistema-disciplinar/` (duplicação completa)
- `firestore-dev.rules` (manter apenas firestore.rules)

## 6. CRITÉRIOS DE PRONTO GLOBAIS (DoD)

### ✅ Requisitos Técnicos
- [ ] `npm run dev` funciona e serve de `localhost:5173`
- [ ] Deploy automático do `/public` via GitHub Actions
- [ ] Páginas de debug inexistentes no site publicado
- [ ] Firestore protegido - sem leitura/escrita anônima
- [ ] Autenticação obrigatória para acessar dashboard
- [ ] Claims/permissões funcionando corretamente

### ✅ Requisitos de Segurança
- [ ] Regras Firestore implementadas com RBAC
- [ ] Páginas administrativas perigosas fora do deploy
- [ ] Credenciais não hardcoded em scripts de produção
- [ ] .gitignore protegendo arquivos sensíveis

### ✅ Requisitos de Documentação  
- [ ] README.md atualizado com setup completo
- [ ] CLAUDE.md criado com padrões do projeto
- [ ] Índices Firestore documentados
- [ ] Scripts de desenvolvimento funcionais

## 7. ESTIMATIVA DE ESFORÇO

### Fase 1 (Organização): ~2-3 horas
- Reorganização de arquivos
- Setup de workflows
- Estrutura de deploy

### Fase 2 (Segurança): ~3-4 horas
- Reescrita regras Firestore
- Sistema de autenticação
- Página de login segura

### Fase 3 (Scripts): ~2 horas
- Organização de utilitários
- Padronização package.json

### Fase 4 (Documentação): ~1 hora
- CLAUDE.md e README.md

**Total Estimado**: ~8-10 horas de trabalho

---

⚠️ **NOTA IMPORTANTE**: Este plano aborda problemas críticos de segurança. A implementação deve ser feita com cuidado, especialmente as regras do Firestore e a remoção de páginas administrativas perigosas do deploy público.