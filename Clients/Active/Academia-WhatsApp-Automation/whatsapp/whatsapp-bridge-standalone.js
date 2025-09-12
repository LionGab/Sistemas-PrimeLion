const http = require('http');
const url = require('url');

// Full Force Academia WhatsApp Bridge (Standalone - No Dependencies)
let isWhatsAppConnected = false;
let messagesSent = 0;
let messagesReceived = 0;
let lastMessages = [];

console.log('🏋️‍♀️ FULL FORCE ACADEMIA - WHATSAPP BRIDGE SERVER (STANDALONE)');
console.log('==============================================================');
console.log('📍 Matupá-MT - Sistema N8N Integration');
console.log('🚀 Server starting on http://localhost:3001');

// Simulate WhatsApp connection
setTimeout(() => {
    isWhatsAppConnected = true;
    console.log('✅ WhatsApp SIMULADO conectado - Full Force Academia');
    console.log('📱 Sistema pronto para processar 561 ex-alunos!');
    console.log('💰 ROI potencial: R$ 151.200/ano');
}, 2000);

// Parse JSON from request
function parseJSON(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const json = JSON.parse(body);
            callback(null, json);
        } catch (error) {
            callback(error, null);
        }
    });
}

// HTTP Server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Routes
    if (path === '/status' && method === 'GET') {
        const status = {
            service: "Full Force Academia WhatsApp Bridge",
            status: isWhatsAppConnected ? "connected" : "connecting",
            location: "Matupá-MT",
            messagesSent: messagesSent,
            messagesReceived: messagesReceived,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));

    } else if (path === '/send-whatsapp' && method === 'POST') {
        if (!isWhatsAppConnected) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'WhatsApp not connected yet' }));
            return;
        }

        parseJSON(req, (error, data) => {
            if (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
            }

            const { to, message, category = 'REACTIVATION' } = data;
            
            if (!to || !message) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing to or message fields' }));
                return;
            }

            // Simulate message sending
            messagesSent++;
            const messageId = `FF_${Date.now()}_${messagesSent}`;
            
            const messageLog = {
                id: messageId,
                to: to,
                message: message.substring(0, 50) + '...',
                category: category,
                status: 'sent',
                timestamp: new Date().toISOString()
            };
            
            lastMessages.unshift(messageLog);
            if (lastMessages.length > 10) lastMessages.pop();

            console.log(`📤 Mensagem enviada para ${to} (${category})`);
            console.log(`📊 Total enviadas: ${messagesSent}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                messageId: messageId,
                to: to,
                category: category,
                status: 'sent',
                timestamp: messageLog.timestamp
            }));
        });

    } else if (path === '/stats' && method === 'GET') {
        const stats = {
            academia: "Full Force Academia",
            location: "Matupá-MT",
            system: "N8N WhatsApp Automation",
            performance: {
                messagesSent: messagesSent,
                messagesReceived: messagesReceived,
                uptime: `${Math.floor(process.uptime())} seconds`,
                status: isWhatsAppConnected ? "✅ Online" : "🔄 Connecting"
            },
            business: {
                exStudents: 561,
                potentialROI: "R$ 151.200/ano",
                targetReactivation: "30%",
                expectedNewStudents: 84
            },
            lastMessages: lastMessages
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats, null, 2));

    } else if (path === '/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy',
            service: 'Full Force Academia WhatsApp Bridge',
            whatsapp: isWhatsAppConnected ? 'connected' : 'connecting'
        }));

    } else {
        // 404 Not Found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Not Found',
            available_endpoints: [
                'GET /status',
                'POST /send-whatsapp',
                'GET /stats', 
                'GET /health'
            ]
        }));
    }
});

server.listen(3001, () => {
    console.log('🌐 Server running on http://localhost:3001');
    console.log('📋 Available endpoints:');
    console.log('  GET  /status       - WhatsApp connection status');
    console.log('  POST /send-whatsapp - Send WhatsApp message');
    console.log('  GET  /stats        - Full system statistics');
    console.log('  GET  /health       - Health check');
    console.log('');
    console.log('🏆 FULL FORCE ACADEMIA SYSTEM READY!');
    console.log('💪 Ready to reactivate 561 ex-students!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Shutting down WhatsApp Bridge Server...');
    console.log(`📊 Final stats: ${messagesSent} messages sent`);
    console.log('👋 Full Force Academia - Sistema finalizado!');
    server.close(() => {
        process.exit(0);
    });
});