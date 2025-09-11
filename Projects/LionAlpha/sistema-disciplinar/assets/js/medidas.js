// medidas.js — Faltas e Medidas vinculadas por subcoleções do aluno
// Requisitos no HTML (exemplo):
// - <form id="faltaForm"> com inputs name="alunoId", "data", "motivo", "observacoes"
// - <form id="medidaForm"> com inputs name="alunoId", "tipo", "data", "descricao", "responsavel"
// - <tbody id="faltasTableBody"></tbody>
// - <tbody id="medidasTableBody"></tbody>
// - Elementos opcionais: selects para alunos, filtro por período, etc.
// - local-db.js deve ter inicializado window.db (Sistema Local)

(function () {
  'use strict';

  if (!window.db) {
    console.error('Sistema Local (window.db) não encontrado. Verifique local-db.js');
    return;
  }

  // ======= Utils =======

  const alunosCache = new Map();

  async function getAlunoDoc(alunoId) {
    if (!alunoId) throw new Error('alunoId obrigatório');
    if (alunosCache.has(alunoId)) return alunosCache.get(alunoId);

    const ref = window.db.collection('alunos').doc(alunoId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Aluno não encontrado: ' + alunoId);

    const aluno = { id: snap.id, ...snap.data() };
    alunosCache.set(alunoId, aluno);
    return aluno;
  }

  function getFormValues(formEl) {
    const data = {};
    Array.from(new FormData(formEl).entries()).forEach(([k, v]) => (data[k] = (v || '').trim()));
    return data;
  }

  function setLoading(btn, isLoading, textIdle = 'Salvar', textLoading = 'Salvando...') {
    if (!btn) return;
    btn.disabled = !!isLoading;
    btn.textContent = isLoading ? textLoading : textIdle;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      // Normaliza: aceita "YYYY-MM-DD" (date input) e "YYYY-MM-DDTHH:mm"
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  }

  // ======= CRUD FALTAS (subcoleção alunos/{id}/faltas) =======

  async function criarFalta({ alunoId, data, motivo, observacoes }) {
    if (!alunoId) throw new Error('Selecione um aluno.');
    const faixa = {
      data: data || new Date().toISOString(),
      motivo: motivo || '',
      observacoes: observacoes || '',
      criadoEm: new Date().toISOString(),
    };

    const ref = window.db.collection('alunos').doc(alunoId).collection('faltas');
    const docRef = await ref.add(faixa);
    return docRef.id;
  }

  async function listarFaltasPorAluno(alunoId, { limit = 50, order = 'desc' } = {}) {
    await getAlunoDoc(alunoId);
    const snap = await window.db.collection('alunos').doc(alunoId).collection('faltas').get();
    
    const faltas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Ordenar por data no JavaScript
    faltas.sort((a, b) => {
      const dataA = a.data ? new Date(a.data) : new Date(0);
      const dataB = b.data ? new Date(b.data) : new Date(0);
      return order === 'desc' ? dataB - dataA : dataA - dataB;
    });
    
    return faltas.slice(0, limit);
  }

  async function atualizarFalta(alunoId, faltaId, payload) {
    await getAlunoDoc(alunoId);
    const ref = window.db.collection('alunos').doc(alunoId).collection('faltas').doc(faltaId);
    await ref.set({ ...payload, atualizadoEm: new Date().toISOString() }, { merge: true });
  }

  async function excluirFalta(alunoId, faltaId) {
    await getAlunoDoc(alunoId);
    await window.db.collection('alunos').doc(alunoId).collection('faltas').doc(faltaId).delete();
  }

  // ======= CRUD MEDIDAS (subcoleção alunos/{id}/medidas) =======

  async function criarMedida({ alunoId, tipo, data, descricao, responsavel }) {
    if (!alunoId) throw new Error('Selecione um aluno.');
    
    // Buscar dados do aluno para o GitHub
    let nomeAluno = 'Aluno não encontrado';
    try {
      const alunoDoc = await window.db.collection('alunos').doc(alunoId).get();
      if (alunoDoc.exists) {
        nomeAluno = alunoDoc.data().nome || alunoDoc.data().nome_completo || `Aluno ${alunoId}`;
      }
    } catch (error) {
      console.log('Erro ao buscar dados do aluno:', error);
    }
    
    const med = {
      tipo: tipo || '',               // ex.: "Advertência", "Suspensão", "Orientação"
      data: data || new Date().toISOString(),
      descricao: descricao || '',
      responsavel: responsavel || '',
      criadoEm: new Date().toISOString(),
    };

    // Salvar localmente primeiro
    const ref = window.db.collection('alunos').doc(alunoId).collection('medidas');
    const docRef = await ref.add(med);
    
    // Tentar salvar no GitHub se configurado
    if (window.gitHubSync && window.gitHubSync.podeEscrever()) {
      try {
        const medidaParaGitHub = {
          ...med,
          aluno: nomeAluno,
          codigo_aluno: alunoId,
          professor: responsavel,
          id_local: docRef.id
        };
        
        await window.salvarMedidaAutomatico(medidaParaGitHub);
        console.log('✅ Medida salva no GitHub automaticamente');
        
      } catch (error) {
        console.warn('⚠️ Não foi possível salvar no GitHub:', error.message);
        // Não interromper o fluxo - medida já foi salva localmente
      }
    }
    
    return docRef.id;
  }

  async function listarMedidasPorAluno(alunoId, { limit = 50, order = 'desc' } = {}) {
    await getAlunoDoc(alunoId);
    const snap = await window.db.collection('alunos').doc(alunoId).collection('medidas').get();
    
    const medidas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Ordenar por data no JavaScript
    medidas.sort((a, b) => {
      const dataA = a.data ? new Date(a.data) : new Date(0);
      const dataB = b.data ? new Date(b.data) : new Date(0);
      return order === 'desc' ? dataB - dataA : dataA - dataB;
    });
    
    return medidas.slice(0, limit);
  }

  async function atualizarMedida(alunoId, medidaId, payload) {
    await getAlunoDoc(alunoId);
    const ref = window.db.collection('alunos').doc(alunoId).collection('medidas').doc(medidaId);
    await ref.set({ ...payload, atualizadoEm: new Date().toISOString() }, { merge: true });
  }

  async function excluirMedida(alunoId, medidaId) {
    await getAlunoDoc(alunoId);
    await window.db.collection('alunos').doc(alunoId).collection('medidas').doc(medidaId).delete();
  }

  // ======= Consultas globais (collectionGroup) =======
  // Ex.: últimas 20 faltas do sistema inteiro
  async function listarUltimasFaltasSistema({ limit = 20 } = {}) {
    try {
      // Nota: collectionGroup pode não ser suportado pelo Sistema Local
      // Como alternativa, buscaremos todas as faltas dos alunos
      const alunosSnap = await window.db.collection('alunos').get();
      const todasFaltas = [];
      
      for (const alunoDoc of alunosSnap.docs) {
        const faltasSnap = await alunoDoc.ref.collection('faltas').get();
        faltasSnap.docs.forEach(faltaDoc => {
          todasFaltas.push({
            id: faltaDoc.id,
            alunoId: alunoDoc.id,
            ...faltaDoc.data()
          });
        });
      }
      
      // Ordenar por data (mais recentes primeiro) e aplicar limite
      todasFaltas.sort((a, b) => {
        const dataA = a.data ? new Date(a.data) : new Date(0);
        const dataB = b.data ? new Date(b.data) : new Date(0);
        return dataB - dataA;
      });
      
      return todasFaltas.slice(0, limit);
    } catch (error) {
      console.error('Erro ao listar faltas do sistema:', error);
      return [];
    }
  }

  async function listarUltimasMedidasSistema({ limit = 20 } = {}) {
    try {
      // Buscar todas as medidas disciplinares
      const snap = await window.db.collection('medidas_disciplinares').get();

      const medidas = [];
      snap.forEach(doc => {
        const data = doc.data();
        medidas.push({ 
          id: doc.id, 
          alunoId: data.codigo_aluno,
          ...data 
        });
      });

      // Ordenar por data no JavaScript (mais recentes primeiro)
      medidas.sort((a, b) => {
        const dataA = a.data ? new Date(a.data) : new Date(0);
        const dataB = b.data ? new Date(b.data) : new Date(0);
        return dataB - dataA;
      });

      // Aplicar limite
      return medidas.slice(0, limit);
      
    } catch (error) {
      console.error('Erro ao listar medidas:', error);
      return [];
    }
  }

  // ======= UI bindings (opcional) =======

  async function popularTabelaFaltas(alunoId) {
    const tbody = document.getElementById('faltasTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    try {
      const itens = await listarFaltasPorAluno(alunoId, { limit: 100 });
      if (!itens.length) {
        tbody.innerHTML = '<tr><td colspan="5">Sem faltas para este aluno.</td></tr>';
        return;
      }
      tbody.innerHTML = itens.map(f =>
        `<tr>
          <td>${fmtDate(f.data)}</td>
          <td>${(f.motivo || '').replace(/</g, '&lt;')}</td>
          <td>${(f.observacoes || '').replace(/</g, '&lt;')}</td>
          <td>${fmtDate(f.criadoEm)}</td>
          <td>
            <button class="btn btn-sm" data-action="edit-falta" data-id="${f.id}" data-aluno="${alunoId}">Editar</button>
            <button class="btn btn-sm btn-danger" data-action="del-falta" data-id="${f.id}" data-aluno="${alunoId}">Excluir</button>
          </td>
        </tr>`
      ).join('');
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar: ${e.message}</td></tr>`;
    }
  }

  async function popularTabelaMedidas(alunoId) {
    const tbody = document.getElementById('medidasTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
      const itens = await listarMedidasPorAluno(alunoId, { limit: 100 });
      if (!itens.length) {
        tbody.innerHTML = '<tr><td colspan="6">Sem medidas para este aluno.</td></tr>';
        return;
      }
      tbody.innerHTML = itens.map(m =>
        `<tr>
          <td>${(m.tipo || '').replace(/</g, '&lt;')}</td>
          <td>${fmtDate(m.data)}</td>
          <td>${(m.descricao || '').replace(/</g, '&lt;')}</td>
          <td>${(m.responsavel || '').replace(/</g, '&lt;')}</td>
          <td>${fmtDate(m.criadoEm)}</td>
          <td>
            <button class="btn btn-sm" data-action="edit-medida" data-id="${m.id}" data-aluno="${alunoId}">Editar</button>
            <button class="btn btn-sm btn-danger" data-action="del-medida" data-id="${m.id}" data-aluno="${alunoId}">Excluir</button>
          </td>
        </tr>`
      ).join('');
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar: ${e.message}</td></tr>`;
    }
  }

  // ======= Eventos de formulário =======

  document.addEventListener('DOMContentLoaded', () => {
    // Criar Falta
    const faltaForm = document.getElementById('faltaForm');
    if (faltaForm) {
      const btn = faltaForm.querySelector('button[type="submit"]');
      faltaForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const vals = getFormValues(faltaForm);
        try {
          setLoading(btn, true);
          await criarFalta(vals);
          faltaForm.reset();
          if (vals.alunoId) await popularTabelaFaltas(vals.alunoId);
        } catch (e) {
          alert('Erro ao salvar falta: ' + e.message);
        } finally {
          setLoading(btn, false);
        }
      });
    }

    // Criar Medida
    const medidaForm = document.getElementById('medidaForm');
    if (medidaForm) {
      const btn = medidaForm.querySelector('button[type="submit"]');
      medidaForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const vals = getFormValues(medidaForm);
        try {
          setLoading(btn, true);
          await criarMedida(vals);
          medidaForm.reset();
          if (vals.alunoId) await popularTabelaMedidas(vals.alunoId);
        } catch (e) {
          alert('Erro ao salvar medida: ' + e.message);
        } finally {
          setLoading(btn, false);
        }
      });
    }

    // Delegação para botões de editar/excluir (exemplos simples com excluir)
    document.body.addEventListener('click', async (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el) return;
      const action = el.getAttribute('data-action');

      if (action === 'del-falta') {
        const alunoId = el.getAttribute('data-aluno');
        const faltaId = el.getAttribute('data-id');
        if (confirm('Excluir esta falta?')) {
          await excluirFalta(alunoId, faltaId);
          await popularTabelaFaltas(alunoId);
        }
      }

      if (action === 'del-medida') {
        const alunoId = el.getAttribute('data-aluno');
        const medidaId = el.getAttribute('data-id');
        if (confirm('Excluir esta medida?')) {
          await excluirMedida(alunoId, medidaId);
          await popularTabelaMedidas(alunoId);
        }
      }
    });

    // Se houver um seletor de aluno na página, você pode chamar:
    // popularTabelaFaltas(alunoIdSelecionado);
    // popularTabelaMedidas(alunoIdSelecionado);
  });

  // ======= FUNÇÕES PARA MEDIDAS DISCIPLINARES IMPORTADAS =======
  // Cache para registros recentes (3 minutos)
  let cacheRegistros = { data: null, timestamp: 0 };
  const CACHE_REGISTROS_DURATION = 3 * 60 * 1000; // 3 minutos

  async function carregarRegistrosRecentes() {
    try {
      const container = document.getElementById('registrosRecentes');
      if (!container) return;

      // Verificar cache
      const agora = Date.now();
      if (cacheRegistros.data && (agora - cacheRegistros.timestamp) < CACHE_REGISTROS_DURATION) {
        console.log('📋 Usando registros em cache');
        container.innerHTML = cacheRegistros.data;
        return;
      }

      console.log('🔄 Carregando registros recentes...');

      // Buscar medidas disciplinares recentes (limitado para melhor performance)
      const medidas = await listarUltimasMedidasSistema({ limit: 20 });
      
      console.log(`📊 Encontradas ${medidas.length} medidas disciplinares`);
      
      let html = '';
      
      if (medidas.length === 0) {
        html = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Nenhum registro encontrado</h3>
            <p>Importe dados do Excel ou cadastre novas medidas</p>
          </div>
        `;
      } else {
        html = '<div class="records-list">';
        
        // Processar apenas os primeiros 15 para otimizar
        const medidasLimitadas = medidas.slice(0, 15);
        
        for (const medida of medidasLimitadas) {
          const dataFormatada = medida.data ? new Date(medida.data).toLocaleDateString('pt-BR') : 'Data não informada';
          
          // Calcular pontos da medida
          const pontos = calcularPontosMedida(medida.tipo_medida, medida.dias_suspensao);
          const corPontos = pontos > 0 ? '#107c10' : pontos < 0 ? '#dc3545' : '#605e5c';
          const sinalPontos = pontos > 0 ? '+' : '';
          
          html += `
            <div class="record-item" style="border-left: 4px solid ${corPontos}; margin-bottom: 12px; padding: 12px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div class="record-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div class="record-type medida" style="background: ${corPontos}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">📋 ${medida.tipo_medida || 'Medida Disciplinar'}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: ${corPontos}; font-weight: bold; font-size: 14px;">${sinalPontos}${pontos}</span>
                  <div class="record-date" style="color: #6c757d; font-size: 12px;">${dataFormatada}</div>
                </div>
              </div>
              <div class="record-content">
                <div class="record-student" style="font-weight: bold; margin-bottom: 4px;">${medida.nome_aluno || 'Nome não informado'} (${medida.codigo_aluno || 'Código N/A'})</div>
                <div class="record-class" style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">Turma: ${medida.turma || 'N/A'}</div>
                <div class="record-description" style="margin-bottom: 4px;">${medida.especificacao || 'Sem especificação'}</div>
                ${medida.observacao ? `<div class="record-observation" style="font-size: 12px; color: #6c757d; font-style: italic;">Obs: ${medida.observacao}</div>` : ''}
                ${medida.nr_medida ? `<div class="record-number" style="font-size: 12px; color: #495057;">Nº: ${medida.nr_medida}</div>` : ''}
              </div>
            </div>
          `;
        }
        
        html += '</div>';
      }

      // Salvar no cache
      cacheRegistros = { data: html, timestamp: agora };
      container.innerHTML = html;

    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      if (document.getElementById('registrosRecentes')) {
        document.getElementById('registrosRecentes').innerHTML = `
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Erro ao carregar registros</h3>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Cache para estatísticas (5 minutos)
  let cacheEstatisticas = { data: null, timestamp: 0 };
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  async function carregarEstatisticasMedidas() {
    try {
      // Verificar cache
      const agora = Date.now();
      if (cacheEstatisticas.data && (agora - cacheEstatisticas.timestamp) < CACHE_DURATION) {
        console.log('📊 Usando estatísticas em cache');
        atualizarInterfaceEstatisticas(cacheEstatisticas.data);
        return;
      }

      console.log('📊 Carregando estatísticas de medidas...');
      
      // Buscar todas as medidas disciplinares
      const todasMedidas = await window.db.collection('medidas_disciplinares').get();
      
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - 7);
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioHoje = new Date(hoje);
      inicioHoje.setHours(0, 0, 0, 0);
      
      let medidasSemana = 0;
      let medidasMes = 0;
      let medidasHoje = 0;
      const alunosAfetados = new Set();
      
      todasMedidas.forEach(doc => {
        const data = doc.data();
        const dataMedida = data.data ? new Date(data.data) : null;
        
        if (dataMedida) {
          if (dataMedida >= inicioSemana) medidasSemana++;
          if (dataMedida >= inicioMes) medidasMes++;
          if (dataMedida >= inicioHoje) medidasHoje++;
        }
        
        const codigo = data.codigo_aluno;
        if (codigo) alunosAfetados.add(codigo);
      });

      // Salvar no cache
      const stats = { medidasHoje, medidasSemana, medidasMes, alunosAfetados: alunosAfetados.size };
      cacheEstatisticas = { data: stats, timestamp: agora };

      console.log(`📈 Estatísticas: Hoje: ${medidasHoje}, Semana: ${medidasSemana}, Mês: ${medidasMes}, Alunos: ${alunosAfetados.size}`);
      
      atualizarInterfaceEstatisticas(stats);

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  function atualizarInterfaceEstatisticas(stats) {
    const elemHoje = document.getElementById('totalFaltasHoje');
    const elemSemana = document.getElementById('totalMedidasSemana');
    const elemMes = document.getElementById('totalRegistrosMes');
    const elemAfetados = document.getElementById('alunosAfetados');
    
    if (elemHoje) elemHoje.textContent = stats.medidasHoje;
    if (elemSemana) elemSemana.textContent = stats.medidasSemana;
    if (elemMes) elemMes.textContent = stats.medidasMes;
    if (elemAfetados) elemAfetados.textContent = stats.alunosAfetados;
  }

  // Exponha algumas funções caso precise em outros módulos
  window.medidasModule = {
    criarFalta,
    listarFaltasPorAluno,
    atualizarFalta,
    excluirFalta,
    criarMedida,
    listarMedidasPorAluno,
    atualizarMedida,
    excluirMedida,
    listarUltimasFaltasSistema,
    listarUltimasMedidasSistema,
    popularTabelaFaltas,
    popularTabelaMedidas,
    carregarRegistrosRecentes,
    carregarEstatisticasMedidas,
  };

  // ======= FICHA DISCIPLINAR DO ALUNO =======
  
  // Carregar turmas disponíveis
  async function carregarTurmas() {
    try {
      const snapshot = await window.db.collection('alunos').get();
      const turmas = new Set();
      
      snapshot.forEach(doc => {
        const turma = doc.data().turma;
        if (turma && turma.trim()) {
          turmas.add(turma.trim());
        }
      });

      const selectTurma = document.getElementById('turmaConsulta');
      if (selectTurma) {
        selectTurma.innerHTML = '<option value="">Selecione uma turma...</option>';
        Array.from(turmas).sort().forEach(turma => {
          selectTurma.innerHTML += `<option value="${turma}">${turma}</option>`;
        });
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }

  // Carregar alunos por turma
  async function carregarAlunosPorTurma() {
    try {
      const selectTurma = document.getElementById('turmaConsulta');
      const selectAluno = document.getElementById('alunoConsulta');
      const fichaContainer = document.getElementById('fichaAluno');
      const btnExportar = document.getElementById('btnExportarPDF');
      
      if (!selectTurma || !selectAluno) return;
      
      const turmaSelecionada = selectTurma.value;
      
      // Limpar seleção anterior
      selectAluno.innerHTML = '<option value="">Carregando alunos...</option>';
      fichaContainer.style.display = 'none';
      btnExportar.disabled = true;
      
      if (!turmaSelecionada) {
        selectAluno.innerHTML = '<option value="">Primeiro selecione uma turma...</option>';
        return;
      }

      const snapshot = await window.db.collection('alunos')
        .where('turma', '==', turmaSelecionada)
        .get();
      
      const alunos = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        alunos.push({
          id: doc.id,
          nome: data.nome_completo || data.nome || 'Nome não informado',
          codigo: data.codigo || doc.id
        });
      });

      // Ordenar por nome
      alunos.sort((a, b) => a.nome.localeCompare(b.nome));

      selectAluno.innerHTML = '<option value="">Selecione um aluno...</option>';
      alunos.forEach(aluno => {
        selectAluno.innerHTML += `<option value="${aluno.id}">${aluno.nome}</option>`;
      });

    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      document.getElementById('alunoConsulta').innerHTML = '<option value="">Erro ao carregar alunos</option>';
    }
  }

  // Carregar ficha disciplinar completa
  async function carregarFichaDisciplinar() {
    try {
      const selectAluno = document.getElementById('alunoConsulta');
      const fichaContainer = document.getElementById('fichaAluno');
      const btnExportar = document.getElementById('btnExportarPDF');
      
      if (!selectAluno || !fichaContainer) return;
      
      const alunoId = selectAluno.value;
      
      if (!alunoId) {
        fichaContainer.style.display = 'none';
        btnExportar.disabled = true;
        return;
      }

      // Buscar dados do aluno
      const alunoDoc = await window.db.collection('alunos').doc(alunoId).get();
      if (!alunoDoc.exists) {
        throw new Error('Aluno não encontrado');
      }
      
      const dadosAluno = alunoDoc.data();
      
      // Buscar medidas disciplinares do aluno - tentativa múltipla de identificadores
      let medidas = [];
      
      // Tentar buscar por código do aluno
      if (dadosAluno.codigo) {
        const medidasPorCodigo = await window.db.collection('medidas_disciplinares')
          .where('codigo_aluno', '==', dadosAluno.codigo)
          .get();
        medidasPorCodigo.forEach(doc => {
          medidas.push(doc.data());
        });
      }
      
      // Se não encontrou por código, tentar por nome
      if (medidas.length === 0 && dadosAluno.nome_completo) {
        const medidasPorNome = await window.db.collection('medidas_disciplinares')
          .where('nome_aluno', '==', dadosAluno.nome_completo)
          .get();
        medidasPorNome.forEach(doc => {
          medidas.push(doc.data());
        });
      }

      // Ordenar as medidas por data no JavaScript (mais recentes primeiro)
      medidas.sort((a, b) => {
        const dataA = new Date(a.data || 0);
        const dataB = new Date(b.data || 0);
        return dataB - dataA;
      });

      // Verificar se precisa inicializar/atualizar a nota disciplinar
      if (typeof dadosAluno.nota_disciplinar === 'undefined') {
        console.log('Inicializando nota disciplinar para o aluno...');
        const notaCalculada = await atualizarNotaDisciplinar(alunoId, dadosAluno);
        dadosAluno.nota_disciplinar = notaCalculada;
      } else {
        // Verificar se a nota está muito desatualizada (mais de 1 hora)
        const ultimaAtualizacao = dadosAluno.ultima_atualizacao_nota;
        if (ultimaAtualizacao) {
          const agora = new Date();
          const ultimaData = new Date(ultimaAtualizacao);
          const diferencaHoras = (agora - ultimaData) / (1000 * 60 * 60);
          
          if (diferencaHoras > 1) {
            console.log('Nota disciplinar desatualizada, recalculando...');
            const notaCalculada = await atualizarNotaDisciplinar(alunoId, dadosAluno);
            dadosAluno.nota_disciplinar = notaCalculada;
          } else {
            console.log('Nota disciplinar está atualizada, usando cache.');
          }
        } else {
          // Se não tem timestamp, forçar recálculo uma vez
          console.log('Adicionando timestamp à nota disciplinar...');
          const notaCalculada = await atualizarNotaDisciplinar(alunoId, dadosAluno);
          dadosAluno.nota_disciplinar = notaCalculada;
        }
      }

      // Exibir dados pessoais
      exibirDadosPessoais(dadosAluno);
      
      // Exibir histórico de medidas
      exibirHistoricoMedidas(medidas);
      
      // Exibir resumo estatístico
      exibirResumoEstatistico(medidas);
      
      // Mostrar a ficha
      fichaContainer.style.display = 'block';
      btnExportar.disabled = false;
      
      // Armazenar dados para exportação
      window.dadosAlunoAtual = { 
        ...dadosAluno, 
        id: alunoId,
        medidas: medidas 
      };

    } catch (error) {
      console.error('Erro ao carregar ficha:', error);
      const fichaContainer = document.getElementById('fichaAluno');
      if (fichaContainer) {
        fichaContainer.innerHTML = `
          <div class="empty-ficha">
            <div class="empty-icon">⚠️</div>
            <h3>Erro ao carregar ficha</h3>
            <p>${error.message}</p>
          </div>
        `;
        fichaContainer.style.display = 'block';
      }
    }
  }

  // Exibir dados pessoais
  function exibirDadosPessoais(dados) {
    const container = document.getElementById('dadosPessoais');
    if (!container) return;

    const notaDisciplinar = dados.nota_disciplinar !== undefined ? dados.nota_disciplinar : 'Calculando...';
    const corNota = dados.nota_disciplinar >= 7 ? '#107c10' : dados.nota_disciplinar >= 5 ? '#fd7e14' : '#dc3545';
    
    const campos = [
      { label: 'Nome Completo', valor: dados.nome_completo || dados.nome || 'Não informado' },
      { label: 'Código', valor: dados.codigo || 'Não informado' },
      { label: 'Turma', valor: dados.turma || 'Não informada' },
      { label: 'Nota Disciplinar', valor: `<span style="color: ${corNota}; font-weight: bold; font-size: 16px;">${notaDisciplinar}</span>` },
      { label: 'Data de Nascimento', valor: dados.data_nascimento || 'Não informada' },
      { label: 'CPF', valor: dados.cpf || 'Não informado' },
      { label: 'Nome da Mãe', valor: dados.nome_mae || 'Não informado' },
      { label: 'Nome do Pai', valor: dados.nome_pai || 'Não informado' },
      { label: 'CPF Responsável', valor: dados.cpf_responsavel || 'Não informado' },
      { label: 'Telefone', valor: dados.telefone || 'Não informado' },
      { label: 'Endereço', valor: dados.endereco || 'Não informado' }
    ];

    container.innerHTML = campos.map(campo => `
      <div class="dado-item">
        <div class="dado-label">${campo.label}</div>
        <div class="dado-valor">${campo.valor}</div>
      </div>
    `).join('');
  }

  // Exibir histórico de medidas disciplinares
  function exibirHistoricoMedidas(medidas) {
    const container = document.getElementById('historicoMedidas');
    if (!container) return;

    if (medidas.length === 0) {
      container.innerHTML = `
        <div class="empty-ficha">
          <div class="empty-icon">📋</div>
          <h3>Nenhuma medida disciplinar</h3>
          <p>Este aluno não possui medidas disciplinares registradas.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = medidas.map(medida => {
      const data = medida.data ? new Date(medida.data).toLocaleDateString('pt-BR') : 'Data não informada';
      const pontos = calcularPontosMedida(medida.tipo_medida, medida.dias_suspensao);
      const corPontos = pontos > 0 ? '#107c10' : pontos < 0 ? '#dc3545' : '#605e5c';
      const sinalPontos = pontos > 0 ? '+' : '';
      
      return `
        <div class="historico-item medida">
          <div class="historico-header">
            <span class="historico-data">${data}</span>
            <span class="historico-tipo medida">${medida.tipo_medida || 'Medida'}</span>
            <span style="color: ${corPontos}; font-weight: bold; margin-left: 10px;">${sinalPontos}${pontos}</span>
          </div>
          <div class="historico-descricao">
            <strong>Especificação:</strong> ${medida.especificacao || 'Não especificada'}<br>
            ${medida.observacao ? `<strong>Observação:</strong> ${medida.observacao}<br>` : ''}
            ${medida.professor_responsavel ? `<strong>Professor:</strong> ${medida.professor_responsavel}<br>` : ''}
            ${medida.dias_suspensao ? `<strong>Dias de Suspensão:</strong> ${medida.dias_suspensao}<br>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Exibir resumo estatístico
  function exibirResumoEstatistico(medidas) {
    const container = document.getElementById('resumoEstatistico');
    if (!container) return;

    const totalMedidas = medidas.length;
    const medidas30Dias = medidas.filter(m => {
      if (!m.data) return false;
      const dataMedida = new Date(m.data);
      const agora = new Date();
      const dias30 = 30 * 24 * 60 * 60 * 1000;
      return (agora - dataMedida) <= dias30;
    }).length;

    const tiposMedidas = {};
    medidas.forEach(m => {
      const tipo = m.tipo_medida || 'Outros';
      tiposMedidas[tipo] = (tiposMedidas[tipo] || 0) + 1;
    });

    const tipoMaisFrequente = Object.keys(tiposMedidas).reduce((a, b) => 
      tiposMedidas[a] > tiposMedidas[b] ? a : b, 'Nenhum');

    container.innerHTML = `
      <div class="resumo-card danger">
        <span class="resumo-numero">${totalMedidas}</span>
        <div class="resumo-label">Total de Medidas</div>
      </div>
      <div class="resumo-card warning">
        <span class="resumo-numero">${medidas30Dias}</span>
        <div class="resumo-label">Últimos 30 dias</div>
      </div>
      <div class="resumo-card info">
        <span class="resumo-numero">${Object.keys(tiposMedidas).length}</span>
        <div class="resumo-label">Tipos Diferentes</div>
      </div>
      <div class="resumo-card">
        <span class="resumo-numero" style="font-size: 14px;">${tipoMaisFrequente}</span>
        <div class="resumo-label">Mais Frequente</div>
      </div>
    `;
  }

  // Exportar ficha para PDF
  async function exportarFichaPDF() {
    if (!window.dadosAlunoAtual) {
      alert('Nenhum aluno selecionado para exportação');
      return;
    }

    try {
      // Verificar se jsPDF está disponível
      if (typeof window.jsPDF === 'undefined') {
        alert('Biblioteca PDF não carregada. Usando método alternativo...');
        exportarFichaHTML();
        return;
      }

      const dadosAluno = window.dadosAlunoAtual;
      const dataAtual = new Date().toLocaleDateString('pt-BR');

      // Buscar dados de frequência ANTES de gerar o PDF
      let dadosFrequencia = null;
      try {
        if (typeof window.buscarFrequenciaPorCodigo === 'function') {
          console.log('🔍 Buscando frequência para PDF - Aluno:', dadosAluno.codigo);
          dadosFrequencia = await window.buscarFrequenciaPorCodigo(dadosAluno.codigo);
          console.log('📋 Dados de frequência obtidos para PDF:', dadosFrequencia);
        } else {
          console.log('❌ Função buscarFrequenciaPorCodigo não encontrada para PDF');
        }
      } catch (error) {
        console.log('❌ Erro ao buscar frequência para PDF:', error);
      }
      
      // Criar novo documento PDF
      const { jsPDF } = window.jsPDF;
      const pdf = new jsPDF();
      
      // Configuração de fonte e espaçamento
      let yPos = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;

      // Tentar adicionar logo da escola
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = function() {
          // Adicionar logo no canto superior esquerdo
          pdf.addImage(logoImg, 'JPEG', margin, 10, 30, 25);
        };
        logoImg.src = '../assets/images/logo-escola.jpeg';
        
        // Aguardar carregamento da imagem
        await new Promise((resolve) => {
          logoImg.onload = () => {
            pdf.addImage(logoImg, 'JPEG', margin, 10, 30, 25);
            resolve();
          };
          logoImg.onerror = () => {
            console.log('Logo não encontrado, continuando sem logo');
            resolve();
          };
        });
      } catch (error) {
        console.log('Erro ao carregar logo:', error);
      }

      // Cabeçalho (ajustar posição por causa do logo)
      yPos = 15;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FICHA DISCIPLINAR DO ALUNO', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('ESCOLA [NOME DA ESCOLA]', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${dataAtual}`, pageWidth / 2, yPos, { align: 'center' });
      
      // Linha separadora
      yPos += 10;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Seção: Dados Pessoais
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('👤 DADOS PESSOAIS', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const notaDisciplinar = dadosAluno.nota_disciplinar !== undefined ? dadosAluno.nota_disciplinar : 'N/A';
      
      const dadosPessoais = [
        ['Nome:', dadosAluno.nome_completo || 'Não informado'],
        ['Código:', dadosAluno.codigo || 'Não informado'],
        ['Turma:', dadosAluno.turma || 'Não informada'],
        ['Nota Disciplinar:', notaDisciplinar],
        ['Data de Nascimento:', dadosAluno.data_nascimento || 'Não informada'],
        ['CPF:', dadosAluno.cpf || 'Não informado'],
        ['Nome da Mãe:', dadosAluno.nome_mae || 'Não informado'],
        ['Nome do Pai:', dadosAluno.nome_pai || 'Não informado'],
        ['CPF Responsável:', dadosAluno.cpf_responsavel || 'Não informado']
      ];

      dadosPessoais.forEach(([label, valor]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(valor, margin + 40, yPos);
        yPos += lineHeight;
      });

      yPos += 10;


      // Seção de Frequência
      if (dadosFrequencia && dadosFrequencia.faltas && dadosFrequencia.faltas.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`📅 REGISTRO DE FREQUÊNCIA`, margin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total de faltas: ${dadosFrequencia.faltas.length}`, margin, yPos);
        yPos += lineHeight;
        
        if (dadosFrequencia.estatisticas) {
          pdf.text(`Total de presenças: ${dadosFrequencia.estatisticas.totalPresencas}`, margin, yPos);
          yPos += lineHeight;
          pdf.text(`Percentual de presença: ${dadosFrequencia.estatisticas.percentualPresenca}%`, margin, yPos);
          yPos += lineHeight;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Detalhes das faltas:`, margin, yPos);
        yPos += lineHeight;
        
        pdf.setFont('helvetica', 'normal');
        dadosFrequencia.faltas.forEach((falta, index) => {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          const dataFormatada = `${falta.dia}/08/2025`;
          const tipo = falta.marcacao === 'F' ? 'Falta' : falta.marcacao === 'FC' ? 'Falta Compensada' : 'Atestado';
          pdf.text(`• ${dataFormatada} - ${tipo}`, margin + 5, yPos);
          yPos += lineHeight;
        });
        
        yPos += 10;
      } else if (dadosFrequencia) {
        // Mostrar mesmo se não houver faltas
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`📅 REGISTRO DE FREQUÊNCIA`, margin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Nenhuma falta registrada`, margin, yPos);
        yPos += lineHeight;
        
        if (dadosFrequencia.estatisticas) {
          pdf.text(`Total de presenças: ${dadosFrequencia.estatisticas.totalPresencas}`, margin, yPos);
          yPos += lineHeight;
          pdf.text(`Percentual de presença: ${dadosFrequencia.estatisticas.percentualPresenca}%`, margin, yPos);
          yPos += lineHeight;
        }
        
        yPos += 10;
      }

      // Seção: Histórico de Medidas Disciplinares
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`⚖️ HISTÓRICO DE MEDIDAS DISCIPLINARES (${dadosAluno.medidas.length} registros)`, margin, yPos);
      yPos += 10;

      if (dadosAluno.medidas.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Nenhuma medida disciplinar registrada.', margin, yPos);
      } else {
        pdf.setFontSize(10);
        
        dadosAluno.medidas.forEach((medida, index) => {
          // Verificar se precisa de nova página
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }

          const data = medida.data ? new Date(medida.data).toLocaleDateString('pt-BR') : 'Data não informada';
          
          // Cabeçalho da medida
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. Data: ${data} - Tipo: ${medida.tipo_medida || 'Não especificado'}`, margin, yPos);
          yPos += lineHeight;

          // Especificação
          if (medida.especificacao) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Especificação:', margin + 5, yPos);
            pdf.setFont('helvetica', 'normal');
            
            // Quebrar texto longo
            const especificacao = medida.especificacao;
            const linhas = pdf.splitTextToSize(especificacao, pageWidth - margin - 60);
            pdf.text(linhas, margin + 45, yPos);
            yPos += lineHeight * linhas.length;
          }

          // Observação
          if (medida.observacao) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Observação:', margin + 5, yPos);
            pdf.setFont('helvetica', 'normal');
            
            const observacao = medida.observacao;
            const linhas = pdf.splitTextToSize(observacao, pageWidth - margin - 60);
            pdf.text(linhas, margin + 45, yPos);
            yPos += lineHeight * linhas.length;
          }

          // Professor responsável
          if (medida.professor_responsavel) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Professor:', margin + 5, yPos);
            pdf.setFont('helvetica', 'normal');
            pdf.text(medida.professor_responsavel, margin + 45, yPos);
            yPos += lineHeight;
          }

          yPos += 5; // Espaço entre medidas
        });
      }

      // Rodapé
      yPos += 20;
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Documento gerado automaticamente pelo Sistema Disciplinar', pageWidth / 2, yPos, { align: 'center' });

      // Salvar o PDF
      const nomeArquivo = `Ficha_Disciplinar_${dadosAluno.nome_completo?.replace(/[^a-zA-Z0-9]/g, '_') || 'Aluno'}_${dataAtual.replace(/\//g, '-')}.pdf`;
      pdf.save(nomeArquivo);

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message + '. Tentando método alternativo...');
      exportarFichaHTML();
    }
  }

  // Método alternativo de exportação (abre em nova janela para impressão)
  async function exportarFichaHTML() {
    const dadosAluno = window.dadosAlunoAtual;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Buscar dados de frequência para HTML
    let dadosFrequencia = null;
    try {
      if (typeof window.buscarFrequenciaPorCodigo === 'function') {
        console.log('🔍 Buscando frequência para HTML - Aluno:', dadosAluno.codigo);
        dadosFrequencia = await window.buscarFrequenciaPorCodigo(dadosAluno.codigo);
        console.log('📋 Dados de frequência obtidos para HTML:', dadosFrequencia);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar frequência para HTML:', error);
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha Disciplinar - ${dadosAluno.nome_completo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { background: #f0f0f0; padding: 8px; font-weight: bold; margin-bottom: 10px; }
          .data-item { margin-bottom: 5px; }
          .data-label { font-weight: bold; display: inline-block; min-width: 120px; }
          .medida-item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; page-break-inside: avoid; }
          .medida-header { font-weight: bold; margin-bottom: 5px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } .header { page-break-after: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FICHA DISCIPLINAR DO ALUNO</h1>
          <p>Gerado em: ${dataAtual}</p>
        </div>
        
        <div class="section">
          <div class="section-title">👤 DADOS PESSOAIS</div>
          <div class="data-item"><span class="data-label">Nome:</span> ${dadosAluno.nome_completo || 'Não informado'}</div>
          <div class="data-item"><span class="data-label">Código:</span> ${dadosAluno.codigo || 'Não informado'}</div>
          <div class="data-item"><span class="data-label">Turma:</span> ${dadosAluno.turma || 'Não informada'}</div>
          <div class="data-item"><span class="data-label">Nota Disciplinar:</span> ${dadosAluno.nota_disciplinar !== undefined ? dadosAluno.nota_disciplinar : 'N/A'}</div>
          <div class="data-item"><span class="data-label">Data Nasc.:</span> ${dadosAluno.data_nascimento || 'Não informada'}</div>
          <div class="data-item"><span class="data-label">CPF:</span> ${dadosAluno.cpf || 'Não informado'}</div>
          <div class="data-item"><span class="data-label">Nome da Mãe:</span> ${dadosAluno.nome_mae || 'Não informado'}</div>
        </div>

        ${dadosFrequencia ? `
        <div class="section">
          <div class="section-title">📅 REGISTRO DE FREQUÊNCIA</div>
          ${dadosFrequencia.faltas && dadosFrequencia.faltas.length > 0 ? `
            <div class="data-item"><span class="data-label">Total de faltas:</span> ${dadosFrequencia.faltas.length}</div>
            ${dadosFrequencia.estatisticas ? `
              <div class="data-item"><span class="data-label">Total de presenças:</span> ${dadosFrequencia.estatisticas.totalPresencas}</div>
              <div class="data-item"><span class="data-label">Percentual de presença:</span> ${dadosFrequencia.estatisticas.percentualPresenca}%</div>
            ` : ''}
            <div style="margin-top: 10px;"><strong>Detalhes das faltas:</strong></div>
            ${dadosFrequencia.faltas.map(falta => {
              const dataFormatada = `${falta.dia}/08/2025`;
              const tipo = falta.marcacao === 'F' ? 'Falta' : falta.marcacao === 'FC' ? 'Falta Compensada' : 'Atestado';
              return `<div style="margin-left: 20px;">• ${dataFormatada} - ${tipo}</div>`;
            }).join('')}
          ` : `
            <div class="data-item">Nenhuma falta registrada</div>
            ${dadosFrequencia.estatisticas ? `
              <div class="data-item"><span class="data-label">Total de presenças:</span> ${dadosFrequencia.estatisticas.totalPresencas}</div>
              <div class="data-item"><span class="data-label">Percentual de presença:</span> ${dadosFrequencia.estatisticas.percentualPresenca}%</div>
            ` : ''}
          `}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">⚖️ HISTÓRICO DE MEDIDAS DISCIPLINARES (${dadosAluno.medidas.length} registros)</div>
          ${dadosAluno.medidas.length === 0 ? 
            '<p>Nenhuma medida disciplinar registrada.</p>' :
            dadosAluno.medidas.map((medida, index) => `
              <div class="medida-item">
                <div class="medida-header">
                  ${index + 1}. Data: ${medida.data ? new Date(medida.data).toLocaleDateString('pt-BR') : 'Não informada'} - 
                  Tipo: ${medida.tipo_medida || 'Não especificado'}
                </div>
                <div><strong>Especificação:</strong> ${medida.especificacao || 'Não especificada'}</div>
                ${medida.observacao ? `<div><strong>Observação:</strong> ${medida.observacao}</div>` : ''}
                ${medida.professor_responsavel ? `<div><strong>Professor:</strong> ${medida.professor_responsavel}</div>` : ''}
              </div>
            `).join('')
          }
        </div>

        <div class="footer">
          <p>Documento gerado automaticamente pelo Sistema Disciplinar</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }

  // ======= SISTEMA DE PONTUAÇÃO DISCIPLINAR =======
  
  // Calcular pontos de uma medida disciplinar
  function calcularPontosMedida(tipoMedida, diasSuspensao = 1) {
    if (!tipoMedida) return 0;
    
    // Normalizar o tipo de medida para minúsculas e remover acentos/espaços extras
    const tipoNormalizado = tipoMedida.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
    
    // Mapeamento flexível de tipos de medida
    const mapeamentos = {
      // Tipos positivos
      'fato observado positivo': 0.1,
      'fato positivo': 0.1,
      'comportamento positivo': 0.1,
      'observacao positiva': 0.1,
      'elogio': 0.1,
      
      // Tipos negativos
      'fato observado negativo': -0.1,
      'fato negativo': -0.1,
      'comportamento negativo': -0.1,
      'observacao negativa': -0.1,
      'ocorrencia': -0.1,
      
      // Advertências
      'advertencia verbal': -0.3,
      'advertencia escrita': -0.3,
      'advertencia': -0.3,
      'adv verbal': -0.3,
      'adv escrita': -0.3,
      'chamada atencao': -0.3,
      
      // Suspensões
      'suspensao': -0.5 * parseInt(diasSuspensao || 1),
      'suspensao temporaria': -0.5 * parseInt(diasSuspensao || 1),
      'afastamento': -0.5 * parseInt(diasSuspensao || 1),
      
      // Ações educativas
      'acao educativa': -1.0,
      'medida educativa': -1.0,
      'atividade educativa': -1.0,
      'trabalho educativo': -1.0,
      'orientacao educativa': -1.0,
      'encaminhamento': -1.0
    };
    
    // Buscar correspondência exata ou parcial
    let pontos = mapeamentos[tipoNormalizado];
    
    // Se não encontrou correspondência exata, tentar busca parcial
    if (pontos === undefined) {
      for (const [tipo, valor] of Object.entries(mapeamentos)) {
        if (tipoNormalizado.includes(tipo) || tipo.includes(tipoNormalizado)) {
          pontos = valor;
          break;
        }
      }
    }
    
    console.log(`Tipo: "${tipoMedida}" → Normalizado: "${tipoNormalizado}" → Pontos: ${pontos || 0}`);
    return pontos || 0;
  }

  // Calcular nota disciplinar total de um aluno
  async function calcularNotaDisciplinar(alunoId, dadosAluno = null) {
    try {
      let notaBase = 8.0; // Nota inicial
      
      // Se não passou os dados do aluno, buscar
      if (!dadosAluno) {
        const alunoDoc = await window.db.collection('alunos').doc(alunoId).get();
        if (!alunoDoc.exists) return notaBase;
        dadosAluno = alunoDoc.data();
      }

      // Buscar todas as medidas disciplinares do aluno
      let medidas = [];
      
      if (dadosAluno.codigo) {
        const medidasPorCodigo = await window.db.collection('medidas_disciplinares')
          .where('codigo_aluno', '==', dadosAluno.codigo)
          .get();
        medidasPorCodigo.forEach(doc => {
          medidas.push(doc.data());
        });
      }
      
      if (medidas.length === 0 && dadosAluno.nome_completo) {
        const medidasPorNome = await window.db.collection('medidas_disciplinares')
          .where('nome_aluno', '==', dadosAluno.nome_completo)
          .get();
        medidasPorNome.forEach(doc => {
          medidas.push(doc.data());
        });
      }

      // Calcular pontos das medidas
      let totalPontos = 0;
      medidas.forEach(medida => {
        const pontos = calcularPontosMedida(medida.tipo_medida, medida.dias_suspensao);
        totalPontos += pontos;
      });

      // Nota final = nota base + pontos acumulados (não pode ser menor que 0)
      const notaFinal = Math.max(0, notaBase + totalPontos);
      return Math.round(notaFinal * 10) / 10; // Arredondar para 1 casa decimal
      
    } catch (error) {
      console.error('Erro ao calcular nota disciplinar:', error);
      return 8.0;
    }
  }

  // Atualizar nota disciplinar de um aluno no Sistema Local
  async function atualizarNotaDisciplinar(alunoId, dadosAluno = null) {
    try {
      const novaNota = await calcularNotaDisciplinar(alunoId, dadosAluno);
      
      await window.db.collection('alunos').doc(alunoId).update({
        nota_disciplinar: novaNota,
        ultima_atualizacao_nota: new Date().toISOString()
      });
      
      console.log(`Nota disciplinar atualizada para ${novaNota} (aluno: ${alunoId})`);
      return novaNota;
    } catch (error) {
      console.error('Erro ao atualizar nota disciplinar:', error);
      return null;
    }
  }

  // Inicializar notas disciplinares para todos os alunos
  async function inicializarNotasDisciplinares() {
    try {
      console.log('Iniciando inicialização das notas disciplinares...');
      
      const snapshot = await window.db.collection('alunos').get();
      let contadorProcessados = 0;
      let contadorAtualizados = 0;
      
      for (const doc of snapshot.docs) {
        const dadosAluno = doc.data();
        
        // Se o aluno não tem nota disciplinar, calcular e definir
        if (typeof dadosAluno.nota_disciplinar === 'undefined') {
          const novaNota = await calcularNotaDisciplinar(doc.id, dadosAluno);
          
          await window.db.collection('alunos').doc(doc.id).update({
            nota_disciplinar: novaNota,
            ultima_atualizacao_nota: new Date().toISOString()
          });
          
          contadorAtualizados++;
        }
        
        contadorProcessados++;
      }
      
      console.log(`Processados: ${contadorProcessados} alunos, Atualizados: ${contadorAtualizados} alunos`);
      return { processados: contadorProcessados, atualizados: contadorAtualizados };
      
    } catch (error) {
      console.error('Erro ao inicializar notas disciplinares:', error);
      throw error;
    }
  }

  // Função para recalcular todas as notas (útil para manutenção)
  async function recalcularTodasNotas() {
    try {
      console.log('Recalculando todas as notas disciplinares...');
      showMessage('Recalculando notas disciplinares...', 'loading');
      
      const snapshot = await window.db.collection('alunos').get();
      let contador = 0;
      let detalhes = [];
      
      for (const doc of snapshot.docs) {
        const dadosAluno = doc.data();
        const notaAnterior = dadosAluno.nota_disciplinar;
        const novaNota = await atualizarNotaDisciplinar(doc.id, dadosAluno);
        
        detalhes.push({
          nome: dadosAluno.nome_completo || dadosAluno.nome,
          notaAnterior: notaAnterior || 'N/A',
          novaNota: novaNota
        });
        
        contador++;
        
        // Mostrar progresso
        if (contador % 10 === 0) {
          console.log(`Processados ${contador}/${snapshot.size} alunos...`);
        }
      }
      
      console.log(`Recalculadas ${contador} notas disciplinares`);
      console.table(detalhes);
      
      showMessage(`✅ ${contador} notas disciplinares recalculadas!`, 'success');
      return { contador, detalhes };
      
    } catch (error) {
      console.error('Erro ao recalcular notas:', error);
      showMessage('Erro ao recalcular notas: ' + error.message, 'error');
      throw error;
    }
  }

  // Função para analisar tipos de medida existentes no banco
  async function analisarTiposMedidas() {
    try {
      console.log('Analisando tipos de medidas existentes...');
      
      const snapshot = await window.db.collection('medidas_disciplinares').get();
      const tipos = new Map();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const tipo = data.tipo_medida;
        if (tipo) {
          if (tipos.has(tipo)) {
            tipos.set(tipo, tipos.get(tipo) + 1);
          } else {
            tipos.set(tipo, 1);
          }
        }
      });
      
      console.log('Tipos de medidas encontrados:');
      const tiposArray = Array.from(tipos.entries()).sort((a, b) => b[1] - a[1]);
      tiposArray.forEach(([tipo, count]) => {
        const pontos = calcularPontosMedida(tipo);
        console.log(`"${tipo}" (${count}x) → ${pontos} pontos`);
      });
      
      return tiposArray;
      
    } catch (error) {
      console.error('Erro ao analisar tipos de medidas:', error);
      throw error;
    }
  }

  // Expor novas funções
  window.carregarTurmas = carregarTurmas;
  window.carregarAlunosPorTurma = carregarAlunosPorTurma;
  window.carregarFichaDisciplinar = carregarFichaDisciplinar;
  window.exportarFichaPDF = exportarFichaPDF;
  
  // Expor funções de pontuação
  window.calcularPontosMedida = calcularPontosMedida;
  window.calcularNotaDisciplinar = calcularNotaDisciplinar;
  window.atualizarNotaDisciplinar = atualizarNotaDisciplinar;
  window.inicializarNotasDisciplinares = inicializarNotasDisciplinares;
  window.recalcularTodasNotas = recalcularTodasNotas;
  window.analisarTiposMedidas = analisarTiposMedidas;

  // Expor funções globais
  window.carregarRegistrosRecentes = carregarRegistrosRecentes;
  window.carregarEstatisticasMedidas = carregarEstatisticasMedidas;

  // ========================================
  // INTEGRAÇÃO COM SINCRONIZAÇÃO EM TEMPO REAL
  // ========================================
  
  // Integrar com sistema de sincronização GitHub
  function integrarSincronizacao() {
    console.log('🔄 Integrando medidas disciplinares com sincronização em tempo real');

    // Listener para dados sincronizados do GitHub
    window.addEventListener('dadosSincronizados', function(event) {
      console.log('📡 Dados sincronizados detectados - recarregando medidas disciplinares');
      
      // Invalidar caches primeiro
      cacheRegistros = { data: null, timestamp: 0 };
      cacheEstatisticas = { data: null, timestamp: 0 };
      
      // Recarregar estatísticas
      setTimeout(() => {
        carregarEstatisticasMedidas();
      }, 100);

      // Recarregar registros recentes
      setTimeout(() => {
        carregarRegistrosRecentes();
      }, 200);

      // Se há uma ficha disciplinar aberta, recarregar
      const alunoConsulta = document.getElementById('alunoConsulta');
      if (alunoConsulta && alunoConsulta.value) {
        setTimeout(() => {
          if (typeof carregarFichaDisciplinar === 'function') {
            carregarFichaDisciplinar();
          }
        }, 300);
      }
      
      // Recarregar turmas e alunos se necessário
      setTimeout(() => {
        if (typeof carregarTurmas === 'function') {
          carregarTurmas();
        }
      }, 400);
    });

    // Modificar função de salvar para usar GitHub
    const originalCriarMedida = criarMedida;
    criarMedida = async function(data) {
      try {
        const resultado = await originalCriarMedida(data);
        
        // Sincronizar com GitHub se disponível
        if (window.gitHubSync && window.gitHubSync.podeEscrever()) {
          try {
            // Obter dados completos atualizados
            const dadosCompletos = await obterDadosCompletos();
            await window.gitHubSync.salvarDadosAutomatico(
              dadosCompletos, 
              'Adicionar medida disciplinar',
              `Aluno: ${data.nome_aluno || data.codigo_aluno}\nTipo: ${data.tipo_medida}\nData: ${data.data}`
            );
          } catch (syncError) {
            console.warn('Aviso: Erro na sincronização automática:', syncError.message);
            // Não falhar a operação principal por erro de sync
          }
        }

        return resultado;
      } catch (error) {
        console.error('Erro ao criar medida:', error);
        throw error;
      }
    };
  }

  // Obter dados completos para sincronização
  async function obterDadosCompletos() {
    try {
      const dadosCompletos = {
        alunos: {},
        medidas_disciplinares: {},
        frequencia_diaria: {},
        timestamp: new Date().toISOString()
      };

      // Carregar alunos
      const alunosSnap = await window.db.collection('alunos').get();
      alunosSnap.forEach(doc => {
        dadosCompletos.alunos[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      // Carregar medidas disciplinares
      const medidasSnap = await window.db.collection('medidas_disciplinares').get();
      medidasSnap.forEach(doc => {
        dadosCompletos.medidas_disciplinares[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      return dadosCompletos;
    } catch (error) {
      console.error('Erro ao obter dados completos:', error);
      throw error;
    }
  }

  // Inicializar integração quando estiver pronto
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(integrarSincronizacao, 2000);
  });
})();
