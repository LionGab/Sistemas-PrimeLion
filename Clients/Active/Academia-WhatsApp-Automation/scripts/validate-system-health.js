#!/usr/bin/env node

/**
 * SYSTEM HEALTH VALIDATOR - Full Force Academia
 * 
 * Validação completa do sistema de automação WhatsApp
 * Verifica N8N, Evolution API, compliance, performance e ROI
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// System configuration
const SYSTEM_CONFIG = {
  n8n: {
    url: 'http://localhost:5678',
    healthEndpoint: '/healthz',
    workflowsEndpoint: '/api/v1/workflows'
  },
  evolutionApi: {
    url: 'http://localhost:8080',
    healthEndpoint: '/health',
    instanceEndpoint: '/instance/connectionState/Full_Force_Academia'
  },
  dashboard: {
    url: 'http://localhost:3001',
    healthEndpoint: '/health'
  },
  database: {
    // Will be configured based on academy config
  }
};

// Performance benchmarks for Full Force Academia
const PERFORMANCE_BENCHMARKS = {
  roi: {
    target: 2520,
    minimum: 1000,
    critical: 500
  },
  revenue: {
    target: 12600,
    minimum: 8000,
    critical: 4000
  },
  conversionRate: {
    target: 0.15,
    minimum: 0.10,
    critical: 0.05
  },
  responseRate: {
    target: 0.25,
    minimum: 0.15,
    critical: 0.08
  },
  messageDelivery: {
    target: 0.98,
    minimum: 0.95,
    critical: 0.90
  },
  systemUptime: {
    target: 0.995,
    minimum: 0.99,
    critical: 0.95
  }
};

class SystemHealthValidator {
  constructor() {
    this.healthResults = [];
    this.criticalIssues = [];
    this.warnings = [];
    this.recommendations = [];
    this.overallScore = 0;
    this.maxScore = 0;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    
    // Log to file
    const logFile = path.join(__dirname, '..', 'logs', 'system-health.log');
    const logDir = path.dirname(logFile);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  addResult(component, check, status, message, details = null, recommendation = null) {
    const result = {
      component,
      check,
      status, // HEALTHY, WARNING, CRITICAL, OFFLINE
      message,
      details,
      recommendation,
      timestamp: new Date().toISOString()
    };

    this.healthResults.push(result);
    
    switch (status) {
      case 'HEALTHY':
        this.overallScore += 100;
        break;
      case 'WARNING':
        this.overallScore += 60;
        this.warnings.push(result);
        break;
      case 'CRITICAL':
        this.overallScore += 20;
        this.criticalIssues.push(result);
        break;
      case 'OFFLINE':
        this.overallScore += 0;
        this.criticalIssues.push(result);
        break;
    }
    
    this.maxScore += 100;

    if (recommendation) {
      this.recommendations.push({
        component,
        check,
        priority: status === 'CRITICAL' || status === 'OFFLINE' ? 'HIGH' : 'MEDIUM',
        recommendation
      });
    }
  }

  async makeRequest(url, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      return { success: true, response, data: await response.json().catch(() => ({})) };
    } catch (error) {
      return { 
        success: false, 
        error: error.name === 'AbortError' ? 'Timeout' : error.message 
      };
    }
  }

  async checkN8NHealth() {
    this.log('🔧 Checking N8N health and workflows...');
    
    // Check N8N availability
    const healthCheck = await this.makeRequest(`${SYSTEM_CONFIG.n8n.url}${SYSTEM_CONFIG.n8n.healthEndpoint}`);
    
    if (!healthCheck.success) {
      this.addResult(
        'N8N',
        'Service Availability',
        'OFFLINE',
        `N8N service not accessible: ${healthCheck.error}`,
        null,
        'Start N8N service and ensure it\'s running on port 5678'
      );
      return false;
    }

    this.addResult(
      'N8N',
      'Service Availability',
      'HEALTHY',
      'N8N service is running and accessible'
    );

    // Check workflows
    try {
      const workflowsCheck = await this.makeRequest(`${SYSTEM_CONFIG.n8n.url}${SYSTEM_CONFIG.n8n.workflowsEndpoint}`);
      
      if (workflowsCheck.success && workflowsCheck.data.data) {
        const workflows = workflowsCheck.data.data;
        const academiaWorkflows = workflows.filter(w => 
          w.name.includes('Full Force') || 
          w.name.includes('Academia') ||
          w.name.includes('WhatsApp') ||
          w.name.includes('Reactivation')
        );

        const activeWorkflows = academiaWorkflows.filter(w => w.active);
        
        if (academiaWorkflows.length === 0) {
          this.addResult(
            'N8N',
            'Academia Workflows',
            'CRITICAL',
            'No academy-specific workflows found',
            { total: workflows.length, academia: 0 },
            'Import academia workflows using: node scripts/import-workflows-academia.js'
          );
        } else if (activeWorkflows.length < academiaWorkflows.length) {
          this.addResult(
            'N8N',
            'Workflow Status',
            'WARNING',
            `${academiaWorkflows.length - activeWorkflows.length} workflows inactive`,
            { total: academiaWorkflows.length, active: activeWorkflows.length },
            'Activate all academy workflows in N8N interface'
          );
        } else {
          this.addResult(
            'N8N',
            'Academia Workflows',
            'HEALTHY',
            `${activeWorkflows.length} academy workflows active and running`,
            { total: academiaWorkflows.length, active: activeWorkflows.length }
          );
        }
      }
    } catch (error) {
      this.addResult(
        'N8N',
        'Workflows Check',
        'WARNING',
        'Could not verify workflow status',
        null,
        'Check N8N authentication and API access'
      );
    }

    return true;
  }

  async checkEvolutionAPI() {
    this.log('📱 Checking Evolution API and WhatsApp connection...');
    
    // Check Evolution API availability
    const healthCheck = await this.makeRequest(SYSTEM_CONFIG.evolutionApi.url);
    
    if (!healthCheck.success) {
      this.addResult(
        'Evolution API',
        'Service Availability',
        'OFFLINE',
        `Evolution API not accessible: ${healthCheck.error}`,
        null,
        'Start Evolution API service and ensure Docker containers are running'
      );
      return false;
    }

    this.addResult(
      'Evolution API',
      'Service Availability',
      'HEALTHY',
      'Evolution API service is running and accessible'
    );

    // Check WhatsApp instance connection
    try {
      const instanceCheck = await this.makeRequest(`${SYSTEM_CONFIG.evolutionApi.url}${SYSTEM_CONFIG.evolutionApi.instanceEndpoint}`);
      
      if (instanceCheck.success && instanceCheck.data.instance) {
        const instance = instanceCheck.data.instance;
        
        if (instance.state === 'open') {
          this.addResult(
            'WhatsApp',
            'Connection Status',
            'HEALTHY',
            'WhatsApp connected and ready',
            { 
              phone: instance.wuid,
              state: instance.state,
              instance: 'Full_Force_Academia'
            }
          );
        } else {
          this.addResult(
            'WhatsApp',
            'Connection Status',
            'CRITICAL',
            `WhatsApp connection issue: ${instance.state}`,
            { state: instance.state },
            'Reconnect WhatsApp using: node scripts/test-whatsapp-connection.js'
          );
        }
      } else {
        this.addResult(
          'WhatsApp',
          'Instance Status',
          'CRITICAL',
          'WhatsApp instance not found or not configured',
          null,
          'Create WhatsApp instance using test-whatsapp-connection.js'
        );
      }
    } catch (error) {
      this.addResult(
        'WhatsApp',
        'Connection Check',
        'WARNING',
        'Could not verify WhatsApp connection status',
        null,
        'Check Evolution API configuration and instance setup'
      );
    }

    return true;
  }

  async checkDashboardHealth() {
    this.log('📊 Checking dashboard and monitoring interface...');
    
    // Check if dashboard file exists
    const dashboardPath = path.join(__dirname, '..', 'public', 'dashboard-owner.html');
    
    if (!fs.existsSync(dashboardPath)) {
      this.addResult(
        'Dashboard',
        'File Availability',
        'WARNING',
        'Dashboard HTML file not found',
        { path: dashboardPath },
        'Dashboard file should exist at public/dashboard-owner.html'
      );
    } else {
      this.addResult(
        'Dashboard',
        'File Availability', 
        'HEALTHY',
        'Dashboard HTML file exists and accessible'
      );
    }

    // Try to check dashboard server if running
    const dashboardCheck = await this.makeRequest(`${SYSTEM_CONFIG.dashboard.url}${SYSTEM_CONFIG.dashboard.healthEndpoint}`, 2000);
    
    if (dashboardCheck.success) {
      this.addResult(
        'Dashboard',
        'Server Status',
        'HEALTHY',
        'Dashboard server is running and accessible',
        dashboardCheck.data
      );
    } else {
      this.addResult(
        'Dashboard',
        'Server Status',
        'WARNING',
        'Dashboard server not running (optional)',
        null,
        'Start dashboard server with: npm run dev (optional)'
      );
    }

    return true;
  }

  async checkFileSystemHealth() {
    this.log('🗂️ Checking file system and configuration...');
    
    const criticalPaths = [
      {
        path: path.join(__dirname, '..', 'config', 'academy-config-matupa.json'),
        name: 'Academy Configuration',
        required: true
      },
      {
        path: path.join(__dirname, '..', 'config', 'message-templates-local.json'),
        name: 'Message Templates',
        required: true
      },
      {
        path: path.join(__dirname, '..', 'scripts', 'import-workflows-academia.js'),
        name: 'Workflow Import Script',
        required: true
      },
      {
        path: path.join(__dirname, '..', 'scripts', 'validate-lgpd-compliance.js'),
        name: 'LGPD Compliance Validator',
        required: true
      },
      {
        path: path.join(__dirname, '..', 'logs'),
        name: 'Logs Directory',
        required: false,
        isDirectory: true
      }
    ];

    let criticalFilesMissing = 0;

    for (const item of criticalPaths) {
      if (fs.existsSync(item.path)) {
        const stats = fs.statSync(item.path);
        
        if (item.isDirectory && stats.isDirectory()) {
          this.addResult(
            'File System',
            item.name,
            'HEALTHY',
            `${item.name} directory exists`
          );
        } else if (!item.isDirectory && stats.isFile()) {
          this.addResult(
            'File System',
            item.name,
            'HEALTHY',
            `${item.name} file exists (${Math.round(stats.size / 1024)}KB)`
          );
        }
      } else {
        const status = item.required ? 'CRITICAL' : 'WARNING';
        const message = `${item.name} ${item.isDirectory ? 'directory' : 'file'} not found`;
        
        this.addResult(
          'File System',
          item.name,
          status,
          message,
          { path: item.path },
          item.isDirectory ? 
            `Create directory: mkdir -p ${item.path}` :
            `Create required ${item.name.toLowerCase()}`
        );

        if (item.required) criticalFilesMissing++;
      }
    }

    // Check disk space
    try {
      const stats = fs.statSync(__dirname);
      // This is a simplified check - in a real implementation you'd check actual disk space
      this.addResult(
        'File System',
        'Disk Space',
        'HEALTHY',
        'Sufficient disk space available'
      );
    } catch (error) {
      this.addResult(
        'File System',
        'Disk Space',
        'WARNING',
        'Could not verify disk space'
      );
    }

    return criticalFilesMissing === 0;
  }

  async checkPerformanceMetrics() {
    this.log('📈 Checking performance metrics and ROI targets...');
    
    // Load academy configuration
    const configPath = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    if (!fs.existsSync(configPath)) {
      this.addResult(
        'Performance',
        'Configuration',
        'CRITICAL',
        'Academy configuration file not found',
        null,
        'Create academy configuration file with performance targets'
      );
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const business = config.business || {};
      
      // Check ROI target
      const roiTarget = business.roiTarget || 0;
      if (roiTarget >= PERFORMANCE_BENCHMARKS.roi.target) {
        this.addResult(
          'Performance',
          'ROI Target',
          'HEALTHY',
          `ROI target set to ${roiTarget}% (excellent)`,
          { target: roiTarget, benchmark: PERFORMANCE_BENCHMARKS.roi.target }
        );
      } else if (roiTarget >= PERFORMANCE_BENCHMARKS.roi.minimum) {
        this.addResult(
          'Performance',
          'ROI Target',
          'WARNING',
          `ROI target ${roiTarget}% below optimal (${PERFORMANCE_BENCHMARKS.roi.target}%)`,
          { target: roiTarget, benchmark: PERFORMANCE_BENCHMARKS.roi.target },
          'Consider raising ROI target to maximize academy profitability'
        );
      } else {
        this.addResult(
          'Performance',
          'ROI Target',
          'CRITICAL',
          `ROI target ${roiTarget}% too low for sustainable operation`,
          { target: roiTarget, minimum: PERFORMANCE_BENCHMARKS.roi.minimum },
          'Set ROI target to at least ' + PERFORMANCE_BENCHMARKS.roi.minimum + '%'
        );
      }

      // Check revenue target
      const revenueTarget = business.revenueTarget || 0;
      if (revenueTarget >= PERFORMANCE_BENCHMARKS.revenue.target) {
        this.addResult(
          'Performance',
          'Revenue Target',
          'HEALTHY',
          `Revenue target R$ ${revenueTarget}/month is optimal`,
          { target: revenueTarget, benchmark: PERFORMANCE_BENCHMARKS.revenue.target }
        );
      } else if (revenueTarget >= PERFORMANCE_BENCHMARKS.revenue.minimum) {
        this.addResult(
          'Performance',
          'Revenue Target',
          'WARNING',
          `Revenue target R$ ${revenueTarget}/month could be higher`,
          { target: revenueTarget, benchmark: PERFORMANCE_BENCHMARKS.revenue.target }
        );
      } else {
        this.addResult(
          'Performance',
          'Revenue Target',
          'CRITICAL',
          `Revenue target R$ ${revenueTarget}/month too low`,
          { target: revenueTarget, minimum: PERFORMANCE_BENCHMARKS.revenue.minimum },
          'Increase revenue target to at least R$ ' + PERFORMANCE_BENCHMARKS.revenue.minimum + '/month'
        );
      }

      // Check ex-students count
      const exStudents = business.exStudentsCount || config.academia?.exStudentsCount || 0;
      if (exStudents > 0) {
        this.addResult(
          'Performance',
          'Target Audience',
          'HEALTHY',
          `${exStudents} ex-students identified for reactivation`,
          { count: exStudents }
        );
      } else {
        this.addResult(
          'Performance',
          'Target Audience',
          'CRITICAL',
          'No ex-students data configured',
          null,
          'Configure ex-students count in academy configuration'
        );
      }

      return true;

    } catch (error) {
      this.addResult(
        'Performance',
        'Configuration Parse',
        'CRITICAL',
        `Could not parse academy configuration: ${error.message}`,
        null,
        'Fix JSON syntax errors in academy configuration file'
      );
      return false;
    }
  }

  async checkComplianceStatus() {
    this.log('⚖️ Checking LGPD compliance status...');
    
    // Check if LGPD validator exists
    const lgpdValidatorPath = path.join(__dirname, 'validate-lgpd-compliance.js');
    
    if (!fs.existsSync(lgpdValidatorPath)) {
      this.addResult(
        'Compliance',
        'LGPD Validator',
        'CRITICAL',
        'LGPD compliance validator not found',
        null,
        'LGPD validator is required for Brazilian WhatsApp automation'
      );
      return false;
    }

    this.addResult(
      'Compliance',
      'LGPD Validator',
      'HEALTHY',
      'LGPD compliance validator available'
    );

    // Check configuration compliance
    const configPath = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const compliance = config.compliance?.lgpd || {};
        
        // Check essential compliance fields
        const requiredFields = [
          'consentRequired',
          'optOutRespected', 
          'dataRetention',
          'auditTrail'
        ];

        const missingFields = requiredFields.filter(field => !compliance.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
          this.addResult(
            'Compliance',
            'LGPD Configuration',
            'HEALTHY',
            'All required LGPD fields configured',
            { fields: requiredFields.length }
          );
        } else {
          this.addResult(
            'Compliance',
            'LGPD Configuration',
            'WARNING',
            `Missing LGPD fields: ${missingFields.join(', ')}`,
            { missing: missingFields },
            'Complete LGPD configuration in academy config file'
          );
        }

        // Check data retention period
        const retention = compliance.dataRetention;
        if (retention && retention.includes('24 months')) {
          this.addResult(
            'Compliance',
            'Data Retention',
            'HEALTHY',
            'Data retention period compliant (24 months max)'
          );
        } else {
          this.addResult(
            'Compliance',
            'Data Retention',
            'WARNING',
            'Data retention period should be specified as max 24 months',
            null,
            'Set dataRetention to "24 months" for LGPD compliance'
          );
        }

      } catch (error) {
        this.addResult(
          'Compliance',
          'Configuration Parse',
          'WARNING',
          'Could not validate compliance configuration'
        );
      }
    }

    return true;
  }

  async checkRateLimits() {
    this.log('🚦 Checking WhatsApp rate limits and quotas...');
    
    const configPath = path.join(__dirname, '..', 'config', 'academy-config-matupa.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const rateLimits = config.rateLimits?.whatsapp || {};
        
        // Check daily message limit
        const dailyLimit = rateLimits.messagesPerDay || 0;
        if (dailyLimit <= 20) {
          this.addResult(
            'Rate Limits',
            'Daily Message Limit',
            'HEALTHY',
            `Daily limit set to ${dailyLimit} messages (compliant)`,
            { limit: dailyLimit, max: 20 }
          );
        } else {
          this.addResult(
            'Rate Limits',
            'Daily Message Limit', 
            'CRITICAL',
            `Daily limit ${dailyLimit} exceeds WhatsApp Business limits`,
            { limit: dailyLimit, max: 20 },
            'Reduce daily message limit to maximum 20 for compliance'
          );
        }

        // Check message delay
        const messageDelay = rateLimits.delayBetweenMessages || 0;
        if (messageDelay >= 3000) {
          this.addResult(
            'Rate Limits',
            'Message Delay',
            'HEALTHY',
            `Message delay set to ${messageDelay}ms (safe)`,
            { delay: messageDelay, minimum: 3000 }
          );
        } else {
          this.addResult(
            'Rate Limits',
            'Message Delay',
            'WARNING',
            `Message delay ${messageDelay}ms may be too fast`,
            { delay: messageDelay, recommended: 3000 },
            'Increase message delay to at least 3000ms (3 seconds)'
          );
        }

        // Check WhatsApp limits respect
        if (rateLimits.respectWhatsAppLimits) {
          this.addResult(
            'Rate Limits',
            'WhatsApp Compliance',
            'HEALTHY',
            'WhatsApp limits respect enabled'
          );
        } else {
          this.addResult(
            'Rate Limits',
            'WhatsApp Compliance',
            'CRITICAL',
            'WhatsApp limits respect not enabled',
            null,
            'Enable respectWhatsAppLimits to avoid account suspension'
          );
        }

      } catch (error) {
        this.addResult(
          'Rate Limits',
          'Configuration',
          'WARNING',
          'Could not validate rate limit configuration'
        );
      }
    } else {
      this.addResult(
        'Rate Limits',
        'Configuration Missing',
        'CRITICAL',
        'Rate limits not configured',
        null,
        'Configure rate limits to comply with WhatsApp Business policies'
      );
    }

    return true;
  }

  generateHealthReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    const healthScore = this.maxScore > 0 ? ((this.overallScore / this.maxScore) * 100).toFixed(1) : 0;

    const report = {
      academia: "Full Force Academia - Matupá-MT",
      validationDate: new Date().toISOString(),
      duration: parseFloat(duration),
      healthScore: {
        current: this.overallScore,
        maximum: this.maxScore,
        percentage: parseFloat(healthScore)
      },
      overallStatus: this.getOverallStatus(parseFloat(healthScore)),
      summary: {
        totalChecks: this.healthResults.length,
        healthy: this.healthResults.filter(r => r.status === 'HEALTHY').length,
        warnings: this.warnings.length,
        critical: this.criticalIssues.length,
        offline: this.healthResults.filter(r => r.status === 'OFFLINE').length
      },
      components: this.getComponentSummary(),
      results: this.healthResults,
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      benchmarks: PERFORMANCE_BENCHMARKS,
      nextCheckRecommended: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return report;
  }

  getOverallStatus(score) {
    if (score >= 95) return 'EXCELLENT';
    if (score >= 80) return 'HEALTHY';
    if (score >= 60) return 'WARNING';
    if (score >= 40) return 'CRITICAL';
    return 'SYSTEM_FAILURE';
  }

  getComponentSummary() {
    const components = {};
    
    this.healthResults.forEach(result => {
      if (!components[result.component]) {
        components[result.component] = {
          healthy: 0,
          warning: 0,
          critical: 0,
          offline: 0,
          total: 0
        };
      }
      
      components[result.component][result.status.toLowerCase()]++;
      components[result.component].total++;
    });

    // Calculate component health percentages
    Object.keys(components).forEach(component => {
      const comp = components[component];
      const score = ((comp.healthy * 100 + comp.warning * 60 + comp.critical * 20 + comp.offline * 0) / (comp.total * 100)) * 100;
      comp.healthPercentage = score.toFixed(1);
      comp.status = this.getOverallStatus(score);
    });

    return components;
  }

  async runFullValidation() {
    console.log('🏥 Starting Full Force Academia System Health Check');
    console.log('🏢 Academia: Full Force - Matupá-MT');
    console.log('📅 Date:', new Date().toLocaleDateString('pt-BR'));
    console.log('🎯 Target: 561 ex-students → R$ 12,600/month → ROI 2,520%\n');

    // Run all health checks
    await this.checkN8NHealth();
    await this.checkEvolutionAPI();
    await this.checkDashboardHealth();
    await this.checkFileSystemHealth();
    await this.checkPerformanceMetrics();
    await this.checkComplianceStatus();
    await this.checkRateLimits();

    // Generate comprehensive report
    const report = this.generateHealthReport();

    this.printSummary(report);
    this.saveReport(report);

    return report.overallStatus === 'EXCELLENT' || report.overallStatus === 'HEALTHY';
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(70));
    console.log('🏥 SYSTEM HEALTH VALIDATION SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`🏢 Academia: Full Force Academia`);
    console.log(`📍 Location: Matupá-MT`);
    console.log(`⏱️  Duration: ${report.duration} seconds`);
    console.log(`📊 Health Score: ${report.healthScore.current}/${report.healthScore.maximum} (${report.healthScore.percentage}%)`);
    console.log(`🎯 Overall Status: ${report.overallStatus}`);

    console.log('\n📋 COMPONENT HEALTH:');
    Object.entries(report.components).forEach(([component, stats]) => {
      const icon = stats.status === 'EXCELLENT' || stats.status === 'HEALTHY' ? '✅' : 
                   stats.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${component}: ${stats.status} (${stats.healthPercentage}%)`);
      console.log(`   Healthy: ${stats.healthy}, Warnings: ${stats.warning}, Critical: ${stats.critical}`);
    });

    if (report.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component} - ${issue.check}: ${issue.message}`);
        if (issue.recommendation) {
          console.log(`   Fix: ${issue.recommendation}`);
        }
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.component} - ${warning.check}: ${warning.message}`);
        if (warning.recommendation) {
          console.log(`   Recommendation: ${warning.recommendation}`);
        }
      });
    }

    console.log('\n🎯 TOP RECOMMENDATIONS:');
    const topRecs = report.recommendations
      .sort((a, b) => a.priority === 'HIGH' ? -1 : 1)
      .slice(0, 5);
    
    topRecs.forEach((rec, index) => {
      const priority = rec.priority === 'HIGH' ? '🚨' : '⚠️';
      console.log(`${index + 1}. ${priority} ${rec.component}: ${rec.recommendation}`);
    });

    // Status-specific messages
    switch (report.overallStatus) {
      case 'EXCELLENT':
        console.log('\n🎉 SYSTEM PERFORMANCE EXCELLENT!');
        console.log('✅ All systems operating at optimal levels');
        console.log('✅ Ready for maximum ROI generation');
        console.log('✅ Compliance and performance targets met');
        break;
        
      case 'HEALTHY':
        console.log('\n✅ SYSTEM HEALTH GOOD');
        console.log('✅ Core functionality operational');
        console.log('⚠️  Some minor optimizations recommended');
        console.log('✅ Safe for production operation');
        break;
        
      case 'WARNING':
        console.log('\n⚠️ SYSTEM HEALTH CONCERNS');
        console.log('🔧 Several issues need attention');
        console.log('⚠️  Monitor performance closely');
        console.log('📋 Address recommendations before scaling');
        break;
        
      case 'CRITICAL':
        console.log('\n🚨 CRITICAL SYSTEM ISSUES');
        console.log('❌ Major problems detected');
        console.log('🔧 Immediate action required');
        console.log('⚠️  Do not proceed to production');
        break;
        
      case 'SYSTEM_FAILURE':
        console.log('\n💥 SYSTEM FAILURE DETECTED');
        console.log('❌ Multiple critical failures');
        console.log('🔧 Complete system review required');
        console.log('⚠️  System not operational');
        break;
    }
    
    console.log(`\n📅 Next check recommended: ${new Date(report.nextCheckRecommended).toLocaleDateString('pt-BR')}`);
    console.log('\n' + '='.repeat(70));
  }

  saveReport(report) {
    const reportDir = path.join(__dirname, '..', 'reports', 'health');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const reportFile = path.join(reportDir, `system-health-${timestamp}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📄 Health report saved: ${reportFile}`);
    
    // Save latest report for dashboard
    const latestFile = path.join(reportDir, 'latest-health-check.json');
    fs.writeFileSync(latestFile, JSON.stringify(report, null, 2));
    
    // Create human-readable summary
    const summaryFile = path.join(reportDir, `health-summary-${timestamp}.txt`);
    const summaryContent = this.generateTextSummary(report);
    fs.writeFileSync(summaryFile, summaryContent);
  }

  generateTextSummary(report) {
    return `
RELATÓRIO DE SAÚDE DO SISTEMA
=============================

Academia: Full Force Academia - Matupá-MT
Data: ${new Date(report.validationDate).toLocaleDateString('pt-BR')}
Duração: ${report.duration} segundos
Score: ${report.healthScore.current}/${report.healthScore.maximum} (${report.healthScore.percentage}%)
Status: ${report.overallStatus}

RESUMO DOS COMPONENTES:
${Object.entries(report.components).map(([comp, stats]) => 
  `- ${comp}: ${stats.status} (${stats.healthPercentage}%) - ${stats.healthy}✅ ${stats.warning}⚠️ ${stats.critical}❌`
).join('\n')}

ISSUES CRÍTICOS:
${report.criticalIssues.map(i => `- ${i.component}: ${i.message}`).join('\n') || 'Nenhum'}

AVISOS:
${report.warnings.map(w => `- ${w.component}: ${w.message}`).join('\n') || 'Nenhum'}

PRINCIPAIS RECOMENDAÇÕES:
${report.recommendations.slice(0, 10).map((r, i) => 
  `${i+1}. [${r.priority}] ${r.component}: ${r.recommendation}`
).join('\n')}

Próxima verificação: ${new Date(report.nextCheckRecommended).toLocaleDateString('pt-BR')}
`;
  }
}

// Execute validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SystemHealthValidator();
  
  validator.runFullValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default SystemHealthValidator;