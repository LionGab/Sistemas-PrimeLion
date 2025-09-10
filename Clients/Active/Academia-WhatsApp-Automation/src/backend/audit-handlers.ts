/**
 * Audit System Route Handlers
 * 
 * IMPORTANT: Complete audit system handlers for Academia WhatsApp Automation
 * PROACTIVELY monitors all aspects of the system for optimization opportunities
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditController } from '../audit/AuditController.js';

interface AuthRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    academiaId: string;
    role: string;
  };
}

export class AuditHandlers {
  private auditController: AuditController;

  constructor(auditController: AuditController) {
    this.auditController = auditController;
  }

  /**
   * Run complete audit - all categories
   */
  async runCompleteAudit(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const report = await this.auditController.runCompleteAudit(academiaId);
      
      return report;
      
    } catch (error) {
      console.error('Error running complete audit:', error);
      return reply.status(500).send({ error: 'Audit execution failed' });
    }
  }

  /**
   * Run WhatsApp performance audit
   */
  async runWhatsAppAudit(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const results = await this.auditController.auditWhatsAppPerformance(academiaId);
      
      return {
        type: 'whatsapp_performance',
        academiaId,
        timestamp: new Date(),
        results
      };
      
    } catch (error) {
      console.error('Error running WhatsApp audit:', error);
      return reply.status(500).send({ error: 'WhatsApp audit failed' });
    }
  }

  /**
   * Run LGPD compliance audit
   */
  async runComplianceAudit(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const results = await this.auditController.auditCompliance(academiaId);
      
      return {
        type: 'lgpd_compliance',
        academiaId,
        timestamp: new Date(),
        results
      };
      
    } catch (error) {
      console.error('Error running compliance audit:', error);
      return reply.status(500).send({ error: 'Compliance audit failed' });
    }
  }

  /**
   * Run system performance audit
   */
  async runPerformanceAudit(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const results = await this.auditController.auditPerformance(academiaId);
      
      return {
        type: 'system_performance',
        academiaId,
        timestamp: new Date(),
        results
      };
      
    } catch (error) {
      console.error('Error running performance audit:', error);
      return reply.status(500).send({ error: 'Performance audit failed' });
    }
  }

  /**
   * Run ROI and business impact audit
   */
  async runROIAudit(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const results = await this.auditController.auditROI(academiaId);
      
      return {
        type: 'roi_analysis',
        academiaId,
        timestamp: new Date(),
        results
      };
      
    } catch (error) {
      console.error('Error running ROI audit:', error);
      return reply.status(500).send({ error: 'ROI audit failed' });
    }
  }

  /**
   * Get audit dashboard
   */
  async getAuditDashboard(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const dashboard = await this.auditController.getAuditDashboard(academiaId);
      
      return dashboard;
      
    } catch (error) {
      console.error('Error generating audit dashboard:', error);
      return reply.status(500).send({ error: 'Dashboard generation failed' });
    }
  }

  /**
   * Get all audit reports for academia
   */
  async getAuditReports(request: AuthRequest, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const reports = this.auditController.getAuditReports(academiaId);
      
      return {
        academiaId,
        reports,
        total: reports.length
      };
      
    } catch (error) {
      console.error('Error fetching audit reports:', error);
      return reply.status(500).send({ error: 'Failed to fetch reports' });
    }
  }

  /**
   * Get specific audit report
   */
  async getAuditReport(request: AuthRequest, reply: FastifyReply) {
    try {
      const { reportId } = request.params as any;
      const report = this.auditController.getAuditReport(reportId);
      
      if (!report) {
        return reply.status(404).send({ error: 'Report not found' });
      }
      
      // Verify academia access
      if (report.academiaId !== request.user!.academiaId) {
        return reply.status(403).send({ error: 'Access denied' });
      }
      
      return report;
      
    } catch (error) {
      console.error('Error fetching audit report:', error);
      return reply.status(500).send({ error: 'Failed to fetch report' });
    }
  }
}