/**
 * Smart Reactivation MCP - IA-Enhanced Member Reactivation
 * Integra PatternAnalysisEngine com automações existentes
 */

import { PatternAnalysisEngine } from './PatternAnalysisEngine.js';
import { ReactivationMCP } from '../mcps/reactivation_mcp.js';

export class SmartReactivationMCP extends ReactivationMCP {
  private patternEngine: PatternAnalysisEngine;

  constructor(prisma: any, whatsapp: any, redisConnection: any) {
    super(prisma, whatsapp, redisConnection);
    this.patternEngine = new PatternAnalysisEngine(prisma, redisConnection);
  }

  /**
   * REATIVAÇÃO INTELIGENTE: Usa IA para otimizar abordagem
   */
  async smartReactivationProcess(academiaId: string): Promise<void> {
    // 1. Analisa padrões de todos os membros
    await this.patternEngine.analyzeMemberPatterns(academiaId);

    // 2. Busca membros inativos
    const inactiveMembers = await this.prisma.aluno.findMany({
      where: {
        academiaId,
        status: 'ATIVO',
        ultimaVisita: {
          lte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15+ dias
        }
      }
    });

    // 3. Aplica IA para cada membro
    for (const member of inactiveMembers) {
      await this.processSmartReactivation(member);
    }
  }

  /**
   * PROCESSAMENTO INDIVIDUAL: IA personaliza abordagem
   */
  private async processSmartReactivation(member: any): Promise<void> {
    const pattern = await this.patternEngine.getPattern(member.id);
    
    if (!pattern) {
      // Fallback para processo padrão
      return this.startReactivationSequence(member.id, member.academiaId);
    }

    // Decisão inteligente baseada no perfil
    const strategy = this.selectStrategy(pattern);
    
    await this.executeSmartStrategy(member, pattern, strategy);
  }

  /**
   * SELEÇÃO DE ESTRATÉGIA: IA escolhe melhor abordagem
   */
  private selectStrategy(pattern: any): ReactivationStrategy {
    const { probabilidadeReativacao, tipoPersonalidade, comportamentalScore } = pattern;

    // Alta probabilidade de reativação
    if (probabilidadeReativacao > 0.7) {
      return {
        type: 'DIRECT_APPROACH',
        urgency: 'HIGH',
        personalizedMessage: true,
        followUpDays: 3
      };
    }

    // Perfil engajado mas com baixa probabilidade
    if (tipoPersonalidade === 'ENGAJADO' && probabilidadeReativacao > 0.4) {
      return {
        type: 'INCENTIVE_BASED',
        urgency: 'MEDIUM',
        personalizedMessage: true,
        followUpDays: 7
      };
    }

    // Perfil resistente
    if (tipoPersonalidade === 'RESISTENTE') {
      return {
        type: 'SOFT_TOUCH',
        urgency: 'LOW',
        personalizedMessage: false,
        followUpDays: 14
      };
    }

    // Estratégia padrão
    return {
      type: 'STANDARD_FLOW',
      urgency: 'MEDIUM',
      personalizedMessage: false,
      followUpDays: 5
    };
  }

  /**
   * EXECUÇÃO INTELIGENTE: Implementa estratégia escolhida
   */
  private async executeSmartStrategy(
    member: any, 
    pattern: any, 
    strategy: ReactivationStrategy
  ): Promise<void> {
    
    const message = await this.generateSmartMessage(member, pattern, strategy);
    const bestTime = pattern.melhorHorario || '09:00';

    // Agenda envio no melhor horário
    await this.scheduleSmartMessage({
      memberId: member.id,
      academiaId: member.academiaId,
      message,
      scheduledTime: this.calculateOptimalSendTime(bestTime, strategy.urgency),
      strategy: strategy.type,
      followUpDays: strategy.followUpDays
    });

    // Log da decisão IA
    console.log(`🤖 IA Decision for ${member.nome}:`, {
      strategy: strategy.type,
      probability: pattern.probabilidadeReativacao,
      personality: pattern.tipoPersonalidade,
      bestTime
    });
  }

  /**
   * GERAÇÃO INTELIGENTE DE MENSAGENS
   */
  private async generateSmartMessage(
    member: any, 
    pattern: any, 
    strategy: ReactivationStrategy
  ): Promise<string> {
    
    const templates = {
      'DIRECT_APPROACH': [
        `Oi ${member.nome}! 😊 Notamos que você não aparece há um tempo. Tudo bem? Estamos com saudade! Que tal voltarmos aos treinos? 💪`,
        `${member.nome}, sentimos sua falta aqui! 🏃‍♀️ Seus treinos estão esperando por você. Quando podemos te ver novamente?`
      ],
      
      'INCENTIVE_BASED': [
        `${member.nome}, temos uma surpresa para você! 🎁 Oferta especial para retomar seus treinos. Quer saber mais?`,
        `Oi ${member.nome}! Preparamos algo especial para sua volta. Que tal aproveitarmos? 🌟`
      ],
      
      'SOFT_TOUCH': [
        `Oi! Esperamos que esteja tudo bem com você. A academia está aqui quando quiser voltar! 🙂`,
        `Olá! Só queríamos lembrar que você sempre será bem-vindo aqui. Cuide-se! ❤️`
      ],
      
      'STANDARD_FLOW': [
        `Olá! Sentimos sua falta na academia. Que tal retomar a rotina de exercícios? 💪`,
        `Oi! Seus treinos estão esperando. Quando podemos te ver por aqui? 🏋️‍♀️`
      ]
    };

    const messageOptions = templates[strategy.type] || templates['STANDARD_FLOW'];
    const selectedMessage = messageOptions[Math.floor(Math.random() * messageOptions.length)];

    // Personalização adicional baseada no padrão
    if (pattern.historicoInatividade.motivosRetorno.includes('promocao') && 
        strategy.personalizedMessage) {
      return selectedMessage + "\n\n*Oferta especial disponível! 🎯";
    }

    return selectedMessage;
  }

  /**
   * CÁLCULO DE TEMPO ÓTIMO: IA otimiza timing
   */
  private calculateOptimalSendTime(bestHour: string, urgency: string): Date {
    const now = new Date();
    const [hour, minute] = bestHour.split(':').map(Number);
    
    const sendTime = new Date();
    sendTime.setHours(hour, minute || 0, 0, 0);

    // Se já passou a hora hoje, agenda para amanhã
    if (sendTime <= now) {
      sendTime.setDate(sendTime.getDate() + 1);
    }

    // Ajuste baseado na urgência
    if (urgency === 'HIGH') {
      // Alta urgência: envia no próximo horário disponível
      if (sendTime.getTime() - now.getTime() > 4 * 60 * 60 * 1000) { // >4h
        sendTime.setTime(now.getTime() + 30 * 60 * 1000); // 30 min
      }
    } else if (urgency === 'LOW') {
      // Baixa urgência: pode esperar até 2 dias
      if (Math.random() > 0.5) {
        sendTime.setDate(sendTime.getDate() + 1);
      }
    }

    return sendTime;
  }

  /**
   * MONITORAMENTO INTELIGENTE: Aprende com resultados
   */
  async analyzeReactivationResults(academiaId: string, days: number = 30): Promise<AILearningData> {
    const recentMessages = await this.prisma.mensagem.findMany({
      where: {
        academiaId,
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        },
        tipo: 'SAIDA'
      },
      include: {
        aluno: true
      }
    });

    const results = {
      totalSent: recentMessages.length,
      totalResponses: recentMessages.filter(m => m.respondida).length,
      responsesByStrategy: {},
      responsesByTime: {},
      responsesByPersonality: {}
    };

    // Análise por estratégia, horário, personalidade
    for (const message of recentMessages) {
      if (message.aluno) {
        const pattern = await this.patternEngine.getPattern(message.aluno.id);
        if (pattern) {
          // Atualiza estatísticas para aprendizado
          this.updateLearningData(message, pattern, results);
        }
      }
    }

    return results;
  }

  private updateLearningData(message: any, pattern: any, results: any): void {
    // Implementação do aprendizado baseado em resultados
    const hour = new Date(message.createdAt).getHours();
    const responded = message.respondida;

    // Estatísticas por horário
    if (!results.responsesByTime[hour]) {
      results.responsesByTime[hour] = { sent: 0, responses: 0 };
    }
    results.responsesByTime[hour].sent++;
    if (responded) results.responsesByTime[hour].responses++;

    // Estatísticas por personalidade
    const personality = pattern.tipoPersonalidade;
    if (!results.responsesByPersonality[personality]) {
      results.responsesByPersonality[personality] = { sent: 0, responses: 0 };
    }
    results.responsesByPersonality[personality].sent++;
    if (responded) results.responsesByPersonality[personality].responses++;
  }

  private async scheduleSmartMessage(data: any): Promise<void> {
    // Implementa agendamento inteligente
    // Integra com sistema de filas existente
    console.log('📅 Smart message scheduled:', data);
  }
}

interface ReactivationStrategy {
  type: 'DIRECT_APPROACH' | 'INCENTIVE_BASED' | 'SOFT_TOUCH' | 'STANDARD_FLOW';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  personalizedMessage: boolean;
  followUpDays: number;
}

interface AILearningData {
  totalSent: number;
  totalResponses: number;
  responsesByStrategy: { [key: string]: any };
  responsesByTime: { [hour: number]: any };
  responsesByPersonality: { [personality: string]: any };
}