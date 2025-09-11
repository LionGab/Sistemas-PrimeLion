// analises.js — Módulo de análises avançadas e gráficos
// Requisitos: Chart.js deve estar carregado
// Função principal: analisar dados de medidas disciplinares e gerar insights

(function () {
  'use strict';

  if (!window.db) {
    console.error('Sistema Local (window.db) não encontrado. Verifique local-db.js');
    return;
  }

  // Variáveis globais do módulo
  let chartsInstances = {};
  let currentPeriod = '30'; // Período padrão: 30 dias

  // ======= CONFIGURAÇÃO DE PERÍODO =======
  
  function setPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Atualizar análises com novo período
    if (typeof atualizarAnalises === 'function') {
      atualizarAnalises();
    }
  }

  // ======= FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO =======
  
  async function atualizarAnalises() {
    try {
      console.log('🔄 Atualizando análises...');
      
      // Carregar dados se necessário
      if (!window.processedDataRelatorios || window.processedDataRelatorios.length === 0) {
        if (typeof carregarDadosRelatorios === 'function') {
          await carregarDadosRelatorios();
        }
      }

      // Gerar insights
      await gerarInsights();
      
      // Gerar gráficos
      await gerarGraficos();
      
      // Gerar ranking
      await gerarRanking();
      
      // Gerar análise preditiva
      await gerarAnalisePreditiva();

      console.log('✅ Análises atualizadas com sucesso');
      
    } catch (error) {
      console.error('Erro ao atualizar análises:', error);
    }
  }

  // ======= GERAÇÃO DE INSIGHTS =======
  
  async function gerarInsights() {
    try {
      const container = document.getElementById('insightsContainer');
      if (!container) return;

      const dados = window.processedDataRelatorios || [];
      
      if (dados.length === 0) {
        container.innerHTML = `
          <div class="insight-item">
            <div class="insight-text">📊 Aguardando dados para análise</div>
            <span class="trend-indicator trend-stable">ℹ️ Info</span>
          </div>
        `;
        return;
      }

      const insights = [];
      
      // Total de alunos
      const totalAlunos = dados.length;
      
      // Alunos com medidas disciplinares
      const alunosComMedidas = dados.filter(a => a.totalMedidas > 0);
      const percentualComMedidas = ((alunosComMedidas.length / totalAlunos) * 100).toFixed(1);
      
      // Análise de risco
      const alunosCriticos = dados.filter(a => a.statusRisco === 'Crítico');
      const alunosAltoRisco = dados.filter(a => a.statusRisco === 'Alto');
      
      // Adicionar insights
      insights.push({
        texto: `${percentualComMedidas}% dos alunos (${alunosComMedidas.length}/${totalAlunos}) possuem medidas disciplinares`,
        tendencia: percentualComMedidas > 20 ? 'up' : percentualComMedidas > 10 ? 'stable' : 'down',
        cor: percentualComMedidas > 20 ? '🚨 Alto' : percentualComMedidas > 10 ? '⚠️ Médio' : '✅ Baixo'
      });

      if (alunosCriticos.length > 0) {
        insights.push({
          texto: `${alunosCriticos.length} aluno(s) em situação crítica requerem atenção imediata`,
          tendencia: 'up',
          cor: '🚨 Crítico'
        });
      }

      if (alunosAltoRisco.length > 0) {
        insights.push({
          texto: `${alunosAltoRisco.length} aluno(s) com alto risco disciplinar`,
          tendencia: 'stable',
          cor: '⚠️ Atenção'
        });
      }

      // Análise por turma
      const turmas = {};
      dados.forEach(aluno => {
        if (!turmas[aluno.turma]) {
          turmas[aluno.turma] = { total: 0, comMedidas: 0 };
        }
        turmas[aluno.turma].total++;
        if (aluno.totalMedidas > 0) {
          turmas[aluno.turma].comMedidas++;
        }
      });

      const turmaMaiorIncidencia = Object.keys(turmas).reduce((a, b) => 
        (turmas[a].comMedidas / turmas[a].total) > (turmas[b].comMedidas / turmas[b].total) ? a : b
      );

      if (turmaMaiorIncidencia && turmas[turmaMaiorIncidencia].comMedidas > 0) {
        const percentual = ((turmas[turmaMaiorIncidencia].comMedidas / turmas[turmaMaiorIncidencia].total) * 100).toFixed(1);
        insights.push({
          texto: `Turma ${turmaMaiorIncidencia} tem maior incidência (${percentual}%)`,
          tendencia: 'stable',
          cor: '📊 Info'
        });
      }

      // Renderizar insights
      container.innerHTML = insights.map(insight => `
        <div class="insight-item">
          <div class="insight-text">💡 ${insight.texto}</div>
          <span class="trend-indicator trend-${insight.tendencia}">${insight.cor}</span>
        </div>
      `).join('');

    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    }
  }

  // ======= GERAÇÃO DE GRÁFICOS =======
  
  async function gerarGraficos() {
    try {
      // Verificar se Chart.js está disponível
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js não carregado - gráficos não disponíveis');
        return;
      }

      const dados = window.processedDataRelatorios || [];
      
      if (dados.length === 0) {
        // Mostrar estado vazio nos containers de gráficos
        const chartContainers = ['trendChart', 'turmaChart', 'tipoChart', 'medidasChart'];
        chartContainers.forEach(chartId => {
          const canvas = document.getElementById(chartId);
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
          }
        });
        return;
      }

      // Gráfico de comparativo por turma
      await gerarGraficoTurmas(dados);
      
      // Gráfico de tipos de medidas
      await gerarGraficoTiposMedidas(dados);

    } catch (error) {
      console.error('Erro ao gerar gráficos:', error);
    }
  }

  async function gerarGraficoTurmas(dados) {
    try {
      const canvas = document.getElementById('turmaChart');
      if (!canvas) return;

      // Destruir gráfico anterior se existir
      if (chartsInstances.turmaChart) {
        chartsInstances.turmaChart.destroy();
      }

      // Agrupar dados por turma
      const turmas = {};
      dados.forEach(aluno => {
        if (!turmas[aluno.turma]) {
          turmas[aluno.turma] = { total: 0, comMedidas: 0, totalMedidas: 0 };
        }
        turmas[aluno.turma].total++;
        if (aluno.totalMedidas > 0) {
          turmas[aluno.turma].comMedidas++;
          turmas[aluno.turma].totalMedidas += aluno.totalMedidas;
        }
      });

      const labels = Object.keys(turmas).sort();
      const dataComMedidas = labels.map(turma => turmas[turma].comMedidas);
      const dataTotalMedidas = labels.map(turma => turmas[turma].totalMedidas);

      const ctx = canvas.getContext('2d');
      chartsInstances.turmaChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Alunos com Medidas',
              data: dataComMedidas,
              backgroundColor: 'rgba(220, 53, 69, 0.7)',
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 1
            },
            {
              label: 'Total de Medidas',
              data: dataTotalMedidas,
              backgroundColor: 'rgba(255, 193, 7, 0.7)',
              borderColor: 'rgba(255, 193, 7, 1)',
              borderWidth: 1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              position: 'left'
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              grid: {
                drawOnChartArea: false
              }
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });

    } catch (error) {
      console.error('Erro ao gerar gráfico de turmas:', error);
    }
  }

  async function gerarGraficoTiposMedidas(dados) {
    try {
      const canvas = document.getElementById('medidasChart');
      if (!canvas) return;

      // Destruir gráfico anterior se existir
      if (chartsInstances.medidasChart) {
        chartsInstances.medidasChart.destroy();
      }

      // Contar tipos de medidas
      const tiposMedidas = {};
      dados.forEach(aluno => {
        if (aluno.medidas && aluno.medidas.length > 0) {
          aluno.medidas.forEach(medida => {
            const tipo = medida.tipo_medida || 'Não especificado';
            tiposMedidas[tipo] = (tiposMedidas[tipo] || 0) + 1;
          });
        }
      });

      if (Object.keys(tiposMedidas).length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('Sem medidas registradas', canvas.width / 2, canvas.height / 2);
        return;
      }

      const labels = Object.keys(tiposMedidas);
      const data = Object.values(tiposMedidas);
      
      const cores = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ];

      const ctx = canvas.getContext('2d');
      chartsInstances.medidasChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: cores.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

    } catch (error) {
      console.error('Erro ao gerar gráfico de tipos de medidas:', error);
    }
  }

  // ======= GERAÇÃO DE RANKING =======
  
  async function gerarRanking() {
    try {
      const container = document.getElementById('rankingContainer');
      if (!container) return;

      const dados = window.processedDataRelatorios || [];
      
      if (dados.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>Sem dados para ranking</h3>
            <p>Aguardando dados de alunos</p>
          </div>
        `;
        return;
      }

      // Filtrar e ordenar alunos com medidas
      const alunosComMedidas = dados
        .filter(a => a.totalMedidas > 0)
        .sort((a, b) => b.totalMedidas - a.totalMedidas)
        .slice(0, 10); // Top 10

      if (alunosComMedidas.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <h3>Excelente!</h3>
            <p>Nenhum aluno com medidas disciplinares</p>
          </div>
        `;
        return;
      }

      let html = '<div class="ranking-list">';
      
      alunosComMedidas.forEach((aluno, index) => {
        const posicao = index + 1;
        const medalha = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `${posicao}º`;
        const corRisco = aluno.statusRisco === 'Crítico' ? '#dc3545' : 
                        aluno.statusRisco === 'Alto' ? '#fd7e14' : 
                        aluno.statusRisco === 'Médio' ? '#ffc107' : '#28a745';
        
        html += `
          <div class="ranking-item" style="border-left: 4px solid ${corRisco}">
            <div class="ranking-position">${medalha}</div>
            <div class="ranking-info">
              <div class="ranking-name">${aluno.nome}</div>
              <div class="ranking-details">
                ${aluno.turma} • ${aluno.totalMedidas} medida(s) • 
                <span style="color: ${corRisco}; font-weight: bold;">${aluno.statusRisco}</span>
              </div>
            </div>
            <div class="ranking-score">${aluno.totalMedidas}</div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;

    } catch (error) {
      console.error('Erro ao gerar ranking:', error);
    }
  }

  // ======= ANÁLISE PREDITIVA =======
  
  async function gerarAnalisePreditiva() {
    try {
      const container = document.getElementById('predicaoContainer');
      if (!container) return;

      const dados = window.processedDataRelatorios || [];
      
      if (dados.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔮</div>
            <h3>Análise Preditiva</h3>
            <p>Aguardando dados para análise preditiva</p>
          </div>
        `;
        return;
      }

      const alunosRisco = dados.filter(a => a.statusRisco === 'Alto' || a.statusRisco === 'Crítico');
      const tendencia = calcularTendencia(dados);
      
      let html = `
        <div class="prediction-grid">
          <div class="prediction-card">
            <div class="prediction-icon">⚠️</div>
            <div class="prediction-content">
              <div class="prediction-number">${alunosRisco.length}</div>
              <div class="prediction-label">Alunos em Risco</div>
              <div class="prediction-subtitle">Requerem acompanhamento especial</div>
            </div>
          </div>
          
          <div class="prediction-card">
            <div class="prediction-icon">📈</div>
            <div class="prediction-content">
              <div class="prediction-number">${tendencia.percentual}%</div>
              <div class="prediction-label">Tendência</div>
              <div class="prediction-subtitle">${tendencia.descricao}</div>
            </div>
          </div>
          
          <div class="prediction-card">
            <div class="prediction-icon">🎯</div>
            <div class="prediction-content">
              <div class="prediction-number">${calcularProjecao(dados)}</div>
              <div class="prediction-label">Projeção 30 dias</div>
              <div class="prediction-subtitle">Novos casos estimados</div>
            </div>
          </div>
        </div>
        
        <div class="prediction-recommendations">
          <h4>🎯 Recomendações</h4>
          ${gerarRecomendacoes(dados)}
        </div>
      `;
      
      container.innerHTML = html;

    } catch (error) {
      console.error('Erro ao gerar análise preditiva:', error);
    }
  }

  function calcularTendencia(dados) {
    // Análise simples baseada na distribuição de riscos
    const criticos = dados.filter(a => a.statusRisco === 'Crítico').length;
    const altos = dados.filter(a => a.statusRisco === 'Alto').length;
    const total = dados.length;
    
    const percentualRisco = ((criticos + altos) / total * 100);
    
    if (percentualRisco > 30) {
      return { percentual: percentualRisco.toFixed(1), descricao: 'Crescente - Atenção necessária' };
    } else if (percentualRisco > 15) {
      return { percentual: percentualRisco.toFixed(1), descricao: 'Estável - Monitoramento' };
    } else {
      return { percentual: percentualRisco.toFixed(1), descricao: 'Decrescente - Situação controlada' };
    }
  }

  function calcularProjecao(dados) {
    // Projeção simples baseada na média atual
    const medidasRecentes = dados.reduce((sum, a) => sum + a.totalMedidas, 0);
    const projecao = Math.round(medidasRecentes * 0.1); // 10% da média atual
    return projecao;
  }

  function gerarRecomendacoes(dados) {
    const recomendacoes = [];
    
    const criticos = dados.filter(a => a.statusRisco === 'Crítico');
    const altos = dados.filter(a => a.statusRisco === 'Alto');
    
    if (criticos.length > 0) {
      recomendacoes.push(`Acompanhar imediatamente ${criticos.length} aluno(s) em situação crítica`);
    }
    
    if (altos.length > 0) {
      recomendacoes.push(`Implementar plano de acompanhamento para ${altos.length} aluno(s) de alto risco`);
    }
    
    // Análise por turma
    const turmas = {};
    dados.forEach(aluno => {
      if (!turmas[aluno.turma]) turmas[aluno.turma] = [];
      turmas[aluno.turma].push(aluno);
    });
    
    Object.keys(turmas).forEach(turma => {
      const alunosTurma = turmas[turma];
      const problematicosTurma = alunosTurma.filter(a => a.totalMedidas > 0);
      const percentual = (problematicosTurma.length / alunosTurma.length) * 100;
      
      if (percentual > 40) {
        recomendacoes.push(`Turma ${turma} necessita intervenção especial (${percentual.toFixed(1)}% com medidas)`);
      }
    });
    
    if (recomendacoes.length === 0) {
      recomendacoes.push('Situação sob controle - manter monitoramento regular');
    }
    
    return '<ul>' + recomendacoes.map(r => `<li>${r}</li>`).join('') + '</ul>';
  }

  // ======= FUNÇÕES DE EXPORTAÇÃO =======
  
  function exportarAnalises() {
    console.log('Exportando análises...');
    // Implementar exportação se necessário
    alert('Funcionalidade de exportação em desenvolvimento');
  }

  function gerarRelatorioAnalitico() {
    console.log('Gerando relatório analítico...');
    // Implementar geração de relatório se necessário
    alert('Funcionalidade de relatório analítico em desenvolvimento');
  }

  // ======= EXPOSIÇÃO DE FUNÇÕES GLOBAIS =======
  
  window.setPeriod = setPeriod;
  window.atualizarAnalises = atualizarAnalises;
  window.exportarAnalises = exportarAnalises;
  window.gerarRelatorioAnalitico = gerarRelatorioAnalitico;

  // Expor módulo
  window.analisesModule = {
    setPeriod,
    atualizarAnalises,
    gerarInsights,
    gerarGraficos,
    gerarRanking,
    gerarAnalisePreditiva,
    exportarAnalises,
    gerarRelatorioAnalitico
  };

})();