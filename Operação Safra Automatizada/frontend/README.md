# 🌾 Fazenda Brasil - Frontend NFP-e

Frontend React para o Sistema de Automação NFP-e da Fazenda Brasil em Campo Verde/MT.

## 🚀 Stack Tecnológica

- **React 18** + **TypeScript** - Framework e tipagem
- **Vite** - Build tool otimizado
- **Tailwind CSS** - Styling com Design System AgricTech
- **React Query** - Estado servidor e cache
- **Zustand** - Gerenciamento estado local
- **React Hook Form + Zod** - Formulários e validação
- **React Router Dom** - Roteamento SPA

## 📦 Instalação e Execução

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview build
npm run preview
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Layout principal (Header, Sidebar, etc)
│   └── ui/             # Componentes UI base
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Login.tsx       # Autenticação
│   └── modules/        # Módulos específicos
├── services/           # Clientes API
├── stores/             # Estado global (Zustand)
├── types/              # Definições TypeScript
├── hooks/              # Custom hooks
└── utils/              # Utilitários
```

## 🎨 Design System AgricTech

### Paleta de Cores
- **Verde Safra**: `#22C55E` (primário)
- **Verde Escuro**: `#166534` (header)
- **Dourado Grão**: `#F59E0B` (secundário)
- **Neutros Terra**: `#171717`, `#F5F5F4`

### Componentes Base
- `Button` - Botões com variantes
- `Card` - Containers de conteúdo
- `Table` - Tabelas responsivas
- `Form` - Formulários validados

### Componentes AgricTech
- `NFPeStatus` - Status das notas fiscais
- `ProductGrid` - Grid de produtos
- `TOTVSSyncIndicator` - Status integração TOTVS

## 📱 Responsividade

Mobile First com breakpoints:
- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+
- **Wide**: 1440px+

## 🔌 Integração Backend

### APIs Confirmadas
- `POST /auth/login` - Autenticação JWT
- `GET /auth/me` - Dados usuário atual
- `GET /totvs/status` - Status integração TOTVS
- `GET /nfpe` - Lista NFP-e (placeholder)
- `GET /produtos` - Lista produtos (placeholder)
- `GET /clientes` - Lista clientes (placeholder)

### Estado e Cache
- **React Query** para cache servidor
- **Zustand** para estado local
- **Cookies httpOnly** para tokens JWT

## 🧭 Navegação MVP

```
/ (Dashboard)
├── /nfpe/
│   ├── /dashboard - Métricas NFP-e
│   ├── /nova - Formulário criação
│   ├── /lista - Tabela paginada
│   └── /:id - Detalhes NFP-e
├── /produtos/
│   ├── /catalogo - Grid produtos
│   ├── /novo - Cadastro
│   └── /estoque - Controle estoque
├── /clientes/
│   ├── /lista - Lista clientes
│   ├── /novo - Cadastro
│   └── /:id/historico - NFP-e do cliente
└── /relatorios/
    ├── /fiscais - Compliance SEFAZ
    ├── /producao - Métricas safra
    └── /financeiro - Faturamento
```

## ⚡ Performance

### Otimizações Implementadas
- **Code Splitting** por rota
- **Lazy Loading** de módulos
- **Bundle splitting** (vendor, forms, data, ui)
- **React Query** com cache inteligente
- **Tailwind CSS** otimizado para produção

### Métricas Alvo
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## 🔒 Segurança

- **JWT** em cookies httpOnly
- **Refresh automático** de tokens
- **Interceptors** para tratamento 401/403
- **Sanitização** de inputs
- **CSP** headers configurados

## 🧪 MVP Status

### ✅ Implementado
- [x] Infraestrutura React + Vite + TypeScript
- [x] Design System AgricTech completo
- [x] Autenticação JWT com refresh
- [x] AppShell responsivo (Header, Sidebar, Footer)
- [x] Dashboard com métricas básicas
- [x] Navegação e roteamento completo
- [x] Integração TOTVS status (polling)

### 🚧 Placeholders (Próximas iterações)
- [ ] Módulos NFP-e (CRUD completo)
- [ ] Módulos Produtos (sync TOTVS)
- [ ] Módulos Clientes (CRM básico)
- [ ] Módulos Relatórios (PDF/Excel)
- [ ] Formulários avançados
- [ ] Tabelas com filtros/paginação
- [ ] Upload de arquivos
- [ ] Notificações em tempo real

## 🌐 Deploy

### Desenvolvimento
```bash
npm run dev    # http://localhost:3000
```

### Produção
```bash
npm run build  # /dist
npm run preview # Preview local
```

### Proxy API
Configurado para proxificar `/api/*` para `http://localhost:8000` (backend FastAPI).

---

**Fazenda Brasil - Campo Verde/MT**  
Sistema NFP-e v1.0.0 | Integração TOTVS Protheus Agro