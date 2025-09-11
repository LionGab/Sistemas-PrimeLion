class FrequenciaManager {
  constructor() {
    this.dadosFrequencia = new Map(); // turma -> {mes, ano, alunos: [...]}
    this.turmaAtual = '';
    this.mesAtual = '';
    this.anoAtual = '';
    
    this.init();
  }

  async init() {
    console.log('🚀 Inicializando FrequenciaManager...');
    
    // Aguardar Sistema Local estar pronto
    while (!window.db) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.setupEventListeners();
    await this.carregarDados();
    this.renderizarRelatorios();
    
    // Se não há dados, importar automaticamente
    if (this.dadosFrequencia.size === 0) {
      console.log('📥 Nenhum dado encontrado, importando automaticamente...');
      showToast('Importando dados automaticamente...', 'info');
      await this.importarDadosCSV();
    }
  }

  setupEventListeners() {
    // Botão importar (opcional - só se existir)
    const btnImportar = document.getElementById('btn-importar');
    if (btnImportar) {
      btnImportar.addEventListener('click', () => {
        this.importarDadosCSV();
      });
    }

    // Filtros
    document.getElementById('filtro-turma').addEventListener('change', (e) => {
      this.turmaAtual = e.target.value;
      this.atualizarFiltroMes();
      this.renderizarTabela();
    });

    document.getElementById('filtro-mes').addEventListener('change', (e) => {
      this.mesAtual = e.target.value;
      this.renderizarTabela();
    });

    document.getElementById('filtro-ano').addEventListener('change', (e) => {
      this.anoAtual = e.target.value;
      this.renderizarTabela();
    });
  }

  async carregarDados() {
    try {
      console.log('📂 Carregando dados do Sistema Local...');
      
      // Buscar todas as coleções de frequência
      const snapshot = await db.collection('frequencia').get();
      
      this.dadosFrequencia.clear();
      
      for (const doc of snapshot.docs) {
        const docId = doc.id; // formato: turma_mes_ano
        const [turma, mes, ano] = docId.split('_');
        
        // Buscar alunos desta turma/mês/ano
        const alunosSnapshot = await doc.ref.collection('alunos').get();
        const alunos = [];
        
        alunosSnapshot.docs.forEach(alunoDoc => {
          alunos.push({
            id: alunoDoc.id,
            ...alunoDoc.data()
          });
        });
        
        const chave = `${turma}_${mes}_${ano}`;
        this.dadosFrequencia.set(chave, {
          turma,
          mes,
          ano,
          alunos
        });
      }
      
      console.log(`✅ Carregados ${this.dadosFrequencia.size} períodos de frequência`);
      this.atualizarFiltros();
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados: ' + error.message, 'error');
    }
  }

  atualizarFiltros() {
    const turmas = new Set();
    const anos = new Set();
    
    for (const [chave, dados] of this.dadosFrequencia) {
      turmas.add(dados.turma);
      anos.add(dados.ano);
    }
    
    // Atualizar select de turmas
    const selectTurma = document.getElementById('filtro-turma');
    selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
    Array.from(turmas).sort().forEach(turma => {
      const option = document.createElement('option');
      option.value = turma;
      option.textContent = turma;
      selectTurma.appendChild(option);
    });
    
    // Atualizar select de anos
    const selectAno = document.getElementById('filtro-ano');
    selectAno.innerHTML = '<option value="">Selecione um ano</option>';
    Array.from(anos).sort().forEach(ano => {
      const option = document.createElement('option');
      option.value = ano;
      option.textContent = ano;
      selectAno.appendChild(option);
    });
  }

  atualizarFiltroMes() {
    const selectMes = document.getElementById('filtro-mes');
    selectMes.innerHTML = '<option value="">Selecione um mês</option>';
    
    if (!this.turmaAtual) return;
    
    const mesesDisponiveis = new Set();
    for (const [chave, dados] of this.dadosFrequencia) {
      if (dados.turma === this.turmaAtual) {
        mesesDisponiveis.add(dados.mes);
      }
    }
    
    Array.from(mesesDisponiveis).sort().forEach(mes => {
      const option = document.createElement('option');
      option.value = mes;
      option.textContent = this.getNomeMes(mes);
      selectMes.appendChild(option);
    });
  }

  getNomeMes(numeroMes) {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[parseInt(numeroMes) - 1] || numeroMes;
  }

  renderizarRelatorios() {
    const container = document.getElementById('relatorios-turmas');
    container.innerHTML = '';
    
    // Agrupar por turma
    const relatoriosPorTurma = new Map();
    
    for (const [chave, dados] of this.dadosFrequencia) {
      const { turma, alunos } = dados;
      
      if (!relatoriosPorTurma.has(turma)) {
        relatoriosPorTurma.set(turma, {
          totalAlunos: 0,
          totalPeriodos: 0,
          ultimoMes: ''
        });
      }
      
      const relatorio = relatoriosPorTurma.get(turma);
      relatorio.totalAlunos = Math.max(relatorio.totalAlunos, alunos.length);
      relatorio.totalPeriodos++;
      relatorio.ultimoMes = dados.mes + '/' + dados.ano;
    }
    
    // Renderizar cards
    for (const [turma, relatorio] of relatoriosPorTurma) {
      const card = document.createElement('div');
      card.className = 'turma-card';
      card.innerHTML = `
        <h3>Turma ${turma}</h3>
        <div class="turma-stats">
          <span>👥 ${relatorio.totalAlunos} alunos</span>
          <span>📅 ${relatorio.totalPeriodos} períodos</span>
        </div>
        <div class="turma-stats">
          <span>📆 Último: ${relatorio.ultimoMes}</span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        document.getElementById('filtro-turma').value = turma;
        this.turmaAtual = turma;
        this.atualizarFiltroMes();
        document.getElementById('filtro-turma').scrollIntoView({ behavior: 'smooth' });
      });
      
      container.appendChild(card);
    }
  }

  renderizarTabela() {
    const container = document.getElementById('tabela-container');
    const thead = document.getElementById('tabela-head');
    const tbody = document.getElementById('tabela-body');
    
    if (!this.turmaAtual || !this.mesAtual || !this.anoAtual) {
      container.style.display = 'none';
      return;
    }
    
    const chave = `${this.turmaAtual}_${this.mesAtual}_${this.anoAtual}`;
    const dados = this.dadosFrequencia.get(chave);
    
    if (!dados || !dados.alunos.length) {
      container.style.display = 'none';
      showToast('Nenhum dado encontrado para este período', 'warning');
      return;
    }
    
    // Detectar dias com dados
    const diasSet = new Set();
    dados.alunos.forEach(aluno => {
      if (aluno.dias) {
        Object.keys(aluno.dias).forEach(dia => diasSet.add(dia));
      }
    });
    
    const dias = Array.from(diasSet).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Cabeçalho
    thead.innerHTML = `
      <tr>
        <th>Código</th>
        <th>Nome</th>
        ${dias.map(dia => `<th>Dia ${dia}</th>`).join('')}
      </tr>
    `;
    
    // Corpo da tabela
    tbody.innerHTML = dados.alunos.map(aluno => `
      <tr>
        <td>${aluno.codigo || aluno.id}</td>
        <td>${aluno.nome || 'Nome não informado'}</td>
        ${dias.map(dia => {
          const freq = aluno.dias && aluno.dias[dia] ? aluno.dias[dia] : '';
          return `<td class="freq-${freq}">${freq}</td>`;
        }).join('')}
      </tr>
    `).join('');
    
    container.style.display = 'block';
  }

  async importarDadosCSV() {
    showToast('Importando dados...', 'info');
    
    // Usar dados completos do arquivo separado
    const csvData = window.getDadosFrequencia ? window.getDadosFrequencia() : 'Erro: dados não encontrados';
    
    try {
      await this.processarCSVData(csvData);
      showToast('Dados importados com sucesso!', 'success');
      
      // Recarregar dados e atualizar interface
      await this.carregarDados();
      this.renderizarRelatorios();
      
      // Selecionar primeira turma automaticamente se houver dados
      if (this.dadosFrequencia.size > 0) {
        const primeiraTurma = Array.from(this.dadosFrequencia.keys())[0].split('_')[0];
        const primeiroMes = Array.from(this.dadosFrequencia.keys())[0].split('_')[1];
        const primeiroAno = Array.from(this.dadosFrequencia.keys())[0].split('_')[2];
        
        document.getElementById('filtro-turma').value = primeiraTurma;
        document.getElementById('filtro-mes').value = primeiroMes;
        document.getElementById('filtro-ano').value = primeiroAno;
        
        this.turmaAtual = primeiraTurma;
        this.mesAtual = primeiroMes;
        this.anoAtual = primeiroAno;
        
        this.atualizarFiltroMes();
        this.renderizarTabela();
        
        showToast(`Mostrando dados da turma ${primeiraTurma}`, 'success');
      }
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      showToast('Erro na importação: ' + error.message, 'error');
    }
  }

  async processarCSVData(csvData) {
    // Parse CSV mais robusto para lidar com campos com vírgulas
    const lines = csvData.trim().split('\n');
    const header = this.parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => this.parseCSVLine(line));
    
    console.log('📋 Processando CSV com', rows.length, 'linhas');
    console.log('📋 Cabeçalho:', header);
    
    // Mapear colunas
    const colunaIndices = {
      codigo: 0,  // Código
      nome: 1,    // Nome
      mes: 2,     // Mês
      turma: 3,   // turma
      ano: 4      // ano
    };
    
    // Detectar colunas de dias (a partir do índice 5)
    const diasColunas = [];
    for (let i = 5; i < header.length; i++) {
      const dia = header[i].trim();
      if (dia && !isNaN(parseInt(dia))) {
        diasColunas.push({
          index: i,
          dia: String(parseInt(dia)).padStart(2, '0')
        });
      }
    }
    
    console.log('📅 Dias encontrados:', diasColunas.map(d => d.dia));
    
    // Agrupar por turma
    const dadosPorTurma = new Map();
    
    for (const row of rows) {
      if (row.length < 5) continue;
      
      const codigo = row[colunaIndices.codigo]?.trim();
      const nome = row[colunaIndices.nome]?.trim();
      const mes = row[colunaIndices.mes]?.trim();
      const turma = row[colunaIndices.turma]?.trim();
      const ano = row[colunaIndices.ano]?.trim();
      
      if (!codigo || !nome || !mes || !turma || !ano) continue;
      
      if (!dadosPorTurma.has(turma)) {
        dadosPorTurma.set(turma, []);
      }
      
      // Processar dias
      const dias = {};
      diasColunas.forEach(({ index, dia }) => {
        const valor = row[index]?.trim().toUpperCase();
        if (valor && ['P', 'F', 'A'].includes(valor)) {
          dias[dia] = valor;
        }
      });
      
      dadosPorTurma.get(turma).push({
        codigo,
        nome,
        mes,
        ano,
        dias
      });
    }
    
    console.log('🎯 Turmas processadas:', Array.from(dadosPorTurma.keys()));
    
    // Salvar no Sistema Local
    let totalProcessados = 0;
    for (const [turma, alunos] of dadosPorTurma.entries()) {
      console.log(`💾 Salvando turma ${turma} (${alunos.length} alunos)...`);
      showToast(`Salvando turma ${turma}...`, 'info');
      
      const docId = `${turma}_${alunos[0].mes}_${alunos[0].ano}`;
      
      // Processar em lotes
      const LOTE_SIZE = 20;
      for (let i = 0; i < alunos.length; i += LOTE_SIZE) {
        const lote = alunos.slice(i, i + LOTE_SIZE);
        const batch = db.batch();
        
        for (const aluno of lote) {
          const alunoRef = db.collection('frequencia').doc(docId)
            .collection('alunos').doc(aluno.codigo);
          
          batch.set(alunoRef, {
            nome: aluno.nome,
            codigo: aluno.codigo,
            dias: aluno.dias
          }, { merge: true });
        }
        
        await batch.commit();
        console.log(`✅ Lote ${Math.floor(i/LOTE_SIZE) + 1} da turma ${turma} salvo`);
      }
      
      totalProcessados += alunos.length;
    }
    
    console.log(`✅ Total processado: ${totalProcessados} alunos`);
    
    // Tentar salvar no GitHub se configurado
    if (window.gitHubSync && window.gitHubSync.podeEscrever()) {
      try {
        showToast('📡 Sincronizando com GitHub...', 'info');
        
        // Reconstroi os dados CSV originais para salvar no GitHub
        const dataAtual = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const csvOriginal = window.getDadosFrequencia ? window.getDadosFrequencia() : '';
        
        if (csvOriginal) {
          await window.atualizarFrequenciaAutomatico(csvOriginal, dataAtual);
          console.log('✅ Frequência sincronizada no GitHub');
          showToast('Dados sincronizados no GitHub!', 'success');
        }
        
      } catch (error) {
        console.warn('⚠️ Não foi possível sincronizar no GitHub:', error.message);
        showToast('Aviso: Dados salvos localmente, mas não sincronizados no GitHub', 'warning');
        // Não interromper o fluxo - dados já foram salvos localmente
      }
    }
    
    return totalProcessados;
  }

  parseCSVLine(line) {
    // Parse simples de CSV - assumindo que não há vírgulas nos campos
    return line.split(',').map(field => field.trim());
  }

  async processarExcelPorAbas(file) {
    const workbook = await this.lerExcel(file);
    console.log('📊 Abas encontradas:', workbook.SheetNames);
    
    let totalImportados = 0;
    
    for (const sheetName of workbook.SheetNames) {
      console.log(`📄 Processando aba: ${sheetName}`);
      showToast(`Processando turma ${sheetName}...`, 'info');
      
      const worksheet = workbook.Sheets[sheetName];
      const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (dados.length < 2) {
        console.warn(`⚠️ Aba ${sheetName} vazia ou sem dados`);
        continue;
      }
      
      const importados = await this.processarDadosTurma(sheetName, dados);
      totalImportados += importados;
    }
    
    showToast(`Importação concluída! ${totalImportados} alunos processados`, 'success');
    await this.carregarDados();
    this.renderizarRelatorios();
  }

  async processarDadosTurma(turma, dados) {
    const header = dados[0];
    const rows = dados.slice(1);
    
    console.log(`📋 Cabeçalho da turma ${turma}:`, header);
    
    // Mapear colunas: A=Código, B=Nome, C=Mês, D=Ano, E:Y=Dias
    const colunaIndices = {
      codigo: 0,  // A
      nome: 1,    // B  
      mes: 2,     // C
      ano: 3      // D
    };
    
    // Detectar colunas de dias (E em diante)
    const diasColunas = [];
    for (let i = 4; i < header.length; i++) {
      const dia = header[i];
      if (dia && !isNaN(parseInt(dia))) {
        diasColunas.push({
          index: i,
          dia: String(parseInt(dia)).padStart(2, '0')
        });
      }
    }
    
    console.log(`📅 Dias encontrados para ${turma}:`, diasColunas.map(d => d.dia));
    
    let processados = 0;
    let mes = null;
    let ano = null;
    
    // Processar em lotes
    const LOTE_SIZE = 20;
    for (let i = 0; i < rows.length; i += LOTE_SIZE) {
      const lote = rows.slice(i, i + LOTE_SIZE);
      const batch = db.batch();
      
      for (const row of lote) {
        if (row.length < 4) continue;
        
        const codigo = row[colunaIndices.codigo]?.toString().trim();
        const nome = row[colunaIndices.nome]?.toString().trim();
        mes = row[colunaIndices.mes]?.toString().trim();
        ano = row[colunaIndices.ano]?.toString().trim();
        
        if (!codigo || !nome || !mes || !ano) continue;
        
        // Preparar dados de frequência
        const diasData = { nome, codigo };
        const dias = {};
        
        diasColunas.forEach(({ index, dia }) => {
          const valor = row[index]?.toString().trim().toUpperCase();
          if (valor && ['P', 'F', 'A'].includes(valor)) {
            dias[dia] = valor;
          }
        });
        
        if (Object.keys(dias).length > 0) {
          diasData.dias = dias;
        }
        
        // Salvar no Sistema Local
        const docId = `${turma}_${mes}_${ano}`;
        console.log(`💾 Salvando: ${docId} -> aluno ${codigo}`);
        
        const alunoRef = db.collection('frequencia').doc(docId)
          .collection('alunos').doc(codigo);
        
        batch.set(alunoRef, diasData, { merge: true });
        processados++;
      }
      
      if (batch._mutations && batch._mutations.length > 0) {
        console.log(`💾 Commitando lote com ${batch._mutations.length} operações...`);
        await batch.commit();
        console.log(`✅ Lote ${Math.floor(i/LOTE_SIZE) + 1} da turma ${turma} salvo no Sistema Local!`);
      } else {
        console.log(`⚠️ Lote ${Math.floor(i/LOTE_SIZE) + 1} vazio, pulando...`);
      }
      
      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`✅ Turma ${turma} processada: ${processados} alunos`);
    return processados;
  }

  async lerExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch (error) {
          reject(new Error('Erro ao ler arquivo Excel: ' + error.message));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  new FrequenciaManager();
});