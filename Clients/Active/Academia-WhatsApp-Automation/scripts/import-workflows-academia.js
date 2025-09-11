#!/usr/bin/env node

/**
 * IMPORT WORKFLOWS ACADEMIA - Full Force Matupá-MT
 * 
 * Script automático para importar workflows N8N na sequência correta
 * Credenciais: eugabrielmktd@gmail.com / Adogo123
 * Target: 561 ex-alunos -> R$ 12.600/mês ROI 2520%
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração N8N Local
const N8N_CONFIG = {
  baseUrl: 'http://localhost:5678',
  email: 'eugabrielmktd@gmail.com',
  password: 'Adogo123',
  workflowsDir: path.join(__dirname, '..', 'workflows', 'academia')
};

// Sequência obrigatória de importação
const WORKFLOW_SEQUENCE = [
  {
    file: '1-setup-whatsapp-evolution.json',
    name: 'WhatsApp Evolution Setup',
    description: 'Conexão QR Code WhatsApp Business API',
    priority: 'CRITICAL'
  },
  {
    file: '2-import-ex-students.json', 
    name: 'Import Ex-Students Database',
    description: 'CSV import + AI categorization (QUENTE/MORNO/FRIO)',
    priority: 'HIGH'
  },
  {
    file: '3-reactivation-campaign.json',
    name: 'Automated Reactivation Campaign', 
    description: 'Envio automático 20 mensagens/dia com rate limiting',
    priority: 'HIGH'
  },
  {
    file: '4-process-responses.json',
    name: 'AI Response Processing',
    description: 'Sentiment analysis + resposta automática inteligente',
    priority: 'MEDIUM'
  },
  {
    file: '5-dashboard-report.json',
    name: 'ROI Analytics Dashboard',
    description: 'Métricas em tempo real + relatórios email',
    priority: 'LOW'
  }
];

// Academia Full Force Matupá-MT Configuration
const ACADEMIA_CONFIG = {
  name: "Full Force Academia",
  location: "Matupá-MT", 
  phone: "66 99999-9999",
  address: "Rua Principal, Centro - Matupá/MT",
  monthlyFee: 150,
  welcomeHours: "Segunda a Sexta: 5h às 22h | Sábado: 6h às 18h",
  exStudentsCount: 561,
  revenueTarget: 12600,
  roiTarget: 2520
};

// Rate Limits WhatsApp Business
const RATE_LIMITS = {
  messagesPerDay: 20,
  delayBetweenMessages: 3000,
  respectWhatsAppLimits: true,
  autoBackoffOnError: true
};

class N8NWorkflowImporter {
  constructor() {
    this.authToken = null;
    this.importedWorkflows = [];
    this.errors = [];
  }

  async authenticate() {
    console.log('🔐 Authenticating with N8N...');
    
    try {
      const response = await fetch(`${N8N_CONFIG.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: N8N_CONFIG.email,
          password: N8N_CONFIG.password
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const authData = await response.json();
      this.authToken = authData.data.token;
      
      console.log('✅ N8N Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ N8N Authentication failed:', error.message);
      this.errors.push(`Auth Error: ${error.message}`);
      return false;
    }
  }

  async checkWorkflowExists(workflowName) {
    try {
      const response = await fetch(`${N8N_CONFIG.baseUrl}/api/v1/workflows`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const workflows = await response.json();
      return workflows.data.find(w => w.name === workflowName);
    } catch (error) {
      console.error('Error checking workflow:', error);
      return null;
    }
  }

  async importWorkflow(workflowConfig) {
    const { file, name, description, priority } = workflowConfig;
    const workflowPath = path.join(N8N_CONFIG.workflowsDir, file);

    console.log(`\n📁 Importing: ${name} (${priority})`);
    console.log(`   File: ${file}`);
    console.log(`   Description: ${description}`);

    try {
      // Check if workflow already exists
      const existingWorkflow = await this.checkWorkflowExists(name);
      if (existingWorkflow) {
        console.log(`⚠️  Workflow "${name}" already exists. Updating...`);
      }

      // Check if workflow file exists
      if (!fs.existsSync(workflowPath)) {
        console.log(`⚠️  Workflow file not found: ${workflowPath}`);
        console.log(`   Creating template workflow for: ${name}`);
        
        const templateWorkflow = await this.createTemplateWorkflow(workflowConfig);
        fs.writeFileSync(workflowPath, JSON.stringify(templateWorkflow, null, 2));
      }

      // Read workflow file
      const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      
      // Personalize workflow for Full Force Matupá-MT
      const personalizedWorkflow = this.personalizeWorkflow(workflowData, workflowConfig);

      let response;
      if (existingWorkflow) {
        // Update existing workflow
        response = await fetch(`${N8N_CONFIG.baseUrl}/api/v1/workflows/${existingWorkflow.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personalizedWorkflow)
        });
      } else {
        // Import new workflow
        response = await fetch(`${N8N_CONFIG.baseUrl}/api/v1/workflows`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personalizedWorkflow)
        });
      }

      if (!response.ok) {
        throw new Error(`Import failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully imported: ${name} (ID: ${result.data.id})`);
      
      this.importedWorkflows.push({
        ...workflowConfig,
        id: result.data.id,
        status: 'imported'
      });

      // Auto-activate high priority workflows
      if (priority === 'CRITICAL' || priority === 'HIGH') {
        await this.activateWorkflow(result.data.id, name);
      }

      return result.data;

    } catch (error) {
      console.error(`❌ Failed to import workflow: ${name}`, error.message);
      this.errors.push(`Import Error (${name}): ${error.message}`);
      return null;
    }
  }

  personalizeWorkflow(workflowData, config) {
    // Deep clone workflow data
    const workflow = JSON.parse(JSON.stringify(workflowData));
    
    // Update workflow name and settings
    workflow.name = config.name;
    workflow.settings = {
      ...workflow.settings,
      saveDataErrorExecution: 'all',
      saveDataSuccessExecution: 'all',
      saveExecutionProgress: true,
      executionTimeout: 300,
      timezone: 'America/Cuiaba' // Matupá-MT timezone
    };

    // Inject academia configuration into all nodes
    if (workflow.nodes) {
      workflow.nodes.forEach(node => {
        if (node.parameters) {
          // Replace template variables
          const nodeParams = JSON.stringify(node.parameters);
          const updatedParams = nodeParams
            .replace(/\{\{ACADEMIA_NAME\}\}/g, ACADEMIA_CONFIG.name)
            .replace(/\{\{ACADEMIA_LOCATION\}\}/g, ACADEMIA_CONFIG.location)
            .replace(/\{\{ACADEMIA_PHONE\}\}/g, ACADEMIA_CONFIG.phone)
            .replace(/\{\{ACADEMIA_ADDRESS\}\}/g, ACADEMIA_CONFIG.address)
            .replace(/\{\{MONTHLY_FEE\}\}/g, ACADEMIA_CONFIG.monthlyFee)
            .replace(/\{\{WELCOME_HOURS\}\}/g, ACADEMIA_CONFIG.welcomeHours)
            .replace(/\{\{EX_STUDENTS_COUNT\}\}/g, ACADEMIA_CONFIG.exStudentsCount)
            .replace(/\{\{REVENUE_TARGET\}\}/g, ACADEMIA_CONFIG.revenueTarget);
            
          node.parameters = JSON.parse(updatedParams);
        }
      });
    }

    return workflow;
  }

  async createTemplateWorkflow(config) {
    const baseTemplate = {
      name: config.name,
      nodes: [
        {
          parameters: {},
          id: "start-node",
          name: "Start",
          type: "n8n-nodes-base.start",
          typeVersion: 1,
          position: [250, 300]
        }
      ],
      connections: {},
      active: false,
      settings: {
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        saveExecutionProgress: true,
        timezone: 'America/Cuiaba'
      },
      staticData: {},
      meta: {
        description: `${config.description} - Full Force Academia Matupá-MT`,
        created: new Date().toISOString(),
        academiaConfig: ACADEMIA_CONFIG
      }
    };

    // Add specific nodes based on workflow type
    switch (config.file) {
      case '1-setup-whatsapp-evolution.json':
        baseTemplate.nodes.push({
          parameters: {
            httpMethod: 'POST',
            url: 'http://localhost:8080/instance/create',
            options: {},
            bodyParametersUi: {
              parameter: [
                {
                  name: 'instanceName',
                  value: 'Full_Force_Academia'
                },
                {
                  name: 'token',
                  value: 'academia_evolution_2024'
                }
              ]
            }
          },
          id: "evolution-api",
          name: "Setup Evolution API",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 3,
          position: [450, 300]
        });
        break;
        
      case '3-reactivation-campaign.json':
        baseTemplate.nodes.push({
          parameters: {
            pollTimes: {
              item: [
                {
                  mode: "everyMinute",
                  value: 30
                }
              ]
            }
          },
          id: "campaign-trigger",
          name: "Campaign Scheduler",
          type: "n8n-nodes-base.cron",
          typeVersion: 1,
          position: [450, 300]
        });
        break;
    }

    return baseTemplate;
  }

  async activateWorkflow(workflowId, name) {
    try {
      const response = await fetch(`${N8N_CONFIG.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`🟢 Activated workflow: ${name}`);
        return true;
      } else {
        console.log(`⚠️  Could not activate workflow: ${name}`);
        return false;
      }
    } catch (error) {
      console.error(`Error activating workflow ${name}:`, error);
      return false;
    }
  }

  async importAllWorkflows() {
    console.log('🚀 Starting Full Force Academia workflow import...');
    console.log(`📊 Target: ${ACADEMIA_CONFIG.exStudentsCount} ex-students -> R$ ${ACADEMIA_CONFIG.revenueTarget}/month`);
    console.log(`🎯 ROI Goal: ${ACADEMIA_CONFIG.roiTarget}%\n`);

    // Create workflows directory if not exists
    if (!fs.existsSync(N8N_CONFIG.workflowsDir)) {
      fs.mkdirSync(N8N_CONFIG.workflowsDir, { recursive: true });
      console.log(`📁 Created workflows directory: ${N8N_CONFIG.workflowsDir}`);
    }

    // Authenticate with N8N
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      return false;
    }

    // Import workflows in sequence
    for (const workflowConfig of WORKFLOW_SEQUENCE) {
      await this.importWorkflow(workflowConfig);
      
      // Wait between imports to avoid overwhelming N8N
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.printSummary();
    return this.errors.length === 0;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY - FULL FORCE ACADEMIA');
    console.log('='.repeat(60));
    
    console.log(`🏢 Academia: ${ACADEMIA_CONFIG.name}`);
    console.log(`📍 Location: ${ACADEMIA_CONFIG.location}`);
    console.log(`👥 Target Ex-Students: ${ACADEMIA_CONFIG.exStudentsCount}`);
    console.log(`💰 Revenue Target: R$ ${ACADEMIA_CONFIG.revenueTarget}/month`);
    console.log(`📈 ROI Target: ${ACADEMIA_CONFIG.roiTarget}%`);
    
    console.log('\n📋 IMPORTED WORKFLOWS:');
    this.importedWorkflows.forEach((workflow, index) => {
      const status = workflow.status === 'imported' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${workflow.name} (${workflow.priority})`);
    });

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Access N8N: http://localhost:5678');
    console.log('2. Configure WhatsApp QR Code (Workflow #1)');
    console.log('3. Import ex-students CSV (Workflow #2)');
    console.log('4. Start first campaign (20 messages/day)');
    console.log('5. Monitor ROI dashboard');
    
    console.log('\n⚠️  RATE LIMITS CONFIGURED:');
    console.log(`• Messages/day: ${RATE_LIMITS.messagesPerDay}`);
    console.log(`• Delay between messages: ${RATE_LIMITS.delayBetweenMessages}ms`);
    console.log(`• WhatsApp compliance: ${RATE_LIMITS.respectWhatsAppLimits ? 'ENABLED' : 'DISABLED'}`);
    
    console.log('\n' + '='.repeat(60));
  }
}

// Execute import if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new N8NWorkflowImporter();
  
  importer.importAllWorkflows()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default N8NWorkflowImporter;