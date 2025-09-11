import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { WhatsAppBusinessConnector } from './whatsapp/WhatsAppBusinessConnector.js';
import { AutomationEngine } from './automation/AutomationEngine.js';
import { DatabaseManager } from './database/DatabaseManager.js';
import pino from 'pino';

/**
 * Academia WhatsApp Automation System
 * 
 * IMPORTANT: Enterprise-grade WhatsApp automation for fitness academies
 * PROACTIVELY handles member reactivation, lead nurturing, and prospect outreach
 * ULTRATHINK: Designed for scalability and reliability
 */

// Logger setup
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

// Initialize Fastify server
const server = fastify({ 
  logger,
  trustProxy: true 
});

// CORS configuration
await server.register(cors, {
  origin: process.env.NODE_ENV === 'development' ? true : ['https://your-domain.com'],
  credentials: true
});

// Global state
let whatsapp;
let automation;
let database;

/**
 * Initialize all system components
 */
async function initializeSystem() {
  try {
    logger.info('🚀 Starting Academia WhatsApp Automation System...');

    // Initialize database connection
    database = new DatabaseManager();
    await database.initialize();
    logger.info('✅ Database connection established');

    // Initialize WhatsApp connector
    whatsapp = new WhatsAppBusinessConnector({
      sessionId: process.env.WHATSAPP_SESSION,
      sessionPath: './sessions',
      maxMessagesPerHour: parseInt(process.env.MAX_MESSAGES_PER_HOUR) || 100,
      messageDelay: parseInt(process.env.MESSAGE_DELAY_MS) || 2000
    });

    // Setup WhatsApp event handlers
    setupWhatsAppEvents();

    // Connect to WhatsApp
    await whatsapp.initialize();
    logger.info('✅ WhatsApp connection established');

    // Initialize automation engine
    automation = new AutomationEngine({
      whatsapp,
      database,
      logger
    });

    await automation.initialize();
    logger.info('✅ Automation engine started');

    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize system:', error);
    throw error;
  }
}

/**
 * Setup WhatsApp event handlers
 * IMPORTANT: Routes incoming messages to appropriate automation flows
 */
function setupWhatsAppEvents() {
  whatsapp.on('connected', () => {
    logger.info('WhatsApp connected and ready');
  });

  whatsapp.on('qr', (qr) => {
    logger.info('QR Code generated - scan with WhatsApp app');
  });

  whatsapp.on('message', async (message) => {
    try {
      logger.info('Processing incoming message:', {
        from: message.from,
        type: message.type,
        preview: typeof message.content === 'string' ? message.content.substring(0, 50) : '[media]'
      });

      // Route message to automation engine
      await automation.handleIncomingMessage(message);
    } catch (error) {
      logger.error('Error processing incoming message:', error);
    }
  });

  whatsapp.on('disconnected', (error) => {
    logger.warn('WhatsApp disconnected:', error);
  });
}

/**
 * API Routes
 */

// Health check endpoint
server.get('/health', async (request, reply) => {
  const whatsappStatus = whatsapp ? whatsapp.getStatus() : { connected: false };
  const automationStatus = automation ? automation.getStatus() : { running: false };

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    whatsapp: whatsappStatus,
    automation: automationStatus,
    environment: process.env.NODE_ENV
  };
});

// WhatsApp status endpoint
server.get('/whatsapp/status', async (request, reply) => {
  if (!whatsapp) {
    return reply.status(503).send({ error: 'WhatsApp not initialized' });
  }

  return whatsapp.getStatus();
});

// Send message endpoint (for testing)
server.post('/whatsapp/send', async (request, reply) => {
  const { to, message, type = 'text' } = request.body;

  if (!whatsapp || !whatsapp.isConnected) {
    return reply.status(503).send({ error: 'WhatsApp not connected' });
  }

  try {
    const result = await whatsapp.sendMessage(to, message);
    return { success: true, messageId: result.key.id };
  } catch (error) {
    logger.error('Failed to send message via API:', error);
    return reply.status(400).send({ error: error.message });
  }
});

// Automation controls
server.post('/automation/start', async (request, reply) => {
  if (!automation) {
    return reply.status(503).send({ error: 'Automation not initialized' });
  }

  try {
    await automation.start();
    return { success: true, message: 'Automation started' };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

server.post('/automation/stop', async (request, reply) => {
  if (!automation) {
    return reply.status(503).send({ error: 'Automation not initialized' });
  }

  try {
    await automation.stop();
    return { success: true, message: 'Automation stopped' };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

// Manual trigger endpoints
server.post('/automation/trigger/reactivation', async (request, reply) => {
  const { memberId } = request.body;

  if (!automation) {
    return reply.status(503).send({ error: 'Automation not initialized' });
  }

  try {
    await automation.triggerReactivationFlow(memberId);
    return { success: true, message: 'Reactivation flow triggered' };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

server.post('/automation/trigger/nurturing', async (request, reply) => {
  const { leadId } = request.body;

  if (!automation) {
    return reply.status(503).send({ error: 'Automation not initialized' });
  }

  try {
    await automation.triggerNurturingFlow(leadId);
    return { success: true, message: 'Nurturing flow triggered' };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

// Analytics endpoint
server.get('/analytics/dashboard', async (request, reply) => {
  if (!automation) {
    return reply.status(503).send({ error: 'Automation not initialized' });
  }

  try {
    const analytics = await automation.getAnalytics();
    return analytics;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    if (automation) {
      await automation.stop();
      logger.info('Automation engine stopped');
    }

    if (whatsapp) {
      await whatsapp.disconnect();
      logger.info('WhatsApp disconnected');
    }

    if (database) {
      await database.disconnect();
      logger.info('Database disconnected');
    }

    await server.close();
    logger.info('Server closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Setup signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Start the application
 */
async function start() {
  try {
    // Initialize system components
    await initializeSystem();

    // Start HTTP server
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    logger.info(`🎉 Academia WhatsApp Automation System running on http://${host}:${port}`);
    
    // Log system status
    logger.info('System Status:', {
      whatsapp: whatsapp.getStatus(),
      automation: automation.getStatus(),
      environment: process.env.NODE_ENV,
      pid: process.pid
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
start();