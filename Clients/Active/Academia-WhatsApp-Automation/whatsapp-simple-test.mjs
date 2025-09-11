import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=====================================');
console.log('   TESTE SIMPLES - WHATSAPP');
console.log('   Academia Fitness System');
console.log('=====================================\n');

async function connectWhatsApp() {
    const authPath = path.join(__dirname, 'auth_info_test');
    
    // Criar pasta de autenticação se não existir
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
        console.log('📁 Pasta de autenticação criada:', authPath);
    }

    console.log('🔄 Iniciando conexão com WhatsApp...\n');

    try {
        // Obter versão mais recente do Baileys
        const { version } = await fetchLatestBaileysVersion();
        console.log('📱 Usando Baileys versão:', version);

        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        const sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'error' }),
            printQRInTerminal: false,
            browser: ['Academia Fitness', 'Chrome', '120.0.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: undefined,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true
        });

        // Evento de atualização de conexão
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // QR Code para autenticação
            if (qr) {
                console.log('\n=======================================');
                console.log('📱 ESCANEIE O QR CODE ABAIXO:');
                console.log('=======================================\n');
                
                // Gerar QR Code no terminal
                qrcode.generate(qr, { small: true });
                
                console.log('\n=======================================');
                console.log('⏳ Aguardando escaneamento...');
                console.log('=======================================\n');
            }

            // Conexão estabelecida
            if (connection === 'open') {
                console.log('\n✅ SUCESSO! WhatsApp conectado!\n');
                console.log('📞 Número:', sock.user?.id);
                console.log('👤 Nome:', sock.user?.name || 'Não disponível');
                console.log('\n=======================================\n');
                
                // Teste automático de envio
                console.log('📝 Digite um número para teste (formato: 5511999999999)');
                console.log('   ou digite "sair" para encerrar\n');
                
                // Escutar entrada do usuário
                process.stdin.on('data', async (data) => {
                    const input = data.toString().trim();
                    
                    if (input.toLowerCase() === 'sair') {
                        console.log('\n👋 Encerrando conexão...');
                        sock.end();
                        process.exit(0);
                    }
                    
                    // Verificar se é um número válido
                    if (/^\d{13}$/.test(input)) {
                        const jid = `${input}@s.whatsapp.net`;
                        
                        try {
                            console.log('\n📤 Enviando mensagem de teste...');
                            
                            await sock.sendMessage(jid, { 
                                text: `🏋️ *Teste Sistema Academia*\n\nOlá! Esta é uma mensagem de teste do sistema de automação WhatsApp da Academia Fitness.\n\n✅ Sistema funcionando corretamente!\n💪 Pronto para automatizar sua academia!\n\n_Mensagem enviada em: ${new Date().toLocaleString('pt-BR')}_`
                            });
                            
                            console.log('✅ Mensagem enviada com sucesso!');
                            console.log('\n📝 Digite outro número ou "sair" para encerrar\n');
                        } catch (error) {
                            console.error('❌ Erro ao enviar mensagem:', error.message);
                            console.log('\n📝 Tente novamente ou digite "sair"\n');
                        }
                    } else if (input !== '') {
                        console.log('❌ Formato inválido! Use: 5511999999999');
                        console.log('📝 Tente novamente ou digite "sair"\n');
                    }
                });
            }

            // Conexão fechada
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (lastDisconnect?.error) {
                    console.log('\n❌ Erro de conexão:', lastDisconnect.error.message);
                }
                
                if (shouldReconnect) {
                    console.log('🔄 Tentando reconectar em 5 segundos...\n');
                    setTimeout(() => connectWhatsApp(), 5000);
                } else {
                    console.log('🚪 Desconectado permanentemente (logout).');
                    process.exit(0);
                }
            }

            // Conectando
            if (connection === 'connecting') {
                console.log('🔄 Conectando ao WhatsApp...');
            }
        });

        // Salvar credenciais quando atualizadas
        sock.ev.on('creds.update', saveCreds);

        // Receber mensagens
        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            
            if (!message.key.fromMe && m.type === 'notify') {
                const from = message.key.remoteJid;
                const messageText = message.message?.conversation || 
                                  message.message?.extendedTextMessage?.text || '';
                
                if (messageText) {
                    console.log(`\n📨 Nova mensagem de ${from}:`);
                    console.log(`   "${messageText}"`);
                    
                    // Auto-resposta para teste
                    if (messageText.toLowerCase().includes('oi') || messageText.toLowerCase().includes('olá')) {
                        await sock.sendMessage(from, {
                            text: '👋 Olá! Este é um sistema automatizado da Academia Fitness.\n\nEm breve, implementaremos respostas inteligentes para:\n• Informações sobre planos\n• Horários de funcionamento\n• Agendamento de aulas\n• E muito mais!\n\n_Sistema em fase de testes_'
                        });
                        console.log('↩️  Auto-resposta enviada');
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Erro fatal:', error);
        console.log('\n🔄 Tentando novamente em 5 segundos...');
        setTimeout(() => connectWhatsApp(), 5000);
    }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não capturado:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Promise rejeitada:', err);
});

// Tratamento de saída
process.on('SIGINT', () => {
    console.log('\n\n👋 Encerrando aplicação...');
    process.exit(0);
});

// Iniciar conexão
console.log('🚀 Iniciando aplicação...\n');
connectWhatsApp().catch(console.error);