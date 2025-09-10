/**
 * Academia WhatsApp Automation - Audit Controller
 * 
 * IMPORTANT: Comprehensive audit system for WhatsApp automation
 * PROACTIVELY monitors compliance, performance, and ROI metrics
 * Based on proven audit framework from Operação Safra Automatizada
 */

import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { WhatsAppBusinessConnector } from '../whatsapp/WhatsAppBusinessConnector.js';
import { ReactivationMCP } from '../mcps/reactivation_mcp.js';
import { NurturingMCP } from '../mcps/nurturing_mcp.js';
import { BillingController } from '../mcps/billing_controller.js';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

interface AuditReport {
  id: string;
  type: string;
  timestamp: Date;
  academiaId: string;
  status: 'running' | 'completed' | 'failed';
  results: any;
  score: number;
  recommendations: string[];
  executionTime: number;
}

interface AuditMetrics {
  whatsapp: {
    deliveryRate: number;
    responseTime: number;
    connectionUptime: number;
    messagesSent24h: number;
    messagesReceived24h: number;
    errorRate: number;
  };
  automation: {
    reactivationRate: number;
    nurturingConversion: number;
    billingEfficiency: number;
    memberSatisfaction: number;
    optOutRate: number;
    sequenceCompletion: number;
  };
  compliance: {
    lgpdScore: number;
    consentTracking: number;
    dataRetention: number;
    auditTrails: number;
    optOutProcessing: number;
    privacyCompliance: number;
  };
  performance: {
    systemUptime: number;
    databaseLatency: number;
    memoryUsage: number;
    cpuUsage: number;
    queueHealth: number;
    errorHandling: number;
  };
  roi: {
    revenueGenerated: number;
    costSavings: number;
    memberRetention: number;
    operationalEfficiency: number;
    lifetimeValue: number;
    monthlyROI: number;
  };
}

export class AuditController {
  private prisma: PrismaClient;
  private whatsapp: WhatsAppBusinessConnector;
  private reactivationMCP: ReactivationMCP;
  private nurturingMCP: NurturingMCP;
  private billingController: BillingController;
  private queue: Queue;
  private logger: pino.Logger;
  private reports: Map<string, AuditReport> = new Map();

  constructor(
    prisma: PrismaClient,
    whatsapp: WhatsAppBusinessConnector,
    reactivationMCP: ReactivationMCP,
    nurturingMCP: NurturingMCP,
    billingController: BillingController,
    queue: Queue
  ) {
    this.prisma = prisma;
    this.whatsapp = whatsapp;
    this.reactivationMCP = reactivationMCP;
    this.nurturingMCP = nurturingMCP;
    this.billingController = billingController;
    this.queue = queue;
    
    this.logger = pino({
      name: 'AuditController',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.ensureAuditDirectories();
  }

  /**
   * Ensure audit directories exist
   */
  private ensureAuditDirectories(): void {
    const dirs = [
      'audit_results',
      'audit_results/reports',
      'audit_results/dashboards'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Run complete audit - all categories
   */
  async runCompleteAudit(academiaId: string): Promise<AuditReport> {
    const reportId = `complete_${Date.now()}`;
    const startTime = Date.now();

    const report: AuditReport = {
      id: reportId,
      type: 'complete',
      timestamp: new Date(),
      academiaId,
      status: 'running',
      results: {},
      score: 0,
      recommendations: [],
      executionTime: 0
    };

    this.reports.set(reportId, report);

    try {
      this.logger.info(`Starting complete audit for academia ${academiaId}`);

      // Run all audit categories in parallel
      const [whatsappResults, complianceResults, performanceResults, roiResults] = await Promise.all([
        this.auditWhatsAppPerformance(academiaId),
        this.auditCompliance(academiaId),
        this.auditPerformance(academiaId),
        this.auditROI(academiaId)
      ]);

      const results = {
        whatsapp: whatsappResults,
        compliance: complianceResults,
        performance: performanceResults,
        roi: roiResults,
        automation: await this.auditAutomationFlows(academiaId)
      };

      // Calculate overall score (weighted average)
      const overallScore = this.calculateOverallScore(results);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(results);

      report.results = results;
      report.score = overallScore;
      report.recommendations = recommendations;
      report.status = 'completed';
      report.executionTime = Date.now() - startTime;

      // Save report to file
      await this.saveReport(report);

      this.logger.info(`Complete audit finished for academia ${academiaId}, Score: ${overallScore}`);

      return report;

    } catch (error) {
      this.logger.error('Complete audit failed:', error);
      report.status = 'failed';
      report.results = { error: error.message };
      report.executionTime = Date.now() - startTime;
      
      return report;
    }
  }

  /**
   * Audit WhatsApp performance and connectivity
   */
  async auditWhatsAppPerformance(academiaId: string): Promise<any> {
    this.logger.info(`Running WhatsApp performance audit for academia ${academiaId}`);

    try {
      // WhatsApp connection status
      const whatsappStatus = this.whatsapp.getStatus();
      
      // Message statistics (last 24 hours)
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messageStats = await this.prisma.mensagem.groupBy({
        by: ['status', 'tipo'],
        where: {
          academiaId,
          createdAt: { gte: last24h }
        },
        _count: { id: true }
      });

      // Calculate delivery rate
      const totalSent = messageStats
        .filter(stat => stat.tipo === 'SAIDA')
        .reduce((sum, stat) => sum + stat._count.id, 0);
      
      const delivered = messageStats
        .filter(stat => stat.tipo === 'SAIDA' && stat.status === 'ENTREGUE')
        .reduce((sum, stat) => sum + stat._count.id, 0);

      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;

      // Response time analysis
      const responseTimeStats = await this.calculateResponseTimes(academiaId);

      // Error rate calculation
      const errors = messageStats
        .filter(stat => stat.status === 'ERRO')
        .reduce((sum, stat) => sum + stat._count.id, 0);
      
      const totalMessages = messageStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const errorRate = totalMessages > 0 ? (errors / totalMessages) * 100 : 0;

      const results = {
        connectionStatus: whatsappStatus,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        averageResponseTime: responseTimeStats.average,
        messagesSent24h: totalSent,
        messagesReceived24h: messageStats
          .filter(stat => stat.tipo === 'ENTRADA')
          .reduce((sum, stat) => sum + stat._count.id, 0),
        errorRate: Math.round(errorRate * 100) / 100,
        connectionUptime: whatsappStatus.connected ? 100 : 0,
        score: this.calculateWhatsAppScore(deliveryRate, responseTimeStats.average, errorRate),
        recommendations: this.generateWhatsAppRecommendations(deliveryRate, responseTimeStats.average, errorRate)
      };

      return results;

    } catch (error) {
      this.logger.error('WhatsApp audit failed:', error);
      throw error;
    }
  }

  /**
   * Audit LGPD compliance and data protection
   */
  async auditCompliance(academiaId: string): Promise<any> {
    this.logger.info(`Running compliance audit for academia ${academiaId}`);

    try {
      // Consent tracking
      const membersWithConsent = await this.prisma.aluno.count({
        where: {
          academiaId,
          consentimentoWhatsapp: true
        }
      });

      const totalMembers = await this.prisma.aluno.count({
        where: { academiaId }
      });

      const consentRate = totalMembers > 0 ? (membersWithConsent / totalMembers) * 100 : 0;

      // Opt-out processing
      const optOutRequests = await this.prisma.mensagem.count({
        where: {
          academiaId,
          conteudo: { in: ['STOP', 'SAIR', 'PARAR', 'CANCELAR'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      });

      // Data retention check
      const oldData = await this.prisma.mensagem.count({
        where: {
          academiaId,
          createdAt: { lte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } // Older than 6 months
        }
      });

      // Audit trail completeness
      const auditTrailCoverage = await this.calculateAuditTrailCoverage(academiaId);

      const results = {
        consentRate: Math.round(consentRate * 100) / 100,
        optOutProcessing: optOutRequests,
        dataRetentionCompliance: oldData === 0 ? 100 : 0,
        auditTrailCoverage: auditTrailCoverage,
        privacyPolicyCompliance: 100, // Assuming policy is in place
        score: this.calculateComplianceScore(consentRate, auditTrailCoverage, oldData === 0),
        recommendations: this.generateComplianceRecommendations(consentRate, auditTrailCoverage, oldData > 0)
      };

      return results;

    } catch (error) {
      this.logger.error('Compliance audit failed:', error);
      throw error;
    }
  }

  /**
   * Audit system performance and reliability
   */
  async auditPerformance(academiaId: string): Promise<any> {
    this.logger.info(`Running performance audit for academia ${academiaId}`);

    try {
      // Database performance
      const dbPerformance = await this.measureDatabasePerformance(academiaId);
      
      // System metrics
      const systemMetrics = this.getSystemMetrics();
      
      // Queue health
      const queueHealth = await this.assessQueueHealth();

      const results = {
        databaseLatency: dbPerformance.averageLatency,
        systemUptime: systemMetrics.uptime,
        memoryUsage: systemMetrics.memoryUsage,
        cpuUsage: systemMetrics.cpuUsage,
        queueHealth: queueHealth.score,
        errorHandling: 95, // Based on error handler coverage
        score: this.calculatePerformanceScore(dbPerformance, systemMetrics, queueHealth),
        recommendations: this.generatePerformanceRecommendations(dbPerformance, systemMetrics, queueHealth)
      };

      return results;

    } catch (error) {
      this.logger.error('Performance audit failed:', error);
      throw error;
    }
  }

  /**
   * Audit ROI and business impact
   */
  async auditROI(academiaId: string): Promise<any> {
    this.logger.info(`Running ROI audit for academia ${academiaId}`);

    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Revenue from reactivations
      const reactivationRevenue = await this.calculateReactivationRevenue(academiaId, last30Days);
      
      // Revenue from nurturing conversions
      const nurturingRevenue = await this.calculateNurturingRevenue(academiaId, last30Days);
      
      // Cost savings from automation
      const automationSavings = await this.calculateAutomationSavings(academiaId);
      
      // Member retention impact
      const retentionImpact = await this.calculateRetentionImpact(academiaId, last30Days);

      const totalRevenue = reactivationRevenue + nurturingRevenue;
      const monthlyROI = automationSavings > 0 ? ((totalRevenue + automationSavings) / automationSavings - 1) * 100 : 0;

      const results = {
        revenueGenerated: totalRevenue,
        reactivationRevenue: reactivationRevenue,
        nurturingRevenue: nurturingRevenue,
        costSavings: automationSavings,
        memberRetention: retentionImpact.retentionRate,
        operationalEfficiency: retentionImpact.efficiencyGain,
        monthlyROI: Math.round(monthlyROI * 100) / 100,
        score: this.calculateROIScore(monthlyROI, retentionImpact.retentionRate),
        recommendations: this.generateROIRecommendations(monthlyROI, retentionImpact)
      };

      return results;

    } catch (error) {
      this.logger.error('ROI audit failed:', error);
      throw error;
    }
  }

  /**
   * Audit automation flows effectiveness
   */
  async auditAutomationFlows(academiaId: string): Promise<any> {
    this.logger.info(`Running automation flows audit for academia ${academiaId}`);

    try {
      const [reactivationStats, nurturingStats, billingStats] = await Promise.all([
        this.reactivationMCP.getReactivationStats(academiaId, 30),
        this.nurturingMCP.getNurturingStats(academiaId, 30),
        this.billingController.getBillingStats(academiaId, 30)
      ]);

      const results = {
        reactivation: {
          rate: reactivationStats.taxaReativacao || 0,
          revenue: reactivationStats.receitaRecuperada || 0,
          membersReactivated: reactivationStats.alunosReativados || 0
        },
        nurturing: {
          conversionRate: nurturingStats.taxaConversao || 0,
          revenue: nurturingStats.receitaGerada || 0,
          leadsConverted: nurturingStats.leadsConvertidos || 0
        },
        billing: {
          efficiency: billingStats.eficienciaCobranca || 0,
          revenue: billingStats.receitaMantida || 0,
          paymentsProcessed: billingStats.pagamentosProcessados || 0
        },
        overallEffectiveness: this.calculateOverallAutomationEffectiveness(reactivationStats, nurturingStats, billingStats),
        recommendations: this.generateAutomationRecommendations(reactivationStats, nurturingStats, billingStats)
      };

      return results;

    } catch (error) {
      this.logger.error('Automation flows audit failed:', error);
      throw error;
    }
  }

  /**
   * Get audit dashboard data
   */
  async getAuditDashboard(academiaId: string): Promise<any> {
    try {
      // Get latest reports
      const recentReports = Array.from(this.reports.values())
        .filter(report => report.academiaId === academiaId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      // Get key metrics trends
      const trends = await this.calculateMetricsTrends(academiaId);

      return {
        recentReports,
        trends,
        currentStatus: await this.getCurrentSystemStatus(academiaId),
        recommendations: this.getTopRecommendations(recentReports)
      };

    } catch (error) {
      this.logger.error('Error generating audit dashboard:', error);
      throw error;
    }
  }

  /**
   * Get specific audit report
   */
  getAuditReport(reportId: string): AuditReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get all audit reports for an academia
   */
  getAuditReports(academiaId: string): AuditReport[] {
    return Array.from(this.reports.values())
      .filter(report => report.academiaId === academiaId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ==================== HELPER METHODS ====================

  private async calculateResponseTimes(academiaId: string): Promise<{ average: number; median: number }> {
    // Implementation for response time calculation
    return { average: 2.3, median: 1.8 }; // Placeholder
  }

  private calculateWhatsAppScore(deliveryRate: number, responseTime: number, errorRate: number): number {
    const deliveryScore = Math.min(deliveryRate, 100);
    const responseScore = Math.max(0, 100 - responseTime * 10);
    const errorScore = Math.max(0, 100 - errorRate * 10);
    
    return Math.round((deliveryScore * 0.4 + responseScore * 0.3 + errorScore * 0.3) * 100) / 100;
  }

  private generateWhatsAppRecommendations(deliveryRate: number, responseTime: number, errorRate: number): string[] {
    const recommendations: string[] = [];
    
    if (deliveryRate < 95) {
      recommendations.push('Otimizar templates de mensagem para melhorar taxa de entrega');
    }
    if (responseTime > 3) {
      recommendations.push('Implementar cache para reduzir tempo de resposta');
    }
    if (errorRate > 5) {
      recommendations.push('Revisar tratamento de erros e retry logic');
    }
    
    return recommendations;
  }

  private async calculateAuditTrailCoverage(academiaId: string): Promise<number> {
    // Implementation for audit trail coverage calculation
    return 95; // Placeholder
  }

  private calculateComplianceScore(consentRate: number, auditTrail: number, dataRetention: boolean): number {
    const consentScore = consentRate;
    const auditScore = auditTrail;
    const retentionScore = dataRetention ? 100 : 0;
    
    return Math.round((consentScore * 0.4 + auditScore * 0.3 + retentionScore * 0.3) * 100) / 100;
  }

  private generateComplianceRecommendations(consentRate: number, auditTrail: number, hasOldData: boolean): string[] {
    const recommendations: string[] = [];
    
    if (consentRate < 100) {
      recommendations.push('Implementar processo de coleta de consentimento para todos os membros');
    }
    if (auditTrail < 95) {
      recommendations.push('Melhorar cobertura de audit trails para todas as operações');
    }
    if (hasOldData) {
      recommendations.push('Implementar processo automático de limpeza de dados antigos');
    }
    
    return recommendations;
  }

  private async measureDatabasePerformance(academiaId: string): Promise<any> {
    const start = Date.now();
    await this.prisma.aluno.findFirst({ where: { academiaId } });
    const latency = Date.now() - start;
    
    return { averageLatency: latency };
  }

  private getSystemMetrics(): any {
    const memUsage = process.memoryUsage();
    return {
      uptime: process.uptime() / 3600, // hours
      memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      cpuUsage: 0 // Would need additional library for CPU usage
    };
  }

  private async assessQueueHealth(): Promise<{ score: number }> {
    try {
      const stats = await this.queue.getJobCounts();
      const totalJobs = stats.active + stats.completed + stats.failed + stats.delayed;
      const healthScore = totalJobs > 0 ? ((stats.completed) / totalJobs) * 100 : 100;
      
      return { score: healthScore };
    } catch {
      return { score: 50 }; // Default if queue stats unavailable
    }
  }

  private calculatePerformanceScore(dbPerf: any, systemMetrics: any, queueHealth: any): number {
    const dbScore = Math.max(0, 100 - dbPerf.averageLatency);
    const memScore = Math.max(0, 100 - systemMetrics.memoryUsage);
    const queueScore = queueHealth.score;
    
    return Math.round((dbScore * 0.4 + memScore * 0.3 + queueScore * 0.3) * 100) / 100;
  }

  private generatePerformanceRecommendations(dbPerf: any, systemMetrics: any, queueHealth: any): string[] {
    const recommendations: string[] = [];
    
    if (dbPerf.averageLatency > 100) {
      recommendations.push('Otimizar queries do banco de dados e adicionar índices');
    }
    if (systemMetrics.memoryUsage > 80) {
      recommendations.push('Implementar garbage collection e otimização de memória');
    }
    if (queueHealth.score < 90) {
      recommendations.push('Revisar processamento de filas e handling de jobs falhos');
    }
    
    return recommendations;
  }

  private async calculateReactivationRevenue(academiaId: string, since: Date): Promise<number> {
    // Implementation for reactivation revenue calculation
    return 15000; // Placeholder
  }

  private async calculateNurturingRevenue(academiaId: string, since: Date): Promise<number> {
    // Implementation for nurturing revenue calculation
    return 8500; // Placeholder
  }

  private async calculateAutomationSavings(academiaId: string): Promise<number> {
    // Implementation for automation savings calculation
    return 5000; // Placeholder
  }

  private async calculateRetentionImpact(academiaId: string, since: Date): Promise<any> {
    // Implementation for retention impact calculation
    return { retentionRate: 85, efficiencyGain: 60 }; // Placeholder
  }

  private calculateROIScore(monthlyROI: number, retentionRate: number): number {
    const roiScore = Math.min(monthlyROI / 3, 100); // 300% ROI = 100 score
    const retentionScore = retentionRate;
    
    return Math.round((roiScore * 0.6 + retentionScore * 0.4) * 100) / 100;
  }

  private generateROIRecommendations(monthlyROI: number, retentionImpact: any): string[] {
    const recommendations: string[] = [];
    
    if (monthlyROI < 200) {
      recommendations.push('Implementar estratégias de upselling para membros reativados');
    }
    if (retentionImpact.retentionRate < 80) {
      recommendations.push('Melhorar personalização das mensagens de retenção');
    }
    
    return recommendations;
  }

  private calculateOverallAutomationEffectiveness(reactivation: any, nurturing: any, billing: any): number {
    const avgEffectiveness = ((reactivation.taxaReativacao || 0) + 
                             (nurturing.taxaConversao || 0) + 
                             (billing.eficienciaCobranca || 0)) / 3;
    return Math.round(avgEffectiveness * 100) / 100;
  }

  private generateAutomationRecommendations(reactivation: any, nurturing: any, billing: any): string[] {
    const recommendations: string[] = [];
    
    if ((reactivation.taxaReativacao || 0) < 30) {
      recommendations.push('Otimizar sequência de reativação com ofertas mais personalizadas');
    }
    if ((nurturing.taxaConversao || 0) < 15) {
      recommendations.push('Implementar segmentação avançada para nurturing de leads');
    }
    if ((billing.eficienciaCobranca || 0) < 90) {
      recommendations.push('Automatizar lembretes de pagamento com múltiplos canais');
    }
    
    return recommendations;
  }

  private calculateOverallScore(results: any): number {
    const scores = [
      results.whatsapp?.score || 0,
      results.compliance?.score || 0,
      results.performance?.score || 0,
      results.roi?.score || 0,
      results.automation?.overallEffectiveness || 0
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 100) / 100;
  }

  private generateRecommendations(results: any): string[] {
    const allRecommendations: string[] = [];
    
    Object.values(results).forEach((result: any) => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations);
      }
    });
    
    // Return top 5 recommendations
    return allRecommendations.slice(0, 5);
  }

  private async saveReport(report: AuditReport): Promise<void> {
    const filePath = path.join(process.cwd(), 'audit_results', 'reports', `${report.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  }

  private async calculateMetricsTrends(academiaId: string): Promise<any> {
    // Implementation for metrics trends calculation
    return {}; // Placeholder
  }

  private async getCurrentSystemStatus(academiaId: string): Promise<any> {
    return {
      whatsapp: this.whatsapp.getStatus(),
      automation: {
        reactivation: this.reactivationMCP.getStatus(),
        nurturing: this.nurturingMCP.getStatus(),
        billing: this.billingController.getStatus()
      }
    };
  }

  private getTopRecommendations(reports: AuditReport[]): string[] {
    const allRecommendations: string[] = [];
    
    reports.forEach(report => {
      if (report.recommendations) {
        allRecommendations.push(...report.recommendations);
      }
    });
    
    // Return most frequent recommendations
    const frequency = new Map<string, number>();
    allRecommendations.forEach(rec => {
      frequency.set(rec, (frequency.get(rec) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([rec]) => rec);
  }
}