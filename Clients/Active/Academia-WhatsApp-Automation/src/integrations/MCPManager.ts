/**
 * MCP Manager - Model Context Protocol Integration Layer
 * 
 * IMPORTANT: Coordinates external MCP servers with internal automation system
 * PROACTIVELY manages connections and provides unified interface
 * ULTRATHINK: Enterprise-grade MCP orchestration with error handling
 */

import { EventEmitter } from 'events';
import pino from 'pino';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

interface MCPServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  description: string;
  capabilities: string[];
  priority: 'high' | 'medium' | 'low';
  usage?: 'always' | 'on_demand' | 'development_only';
}

interface MCPConnection {
  id: string;
  config: MCPServerConfig;
  process?: ChildProcess;
  status: 'stopped' | 'starting' | 'running' | 'error';
  lastError?: Error;
  connectedAt?: Date;
}

interface MCPRequest {
  server: string;
  method: string;
  params: any;
  timeout?: number;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export class MCPManager extends EventEmitter {
  private logger: pino.Logger;
  private connections: Map<string, MCPConnection> = new Map();
  private config: any;
  private isInitialized: boolean = false;

  constructor() {
    super();
    
    this.logger = pino({
      name: 'mcp-manager',
      level: process.env.LOG_LEVEL || 'info'
    });
  }

  /**
   * Initialize MCP Manager
   * IMPORTANT: Loads configuration and starts priority servers
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing MCP Manager...');
      
      // Load MCP configuration
      await this.loadConfiguration();
      
      // Start high priority servers immediately
      await this.startPriorityServers();
      
      // Setup cleanup handlers
      this.setupCleanupHandlers();
      
      this.isInitialized = true;
      this.logger.info('MCP Manager initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize MCP Manager:', error);
      throw error;
    }
  }

  /**
   * Load MCP configuration from file
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'mcp.config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      this.config = JSON.parse(configData);
      
      this.logger.info(`Loaded configuration for ${Object.keys(this.config.mcp_servers).length} MCP servers`);
    } catch (error) {
      this.logger.error('Failed to load MCP configuration:', error);
      throw error;
    }
  }

  /**
   * Start high priority MCP servers immediately
   */
  private async startPriorityServers(): Promise<void> {
    const highPriorityServers = Object.entries(this.config.mcp_servers)
      .filter(([_, config]: [string, any]) => config.priority === 'high')
      .map(([id, _]) => id);

    this.logger.info(`Starting ${highPriorityServers.length} high priority servers...`);

    for (const serverId of highPriorityServers) {
      try {
        await this.startServer(serverId);
      } catch (error) {
        this.logger.error(`Failed to start priority server ${serverId}:`, error);
        // Continue with other servers even if one fails
      }
    }
  }

  /**
   * Start specific MCP server
   */
  async startServer(serverId: string): Promise<void> {
    if (!this.config.mcp_servers[serverId]) {
      throw new Error(`MCP server ${serverId} not found in configuration`);
    }

    const serverConfig: MCPServerConfig = this.config.mcp_servers[serverId];
    
    // Check if server should run in current environment
    if (serverConfig.usage === 'development_only' && process.env.NODE_ENV === 'production') {
      this.logger.info(`Skipping ${serverId} in production environment`);
      return;
    }

    this.logger.info(`Starting MCP server: ${serverId}`);

    const connection: MCPConnection = {
      id: serverId,
      config: serverConfig,
      status: 'starting'
    };

    this.connections.set(serverId, connection);

    try {
      // Prepare environment variables
      const env = {
        ...process.env,
        ...serverConfig.env
      };

      // Expand environment variable references
      Object.keys(env).forEach(key => {
        if (env[key] && typeof env[key] === 'string') {
          env[key] = env[key].replace(/\$\{([^}]+)\}/g, (_, envVar) => {
            return process.env[envVar] || '';
          });
        }
      });

      // Start the MCP server process
      const mcpProcess = spawn(serverConfig.command, serverConfig.args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      connection.process = mcpProcess;
      connection.status = 'running';
      connection.connectedAt = new Date();

      // Setup process event handlers
      this.setupProcessHandlers(serverId, mcpProcess);

      this.logger.info(`MCP server ${serverId} started successfully (PID: ${mcpProcess.pid})`);
      this.emit('server:started', serverId);

    } catch (error) {
      connection.status = 'error';
      connection.lastError = error as Error;
      this.logger.error(`Failed to start MCP server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Setup process event handlers for MCP server
   */
  private setupProcessHandlers(serverId: string, process: ChildProcess): void {
    const connection = this.connections.get(serverId)!;

    process.on('error', (error) => {
      this.logger.error(`MCP server ${serverId} process error:`, error);
      connection.status = 'error';
      connection.lastError = error;
      this.emit('server:error', serverId, error);
    });

    process.on('exit', (code, signal) => {
      this.logger.warn(`MCP server ${serverId} exited with code ${code}, signal ${signal}`);
      connection.status = 'stopped';
      this.emit('server:stopped', serverId, code, signal);
      
      // Auto-restart high priority servers
      if (connection.config.priority === 'high') {
        setTimeout(() => {
          this.startServer(serverId).catch(err => {
            this.logger.error(`Failed to restart server ${serverId}:`, err);
          });
        }, 5000);
      }
    });

    // Log server output for debugging
    if (process.stdout) {
      process.stdout.on('data', (data) => {
        this.logger.debug(`MCP ${serverId} stdout:`, data.toString().trim());
      });
    }

    if (process.stderr) {
      process.stderr.on('data', (data) => {
        this.logger.debug(`MCP ${serverId} stderr:`, data.toString().trim());
      });
    }
  }

  /**
   * Stop specific MCP server
   */
  async stopServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection || !connection.process) {
      this.logger.warn(`MCP server ${serverId} is not running`);
      return;
    }

    this.logger.info(`Stopping MCP server: ${serverId}`);

    return new Promise((resolve) => {
      const process = connection.process!;
      
      // Graceful shutdown
      process.kill('SIGTERM');
      
      const forceKillTimeout = setTimeout(() => {
        this.logger.warn(`Force killing MCP server ${serverId}`);
        process.kill('SIGKILL');
      }, 10000);

      process.on('exit', () => {
        clearTimeout(forceKillTimeout);
        connection.status = 'stopped';
        connection.process = undefined;
        this.logger.info(`MCP server ${serverId} stopped`);
        resolve();
      });
    });
  }

  /**
   * Execute request to specific MCP server
   * IMPORTANT: Core communication interface with error handling
   */
  async executeRequest(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    
    try {
      const connection = this.connections.get(request.server);
      if (!connection || connection.status !== 'running') {
        // Try to start server on-demand if it's configured for it
        if (connection?.config.usage === 'on_demand') {
          await this.startServer(request.server);
        } else {
          throw new Error(`MCP server ${request.server} is not running`);
        }
      }

      // Execute the request (this would be the actual MCP communication)
      const result = await this.sendMCPRequest(connection!, request);
      
      const executionTime = Date.now() - startTime;
      
      this.logger.debug(`MCP request to ${request.server} completed in ${executionTime}ms`);
      
      return {
        success: true,
        data: result,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`MCP request to ${request.server} failed:`, error);
      
      return {
        success: false,
        error: (error as Error).message,
        executionTime
      };
    }
  }

  /**
   * Send actual MCP request (placeholder for real implementation)
   */
  private async sendMCPRequest(connection: MCPConnection, request: MCPRequest): Promise<any> {
    // This is a placeholder - real implementation would use the MCP protocol
    // to communicate with the server process via stdin/stdout
    
    const message = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: request.method,
      params: request.params
    };

    // Simulate MCP request/response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP request timeout'));
      }, request.timeout || 30000);

      // In real implementation, this would send the message to the process
      // and wait for the JSON-RPC response
      
      // For now, simulate successful response
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({ result: 'simulated response' });
      }, 100);
    });
  }

  /**
   * Get server status
   */
  getServerStatus(serverId?: string): any {
    if (serverId) {
      const connection = this.connections.get(serverId);
      return connection ? {
        id: serverId,
        status: connection.status,
        connectedAt: connection.connectedAt,
        lastError: connection.lastError?.message,
        capabilities: connection.config.capabilities
      } : null;
    }

    // Return all servers status
    const servers: any = {};
    this.connections.forEach((connection, id) => {
      servers[id] = {
        status: connection.status,
        connectedAt: connection.connectedAt,
        lastError: connection.lastError?.message,
        priority: connection.config.priority,
        capabilities: connection.config.capabilities
      };
    });

    return {
      initialized: this.isInitialized,
      totalServers: this.connections.size,
      runningServers: Array.from(this.connections.values())
        .filter(conn => conn.status === 'running').length,
      servers
    };
  }

  /**
   * Execute daily analytics workflow
   * PROACTIVELY generates business insights using MCP servers
   */
  async executeDailyAnalytics(academiaId: string): Promise<any> {
    this.logger.info('Starting daily analytics workflow...');

    try {
      // 1. Fetch metrics from PostgreSQL MCP
      const metricsResult = await this.executeRequest({
        server: 'postgres',
        method: 'query',
        params: {
          query: `
            SELECT 
              COUNT(*) as total_members,
              COUNT(*) FILTER (WHERE status = 'ATIVO') as active_members,
              COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') as new_members_today,
              COUNT(*) FILTER (WHERE ultima_visita >= CURRENT_DATE - INTERVAL '1 day') as members_trained_today
            FROM alunos 
            WHERE academia_id = $1
          `,
          params: [academiaId]
        }
      });

      // 2. Get message statistics
      const messageStats = await this.executeRequest({
        server: 'postgres',
        method: 'query',
        params: {
          query: `
            SELECT 
              COUNT(*) as messages_sent,
              COUNT(*) FILTER (WHERE tipo = 'ENTRADA') as responses_received,
              AVG(CASE WHEN tipo = 'ENTRADA' THEN 
                EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))
              END) as avg_response_time
            FROM mensagens 
            WHERE academia_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '1 day'
          `,
          params: [academiaId]
        }
      });

      // 3. Generate report content
      const reportData = {
        date: new Date().toISOString().split('T')[0],
        metrics: metricsResult.data?.result?.[0] || {},
        messageStats: messageStats.data?.result?.[0] || {},
        generatedAt: new Date()
      };

      // 4. Send Slack notification
      await this.executeRequest({
        server: 'slack',
        method: 'post_message',
        params: {
          channel: '#academia-reports',
          text: `📊 *Daily Analytics Report - ${reportData.date}*\n\n` +
                `👥 Members: ${reportData.metrics.total_members} total, ${reportData.metrics.active_members} active\n` +
                `📈 New today: ${reportData.metrics.new_members_today}\n` +
                `🏋️ Trained today: ${reportData.metrics.members_trained_today}\n` +
                `💬 Messages: ${reportData.messageStats.messages_sent} sent, ${reportData.messageStats.responses_received} responses`
        }
      });

      // 5. Send email report
      await this.executeRequest({
        server: 'gmail',
        method: 'send_email',
        params: {
          to: process.env.ADMIN_EMAIL,
          subject: `Academia Daily Report - ${reportData.date}`,
          html: this.generateHTMLReport(reportData)
        }
      });

      this.logger.info('Daily analytics workflow completed successfully');
      return reportData;

    } catch (error) {
      this.logger.error('Daily analytics workflow failed:', error);
      
      // Send error alert
      await this.executeRequest({
        server: 'slack',
        method: 'post_message',
        params: {
          channel: '#academia-alerts',
          text: `🚨 *Daily Analytics Failed*\n\nError: ${(error as Error).message}`
        }
      });

      throw error;
    }
  }

  /**
   * Generate HTML email report
   */
  private generateHTMLReport(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academia Daily Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; }
          .metric { background: #f5f5f5; margin: 10px 0; padding: 15px; border-radius: 5px; }
          .metric h3 { margin: 0 0 10px 0; color: #333; }
          .value { font-size: 24px; font-weight: bold; color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Academia Daily Report</h1>
          <p>Generated on ${data.date}</p>
        </div>
        
        <div class="metric">
          <h3>👥 Total Members</h3>
          <div class="value">${data.metrics.total_members || 0}</div>
        </div>
        
        <div class="metric">
          <h3>✅ Active Members</h3>
          <div class="value">${data.metrics.active_members || 0}</div>
        </div>
        
        <div class="metric">
          <h3>📈 New Members Today</h3>
          <div class="value">${data.metrics.new_members_today || 0}</div>
        </div>
        
        <div class="metric">
          <h3>🏋️ Members Who Trained Today</h3>
          <div class="value">${data.metrics.members_trained_today || 0}</div>
        </div>
        
        <div class="metric">
          <h3>💬 Messages Sent Today</h3>
          <div class="value">${data.messageStats.messages_sent || 0}</div>
        </div>
        
        <div class="metric">
          <h3>📞 Responses Received</h3>
          <div class="value">${data.messageStats.responses_received || 0}</div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      this.logger.info('Shutting down MCP Manager...');
      
      const shutdownPromises = Array.from(this.connections.keys())
        .map(serverId => this.stopServer(serverId));
      
      await Promise.all(shutdownPromises);
      this.logger.info('All MCP servers stopped');
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }

  /**
   * Stop all MCP servers
   */
  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.connections.keys())
      .map(serverId => this.stopServer(serverId));
    
    await Promise.all(shutdownPromises);
    this.connections.clear();
    this.isInitialized = false;
  }
}