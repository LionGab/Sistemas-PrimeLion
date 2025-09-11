import { EventEmitter } from 'events';
import { FastifyInstance } from 'fastify';
import { prisma } from '../database/connection';
import { subDays, subHours } from 'date-fns';

/**
 * AlertManager - Sistema de alertas e notificações em tempo real
 * 
 * IMPORTANT: Monitora métricas críticas e envia alertas automáticos
 * PROACTIVELY detecta problemas antes que afetem o negócio
 * ULTRATHINK: Sistema defensivo para proteger operação WhatsApp
 */
export class AlertManager extends EventEmitter {
  private server: FastifyInstance;
  private alertsConfig: AlertConfig;
  private activeAlerts: Map<string, ActiveAlert>;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(server: FastifyInstance) {
    super();
    this.server = server;
    this.activeAlerts = new Map();
    this.alertsConfig = this.getDefaultConfig();
    this.setupEventListeners();
  }

  /**
   * Inicializar sistema de monitoramento
   */
  async initialize() {
    this.server.log.info('🚨 Inicializando AlertManager...');
    
    // Monitoramento contínuo a cada 60 segundos
    this.monitoringInterval = setInterval(async () => {
      await this.runMonitoringCycle();
    }, 60000);

    // Verificação inicial
    await this.runMonitoringCycle();
    
    this.server.log.info('✅ AlertManager inicializado com sucesso');
  }

  /**
   * Parar sistema de monitoramento
   */
  async shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.server.log.info('🛑 AlertManager desligado');
  }

  /**
   * Ciclo principal de monitoramento
   */
  private async runMonitoringCycle() {
    try {
      await Promise.all([
        this.checkWhatsAppRateLimit(),
        this.checkSystemHealth(),
        this.checkMemberResponseRates(),
        this.checkReactivationGoals(),
        this.checkMessageDeliveryRate(),
        this.checkDatabasePerformance()
      ]);
    } catch (error) {
      this.server.log.error('Erro no ciclo de monitoramento:', error);
    }
  }

  /**
   * Verificar rate limit do WhatsApp
   */
  private async checkWhatsAppRateLimit() {
    const agora = new Date();
    const umaHoraAtras = subHours(agora, 1);

    const mensagensUltimaHora = await prisma.mensagem.count({
      where: {
        criadoEm: {
          gte: umaHoraAtras,
          lte: agora
        }
      }
    });

    const limite = this.alertsConfig.whatsapp.maxMessagesPerHour;
    const percentual = (mensagensUltimaHora / limite) * 100;

    // Alert de Warning aos 80%
    if (percentual >= 80 && percentual < 95) {
      await this.createAlert({
        id: 'rate_limit_warning',
        type: 'WARNING',
        title: 'Rate Limit Warning',
        message: `${mensagensUltimaHora}/${limite} mensagens enviadas na última hora (${Math.round(percentual)}%)`,
        priority: 'HIGH',
        data: {
          messagesCount: mensagensUltimaHora,
          limit: limite,
          percentage: percentual
        }
      });
    }

    // Alert Crítico aos 95%
    if (percentual >= 95) {
      await this.createAlert({
        id: 'rate_limit_critical',
        type: 'CRITICAL',
        title: 'Rate Limit Critical',
        message: `CRÍTICO: ${mensagensUltimaHora}/${limite} mensagens! Risco de suspensão WhatsApp`,
        priority: 'CRITICAL',
        data: {
          messagesCount: mensagensUltimaHora,
          limit: limite,
          percentage: percentual
        }
      });

      // Pausar automação se necessário
      await this.pauseAutomation('Rate limit crítico atingido');
    }

    // Resolver alert se voltou ao normal
    if (percentual < 70) {
      await this.resolveAlert('rate_limit_warning');
      await this.resolveAlert('rate_limit_critical');
    }
  }

  /**
   * Verificar saúde geral do sistema
   */
  private async checkSystemHealth() {
    try {
      // Verificar conexão com banco de dados
      await prisma.$queryRaw`SELECT 1`;

      // Verificar uso de memória (simulado)
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      if (memoryPercentage > 90) {
        await this.createAlert({
          id: 'high_memory_usage',
          type: 'WARNING',
          title: 'Alto Uso de Memória',
          message: `Uso de memória: ${Math.round(memoryPercentage)}%`,
          priority: 'MEDIUM',
          data: { memoryPercentage }
        });
      }

      // Verificar espaço em disco (simulado)
      // Em produção, usar fs.statSync para verificar espaço real
      const diskUsage = Math.random() * 100; // Simulado
      if (diskUsage > 85) {
        await this.createAlert({
          id: 'low_disk_space',
          type: 'WARNING',
          title: 'Pouco Espaço em Disco',
          message: `Espaço em disco: ${Math.round(diskUsage)}% usado`,
          priority: 'HIGH',
          data: { diskUsage }
        });
      }

    } catch (error) {
      await this.createAlert({
        id: 'database_connection_error',
        type: 'CRITICAL',
        title: 'Erro de Conexão com Banco',
        message: 'Falha na conexão com o banco de dados',
        priority: 'CRITICAL',
        data: { error: error.message }
      });
    }
  }

  /**
   * Verificar taxa de resposta dos membros
   */
  private async checkMemberResponseRates() {
    const seteDiasAtras = subDays(new Date(), 7);

    const [totalMensagens, mensagensRespondidas] = await Promise.all([
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: seteDiasAtras },
          tipo: 'REATIVACAO'
        }
      }),
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: seteDiasAtras },
          tipo: 'REATIVACAO',
          respondida: true
        }
      })
    ]);

    const taxaResposta = totalMensagens > 0 ? (mensagensRespondidas / totalMensagens) * 100 : 0;

    // Alert se taxa de resposta muito baixa
    if (taxaResposta < this.alertsConfig.members.minResponseRate && totalMensagens > 10) {
      await this.createAlert({
        id: 'low_response_rate',
        type: 'WARNING',
        title: 'Taxa de Resposta Baixa',
        message: `Taxa de resposta: ${Math.round(taxaResposta)}% (últimos 7 dias)`,
        priority: 'MEDIUM',
        data: {
          responseRate: taxaResposta,
          totalMessages: totalMensagens,
          responses: mensagensRespondidas
        }
      });
    }

    // Verificar membros sem resposta há muito tempo
    const membrosSemResposta = await prisma.membro.count({
      where: {
        status: 'INATIVO',
        mensagens: {
          some: {
            respondida: false,
            criadoEm: {
              lte: subDays(new Date(), 14) // 14 dias sem resposta
            }
          }
        }
      }
    });

    if (membrosSemResposta > 5) {
      await this.createAlert({
        id: 'members_no_response',
        type: 'INFO',
        title: 'Membros Sem Resposta',
        message: `${membrosSemResposta} membros sem resposta há mais de 14 dias`,
        priority: 'LOW',
        data: { count: membrosSemResposta }
      });
    }
  }

  /**
   * Verificar metas de reativação
   */
  private async checkReactivationGoals() {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const reativacoesMes = await prisma.membro.count({
      where: {
        status: 'ATIVO',
        reativadoEm: {
          gte: inicioMes
        }
      }
    });

    const metaMensal = this.alertsConfig.goals.monthlyReactivations;
    const percentualMeta = (reativacoesMes / metaMensal) * 100;

    // Alert positivo se meta atingida
    if (reativacoesMes >= metaMensal && !this.activeAlerts.has('goal_achieved')) {
      await this.createAlert({
        id: 'goal_achieved',
        type: 'SUCCESS',
        title: 'Meta Atingida! 🎉',
        message: `${reativacoesMes} reativações este mês (+${Math.round(percentualMeta - 100)}% da meta)`,
        priority: 'LOW',
        data: {
          reactivations: reativacoesMes,
          goal: metaMensal,
          percentage: percentualMeta
        }
      });
    }

    // Alert se muito abaixo da meta no final do mês
    const diaDoMes = new Date().getDate();
    const totalDiasMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const percentualMesDecorrido = (diaDoMes / totalDiasMes) * 100;

    if (percentualMesDecorrido > 75 && percentualMeta < 50) {
      await this.createAlert({
        id: 'goal_behind_schedule',
        type: 'WARNING',
        title: 'Meta Atrasada',
        message: `Apenas ${Math.round(percentualMeta)}% da meta mensal atingida`,
        priority: 'MEDIUM',
        data: {
          reactivations: reativacoesMes,
          goal: metaMensal,
          percentage: percentualMeta
        }
      });
    }
  }

  /**
   * Verificar taxa de entrega das mensagens
   */
  private async checkMessageDeliveryRate() {
    const umaHoraAtras = subHours(new Date(), 1);

    const [totalEnviadas, totalEntregues, totalFalharam] = await Promise.all([
      prisma.mensagem.count({
        where: { criadoEm: { gte: umaHoraAtras } }
      }),
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: umaHoraAtras },
          status: 'ENTREGUE'
        }
      }),
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: umaHoraAtras },
          status: 'FALHOU'
        }
      })
    ]);

    if (totalEnviadas > 0) {
      const taxaEntrega = (totalEntregues / totalEnviadas) * 100;
      const taxaFalha = (totalFalharam / totalEnviadas) * 100;

      // Alert se taxa de entrega muito baixa
      if (taxaEntrega < this.alertsConfig.delivery.minDeliveryRate) {
        await this.createAlert({
          id: 'low_delivery_rate',
          type: 'WARNING',
          title: 'Taxa de Entrega Baixa',
          message: `Taxa de entrega: ${Math.round(taxaEntrega)}% (última hora)`,
          priority: 'HIGH',
          data: {
            deliveryRate: taxaEntrega,
            total: totalEnviadas,
            delivered: totalEntregues,
            failed: totalFalharam
          }
        });
      }

      // Alert se muitas falhas
      if (taxaFalha > 10) {
        await this.createAlert({
          id: 'high_failure_rate',
          type: 'CRITICAL',
          title: 'Alta Taxa de Falhas',
          message: `${Math.round(taxaFalha)}% das mensagens falharam`,
          priority: 'CRITICAL',
          data: {
            failureRate: taxaFalha,
            total: totalEnviadas,
            failed: totalFalharam
          }
        });
      }
    }
  }

  /**
   * Verificar performance do banco de dados
   */
  private async checkDatabasePerformance() {
    const start = Date.now();
    
    try {
      // Query simples para medir latência
      await prisma.membro.findFirst({
        where: { id: 'test-performance' }
      });
      
      const latency = Date.now() - start;

      if (latency > this.alertsConfig.database.maxLatencyMs) {
        await this.createAlert({
          id: 'high_database_latency',
          type: 'WARNING',
          title: 'Alta Latência do Banco',
          message: `Latência: ${latency}ms (limite: ${this.alertsConfig.database.maxLatencyMs}ms)`,
          priority: 'MEDIUM',
          data: { latency }
        });
      }
    } catch (error) {
      await this.createAlert({
        id: 'database_error',
        type: 'CRITICAL',
        title: 'Erro no Banco de Dados',
        message: 'Falha ao executar query no banco',
        priority: 'CRITICAL',
        data: { error: error.message }
      });
    }
  }

  /**
   * Criar novo alert
   */
  private async createAlert(alertData: CreateAlertData) {
    try {
      // Evitar spam do mesmo alert
      if (this.activeAlerts.has(alertData.id)) {
        const existingAlert = this.activeAlerts.get(alertData.id)!;
        
        // Atualizar apenas se mudou a severidade
        if (existingAlert.type !== alertData.type) {
          existingAlert.type = alertData.type;
          existingAlert.updatedAt = new Date();
          await this.persistAlert(existingAlert);
        }
        return;
      }

      const alert: ActiveAlert = {
        id: alertData.id,
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        priority: alertData.priority,
        data: alertData.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolved: false
      };

      this.activeAlerts.set(alertData.id, alert);
      await this.persistAlert(alert);

      // Emitir evento para notificações em tempo real
      this.emit('alert:created', alert);

      // Enviar notificações baseado na prioridade
      await this.sendNotifications(alert);

      this.server.log.warn(`🚨 Alert criado: ${alert.title} - ${alert.message}`);

    } catch (error) {
      this.server.log.error('Erro ao criar alert:', error);
    }
  }

  /**
   * Resolver alert existente
   */
  private async resolveAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.updatedAt = new Date();

      await this.persistAlert(alert);
      this.activeAlerts.delete(alertId);

      this.emit('alert:resolved', alert);
      this.server.log.info(`✅ Alert resolvido: ${alertId}`);
    }
  }

  /**
   * Persistir alert no banco de dados
   */
  private async persistAlert(alert: ActiveAlert) {
    await prisma.alerta.upsert({
      where: { id: alert.id },
      update: {
        tipo: alert.type,
        titulo: alert.title,
        mensagem: alert.message,
        prioridade: alert.priority,
        dados: alert.data,
        resolvido: alert.resolved,
        resolvidoEm: alert.resolvedAt,
        atualizadoEm: alert.updatedAt
      },
      create: {
        id: alert.id,
        tipo: alert.type,
        titulo: alert.title,
        mensagem: alert.message,
        prioridade: alert.priority,
        dados: alert.data,
        resolvido: alert.resolved,
        criadoEm: alert.createdAt
      }
    });
  }

  /**
   * Enviar notificações baseado na prioridade
   */
  private async sendNotifications(alert: ActiveAlert) {
    try {
      // Notificação crítica: WhatsApp + Email + Slack
      if (alert.priority === 'CRITICAL') {
        await Promise.all([
          this.sendWhatsAppNotification(alert),
          this.sendEmailNotification(alert),
          this.sendSlackNotification(alert)
        ]);
      }
      
      // Notificação alta: Email + Slack
      else if (alert.priority === 'HIGH') {
        await Promise.all([
          this.sendEmailNotification(alert),
          this.sendSlackNotification(alert)
        ]);
      }
      
      // Notificação média: Slack
      else if (alert.priority === 'MEDIUM') {
        await this.sendSlackNotification(alert);
      }

      // Notificação baixa: apenas dashboard (já tratado pelo evento)

    } catch (error) {
      this.server.log.error('Erro ao enviar notificações:', error);
    }
  }

  /**
   * Pausar automação em emergência
   */
  private async pauseAutomation(reason: string) {
    try {
      // Desativar todas as automações ativas
      await prisma.automacao.updateMany({
        where: { ativo: true },
        data: { 
          ativo: false,
          pausadaEm: new Date(),
          motivoPausa: reason
        }
      });

      this.server.log.warn(`⏸️ Automação pausada: ${reason}`);
      
      // Notificar administradores
      await this.createAlert({
        id: 'automation_paused',
        type: 'CRITICAL',
        title: 'Automação Pausada',
        message: `Automação pausada automaticamente: ${reason}`,
        priority: 'CRITICAL',
        data: { reason }
      });

    } catch (error) {
      this.server.log.error('Erro ao pausar automação:', error);
    }
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners() {
    // Listener para novos membros reativados
    this.on('member:reactivated', async (memberData) => {
      await this.createAlert({
        id: `member_reactivated_${Date.now()}`,
        type: 'SUCCESS',
        title: 'Membro Reativado! 🎉',
        message: `${memberData.nome} reativou sua matrícula`,
        priority: 'LOW',
        data: memberData
      });
    });

    // Listener para respostas recebidas
    this.on('message:received', async (messageData) => {
      if (messageData.tipo === 'REATIVACAO') {
        await this.createAlert({
          id: `response_received_${Date.now()}`,
          type: 'SUCCESS',
          title: 'Resposta Recebida',
          message: `${messageData.membro} respondeu à mensagem de reativação`,
          priority: 'LOW',
          data: messageData
        });
      }
    });
  }

  // Métodos de notificação (implementar conforme necessário)

  private async sendWhatsAppNotification(alert: ActiveAlert) {
    // Implementar notificação via WhatsApp para o dono da academia
    // Por enquanto, apenas log
    this.server.log.info(`📱 WhatsApp: ${alert.title}`);
  }

  private async sendEmailNotification(alert: ActiveAlert) {
    // Implementar notificação por email
    // Por enquanto, apenas log
    this.server.log.info(`📧 Email: ${alert.title}`);
  }

  private async sendSlackNotification(alert: ActiveAlert) {
    // Implementar notificação Slack
    // Por enquanto, apenas log
    this.server.log.info(`💬 Slack: ${alert.title}`);
  }

  /**
   * Obter configuração padrão de alertas
   */
  private getDefaultConfig(): AlertConfig {
    return {
      whatsapp: {
        maxMessagesPerHour: 100,
        warningThreshold: 80,
        criticalThreshold: 95
      },
      members: {
        minResponseRate: 15, // 15% mínimo de taxa de resposta
        maxDaysWithoutResponse: 14
      },
      goals: {
        monthlyReactivations: 20
      },
      delivery: {
        minDeliveryRate: 85 // 85% mínimo de entrega
      },
      database: {
        maxLatencyMs: 500 // 500ms máximo de latência
      }
    };
  }

  /**
   * Obter alertas ativos para o dashboard
   */
  async getActiveAlerts(): Promise<ActiveAlert[]> {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  private getPriorityWeight(priority: string): number {
    const weights = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return weights[priority] || 0;
  }
}

// Interfaces e tipos

interface AlertConfig {
  whatsapp: {
    maxMessagesPerHour: number;
    warningThreshold: number;
    criticalThreshold: number;
  };
  members: {
    minResponseRate: number;
    maxDaysWithoutResponse: number;
  };
  goals: {
    monthlyReactivations: number;
  };
  delivery: {
    minDeliveryRate: number;
  };
  database: {
    maxLatencyMs: number;
  };
}

interface CreateAlertData {
  id: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data?: any;
}

interface ActiveAlert {
  id: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data?: any;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}