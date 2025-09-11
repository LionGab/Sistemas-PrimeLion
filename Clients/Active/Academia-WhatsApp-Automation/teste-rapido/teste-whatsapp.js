const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');

// ⚙️ CONFIGURAÇÃO - MUDE SEU NÚMERO AQUI
const NUMERO_TESTE = '5566999301589'; // SEM @s.whatsapp.net

async function testeAcademiaWhatsApp() {
    console.log('🏋️ ACADEMIA WHATSAPP AUTOMATION - TESTE RÁPIDO');
    console.log('===============================================');
    console.log('🔄 Iniciando conexão WhatsApp...\n');

    try {
        // Usar pasta auth para salvar sessão
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        // Salvar credenciais quando atualizar
        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 ESCANEIE O QR CODE COM SEU WHATSAPP:');
                console.log('=====================================');
                qrcode.generate(qr, { small: true });
                console.log('=====================================\n');
                console.log('⏳ Aguardando conexão...\n');
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Conexão fechada. Reconectando?', shouldReconnect);
                
                if (shouldReconnect) {
                    testeAcademiaWhatsApp();
                }
            } else if (connection === 'open') {
                console.log('✅ WHATSAPP CONECTADO COM SUCESSO!');
                console.log('==================================\n');
                
                // Aguardar 2 segundos para garantir conexão estável
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                await enviarMensagemTeste(sock);
            }
        });

        // Manter conexão ativa
        sock.ev.on('messages.upsert', async (msg) => {
            // Log de mensagens recebidas (opcional)
        });

    } catch (error) {
        console.error('❌ ERRO na conexão:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Verifique sua internet');
        console.log('2. Tente: npm install @whiskeysockets/baileys@6.7.0');
        console.log('3. Delete pasta ./auth_info e tente novamente');
    }
}

async function enviarMensagemTeste(sock) {
    try {
        const numeroCompleto = `${NUMERO_TESTE}@s.whatsapp.net`;
        
        // Mensagem de reativação realística
        const mensagemReativacao = `🏋️ *FitLife Academia* - Sentimos sua falta!

Olá! Notamos que você não aparece há alguns dias na academia.

🎯 *OFERTA ESPECIAL DE REATIVAÇÃO:*
• 50% OFF na mensalidade
• Personal trainer gratuito (1 sessão)
• Avaliação física completa

💪 Que tal voltar aos treinos esta semana?

📱 Responda *SIM* para garantir o desconto!

---
*Academia FitLife - Transformando vidas através do movimento*`;

        console.log('📨 Enviando mensagem de reativação...');
        console.log('👤 Para:', NUMERO_TESTE);
        console.log('💬 Mensagem:');
        console.log('=====================================');
        console.log(mensagemReativacao);
        console.log('=====================================\n');
        
        await sock.sendMessage(numeroCompleto, { text: mensagemReativacao });
        
        console.log('✅ MENSAGEM ENVIADA COM SUCESSO!');
        console.log('=================================');
        console.log('🎉 TESTE CONCLUÍDO - Sistema funcionando!');
        console.log('📱 Verifique seu WhatsApp para ver a mensagem');
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Sistema validado ✅');
        console.log('2. Pronto para implementação completa');
        console.log('3. ROI projetado: R$ 50.400/ano');
        
        // Aguardar 30 segundos antes de fechar
        console.log('\n⏰ Mantendo conexão por 30s para testes...');
        setTimeout(() => {
            console.log('🔚 Finalizando teste. Conexão mantida em ./auth_info');
            process.exit(0);
        }, 30000);
        
    } catch (error) {
        console.error('❌ ERRO ao enviar mensagem:', error.message);
        console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
        console.log('1. Verifique se o número está correto');
        console.log('2. Número deve estar no formato: 5511999999999');
        console.log('3. Certifique-se que o número tem WhatsApp ativo');
    }
}

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
    console.error('❌ ERRO CRÍTICO:', error.message);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ PROMISE REJEITADA:', error.message);
});

// Iniciar teste
console.log('🔧 INSTRUÇÕES IMPORTANTES:');
console.log('==========================');
console.log(`📞 Número configurado: ${NUMERO_TESTE}`);
console.log('💡 Para mudar, edite NUMERO_TESTE no arquivo');
console.log('⚠️  Use seu próprio número para testar');
console.log('🔄 Iniciando em 3 segundos...\n');

setTimeout(() => {
    testeAcademiaWhatsApp();
}, 3000);