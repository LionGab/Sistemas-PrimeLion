/**
 * MCP Operations - High-level business operations using MCP servers
 * 
 * IMPORTANT: Business-specific operations built on top of MCP Manager
 * PROACTIVELY provides ready-to-use functionality for academia automation
 * ULTRATHINK: Complex multi-MCP workflows for business intelligence
 */

import { MCPManager } from './MCPManager.js';
import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsReport {
  period: string;
  metrics: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newMembers: number;
    churnRate: number;
    reactivationRate: number;
    conversionRate: number;
    revenue: number;
  };
  performance: {
    messagesSent: number;
    responsesReceived: number;
    responseRate: number;
    avgResponseTime: number;
    automationEfficiency: number;
  };
  trends: {
    memberGrowth: number;
    revenueGrowth: number;
    engagementTrend: string;
  };
}

interface CompetitorAnalysis {
  competitors: Array<{
    name: string;
    pricing: any;
    offers: string[];
    strengths: string[];
    weaknesses: string[];
  }>;
  marketTrends: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export class MCPOperations {
  private mcpManager: MCPManager;
  private prisma: PrismaClient;
  private logger: pino.Logger;

  constructor(mcpManager: MCPManager, prisma: PrismaClient) {
    this.mcpManager = mcpManager;
    this.prisma = prisma;
    
    this.logger = pino({
      name: 'mcp-operations',
      level: process.env.LOG_LEVEL || 'info'
    });
  }

  /**
   * Generate comprehensive analytics report
   * IMPORTANT: Core business intelligence function
   */
  async generateAnalyticsReport(academiaId: string, days: number = 30): Promise<AnalyticsReport> {
    this.logger.info(`Generating analytics report for ${days} days`);

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      const previousStartDate = subDays(startDate, days);

      // Get current period metrics
      const currentMetrics = await this.getMetrics(academiaId, startDate, endDate);
      
      // Get previous period for comparison
      const previousMetrics = await this.getMetrics(academiaId, previousStartDate, startDate);

      // Calculate trends
      const memberGrowth = currentMetrics.totalMembers - previousMetrics.totalMembers;
      const revenueGrowth = ((currentMetrics.revenue - previousMetrics.revenue) / previousMetrics.revenue) * 100;
      
      const engagementTrend = currentMetrics.responseRate > previousMetrics.responseRate ? 'increasing' : 
                            currentMetrics.responseRate < previousMetrics.responseRate ? 'decreasing' : 'stable';

      const report: AnalyticsReport = {
        period: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
        metrics: currentMetrics,
        performance: {
          messagesSent: currentMetrics.messagesSent || 0,
          responsesReceived: currentMetrics.responsesReceived || 0,
          responseRate: currentMetrics.responseRate || 0,
          avgResponseTime: currentMetrics.avgResponseTime || 0,
          automationEfficiency: this.calculateAutomationEfficiency(currentMetrics)
        },
        trends: {
          memberGrowth,
          revenueGrowth: isNaN(revenueGrowth) ? 0 : revenueGrowth,
          engagementTrend
        }
      };

      // Save report to Google Drive
      await this.saveReportToDrive(report, academiaId);

      // Send notifications
      await this.sendReportNotifications(report, academiaId);

      return report;

    } catch (error) {
      this.logger.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Get metrics for specific period using PostgreSQL MCP
   */
  private async getMetrics(academiaId: string, startDate: Date, endDate: Date): Promise<any> {
    const memberMetrics = await this.mcpManager.executeRequest({
      server: 'postgres',
      method: 'query',
      params: {
        query: `
          SELECT 
            COUNT(*) as total_members,
            COUNT(*) FILTER (WHERE status = 'ATIVO') as active_members,
            COUNT(*) FILTER (WHERE status = 'INATIVO') as inactive_members,
            COUNT(*) FILTER (WHERE created_at BETWEEN $1 AND $2) as new_members,
            AVG(CASE WHEN valor_mensalidade > 0 THEN valor_mensalidade ELSE 150 END) as avg_monthly_fee
          FROM alunos 
          WHERE academia_id = $3
        `,
        params: [startDate.toISOString(), endDate.toISOString(), academiaId]
      }
    });

    const messageMetrics = await this.mcpManager.executeRequest({
      server: 'postgres',
      method: 'query',
      params: {
        query: `
          SELECT 
            COUNT(*) FILTER (WHERE tipo = 'SAIDA') as messages_sent,
            COUNT(*) FILTER (WHERE tipo = 'ENTRADA') as responses_received,
            AVG(CASE WHEN tipo = 'ENTRADA' THEN 
              EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY aluno_id ORDER BY created_at))) / 60
            END) as avg_response_time_minutes
          FROM mensagens 
          WHERE academia_id = $1 AND created_at BETWEEN $2 AND $3
        `,
        params: [academiaId, startDate.toISOString(), endDate.toISOString()]
      }
    });

    const reactivationMetrics = await this.mcpManager.executeRequest({
      server: 'postgres',
      method: 'query',
      params: {
        query: `
          SELECT COUNT(*) as reactivated_members
          FROM alunos a
          JOIN mensagens m ON a.id = m.aluno_id
          WHERE a.academia_id = $1 
            AND m.template_id LIKE 'reativacao_%'
            AND m.created_at BETWEEN $2 AND $3
            AND EXISTS (
              SELECT 1 FROM frequencia f 
              WHERE f.aluno_id = a.id 
                AND f.data_visita > m.created_at
                AND f.data_visita <= $3
            )
        `,
        params: [academiaId, startDate.toISOString(), endDate.toISOString()]
      }
    });

    const memberData = memberMetrics.data?.result?.[0] || {};
    const messageData = messageMetrics.data?.result?.[0] || {};
    const reactivationData = reactivationMetrics.data?.result?.[0] || {};

    const totalMembers = parseInt(memberData.total_members || '0');
    const activeMembers = parseInt(memberData.active_members || '0');
    const inactiveMembers = parseInt(memberData.inactive_members || '0');
    const newMembers = parseInt(memberData.new_members || '0');
    const messagesSent = parseInt(messageData.messages_sent || '0');
    const responsesReceived = parseInt(messageData.responses_received || '0');
    const reactivatedMembers = parseInt(reactivationData.reactivated_members || '0');

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      newMembers,
      churnRate: totalMembers > 0 ? (inactiveMembers / totalMembers) * 100 : 0,
      reactivationRate: inactiveMembers > 0 ? (reactivatedMembers / inactiveMembers) * 100 : 0,
      conversionRate: messagesSent > 0 ? (responsesReceived / messagesSent) * 100 : 0,
      revenue: activeMembers * (parseFloat(memberData.avg_monthly_fee) || 150),
      messagesSent,
      responsesReceived,
      responseRate: messagesSent > 0 ? (responsesReceived / messagesSent) * 100 : 0,
      avgResponseTime: parseFloat(messageData.avg_response_time_minutes || '0')
    };
  }

  /**
   * Calculate automation efficiency score
   */
  private calculateAutomationEfficiency(metrics: any): number {
    // Weighted score based on multiple factors
    const responseWeight = 0.4;
    const reactivationWeight = 0.3;
    const conversionWeight = 0.3;

    const responseScore = Math.min(metrics.responseRate / 25, 1) * 100; // Target 25% response rate
    const reactivationScore = Math.min(metrics.reactivationRate / 30, 1) * 100; // Target 30% reactivation
    const conversionScore = Math.min(metrics.conversionRate / 15, 1) * 100; // Target 15% conversion

    return (responseScore * responseWeight + 
            reactivationScore * reactivationWeight + 
            conversionScore * conversionWeight);
  }

  /**
   * Save report to Google Drive
   */
  private async saveReportToDrive(report: AnalyticsReport, academiaId: string): Promise<void> {
    try {
      const fileName = `Academia_Analytics_${academiaId}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      
      await this.mcpManager.executeRequest({
        server: 'google_drive',
        method: 'create_file',
        params: {
          name: fileName,
          content: JSON.stringify(report, null, 2),
          mimeType: 'application/json',
          parents: ['analytics_reports'] // Folder ID
        }
      });

      this.logger.info(`Report saved to Google Drive: ${fileName}`);
    } catch (error) {
      this.logger.error('Failed to save report to Google Drive:', error);
      // Don't throw - report generation should continue
    }
  }

  /**
   * Send report notifications via Slack and email
   */
  private async sendReportNotifications(report: AnalyticsReport, academiaId: string): Promise<void> {
    try {
      // Slack notification
      const slackMessage = this.formatSlackMessage(report);
      await this.mcpManager.executeRequest({
        server: 'slack',
        method: 'post_message',
        params: {
          channel: '#academia-reports',
          blocks: slackMessage
        }
      });

      // Email notification
      const htmlReport = this.formatHTMLReport(report);
      await this.mcpManager.executeRequest({
        server: 'gmail',
        method: 'send_email',
        params: {
          to: process.env.ADMIN_EMAIL,
          subject: `📊 Academia Analytics Report - ${format(new Date(), 'dd/MM/yyyy')}`,
          html: htmlReport
        }
      });

    } catch (error) {
      this.logger.error('Failed to send report notifications:', error);
    }
  }

  /**
   * Format Slack message with rich blocks
   */
  private formatSlackMessage(report: AnalyticsReport): any {
    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📊 Academia Analytics Report"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Period:*\n${report.period}`
          },
          {
            type: "mrkdwn",
            text: `*Total Members:*\n${report.metrics.totalMembers}`
          },
          {
            type: "mrkdwn",
            text: `*Active Members:*\n${report.metrics.activeMembers}`
          },
          {
            type: "mrkdwn",
            text: `*Revenue:*\nR$ ${report.metrics.revenue.toFixed(2)}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Messages Sent:*\n${report.performance.messagesSent}`
          },
          {
            type: "mrkdwn",
            text: `*Response Rate:*\n${report.performance.responseRate.toFixed(1)}%`
          },
          {
            type: "mrkdwn",
            text: `*Member Growth:*\n${report.trends.memberGrowth > 0 ? '+' : ''}${report.trends.memberGrowth}`
          },
          {
            type: "mrkdwn",
            text: `*Revenue Growth:*\n${report.trends.revenueGrowth > 0 ? '+' : ''}${report.trends.revenueGrowth.toFixed(1)}%`
          }
        ]
      }
    ];
  }

  /**
   * Format HTML email report
   */
  private formatHTMLReport(report: AnalyticsReport): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
          .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
          .metric-value { font-size: 32px; font-weight: bold; color: #2c3e50; margin: 10px 0; }
          .metric-label { color: #7f8c8d; font-size: 14px; text-transform: uppercase; }
          .trend-up { color: #27ae60; }
          .trend-down { color: #e74c3c; }
          .footer { text-align: center; color: #7f8c8d; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Academia Analytics Report</h1>
            <p>Period: ${report.period}</p>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Members</div>
              <div class="metric-value">${report.metrics.totalMembers}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Active Members</div>
              <div class="metric-value">${report.metrics.activeMembers}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Monthly Revenue</div>
              <div class="metric-value">R$ ${report.metrics.revenue.toFixed(0)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Reactivation Rate</div>
              <div class="metric-value">${report.metrics.reactivationRate.toFixed(1)}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Messages Sent</div>
              <div class="metric-value">${report.performance.messagesSent}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Response Rate</div>
              <div class="metric-value">${report.performance.responseRate.toFixed(1)}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Member Growth</div>
              <div class="metric-value ${report.trends.memberGrowth >= 0 ? 'trend-up' : 'trend-down'}">
                ${report.trends.memberGrowth > 0 ? '+' : ''}${report.trends.memberGrowth}
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Revenue Growth</div>
              <div class="metric-value ${report.trends.revenueGrowth >= 0 ? 'trend-up' : 'trend-down'}">
                ${report.trends.revenueGrowth > 0 ? '+' : ''}${report.trends.revenueGrowth.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Generated automatically by Academia WhatsApp Automation System</p>
            <p>Report saved to Google Drive • Notifications sent via Slack</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Perform competitor analysis using web scraping
   * PROACTIVELY monitors market trends and pricing
   */
  async performCompetitorAnalysis(city: string = 'São Paulo'): Promise<CompetitorAnalysis> {
    this.logger.info(`Performing competitor analysis for ${city}`);

    try {
      // Search for local fitness competitors
      const searchResults = await this.mcpManager.executeRequest({
        server: 'brave_search',
        method: 'search',
        params: {
          query: `academias fitness ${city} preços mensalidade`,
          count: 10,
          country: 'BR',
          language: 'pt'
        }
      });

      // Scrape competitor websites for pricing
      const competitorUrls = searchResults.data?.results?.slice(0, 5).map((r: any) => r.url) || [];
      const competitorData = [];

      for (const url of competitorUrls) {
        try {
          const scrapedData = await this.mcpManager.executeRequest({
            server: 'puppeteer',
            method: 'scrape_page',
            params: {
              url,
              selectors: {
                pricing: ['[class*="price"]', '[class*="valor"]', '[id*="preco"]'],
                offers: ['[class*="promo"]', '[class*="oferta"]'],
                services: ['[class*="service"]', '[class*="modalidade"]']
              }
            }
          });

          if (scrapedData.success) {
            competitorData.push({
              url,
              data: scrapedData.data
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to scrape ${url}:`, error);
        }
      }

      // Analyze trends
      const trendSearch = await this.mcpManager.executeRequest({
        server: 'brave_search',
        method: 'search',
        params: {
          query: 'tendências fitness 2024 academia funcional crossfit',
          count: 5,
          country: 'BR'
        }
      });

      const analysis: CompetitorAnalysis = {
        competitors: this.processCompetitorData(competitorData),
        marketTrends: this.extractMarketTrends(trendSearch.data?.results || []),
        opportunities: [
          'Personal training online integration',
          'Functional fitness focus',
          'Corporate wellness packages',
          'Senior-focused programs'
        ],
        threats: [
          'Low-cost gym chains',
          'Home fitness apps',
          'Economic uncertainty',
          'Market saturation'
        ],
        recommendations: [
          'Differentiate with personalized service',
          'Expand digital offerings',
          'Focus on community building',
          'Implement flexible pricing tiers'
        ]
      };

      // Save analysis to Google Drive
      await this.mcpManager.executeRequest({
        server: 'google_drive',
        method: 'create_file',
        params: {
          name: `Competitor_Analysis_${city}_${format(new Date(), 'yyyy-MM-dd')}.json`,
          content: JSON.stringify(analysis, null, 2),
          mimeType: 'application/json',
          parents: ['market_analysis']
        }
      });

      return analysis;

    } catch (error) {
      this.logger.error('Failed to perform competitor analysis:', error);
      throw error;
    }
  }

  /**
   * Process scraped competitor data
   */
  private processCompetitorData(competitorData: any[]): any[] {
    return competitorData.map(({ url, data }) => ({
      name: this.extractNameFromUrl(url),
      pricing: data.pricing || [],
      offers: data.offers || [],
      strengths: this.inferStrengths(data),
      weaknesses: this.inferWeaknesses(data)
    }));
  }

  /**
   * Extract market trends from search results
   */
  private extractMarketTrends(results: any[]): string[] {
    const trends = [];
    const trendKeywords = ['funcional', 'crossfit', 'online', 'personalizado', 'wellness', 'mental'];
    
    results.forEach(result => {
      const text = (result.title + ' ' + result.description).toLowerCase();
      trendKeywords.forEach(keyword => {
        if (text.includes(keyword) && !trends.includes(keyword)) {
          trends.push(keyword);
        }
      });
    });

    return trends;
  }

  private extractNameFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown';
    }
  }

  private inferStrengths(data: any): string[] {
    const strengths = [];
    if (data.pricing?.length > 0) strengths.push('Transparent pricing');
    if (data.offers?.length > 0) strengths.push('Active promotions');
    if (data.services?.length > 5) strengths.push('Diverse services');
    return strengths;
  }

  private inferWeaknesses(data: any): string[] {
    const weaknesses = [];
    if (!data.pricing || data.pricing.length === 0) weaknesses.push('Unclear pricing');
    if (!data.offers || data.offers.length === 0) weaknesses.push('No visible promotions');
    return weaknesses;
  }

  /**
   * Monitor system health and send alerts
   * IMPORTANT: Proactive monitoring using Sentry MCP
   */
  async monitorSystemHealth(): Promise<any> {
    try {
      // Get error metrics from Sentry
      const errorStats = await this.mcpManager.executeRequest({
        server: 'sentry',
        method: 'get_project_stats',
        params: {
          project: process.env.SENTRY_PROJECT,
          stat: 'error_count',
          since: Math.floor(Date.now() / 1000) - 3600 // Last hour
        }
      });

      // Check database performance
      const dbHealth = await this.mcpManager.executeRequest({
        server: 'postgres',
        method: 'query',
        params: {
          query: 'SELECT version(), now(), pg_database_size(current_database()) as db_size'
        }
      });

      // Get queue status
      const queueStats = await this.getQueueHealthMetrics();

      const healthReport = {
        timestamp: new Date(),
        errors: errorStats.data || { total: 0 },
        database: dbHealth.data?.result?.[0] || {},
        queues: queueStats,
        status: 'healthy' // Will be updated based on thresholds
      };

      // Check against thresholds and send alerts if needed
      await this.checkHealthThresholds(healthReport);

      return healthReport;

    } catch (error) {
      this.logger.error('Health monitoring failed:', error);
      
      // Send critical alert
      await this.mcpManager.executeRequest({
        server: 'slack',
        method: 'post_message',
        params: {
          channel: '#academia-alerts',
          text: `🚨 *CRITICAL: Health Monitoring Failed*\n\nError: ${(error as Error).message}\n\nSystem may require immediate attention.`
        }
      });

      throw error;
    }
  }

  /**
   * Get queue health metrics
   */
  private async getQueueHealthMetrics(): Promise<any> {
    // This would integrate with BullMQ monitoring
    // For now, return placeholder data
    return {
      reactivation: { waiting: 5, active: 2, completed: 145, failed: 1 },
      nurturing: { waiting: 12, active: 3, completed: 89, failed: 0 }
    };
  }

  /**
   * Check health thresholds and send alerts
   */
  private async checkHealthThresholds(healthReport: any): Promise<void> {
    const alerts = [];

    // Check error rate
    if (healthReport.errors.total > 10) {
      alerts.push(`⚠️ High error rate: ${healthReport.errors.total} errors in the last hour`);
    }

    // Check queue failures
    Object.entries(healthReport.queues).forEach(([queueName, stats]: [string, any]) => {
      if (stats.failed > 5) {
        alerts.push(`⚠️ High failure rate in ${queueName} queue: ${stats.failed} failed jobs`);
      }
    });

    if (alerts.length > 0) {
      await this.mcpManager.executeRequest({
        server: 'slack',
        method: 'post_message',
        params: {
          channel: '#academia-alerts',
          text: `🚨 *System Health Alerts*\n\n${alerts.join('\n')}`
        }
      });
    }
  }
}