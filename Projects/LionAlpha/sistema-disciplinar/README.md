# 🏫 Sistema Disciplinar (EECM)

Dashboard para gestão disciplinar escolar com autenticação Firebase, RBAC e deploy automático.

**Recursos principais:**
- 🔐 Autenticação obrigatória com Firebase Auth
- 👥 Controle de acesso baseado em roles (admin/gestor/professor)  
- 📊 Gestão de alunos, medidas disciplinares e relatórios
- 🚀 Deploy automático via GitHub Pages
- 📱 Interface responsiva e moderna

---

## 🚀 SETUP RÁPIDO

### 1. Clonar e Instalar
```bash
git clone https://github.com/seu-usuario/sistema-disciplinar
cd sistema-disciplinar
npm install
```

### 2. Configurar Ambiente
```bash
# Copiar template de configuração
cp .env.example .env

# Editar .env com suas credenciais Firebase
# nano .env ou usar seu editor preferido
```

### 3. Configurar Firebase
1. **Criar projeto Firebase** em https://console.firebase.google.com
2. **Ativar Authentication** → Providers → Email/Password
3. **Criar database Firestore** em modo produção
4. **Copiar credenciais** do projeto para `assets/js/firebase-config.js`

### 4. Deploy das Regras Firestore
```bash
# Copiar conteúdo de firestore.rules para Firebase Console
# Firebase Console → Firestore → Rules → Publicar
```

### 5. Executar Localmente
```bash
npm run dev
# Acesse http://localhost:5173
```

---

## 🔧 COMANDOS DE DESENVOLVIMENTO

### Servidor Local
```bash
npm run dev          # Inicia servidor em localhost:5173
npm run build        # Gera build otimizado em /public  
npm run clean        # Limpa diretório de build
```

### Scripts de Dados
```bash
npm run import:csv        # Importa dados de frequencia_completa.csv
npm run consolidar        # Consolida dados de frequência existentes
npm run process:medidas   # Processa medidas disciplinares
npm run sync:github       # Sincronização automática com GitHub
npm run server           # API local para desenvolvimento
```

---

## 🏗️ DEPLOY E PRODUÇÃO

### Deploy Automático (GitHub Pages)
O projeto está configurado para deploy automático:

1. **Push para main** → GitHub Actions build e deploy
2. **URL de produção**: `https://seu-usuario.github.io/sistema-disciplinar`
3. **Apenas `/public`** é deployado (sem páginas de debug/admin)

### Deploy Manual
```bash
# Build local
npm run build

# Verificar conteúdo de produção
ls public/

# Push para GitHub (trigger deploy automático)
git add . && git commit -m "deploy: nova versão" && git push origin main
```

### Configurar GitHub Pages
1. **Repository Settings** → Pages
2. **Source**: GitHub Actions
3. **Workflow** já configurado em `.github/workflows/gh-pages.yml`

---

## 🔒 AUTENTICAÇÃO E SEGURANÇA

### Sistema de Roles (RBAC)
O sistema implementa controle granular de acesso:

- **👑 admin**: Acesso total ao sistema
- **📊 gestor**: Relatórios, medidas disciplinares, gestão de alunos  
- **👨‍🏫 professor**: Frequência, consulta de alunos

### Configurar Custom Claims (Firebase Admin)
```javascript
// Usar Firebase Admin SDK ou Firebase CLI
const admin = require('firebase-admin');

// Definir role de um usuário
await admin.auth().setCustomUserClaims(uid, { 
  roles: ['admin'] 
});

// Definir múltiplos roles
await admin.auth().setCustomUserClaims(uid, { 
  roles: ['professor', 'gestor'] 
});
```

### Regras Firestore (RBAC)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function hasRole(role) {
      return request.auth != null && 
        role in request.auth.token.roles;
    }
    
    // Alunos: professores podem ler, gestores podem escrever
    match /alunos/{id} {
      allow read: if hasRole('professor') || hasRole('admin');
      allow write: if hasRole('gestor') || hasRole('admin');
    }
    
    // Medidas disciplinares: acesso por role
    match /medidas/{id} {
      allow read, write: if hasRole('professor') || 
                           hasRole('gestor') || 
                           hasRole('admin');
    }
    
    // Bloqueio padrão
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📊 ÍNDICES FIRESTORE NECESSÁRIOS

Para otimizar consultas, criar os seguintes índices no Firebase Console:

### Coleção `alunos`
```
Campos: turma (Ascending), nome (Ascending)
Campos: turma (Ascending), createdAt (Descending) 
```

### Coleção `medidas`
```
Campos: studentId (Ascending), createdAt (Descending)
Campos: type (Ascending), createdAt (Descending)
Campos: turma (Ascending), createdAt (Descending)
```

### Coleção `frequencia`  
```
Campos: turma (Ascending), date (Descending)
Campos: studentId (Ascending), date (Descending)
```

**Criar índices**: Firebase Console → Firestore → Indexes → Create Index

---

## 🗂️ ESTRUTURA DO PROJETO

```
sistema-disciplinar/
├── 🚀 .github/workflows/     # GitHub Actions (deploy automático)
├── 📁 public/              # BUILD OUTPUT (GitHub Pages)
│   ├── index.html         # Dashboard principal  
│   ├── assets/           # CSS, JS, imagens processados
│   ├── pages/           # Páginas internas (login, etc)
│   └── components/      # Componentes reutilizáveis
│
├── 📝 assets/              # Código fonte
│   ├── css/             # Estilos globais
│   ├── js/              # Scripts frontend + auth-utils
│   └── images/          # Imagens source
│
├── 📄 pages/               # Páginas source (HTML)
├── 🔧 scripts/             # Scripts Node.js (utilitários)
├── 🛠️ tools/               # Ferramentas debug (não deployadas)
├── 📊 data/ & dados/       # Dados locais de desenvolvimento
│
├── ⚙️ .env.example         # Template configuração
├── 🔒 firestore.rules      # Regras segurança Firestore  
├── 📦 package.json         # Scripts e dependências
├── 📚 CLAUDE.md           # Padrões para desenvolvimento  
└── 📖 README.md           # Este arquivo
```

---

## 🔄 CONFIGURAÇÃO DE CLAIMS/PERMISSÕES

### Passo 1: Criar Usuários no Firebase Auth
```bash
# Via Firebase Console ou Firebase CLI
firebase auth:users:create user@escola.com --password "senha123"
```

### Passo 2: Definir Claims com Admin SDK
```javascript
// scripts/set-user-claims.js (exemplo)
const admin = require('firebase-admin');

// Inicializar Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('./service-account.json')
});

// Definir claims
async function setUserRole(email, roles) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { roles });
  console.log(`User ${email} now has roles:`, roles);
}

// Exemplos
await setUserRole('admin@escola.com', ['admin']);
await setUserRole('diretor@escola.com', ['gestor', 'professor']);  
await setUserRole('professor@escola.com', ['professor']);
```

### Passo 3: Testar Permissions na UI
- Login com diferentes usuários
- Verificar elementos com `data-requires-role="admin"` aparecem/somem
- Testar acesso às diferentes seções do dashboard

---

## 🧪 TROUBLESHOOTING

### ❌ Build Falha
```bash
# Limpar e rebuildar
npm run clean
npm run build

# Verificar arquivos proibidos no build
ls public/ | grep -E "(debug|test|limpar)"  # Deve estar vazio
```

### ❌ Autenticação Não Funciona
1. **Verificar credenciais**: `assets/js/firebase-config.js` com project ID correto
2. **Custom claims**: Usuário deve ter claims configurados via Admin SDK
3. **Firestore rules**: Verificar se rules estão deployadas no Console Firebase
4. **Network**: F12 → Network para ver erros de requisição

### ❌ GitHub Pages Deploy Falha  
1. **Workflow location**: Deve estar em `.github/workflows/` (com ponto)
2. **Permissions**: Repository Settings → Actions → General → Permissions
3. **Pages config**: Settings → Pages → Source: GitHub Actions

### ❌ Scripts Node Falham
```bash
# Verificar .env existe e está configurado
ls -la .env

# Instalar dependências
npm install

# Debug específico
node --trace-warnings scripts/nome-do-script.js
```

### ❌ Firestore Permission Denied
```bash
# Verificar rules no Console Firebase
# Testar com Firestore Rules Playground
# Confirmar que usuário tem claims adequados
```

---

## 📈 PERFORMANCE E MONITORAMENTO

### Métricas Importantes
- **Auth latency**: Login deve ser < 2s
- **Page load**: Primeira carga < 3s  
- **Firestore queries**: Usar índices compostos
- **Bundle size**: Manter JS < 500KB

### Otimizações Implementadas
- ✅ **Build otimizado**: Apenas arquivos necessários em `/public`
- ✅ **Auth guards**: Carregamento condicional baseado em auth
- ✅ **Static hosting**: GitHub Pages para performance
- ✅ **Firestore rules**: Queries otimizadas por índice

---

## 🤝 CONTRIBUINDO

### Antes de Contribuir
1. Ler `CLAUDE.md` para padrões do projeto
2. Executar `npm run build` localmente  
3. Testar mudanças com `npm run dev`
4. Seguir padrões de commit do projeto

### Pull Request Checklist
- [ ] `npm run build` executa sem erro
- [ ] Autenticação testada (se aplicável)
- [ ] Sem arquivos sensíveis commitados
- [ ] README atualizado (se necessário)
- [ ] Firestore rules validadas (se mudança de dados)

---

## 📄 LICENÇA

MIT License - Veja arquivo `LICENSE` para detalhes.

---

## 📞 SUPORTE

- **Documentação técnica**: Consulte `CLAUDE.md`
- **Issues**: Use GitHub Issues para bugs/features
- **Configuração**: Siga seção "Setup Rápido" deste README

**Versão**: 1.0.0 | **Última atualização**: Agosto 2025
