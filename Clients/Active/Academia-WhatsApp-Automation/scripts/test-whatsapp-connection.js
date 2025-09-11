#!/usr/bin/env node

/**
 * TEST WHATSAPP CONNECTION - Full Force Academia
 * 
 * Script para testar e configurar conexão WhatsApp Evolution API
 * Automatiza QR Code setup e validação de conectividade
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Evolution API Configuration
const EVOLUTION_CONFIG = {
  baseUrl: 'http://localhost:8080',
  apiKey: 'academia_evolution_2024',
  instance: 'Full_Force_Academia',
  webhookUrl: 'http://localhost:5678/webhook/evolution',
  settings: {
    rejectCall: true,
    msgCall: 'Ligações não são aceitas pela Full Force Academia. Por favor, envie mensagem de texto.',
    groupsIgnore: false,
    alwaysOnline: true,
    readMessages: true,
    readStatus: true,
    syncFullHistory: false
  }
};

// Full Force Academia Settings
const ACADEMIA_CONFIG = {
  name: "Full Force Academia",
  location: "Matupá-MT",
  businessHours: {
    start: "05:00",
    end: "22:00",
    saturday: { start: "06:00", end: "18:00" },
    sunday: "closed"
  },
  autoReply: {
    enabled: true,
    outsideHours: "Olá! A Full Force Academia está fechada no momento. Nosso horário é Segunda a Sexta: 5h às 22h | Sábado: 6h às 18h. Te responderemos assim que possível! 💪"
  }
};

class WhatsAppConnectionTester {
  constructor() {
    this.instanceId = null;
    this.connectionStatus = 'disconnected';
    this.qrCode = null;
    this.phoneNumber = null;
    this.testResults = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    
    // Log to file
    const logFile = path.join(__dirname, '..', 'logs', 'whatsapp-connection.log');
    const logDir = path.dirname(logFile);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${EVOLUTION_CONFIG.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_CONFIG.apiKey
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      await this.log(`Request failed: ${method} ${url} - ${error.message}`, 'error');
      throw error;
    }
  }

  async checkEvolutionAPI() {
    await this.log('🔍 Checking Evolution API availability...');
    
    try {
      const response = await this.makeRequest('/');
      await this.log('✅ Evolution API is accessible');
      
      this.testResults.push({
        test: 'Evolution API Access',
        status: 'PASS',
        message: 'API is accessible',
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      await this.log(`❌ Evolution API not accessible: ${error.message}`, 'error');
      
      this.testResults.push({
        test: 'Evolution API Access',
        status: 'FAIL',
        message: error.message,
        timestamp: new Date()
      });
      
      return false;
    }
  }

  async createInstance() {
    await this.log('📱 Creating WhatsApp instance...');
    
    try {
      const instanceData = {
        instanceName: EVOLUTION_CONFIG.instance,
        token: EVOLUTION_CONFIG.apiKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhookUrl: EVOLUTION_CONFIG.webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        markMessagesRead: EVOLUTION_CONFIG.settings.readMessages,
        delayMessage: 1000,
        alwaysOnline: EVOLUTION_CONFIG.settings.alwaysOnline,
        readMessages: EVOLUTION_CONFIG.settings.readMessages,
        readStatus: EVOLUTION_CONFIG.settings.readStatus,
        rejectCall: EVOLUTION_CONFIG.settings.rejectCall,
        msgCall: EVOLUTION_CONFIG.settings.msgCall,
        groupsIgnore: EVOLUTION_CONFIG.settings.groupsIgnore,
        syncFullHistory: EVOLUTION_CONFIG.settings.syncFullHistory
      };

      const response = await this.makeRequest('/instance/create', 'POST', instanceData);
      
      if (response.instance) {
        this.instanceId = response.instance.instanceName;
        await this.log(`✅ Instance created: ${this.instanceId}`);
        
        this.testResults.push({
          test: 'Create Instance',
          status: 'PASS',
          message: `Instance ${this.instanceId} created successfully`,
          timestamp: new Date()
        });
        
        return true;
      } else {
        throw new Error('No instance data in response');
      }
    } catch (error) {
      await this.log(`❌ Failed to create instance: ${error.message}`, 'error');
      
      // Instance might already exist, try to connect
      if (error.message.includes('already exists') || error.message.includes('Instance already')) {
        await this.log('ℹ️ Instance already exists, trying to connect...');
        this.instanceId = EVOLUTION_CONFIG.instance;
        return await this.connectToExisting();
      }
      
      this.testResults.push({
        test: 'Create Instance',
        status: 'FAIL',
        message: error.message,
        timestamp: new Date()
      });
      
      return false;
    }
  }

  async connectToExisting() {
    try {
      const response = await this.makeRequest(`/instance/connect/${EVOLUTION_CONFIG.instance}`, 'GET');
      
      if (response.base64) {
        await this.log('✅ Connected to existing instance');
        return true;
      }
      
      return false;
    } catch (error) {
      await this.log(`Failed to connect to existing instance: ${error.message}`, 'error');
      return false;
    }
  }

  async getQRCode() {
    await this.log('🔗 Generating QR Code for WhatsApp connection...');
    
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 30 seconds
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.makeRequest(`/instance/connect/${EVOLUTION_CONFIG.instance}`);
        
        if (response.base64) {
          this.qrCode = response.base64;
          await this.log('✅ QR Code generated successfully');
          
          // Save QR Code to file for easy access
          const qrFile = path.join(__dirname, '..', 'temp', 'whatsapp-qr.txt');
          const qrDir = path.dirname(qrFile);
          
          if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
          }
          
          fs.writeFileSync(qrFile, this.qrCode);
          
          console.log('\n' + '='.repeat(60));
          console.log('📱 WHATSAPP QR CODE READY!');
          console.log('='.repeat(60));
          console.log('1. Open WhatsApp on your phone');
          console.log('2. Go to Settings > Linked Devices');
          console.log('3. Tap "Link a Device"');
          console.log('4. Scan the QR code below:');
          console.log('\nQR Code (copy to browser or QR reader):');
          console.log(this.qrCode);
          console.log('\nOr check file: temp/whatsapp-qr.txt');
          console.log('='.repeat(60));
          
          this.testResults.push({
            test: 'Generate QR Code',
            status: 'PASS',
            message: 'QR Code generated and saved',
            timestamp: new Date()
          });
          
          return true;
        }
        
        await this.log(`⏳ Waiting for QR Code... (attempt ${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
      } catch (error) {
        await this.log(`Error getting QR Code: ${error.message}`, 'error');
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await this.log('❌ Failed to generate QR Code after maximum attempts', 'error');
    
    this.testResults.push({
      test: 'Generate QR Code',
      status: 'FAIL',
      message: 'Failed to generate QR Code after maximum attempts',
      timestamp: new Date()
    });
    
    return false;
  }

  async waitForConnection() {
    await this.log('⏳ Waiting for WhatsApp connection...');
    
    let attempts = 0;
    const maxAttempts = 120; // Wait up to 2 minutes
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.makeRequest(`/instance/connectionState/${EVOLUTION_CONFIG.instance}`);
        
        if (response.instance && response.instance.state === 'open') {
          this.connectionStatus = 'connected';
          this.phoneNumber = response.instance.wuid;
          
          await this.log(`✅ WhatsApp connected successfully! Phone: ${this.phoneNumber}`);
          
          this.testResults.push({
            test: 'WhatsApp Connection',
            status: 'PASS',
            message: `Connected with phone number: ${this.phoneNumber}`,
            timestamp: new Date()
          });
          
          return true;
        }
        
        const state = response.instance ? response.instance.state : 'unknown';
        await this.log(`⏳ Connection state: ${state} (attempt ${attempts + 1}/${maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
      } catch (error) {
        await this.log(`Error checking connection: ${error.message}`, 'error');
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    await this.log('❌ WhatsApp connection timeout', 'error');
    
    this.testResults.push({
      test: 'WhatsApp Connection',
      status: 'FAIL', 
      message: 'Connection timeout',
      timestamp: new Date()
    });
    
    return false;
  }

  async sendTestMessage() {
    if (this.connectionStatus !== 'connected' || !this.phoneNumber) {
      await this.log('⚠️ Cannot send test message - not connected', 'warning');
      return false;
    }

    await this.log('📤 Sending test message...');
    
    try {
      // Send message to the connected number (self-message for testing)
      const testMessage = {
        number: this.phoneNumber.replace('@s.whatsapp.net', ''),
        textMessage: {
          text: `🔥 Full Force Academia - Sistema de Automação Ativo! 💪\n\nTeste realizado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' })}\n\nLocalização: Matupá-MT\nSistema: Funcionando perfeitamente!`
        }
      };

      const response = await this.makeRequest(`/message/sendText/${EVOLUTION_CONFIG.instance}`, 'POST', testMessage);
      
      if (response.key) {
        await this.log('✅ Test message sent successfully');
        
        this.testResults.push({
          test: 'Send Test Message',
          status: 'PASS',
          message: 'Test message sent successfully',
          timestamp: new Date()
        });
        
        return true;
      }
      
      throw new Error('No message key in response');
      
    } catch (error) {
      await this.log(`❌ Failed to send test message: ${error.message}`, 'error');
      
      this.testResults.push({
        test: 'Send Test Message',
        status: 'FAIL',
        message: error.message,
        timestamp: new Date()
      });
      
      return false;
    }
  }

  async setupWebhook() {
    await this.log('🔗 Setting up webhook configuration...');
    
    try {
      const webhookData = {
        webhook: EVOLUTION_CONFIG.webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED', 
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE'
        ]
      };

      const response = await this.makeRequest(`/webhook/set/${EVOLUTION_CONFIG.instance}`, 'POST', webhookData);
      
      await this.log('✅ Webhook configured successfully');
      
      this.testResults.push({
        test: 'Setup Webhook',
        status: 'PASS',
        message: 'Webhook configured successfully',
        timestamp: new Date()
      });
      
      return true;
      
    } catch (error) {
      await this.log(`❌ Failed to setup webhook: ${error.message}`, 'error');
      
      this.testResults.push({
        test: 'Setup Webhook',
        status: 'FAIL',
        message: error.message,
        timestamp: new Date()
      });
      
      return false;
    }
  }

  async validateSystemHealth() {
    await this.log('🏥 Validating system health...');
    
    const healthChecks = [];
    
    // Check instance status
    try {
      const instanceResponse = await this.makeRequest(`/instance/connectionState/${EVOLUTION_CONFIG.instance}`);
      healthChecks.push({
        component: 'WhatsApp Instance',
        status: instanceResponse.instance && instanceResponse.instance.state === 'open' ? 'HEALTHY' : 'UNHEALTHY',
        details: instanceResponse
      });
    } catch (error) {
      healthChecks.push({
        component: 'WhatsApp Instance',
        status: 'UNHEALTHY',
        details: error.message
      });
    }

    // Check webhook status
    try {
      const webhookResponse = await this.makeRequest(`/webhook/find/${EVOLUTION_CONFIG.instance}`);
      healthChecks.push({
        component: 'Webhook',
        status: webhookResponse.webhook ? 'HEALTHY' : 'UNHEALTHY',
        details: webhookResponse
      });
    } catch (error) {
      healthChecks.push({
        component: 'Webhook',
        status: 'UNHEALTHY',
        details: error.message
      });
    }

    const healthySystems = healthChecks.filter(check => check.status === 'HEALTHY').length;
    const totalSystems = healthChecks.length;
    
    await this.log(`🏥 System Health: ${healthySystems}/${totalSystems} components healthy`);
    
    this.testResults.push({
      test: 'System Health Check',
      status: healthySystems === totalSystems ? 'PASS' : 'PARTIAL',
      message: `${healthySystems}/${totalSystems} components healthy`,
      details: healthChecks,
      timestamp: new Date()
    });

    return healthySystems === totalSystems;
  }

  async runFullTest() {
    console.log('🚀 Starting Full Force Academia WhatsApp Connection Test');
    console.log(`📍 Location: ${ACADEMIA_CONFIG.location}`);
    console.log(`⚙️  Instance: ${EVOLUTION_CONFIG.instance}`);
    console.log(`🔗 Evolution API: ${EVOLUTION_CONFIG.baseUrl}\n`);

    const startTime = Date.now();

    // Step 1: Check Evolution API
    const apiOk = await this.checkEvolutionAPI();
    if (!apiOk) {
      console.log('\n❌ Evolution API not available. Please check Docker containers.');
      return false;
    }

    // Step 2: Create/Connect Instance
    const instanceOk = await this.createInstance();
    if (!instanceOk) {
      console.log('\n❌ Failed to create/connect instance.');
      return false;
    }

    // Step 3: Setup Webhook
    await this.setupWebhook();

    // Step 4: Generate QR Code
    const qrOk = await this.getQRCode();
    if (!qrOk) {
      console.log('\n❌ Failed to generate QR Code.');
      return false;
    }

    // Step 5: Wait for connection (user scans QR)
    console.log('\n⏳ Please scan the QR Code with your WhatsApp...');
    const connected = await this.waitForConnection();
    
    if (!connected) {
      console.log('\n❌ WhatsApp connection failed or timed out.');
      return false;
    }

    // Step 6: Send test message
    await this.sendTestMessage();

    // Step 7: Validate system health
    await this.validateSystemHealth();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    this.printSummary(duration);
    
    return this.connectionStatus === 'connected';
  }

  printSummary(duration) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 WHATSAPP CONNECTION TEST SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`🏢 Academia: ${ACADEMIA_CONFIG.name}`);
    console.log(`📍 Location: ${ACADEMIA_CONFIG.location}`);
    console.log(`📱 Instance: ${EVOLUTION_CONFIG.instance}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`🔗 Status: ${this.connectionStatus.toUpperCase()}`);
    
    if (this.phoneNumber) {
      console.log(`📞 Phone: ${this.phoneNumber}`);
    }

    console.log('\n📋 TEST RESULTS:');
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
    });

    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const totalTests = this.testResults.length;
    
    console.log(`\n📊 Overall Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);

    if (this.connectionStatus === 'connected') {
      console.log('\n🎉 WHATSAPP SUCCESSFULLY CONNECTED!');
      console.log('✅ Ready to start automation workflows');
      console.log('✅ N8N can now send WhatsApp messages');
      console.log('✅ Evolution API webhook configured');
      
      console.log('\n🔄 NEXT STEPS:');
      console.log('1. Run: node scripts/import-workflows-academia.js');
      console.log('2. Import ex-students CSV to N8N');
      console.log('3. Start reactivation campaign (20 messages/day)');
      console.log('4. Monitor ROI dashboard');
    } else {
      console.log('\n⚠️ CONNECTION NOT ESTABLISHED');
      console.log('Please check the issues above and try again');
    }
    
    console.log('\n' + '='.repeat(70));

    // Save detailed results to file
    const reportFile = path.join(__dirname, '..', 'reports', `whatsapp-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportFile);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = {
      academia: ACADEMIA_CONFIG,
      instance: EVOLUTION_CONFIG.instance,
      connectionStatus: this.connectionStatus,
      phoneNumber: this.phoneNumber,
      testDuration: duration,
      testResults: this.testResults,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved: ${reportFile}`);
  }
}

// Execute test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WhatsAppConnectionTester();
  
  tester.runFullTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default WhatsAppConnectionTester;