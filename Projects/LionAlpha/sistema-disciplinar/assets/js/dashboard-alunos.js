async function carregarAlunosDashboard() {
  try {
    // Verificar se Sistema Local está disponível
    if (!window.db) {
      if (typeof window.localDb !== "undefined" && window.localDb.loaded) {
        window.db = window.db;
      } else {
        console.error('Sistema Local não carregado');
        return;
      }
    }

    // Buscar alunos no Sistema Local
    const snapshot = await db.collection("alunos").get();
    const alunos = [];
    snapshot.forEach(doc => {
      alunos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Atualizar estatísticas
    atualizarEstatisticas(alunos);

    const tabela = document.getElementById('alunosDashboard');
    if (!tabela) {
      console.log('Tabela de alunos não encontrada na página');
      return;
    }

    const tbody = tabela.querySelector('tbody');
    tbody.innerHTML = '';

    if (alunos.length === 0) {
      const colCount = tabela.querySelectorAll('thead th').length;
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = colCount;
      td.textContent = 'Nenhum aluno cadastrado.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // Ordenar alunos por turma e nome
    alunos.sort((a, b) => {
      if (a.turma !== b.turma) return (a.turma || '').localeCompare(b.turma || '');
      return (a.nome_completo || a.nome || '').localeCompare(b.nome_completo || b.nome || '');
    });

    alunos.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.codigo || a.id}</td>
        <td>${a.nome_completo || a.nome || ''}</td>
        <td><span class="badge turma-${a.turma?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}">${a.turma || ''}</span></td>
        <td>${a.responsavel || 'Não informado'}</td>
        <td>${a.telefone || 'Não informado'}</td>`;
      tbody.appendChild(tr);
    });

    console.log(`${alunos.length} alunos carregados do Sistema Local`);
  } catch (err) {
    console.error('Erro ao carregar alunos:', err);
  }
}

function atualizarEstatisticas(alunos) {
  // Contar alunos por turma
  const estatPorTurma = {};
  alunos.forEach(aluno => {
    const turma = aluno.turma || 'Sem turma';
    estatPorTurma[turma] = (estatPorTurma[turma] || 0) + 1;
  });

  // Atualizar cards de estatísticas se existirem
  const totalAlunosEl = document.getElementById('totalAlunos');
  if (totalAlunosEl) {
    totalAlunosEl.textContent = alunos.length;
  }

  const totalTurmasEl = document.getElementById('totalTurmas');
  if (totalTurmasEl) {
    totalTurmasEl.textContent = Object.keys(estatPorTurma).length;
  }

  // Log das estatísticas
  console.log('📊 Estatísticas por turma:', estatPorTurma);
}

window.carregarAlunosDashboard = carregarAlunosDashboard;
