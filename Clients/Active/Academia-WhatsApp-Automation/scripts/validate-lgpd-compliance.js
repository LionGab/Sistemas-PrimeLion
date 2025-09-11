#!/usr/bin/env node

/**
 * LGPD COMPLIANCE VALIDATOR - Full Force Academia
 * 
 * Sistema de validação automática de conformidade LGPD
 * Para automação WhatsApp de academias brasileiras
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LGPD Requirements for WhatsApp Automation
const LGPD_REQUIREMENTS = {
  dataMinimization: {
    required: true,
    description: "Coletar apenas dados estritamente necessários",
    validFields: ['nome', 'telefone', 'ultima_atividade', 'status_membro', 'categoria']
  },
  consent: {
    required: true,
    description: "Consentimento explícito para comunicação",
    methods: ['opt_in_explícito', 'renovação_contrato', 'interesse_manifestado']
  },
  transparency: {
    required: true,
    description: "Transparência no uso dos dados",
    requirements: ['finalidade_clara', 'politica_privacidade', 'direitos_titular']
  },
  dataRetention: {
    maxPeriod: "24 months",
    description: "Prazo máximo de retenção de dados",
    automaticDeletion: true
  },
  revokeRights: {
    required: true,
    description: "Direito de revogação e exclusão",
    methods: ['reply_SAIR', 'solicitacao_email', 'presencial']
  },
  auditTrail: {
    required: true,
    description: "Trilha de auditoria completa",
    retention: "5 years",
    encrypted: true
  },
  dataProtection: {
    encryption: "AES-256",
    accessControl: true,
    backupSecurity: true,
    transferProtection: true
  }
};

// Palavras-chave para detecção de opt-out
const OPT_OUT_KEYWORDS = [
  'sair', 'parar', 'remover', 'cancelar', 'stop', 
  'não envie mais', 'nao envie mais', 'remova-me', 
  'não quero mais', 'nao quero mais', 'descadastrar',
  'unsubscribe', 'opt-out', 'remove', 'delete'
];

// Dados sensíveis que NUNCA devem ser coletados/armazenados
const SENSITIVE_DATA_BLACKLIST = [
  'cpf', 'cnpj', 'rg', 'passaporte', 'cartao_credito', 
  'conta_bancaria', 'dados_saude', 'orientacao_sexual',
  'origem_racial', 'opiniao_politica', 'crenca_religiosa',
  'dados_biometricos', 'dados_geneticos'
];

class LGPDComplianceValidator {
  constructor() {
    this.validationResults = [];
    this.errors = [];
    this.warnings = [];
    this.score = 0;
    this.maxScore = 0;
    this.timestamp = new Date().toISOString();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    
    // Log to file
    const logFile = path.join(__dirname, '..', 'logs', 'lgpd-compliance.log');
    const logDir = path.dirname(logFile);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  addResult(category, test, status, message, recommendation = null) {
    const result = {
      category,
      test,
      status, // PASS, FAIL, WARNING
      message,
      recommendation,
      timestamp: new Date().toISOString()
    };

    this.validationResults.push(result);
    
    if (status === 'PASS') {
      this.score++;
    } else if (status === 'FAIL') {
      this.errors.push(result);
    } else if (status === 'WARNING') {
      this.warnings.push(result);
    }
    
    this.maxScore++;
  }

  async validateDataMinimization() {
    this.log('📊 Validating data minimization principles...');
    
    const configFile = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    try {
      if (!fs.existsSync(configFile)) {
        this.addResult(
          'Data Minimization',
          'Configuration File',
          'FAIL',
          'Academy configuration file not found',
          'Create academy-config-matupa.json with data collection specifications'
        );
        return false;
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      
      // Validate collected data fields
      const dataFields = config.analytics?.collectFields || [];
      const invalidFields = dataFields.filter(field => 
        !LGPD_REQUIREMENTS.dataMinimization.validFields.includes(field)
      );
      
      if (invalidFields.length > 0) {
        this.addResult(
          'Data Minimization',
          'Invalid Data Fields',
          'FAIL',
          `Invalid data fields configured: ${invalidFields.join(', ')}`,
          'Remove unnecessary data fields and collect only: nome, telefone, ultima_atividade, status_membro, categoria'
        );
        return false;
      }

      // Check for sensitive data collection
      const sensitiveFields = dataFields.filter(field => 
        SENSITIVE_DATA_BLACKLIST.some(sensitive => field.toLowerCase().includes(sensitive))
      );
      
      if (sensitiveFields.length > 0) {
        this.addResult(
          'Data Minimization',
          'Sensitive Data Collection',
          'FAIL',
          `Sensitive data fields detected: ${sensitiveFields.join(', ')}`,
          'Remove all sensitive data fields immediately - LGPD violation'
        );
        return false;
      }

      this.addResult(
        'Data Minimization',
        'Data Collection Scope',
        'PASS',
        'Only necessary data fields are configured for collection'
      );

      return true;
      
    } catch (error) {
      this.addResult(
        'Data Minimization',
        'Validation Error',
        'FAIL',
        `Error validating data minimization: ${error.message}`,
        'Fix configuration file format and ensure valid JSON structure'
      );
      return false;
    }
  }

  async validateConsent() {
    this.log('✋ Validating consent mechanisms...');
    
    const templatesFile = path.join(__dirname, '..', 'config', 'message-templates-local.json');
    
    try {
      if (!fs.existsSync(templatesFile)) {
        this.addResult(
          'Consent',
          'Templates File',
          'FAIL',
          'Message templates file not found',
          'Create message-templates-local.json with consent mechanisms'
        );
        return false;
      }

      const templates = JSON.parse(fs.readFileSync(templatesFile, 'utf8'));
      
      // Check for opt-out mechanism in templates
      const hasOptOut = templates.templates?.opt_out != null;
      
      if (!hasOptOut) {
        this.addResult(
          'Consent',
          'Opt-out Mechanism',
          'FAIL',
          'No opt-out template found in message templates',
          'Add opt-out template with clear instructions (reply SAIR)'
        );
        return false;
      }

      // Validate opt-out template content
      const optOutTemplate = templates.templates.opt_out.variants[0];
      const hasRevokeInstruction = OPT_OUT_KEYWORDS.some(keyword => 
        optOutTemplate.message.toLowerCase().includes(keyword)
      );
      
      if (!hasRevokeInstruction) {
        this.addResult(
          'Consent',
          'Opt-out Instructions',
          'FAIL',
          'Opt-out template does not contain clear revocation instructions',
          'Include clear opt-out instructions in the template (e.g., "reply SAIR")'
        );
        return false;
      }

      // Check for consent validation in campaign templates
      const campaignTemplates = ['quente_reativacao', 'morno_promocao', 'frio_isca'];
      let consentWarnings = 0;
      
      campaignTemplates.forEach(templateName => {
        const template = templates.templates[templateName];
        if (template) {
          const hasConsentInfo = template.variants.some(variant =>
            variant.message.toLowerCase().includes('sair') ||
            variant.message.toLowerCase().includes('cancelar')
          );
          
          if (!hasConsentInfo) {
            consentWarnings++;
          }
        }
      });

      if (consentWarnings > 0) {
        this.addResult(
          'Consent',
          'Campaign Consent Info',
          'WARNING',
          `${consentWarnings} campaign templates lack opt-out information`,
          'Consider adding opt-out instructions to campaign templates'
        );
      } else {
        this.addResult(
          'Consent',
          'Campaign Consent Info',
          'PASS',
          'Campaign templates include consent information'
        );
      }

      this.addResult(
        'Consent',
        'Consent Mechanisms',
        'PASS',
        'Proper consent and opt-out mechanisms are configured'
      );

      return true;
      
    } catch (error) {
      this.addResult(
        'Consent',
        'Validation Error',
        'FAIL',
        `Error validating consent: ${error.message}`,
        'Fix templates file format and ensure valid JSON structure'
      );
      return false;
    }
  }

  async validateTransparency() {
    this.log('👁️ Validating transparency requirements...');
    
    const configFile = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    try {
      if (!fs.existsSync(configFile)) {
        this.addResult(
          'Transparency',
          'Configuration Missing',
          'FAIL',
          'Academy configuration file not found for transparency validation'
        );
        return false;
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const compliance = config.compliance?.lgpd || {};
      
      // Check privacy policy URL
      if (!compliance.privacyPolicyUrl) {
        this.addResult(
          'Transparency',
          'Privacy Policy URL',
          'FAIL',
          'Privacy policy URL not configured',
          'Configure compliance.lgpd.privacyPolicyUrl in academy config'
        );
        return false;
      }

      // Check data controller identification
      if (!compliance.dataController) {
        this.addResult(
          'Transparency',
          'Data Controller',
          'FAIL',
          'Data controller not identified',
          'Configure compliance.lgpd.dataController in academy config'
        );
        return false;
      }

      // Check DPO contact
      if (!compliance.dataProtectionOfficer) {
        this.addResult(
          'Transparency',
          'Data Protection Officer',
          'WARNING',
          'Data Protection Officer contact not configured',
          'Configure compliance.lgpd.dataProtectionOfficer for better compliance'
        );
      } else {
        this.addResult(
          'Transparency',
          'Data Protection Officer',
          'PASS',
          'Data Protection Officer contact is configured'
        );
      }

      this.addResult(
        'Transparency',
        'Transparency Information',
        'PASS',
        'Basic transparency requirements are met'
      );

      return true;
      
    } catch (error) {
      this.addResult(
        'Transparency',
        'Validation Error',
        'FAIL',
        `Error validating transparency: ${error.message}`
      );
      return false;
    }
  }

  async validateDataRetention() {
    this.log('⏰ Validating data retention policies...');
    
    const configFile = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    try {
      if (!fs.existsSync(configFile)) {
        this.addResult(
          'Data Retention',
          'Configuration Missing',
          'FAIL',
          'Academy configuration file not found for retention validation'
        );
        return false;
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const retention = config.compliance?.lgpd?.dataRetention;
      
      if (!retention) {
        this.addResult(
          'Data Retention',
          'Retention Policy',
          'FAIL',
          'Data retention policy not configured',
          'Configure compliance.lgpd.dataRetention in academy config (max 24 months)'
        );
        return false;
      }

      // Validate retention period
      const retentionMonths = parseInt(retention.split(' ')[0]);
      if (retentionMonths > 24) {
        this.addResult(
          'Data Retention',
          'Retention Period',
          'FAIL',
          `Data retention period too long: ${retention}`,
          'Set data retention to maximum 24 months for LGPD compliance'
        );
        return false;
      }

      // Check for automatic deletion configuration
      const backupConfig = config.backup;
      if (!backupConfig || !backupConfig.retention) {
        this.addResult(
          'Data Retention',
          'Automatic Deletion',
          'WARNING',
          'Automatic data deletion not configured',
          'Configure automatic data deletion after retention period expires'
        );
      } else {
        this.addResult(
          'Data Retention',
          'Automatic Deletion',
          'PASS',
          'Automatic data deletion is configured'
        );
      }

      this.addResult(
        'Data Retention',
        'Retention Policy',
        'PASS',
        `Data retention policy compliant: ${retention}`
      );

      return true;
      
    } catch (error) {
      this.addResult(
        'Data Retention',
        'Validation Error',
        'FAIL',
        `Error validating data retention: ${error.message}`
      );
      return false;
    }
  }

  async validateAuditTrail() {
    this.log('📋 Validating audit trail configuration...');
    
    const configFile = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    try {
      if (!fs.existsSync(configFile)) {
        this.addResult(
          'Audit Trail',
          'Configuration Missing',
          'FAIL',
          'Academy configuration file not found for audit validation'
        );
        return false;
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const compliance = config.compliance?.lgpd || {};
      
      if (compliance.auditTrail !== 'complete') {
        this.addResult(
          'Audit Trail',
          'Audit Configuration',
          'FAIL',
          'Complete audit trail not configured',
          'Set compliance.lgpd.auditTrail to "complete"'
        );
        return false;
      }

      // Check security configuration
      const security = config.security;
      if (!security?.auditLogging) {
        this.addResult(
          'Audit Trail',
          'Audit Logging',
          'FAIL',
          'Audit logging not enabled',
          'Enable security.auditLogging in academy config'
        );
        return false;
      }

      // Check encryption for sensitive data
      if (!security?.encryptSensitiveData) {
        this.addResult(
          'Audit Trail',
          'Data Encryption',
          'FAIL',
          'Sensitive data encryption not configured',
          'Enable security.encryptSensitiveData in academy config'
        );
        return false;
      }

      // Check logs directory
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
        this.addResult(
          'Audit Trail',
          'Logs Directory',
          'WARNING',
          'Logs directory created',
          'Ensure proper log rotation and backup procedures'
        );
      } else {
        this.addResult(
          'Audit Trail',
          'Logs Directory',
          'PASS',
          'Logs directory exists and is accessible'
        );
      }

      this.addResult(
        'Audit Trail',
        'Audit Trail Configuration',
        'PASS',
        'Audit trail is properly configured'
      );

      return true;
      
    } catch (error) {
      this.addResult(
        'Audit Trail',
        'Validation Error',
        'FAIL',
        `Error validating audit trail: ${error.message}`
      );
      return false;
    }
  }

  async validateRateLimits() {
    this.log('🚦 Validating rate limits for WhatsApp compliance...');
    
    const configFile = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    try {
      if (!fs.existsSync(configFile)) {
        this.addResult(
          'Rate Limits',
          'Configuration Missing',
          'FAIL',
          'Academy configuration file not found for rate limit validation'
        );
        return false;
      }

      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      const rateLimits = config.rateLimits?.whatsapp || {};
      
      // Validate daily message limit
      if (!rateLimits.messagesPerDay || rateLimits.messagesPerDay > 20) {
        this.addResult(
          'Rate Limits',
          'Daily Message Limit',
          'FAIL',
          `Daily message limit too high or not set: ${rateLimits.messagesPerDay}`,
          'Set messagesPerDay to maximum 20 for WhatsApp Business compliance'
        );
        return false;
      }

      // Validate message delay
      if (!rateLimits.delayBetweenMessages || rateLimits.delayBetweenMessages < 3000) {
        this.addResult(
          'Rate Limits',
          'Message Delay',
          'FAIL',
          `Message delay too short: ${rateLimits.delayBetweenMessages}ms`,
          'Set delayBetweenMessages to minimum 3000ms (3 seconds)'
        );
        return false;
      }

      // Validate WhatsApp limits respect
      if (!rateLimits.respectWhatsAppLimits) {
        this.addResult(
          'Rate Limits',
          'WhatsApp Limits Respect',
          'FAIL',
          'WhatsApp limits respect not configured',
          'Set respectWhatsAppLimits to true'
        );
        return false;
      }

      // Validate auto backoff
      if (!rateLimits.autoBackoffOnError) {
        this.addResult(
          'Rate Limits',
          'Auto Backoff',
          'WARNING',
          'Auto backoff on error not configured',
          'Enable autoBackoffOnError for better compliance'
        );
      } else {
        this.addResult(
          'Rate Limits',
          'Auto Backoff',
          'PASS',
          'Auto backoff on error is configured'
        );
      }

      this.addResult(
        'Rate Limits',
        'Rate Limit Configuration',
        'PASS',
        `Rate limits properly configured: ${rateLimits.messagesPerDay} messages/day, ${rateLimits.delayBetweenMessages}ms delay`
      );

      return true;
      
    } catch (error) {
      this.addResult(
        'Rate Limits',
        'Validation Error',
        'FAIL',
        `Error validating rate limits: ${error.message}`
      );
      return false;
    }
  }

  async validateOptOutMechanisms() {
    this.log('🚫 Validating opt-out mechanisms...');
    
    // Check if opt-out handler script exists
    const optOutScript = path.join(__dirname, '..', 'src', 'handlers', 'opt-out-handler.js');
    
    if (!fs.existsSync(optOutScript)) {
      this.addResult(
        'Opt-out Mechanisms',
        'Opt-out Handler',
        'WARNING',
        'Dedicated opt-out handler script not found',
        'Consider creating src/handlers/opt-out-handler.js for automated opt-out processing'
      );
    } else {
      this.addResult(
        'Opt-out Mechanisms',
        'Opt-out Handler',
        'PASS',
        'Opt-out handler script exists'
      );
    }

    // Validate opt-out keywords configuration
    const templatesFile = path.join(__dirname, '..', 'config', 'message-templates-local.json');
    
    if (fs.existsSync(templatesFile)) {
      const templates = JSON.parse(fs.readFileSync(templatesFile, 'utf8'));
      const triggers = templates.triggers?.keywords?.opt_out || [];
      
      const missingKeywords = OPT_OUT_KEYWORDS.filter(keyword => 
        !triggers.includes(keyword)
      );
      
      if (missingKeywords.length > 0) {
        this.addResult(
          'Opt-out Mechanisms',
          'Opt-out Keywords',
          'WARNING',
          `Missing opt-out keywords: ${missingKeywords.join(', ')}`,
          'Add missing keywords to templates.triggers.keywords.opt_out array'
        );
      } else {
        this.addResult(
          'Opt-out Mechanisms',
          'Opt-out Keywords',
          'PASS',
          'All standard opt-out keywords are configured'
        );
      }
    }

    return true;
  }

  generateComplianceReport() {
    const report = {
      academia: "Full Force Academia - Matupá-MT",
      validationDate: this.timestamp,
      complianceScore: {
        current: this.score,
        maximum: this.maxScore,
        percentage: ((this.score / this.maxScore) * 100).toFixed(1)
      },
      overallStatus: this.score === this.maxScore ? 'FULLY_COMPLIANT' : 
                    this.errors.length === 0 ? 'MOSTLY_COMPLIANT' : 'NON_COMPLIANT',
      summary: {
        totalTests: this.maxScore,
        passed: this.score,
        failed: this.errors.length,
        warnings: this.warnings.length
      },
      categories: {
        dataMinimization: this.getCategoryStatus('Data Minimization'),
        consent: this.getCategoryStatus('Consent'),
        transparency: this.getCategoryStatus('Transparency'),
        dataRetention: this.getCategoryStatus('Data Retention'),
        auditTrail: this.getCategoryStatus('Audit Trail'),
        rateLimits: this.getCategoryStatus('Rate Limits'),
        optOutMechanisms: this.getCategoryStatus('Opt-out Mechanisms')
      },
      results: this.validationResults,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.getRecommendations(),
      lgpdRequirements: LGPD_REQUIREMENTS,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
    };

    return report;
  }

  getCategoryStatus(category) {
    const categoryResults = this.validationResults.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'PASS').length;
    const failed = categoryResults.filter(r => r.status === 'FAIL').length;
    const warnings = categoryResults.filter(r => r.status === 'WARNING').length;
    
    return {
      status: failed === 0 ? (warnings === 0 ? 'COMPLIANT' : 'COMPLIANT_WITH_WARNINGS') : 'NON_COMPLIANT',
      passed,
      failed,
      warnings,
      total: categoryResults.length
    };
  }

  getRecommendations() {
    return this.validationResults
      .filter(r => r.recommendation)
      .map(r => ({
        category: r.category,
        test: r.test,
        priority: r.status === 'FAIL' ? 'HIGH' : 'MEDIUM',
        recommendation: r.recommendation
      }))
      .sort((a, b) => a.priority === 'HIGH' ? -1 : 1);
  }

  async runFullValidation() {
    console.log('🏛️ Starting LGPD Compliance Validation');
    console.log('🏢 Academia: Full Force - Matupá-MT');
    console.log('📅 Date:', new Date().toLocaleDateString('pt-BR'));
    console.log('⚖️ Regulation: Lei Geral de Proteção de Dados (LGPD)\n');

    const startTime = Date.now();

    // Run all validation tests
    await this.validateDataMinimization();
    await this.validateConsent();
    await this.validateTransparency();
    await this.validateDataRetention();
    await this.validateAuditTrail();
    await this.validateRateLimits();
    await this.validateOptOutMechanisms();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Generate comprehensive report
    const report = this.generateComplianceReport();

    this.printSummary(duration, report);
    
    // Save report to file
    this.saveReport(report);

    return report.overallStatus === 'FULLY_COMPLIANT';
  }

  printSummary(duration, report) {
    console.log('\n' + '='.repeat(70));
    console.log('⚖️  LGPD COMPLIANCE VALIDATION SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`🏢 Academia: Full Force Academia`);
    console.log(`📍 Location: Matupá-MT`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Compliance Score: ${report.complianceScore.current}/${report.complianceScore.maximum} (${report.complianceScore.percentage}%)`);
    console.log(`🎯 Overall Status: ${report.overallStatus}`);

    console.log('\n📋 CATEGORY RESULTS:');
    Object.entries(report.categories).forEach(([category, result]) => {
      const icon = result.status === 'COMPLIANT' ? '✅' : 
                   result.status === 'COMPLIANT_WITH_WARNINGS' ? '⚠️' : '❌';
      console.log(`${icon} ${category}: ${result.status} (${result.passed}/${result.total} passed)`);
    });

    if (report.errors.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.category}: ${error.message}`);
        if (error.recommendation) {
          console.log(`   Fix: ${error.recommendation}`);
        }
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.category}: ${warning.message}`);
        if (warning.recommendation) {
          console.log(`   Recommendation: ${warning.recommendation}`);
        }
      });
    }

    console.log('\n🎯 TOP RECOMMENDATIONS:');
    const topRecommendations = report.recommendations.slice(0, 5);
    topRecommendations.forEach((rec, index) => {
      const priority = rec.priority === 'HIGH' ? '🚨' : '⚠️';
      console.log(`${index + 1}. ${priority} ${rec.category}: ${rec.recommendation}`);
    });

    if (report.overallStatus === 'FULLY_COMPLIANT') {
      console.log('\n🎉 LGPD COMPLIANCE ACHIEVED!');
      console.log('✅ All requirements met');
      console.log('✅ Ready for production deployment');
      console.log('✅ WhatsApp automation compliant');
    } else {
      console.log('\n⚠️ COMPLIANCE ISSUES DETECTED');
      console.log('🔧 Address critical issues before production');
      console.log('📋 Review recommendations above');
      console.log(`📅 Next review: ${new Date(report.nextReviewDate).toLocaleDateString('pt-BR')}`);
    }
    
    console.log('\n' + '='.repeat(70));
  }

  saveReport(report) {
    const reportDir = path.join(__dirname, '..', 'reports', 'lgpd');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `lgpd-compliance-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📄 Compliance report saved: ${reportFile}`);
    
    // Also save a human-readable summary
    const summaryFile = path.join(reportDir, `lgpd-summary-${Date.now()}.txt`);
    const summaryContent = this.generateTextSummary(report);
    fs.writeFileSync(summaryFile, summaryContent);
    
    console.log(`📄 Summary report saved: ${summaryFile}`);
  }

  generateTextSummary(report) {
    return `
RELATÓRIO DE CONFORMIDADE LGPD
===============================

Academia: Full Force Academia - Matupá-MT
Data: ${new Date(report.validationDate).toLocaleDateString('pt-BR')}
Score: ${report.complianceScore.current}/${report.complianceScore.maximum} (${report.complianceScore.percentage}%)
Status: ${report.overallStatus}

RESULTADOS POR CATEGORIA:
${Object.entries(report.categories).map(([cat, res]) => 
  `- ${cat}: ${res.status} (${res.passed}/${res.total})`
).join('\n')}

ISSUES CRÍTICOS:
${report.errors.map(e => `- ${e.category}: ${e.message}`).join('\n') || 'Nenhum'}

AVISOS:
${report.warnings.map(w => `- ${w.category}: ${w.message}`).join('\n') || 'Nenhum'}

PRINCIPAIS RECOMENDAÇÕES:
${report.recommendations.slice(0, 10).map((r, i) => 
  `${i+1}. [${r.priority}] ${r.category}: ${r.recommendation}`
).join('\n')}

Próxima revisão: ${new Date(report.nextReviewDate).toLocaleDateString('pt-BR')}
`;
  }
}

// Execute validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new LGPDComplianceValidator();
  
  validator.runFullValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default LGPDComplianceValidator;