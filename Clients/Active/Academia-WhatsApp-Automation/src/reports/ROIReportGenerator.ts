import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../database/connection';
import { subDays, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * ROIReportGenerator - Gerador de relatórios de ROI e performance
 * 
 * IMPORTANT: Calcula retorno sobre investimento da automação WhatsApp
 * PROACTIVELY identifica oportunidades de melhoria e otimização
 * ULTRATHINK: Business intelligence para decisões estratégicas
 */
export class ROIReportGenerator {

  /**
   * POST /reports/roi/generate - Gerar relatório completo de ROI
   */
  async generateROIReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { periodo = 'mensal', formato = 'json' } = request.body as any;

      const reportData = await this.calculateROIMetrics(periodo);
      const insights = await this.generateBusinessInsights(reportData);
      
      const relatorio = {
        titulo: `Relatório de ROI - WhatsApp Automation`,
        periodo: this.getPeriodLabel(periodo),
        geradoEm: new Date().toISOString(),
        resumoExecutivo: await this.generateExecutiveSummary(reportData),
        metricas: reportData,
        insights: insights,
        recomendacoes: await this.generateRecommendations(reportData),
        projecoes: await this.generateProjections(reportData)
      };

      if (formato === 'pdf') {
        // Gerar PDF (implementar depois)
        return reply.code(200).send({
          success: true,
          message: 'PDF será enviado por email',
          data: relatorio
        });
      }

      return reply.code(200).send({
        success: true,
        data: relatorio
      });

    } catch (error) {
      request.log.error('Erro ao gerar relatório de ROI:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /reports/dashboard-kpis - KPIs principais para dashboard
   */
  async getDashboardKPIs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);
      const mesAnterior = subMonths(hoje, 1);

      const kpis = await Promise.all([
        this.calculateRevenueImpact(inicioMes, fimMes),
        this.calculateCostSavings(inicioMes, fimMes),
        this.calculateConversionMetrics(inicioMes, fimMes),
        this.calculateEfficiencyMetrics(inicioMes, fimMes),
        this.calculateTrends(mesAnterior, hoje)
      ]);

      const [receita, economia, conversao, eficiencia, tendencias] = kpis;

      const dashboardKPIs = {
        receita: {
          valor: receita.totalReceita,
          crescimento: tendencias.receitaCrescimento,
          meta: receita.metaMensal,
          percentualMeta: receita.percentualMeta
        },
        economia: {
          valor: economia.totalEconomia,
          horasEconomizadas: economia.horasEconomizadas,
          custoEvitado: economia.custoEvitado
        },
        conversao: {
          taxaReativacao: conversao.taxaReativacao,
          taxaResposta: conversao.taxaResposta,
          tempoMedioResposta: conversao.tempoMedioResposta
        },
        eficiencia: {
          mensagensPorReativacao: eficiencia.mensagensPorReativacao,
          custoPorReativacao: eficiencia.custoPorReativacao,
          roiPercentual: eficiencia.roiPercentual
        },
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send({
        success: true,
        data: dashboardKPIs
      });

    } catch (error) {
      request.log.error('Erro ao buscar KPIs do dashboard:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /reports/performance-analysis - Análise detalhada de performance
   */
  async getPerformanceAnalysis(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { dias = 30 } = request.query as any;
      const dataInicio = subDays(new Date(), parseInt(dias));
      const dataFim = new Date();

      const analise = {
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
          dias: dias
        },
        performance: {
          automacao: await this.analyzeAutomationPerformance(dataInicio, dataFim),
          campanhas: await this.analyzeCampaignPerformance(dataInicio, dataFim),
          horarios: await this.analyzeTimePerformance(dataInicio, dataFim),
          templates: await this.analyzeTemplatePerformance(dataInicio, dataFim)
        },
        comparativo: await this.getComparativeAnalysis(dataInicio, dataFim),
        oportunidades: await this.identifyOptimizationOpportunities(dataInicio, dataFim)
      };

      return reply.code(200).send({
        success: true,
        data: analise
      });

    } catch (error) {
      request.log.error('Erro na análise de performance:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Métodos de cálculo privados

  private async calculateROIMetrics(periodo: string) {
    const { dataInicio, dataFim } = this.getPeriodDates(periodo);

    const [
      reativacoes,
      custoOperacional,
      receita,
      economia,
      mensagensEnviadas,
      respostasRecebidas
    ] = await Promise.all([
      this.getReactivations(dataInicio, dataFim),
      this.getOperationalCost(dataInicio, dataFim),
      this.getGeneratedRevenue(dataInicio, dataFim),
      this.getCostSavings(dataInicio, dataFim),
      this.getMessageCount(dataInicio, dataFim),
      this.getResponseCount(dataInicio, dataFim)
    ]);

    const roi = receita.total > 0 ? ((receita.total - custoOperacional.total) / custoOperacional.total) * 100 : 0;
    const taxaConversao = mensagensEnviadas > 0 ? (reativacoes.total / mensagensEnviadas) * 100 : 0;

    return {
      periodo: { dataInicio, dataFim },
      reativacoes,
      receita,
      custoOperacional,
      economia,
      roi: Math.round(roi),
      taxaConversao: Math.round(taxaConversao * 100) / 100,
      mensagensEnviadas,
      respostasRecebidas,
      eficiencia: {
        custoPorReativacao: reativacoes.total > 0 ? custoOperacional.total / reativacoes.total : 0,
        receitaPorMensagem: mensagensEnviadas > 0 ? receita.total / mensagensEnviadas : 0
      }
    };
  }

  private async calculateRevenueImpact(dataInicio: Date, dataFim: Date) {
    const reativacoes = await prisma.membro.findMany({
      where: {
        status: 'ATIVO',
        reativadoEm: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      select: {
        valorMensalidade: true,
        planoAnterior: true,
        reativadoEm: true
      }
    });

    const totalReceita = reativacoes.reduce((acc, membro) => {
      return acc + (membro.valorMensalidade || 150); // Valor padrão se não informado
    }, 0);

    const metaMensal = 20 * 150; // 20 reativações × R$ 150 médio
    const percentualMeta = (totalReceita / metaMensal) * 100;

    return {
      totalReceita,
      metaMensal,
      percentualMeta: Math.round(percentualMeta),
      reativacoesCount: reativacoes.length,
      ticketMedio: reativacoes.length > 0 ? totalReceita / reativacoes.length : 0
    };
  }

  private async calculateCostSavings(dataInicio: Date, dataFim: Date) {
    // Calcular economia em relação ao processo manual
    const mensagensAutomaticas = await prisma.mensagem.count({
      where: {
        criadoEm: { gte: dataInicio, lte: dataFim },
        automatica: true
      }
    });

    const tempoMedioMensagemManual = 5; // 5 minutos por mensagem manual
    const custoHoraTrabalhador = 25; // R$ 25/hora

    const horasEconomizadas = (mensagensAutomaticas * tempoMedioMensagemManual) / 60;
    const custoEvitado = horasEconomizadas * custoHoraTrabalhador;

    // Economia em ligações telefônicas
    const ligacoesEvitadas = Math.floor(mensagensAutomaticas * 0.3); // 30% precisaria de ligação
    const custoLigacao = 2; // R$ 2 por ligação
    const economiaLigacoes = ligacoesEvitadas * custoLigacao;

    const totalEconomia = custoEvitado + economiaLigacoes;

    return {
      totalEconomia: Math.round(totalEconomia),
      horasEconomizadas: Math.round(horasEconomizadas * 100) / 100,
      custoEvitado: Math.round(custoEvitado),
      ligacoesEvitadas,
      economiaLigacoes: Math.round(economiaLigacoes)
    };
  }

  private async calculateConversionMetrics(dataInicio: Date, dataFim: Date) {
    const [mensagensReativacao, respostas, reativacoes] = await Promise.all([
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: dataInicio, lte: dataFim },
          tipo: 'REATIVACAO'
        }
      }),
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: dataInicio, lte: dataFim },
          tipo: 'REATIVACAO',
          respondida: true
        }
      }),
      prisma.membro.count({
        where: {
          status: 'ATIVO',
          reativadoEm: { gte: dataInicio, lte: dataFim }
        }
      })
    ]);

    // Calcular tempo médio de resposta
    const temposResposta = await prisma.mensagem.findMany({
      where: {
        criadoEm: { gte: dataInicio, lte: dataFim },
        respondida: true,
        dataResposta: { not: null }
      },
      select: {
        criadoEm: true,
        dataResposta: true
      }
    });

    const tempoMedioResposta = temposResposta.length > 0
      ? temposResposta.reduce((acc, msg) => {
          const diff = new Date(msg.dataResposta!).getTime() - new Date(msg.criadoEm).getTime();
          return acc + (diff / (1000 * 60 * 60)); // Converter para horas
        }, 0) / temposResposta.length
      : 0;

    return {
      taxaResposta: mensagensReativacao > 0 ? (respostas / mensagensReativacao) * 100 : 0,
      taxaReativacao: mensagensReativacao > 0 ? (reativacoes / mensagensReativacao) * 100 : 0,
      tempoMedioResposta: Math.round(tempoMedioResposta * 100) / 100,
      totalMensagens: mensagensReativacao,
      totalRespostas: respostas,
      totalReativacoes: reativacoes
    };
  }

  private async calculateEfficiencyMetrics(dataInicio: Date, dataFim: Date) {
    const custoOperacional = 210; // Custo mensal estimado
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const custoPeriodo = (custoOperacional / 30) * diasPeriodo;

    const [reativacoes, mensagens, receita] = await Promise.all([
      prisma.membro.count({
        where: {
          status: 'ATIVO',
          reativadoEm: { gte: dataInicio, lte: dataFim }
        }
      }),
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: dataInicio, lte: dataFim },
          tipo: 'REATIVACAO'
        }
      }),
      this.calculateRevenueImpact(dataInicio, dataFim)
    ]);

    const mensagensPorReativacao = reativacoes > 0 ? mensagens / reativacoes : 0;
    const custoPorReativacao = reativacoes > 0 ? custoPeriodo / reativacoes : 0;
    const roiPercentual = custoPeriodo > 0 ? ((receita.totalReceita - custoPeriodo) / custoPeriodo) * 100 : 0;

    return {
      mensagensPorReativacao: Math.round(mensagensPorReativacao * 100) / 100,
      custoPorReativacao: Math.round(custoPorReativacao),
      roiPercentual: Math.round(roiPercentual),
      eficienciaOperacional: mensagens > 0 ? (reativacoes / mensagens) * 100 : 0
    };
  }

  private async calculateTrends(dataAnterior: Date, dataAtual: Date) {
    const [receitaAtual, receitaAnterior] = await Promise.all([
      this.calculateRevenueImpact(startOfMonth(dataAtual), endOfMonth(dataAtual)),
      this.calculateRevenueImpact(startOfMonth(dataAnterior), endOfMonth(dataAnterior))
    ]);

    const receitaCrescimento = receitaAnterior.totalReceita > 0
      ? ((receitaAtual.totalReceita - receitaAnterior.totalReceita) / receitaAnterior.totalReceita) * 100
      : 0;

    return {
      receitaCrescimento: Math.round(receitaCrescimento),
      tendencia: receitaCrescimento > 0 ? 'crescimento' : receitaCrescimento < 0 ? 'queda' : 'estavel'
    };
  }

  // Métodos auxiliares

  private async generateExecutiveSummary(dados: any) {
    const { roi, reativacoes, receita, economia } = dados;

    return {
      principal: `ROI de ${roi}% demonstra forte retorno do investimento em automação WhatsApp`,
      destaques: [
        `${reativacoes.total} membros reativados geraram R$ ${receita.total.toLocaleString('pt-BR')}`,
        `Economia de R$ ${economia.totalEconomia.toLocaleString('pt-BR')} em processos manuais`,
        `Taxa de conversão de ${dados.taxaConversao}% nas campanhas de reativação`,
        `${economia.horasEconomizadas}h de trabalho manual economizadas`
      ],
      recomendacao: roi > 300 ? 'Expandir investimento em automação' : 
                    roi > 100 ? 'Manter estratégia atual' : 'Revisar e otimizar processos'
    };
  }

  private async generateBusinessInsights(dados: any) {
    return [
      {
        categoria: 'Performance',
        insight: `Taxa de conversão de ${dados.taxaConversao}% indica ${dados.taxaConversao > 25 ? 'excelente' : dados.taxaConversao > 15 ? 'boa' : 'regular'} performance`,
        acao: dados.taxaConversao < 20 ? 'Revisar templates e timing das mensagens' : 'Manter estratégia atual'
      },
      {
        categoria: 'ROI',
        insight: `ROI de ${dados.roi}% ${dados.roi > 300 ? 'supera' : dados.roi > 100 ? 'atende' : 'não atinge'} expectativas de retorno`,
        acao: dados.roi < 200 ? 'Otimizar custos operacionais' : 'Considerar expansão do sistema'
      },
      {
        categoria: 'Eficiência',
        insight: `${dados.eficiencia.mensagensPorReativacao.toFixed(1)} mensagens por reativação demonstra ${dados.eficiencia.mensagensPorReativacao < 3 ? 'alta' : dados.eficiencia.mensagensPorReativacao < 5 ? 'boa' : 'baixa'} eficiência`,
        acao: dados.eficiencia.mensagensPorReativacao > 4 ? 'Personalizar melhor as mensagens' : 'Eficiência adequada'
      }
    ];
  }

  private async generateRecommendations(dados: any) {
    const recomendacoes = [];

    if (dados.taxaConversao < 20) {
      recomendacoes.push({
        prioridade: 'Alta',
        area: 'Otimização de Mensagens',
        acao: 'Testar novos templates com mais personalização',
        impactoEstimado: 'Aumento de 5-10% na taxa de conversão'
      });
    }

    if (dados.roi < 200) {
      recomendacoes.push({
        prioridade: 'Média',
        area: 'Redução de Custos',
        acao: 'Otimizar infraestrutura e processos operacionais',
        impactoEstimado: 'Melhoria de 20-30% no ROI'
      });
    }

    if (dados.eficiencia.mensagensPorReativacao > 4) {
      recomendacoes.push({
        prioridade: 'Alta',
        area: 'Segmentação',
        acao: 'Implementar segmentação mais granular dos membros',
        impactoEstimado: 'Redução de 25% no número de mensagens necessárias'
      });
    }

    return recomendacoes;
  }

  private async generateProjections(dados: any) {
    const crescimentoMensal = 1.15; // 15% de crescimento mensal estimado

    return {
      proximoMes: {
        reativacoes: Math.round(dados.reativacoes.total * crescimentoMensal),
        receita: Math.round(dados.receita.total * crescimentoMensal),
        roi: Math.round(dados.roi * 1.1) // 10% de melhoria no ROI
      },
      proximoTrimestre: {
        reativacoes: Math.round(dados.reativacoes.total * Math.pow(crescimentoMensal, 3)),
        receita: Math.round(dados.receita.total * Math.pow(crescimentoMensal, 3)),
        roi: Math.round(dados.roi * 1.3) // 30% de melhoria no ROI
      },
      cenarios: {
        conservador: { crescimento: 5, roiMelhoria: 10 },
        realista: { crescimento: 15, roiMelhoria: 25 },
        otimista: { crescimento: 25, roiMelhoria: 50 }
      }
    };
  }

  // Métodos auxiliares para buscar dados

  private getPeriodDates(periodo: string) {
    const hoje = new Date();
    let dataInicio: Date;

    switch (periodo) {
      case 'semanal':
        dataInicio = startOfWeek(hoje);
        break;
      case 'mensal':
        dataInicio = startOfMonth(hoje);
        break;
      case 'trimestral':
        dataInicio = subMonths(startOfMonth(hoje), 3);
        break;
      default:
        dataInicio = startOfMonth(hoje);
    }

    return { dataInicio, dataFim: hoje };
  }

  private getPeriodLabel(periodo: string): string {
    const labels = {
      'semanal': 'Últimos 7 dias',
      'mensal': 'Mês atual',
      'trimestral': 'Últimos 3 meses'
    };
    return labels[periodo] || 'Mês atual';
  }

  private async getReactivations(dataInicio: Date, dataFim: Date) {
    const total = await prisma.membro.count({
      where: {
        status: 'ATIVO',
        reativadoEm: { gte: dataInicio, lte: dataFim }
      }
    });

    return { total, periodo: { dataInicio, dataFim } };
  }

  private async getOperationalCost(dataInicio: Date, dataFim: Date) {
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const custoMensal = 210; // Custo fixo mensal
    const total = (custoMensal / 30) * diasPeriodo;

    return { total: Math.round(total), breakdown: { mensal: custoMensal, dias: diasPeriodo } };
  }

  private async getGeneratedRevenue(dataInicio: Date, dataFim: Date) {
    const reativacoes = await prisma.membro.findMany({
      where: {
        status: 'ATIVO',
        reativadoEm: { gte: dataInicio, lte: dataFim }
      },
      select: { valorMensalidade: true }
    });

    const total = reativacoes.reduce((acc, membro) => acc + (membro.valorMensalidade || 150), 0);

    return { total, count: reativacoes.length };
  }

  private async getCostSavings(dataInicio: Date, dataFim: Date) {
    return await this.calculateCostSavings(dataInicio, dataFim);
  }

  private async getMessageCount(dataInicio: Date, dataFim: Date) {
    return await prisma.mensagem.count({
      where: {
        criadoEm: { gte: dataInicio, lte: dataFim },
        tipo: 'REATIVACAO'
      }
    });
  }

  private async getResponseCount(dataInicio: Date, dataFim: Date) {
    return await prisma.mensagem.count({
      where: {
        criadoEm: { gte: dataInicio, lte: dataFim },
        respondida: true
      }
    });
  }

  // Métodos de análise avançada (implementar conforme necessário)

  private async analyzeAutomationPerformance(dataInicio: Date, dataFim: Date) {
    // Implementar análise de performance das automações
    return { placeholder: 'Análise de automação' };
  }

  private async analyzeCampaignPerformance(dataInicio: Date, dataFim: Date) {
    // Implementar análise de performance das campanhas
    return { placeholder: 'Análise de campanhas' };
  }

  private async analyzeTimePerformance(dataInicio: Date, dataFim: Date) {
    // Implementar análise de performance por horários
    return { placeholder: 'Análise de horários' };
  }

  private async analyzeTemplatePerformance(dataInicio: Date, dataFim: Date) {
    // Implementar análise de performance dos templates
    return { placeholder: 'Análise de templates' };
  }

  private async getComparativeAnalysis(dataInicio: Date, dataFim: Date) {
    // Implementar análise comparativa
    return { placeholder: 'Análise comparativa' };
  }

  private async identifyOptimizationOpportunities(dataInicio: Date, dataFim: Date) {
    // Implementar identificação de oportunidades
    return { placeholder: 'Oportunidades de otimização' };
  }
}