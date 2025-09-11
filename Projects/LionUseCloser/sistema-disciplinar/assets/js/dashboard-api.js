// Dashboard usando API NeonDB
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.apiClient.isAuthenticated()) {
    window.location.href = 'pages/login.html';
    return;
  }

  try {
    // Carregar estatísticas do dashboard
    const stats = await window.apiClient.getDashboardStats();
    
    // Atualizar cards do dashboard
    updateDashboardCards(stats);
    
    // Carregar dados para gráficos
    await loadDashboardData();
    
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
});

function updateDashboardCards(stats) {
  // Total de alunos
  const totalAlunosEl = document.querySelector('[data-metric="total-alunos"] .metric-number');
  if (totalAlunosEl) totalAlunosEl.textContent = stats.total_alunos || 0;
  
  // Medidas do mês
  const medidasMesEl = document.querySelector('[data-metric="medidas-mes"] .metric-number');
  if (medidasMesEl) medidasMesEl.textContent = stats.medidas_mes || 0;
  
  // Faltas hoje  
  const faltasHojeEl = document.querySelector('[data-metric="faltas-hoje"] .metric-number');
  if (faltasHojeEl) faltasHojeEl.textContent = stats.faltas_hoje || 0;
  
  // Total turmas
  const totalTurmasEl = document.querySelector('[data-metric="total-turmas"] .metric-number');
  if (totalTurmasEl) totalTurmasEl.textContent = stats.total_turmas || 0;
}

async function loadDashboardData() {
  try {
    // Carregar alunos recentes
    const alunos = await window.apiClient.getAlunos();
    const alunosRecentes = alunos.slice(0, 5);
    renderAlunosRecentes(alunosRecentes);
    
    // Carregar medidas recentes
    const medidas = await window.apiClient.getMedidas();
    const medidasRecentes = medidas.slice(0, 5);
    renderMedidasRecentes(medidasRecentes);
    
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }
}

function renderAlunosRecentes(alunos) {
  const container = document.getElementById('alunos-recentes');
  if (!container) return;
  
  container.innerHTML = alunos.map(aluno => `
    <div class="list-item">
      <div class="list-item-content">
        <div class="list-item-title">${aluno.nome}</div>
        <div class="list-item-subtitle">${aluno.turma}</div>
      </div>
    </div>
  `).join('');
}

function renderMedidasRecentes(medidas) {
  const container = document.getElementById('medidas-recentes');
  if (!container) return;
  
  container.innerHTML = medidas.map(medida => `
    <div class="list-item">
      <div class="list-item-content">
        <div class="list-item-title">${medida.tipo}</div>
        <div class="list-item-subtitle">${medida.aluno_nome} - ${medida.turma}</div>
      </div>
    </div>
  `).join('');
}

// Logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
  window.apiClient.logout();
});