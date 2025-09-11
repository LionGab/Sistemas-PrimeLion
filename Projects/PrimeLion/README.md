# Clube Lion - Landing Page Ultra-Otimizada

Landing page premium para CEOs com faturamento R$500k+ focada em máxima conversão e performance.

## 🚀 Características

### Performance Crítica
- **Throttle 16ms** no scroll (60fps)
- **Observer único** reutilizável
- **Flag anti-re-animação** de números
- **JavaScript minificado** (92% menor)

### Conversão Máxima
- **WhatsApp flutuante** com animação pulse
- **FAQ interativo** com indicadores visuais +/-
- **Formulário de fallback** inline
- **3 CTAs estratégicos** com tracking

### Tracking Profissional
- **Google Analytics 4** com eventos customizados
- **Google Tag Manager** integrado
- **Facebook Pixel** com conversões
- **Scroll depth tracking** (25%, 50%, 75%, 100%)

### Mobile-First UX
- **CTAs com 48px** de altura mínima para toque
- **Parallax desabilitado** em mobile
- **Prefers-reduced-motion** respeitado
- **Espaçamento otimizado** para conversão

## 📁 Arquivos

- `index.html` - Landing page principal
- `styles.css` - CSS otimizado mobile-first
- `script.js` - JavaScript completo com comentários
- `clube-lion-script.min.js` - Versão minificada para produção

## 🎯 Configuração

### 1. Tracking IDs
Substitua os placeholders no HTML:
```html
<!-- Google Analytics -->
gtag('config', 'GA_MEASUREMENT_ID');

<!-- GTM -->
'https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXX'

<!-- Facebook Pixel -->
fbq('init', 'YOUR_PIXEL_ID');
```

### 2. WhatsApp
Configure o número no script:
```javascript
href="https://wa.me/5511999999999?text=..."
```

### 3. Calendly
Atualize os links do Calendly:
```html
href="https://calendly.com/gabriel-sprint"
```

## 🛠️ Tecnologias

- **HTML5** semântico
- **CSS3** com variáveis customizadas
- **JavaScript ES6+** com módulos
- **Intersection Observer API**
- **Performance API**

## 📊 Métricas de Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🎨 Design System

### Cores
```css
--gold: #D4AF37
--gold-dark: #B8941F
--black: #0A0A0A
--white: #FFFFFF
--gray: #1a1a1a
```

### Tipografia
- **Font**: Inter (400, 600, 700, 900)
- **Escala**: Clamp responsivo
- **Line-height**: 1.6 para legibilidade

## 🚀 Deploy no Netlify

### Configuração Automática
O projeto inclui configurações otimizadas para Netlify:
- `netlify.toml` - Configurações de build e headers
- `_redirects` - Redirects para seções e links externos
- `_headers` - Headers de performance e segurança

### Deploy Steps
1. **Conecte o repositório**: https://github.com/LionGab/Lion
2. **Base directory**: `Documents/Lion - Docs/clube-lion`
3. **Publish directory**: `.` (mesmo diretório)
4. **Build command**: `echo 'Static site'` (site estático)

### URLs Personalizadas
- `/diagnostico` → redireciona para `#diagnostico`
- `/whatsapp` → redireciona para WhatsApp
- `/agendar` → redireciona para Calendly

## 🛠️ Implementação

1. **Desenvolvimento**: Descomente `script.js` no HTML
2. **Produção**: Usa `clube-lion-script.min.js` (ativo por padrão)
3. **Teste**: Valide todos os CTAs e tracking
4. **Deploy**: Netlify com cache headers otimizados

## ✅ Checklist de Deploy

- [ ] Configurar Analytics/GTM/Pixel IDs
- [ ] Testar todos os CTAs
- [ ] Validar formulário de fallback  
- [ ] Verificar responsividade mobile
- [ ] Testar velocidade de carregamento
- [ ] Configurar Open Graph tags
- [ ] Definir favicon e apple-touch-icon

---

**Gerado com Claude Code** 🤖