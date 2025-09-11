# 🏋️ TESTE RÁPIDO - ACADEMIA WHATSAPP AUTOMATION

## ⚡ TESTE EM 5 MINUTOS

### 1️⃣ PREPARAR AMBIENTE
```bash
cd "C:\Users\User\OneDrive\Sistemas PrimeLion\Clients\Active\Academia-WhatsApp-Automation\teste-rapido"
npm install
```

### 2️⃣ CONFIGURAR SEU NÚMERO
Edite `teste-whatsapp.js` linha 6:
```javascript
const NUMERO_TESTE = '5511999999999'; // SEU NÚMERO AQUI
```

### 3️⃣ EXECUTAR TESTE
```bash
npm test
```

### 4️⃣ ESCANEAR QR CODE
- Abra WhatsApp no celular
- Menu > Dispositivos conectados > Conectar dispositivo
- Escaneie o QR Code que aparece no terminal

### 5️⃣ VALIDAR RESULTADO
✅ Mensagem recebida no WhatsApp  
✅ Console mostra "MENSAGEM ENVIADA COM SUCESSO"  
✅ Sistema mantém conexão por 30s  

---

## 🔧 TROUBLESHOOTING

### ❌ Erro: "Cannot find module baileys"
```bash
npm install @whiskeysockets/baileys@6.7.0 qrcode-terminal@0.12.0
```

### ❌ QR Code não aparece
- Delete pasta `./auth_info`
- Execute novamente: `npm test`

### ❌ Mensagem não enviada
- Verifique se o número tem WhatsApp ativo
- Formato: `5511999999999` (sem espaços/símbolos)
- Use seu próprio número primeiro

### ❌ Conexão instável
- Verifique internet
- WhatsApp Web deve estar desconectado

---

## 📊 RESULTADO ESPERADO

**MENSAGEM ENVIADA:**
```
🏋️ FitLife Academia - Sentimos sua falta!

Olá! Notamos que você não aparece há alguns dias na academia.

🎯 OFERTA ESPECIAL DE REATIVAÇÃO:
• 50% OFF na mensalidade  
• Personal trainer gratuito (1 sessão)
• Avaliação física completa

💪 Que tal voltar aos treinos esta semana?

📱 Responda SIM para garantir o desconto!
```

**CONSOLE OUTPUT:**
```
✅ WHATSAPP CONECTADO COM SUCESSO!
📨 Enviando mensagem de reativação...
✅ MENSAGEM ENVIADA COM SUCESSO!
🎉 TESTE CONCLUÍDO - Sistema funcionando!
```

---

## 🚀 PRÓXIMOS PASSOS

Após validação do teste:

1. **Sistema Validado** ✅
2. **Implementar versão completa** com banco de dados
3. **Deploy em produção** com script automatizado
4. **ROI Projetado**: R$ 50.400/ano

---

## ⚠️ IMPORTANTE

- Use apenas para testes com seus próprios números
- WhatsApp Business API requer aprovação para produção
- Sistema completo inclui database, cron jobs e interface web
- Teste simula apenas 1 mensagem do fluxo completo de reativação