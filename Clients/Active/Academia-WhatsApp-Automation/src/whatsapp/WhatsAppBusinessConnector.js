import { Boom } from '@hapi/boom';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  WAMessageKey,
  proto,
  getContentType
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';

/**
 * WhatsAppBusinessConnector - Conexão robusta com WhatsApp usando Baileys
 * 
 * IMPORTANT: Handles WhatsApp Business automation with proper rate limiting
 * PROACTIVELY manages connection state and error recovery
 * ULTRATHINK: Implements enterprise-grade reliability patterns
 */
export class WhatsAppBusinessConnector {
  constructor(config = {}) {
    this.config = {
      sessionPath: config.sessionPath || './sessions',
      sessionId: config.sessionId || process.env.WHATSAPP_SESSION || 'academia_session',
      autoReconnect: config.autoReconnect !== false,
      qrTimeout: config.qrTimeout || 60000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      messageDelay: config.messageDelay || 2000,
      maxMessagesPerHour: config.maxMessagesPerHour || 100,
      ...config
    };

    this.socket = null;
    this.store = null;
    this.authState = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.messagesSentThisHour = 0;
    this.lastHourReset = new Date();
    this.eventHandlers = new Map();

    // Logger configuration
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    });

    this.setupStore();
  }

  /**
   * Initialize in-memory store for message management
   */
  setupStore() {
    this.store = makeInMemoryStore({ 
      logger: this.logger.child({ module: 'baileys-store' })
    });

    this.store.readFromFile(`${this.config.sessionPath}/${this.config.sessionId}_store.json`);
    
    // Save store every 10 seconds
    setInterval(() => {
      this.store.writeToFile(`${this.config.sessionPath}/${this.config.sessionId}_store.json`);
    }, 10_000);
  }

  /**
   * Initialize WhatsApp connection
   * IMPORTANT: Handles authentication and QR code generation
   */
  async initialize() {
    try {
      this.logger.info(`Initializing WhatsApp connection for session: ${this.config.sessionId}`);

      // Get latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      this.logger.info(`Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

      // Load authentication state
      const { state, saveCreds } = await useMultiFileAuthState(`${this.config.sessionPath}/${this.config.sessionId}`);
      this.authState = { state, saveCreds };

      // Create socket connection
      this.socket = makeWASocket({
        version,
        logger: this.logger.child({ module: 'baileys-socket' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Academia WhatsApp Bot', 'Chrome', '3.0'],
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true
      });

      // Bind store to socket
      this.store.bind(this.socket.ev);

      this.setupEventHandlers();
      this.setupMessageQueue();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - QR code not scanned'));
        }, this.config.qrTimeout);

        this.socket.ev.on('connection.update', (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            this.logger.info('QR Code received, scan with your WhatsApp app');
            qrcode.generate(qr, { small: true });
            this.emit('qr', qr);
          }

          if (connection === 'open') {
            clearTimeout(timeout);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.logger.info('WhatsApp connection established successfully');
            this.emit('connected');
            resolve(this.socket);
          }

          if (connection === 'close') {
            clearTimeout(timeout);
            this.isConnected = false;
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            this.logger.warn(`Connection closed. Reconnect: ${shouldReconnect}`);
            
            if (shouldReconnect && this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
              this.reconnectAttempts++;
              setTimeout(() => this.initialize(), 3000 * this.reconnectAttempts);
            } else {
              this.emit('disconnected', lastDisconnect?.error);
              reject(lastDisconnect?.error || new Error('Connection failed'));
            }
          }
        });

        this.socket.ev.on('creds.update', this.authState.saveCreds);
      });
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp connection:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for incoming messages
   */
  setupEventHandlers() {
    this.socket.ev.on('messages.upsert', async (m) => {
      const messages = m.messages;
      
      for (const message of messages) {
        if (!message.key.fromMe && message.message) {
          await this.handleIncomingMessage(message);
        }
      }
    });

    this.socket.ev.on('messages.update', (messages) => {
      for (const message of messages) {
        this.emit('message.update', message);
      }
    });
  }

  /**
   * Handle incoming WhatsApp messages
   * PROACTIVELY process and route messages to appropriate handlers
   */
  async handleIncomingMessage(message) {
    try {
      const messageType = getContentType(message.message);
      const messageContent = this.extractMessageContent(message, messageType);
      
      const processedMessage = {
        id: message.key.id,
        from: message.key.remoteJid,
        fromMe: message.key.fromMe,
        type: messageType,
        content: messageContent,
        timestamp: message.messageTimestamp,
        pushName: message.pushName,
        raw: message
      };

      this.logger.info('Received message:', {
        from: processedMessage.from,
        type: messageType,
        content: typeof messageContent === 'string' ? messageContent.substring(0, 100) : '[media]'
      });

      this.emit('message', processedMessage);
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
    }
  }

  /**
   * Extract content from different message types
   */
  extractMessageContent(message, messageType) {
    const messageBody = message.message;
    
    switch (messageType) {
      case 'conversation':
        return messageBody.conversation;
      case 'extendedTextMessage':
        return messageBody.extendedTextMessage.text;
      case 'imageMessage':
        return { 
          caption: messageBody.imageMessage.caption || '',
          mimetype: messageBody.imageMessage.mimetype,
          url: messageBody.imageMessage.url
        };
      case 'videoMessage':
        return {
          caption: messageBody.videoMessage.caption || '',
          mimetype: messageBody.videoMessage.mimetype,
          url: messageBody.videoMessage.url
        };
      case 'audioMessage':
        return {
          mimetype: messageBody.audioMessage.mimetype,
          url: messageBody.audioMessage.url,
          duration: messageBody.audioMessage.seconds
        };
      case 'documentMessage':
        return {
          filename: messageBody.documentMessage.fileName,
          mimetype: messageBody.documentMessage.mimetype,
          url: messageBody.documentMessage.url
        };
      default:
        return messageBody;
    }
  }

  /**
   * Send text message with rate limiting
   * IMPORTANT: Implements rate limiting to prevent WhatsApp blocks
   */
  async sendMessage(to, content, options = {}) {
    if (!this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    // Rate limiting check
    if (!this.canSendMessage()) {
      throw new Error('Rate limit exceeded. Try again later.');
    }

    try {
      const chatId = this.formatPhoneNumber(to);
      
      let messageContent;
      if (typeof content === 'string') {
        messageContent = { text: content };
      } else {
        messageContent = content;
      }

      const sentMessage = await this.socket.sendMessage(chatId, messageContent, options);
      
      this.incrementMessageCounter();
      this.logger.info(`Message sent to ${chatId}:`, content);
      
      // Delay between messages
      if (this.config.messageDelay > 0) {
        await this.delay(this.config.messageDelay);
      }

      return sentMessage;
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send interactive message (buttons, lists)
   * PROACTIVELY creates engaging user experiences
   */
  async sendInteractiveMessage(to, interactiveContent) {
    return this.sendMessage(to, interactiveContent, {});
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMediaMessage(to, mediaBuffer, mediaType, caption = '') {
    const messageContent = {};
    messageContent[mediaType] = mediaBuffer;
    
    if (caption && (mediaType === 'image' || mediaType === 'video')) {
      messageContent.caption = caption;
    }

    return this.sendMessage(to, messageContent);
  }

  /**
   * Setup message queue processing
   * ULTRATHINK: Implements reliable message delivery with queuing
   */
  setupMessageQueue() {
    setInterval(() => {
      this.processMessageQueue();
    }, this.config.messageDelay + 1000);

    // Reset hourly message counter
    setInterval(() => {
      this.resetHourlyCounter();
    }, 60 * 60 * 1000);
  }

  /**
   * Process queued messages
   */
  async processMessageQueue() {
    if (this.messageQueue.length === 0 || !this.canSendMessage()) {
      return;
    }

    const message = this.messageQueue.shift();
    try {
      await this.sendMessage(message.to, message.content, message.options);
      this.emit('message.queued.sent', message);
    } catch (error) {
      this.logger.error('Failed to send queued message:', error);
      this.emit('message.queued.failed', { message, error });
    }
  }

  /**
   * Add message to queue
   */
  queueMessage(to, content, options = {}) {
    this.messageQueue.push({ to, content, options, timestamp: new Date() });
    this.logger.info(`Message queued for ${to}. Queue length: ${this.messageQueue.length}`);
  }

  /**
   * Rate limiting utilities
   */
  canSendMessage() {
    const now = new Date();
    const hourDiff = (now - this.lastHourReset) / (1000 * 60 * 60);
    
    if (hourDiff >= 1) {
      this.resetHourlyCounter();
      return true;
    }

    return this.messagesSentThisHour < this.config.maxMessagesPerHour;
  }

  incrementMessageCounter() {
    this.messagesSentThisHour++;
  }

  resetHourlyCounter() {
    this.messagesSentThisHour = 0;
    this.lastHourReset = new Date();
    this.logger.info('Hourly message counter reset');
  }

  /**
   * Utility functions
   */
  formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming Brazil +55)
    let formatted = cleaned;
    if (formatted.length === 11 && formatted.startsWith('11')) {
      formatted = '55' + formatted;
    } else if (formatted.length === 10) {
      formatted = '5511' + formatted;
    }
    
    return formatted + '@s.whatsapp.net';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Event system
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        this.logger.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    if (this.socket) {
      await this.socket.logout();
      this.socket = null;
    }
    this.isConnected = false;
    this.logger.info('WhatsApp disconnected');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      messagesSentThisHour: this.messagesSentThisHour,
      queueLength: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      sessionId: this.config.sessionId
    };
  }
}