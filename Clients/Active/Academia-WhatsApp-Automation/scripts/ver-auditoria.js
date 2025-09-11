/**
 * Visualizador de Auditoria - Full Force Academia
 * Mostra resultados de forma organizada e visual
 */

async function visualizarAuditoria() {
  console.log('🔍 EXECUTANDO AUDITORIA COMPLETA - FULL FORCE ACADEMIA');
  console.log(''.padEnd(60, '='));
  console.log('');

  try {
    // Fazer request para o servidor de auditoria
    const response = await fetch('http://localhost:3001/api/audit/dashboard');
    
    if (!response.ok) {
      throw new Error(`Servidor retornou: ${response.status}`);
    }
    
    const dados = await response.json();
    
    // Header com informações gerais
    console.log('📊 RELATÓRIO DE AUDITORIA');
    console.log(`📅 Data: ${new Date(dados.overview.lastAudit).toLocaleString('pt-BR')}`);
    console.log(`🏢 Academia: Full Force Academia - Matupá/MT`);
    console.log('');
    
    // Score geral com visual
    const scoreGeral = dados.overview.overallScore;
    const barraScore = '█'.repeat(Math.floor(scoreGeral / 10)) + '▓'.repeat(10 - Math.floor(scoreGeral / 10));
    let statusIcon = '🔴';
    let statusText = 'CRÍTICO';
    
    if (scoreGeral >= 90) {
      statusIcon = '🟢';
      statusText = 'EXCELENTE';
    } else if (scoreGeral >= 70) {
      statusIcon = '🟡';
      statusText = 'BOM';
    } else if (scoreGeral >= 50) {
      statusIcon = '🟠';
      statusText = 'REGULAR';
    }
    
    console.log('🎯 SCORE GERAL DO SISTEMA');
    console.log(`   ${statusIcon} ${scoreGeral}/100 - ${statusText}`);
    console.log(`   [${barraScore}] ${scoreGeral}%`);
    console.log('');
    
    // Análise por categorias
    console.log('📈 ANÁLISE POR CATEGORIA');
    console.log(''.padEnd(40, '-'));
    
    const categorias = [
      { nome: 'WhatsApp Business', key: 'whatsapp', icon: '📱' },
      { nome: 'Compliance LGPD', key: 'compliance', icon: '🔒' },
      { nome: 'Performance', key: 'performance', icon: '⚡' },
      { nome: 'ROI & Negócio', key: 'roi', icon: '💰' }
    ];
    
    categorias.forEach(cat => {
      const score = dados.categories[cat.key].score;
      const status = dados.categories[cat.key].status;
      const barra = '█'.repeat(Math.floor(score / 10)) + '▓'.repeat(10 - Math.floor(score / 10));
      
      let statusEmoji = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
      
      console.log(`${cat.icon} ${cat.nome.padEnd(20)} ${statusEmoji} ${score}/100`);
      console.log(`   [${barra}] ${status.toUpperCase()}`);
      console.log('');
    });
    
    // Métricas de negócio
    console.log('💼 MÉTRICAS DE NEGÓCIO');
    console.log(''.padEnd(40, '-'));
    console.log(`💰 Receita Total:        R$ ${dados.overview.totalRevenue.toLocaleString('pt-BR')}`);
    console.log(`🤖 Automações Ativas:   ${dados.overview.activeAutomations}`);
    console.log(`📊 Status Geral:        ${dados.overview.status.toUpperCase()}`);
    console.log('');
    
    // Atividades recentes
    console.log('🕐 ATIVIDADE RECENTE');
    console.log(''.padEnd(40, '-'));
    dados.recentActivity.forEach((ativ, index) => {
      const tempo = new Date(ativ.time).toLocaleTimeString('pt-BR');
      const scoreColor = ativ.score >= 90 ? '🟢' : ativ.score >= 70 ? '🟡' : '🔴';
      console.log(`${scoreColor} ${tempo} - ${ativ.action} (Score: ${ativ.score})`);
    });
    console.log('');
    
    // Recomendações baseadas no score
    console.log('🎯 RECOMENDAÇÕES');
    console.log(''.padEnd(40, '-'));
    
    if (scoreGeral >= 95) {
      console.log('✅ SISTEMA PERFEITO! Pronto para produção.');
      console.log('✅ Pode ativar campanha para todos 561 ex-alunos.');
      console.log('✅ ROI esperado: R$ 300k+/ano');
    } else if (scoreGeral >= 85) {
      console.log('✅ SISTEMA MUITO BOM! Pequenos ajustes recomendados.');
      console.log('⚠️  Execute correções menores antes da ativação total.');
    } else {
      console.log('⚠️  NECESSÁRIO OTIMIZAÇÃO antes da produção.');
      console.log('❌ Corrija problemas críticos identificados.');
    }
    
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('   1. Importar 561 ex-alunos do SCA Online');
    console.log('   2. Conectar WhatsApp Business oficial');
    console.log('   3. Executar campanha piloto (10 pessoas)');
    console.log('   4. Ativar campanha completa');
    console.log('');
    console.log(''.padEnd(60, '='));
    console.log(`✅ AUDITORIA CONCLUÍDA - Score: ${scoreGeral}/100`);
    
  } catch (error) {
    console.error('❌ ERRO NA AUDITORIA:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 Servidor não está rodando em localhost:3001');
      console.error('   💡 Execute: node test-audit-server.js');
    } else {
      console.error('   📋 Detalhes:', error.message);
    }
    console.error('');
    console.error('🔧 SOLUÇÃO:');
    console.error('   1. Verifique se o servidor está ativo');
    console.error('   2. Confirme a porta 3001 está livre');
    console.error('   3. Execute novamente o comando');
  }
}

// Executar visualização
visualizarAuditoria();