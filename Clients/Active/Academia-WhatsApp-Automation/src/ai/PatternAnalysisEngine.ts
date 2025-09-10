/**
 * Pattern Analysis Engine - Inteligência Artificial para Academia
 * Identifica padrões comportamentais e otimiza automações
 */

interface MemberPattern {
  alunoId: string;
  comportamentalScore: number;
  probabilidadeReativacao: number;
  melhorHorario: string;
  tipoPersonalidade: 'ENGAJADO' | 'ESPORADICO' | 'RESISTENTE' | 'NOVO';
  padraoResposta: {
    tempoMedioResposta: number; // em minutos
    taxaResposta: number; // 0-1
    horariosAtivos: string[]; // ['09:00', '18:00']
    diasSemanaPreferidos: number[]; // [1,2,3,4,5] = seg-sex
  };
  historicoInatividade: {
    ciclosInatividade: number;
    duracaoMediaInatividade: number; // em dias
    motivosRetorno: string[];
  };
}

interface CampaignOptimization {
  campanhaId: string;
  taxaAberturaEsperada: number;
  melhorHorarioEnvio: string;
  mensagemOtimizada: string;
  audienciaSegmentada: string[];
}

export class PatternAnalysisEngine {
  private memberPatterns: Map<string, MemberPattern> = new Map();
  
  constructor(
    private prisma: any,
    private redis: any
  ) {}

  /**
   * ANÁLISE PRINCIPAL: Identifica padrões comportamentais
   */
  async analyzeMemberPatterns(academiaId: string): Promise<void> {
    const members = await this.prisma.aluno.findMany({
      where: { academiaId },
      include: {
        mensagens: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    for (const member of members) {
      const pattern = await this.calculateMemberPattern(member);
      this.memberPatterns.set(member.id, pattern);
      
      // Cache no Redis para acesso rápido
      await this.redis.setex(
        `pattern:${member.id}`, 
        3600, 
        JSON.stringify(pattern)
      );
    }
  }

  /**
   * SCORING INTELIGENTE: Calcula probabilidade de reativação
   */
  private async calculateMemberPattern(member: any): Promise<MemberPattern> {
    const messages = member.mensagens || [];
    const responsePattern = this.analyzeResponsePattern(messages);
    const inactivityPattern = this.analyzeInactivityPattern(member);
    
    // Algoritmo de scoring baseado em múltiplos fatores
    const comportamentalScore = this.calculateBehavioralScore({
      responseRate: responsePattern.taxaResposta,
      avgResponseTime: responsePattern.tempoMedioResposta,
      inactivityCycles: inactivityPattern.ciclosInatividade,
      membershipDuration: this.getMembershipDuration(member.dataMatricula),
      lastVisit: member.ultimaVisita
    });

    const probabilidadeReativacao = this.calculateReactivationProbability(
      comportamentalScore,
      inactivityPattern,
      responsePattern
    );

    return {
      alunoId: member.id,
      comportamentalScore,
      probabilidadeReativacao,
      melhorHorario: this.findBestContactTime(responsePattern),
      tipoPersonalidade: this.classifyPersonality(comportamentalScore, responsePattern),
      padraoResposta: responsePattern,
      historicoInatividade: inactivityPattern
    };
  }

  /**
   * ANÁLISE DE RESPOSTA: Padrões de comunicação
   */
  private analyzeResponsePattern(messages: any[]): any {
    const responses = messages.filter(m => m.tipo === 'ENTRADA');
    const sent = messages.filter(m => m.tipo === 'SAIDA');
    
    if (sent.length === 0) return this.getDefaultResponsePattern();

    // Calcula tempo médio de resposta
    const responseTimes: number[] = [];
    const hourCounts: { [hour: string]: number } = {};
    
    responses.forEach(response => {
      const hour = new Date(response.createdAt).getHours();
      hourCounts[hour.toString()] = (hourCounts[hour.toString()] || 0) + 1;
      
      // Encontra mensagem enviada anterior
      const previousSent = sent.find(s => 
        new Date(s.createdAt) < new Date(response.createdAt)
      );
      
      if (previousSent) {
        const diffMs = new Date(response.createdAt).getTime() - 
                      new Date(previousSent.createdAt).getTime();
        responseTimes.push(diffMs / (1000 * 60)); // em minutos
      }
    });

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 1440; // 24h default

    const activeHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return {
      tempoMedioResposta: avgResponseTime,
      taxaResposta: responses.length / sent.length,
      horariosAtivos: activeHours,
      diasSemanaPreferidos: [1,2,3,4,5] // Default: seg-sex
    };
  }

  /**
   * ANÁLISE DE INATIVIDADE: Padrões históricos
   */
  private analyzeInactivityPattern(member: any): any {
    // Simulação baseada em dados disponíveis
    const daysSinceLastVisit = member.ultimaVisita 
      ? Math.floor((Date.now() - new Date(member.ultimaVisita).getTime()) / (1000*60*60*24))
      : 999;

    const membershipDays = Math.floor((Date.now() - new Date(member.dataMatricula).getTime()) / (1000*60*60*24));
    
    // Estimativa de ciclos baseada na duração da matrícula
    const estimatedCycles = Math.floor(membershipDays / 90); // Ciclo a cada 3 meses

    return {
      ciclosInatividade: Math.max(1, estimatedCycles),
      duracaoMediaInatividade: Math.min(daysSinceLastVisit, 30),
      motivosRetorno: ['promocao', 'contato_pessoal', 'novo_treino'] // Default
    };
  }

  /**
   * SCORING COMPORTAMENTAL: Algoritmo proprietário
   */
  private calculateBehavioralScore(factors: {
    responseRate: number;
    avgResponseTime: number;
    inactivityCycles: number;
    membershipDuration: number;
    lastVisit: Date | null;
  }): number {
    let score = 50; // Base neutra

    // Fator 1: Taxa de resposta (0-30 pontos)
    score += factors.responseRate * 30;

    // Fator 2: Tempo de resposta (0-20 pontos, inverso)
    const responseTimeScore = Math.max(0, 20 - (factors.avgResponseTime / 60));
    score += responseTimeScore;

    // Fator 3: Ciclos de inatividade (-10 pontos por ciclo)
    score -= factors.inactivityCycles * 10;

    // Fator 4: Duração da matrícula (+1 ponto por mês)
    score += Math.min(20, factors.membershipDuration / 30);

    // Fator 5: Última visita recente (+10 pontos se < 7 dias)
    if (factors.lastVisit) {
      const daysSince = (Date.now() - factors.lastVisit.getTime()) / (1000*60*60*24);
      if (daysSince < 7) score += 10;
      else if (daysSince < 30) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * PROBABILIDADE DE REATIVAÇÃO: Machine Learning simplificado
   */
  private calculateReactivationProbability(
    behavioralScore: number,
    inactivityPattern: any,
    responsePattern: any
  ): number {
    let probability = behavioralScore / 100; // Base do score comportamental

    // Ajustes baseados em padrões
    if (responsePattern.taxaResposta > 0.3) probability += 0.2;
    if (responsePattern.tempoMedioResposta < 120) probability += 0.15; // Responde em < 2h
    if (inactivityPattern.ciclosInatividade < 2) probability += 0.1;
    if (inactivityPattern.duracaoMediaInatividade < 15) probability += 0.15;

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * CLASSIFICAÇÃO DE PERSONALIDADE
   */
  private classifyPersonality(score: number, responsePattern: any): MemberPattern['tipoPersonalidade'] {
    if (score > 70 && responsePattern.taxaResposta > 0.5) return 'ENGAJADO';
    if (score > 40 && responsePattern.taxaResposta > 0.2) return 'ESPORADICO';
    if (responsePattern.taxaResposta < 0.1) return 'RESISTENTE';
    return 'NOVO';
  }

  /**
   * OTIMIZAÇÃO DE CAMPANHAS: IA para melhor timing
   */
  async optimizeCampaign(campanhaId: string, targetAudience: string[]): Promise<CampaignOptimization> {
    const patterns = await Promise.all(
      targetAudience.map(id => this.getPattern(id))
    );

    // Encontra horário ótimo baseado nos padrões da audiência
    const hourlyWeights: { [hour: string]: number } = {};
    patterns.forEach(pattern => {
      pattern?.padraoResposta.horariosAtivos.forEach(hour => {
        hourlyWeights[hour] = (hourlyWeights[hour] || 0) + 1;
      });
    });

    const bestHour = Object.entries(hourlyWeights)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '09:00';

    // Calcula taxa de abertura esperada
    const avgProbability = patterns.reduce((sum, p) => 
      sum + (p?.probabilidadeReativacao || 0), 0
    ) / patterns.length;

    return {
      campanhaId,
      taxaAberturaEsperada: avgProbability,
      melhorHorarioEnvio: bestHour,
      mensagemOtimizada: this.generateOptimizedMessage(patterns),
      audienciaSegmentada: this.segmentAudience(patterns)
    };
  }

  // Métodos auxiliares
  private findBestContactTime(responsePattern: any): string {
    return responsePattern.horariosAtivos[0] || '09:00';
  }

  private getMembershipDuration(dataMatricula: Date): number {
    return Math.floor((Date.now() - new Date(dataMatricula).getTime()) / (1000*60*60*24));
  }

  private getDefaultResponsePattern(): any {
    return {
      tempoMedioResposta: 1440,
      taxaResposta: 0,
      horariosAtivos: ['09:00', '14:00', '19:00'],
      diasSemanaPreferidos: [1,2,3,4,5]
    };
  }

  private generateOptimizedMessage(patterns: (MemberPattern | null)[]): string {
    const engajados = patterns.filter(p => p?.tipoPersonalidade === 'ENGAJADO').length;
    const resistentes = patterns.filter(p => p?.tipoPersonalidade === 'RESISTENTE').length;
    
    if (engajados > resistentes) {
      return "Olá! Sentimos sua falta aqui na academia. Que tal voltarmos aos treinos? 💪";
    } else {
      return "Oi! Tudo bem? Preparamos uma oferta especial só para você! 🎯";
    }
  }

  private segmentAudience(patterns: (MemberPattern | null)[]): string[] {
    return patterns.map(p => p?.alunoId).filter(Boolean) as string[];
  }

  async getPattern(alunoId: string): Promise<MemberPattern | null> {
    // Tenta cache primeiro
    const cached = await this.redis.get(`pattern:${alunoId}`);
    if (cached) return JSON.parse(cached);
    
    return this.memberPatterns.get(alunoId) || null;
  }
}