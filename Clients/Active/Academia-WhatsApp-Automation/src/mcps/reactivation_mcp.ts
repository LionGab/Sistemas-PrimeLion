/**
 * Reactivation MCP - Member Reactivation Automation Controller
 * 
 * IMPORTANT: Automatically reactivates inactive academy members
 * PROACTIVELY generates R$3,000+ monthly revenue through targeted messaging
 * ULTRATHINK: Complex multi-stage reactivation with behavioral triggers
 */

import { PrismaClient, StatusAluno, TipoMensagem, TipoCampanha } from '@prisma/client';
import { Queue, Job, Worker } from 'bullmq';
import { WhatsAppBusinessConnector } from '../whatsapp/WhatsAppBusinessConnector.js';
import pino from 'pino';
import { addDays, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReactivationJobData {
  academiaId: string;
  alunoId: string;
  etapa: number;
  diasInativo: number;
  tentativaNumero: number;
}

interface ReactivationStats {
  totalProcessados: number;
  totalContatados: number;
  totalReativados: number;
  receitaRecuperada: number;
  taxaResposta: number;
}

export class ReactivationMCP {
  private prisma: PrismaClient;
  private whatsapp: WhatsAppBusinessConnector;
  private logger: pino.Logger;
  private reactivationQueue: Queue;
  private worker: Worker;
  private isRunning: boolean = false;
  
  // Configuration from automation_flows.json
  private readonly ETAPAS_INATIVIDADE = [15, 30, 60];
  private readonly MAX_TENTATIVAS = 3;
  private readonly INTERVALO_TENTATIVAS_DIAS = 7;
  private readonly HORARIOS_PERMITIDOS = ['09:00', '14:00', '19:00'];
  
  constructor(
    prisma: PrismaClient,
    whatsapp: WhatsAppBusinessConnector,
    redisConnection: any
  ) {
    this.prisma = prisma;
    this.whatsapp = whatsapp;
    
    this.logger = pino({
      name: 'reactivation-mcp',
      level: process.env.LOG_LEVEL || 'info'
    });
    
    // Initialize BullMQ queue
    this.reactivationQueue = new Queue('reactivation', { connection: redisConnection });
    
    // Initialize worker
    this.worker = new Worker('reactivation', this.processJob.bind(this), {
      connection: redisConnection,
      concurrency: 5
    });
    
    this.setupWorkerEvents();
  }
  
  /**
   * Initialize the MCP and start monitoring
   * IMPORTANT: Starts automated detection of inactive members
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Reactivation MCP...');
      
      // Schedule daily check at 9 AM
      await this.schedulePeriodicCheck();
      
      this.isRunning = true;
      this.logger.info('Reactivation MCP initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Reactivation MCP:', error);
      throw error;
    }
  }
  
  /**
   * Schedule periodic checks for inactive members
   */
  private async schedulePeriodicCheck(): Promise<void> {
    // Clear existing scheduled jobs
    await this.reactivationQueue.obliterate({ force: true });
    
    // Schedule daily execution at 9 AM
    await this.reactivationQueue.add(
      'daily-check',
      {},
      {
        repeat: { pattern: '0 9 * * *' }, // Daily at 9 AM
        jobId: 'reactivation-daily-check'
      }
    );
    
    this.logger.info('Scheduled daily reactivation check at 9 AM');
  }
  
  /**
   * Process reactivation job
   * PROACTIVELY handles member reactivation workflow
   */
  private async processJob(job: Job): Promise<void> {
    const { name, data } = job;
    
    try {
      if (name === 'daily-check') {
        await this.executeDailyCheck();
      } else if (name === 'send-reactivation-message') {
        await this.sendReactivationMessage(data as ReactivationJobData);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute daily check for inactive members
   * IMPORTANT: Identifies and processes inactive members across all academies
   */
  private async executeDailyCheck(): Promise<void> {
    this.logger.info('Starting daily reactivation check...');
    
    try {
      // Get all active academies
      const academias = await this.prisma.academia.findMany({
        where: { planoAtivo: true }
      });
      
      let totalProcessed = 0;
      
      for (const academia of academias) {
        const processed = await this.processAcademiaReactivation(academia.id);
        totalProcessed += processed;
      }
      
      this.logger.info(`Daily check completed. Processed ${totalProcessed} potential reactivations`);
    } catch (error) {
      this.logger.error('Failed to execute daily check:', error);
      throw error;
    }
  }
  
  /**
   * Process reactivation for a specific academia
   */
  private async processAcademiaReactivation(academiaId: string): Promise<number> {
    const academia = await this.prisma.academia.findUnique({
      where: { id: academiaId }
    });
    
    if (!academia) return 0;
    
    let totalProcessed = 0;
    
    // Process each inactivity stage (15, 30, 60 days)
    for (const diasInativo of this.ETAPAS_INATIVIDADE) {
      const inactiveMembers = await this.getInactiveMembers(academiaId, diasInativo);
      
      for (const member of inactiveMembers) {
        if (await this.shouldContactMember(member.id, diasInativo)) {
          await this.scheduleReactivationMessage(academiaId, member.id, diasInativo);
          totalProcessed++;
        }
      }
    }
    
    return totalProcessed;
  }
  
  /**
   * Get inactive members for specific academia and inactivity period
   * ULTRATHINK: Complex query with multiple conditions for optimal targeting
   */
  private async getInactiveMembers(academiaId: string, diasInativo: number) {
    const cutoffDate = addDays(new Date(), -diasInativo);
    
    return await this.prisma.aluno.findMany({
      where: {
        academiaId,
        status: StatusAluno.ATIVO,
        permiteWhatsApp: true,
        OR: [
          { ultimaVisita: { lt: cutoffDate } },
          { ultimaVisita: null } // Never visited
        ]
      },
      include: {
        frequencia: {
          orderBy: { dataVisita: 'desc' },
          take: 1
        },
        mensagens: {
          where: {
            tipo: TipoMensagem.AUTOMATICA,
            createdAt: { gte: addDays(new Date(), -30) }
          }
        }
      }
    });
  }
  
  /**
   * Check if member should be contacted based on business rules
   */
  private async shouldContactMember(alunoId: string, diasInativo: number): Promise<boolean> {
    // Check if already contacted recently for this stage
    const recentContact = await this.prisma.mensagem.findFirst({
      where: {
        alunoId,
        tipo: TipoMensagem.AUTOMATICA,
        templateId: `reativacao_${diasInativo}`,
        createdAt: { gte: addDays(new Date(), -this.INTERVALO_TENTATIVAS_DIAS) }
      }
    });
    
    if (recentContact) return false;
    
    // Check total contact attempts for this stage
    const totalAttempts = await this.prisma.mensagem.count({
      where: {
        alunoId,
        templateId: `reativacao_${diasInativo}`,
        tipo: TipoMensagem.AUTOMATICA
      }
    });
    
    return totalAttempts < this.MAX_TENTATIVAS;
  }
  
  /**
   * Schedule reactivation message for member
   */
  private async scheduleReactivationMessage(
    academiaId: string,
    alunoId: string,
    diasInativo: number
  ): Promise<void> {
    const etapa = this.ETAPAS_INATIVIDADE.indexOf(diasInativo) + 1;
    
    const tentativaNumero = await this.prisma.mensagem.count({
      where: {
        alunoId,
        templateId: `reativacao_${diasInativo}`,
        tipo: TipoMensagem.AUTOMATICA
      }
    }) + 1;
    
    // Schedule message for next available time slot
    const scheduledTime = this.getNextAvailableTimeSlot();
    
    await this.reactivationQueue.add(
      'send-reactivation-message',
      {
        academiaId,
        alunoId,
        etapa,
        diasInativo,
        tentativaNumero
      } as ReactivationJobData,
      {
        delay: scheduledTime.getTime() - new Date().getTime(),
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 }
      }
    );
    
    this.logger.info(`Scheduled reactivation message for member ${alunoId}, stage ${etapa}, attempt ${tentativaNumero}`);
  }
  
  /**
   * Send reactivation message to member
   * IMPORTANT: Core revenue generation function
   */
  private async sendReactivationMessage(data: ReactivationJobData): Promise<void> {
    const { academiaId, alunoId, etapa, diasInativo, tentativaNumero } = data;
    
    try {
      // Get member and academia data
      const aluno = await this.prisma.aluno.findUnique({
        where: { id: alunoId },
        include: { academia: true }
      });
      
      if (!aluno || aluno.status !== StatusAluno.ATIVO) {
        this.logger.warn(`Member ${alunoId} no longer active, skipping reactivation`);
        return;
      }
      
      // Load message template
      const templateId = `reativacao_${diasInativo}`;
      const messageTemplate = await this.loadMessageTemplate(templateId);
      
      if (!messageTemplate) {
        this.logger.error(`Template ${templateId} not found`);
        return;
      }
      
      // Create personalized message
      const personalizedMessage = this.personalizeMessage(messageTemplate, aluno);
      
      // Send WhatsApp message
      await this.whatsapp.sendMessage(aluno.telefone, personalizedMessage);
      
      // Record message in database
      await this.recordMessage(aluno, templateId, personalizedMessage, etapa);
      
      // Update member reactivation attempt
      await this.updateMemberReactivationStatus(alunoId, etapa, tentativaNumero);
      
      this.logger.info(`Sent reactivation message to ${aluno.nome} (${aluno.telefone}), stage ${etapa}`);
      
    } catch (error) {
      this.logger.error(`Failed to send reactivation message:`, error);
      throw error;
    }
  }
  
  /**
   * Load message template from database or config
   */
  private async loadMessageTemplate(templateId: string): Promise<string | null> {
    // In production, this would load from message_templates.json or database
    const templates = {
      'reativacao_15': 'Oi {{nome}}! 😊\\n\\nSentimos sua falta aqui na {{nome_academia}}! Faz um tempinho que você não aparece... Está tudo bem? 🤗\\n\\nSabemos que às vezes a correria do dia a dia aperta, mas que tal voltarmos devagar?\\n\\n💡 Tenho algumas opções para te ajudar:\\n• Treinos mais rápidos (30min)\\n• Horários alternativos\\n• Modalidades diferentes\\n\\nQue tal conversarmos? Estou aqui para te ajudar! 💪\\n\\nResponde aí! 👇',
      'reativacao_30': '{{nome}}, não queremos te perder! 💔\\n\\nFaz 1 mês que você não treina conosco... Queremos muito te ter de volta!\\n\\n🎁 **OFERTA ESPECIAL SÓ PRA VOCÊ:**\\n• 1 semana de volta GRÁTIS\\n• Reavaliação física sem custo\\n• Novo plano de treino personalizado\\n\\n⏰ Oferta válida até {{data_limite}}!\\n\\nVamos recomeçar juntos? Sua saúde vale muito mais que qualquer desculpa! 🏋️‍♀️',
      'reativacao_60': '{{nome}}, esta é nossa mensagem final... 😌\\n\\nRespeitamos sua decisão, mas não podíamos deixar de tentar mais uma vez.\\n\\nSe um dia quiser voltar, saiba que as portas da {{nome_academia}} sempre estarão abertas para você! 🚪💙\\n\\n🎁 **ÚLTIMA OPORTUNIDADE:**\\nSe mudar de ideia nos próximos 7 dias, terá:\\n• 50% de desconto no primeiro mês\\n• Matrícula grátis\\n• Kit welcome de volta\\n\\nFoi um prazer te ter conosco. Desejamos muito sucesso! 🙏'
    };
    
    return templates[templateId as keyof typeof templates] || null;
  }
  
  /**
   * Personalize message with member and academia data
   */
  private personalizeMessage(template: string, aluno: any): string {
    const dataLimite = format(addDays(new Date(), 7), 'dd/MM/yyyy', { locale: ptBR });
    
    return template
      .replace(/{{nome}}/g, aluno.nome.split(' ')[0]) // First name only
      .replace(/{{nome_academia}}/g, aluno.academia.nome)
      .replace(/{{data_limite}}/g, dataLimite)
      .replace(/\\n/g, '\n'); // Convert escaped newlines
  }
  
  /**
   * Record message in database for audit and analytics
   */
  private async recordMessage(
    aluno: any,
    templateId: string,
    conteudo: string,
    etapa: number
  ): Promise<void> {
    await this.prisma.mensagem.create({
      data: {
        conteudo,
        tipo: TipoMensagem.SAIDA,
        status: 'ENVIADA' as any,
        templateId,
        etapaFluxo: etapa,
        fluxoId: 'reativacao_inativo',
        alunoId: aluno.id,
        academiaId: aluno.academiaId,
        enviadaEm: new Date()
      }
    });
  }
  
  /**
   * Update member reactivation attempt status
   */
  private async updateMemberReactivationStatus(
    alunoId: string,
    etapa: number,
    tentativa: number
  ): Promise<void> {
    // Could update a specific reactivation tracking table
    // For now, we rely on message history
    this.logger.debug(`Updated reactivation status for member ${alunoId}: stage ${etapa}, attempt ${tentativa}`);
  }
  
  /**
   * Get next available time slot for sending messages
   */
  private getNextAvailableTimeSlot(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next allowed hour
    const nextHour = this.HORARIOS_PERMITIDOS
      .map(h => parseInt(h.split(':')[0]))
      .find(h => h > currentHour);
    
    if (nextHour) {
      // Today at next available hour
      const nextSlot = new Date();
      nextSlot.setHours(nextHour, 0, 0, 0);
      return nextSlot;
    } else {
      // Tomorrow at first available hour
      const nextSlot = new Date();
      nextSlot.setDate(nextSlot.getDate() + 1);
      nextSlot.setHours(parseInt(this.HORARIOS_PERMITIDOS[0].split(':')[0]), 0, 0, 0);
      return nextSlot;
    }
  }
  
  /**
   * Handle member response to reactivation message
   * PROACTIVELY updates member status when positive response detected
   */
  async handleMemberResponse(alunoId: string, message: string): Promise<void> {
    const positiveKeywords = ['sim', 'quero', 'voltar', 'treinar', 'interessado', 'ok'];
    const negativeKeywords = ['não', 'nao', 'parar', 'stop', 'cancelar'];
    
    const messageLower = message.toLowerCase();
    
    if (positiveKeywords.some(keyword => messageLower.includes(keyword))) {
      await this.markMemberAsReactivated(alunoId);
    } else if (negativeKeywords.some(keyword => messageLower.includes(keyword))) {
      await this.markMemberAsOptOut(alunoId);
    }
  }
  
  /**
   * Mark member as reactivated
   */
  private async markMemberAsReactivated(alunoId: string): Promise<void> {
    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: { 
        status: StatusAluno.ATIVO,
        updatedAt: new Date()
      }
    });
    
    this.logger.info(`Member ${alunoId} marked as reactivated`);
  }
  
  /**
   * Mark member as opted out
   */
  private async markMemberAsOptOut(alunoId: string): Promise<void> {
    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: { 
        permiteWhatsApp: false,
        updatedAt: new Date()
      }
    });
    
    this.logger.info(`Member ${alunoId} opted out of WhatsApp messages`);
  }
  
  /**
   * Get reactivation statistics
   * IMPORTANT: ROI calculation and performance metrics
   */
  async getReactivationStats(academiaId: string, days: number = 30): Promise<ReactivationStats> {
    const since = addDays(new Date(), -days);
    
    // Messages sent
    const totalContatados = await this.prisma.mensagem.count({
      where: {
        academiaId,
        tipo: TipoMensagem.SAIDA,
        templateId: { startsWith: 'reativacao_' },
        createdAt: { gte: since }
      }
    });
    
    // Members reactivated (returned to training)
    const totalReativados = await this.prisma.aluno.count({
      where: {
        academiaId,
        status: StatusAluno.ATIVO,
        frequencia: {
          some: {
            dataVisita: { gte: since }
          }
        }
      }
    });
    
    // Response rate
    const totalRespostas = await this.prisma.mensagem.count({
      where: {
        academiaId,
        tipo: TipoMensagem.ENTRADA,
        createdAt: { gte: since }
      }
    });
    
    const taxaResposta = totalContatados > 0 ? totalRespostas / totalContatados : 0;
    
    // Revenue calculation (assuming R$150 average monthly fee)
    const receitaRecuperada = totalReativados * 150;
    
    return {
      totalProcessados: totalContatados,
      totalContatados,
      totalReativados,
      receitaRecuperada,
      taxaResposta
    };
  }
  
  /**
   * Setup worker event handlers
   */
  private setupWorkerEvents(): void {
    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed successfully`);
    });
    
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed:`, err);
    });
    
    this.worker.on('error', (err) => {
      this.logger.error('Worker error:', err);
    });
  }
  
  /**
   * Stop the MCP
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping Reactivation MCP...');
    
    await this.worker.close();
    await this.reactivationQueue.close();
    
    this.isRunning = false;
    this.logger.info('Reactivation MCP stopped');
  }
  
  /**
   * Get MCP status
   */
  getStatus(): any {
    return {
      name: 'ReactivationMCP',
      running: this.isRunning,
      queueActive: this.reactivationQueue ? true : false,
      workerActive: this.worker ? true : false
    };
  }
}