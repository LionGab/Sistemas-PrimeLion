// gestao.js — CRUD de Alunos com Sistema Local + Modo Debug
// Requisitos no HTML:
// - <form id="alunoForm"> com inputs name="id", "nome", "turma", "nascimento", "responsavel", "cpf", "telefone", "email"
// - <tbody id="alunosTableBody"></tbody>
// - Botões: #btnSalvar, #btnCancelar (opcional), e input de busca #busca (opcional)
// - Elementos auxiliares (opcional): #totalAlunos, #toast
// - local-db.js deve ter inicializado window.db e window.localDb

(function () {
  'use strict';

  // =====================
  // CONFIG & FLAGS
  // =====================
  const COLLECTION = 'alunos';
  const REQUIRED_FIELDS_CREATE = ['id', 'nome', 'turma'];
  const REQUIRED_FIELDS_UPDATE = ['nome', 'turma'];

  let DEBUG_VERBOSE = false; // ligue/desligue logs verbosos via debugGestao.setVerbose(true/false)

  // =====================
  // STATE
  // =====================
  let db = null;
  // Sistema local não usa listeners
  let alunosCache = []; // snapshot local para filtros
  let editingId = null; // null -> criação; string -> edição
  let editingRows = new Set(); // controle de linhas em modo edição

  // =====================
  // ELEMENTOS
  // =====================
  const els = {};

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await ensureLocalDb();
      mapElements();
      bindEvents();
      startLiveList();
      // Inicializar estatísticas com valores zerados
      setTimeout(() => {
        updateStatistics();
      }, 500);
      debugLog('gestao.js inicializado com sucesso');
    } catch (e) {
      console.error(e);
      toast(e.message || 'Falha ao iniciar gestao.js', 'erro');
    }
  });

  // Aguarda Sistema Local disponível via window.localDb/window.db
  async function ensureLocalDb() {
    const maxWaitMs = 20000; // Aumentado para 20 segundos
    const start = Date.now();
    console.log('🔄 Aguardando sistema local...', {
      localDb: !!window.localDb,
      loaded: window.localDb?.loaded,
      db: !!window.db
    });
    
    while (!(window.localDb && window.localDb.loaded && window.db)) {
      if (Date.now() - start > maxWaitMs) {
        console.error('❌ Timeout do sistema local:', {
          localDb: !!window.localDb,
          loaded: window.localDb?.loaded,
          db: !!window.db,
          elapsed: Date.now() - start
        });
        throw new Error('Sistema Local não inicializado. Verifique se local-db.js foi carregado.');
      }
      await sleep(200); // Aumentado de 100ms para 200ms
    }
    db = window.db;
    console.log('✅ Sistema local pronto para gestão de alunos');
  }

  function mapElements() {
    els.form = document.getElementById('alunoForm');
    els.tbody = document.getElementById('alunosTableBody');
    els.btnSalvar = document.getElementById('btnSalvar') || queryByType(els.form, 'submit');
    els.btnCancelar = document.getElementById('btnCancelar');
    els.btnExcluir = document.getElementById('btnExcluir');
    els.busca = document.getElementById('busca');
    els.total = document.getElementById('totalAlunos');
    els.toast = document.getElementById('toast');
    els.filtroTurma = document.getElementById('filtroTurma');

    if (!els.form) debugWarn('#alunoForm não encontrado');
    if (!els.tbody) debugWarn('#alunosTableBody não encontrado');
  }

  function bindEvents() {
    if (els.form) {
      els.form.addEventListener('submit', onSubmitForm);
    }
    if (els.btnCancelar) {
      els.btnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
      });
    }
    if (els.btnExcluir) {
      els.btnExcluir.addEventListener('click', async (e) => {
        e.preventDefault();
        if (editingId) {
          await onDelete(editingId);
        }
      });
    }
    if (els.busca) {
      els.busca.addEventListener('input', () => renderTable());
    }
    if (els.filtroTurma) {
      els.filtroTurma.addEventListener('change', () => renderTable());
    }

    if (els.tbody) {
      // Delegação para Editar/Excluir
      els.tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const idRaw = btn.dataset.id;
        const id = idRaw ? decodeURIComponent(idRaw) : idRaw;
        if (!action || !id) return;
        if (action === 'edit') {
          onEdit(id);
        } else if (action === 'delete') {
          onDelete(id);
        } else if (action === 'toggle-edit') {
          toggleRowEditMode(id);
        }
      });
    }
  }

  // =====================
  // LISTENER EM TEMPO REAL
  // =====================
  async function startLiveList() {
    try {
      console.log('🔄 Iniciando carregamento de alunos...');
      debugLog('Carregando alunos do sistema local...');
      
      if (!db) {
        console.error('❌ db não está disponível');
        throw new Error('Sistema de banco não inicializado');
      }
      
      console.log('📡 Fazendo query para coleção:', COLLECTION);
      const snap = await db.collection(COLLECTION).get();
      console.log('📊 Resultado da query:', {
        size: snap.size,
        empty: snap.empty,
        docs: snap.docs?.length
      });
      
      alunosCache = snap.docs.map((d) => {
        const data = d.data();
        const turma = data.turma || '';
        const turno = getTurnoByTurma(turma);
        const status = data.status || 'ativo'; // Padrão ativo para dados existentes
        
        return {
          id: d.id,
          codigo: data.codigo || d.id, // Código da matrícula
          nome: data.nome_completo || data.nome || '',
          turma: turma,
          turno: turno,
          status: status,
          nascimento: data.nascimento || '',
          responsavel: data.responsavel || '',
          cpf: data.cpf_responsavel || data.cpf || '',
          telefone: data.telefone || data.telefone_responsavel || '',
          telefone1: data.telefone1 || data.telefone || '',
          telefone2: data.telefone2 || '',
          email: data.email || '',
          ...data // Manter campos originais também
        };
      });
      
      window.alunosCache = alunosCache.slice();
      console.log('✅ Alunos processados:', {
        total: alunosCache.length,
        primeiros3: alunosCache.slice(0, 3).map(a => ({ codigo: a.codigo, nome: a.nome, turma: a.turma }))
      });
      debugLog('Alunos carregados:', snap.size);
      updateClassFilter();
      renderTable();
      
      // Aguardar um pouco para garantir que os elementos existam
      setTimeout(() => {
        updateStatistics();
      }, 100);
      
    } catch (err) {
      console.error('Erro detalhado ao carregar lista:', err);
      console.error('Código do erro:', err?.code);
      console.error('Mensagem do erro:', err?.message);
      
      let mensagem = 'Erro ao carregar alunos.';
      
      if (err?.code === 'permission-denied') {
        mensagem = 'Sem permissão para ler dados. Verifique as regras do sistema e se está logado.';
      } else if (err?.code === 'failed-precondition') {
        mensagem = 'Índice do banco necessário. Tentando carregar sem ordenação...';
      } else if (err?.message) {
        mensagem = `Erro: ${err.message}`;
      }
      
      toast(mensagem, 'erro');

      // Apenas para permission-denied, mostrar informações de debug
      if (err?.code === 'permission-denied') {
        console.log('Usuário atual:', window.localAuth ? window.localAuth.getCurrentUser() : null);
        console.log('Sistema Local inicializado?', !!window.db);
      }
    }
  }

  function stopLiveList() {
    // Sistema local não usa listeners em tempo real
    debugLog('stopLiveList: nada para parar (sistema local)');
  }

  // =====================
  // CRUD
  // =====================
  async function onSubmitForm(ev) {
    ev.preventDefault();
    const data = getFormData();

    try {
      if (editingId) {
        validateRequired(data, REQUIRED_FIELDS_UPDATE);
        // Não permitir troca de docId durante edição
        if (data.id && data.id !== editingId) {
          data.id = editingId;
        }
        await updateAluno(editingId, data);
        toast('Aluno atualizado com sucesso!');
      } else {
        validateRequired(data, REQUIRED_FIELDS_CREATE);
        const docId = String(data.id).trim();
        await createAluno(docId, data);
        toast('Aluno cadastrado com sucesso!');
      }
      resetForm();
      // Recarregar dados após operação
      await startLiveList();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Falha ao salvar aluno.', 'erro');
    }
  }

  async function createAluno(docId, data) {
    const ref = db.collection(COLLECTION).doc(docId);
    const snap = await ref.get();
    if (snap.exists) {
      throw new Error('Já existe um aluno com ID "' + docId + '".');
    }
    const payload = sanitizeData(data, { forCreate: true });
    await ref.set(payload, { merge: false });
    debugLog('CREATE ok', { id: docId, payload });
    
    // Disparar evento de atualização
    window.dispatchEvent(new CustomEvent('dadosAtualizados', { 
      detail: { tipo: 'aluno_criado', dados: payload, id: docId } 
    }));
  }

  async function updateAluno(docId, data) {
    const ref = db.collection(COLLECTION).doc(docId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error('Aluno com ID "' + docId + '" não encontrado para atualização.');
    }
    const payload = sanitizeData(data, { forUpdate: true });
    await ref.update(payload);
    debugLog('UPDATE ok', { id: docId, payload });
  }

  async function onEdit(id) {
    try {
      const ref = db.collection(COLLECTION).doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        toast('Registro não encontrado.', 'erro');
        return;
      }
      fillForm({ id: id, ...snap.data() });
      editingId = id;
      toggleFormMode('edit');
      scrollIntoViewSmooth(els.form);
      debugLog('EDIT load', { id: id });
    } catch (err) {
      console.error(err);
      toast('Falha ao carregar aluno para edição.', 'erro');
    }
  }
  
  function toggleRowEditMode(id) {
    if (editingRows.has(id)) {
      editingRows.delete(id);
    } else {
      editingRows.add(id);
    }
    renderTable();
  }
  
  function updateClassFilter() {
    if (!els.filtroTurma) return;
    
    // Obter todas as turmas únicas
    const turmas = [...new Set(alunosCache.map(a => a.turma).filter(Boolean))]
      .sort();
    
    const currentValue = els.filtroTurma.value;
    els.filtroTurma.innerHTML = '<option value="todos">Todos os alunos</option>';
    
    turmas.forEach(turma => {
      const option = document.createElement('option');
      option.value = turma;
      option.textContent = turma;
      els.filtroTurma.appendChild(option);
    });
    
    // Restaurar valor se ainda existir
    if (turmas.includes(currentValue)) {
      els.filtroTurma.value = currentValue;
    }
  }
  
  // Função global para ser chamada pelo HTML
  window.filtrarAlunosPorTurma = function() {
    renderTable();
  };
  
  function getTurnoByTurma(turma) {
    if (!turma) return '';
    const turmasVespertinas = ['6A', '6B', '7B'];
    return turmasVespertinas.includes(turma) ? 'Vespertino' : 'Matutino';
  }
  
  function updateStatistics() {
    // Filtrar apenas alunos ativos
    const alunosAtivos = alunosCache.filter(a => a.status === 'ativo');
    
    // Total de alunos ativos
    const totalAtivos = alunosAtivos.length;
    const elTotalAlunosAtivos = document.getElementById('totalAlunosAtivos');
    if (elTotalAlunosAtivos) {
      elTotalAlunosAtivos.textContent = totalAtivos;
    }
    
    // Total de turmas únicas (apenas alunos ativos)
    const turmasUnicas = [...new Set(alunosAtivos.map(a => a.turma).filter(Boolean))];
    const totalTurmas = turmasUnicas.length;
    const elTotalTurmas = document.getElementById('totalTurmas');
    if (elTotalTurmas) {
      elTotalTurmas.textContent = totalTurmas + '/12';
    }
    
    // Cadastros hoje (apenas alunos ativos)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const cadastrosHoje = alunosAtivos.filter(aluno => {
      if (!aluno.createdAt) return false;
      const dataAluno = aluno.createdAt.toDate ? aluno.createdAt.toDate() : new Date(aluno.createdAt);
      dataAluno.setHours(0, 0, 0, 0);
      return dataAluno.getTime() === hoje.getTime();
    }).length;
    
    const elCadastrosHoje = document.getElementById('cadastrosHoje');
    if (elCadastrosHoje) elCadastrosHoje.textContent = cadastrosHoje;
    
    // Dados incompletos (alunos ativos sem responsável, CPF ou telefone)
    const dadosIncompletos = alunosAtivos.filter(aluno => {
      return !aluno.responsavel || !aluno.cpf || !aluno.telefone;
    }).length;
    
    const elDadosIncompletos = document.getElementById('dadosIncompletos');
    if (elDadosIncompletos) elDadosIncompletos.textContent = dadosIncompletos;
    
    // Log para debug
    debugLog('Estatísticas atualizadas:', {
      totalAtivos,
      totalTurmas: totalTurmas + '/12',
      cadastrosHoje,
      dadosIncompletos
    });
  }

  async function onDelete(id) {
    const ok = confirm('Excluir definitivamente o aluno ID "' + id + '"?');
    if (!ok) return;
    try {
      await db.collection(COLLECTION).doc(id).delete();
      toast('Aluno excluído.');
      if (editingId === id) resetForm();
      debugLog('DELETE ok', { id: id });
      // Recarregar dados após exclusão
      await startLiveList();
    } catch (err) {
      console.error(err);
      toast('Falha ao excluir aluno.', 'erro');
    }
  }

  // =====================
  // RENDER
  // =====================
  function renderTable() {
    console.log('🔄 renderTable chamada', {
      tbody: !!els.tbody,
      cacheSize: alunosCache.length
    });
    
    if (!els.tbody) {
      console.warn('❌ tbody não encontrado');
      return;
    }
    
    const termo = normalize((els.busca && els.busca.value) || '');
    const turmaFiltro = (els.filtroTurma && els.filtroTurma.value) || 'todos';

    const lista = alunosCache.filter((a) => {
      // Filtro por busca
      if (termo) {
        const alvo = normalize(
          [a.codigo, a.nome, a.turma, a.nascimento, a.responsavel, a.cpf, a.telefone]
            .filter(Boolean)
            .join(' ')
        );
        if (!alvo.includes(termo)) return false;
      }
      
      // Filtro por turma
      if (turmaFiltro !== 'todos' && a.turma !== turmaFiltro) {
        return false;
      }
      
      return true;
    });

    console.log('📋 Lista filtrada:', {
      total: lista.length,
      filtros: { termo, turmaFiltro }
    });

    if (lista.length === 0) {
      els.tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #666;">Nenhum aluno encontrado</td></tr>';
      console.log('⚠️ Nenhum aluno na lista filtrada');
    } else {
      els.tbody.innerHTML = lista
        .map((a) => {
          const isEditing = editingRows.has(a.id);
          const deleteButton = isEditing 
            ? '<button type="button" class="btn btn-small btn-danger" data-action="delete" data-id="' + encodeURIComponent(a.id) + '">Excluir</button>'
            : '';
          
          const statusClass = a.status === 'ativo' ? 'text-success' : 'text-muted';
          const statusIcon = a.status === 'ativo' ? '✓' : '✗';
          
          return (
            '<tr data-id="' + escapeHtml(a.id) + '">' +
              '<td>' + escapeHtml(a.codigo || a.id || '') + '</td>' +
              '<td>' + escapeHtml(a.nome_completo || a.nome || '') + '</td>' +
              '<td>' + escapeHtml(a.turma || '') + '</td>' +
              '<td class="' + statusClass + '">' + statusIcon + ' ' + escapeHtml(a.status || 'ativo') + '</td>' +
              '<td>' + escapeHtml(a.responsavel || '') + '</td>' +
              '<td>' + escapeHtml(a.telefone1 || a.telefone || '') + '</td>' +
              '<td>' + escapeHtml(a.telefone2 || '') + '</td>' +
              '<td style="white-space:nowrap">' +
                '<button type="button" class="btn btn-small" data-action="edit" data-id="' + encodeURIComponent(a.id) + '">Editar</button>' +
                deleteButton +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    if (els.total) {
      els.total.textContent = String(lista.length);
    }
  }

  // =====================
  // FORM HELPERS
  // =====================
  function getFormData() {
    if (!els.form) return {};
    const fd = new FormData(els.form);
    const data = Object.fromEntries(fd.entries());
    if (data.id != null) data.id = String(data.id).trim();
    if (data.nome != null) data.nome = cleanSpaces(data.nome);
    if (data.turma != null) data.turma = cleanSpaces(data.turma).toUpperCase();
    if (data.cpf != null) data.cpf = data.cpf.replace(/\D/g, '');
    if (data.telefone1 != null) data.telefone1 = data.telefone1.trim();
    if (data.telefone2 != null) data.telefone2 = data.telefone2.trim();
    if (data.email != null) data.email = data.email.trim().toLowerCase();
    return data;
  }

  function fillForm(data) {
    if (!els.form) return;
    
    // Mapear campos corretamente
    const mappedData = {
      id: data.codigo || data.id || '',
      nome: data.nome_completo || data.nome || '',
      turma: data.turma || '',
      status: data.status || 'ativo',
      responsavel: data.responsavel || '',
      telefone1: data.telefone1 || data.telefone || '',
      telefone2: data.telefone2 || ''
    };
    
    for (const k in mappedData) {
      if (!Object.prototype.hasOwnProperty.call(mappedData, k)) continue;
      const v = mappedData[k];
      const input = els.form.querySelector('[name="' + cssEscape(k) + '"]');
      if (input) input.value = v == null ? '' : String(v);
    }
    
    debugLog('fillForm mapeado:', mappedData);
  }

  function resetForm() {
    if (els.form) els.form.reset();
    editingId = null;
    toggleFormMode('create');
  }

  function toggleFormMode(mode) {
    const idInput = els.form && els.form.querySelector('[name="id"]');
    if (mode === 'edit') {
      if (idInput) {
        idInput.disabled = true; // docId não muda
        idInput.classList.add('is-disabled');
      }
      if (els.btnSalvar) els.btnSalvar.textContent = '✅ Atualizar';
      if (els.btnExcluir) els.btnExcluir.style.display = 'inline-block';
    } else {
      if (idInput) {
        idInput.disabled = false;
        idInput.classList.remove('is-disabled');
      }
      if (els.btnSalvar) els.btnSalvar.textContent = '✅ Salvar';
      if (els.btnExcluir) els.btnExcluir.style.display = 'none';
    }
  }

  function validateRequired(data, fields) {
    const faltando = [];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (!data[f] || String(data[f]).trim() === '') faltando.push(f);
    }
    if (faltando.length) {
      throw new Error('Preencha os campos obrigatórios: ' + faltando.join(', '));
    }
  }

  function sanitizeData(data, opts) {
    opts = opts || {}; var forCreate = !!opts.forCreate; var forUpdate = !!opts.forUpdate;
    
    // Mapear campos do formulário para a estrutura do banco
    var out = {};
    
    // Campos obrigatórios
    if (data.id) out.codigo = String(data.id).trim();
    if (data.nome) out.nome_completo = String(data.nome).trim();
    if (data.turma) out.turma = String(data.turma).trim();
    
    // Campos opcionais
    if (data.status) out.status = String(data.status).trim();
    if (data.responsavel) out.responsavel = String(data.responsavel).trim();
    if (data.telefone1) out.telefone1 = String(data.telefone1).trim();
    if (data.telefone2) out.telefone2 = String(data.telefone2).trim();
    
    // Criar campo combinado para compatibilidade
    const telefones = [data.telefone1, data.telefone2].filter(t => t && t.trim()).join(' / ');
    if (telefones) out.telefone_responsavel = telefones;
    
    // Garantir que status seja sempre definido
    if (!out.status) out.status = 'ativo';
    
    var ts = new Date().toISOString();
    if (forCreate) { 
      out.created_at = ts; 
      out.updated_at = ts;
      out.createdAt = ts; // compatibilidade
      out.updatedAt = ts; // compatibilidade
    }
    if (forUpdate) { 
      out.updated_at = ts;
      out.updatedAt = ts; // compatibilidade
    }
    
    debugLog('sanitizeData mapeado:', out);
    return out;
  }

  // =====================
  // DEBUG TOOLS (console: debugGestao.*)
  // =====================
  function buildDebugAPI() {
    const api = {
      help: function() {
        console.log('\ndebugGestao disponível. Funções úteis:\n\n'
          + 'debugGestao.info()               -> resumo do ambiente DOM/Sistema Local\n'
          + 'debugGestao.setVerbose(true)     -> liga logs verbosos\n'
          + 'debugGestao.checkLocalDb()      -> testa leitura/escrita básicas\n'
          + 'debugGestao.readOnce()           -> lê uma vez (sem listener) e mostra documentos\n'
          + 'debugGestao.test.writeSample()   -> grava aluno DEBUG_SAMPLE\n'
          + 'debugGestao.test.clearSample()   -> apaga aluno DEBUG_SAMPLE\n'
          + 'debugGestao.toggleLive(false)    -> desliga listener em tempo real\n'
          + 'debugGestao.toggleLive(true)     -> religa listener em tempo real\n'
          + 'debugGestao.getCache()           -> retorna array alunoCache atual\n'
          + 'debugGestao.forceRender()        -> força re-render da tabela\n');
      },
      setVerbose: function(v) { DEBUG_VERBOSE = !!v; console.log('DEBUG_VERBOSE =', DEBUG_VERBOSE); },
      info: function() {
        const info = {
          hasForm: !!els.form,
          hasTbody: !!els.tbody,
          buscaId: !!els.busca,
          totalId: !!els.total,
          toastId: !!els.toast,
          localDbReady: !!(window.localDb && window.localDb.loaded),
          localAuth: !!(window.localAuth),
          hasDb: !!db,
          collection: COLLECTION,
          user: (window.localAuth && window.localAuth.getCurrentUser()) ? window.localAuth.getCurrentUser().email : null,
          cacheSize: alunosCache.length,
          systemType: 'local-storage'
        };
        console.table(info);
        return info;
      },
      checkLocalDb: async function() {
        const out = { ready: false, read: null, write: null };
        try {
          out.ready = !!(window.localDbReady && window.localDbReady() && db);
          const r = await db.collection(COLLECTION).limit(1).get();
          out.read = { ok: true, size: r.size };
        } catch (e) {
          out.read = { ok: false, code: e.code, msg: e.message };
        }
        try {
          await db.collection(COLLECTION).doc('DEBUG_CHECK').set({
            nome: 'Debug Check', turma: 'DZ',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          out.write = { ok: true };
          await db.collection(COLLECTION).doc('DEBUG_CHECK').delete();
        } catch (e2) {
          out.write = { ok: false, code: e2.code, msg: e2.message };
        }
        console.table(out);
        return out;
      },
      readOnce: async function() {
        try {
          const snap = await db.collection(COLLECTION).get();
          const rows = snap.docs.map(function(d){ return { id: d.id, ...d.data() }; });
          
          // Debug: verificar estrutura dos telefones
          if (rows.length > 0) {
            console.log('📱 Debug telefones - Primeiro aluno:', {
              telefone1: rows[0].telefone1,
              telefone2: rows[0].telefone2,
              telefone_responsavel: rows[0].telefone_responsavel,
              campos_disponiveis: Object.keys(rows[0]).filter(k => k.includes('tel'))
            });
          }
          
          // Ordenar por nome no JavaScript e limitar a 25
          rows.sort((a, b) => (a.nome_completo || a.nome || '').localeCompare(b.nome_completo || b.nome || ''));
          const limitedRows = rows.slice(0, 25);
          
          console.log('readOnce ->', limitedRows.length, 'doc(s)');
          alunosCache = limitedRows;
          renderTable();
          return limitedRows;
        } catch (e) {
          console.error('readOnce err:', e.code, e.message);
        }
      },
      test: {
        writeSample: async function() {
          const id = 'DEBUG_SAMPLE';
          await db.collection(COLLECTION).doc(id).set({
            id: id,
            nome: 'Aluno de Teste',
            turma: '1A',
            nascimento: '2010-01-01',
            responsavel: 'Resp Teste',
            cpf: '00000000000',
            telefone: '(00) 00000-0000',
            email: 'debug@example.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('DEBUG_SAMPLE gravado');
        },
        clearSample: async function() {
          await db.collection(COLLECTION).doc('DEBUG_SAMPLE').delete();
          console.log('DEBUG_SAMPLE removido');
        }
      },
      toggleLive: function(on) {
        if (on) { startLiveList(); console.log('listener ligado'); }
        else { stopLiveList(); console.log('listener desligado'); }
      },
      getCache: function() { return alunosCache.map(function(x){ return Object.assign({}, x); }); },
      forceRender: function() { renderTable(); }
    };
    return api;
  }

  // expõe API de debug no window
  window.debugGestao = buildDebugAPI();
  // dica rápida no console
  setTimeout(function(){ if (typeof console !== 'undefined' && window.debugGestao) window.debugGestao.help(); }, 500);
  
  // Expor funções necessárias globalmente
  window.filtrarAlunosPorTurma = function() {
    renderTable();
  };
  
  // Função de debug para verificar elementos
  window.debugEstatisticas = function() {
    const elementos = {
      totalAlunosAtivos: document.getElementById('totalAlunosAtivos'),
      totalTurmas: document.getElementById('totalTurmas'),
      cadastrosHoje: document.getElementById('cadastrosHoje'),
      dadosIncompletos: document.getElementById('dadosIncompletos')
    };
    
    console.log('Elementos de estatísticas:', elementos);
    console.log('Cache de alunos:', alunosCache.length);
    updateStatistics();
    return elementos;
  };
  
  // Função para migrar dados existentes
  window.migrarDadosExistentes = async function() {
    try {
      console.log('Iniciando migração de dados...');
      const snapshot = await db.collection(COLLECTION).get();
      let updated = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.status) {
          await doc.ref.update({ 
            status: 'ativo',
            updatedAt: new Date().toISOString()
          });
          updated++;
        }
      }
      
      console.log(`Migração concluída: ${updated} alunos atualizados com status ativo`);
      return { updated };
    } catch (error) {
      console.error('Erro na migração:', error);
      throw error;
    }
  };

  // =====================
  // UTILITÁRIOS
  // =====================
  function toast(msg, tipo) {
    if (tipo == null) tipo = 'ok';
    if (els.toast) {
      els.toast.textContent = msg;
      els.toast.dataset.tipo = tipo; // CSS [data-tipo="erro"]
      els.toast.classList.add('show');
      setTimeout(function(){ if (els.toast) els.toast.classList.remove('show'); }, 3500);
    } else if (tipo === 'erro') {
      alert(msg);
    } else {
      console.log('[OK]', msg);
    }
  }

  function debugLog(){ if (DEBUG_VERBOSE) console.log.apply(console, ['[GESTAO]'].concat([].slice.call(arguments))); }
  function debugWarn(){ if (DEBUG_VERBOSE) console.warn.apply(console, ['[GESTAO]'].concat([].slice.call(arguments))); }

  function sleep(ms) { return new Promise(function(res){ setTimeout(res, ms); }); }

  function queryByType(root, type) { return root ? root.querySelector('[type="' + cssEscape(type) + '"]') : null; }

  function cleanSpaces(str) { return String(str || '').replace(/\s+/g, ' ').trim(); }

  function normalize(str) {
    // remove acentos via faixa unicode combinante
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Polyfill simples para CSS.escape que evita contrabarras
  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    var out = '';
    var s = String(value);
    for (var i = 0; i < s.length; i++) {
      var ch = s.charCodeAt(i);
      var c = s.charAt(i);
      if ((ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || c === '_' || c === '-') {
        out += c;
      } else {
        out += '_' + ch.toString(16);
      }
    }
    return out;
  }

  function scrollIntoViewSmooth(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (_) { el.scrollIntoView(); }
  }

  // LIMPEZA
  window.addEventListener('beforeunload', function(){ stopLiveList(); });

  // SINCRONIZAÇÃO EM TEMPO REAL
  // Listener para mudanças remotas
  window.addEventListener('dadosSincronizados', function(event) {
    console.log('🔄 Dados sincronizados detectados - recarregando alunos');
    
    // Limpar cache para forçar reload completo
    alunosCache = [];
    
    // Sempre recarregar lista quando há sincronização
    setTimeout(() => {
      startLiveList();
    }, 50);
    
    // Force update statistics as well
    setTimeout(() => {
      updateStatistics();
    }, 100);
  });

  // Listener para mudanças de dados
  window.addEventListener('dadosAtualizados', async function(event) {
    console.log('📡 Dados atualizados localmente - sincronizando com GitHub');
    if (window.gitHubSync && window.gitHubSync.podeEscrever()) {
      try {
        // Obter todos os dados atualizados
        const dadosCompletos = await obterDadosCompletosGestao();
        
        // Sincronizar com GitHub
        await window.gitHubSync.salvarDadosAutomatico(
          dadosCompletos, 
          `Atualização: ${event.detail.tipo}`,
          `${event.detail.tipo} - ID: ${event.detail.id || 'N/A'}`
        );
        
        console.log('✅ Dados sincronizados com GitHub após mudança local');
      } catch (error) {
        console.error('❌ Erro ao sincronizar com GitHub:', error);
      }
    }
  });

  // Função para obter dados completos para sincronização
  async function obterDadosCompletosGestao() {
    const dadosCompletos = {
      alunos: {},
      medidas_disciplinares: {},
      frequencia_diaria: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Carregar alunos
      const alunosSnap = await window.db.collection('alunos').get();
      alunosSnap.forEach(doc => {
        dadosCompletos.alunos[doc.id] = doc.data();
      });

      // Carregar medidas disciplinares
      const medidasSnap = await window.db.collection('medidas_disciplinares').get();
      medidasSnap.forEach(doc => {
        dadosCompletos.medidas_disciplinares[doc.id] = doc.data();
      });

      // Carregar frequência (se existir)
      try {
        const frequenciaSnap = await window.db.collection('frequencia_diaria').get();
        frequenciaSnap.forEach(doc => {
          dadosCompletos.frequencia_diaria[doc.id] = doc.data();
        });
      } catch (err) {
        // Frequência pode não existir ainda
      }

      console.log('📦 Dados completos preparados:', {
        alunos: Object.keys(dadosCompletos.alunos).length,
        medidas: Object.keys(dadosCompletos.medidas_disciplinares).length,
        frequencia: Object.keys(dadosCompletos.frequencia_diaria).length
      });

      return dadosCompletos;
    } catch (error) {
      console.error('❌ Erro ao obter dados completos:', error);
      throw error;
    }
  }
})();
