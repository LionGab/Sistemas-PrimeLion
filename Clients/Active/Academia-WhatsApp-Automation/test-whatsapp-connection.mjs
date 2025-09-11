import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do logger
const logger = pino({ level: 'info' });

// Interface para entrada do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class WhatsAppTest {
    constructor() {
        this.sock = null;
        this.authPath = path.join(__dirname, 'auth_info_test');
    }

    async initialize() {
        console.log('\n🚀 Iniciando conexão com WhatsApp...\n');
        
        // Criar pasta de autenticação se não existir
        if (!fs.existsSync(this.authPath)) {
            fs.mkdirSync(this.authPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

        this.sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'error' }),
            printQRInTerminal: false,
            browser: ['Academia Fitness System', 'Chrome', '120.0.0.0']
        });

        // Eventos de conexão
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n📱 ESCANEIE O QR CODE COM SEU WHATSAPP:\n');
                qrcode.generate(qr, { small: true });
                console.log('\n⏳ Aguardando conexão...\n');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Conexão fechada. Reconectar?', shouldReconnect);
                
                if (shouldReconnect) {
                    setTimeout(() => this.initialize(), 5000);
                }
            } else if (connection === 'open') {
                console.log('\n✅ WhatsApp conectado com sucesso!\n');
                console.log('📞 Número conectado:', this.sock.user?.id);
                console.log('👤 Nome:', this.sock.user?.name || 'Não disponível');
                console.log('\n=====================================\n');
                
                await this.showMenu();
            }
        });

        // Salvar credenciais
        this.sock.ev.on('creds.update', saveCreds);

        // Receber mensagens
        this.sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe && m.type === 'notify') {
                const from = message.key.remoteJid;
                const messageText = message.message?.conversation || 
                                  message.message?.extendedTextMessage?.text || '';
                
                if (messageText) {
                    console.log(`\n📨 Mensagem recebida de ${from}:`);
                    console.log(`   "${messageText}"\n`);
                    
                    // Auto-resposta de teste
                    if (messageText.toLowerCase().includes('teste')) {
                        await this.sendMessage(from, '🤖 Teste recebido! Sistema Academia WhatsApp funcionando! 💪');
                    }
                }
            }
        });
    }

    async showMenu() {
        console.log('OPÇÕES DE TESTE:');
        console.log('1. Enviar mensagem de teste');
        console.log('2. Testar template de boas-vindas');
        console.log('3. Testar template de reativação');
        console.log('4. Testar template de renovação');
        console.log('5. Ver status da conexão');
        console.log('6. Sair\n');

        rl.question('Escolha uma opção: ', async (option) => {
            switch(option) {
                case '1':
                    await this.testSendMessage();
                    break;
                case '2':
                    await this.testWelcomeTemplate();
                    break;
                case '3':
                    await this.testReactivationTemplate();
                    break;
                case '4':
                    await this.testRenewalTemplate();
                    break;
                case '5':
                    await this.showStatus();
                    break;
                case '6':
                    console.log('\n👋 Encerrando...');
                    process.exit(0);
                default:
                    console.log('\n❌ Opção inválida!\n');
            }
            
            setTimeout(() => this.showMenu(), 1000);
        });
    }

    async testSendMessage() {
        rl.question('\nDigite o número (com 55 e DDD, ex: 5511999999999): ', async (number) => {
            rl.question('Digite a mensagem: ', async (message) => {
                try {
                    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
                    await this.sendMessage(jid, message);
                    console.log('\n✅ Mensagem enviada com sucesso!\n');
                } catch (error) {
                    console.error('\n❌ Erro ao enviar:', error.message, '\n');
                }
            });
        });
    }

    async testWelcomeTemplate() {
        rl.question('\nDigite o número (com 55 e DDD): ', async (number) => {
            rl.question('Digite o nome do visitante: ', async (name) => {
                try {
                    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
                    const message = `🏋️ *Bem-vindo(a) à Academia Fitness, ${name}!*

Foi um prazer receber sua visita hoje! 

🎯 *Baseado no seu objetivo de:*
• Ganho de massa muscular
• Perda de peso
• Condicionamento físico

📋 *Preparei um plano especial para você:*
✅ Avaliação física completa GRÁTIS
✅ 3 treinos personalizados
✅ Acompanhamento nutricional básico
✅ Primeira semana experimental

💰 *Oferta Exclusiva Hoje:*
Matricule-se nas próximas 48h e ganhe:
• 30% de desconto no primeiro mês
• Matrícula GRÁTIS (economia de R$99)
• Camiseta exclusiva da academia

📱 Responda com *SIM* para agendar sua primeira aula!

_Esta mensagem é automática. Para falar com um consultor, digite ATENDIMENTO_`;
                    
                    await this.sendMessage(jid, message);
                    console.log('\n✅ Template de boas-vindas enviado!\n');
                } catch (error) {
                    console.error('\n❌ Erro:', error.message, '\n');
                }
            });
        });
    }

    async testReactivationTemplate() {
        rl.question('\nDigite o número (com 55 e DDD): ', async (number) => {
            rl.question('Digite o nome do aluno: ', async (name) => {
                try {
                    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
                    const message = `💪 *Oi ${name}, sentimos sua falta!*

Notamos que você não aparece há 15 dias na academia...

Está tudo bem? 🤔

Sabemos que a rotina às vezes aperta, mas lembre-se:
• Seus resultados dependem da consistência
• Cada dia faz diferença
• Estamos aqui para te apoiar!

🎁 *Oferta de Retorno:*
Volte esta semana e ganhe:
✅ 15% de desconto este mês
✅ Avaliação física atualizada GRÁTIS
✅ Treino novo e motivador

Que tal retomar seu objetivo? 
Responda *VOLTAR* e agendaremos seu retorno!

_Para parar de receber mensagens, digite PARAR_`;
                    
                    await this.sendMessage(jid, message);
                    console.log('\n✅ Template de reativação enviado!\n');
                } catch (error) {
                    console.error('\n❌ Erro:', error.message, '\n');
                }
            });
        });
    }

    async testRenewalTemplate() {
        rl.question('\nDigite o número (com 55 e DDD): ', async (number) => {
            rl.question('Digite o nome do aluno: ', async (name) => {
                try {
                    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
                    const message = `📅 *${name}, seu plano vence em 7 dias!*

⚠️ *Vencimento:* 17/09/2025
💳 *Valor:* R$ 149,90

🎯 *Renove antecipado e ganhe:*
• 5% de desconto pagando via PIX
• Parcelamento em até 3x sem juros
• Congele o preço por 6 meses

💰 *Formas de pagamento:*
• PIX: R$ 142,40 (com desconto)
• Cartão: 3x de R$ 49,97
• Dinheiro: Na recepção

📱 *Renovar agora?*
Responda:
*1* - Pagar com PIX
*2* - Parcelar no cartão
*3* - Falar com atendente

_Evite a suspensão do seu acesso. Renove hoje mesmo!_`;
                    
                    await this.sendMessage(jid, message);
                    console.log('\n✅ Template de renovação enviado!\n');
                } catch (error) {
                    console.error('\n❌ Erro:', error.message, '\n');
                }
            });
        });
    }

    async showStatus() {
        console.log('\n📊 STATUS DA CONEXÃO:');
        console.log('=====================================');
        console.log('Estado:', this.sock.ws?.readyState === 1 ? '✅ Conectado' : '❌ Desconectado');
        console.log('Número:', this.sock.user?.id || 'Não disponível');
        console.log('Nome:', this.sock.user?.name || 'Não disponível');
        console.log('=====================================\n');
    }

    async sendMessage(jid, text) {
        return await this.sock.sendMessage(jid, { text });
    }
}

// Iniciar teste
console.log('=====================================');
console.log('   TESTE DE CONEXÃO WHATSAPP');
console.log('   Academia Fitness Automation');
console.log('=====================================\n');

const test = new WhatsAppTest();
test.initialize().catch(console.error);

// Tratamento de saída
process.on('SIGINT', () => {
    console.log('\n\n👋 Encerrando conexão...');
    process.exit(0);
});