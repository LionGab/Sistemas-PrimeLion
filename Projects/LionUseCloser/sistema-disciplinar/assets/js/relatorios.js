// relatorios.js — Relatórios com subcoleções e collectionGroup
// Exemplos de relatórios:
// - Por aluno: totais, intervalos por data.
// - Globais: últimos registros, contagens no período, ranking por turma.

// Requisitos no HTML (exemplo):
// - Inputs para filtros: dataInicio, dataFim, alunoId, turma
// - Containers de saída: #relatorioAluno, #relatorioGlobal
// - local-db.js deve ter window.db

(function () {
  'use strict';

  if (!window.db) {
    console.error('Sistema Local (window.db) não encontrado. Verifique local-db.js');
    return;
  }

  function parseDate(s) {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function inRange(dISO, start, end) {
    if (!dISO) return false;
    const d = new Date(dISO);
    if (Number.isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }

  // ======= Relatórios por aluno =======

  async function relatorioPorAluno(alunoId, { dataInicio, dataFim } = {}) {
    if (!alunoId) throw new Error('alunoId é obrigatório');

    const start = parseDate(dataInicio);
    const end = parseDate(dataFim);
    const alunoRef = window.db.collection('alunos').doc(alunoId);

    // Faltas
    const faltasSnap = await alunoRef.collection('faltas').get();
    const faltas = faltasSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(f => inRange(f.data, start, end));

    // Medidas - buscar na coleção principal filtrando por código do aluno
    const medidasSnap = await window.db.collection('medidas_disciplinares')
      .where('codigo_aluno', '==', alunoId).get();
    const medidas = medidasSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => inRange(m.data, start, end));

    // Agregações simples
    const totalFaltas = faltas.length;
    const totaisPorTipoMedida = medidas.reduce((acc, m) => {
      const k = (m.tipo || 'sem_tipo');
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    return {
      alunoId,
      periodo: { de: dataInicio || null, ate: dataFim || null },
      totalFaltas,
      faltas,
      totalMedidas: medidas.length,
      totaisPorTipoMedida,
      medidas,
    };
  }

  // ======= Relatórios globais com collectionGroup =======

  async function relatorioGlobal({ dataInicio, dataFim, turma } = {}) {
    const start = parseDate(dataInicio);
    const end = parseDate(dataFim);

    // Busca global de faltas e medidas
    const faltasSnap = await window.db.collectionGroup('faltas').get();
    const medidasSnap = await window.db.collection('medidas_disciplinares').get();

    // Monta registros com alunoId
    const faltas = faltasSnap.docs.map(d => {
      const path = d.ref.path.split('/'); // ["alunos", "{alunoId}", "faltas", "{faltaId}"]
      const alunoId = path[1];
      return { id: d.id, alunoId, ...d.data() };
    }).filter(f => inRange(f.data, start, end));

    const medidas = medidasSnap.docs.map(d => {
      const data = d.data();
      return { 
        id: d.id, 
        alunoId: data.codigo_aluno,
        data: data.data,
        ...data 
      };
    }).filter(m => inRange(m.data, start, end));

    // Se filtrar por turma, precisamos ler alunos para enriquecer (cache simples)
    const alunosTurma = new Map(); // alunoId -> { turma, nome, ... }

    async function getAlunoInfo(alunoId) {
      if (alunosTurma.has(alunoId)) return alunosTurma.get(alunoId);
      const snap = await window.db.collection('alunos').doc(alunoId).get();
      const info = snap.exists ? { id: snap.id, ...snap.data() } : { id: alunoId, turma: null };
      alunosTurma.set(alunoId, info);
      return info;
    }

    // Aplica filtro de turma se solicitado
    let faltasFiltradas = [];
    for (const f of faltas) {
      if (!turma) { faltasFiltradas.push(f); continue; }
      const info = await getAlunoInfo(f.alunoId);
      if ((info.turma || '') === turma) faltasFiltradas.push({ ...f, aluno: info });
    }

    let medidasFiltradas = [];
    for (const m of medidas) {
      if (!turma) { medidasFiltradas.push(m); continue; }
      const info = await getAlunoInfo(m.alunoId);
      if ((info.turma || '') === turma) medidasFiltradas.push({ ...m, aluno: info });
    }

    // Agregações
    const totalFaltas = faltasFiltradas.length;
    const totalMedidas = medidasFiltradas.length;

    const faltasPorDia = faltasFiltradas.reduce((acc, f) => {
      const dia = (f.data || '').slice(0, 10);
      acc[dia] = (acc[dia] || 0) + 1;
      return acc;
    }, {});

    const medidasPorTipo = medidasFiltradas.reduce((acc, m) => {
      const k = (m.tipo || 'sem_tipo');
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    return {
      periodo: { de: dataInicio || null, ate: dataFim || null },
      turma: turma || null,
      totalFaltas,
      totalMedidas,
      faltasPorDia,
      medidasPorTipo,
      faltas: faltasFiltradas,
      medidas: medidasFiltradas,
    };
  }

  // ======= UI (exemplos) =======

  function renderJSON(elId, obj) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = JSON.stringify(obj, null, 2);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const formAluno = document.getElementById('relatorioAlunoForm');
    if (formAluno) {
      formAluno.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const data = Object.fromEntries(new FormData(formAluno).entries());
        try {
          const rel = await relatorioPorAluno(data.alunoId, {
            dataInicio: data.dataInicio || null,
            dataFim: data.dataFim || null,
          });
          renderJSON('relatorioAluno', rel);
        } catch (e) {
          alert('Erro no relatório do aluno: ' + e.message);
        }
      });
    }

    const formGlobal = document.getElementById('relatorioGlobalForm');
    if (formGlobal) {
      formGlobal.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const data = Object.fromEntries(new FormData(formGlobal).entries());
        try {
          const rel = await relatorioGlobal({
            dataInicio: data.dataInicio || null,
            dataFim: data.dataFim || null,
            turma: data.turma || null,
          });
          renderJSON('relatorioGlobal', rel);
        } catch (e) {
          alert('Erro no relatório global: ' + e.message);
        }
      });
    }
  });

  // ======= FUNÇÃO PARA CARREGAR DADOS PROCESSADOS =======
  async function carregarDadosRelatorios() {
    try {
      if (!window.db) {
        if (typeof window.localDb !== "undefined" && window.localDb.loaded) {
          window.db = window.db;
        } else {
          throw new Error('Sistema Local não carregado');
        }
      }

      console.log('Carregando dados para relatórios...');

      // Carregar alunos
      const alunosSnapshot = await db.collection('alunos').get();
      const alunos = {};
      alunosSnapshot.forEach(doc => {
        const data = doc.data();
        alunos[doc.id] = {
          id: doc.id,
          codigo: data.codigo || doc.id,
          nome: data.nome_completo || data.nome || '',
          turma: data.turma || '',
          responsavel: data.responsavel || ''
        };
      });

      // Carregar medidas disciplinares
      const medidasSnapshot = await db.collection('medidas_disciplinares').get();
      const medidas = [];
      medidasSnapshot.forEach(doc => {
        const data = doc.data();
        medidas.push({
          id: doc.id,
          alunoId: data.codigo_aluno,
          data: data.data,
          tipo: data.tipo_medida || 'Não especificado',
          especificacao: data.especificacao || '',
          observacao: data.observacao || '',
          ...data
        });
      });

      // Processar dados combinados
      const processedData = [];
      
      Object.values(alunos).forEach(aluno => {
        const medidasAluno = medidas.filter(m => m.alunoId === aluno.codigo || m.alunoId === aluno.id);
        
        processedData.push({
          id: aluno.id,
          codigo: aluno.codigo,
          nome: aluno.nome,
          turma: aluno.turma,
          responsavel: aluno.responsavel,
          faltas: [], // Por enquanto vazio
          faltasInjustificadas: 0,
          medidas: medidasAluno,
          totalMedidas: medidasAluno.length,
          statusRisco: calcularRisco(0, medidasAluno.length),
          ultimaOcorrencia: medidasAluno.length > 0 ? 
            new Date(Math.max(...medidasAluno.map(m => new Date(m.data).getTime()))) : null
        });
      });

      // Definir variável global para compatibilidade
      window.processedDataRelatorios = processedData;

      console.log(`Dados carregados: ${Object.keys(alunos).length} alunos, ${medidas.length} medidas`);
      return processedData;
      
    } catch (error) {
      console.error('Erro ao carregar dados para relatórios:', error);
      throw error;
    }
  }

  function calcularRisco(faltas, medidas) {
    const score = faltas + (medidas * 2);
    if (score >= 10) return 'Crítico';
    if (score >= 6) return 'Alto';
    if (score >= 3) return 'Médio';
    return 'Baixo';
  }

  // Expor para reuso
  window.relatoriosModule = {
    relatorioPorAluno,
    relatorioGlobal,
    carregarDadosRelatorios,
  };

  // Expor função globalmente para compatibilidade
  window.carregarDadosRelatorios = carregarDadosRelatorios;
})();
