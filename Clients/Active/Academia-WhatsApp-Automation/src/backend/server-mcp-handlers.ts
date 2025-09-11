/**
 * MCP Route Handlers - Extended handlers for MCP integration routes
 * 
 * This file contains all the MCP-specific route handlers that extend
 * the main server functionality with Model Context Protocol integrations
 */

import { FastifyRequest, FastifyReply } from 'fastify';

// Define the handlers as a module that can be mixed into the main server class
export const MCPHandlers = {

  /**
   * Get overall MCP system status
   * GET /api/mcp/status
   */
  async getMCPStatus(this: any, request: any, reply: FastifyReply) {
    try {
      const mcpStatus = this.mcpManager?.getServerStatus() || { 
        initialized: false, 
        message: 'MCP Manager not initialized' 
      };
      
      return {
        success: true,
        mcp: mcpStatus,
        integration: {
          operationsReady: !!this.mcpOperations,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting MCP status:', error);
      return reply.status(500).send({ error: 'Failed to get MCP status' });
    }
  },

  /**
   * Generate comprehensive analytics report using MCP operations
   * POST /api/mcp/analytics/generate
   */
  async generateMCPAnalytics(this: any, request: any, reply: FastifyReply) {
    try {
      const academiaId = request.user!.academiaId;
      const { days = 30 } = request.body as any;

      if (!this.mcpOperations) {
        return reply.status(503).send({ error: 'MCP Operations not available' });
      }

      // Generate comprehensive analytics report
      const report = await this.mcpOperations.generateAnalyticsReport(academiaId, days);

      this.logger.info(`Generated MCP analytics report for academia ${academiaId}`);

      return {
        success: true,
        report,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error generating MCP analytics:', error);
      return reply.status(500).send({ 
        error: 'Failed to generate analytics',
        message: (error as Error).message
      });
    }
  },

  /**
   * Run competitor analysis using web scraping and search MCPs
   * POST /api/mcp/competitor-analysis
   */
  async runCompetitorAnalysis(this: any, request: any, reply: FastifyReply) {
    try {
      const { city = 'São Paulo' } = request.body as any;

      if (!this.mcpOperations) {
        return reply.status(503).send({ error: 'MCP Operations not available' });
      }

      // Perform competitor analysis
      const analysis = await this.mcpOperations.performCompetitorAnalysis(city);

      this.logger.info(`Completed competitor analysis for ${city}`);

      return {
        success: true,
        analysis,
        city,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error running competitor analysis:', error);
      return reply.status(500).send({ 
        error: 'Failed to run competitor analysis',
        message: (error as Error).message
      });
    }
  },

  /**
   * Run system health check using monitoring MCPs
   * POST /api/mcp/health-check
   */
  async runHealthCheck(this: any, request: any, reply: FastifyReply) {
    try {
      if (!this.mcpOperations) {
        return reply.status(503).send({ error: 'MCP Operations not available' });
      }

      // Monitor system health
      const healthReport = await this.mcpOperations.monitorSystemHealth();

      this.logger.info('Completed system health check via MCP');

      return {
        success: true,
        health: healthReport,
        checked_at: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error running health check:', error);
      return reply.status(500).send({ 
        error: 'Failed to run health check',
        message: (error as Error).message
      });
    }
  },

  /**
   * Get status of specific MCP server
   * GET /api/mcp/servers/:serverId/status
   */
  async getMCPServerStatus(this: any, request: any, reply: FastifyReply) {
    try {
      const { serverId } = request.params as any;

      if (!this.mcpManager) {
        return reply.status(503).send({ error: 'MCP Manager not available' });
      }

      const serverStatus = this.mcpManager.getServerStatus(serverId);

      if (!serverStatus) {
        return reply.status(404).send({ error: `MCP server '${serverId}' not found` });
      }

      return {
        success: true,
        server: serverStatus
      };

    } catch (error) {
      this.logger.error(`Error getting MCP server status for ${request.params.serverId}:`, error);
      return reply.status(500).send({ 
        error: 'Failed to get server status',
        message: (error as Error).message
      });
    }
  },

  /**
   * Start specific MCP server
   * POST /api/mcp/servers/:serverId/start
   */
  async startMCPServer(this: any, request: any, reply: FastifyReply) {
    try {
      const { serverId } = request.params as any;

      if (!this.mcpManager) {
        return reply.status(503).send({ error: 'MCP Manager not available' });
      }

      await this.mcpManager.startServer(serverId);

      this.logger.info(`Started MCP server: ${serverId}`);

      return {
        success: true,
        message: `MCP server '${serverId}' started successfully`,
        serverId,
        started_at: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Error starting MCP server ${request.params.serverId}:`, error);
      return reply.status(500).send({ 
        error: `Failed to start MCP server '${request.params.serverId}'`,
        message: (error as Error).message
      });
    }
  },

  /**
   * Stop specific MCP server
   * POST /api/mcp/servers/:serverId/stop
   */
  async stopMCPServer(this: any, request: any, reply: FastifyReply) {
    try {
      const { serverId } = request.params as any;

      if (!this.mcpManager) {
        return reply.status(503).send({ error: 'MCP Manager not available' });
      }

      await this.mcpManager.stopServer(serverId);

      this.logger.info(`Stopped MCP server: ${serverId}`);

      return {
        success: true,
        message: `MCP server '${serverId}' stopped successfully`,
        serverId,
        stopped_at: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Error stopping MCP server ${request.params.serverId}:`, error);
      return reply.status(500).send({ 
        error: `Failed to stop MCP server '${request.params.serverId}'`,
        message: (error as Error).message
      });
    }
  }
};

// Define types for the MCP handlers
export interface MCPHandlerContext {
  mcpManager: any;
  mcpOperations: any;
  logger: any;
  user?: {
    academiaId: string;
  };
}