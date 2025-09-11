# 🚀 CONFIGURAR NETLIFY ENVIRONMENT VARIABLES

## ⚠️ AÇÃO NECESSÁRIA

Para o sistema funcionar, você DEVE configurar estas variáveis no Netlify Dashboard:

### 📍 ONDE CONFIGURAR
1. Acesse: https://app.netlify.com/teams/liongab
2. Site: usecloser.com.br
3. Site settings → Environment variables
4. Add variable

### 🔑 VARIÁVEIS OBRIGATÓRIAS

```bash
# Database
DATABASE_URL
[USAR A SUA URL DO NEONDB AQUI]

# JWT Secret  
JWT_SECRET
[USAR A SUA JWT SECRET AQUI - MÍNIMO 32 CARACTERES]

# JWT Expiration
JWT_EXPIRES_IN
30d
```

### 🔄 VARIÁVEIS OPCIONAIS (Redis - se usar cache)

```bash
# Redis (opcional)
REDIS_URL
redis://default:AUb4AAIjcDFkYjM4ODI1YzE2Y2E0MGUxYmYxMTlhNTUyODAwMTYzYXAxMA@healthy-sheep-18168.upstash.io:6379

REDIS_HOST
healthy-sheep-18168.upstash.io

REDIS_PORT
6379
```

## ✅ DEPOIS DE CONFIGURAR

1. **Trigger novo deploy**: 
   - Site overview → Deploys → Trigger deploy

2. **Teste o sistema**:
   - https://usecloser.com.br/sistema-disciplinar

3. **Login de teste**:
   - admin@escola.com / admin123

## 🎯 RESULTADO ESPERADO

- ✅ Sistema carregando em https://usecloser.com.br/sistema-disciplinar
- ✅ Login funcionando
- ✅ API respondendo (/.netlify/functions/api)
- ✅ Dados sendo salvos no NeonDB

## 🐛 SE NÃO FUNCIONAR

1. **Verificar Functions logs** no Netlify Dashboard
2. **Confirmar se as variáveis foram salvas**
3. **Fazer novo deploy manual**

---

⚠️ **CRITICAL**: O sistema NÃO funcionará até configurar estas environment variables!