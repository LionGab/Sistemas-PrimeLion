# CLAUDE.md - Padrões e Convenções do Sistema Disciplinar

## 📋 SOBRE ESTE DOCUMENTO

Este arquivo documenta os padrões, convenções e comandos do projeto **Sistema Disciplinar** para facilitar a colaboração com Claude e manter a consistência do desenvolvimento.

---

## 🚀 COMANDOS FREQUENTES DO PROJETO

### Desenvolvimento Local
```bash
# Iniciar servidor de desenvolvimento
npm run dev                 # Serve /public em localhost:5173

# Build para produção
npm run build              # Copia arquivos para /public com validações

# Limpar build
npm run clean              # Remove e recria /public
```

### Scripts de Dados
```bash
# Importar dados CSV
npm run import:csv         # Processa frequencia_completa.csv

# Consolidar dados existentes  
npm run consolidar         # Unifica dados de frequência

# Processar medidas disciplinares
npm run process:medidas    # Processa dados de medidas

# Sync com GitHub
npm run sync:github        # Sincronização automática (requer GITHUB_TOKEN)

# Servidor local de dados
npm run server            # API local para desenvolvimento
```

### Git e Deploy
```bash
# Deploy automático via GitHub Actions
git push origin main      # Trigger deploy para GitHub Pages

# Commit com padrão do projeto
git commit -m "tipo(escopo): descrição

- Detalhe 1
- Detalhe 2

🔧 Técnico: detalhes técnicos  
✅ Testes: validações feitas"
```

---

## 🎨 ESTILO DE CÓDIGO PREFERIDO

### JavaScript
- **Sintaxe**: Modern ES6+ quando possível, compatível com browsers
- **Firebase**: Usar compat mode (`firebase-app-compat.js`) para compatibilidade
- **Async/await**: Preferir ao invés de `.then()`
- **Tratamento de erros**: Sempre usar `try/catch` em código assíncrono
- **Variáveis**: `const` por padrão, `let` quando necessário reatribuição

```javascript
// ✅ Bom
const processData = async (data) => {
  try {
    const result = await firebase.firestore().collection('alunos').add(data);
    return result.id;
  } catch (error) {
    console.error('Erro ao salvar:', error);
    throw error;
  }
};

// ❌ Evitar
var processData = function(data) {
  return firebase.firestore().collection('alunos').add(data).then(function(result) {
    return result.id;
  });
};
```

### HTML
- **Semântica**: Usar elementos semânticos (`<main>`, `<section>`, `<article>`)
- **Acessibilidade**: Sempre incluir `alt`, `aria-label` quando necessário
- **Meta tags**: Incluir viewport, charset, description

### CSS
- **Metodologia**: BEM quando aplicável, classes funcionais para layout
- **Responsividade**: Mobile-first approach
- **Unidades**: `rem` para fontes, `px` para borders, `%` para layout

---

## ✅ CHECKLISTS DE ENTREGA

### Ao Implementar Nova Feature
- [ ] Código segue padrões do CLAUDE.md
- [ ] Tratamento de erros implementado
- [ ] Testado localmente com `npm run dev`
- [ ] Build funciona sem erros (`npm run build`)
- [ ] Permissões Firestore verificadas (se aplicável)
- [ ] Documentação atualizada (README se necessário)
- [ ] Commit com mensagem descritiva

### Ao Modificar Autenticação/Segurança
- [ ] Regras Firestore testadas no console Firebase
- [ ] Custom claims configurados corretamente
- [ ] Redirecionamentos funcionando
- [ ] UI adaptativa por permissões testada
- [ ] Não há vazamento de dados sensíveis

### Ao Adicionar Script Node.js
- [ ] Script colocado em `/scripts/`
- [ ] Usa `process.env` para configurações
- [ ] Documentado no `.env.example`
- [ ] Comando npm adicionado ao `package.json`
- [ ] Testado localmente

### Antes de Deploy/Push
- [ ] `npm run build` executa sem erros
- [ ] Páginas perigosas NÃO estão em `/public`
- [ ] Arquivos sensíveis protegidos pelo `.gitignore`
- [ ] Tests básicos passando (se existirem)

---

## 🗂️ ESTRUTURA DE PASTAS

```
sistema-disciplinar/
├── .github/workflows/     # GitHub Actions (deploy automático)
├── .claude/              # Configurações Claude Code
├── assets/               # Recursos source
│   ├── css/             # Estilos globais
│   ├── js/              # Scripts frontend
│   └── images/          # Imagens source
├── components/           # Componentes HTML reutilizáveis
├── pages/               # Páginas internas source
├── data/                # Dados locais (desenvolvimento)
├── dados/               # Dados de frequência
├── public/              # ✅ BUILD OUTPUT - apenas isso vai pro deploy
│   ├── index.html       # Dashboard principal
│   ├── assets/          # Assets processados
│   ├── pages/           # Páginas processadas  
│   └── components/      # Componentes processados
├── scripts/             # 🔧 Scripts Node.js (não deployados)
├── tools/               # 🛠️ Ferramentas debug (não deployadas)
├── tests/               # Testes (futuro)
├── .env.example         # Template de variáveis
├── .gitignore          # Arquivos ignorados
├── firestore.rules      # Regras de segurança Firestore
├── package.json         # Configuração npm
├── CLAUDE.md           # Este arquivo
├── README.md           # Documentação usuário
└── PLAN*.md            # Documentos de planejamento
```

---

## 📍 LOCAIS DE LOGS E DEBUGGING

### Logs Frontend (Browser)
- **Console do navegador**: `F12` → Console
- **Firebase Auth**: Logs automáticos no console quando há erro
- **Firestore**: Erros de permissão aparecem no console
- **Network**: `F12` → Network para requisições HTTP

### Logs Backend/Scripts
- **Node.js scripts**: Output direto no terminal
- **Logs de ambiente**: Configurar `LOG_FILE` no `.env`
- **Firebase Admin**: Logs no terminal onde o script roda

### Debug Local
- **Servidor dev**: `http://localhost:5173` 
- **Firebase Emulator** (futuro): Para testing offline
- **Tools directory**: `/tools/` contém páginas de debug locais

### Arquivos de Log Comuns
```
logs/sistema-disciplinar.log    # Log principal (se configurado)
dados/frequencia.json          # Dados processados
data/db.json                   # Database local
```

---

## 🚀 SEMPRE FAZER

### Segurança
- ✅ Verificar permissões Firestore antes de deploy production
- ✅ Usar `process.env` para credenciais em scripts Node
- ✅ Testar redirecionamentos de auth após mudanças
- ✅ Validar que `/tools` não está em `/public` após build

### Desenvolvimento
- ✅ Executar `npm run build` antes de commit
- ✅ Testar em localhost antes de push
- ✅ Usar mensagens de commit descritivas
- ✅ Manter `.env.example` atualizado quando adicionar variáveis

### Qualidade
- ✅ Adicionar tratamento de erros em código assíncrono
- ✅ Usar `console.error()` para erros, `console.log()` para info
- ✅ Documentar funções complexas com comentários
- ✅ Manter HTML semântico e acessível

---

## 🚫 NUNCA FAZER

### Segurança - CRÍTICO
- ❌ Commitar arquivos `.env` com credenciais reais
- ❌ Fazer deploy com `firestore.rules` permitindo acesso público (`if true`)
- ❌ Colocar `service-account-*.json` no git
- ❌ Hardcoded API keys ou tokens em código fonte
- ❌ Expor páginas administrativas em produção

### Organização
- ❌ Colocar scripts Node.js na raiz do projeto
- ❌ Misturar arquivos de desenvolvimento em `/public`
- ❌ Commitar `node_modules/` ou arquivos de build
- ❌ Usar paths absolutos que quebram no GitHub Pages

### Código
- ❌ Usar `var` (preferir `const`/`let`)
- ❌ Código síncrono bloqueante para operações I/O
- ❌ Ignorar erros sem tratamento (`catch` vazio)
- ❌ Manipular DOM antes de carregar (`DOMContentLoaded`)

---

## 🔧 CONFIGURAÇÕES ESPECÍFICAS

### Firebase
- **Auth**: Firebase Auth com custom claims (admin, gestor, professor)
- **Firestore**: RBAC baseado em claims, negação padrão
- **Hosting**: GitHub Pages (não Firebase Hosting)

### GitHub Actions
- **Trigger**: Push para `main`
- **Build**: `npm run build` 
- **Deploy**: Conteúdo de `/public` para GitHub Pages
- **Node version**: 18.x

### Package.json
- **Tipo**: Static site (não servidor Node.js em produção)  
- **Scripts**: Utilitários locais de desenvolvimento
- **DevDeps**: Tools que não vão para produção

---

## 🆘 TROUBLESHOOTING COMUM

### Build Falha
```bash
# Limpar e rebuildar
npm run clean && npm run build

# Verificar se há arquivos proibidos
ls public/ | grep -E "(debug|test|limpar)"  # Deve estar vazio
```

### Auth Não Funciona
1. Verificar se `firebase-config.js` tem as credenciais corretas
2. Verificar se usuário tem custom claims configurados no Firebase Console
3. Verificar se `firestore.rules` está deployado corretamente

### GitHub Pages Deploy Falha  
1. Verificar se workflow está em `.github/workflows/` (com ponto)
2. Verificar se `GITHUB_TOKEN` tem permissões adequadas
3. Verificar se branch está correta no workflow (main)

### Scripts Node Falham
```bash
# Verificar se .env está configurado
cp .env.example .env
# Editar .env com credenciais reais

# Verificar dependências
npm install

# Executar com debug
node --trace-warnings scripts/script-name.js
```

---

## 📝 HISTÓRICO DE VERSÕES

- **v1.0.0** (2025-08-27): Setup inicial com 4 fases de implementação
  - Fase 1: Organização e deploy seguro
  - Fase 2: Autenticação e RBAC Firestore  
  - Fase 3: Scripts organizados e variáveis ambiente
  - Fase 4: Documentação completa

---

**📞 Suporte**: Consulte este documento antes de implementar mudanças. Para dúvidas específicas, referencie as seções relevantes ao solicitar ajuda.