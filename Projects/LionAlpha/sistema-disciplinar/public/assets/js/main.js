// ============================================
// DASHBOARD DISCIPLINAR - FUNÇÕES GLOBAIS
// ============================================

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let registrosCache = [];
let processedData = [];
let filteredData = [];

// ============================================
// SISTEMA DE MENSAGENS
// ============================================
function showMessage(message, type = 'info') {
    // Remover mensagem anterior
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (!message) return;
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'loading') {
        messageDiv.innerHTML = `<div class="loading">${message}</div>`;
    } else {
        messageDiv.textContent = message;
    }
    
    // Adicionar ao DOM
    document.body.appendChild(messageDiv);
    
    // Remover automaticamente (exceto loading)
    if (type !== 'loading') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 4000);
    }
}

// ============================================
// NAVEGAÇÃO ENTRE PÁGINAS
// ============================================
function ativarMenuLateral() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const currentPath = window.location.pathname;
    
    sidebarItems.forEach(item => {
        item.classList.remove('active');
        
        // Verificar se o item corresponde à página atual
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href)) {
            item.classList.add('active');
        }
    });
}

// ============================================
// FUNCIONALIDADE DE PESQUISA
// ============================================
function configurarPesquisa() {
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase().trim();
            
            if (termo.length >= 2) {
                realizarPesquisa(termo);
            }
        });
    }
}

function realizarPesquisa(termo) {
    const cache = window.alunosCache || [];
    if (cache.length > 0) {
        const resultados = cache.filter(aluno =>
            aluno.nome.toLowerCase().includes(termo) ||
            aluno.turma.toLowerCase().includes(termo) ||
            (aluno.responsavel && aluno.responsavel.toLowerCase().includes(termo)) ||
            (aluno.cpf && aluno.cpf.includes(termo))
        );

        if (resultados.length > 0) {
            console.log(`Encontrados ${resultados.length} resultado(s) para: ${termo}`);
            showMessage(`🔍 ${resultados.length} resultado(s) encontrado(s)`, 'info');
        } else {
            console.log(`Nenhum resultado encontrado para: ${termo}`);
            showMessage('🔍 Nenhum resultado encontrado', 'info');
        }
    }
}

// ============================================
// ATALHOS DE TECLADO
// ============================================
function configurarAtalhos() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + H para ir ao dashboard
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '/index.html';
        }
        
        // Ctrl + G para gestão de alunos
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            window.location.href = '/pages/gestao-alunos.html';
        }
        
        // Ctrl + R para relatórios
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            window.location.href = '/pages/relatorios.html';
        }
        
        // ESC para limpar pesquisa
        if (e.key === 'Escape') {
            const searchBox = document.querySelector('.search-box');
            if (searchBox) {
                searchBox.value = '';
                searchBox.blur();
            }
        }
    });
}

// ============================================
// VALIDAÇÕES AVANÇADAS
// ============================================
function configurarValidacoes() {
    // Validação em tempo real para nomes
    const nomeInputs = document.querySelectorAll('input[id*="nome"], input[id*="Nome"]');
    nomeInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            const valor = e.target.value;
            // Remover números e caracteres especiais
            e.target.value = valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        });
    });

    // Validação para datas não futuras
    const dataInputs = document.querySelectorAll('input[type="date"]');
    dataInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const dataSelecionada = new Date(e.target.value);
            const hoje = new Date();
            
            if (dataSelecionada > hoje) {
                showMessage('A data não pode ser no futuro', 'error');
                e.target.value = hoje.toISOString().split('T')[0];
            }
        });
    });

    // Validação para campos obrigatórios
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function(e) {
            if (!e.target.value.trim()) {
                e.target.style.borderColor = '#dc3545';
            } else {
                e.target.style.borderColor = '#d1d0ce';
            }
        });
    });
}

// ============================================
// UTILITÁRIOS GERAIS
// ============================================

// Formatar data para exibição
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Formatar data e hora
function formatarDataHora(data) {
    return new Date(data).toLocaleString('pt-BR');
}

// Capitalizar primeira letra
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Gerar ID único
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce para pesquisas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// BACKUP E RESTORE
// ============================================
async function fazerBackup() {
    try {
        showMessage('Gerando backup...', 'loading');
        
        if (!window.localDb || !window.localDb.loaded) {
            showMessage('Sistema Local não está conectado', 'error');
            return;
        }
        
        const backup = {
            data: new Date().toISOString(),
            versao: '1.0',
            alunos: await obterTodosAlunos(),
            faltas: await obterTodasFaltas(),
            medidas: await obterTodasMedidas()
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-disciplinar-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showMessage('✅ Backup gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar backup:', error);
        showMessage('Erro ao gerar backup', 'error');
    }
}

async function obterTodosAlunos() {
    const snapshot = await db.collection('alunos').get();
    const alunos = [];
    snapshot.forEach(doc => {
        alunos.push({ id: doc.id, ...doc.data() });
    });
    return alunos;
}

async function obterTodasFaltas() {
    const snapshot = await db.collection('faltas').get();
    const faltas = [];
    snapshot.forEach(doc => {
        faltas.push({ id: doc.id, ...doc.data() });
    });
    return faltas;
}

async function obterTodasMedidas() {
    const snapshot = await db.collection('medidas_disciplinares').get();
    const medidas = [];
    snapshot.forEach(doc => {
        medidas.push({ id: doc.id, ...doc.data() });
    });
    return medidas;
}

// ============================================
// INICIALIZAÇÃO
// ============================================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Sistema Dashboard Disciplinar carregado');

        // Configurar funcionalidades globais
        ativarMenuLateral();
        configurarPesquisa();
        configurarAtalhos();
        configurarValidacoes();

        // Verificar Sistema Local após um tempo
        setTimeout(() => {
            if (window.localDb && window.localDb.loaded) {
                showMessage('💾 Sistema Local conectado e funcionando!', 'success');
            } else {
                showMessage('⚠️ Sistema aguardando carregamento...', 'info');
            }
        }, 1000);

        // Adicionar info da versão
        console.log('📚 Dashboard Disciplinar v1.0');
        console.log('🎯 Desenvolvido para gestão escolar eficiente');
    });
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
if (typeof window !== 'undefined') {
    window.showMessage = showMessage;
    window.formatarData = formatarData;
    window.formatarDataHora = formatarDataHora;
    window.capitalize = capitalize;
    window.gerarId = gerarId;
    window.debounce = debounce;
    window.fazerBackup = fazerBackup;
}

// Export functions for Node.js testing environment
if (typeof module !== 'undefined') {
    module.exports = { capitalize, gerarId };
}
