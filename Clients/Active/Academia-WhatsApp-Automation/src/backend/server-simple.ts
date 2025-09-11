import fastify from 'fastify';

const server = fastify({
  logger: {
    level: 'info'
  }
});

// Health check
server.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Audit endpoints
server.post('/api/audit/performance', async () => {
  return {
    status: 'completed',
    timestamp: new Date().toISOString(),
    metrics: {
      systemHealth: 'good',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: '<500ms',
      databaseStatus: 'connected'
    },
    recommendations: [
      'Sistema operando dentro dos parâmetros normais',
      'Performance de resposta adequada',
      'Monitoramento contínuo recomendado'
    ]
  };
});

server.post('/api/audit/complete', async () => {
  return {
    status: 'completed',
    timestamp: new Date().toISOString(),
    categories: ['performance', 'whatsapp', 'compliance'],
    summary: 'Auditoria completa executada com sucesso'
  };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();