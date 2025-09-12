const express = require('express')
const app = express()
const port = 3001

app.use(express.json())

let isWhatsAppConnected = false
let lastMessageCount = 0

console.log('🏋️‍♀️ FULL FORCE ACADEMIA - WHATSAPP BRIDGE SERVER (SIMPLE)')
console.log('=========================================================')
console.log('📍 Matupá-MT - Sistema N8N Integration')

// Simulate WhatsApp connection status
// In real implementation, this would connect to actual WhatsApp
setTimeout(() => {
    isWhatsAppConnected = true
    console.log('✅ WhatsApp simulado conectado - Full Force Academia')
    console.log('📱 Sistema pronto para enviar mensagens!')
}, 2000)

// API endpoint to send messages from N8N
app.post('/send-whatsapp', async (req, res) => {
    try {
        const { to, message, academia, location, category } = req.body
        
        if (!isWhatsAppConnected) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp não conectado',
                status: 'DISCONNECTED'
            })
        }
        
        // Format phone number
        let phoneNumber = to.replace(/\D/g, '') // Remove non-digits
        if (!phoneNumber.startsWith('55')) {
            phoneNumber = '55' + phoneNumber // Add Brazil code
        }
        
        // Simulate message sending
        lastMessageCount++
        
        console.log(`📤 [${lastMessageCount}] Mensagem para ${phoneNumber} (${category})`)
        console.log(`💬 Conteúdo: ${message.substring(0, 80)}...`)
        console.log('✅ STATUS: Enviado com sucesso')
        console.log('---')
        
        // Simulate random success/failure (95% success rate)
        const success = Math.random() > 0.05
        
        if (!success) {
            throw new Error('Falha simulada no envio')
        }
        
        res.json({
            success: true,
            to: phoneNumber,
            message: 'Mensagem enviada com sucesso',
            timestamp: new Date().toISOString(),
            academia: academia || 'Full Force Academia',
            location: location || 'Matupá-MT',
            category: category,
            messageId: `msg_${Date.now()}_${lastMessageCount}`,
            status: 'SENT'
        })
        
        // Simulate auto-response for testing
        if (message.toLowerCase().includes('quente') && Math.random() > 0.7) {
            setTimeout(() => {
                console.log('🤖 Simulando resposta automática do cliente...')
                simulateClientResponse(phoneNumber)
            }, 5000)
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error.message)
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            status: 'FAILED'
        })
    }
})

// Simulate client response
async function simulateClientResponse(fromPhone) {
    const responses = [
        'SIM, tenho interesse!',
        'Quero saber mais sobre os valores',
        'Que horários vocês têm disponível?',
        'QUERO voltar a treinar!'
    ]
    
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    console.log('📨 Resposta simulada recebida:', fromPhone.substring(0, -13))
    console.log('💬 Cliente respondeu:', response)
    
    // Send to N8N webhook (if available)
    try {
        await fetch('http://localhost:5678/webhook/whatsapp-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromPhone + '@s.whatsapp.net',
                phone: fromPhone,
                message: response,
                timestamp: new Date().toISOString(),
                academia: 'Full Force Academia',
                location: 'Matupá-MT',
                type: 'client_response',
                simulated: true
            })
        })
        console.log('✅ Resposta enviada para N8N')
    } catch (error) {
        console.log('⚠️ N8N webhook não disponível')
    }
}

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        whatsapp_connected: isWhatsAppConnected,
        server_status: 'running',
        academia: 'Full Force Academia',
        location: 'Matupá-MT',
        messages_sent: lastMessageCount,
        timestamp: new Date().toISOString(),
        version: 'simple-bridge-v1.0'
    })
})

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        whatsapp: isWhatsAppConnected ? 'connected' : 'connecting...',
        uptime: process.uptime()
    })
})

// Test endpoint
app.post('/test-message', (req, res) => {
    const testMessage = {
        to: '5566999999999',
        message: 'Teste de conexão - Full Force Academia',
        academia: 'Full Force Academia',
        location: 'Matupá-MT',
        category: 'TEST'
    }
    
    console.log('🧪 Enviando mensagem de teste...')
    
    // Simulate test message
    setTimeout(() => {
        console.log('✅ Mensagem de teste enviada com sucesso!')
        res.json({
            success: true,
            message: 'Teste realizado com sucesso',
            timestamp: new Date().toISOString()
        })
    }, 1000)
})

// Stats endpoint
app.get('/stats', (req, res) => {
    res.json({
        messages_sent_today: lastMessageCount,
        whatsapp_status: isWhatsAppConnected ? 'CONNECTED' : 'DISCONNECTED',
        server_uptime: process.uptime(),
        last_activity: new Date().toISOString(),
        academia: {
            name: 'Full Force Academia',
            location: 'Matupá-MT',
            target_ex_students: 561,
            daily_limit: 20
        }
    })
})

// Start server
app.listen(port, () => {
    console.log()
    console.log(`🚀 WhatsApp Bridge Server rodando na porta ${port}`)
    console.log(`📊 Status: http://localhost:${port}/status`)
    console.log(`🏥 Health: http://localhost:${port}/health`)
    console.log(`🧪 Test: http://localhost:${port}/test-message`)
    console.log(`📈 Stats: http://localhost:${port}/stats`)
    console.log()
    console.log('🎯 Pronto para integração com N8N!')
    console.log('💰 ROI esperado: R$ 12.600/mês')
    console.log('🏋️‍♀️ Full Force Academia - Matupá/MT')
    console.log()
})

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Desligando servidor WhatsApp Bridge...')
    console.log(`📊 Total de mensagens processadas: ${lastMessageCount}`)
    console.log('✅ Servidor desligado com sucesso!')
    process.exit(0)
})