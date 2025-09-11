// Nova função para carregar dados de frequência diretamente do CSV
async function carregarDadosFrequenciaCSV() {
  try {
    console.log('📥 Carregando dados de frequência do arquivo CSV...');
    
    const response = await fetch('./assets/js/dados-frequencia-agosto.js');
    if (!response.ok) {
      throw new Error('Erro ao carregar arquivo: ' + response.status);
    }
    
    const jsContent = await response.text();
    const csvMatch = jsContent.match(/const dadosCSV = `([^`]+)`/);
    if (!csvMatch || !csvMatch[1]) {
      throw new Error('Dados CSV não encontrados no arquivo');
    }
    
    const csvData = csvMatch[1];
    const linhas = csvData.trim().split('\n');
    const dadosProcessados = [];
    
    // Dias de agosto 2025
    const diasAgosto = [1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29];
    
    linhas.forEach(linha => {
      const campos = linha.split(',');
      if (campos.length >= 3) {
        const codigo = campos[0];
        const nome = campos[1];
        const turma = campos[2];
        
        // Processar frequência
        const diasFrequencia = {};
        let totalPresencas = 0;
        let totalFaltas = 0;
        let totalAtestados = 0;
        let dataUltimaFalta = null;
        
        for (let i = 3; i < campos.length && i - 3 < diasAgosto.length; i++) {
          const marcacao = campos[i];
          const dia = diasAgosto[i - 3];
          
          if (marcacao && marcacao.trim()) {
            diasFrequencia[dia] = marcacao.trim();
            
            if (marcacao === 'P') {
              totalPresencas++;
            } else if (marcacao === 'F') {
              totalFaltas++;
              dataUltimaFalta = new Date(2025, 7, dia); // Agosto 2025
            } else if (marcacao === 'FC') {
              totalFaltas++; // FC conta como falta
              dataUltimaFalta = new Date(2025, 7, dia);
            } else if (marcacao === 'A') {
              totalAtestados++;
            }
          }
        }
        
        const totalDias = totalPresencas + totalFaltas + totalAtestados;
        const percentualPresenca = totalDias > 0 ? (totalPresencas / totalDias * 100) : 0;
        
        dadosProcessados.push({
          codigo: codigo,
          nome: nome,
          turma: turma,
          diasFrequencia: diasFrequencia,
          presencas: totalPresencas,
          faltas: totalFaltas,
          atestados: totalAtestados,
          percentualPresenca: percentualPresenca,
          dataUltimaFalta: dataUltimaFalta ? dataUltimaFalta.toISOString() : null
        });
      }
    });
    
    console.log(`📊 Processados ${dadosProcessados.length} registros de frequência`);
    return dadosProcessados;
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados de frequência:', error);
    return [];
  }
}

// Script para popular o banco local com dados de agosto 2025
async function popularBancoLocal() {
  console.log('🔄 Populando banco local com dados de agosto 2025...');
  
  // Aguardar carregamento do banco local
  await window.localDb.waitForLoad();
  
  // Carregar dados de frequência usando a nova função
  const dadosAgosto = await carregarDadosFrequenciaCSV();
  
  if (dadosAgosto.length === 0) {
    console.error('❌ Nenhum dado de frequência encontrado');
    return false;
  }
  
  console.log(`📊 Processando ${dadosAgosto.length} registros...`);
  
  // Processar cada aluno
  for (let i = 0; i < dadosAgosto.length; i++) {
    const aluno = dadosAgosto[i];
    
    // Criar registro no banco local
    const registro = {
      id: `freq_${aluno.codigo}_${Date.now()}_${i}`,
      codigo: aluno.codigo,
      nome: aluno.nome,
      turma: aluno.turma,
      diasFrequencia: aluno.diasFrequencia,
      presencas: aluno.presencas,
      faltas: aluno.faltas,
      atestados: aluno.atestados,
      percentualPresenca: aluno.percentualPresenca,
      dataUltimaFalta: aluno.dataUltimaFalta,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    // Adicionar ao banco local
    window.localDb.data.frequencia_diaria[registro.id] = registro;
  }
  
  // Remover registro de exemplo
  delete window.localDb.data.frequencia_diaria.sample_loading;
  
  // Atualizar metadata
  window.localDb.data.metadata.total_registros = dadosAgosto.length;
  window.localDb.data.metadata.ultimo_backup = new Date().toISOString();
  
  console.log(`✅ ${dadosAgosto.length} registros adicionados ao banco local!`);
  
  // Disparar evento para atualizar a interface
  window.dispatchEvent(new CustomEvent('dadosPopulados', { 
    detail: { total: dadosAgosto.length } 
  }));
  
  return true;
}

// Auto-executar quando os dados estiverem carregados
window.addEventListener('localDbReady', () => {
  // Verificar se já existem dados
  const existingData = Object.keys(window.localDb.data.frequencia_diaria || {})
    .filter(key => key !== 'sample_loading');
  
  if (existingData.length === 0) {
    console.log('📝 Banco vazio, iniciando população...');
    
    // Aguardar um pouco para garantir que todos os recursos estejam carregados
    setTimeout(() => {
      console.log('🔄 Iniciando população do banco...');
      popularBancoLocal();
    }, 1000);
  } else {
    console.log(`📚 Banco já possui ${existingData.length} registros`);
    // Disparar evento mesmo se já tem dados
    window.dispatchEvent(new CustomEvent('dadosPopulados', { 
      detail: { total: existingData.length } 
    }));
  }
});

// Função para limpar e repopular
window.limparERepopularBanco = async function() {
  console.log('🗑️ Limpando banco local...');
  
  await window.localDb.waitForLoad();
  
  // Limpar frequência
  window.localDb.data.frequencia_diaria = {};
  
  // Repopular
  return await popularBancoLocal();
};

// Função para buscar frequência de um aluno específico pelo código
window.buscarFrequenciaPorCodigo = async function buscarFrequenciaPorCodigo(codigoAluno) {
  try {
    console.log(`🔍 Buscando frequência para aluno: ${codigoAluno}`);
    
    const response = await fetch('./assets/js/dados-frequencia-agosto.js');
    if (!response.ok) {
      throw new Error('Erro ao carregar arquivo: ' + response.status);
    }
    
    const jsContent = await response.text();
    const csvMatch = jsContent.match(/const dadosCSV = `([^`]+)`/);
    if (!csvMatch || !csvMatch[1]) {
      throw new Error('Dados CSV não encontrados no arquivo');
    }
    
    const csvData = csvMatch[1];
    const linhas = csvData.trim().split('\n');
    
    // Buscar linha do aluno
    let linhaAluno = null;
    for (let linha of linhas) {
      if (linha.startsWith(codigoAluno + ',')) {
        linhaAluno = linha;
        break;
      }
    }
    
    if (!linhaAluno) {
      console.log(`⚠️ Aluno ${codigoAluno} não encontrado no arquivo de frequência`);
      return null;
    }
    
    const campos = linhaAluno.split(',');
    const nome = campos[1];
    const turma = campos[2];
    
    // Dias de agosto 2025
    const diasAgosto = [1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29];
    
    const registrosFrequencia = [];
    const diasFrequencia = {};
    let totalPresencas = 0;
    let totalFaltas = 0;
    let totalAtestados = 0;
    
    for (let i = 3; i < campos.length && i - 3 < diasAgosto.length; i++) {
      const marcacao = campos[i];
      const dia = diasAgosto[i - 3];
      
      if (marcacao && marcacao.trim()) {
        diasFrequencia[dia] = marcacao.trim();
        
        const registro = {
          dia: dia,
          marcacao: marcacao.trim(),
          data: `${dia.toString().padStart(2, '0')}/08`,
          dataCompleta: new Date(2025, 7, dia).toISOString()
        };
        
        registrosFrequencia.push(registro);
        
        if (marcacao === 'P') {
          totalPresencas++;
        } else if (marcacao === 'F' || marcacao === 'FC') {
          totalFaltas++;
        } else if (marcacao === 'A') {
          totalAtestados++;
        }
      }
    }
    
    // Filtrar apenas faltas (F, FC, A) para o histórico
    const faltas = registrosFrequencia.filter(r => r.marcacao === 'F' || r.marcacao === 'FC' || r.marcacao === 'A');
    
    const resultado = {
      codigo: codigoAluno,
      nome: nome,
      turma: turma,
      registrosCompletos: registrosFrequencia,
      faltas: faltas,
      diasFrequencia: diasFrequencia,
      estatisticas: {
        totalPresencas: totalPresencas,
        totalFaltas: totalFaltas,
        totalAtestados: totalAtestados,
        totalDias: totalPresencas + totalFaltas + totalAtestados,
        percentualPresenca: totalPresencas + totalFaltas + totalAtestados > 0 ? 
          ((totalPresencas / (totalPresencas + totalFaltas + totalAtestados)) * 100).toFixed(1) : 0
      }
    };
    
    console.log(`✅ Frequência encontrada para ${nome}: ${faltas.length} faltas de ${resultado.estatisticas.totalDias} dias`);
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro ao buscar frequência por código:', error);
    return null;
  }
}

// Expor funções
window.popularBancoLocal = popularBancoLocal;
window.buscarFrequenciaPorCodigo = buscarFrequenciaPorCodigo;
window.carregarDadosFrequenciaCSV = carregarDadosFrequenciaCSV;