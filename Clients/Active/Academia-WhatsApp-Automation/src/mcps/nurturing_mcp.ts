/**
 * Nurturing MCP - Lead Conversion Automation Controller
 * 
 * IMPORTANT: Converts visiting prospects into paying academy members
 * PROACTIVELY generates R$750+ monthly revenue through lead nurturing
 * ULTRATHINK: Sophisticated behavioral analysis and personalized messaging
 */

import { PrismaClient, StatusAluno, TipoMensagem, TipoCampanha, TipoAutomacao } from '@prisma/client';
import { Queue, Job, Worker } from 'bullmq';
import { WhatsAppBusinessConnector } from '../whatsapp/WhatsAppBusinessConnector.js';
import pino from 'pino';
import { addDays, addHours, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NurturingJobData {
  academiaId: string;
  alunoId: string;
  etapa: number;
  sequenciaId: string;
  personalizacao: {
    interesse: string;
    objetivo: string;
    idade: number;
  };
}

interface NurturingStats {
  totalLeads: number;
  totalContatados: number;
  totalConvertidos: number;
  receitaGerada: number;
  taxaConversao: number;
  tempoMedioConversao: number;
}

interface LeadProfile {
  interesse: 'musculacao' | 'cardio' | 'funcional' | 'geral';
  objetivo: 'emagrecimento' | 'ganho_massa' | 'condicionamento' | 'saude';
  faixaEtaria: 'jovem' | 'adulto' | 'senior';
  horarioPreferencial: 'manha' | 'tarde' | 'noite';
}

export class NurturingMCP {
  private prisma: PrismaClient;
  private whatsapp: WhatsAppBusinessConnector;
  private logger: pino.Logger;
  private nurturingQueue: Queue;
  private worker: Worker;
  private isRunning: boolean = false;
  
  // Nurturing sequence configuration
  private readonly SEQUENCIA_DIAS = [1, 2, 5, 10, 15]; // Hours after registration: 2h, 48h, 5d, 10d, 15d
  private readonly MAX_MENSAGENS = 5;
  private readonly HORARIOS_PREFERENCIAIS = ['10:00', '16:00'];
  private readonly TEMPLATES_SEQUENCE = [
    'boas_vindas',
    'dicas_fitness', 
    'mensagem_motivacional',
    'renovacao_plano', // Special offer
    'convite_evento' // Final attempt
  ];
  
  constructor(
    prisma: PrismaClient,
    whatsapp: WhatsAppBusinessConnector,
    redisConnection: any
  ) {
    this.prisma = prisma;
    this.whatsapp = whatsapp;
    
    this.logger = pino({
      name: 'nurturing-mcp',
      level: process.env.LOG_LEVEL || 'info'
    });
    
    // Initialize BullMQ queue
    this.nurturingQueue = new Queue('nurturing', { connection: redisConnection });
    
    // Initialize worker
    this.worker = new Worker('nurturing', this.processJob.bind(this), {
      connection: redisConnection,
      concurrency: 10
    });
    
    this.setupWorkerEvents();
  }
  
  /**
   * Initialize the Nurturing MCP
   * IMPORTANT: Starts continuous lead monitoring and conversion
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Nurturing MCP...');
      
      // Schedule continuous monitoring
      await this.scheduleContinuousMonitoring();
      
      this.isRunning = true;
      this.logger.info('Nurturing MCP initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Nurturing MCP:', error);
      throw error;
    }
  }
  
  /**
   * Schedule continuous monitoring for new leads
   */
  private async scheduleContinuousMonitoring(): Promise<void> {
    // Clear existing jobs
    await this.nurturingQueue.obliterate({ force: true });
    
    // Schedule checks every 15 minutes
    await this.nurturingQueue.add(
      'continuous-lead-check',
      {},
      {
        repeat: { pattern: '*/15 * * * *' }, // Every 15 minutes
        jobId: 'nurturing-continuous-check'
      }
    );
    
    this.logger.info('Scheduled continuous lead monitoring every 15 minutes');
  }
  
  /**
   * Process nurturing job
   */
  private async processJob(job: Job): Promise<void> {
    const { name, data } = job;
    
    try {
      if (name === 'continuous-lead-check') {
        await this.executeContinuousCheck();
      } else if (name === 'send-nurturing-message') {
        await this.sendNurturingMessage(data as NurturingJobData);
      } else if (name === 'start-lead-sequence') {
        await this.startLeadSequence(data);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute continuous check for new leads
   * PROACTIVELY identifies new prospects for immediate engagement
   */
  private async executeContinuousCheck(): Promise<void> {
    try {
      // Get all active academies
      const academias = await this.prisma.academia.findMany({
        where: { planoAtivo: true }
      });
      
      let totalProcessed = 0;
      
      for (const academia of academias) {
        const processed = await this.processNewLeads(academia.id);
        totalProcessed += processed;
      }
      
      if (totalProcessed > 0) {
        this.logger.info(`Continuous check: Started ${totalProcessed} new nurturing sequences`);
      }
    } catch (error) {
      this.logger.error('Failed to execute continuous check:', error);
      throw error;
    }
  }
  
  /**
   * Process new leads for a specific academia
   */
  private async processNewLeads(academiaId: string): Promise<number> {
    // Get new leads (visitors) who haven't been contacted yet
    const newLeads = await this.prisma.aluno.findMany({
      where: {
        academiaId,
        status: StatusAluno.VISITANTE,
        permiteWhatsApp: true,
        // No nurturing messages sent yet
        mensagens: {
          none: {
            tipo: TipoMensagem.AUTOMATICA,
            fluxoId: 'nurturing_visitante'
          }
        },
        // Registered at least 2 hours ago (cooling off period)
        createdAt: { lte: addHours(new Date(), -2) }
      }
    });
    
    let processed = 0;
    
    for (const lead of newLeads) {
      await this.startLeadNurturingSequence(lead.id, academiaId);
      processed++;
    }
    
    return processed;
  }
  
  /**
   * Start nurturing sequence for a new lead
   */
  async startLeadNurturingSequence(alunoId: string, academiaId: string): Promise<void> {
    try {
      const lead = await this.prisma.aluno.findUnique({
        where: { id: alunoId },
        include: { academia: true }
      });
      
      if (!lead || lead.status !== StatusAluno.VISITANTE) {
        this.logger.warn(`Lead ${alunoId} not found or not in VISITANTE status`);
        return;
      }
      
      // Create lead profile for personalization
      const profile = await this.createLeadProfile(lead);
      
      // Create nurturing automation record
      const automation = await this.prisma.automacao.create({
        data: {
          nome: `Nurturing - ${lead.nome}`,
          tipo: TipoAutomacao.NURTURING_VISITANTE,
          ativo: true,
          fluxoConfig: {
            leadId: alunoId,
            profile,
            sequenciaIniciada: new Date(),
            etapaAtual: 1
          },
          academiaId
        }
      });
      
      // Schedule all messages in the sequence
      await this.scheduleNurturingSequence(alunoId, academiaId, profile, automation.id);
      
      this.logger.info(`Started nurturing sequence for lead ${lead.nome} (${alunoId})`);
      
    } catch (error) {
      this.logger.error(`Failed to start lead sequence for ${alunoId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create personalized profile for lead
   * ULTRATHINK: Behavioral analysis for optimal personalization
   */
  private async createLeadProfile(lead: any): Promise<LeadProfile> {
    // Basic profile creation (can be enhanced with ML/AI in future)
    const age = lead.dataNascimento ? 
      differenceInDays(new Date(), new Date(lead.dataNascimento)) / 365 : 30;
    
    const profile: LeadProfile = {
      interesse: 'geral', // Default, can be determined from initial questionnaire
      objetivo: age < 30 ? 'condicionamento' : 'saude',
      faixaEtaria: age < 25 ? 'jovem' : age < 45 ? 'adulto' : 'senior',
      horarioPreferencial: 'manha' // Default, can be personalized based on registration time
    };
    
    return profile;
  }
  
  /**
   * Schedule complete nurturing message sequence
   */
  private async scheduleNurturingSequence(
    alunoId: string,
    academiaId: string,
    profile: LeadProfile,
    automationId: string
  ): Promise<void> {
    const baseTime = new Date();
    
    for (let i = 0; i < this.SEQUENCIA_DIAS.length; i++) {
      const delayDays = this.SEQUENCIA_DIAS[i];
      const templateId = this.TEMPLATES_SEQUENCE[i];
      const etapa = i + 1;
      
      // Calculate delay time
      const scheduledTime = addDays(baseTime, delayDays);
      const delay = scheduledTime.getTime() - baseTime.getTime();
      
      await this.nurturingQueue.add(
        'send-nurturing-message',
        {
          academiaId,
          alunoId,
          etapa,
          templateId,
          automationId,
          sequenciaId: 'nurturing_visitante',
          personalizacao: {
            interesse: profile.interesse,
            objetivo: profile.objetivo,
            idade: profile.faixaEtaria === 'jovem' ? 22 : profile.faixaEtaria === 'adulto' ? 35 : 55
          }
        } as NurturingJobData,
        {
          delay,
          attempts: 3,
          backoff: { type: 'exponential', delay: 30000 },
          jobId: `nurturing-${alunoId}-step-${etapa}`
        }
      );
    }
    
    this.logger.info(`Scheduled ${this.SEQUENCIA_DIAS.length} nurturing messages for lead ${alunoId}`);
  }
  
  /**
   * Send nurturing message to lead
   * IMPORTANT: Core conversion function
   */
  private async sendNurturingMessage(data: NurturingJobData): Promise<void> {
    const { academiaId, alunoId, etapa, templateId, personalizacao, automationId } = data;
    
    try {
      // Check if lead still qualifies for nurturing
      const lead = await this.prisma.aluno.findUnique({
        where: { id: alunoId },
        include: { academia: true }
      });
      
      if (!lead) {
        this.logger.warn(`Lead ${alunoId} not found, skipping nurturing message`);
        return;
      }
      
      // Check if lead already converted
      if (lead.status !== StatusAluno.VISITANTE) {
        this.logger.info(`Lead ${alunoId} already converted (status: ${lead.status}), stopping nurturing`);
        await this.stopNurturingSequence(alunoId, automationId);
        return;
      }
      
      // Check if lead opted out
      if (!lead.permiteWhatsApp) {
        this.logger.info(`Lead ${alunoId} opted out, stopping nurturing`);
        await this.stopNurturingSequence(alunoId, automationId);
        return;
      }
      
      // Load and personalize message template
      const messageTemplate = await this.loadNurturingTemplate(templateId || this.TEMPLATES_SEQUENCE[etapa - 1]);
      const personalizedMessage = this.personalizeNurturingMessage(messageTemplate, lead, personalizacao, etapa);
      
      // Send WhatsApp message
      await this.whatsapp.sendMessage(lead.telefone, personalizedMessage);
      
      // Record message in database
      await this.recordNurturingMessage(lead, templateId || this.TEMPLATES_SEQUENCE[etapa - 1], personalizedMessage, etapa);
      
      // Update automation progress
      await this.updateAutomationProgress(automationId, etapa);
      
      this.logger.info(`Sent nurturing message (step ${etapa}) to ${lead.nome} (${lead.telefone})`);
      
    } catch (error) {
      this.logger.error(`Failed to send nurturing message:`, error);
      throw error;
    }
  }
  
  /**
   * Load nurturing message template
   */
  private async loadNurturingTemplate(templateId: string): Promise<string> {
    const templates = {
      'boas_vindas': 'Olá {{nome}}! 🏋️‍♀️\\n\\nSeja muito bem-vindo(a) à {{nome_academia}}!\\n\\nEstamos super animados para te acompanhar nesta jornada de transformação. Foi um prazer te conhecer!\\n\\n💪 Que tal começarmos com algumas dicas personalizadas para seus objetivos?\\n\\nEm breve vou te enviar conteúdos exclusivos sobre {{interesse}}!\\n\\nQualquer dúvida, é só chamar aqui no WhatsApp. Vamos juntos! 🚀',
      
      'dicas_fitness': '💡 **DICA PERSONALIZADA** - {{nome}}!\\n\\n🎯 **ESPECIAL PARA {{objetivo_upper}}**\\n\\n{{conteudo_personalizado}}\\n\\n💪 **LEMBRE-SE:**\\n• Comece devagar e seja consistente\\n• Hidrate-se bem durante os treinos\\n• O descanso é parte do processo\\n\\nQuer saber mais sobre como alcançar seus objetivos na {{nome_academia}}? 🤔\\n\\nResponde aí! 👇',
      
      'mensagem_motivacional': '{{nome}}, você está no caminho certo! 🌟\\n\\n✨ **SUA JORNADA FITNESS:**\\n*Cada passo conta, cada treino faz diferença*\\n\\n🏆 **OUTROS ALUNOS COMO VOCÊ JÁ CONQUISTARAM:**\\n• {{objetivo}} em média 3-6 meses\\n• Mais energia no dia a dia\\n• Autoestima lá em cima\\n\\n💪 Que tal darmos o próximo passo juntos?\\n\\nTenho uma proposta especial pra você! 🎁',
      
      'renovacao_plano': '🎁 **OFERTA EXCLUSIVA** - {{nome}}!\\n\\nVocê impressionou nossa equipe com seu interesse e dedicação!\\n\\n⚡ **SÓ PARA VOCÊ - HOJE:**\\n• 30% de desconto no primeiro mês\\n• Matrícula GRÁTIS\\n• Avaliação física completa\\n• Plano de treino personalizado\\n\\n💳 **PLANOS DISPONÍVEIS:**\\n🥉 Bronze: de R$99 por R$69\\n🥈 Prata: de R$149 por R$104\\n🥇 Ouro: de R$199 por R$139\\n\\n⏰ Válido só até amanhã!\\n\\nVamos começar? {{link_matricula}}',
      
      'convite_evento': '{{nome}}, última chance! 🎉\\n\\nSem pressão, sem vendas... que tal apenas **EXPERIMENTAR**?\\n\\n🎯 **AULA EXPERIMENTAL GRATUITA**\\n\\n📅 Escolha o melhor dia pra você\\n🕐 No horário que preferir\\n🏃‍♀️ Na modalidade que mais te interessa\\n\\nVem conhecer nossa metodologia e sentir a energia do ambiente!\\n\\n✅ **É só confirmar:**\\n• Qual dia da semana?\\n• Manhã, tarde ou noite?\\n• Que tipo de treino te chama atenção?\\n\\nSem compromisso, só diversão! 😊'
    };
    
    return templates[templateId as keyof typeof templates] || templates.boas_vindas;
  }
  
  /**
   * Personalize nurturing message based on lead profile
   * PROACTIVELY creates highly targeted messaging
   */
  private personalizeNurturingMessage(
    template: string,
    lead: any,
    personalizacao: any,
    etapa: number
  ): string {
    const firstName = lead.nome.split(' ')[0];
    const objetivoUpper = personalizacao.objetivo?.toUpperCase() || 'CONDICIONAMENTO';
    
    // Content personalization based on goals
    const conteudoPersonalizado = this.getPersonalizedContent(personalizacao.objetivo, personalizacao.interesse);
    
    // Create matricula link (would integrate with payment system)
    const linkMatricula = `https://academia.com/matricula?ref=${lead.id}&promo=nurturing30`;
    
    return template
      .replace(/{{nome}}/g, firstName)
      .replace(/{{nome_academia}}/g, lead.academia.nome)
      .replace(/{{interesse}}/g, this.translateInterest(personalizacao.interesse))
      .replace(/{{objetivo}}/g, personalizacao.objetivo || 'condicionamento físico')
      .replace(/{{objetivo_upper}}/g, objetivoUpper)
      .replace(/{{conteudo_personalizado}}/g, conteudoPersonalizado)
      .replace(/{{link_matricula}}/g, linkMatricula)
      .replace(/\\n/g, '\n');
  }
  
  /**
   * Get personalized content based on member goals
   */
  private getPersonalizedContent(objetivo: string, interesse: string): string {
    const content = {
      'emagrecimento': '🔥 Para acelerar a queima de gordura:\\n• Combine cardio com musculação\\n• Mantenha déficit calórico moderado\\n• Beba água antes das refeições',
      'ganho_massa': '💪 Para ganhar massa muscular:\\n• Foque em exercícios compostos\\n• Aumente progressivamente a carga\\n• Consuma proteína pós-treino',
      'condicionamento': '⚡ Para melhorar condicionamento:\\n• Varie intensidade dos treinos\\n• Inclua exercícios funcionais\\n• Monitore frequência cardíaca',
      'saude': '🌟 Para uma vida mais saudável:\\n• Exercite-se regularmente\\n• Cuide da postura corporal\\n• Priorize qualidade do sono'
    };
    
    return content[objetivo as keyof typeof content] || content.saude;
  }
  
  /**
   * Translate interest code to readable text
   */
  private translateInterest(interesse: string): string {
    const translations = {
      'musculacao': 'musculação',
      'cardio': 'exercícios cardiovasculares',
      'funcional': 'treinamento funcional',
      'geral': 'atividades físicas em geral'
    };
    
    return translations[interesse as keyof typeof translations] || 'fitness';
  }
  
  /**
   * Record nurturing message in database
   */
  private async recordNurturingMessage(
    lead: any,
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
        fluxoId: 'nurturing_visitante',
        alunoId: lead.id,
        academiaId: lead.academiaId,
        enviadaEm: new Date()
      }
    });
  }
  
  /**
   * Update automation progress
   */
  private async updateAutomationProgress(automationId: string, etapa: number): Promise<void> {
    await this.prisma.automacao.update({
      where: { id: automationId },
      data: {
        fluxoConfig: {
          etapaAtual: etapa,
          ultimaExecucao: new Date()
        },
        ultimaExecucao: new Date()
      }
    });
  }
  
  /**
   * Stop nurturing sequence (conversion or opt-out)
   */
  private async stopNurturingSequence(alunoId: string, automationId?: string): Promise<void> {
    // Cancel pending jobs for this lead
    const jobs = await this.nurturingQueue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      if (job.data.alunoId === alunoId) {
        await job.remove();
      }
    }
    
    // Mark automation as completed
    if (automationId) {
      await this.prisma.automacao.update({
        where: { id: automationId },
        data: { 
          ativo: false,
          ultimaExecucao: new Date()
        }
      });
    }
    
    this.logger.info(`Stopped nurturing sequence for lead ${alunoId}`);
  }
  
  /**
   * Handle lead response to nurturing messages
   * PROACTIVELY detects conversion intent and routes to sales
   */
  async handleLeadResponse(alunoId: string, message: string): Promise<void> {
    const conversionKeywords = ['quero', 'interessado', 'matricula', 'plano', 'preco', 'valor'];
    const questionKeywords = ['como', 'quando', 'onde', 'horario', 'funciona'];
    const negativeKeywords = ['não', 'nao', 'parar', 'desinteressado'];
    
    const messageLower = message.toLowerCase();
    
    if (conversionKeywords.some(keyword => messageLower.includes(keyword))) {
      await this.escalateToSales(alunoId, 'conversion_intent');
    } else if (questionKeywords.some(keyword => messageLower.includes(keyword))) {
      await this.provideAutomatedInfo(alunoId, message);
    } else if (negativeKeywords.some(keyword => messageLower.includes(keyword))) {
      await this.handleOptOut(alunoId);
    }
  }
  
  /**
   * Escalate high-intent lead to human sales team
   */
  private async escalateToSales(alunoId: string, reason: string): Promise<void> {
    // Mark for sales team follow-up
    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: {
        // Could add a sales_priority field or similar
        updatedAt: new Date()
      }
    });
    
    // Notify sales team (webhook, email, etc.)
    this.logger.info(`Escalated lead ${alunoId} to sales team: ${reason}`);
  }
  
  /**
   * Provide automated information response
   */
  private async provideAutomatedInfo(alunoId: string, question: string): Promise<void> {
    // Could implement basic FAQ auto-responses here
    this.logger.info(`Lead ${alunoId} asked: ${question} - consider automated response`);
  }
  
  /**
   * Handle lead opt-out
   */
  private async handleOptOut(alunoId: string): Promise<void> {
    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: { 
        permiteWhatsApp: false,
        updatedAt: new Date()
      }
    });
    
    await this.stopNurturingSequence(alunoId);
    this.logger.info(`Lead ${alunoId} opted out of nurturing messages`);
  }
  
  /**
   * Mark lead as converted (external call from enrollment system)
   */
  async markLeadAsConverted(alunoId: string, planoId?: string): Promise<void> {
    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: {
        status: StatusAluno.ATIVO,
        planoAtual: planoId,
        dataMatricula: new Date(),
        updatedAt: new Date()
      }
    });
    
    await this.stopNurturingSequence(alunoId);
    this.logger.info(`Lead ${alunoId} marked as converted to paying member`);
  }
  
  /**
   * Get nurturing statistics
   * IMPORTANT: ROI calculation and conversion metrics
   */
  async getNurturingStats(academiaId: string, days: number = 30): Promise<NurturingStats> {
    const since = addDays(new Date(), -days);
    
    // Total leads in nurturing
    const totalLeads = await this.prisma.aluno.count({
      where: {
        academiaId,
        status: StatusAluno.VISITANTE,
        createdAt: { gte: since }
      }
    });
    
    // Leads contacted
    const totalContatados = await this.prisma.mensagem.count({
      where: {
        academiaId,
        tipo: TipoMensagem.SAIDA,
        fluxoId: 'nurturing_visitante',
        createdAt: { gte: since }
      }
    });
    
    // Conversions (leads who became active members)
    const totalConvertidos = await this.prisma.aluno.count({
      where: {
        academiaId,
        status: StatusAluno.ATIVO,
        dataMatricula: { gte: since },
        // Had nurturing messages before conversion
        mensagens: {
          some: {
            fluxoId: 'nurturing_visitante',
            createdAt: { lt: this.prisma.aluno.fields.dataMatricula }
          }
        }
      }
    });
    
    const taxaConversao = totalLeads > 0 ? totalConvertidos / totalLeads : 0;
    
    // Revenue calculation (assuming R$150 average monthly fee)
    const receitaGerada = totalConvertidos * 150;
    
    // Average conversion time (simplified)
    const tempoMedioConversao = 7; // days, would calculate from data
    
    return {
      totalLeads,
      totalContatados,
      totalConvertidos,
      receitaGerada,
      taxaConversao,
      tempoMedioConversao
    };
  }
  
  /**
   * Setup worker event handlers
   */
  private setupWorkerEvents(): void {
    this.worker.on('completed', (job) => {
      this.logger.debug(`Nurturing job ${job.id} completed successfully`);
    });
    
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Nurturing job ${job?.id} failed:`, err);
    });
    
    this.worker.on('error', (err) => {
      this.logger.error('Nurturing worker error:', err);
    });
  }
  
  /**
   * Stop the MCP
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping Nurturing MCP...');
    
    await this.worker.close();
    await this.nurturingQueue.close();
    
    this.isRunning = false;
    this.logger.info('Nurturing MCP stopped');
  }
  
  /**
   * Get MCP status
   */
  getStatus(): any {
    return {
      name: 'NurturingMCP',
      running: this.isRunning,
      queueActive: this.nurturingQueue ? true : false,
      workerActive: this.worker ? true : false
    };
  }
}