// Sistema de Sincronização em Tempo Real via GitHub
class RealTimeSync {
    constructor() {
        this.enabled = false;
        this.pollInterval = 3000; // 3 segundos para teste
        this.pollTimer = null;
        this.lastCommitSha = null;
        this.isUpdating = false;
        this.eventQueue = [];
        this.maxRetries = 3;
        
        // Referência ao sistema GitHub
        this.gitHub = window.gitHubSync;
        
        // Callbacks para eventos
        this.callbacks = {
            onDataChanged: [],
            onSyncStart: [],
            onSyncEnd: [],
            onError: []
        };
        
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando sincronização em tempo real...');
        
        // Aguardar sistema GitHub estar pronto
        await this.waitForGitHub();
        
        // Verificar se há configuração e testar token
        if (this.gitHub && this.gitHub.token && this.gitHub.token !== 'COLE_SEU_TOKEN_AQUI') {
            // Testar se token funciona antes de habilitar
            const tokenWorks = await this.testToken();
            if (tokenWorks) {
                this.enabled = true;
                console.log('✅ Sincronização automática habilitada - token válido');
            } else {
                this.enabled = false;
                console.log('❌ Token inválido - sincronização desabilitada');
            }
        } else {
            this.enabled = false;
            console.log('⚠️ Sincronização automática desabilitada - token não encontrado');
        }
        
        // Inicializar listeners
        this.setupEventListeners();
        
        // Obter estado inicial
        await this.getInitialState();
        
        // Iniciar monitoramento
        this.startPolling();
    }

    async waitForGitHub() {
        let attempts = 0;
        while ((!window.gitHubSync || !window.gitHubSync.token) && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        this.gitHub = window.gitHubSync;
        console.log('🔗 Real-time sync conectado ao GitHub:', this.gitHub?.token ? 'Token disponível' : 'Sem token');
    }

    // Testar se o token funciona
    async testToken() {
        try {
            if (!this.gitHub || !this.gitHub.token) return false;
            
            const response = await fetch(`${this.gitHub.apiUrl}/repos/${this.gitHub.owner}/${this.gitHub.repo}`, {
                headers: {
                    'Authorization': `token ${this.gitHub.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.warn('Erro ao testar token:', error);
            return false;
        }
    }

    // Configurar listeners de eventos
    setupEventListeners() {
        // Listener para mudanças locais
        window.addEventListener('dadosAtualizados', (event) => {
            if (!this.isUpdating) {
                this.queueEvent('local_change', event.detail);
            }
        });

        // Listener para sincronização manual
        window.addEventListener('sincronizarAgora', () => {
            this.syncNow();
        });

        // Listener para mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.enabled) {
                this.syncNow();
            }
        });

        // Listener para foco na janela
        window.addEventListener('focus', () => {
            if (this.enabled) {
                this.syncNow();
            }
        });
    }

    // Obter estado inicial do repositório
    async getInitialState() {
        try {
            if (!this.gitHub || !this.gitHub.token) return;
            
            const response = await fetch(`${this.gitHub.apiUrl}/repos/${this.gitHub.owner}/${this.gitHub.repo}/commits/main`, {
                headers: {
                    'Authorization': `token ${this.gitHub.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const commit = await response.json();
                this.lastCommitSha = commit.sha;
                console.log('📍 Estado inicial obtido:', commit.sha.substring(0, 7));
            }
        } catch (error) {
            console.error('Erro ao obter estado inicial:', error);
        }
    }

    // Iniciar polling para mudanças
    startPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }

        if (!this.enabled) {
            console.log('⏸️ Polling não iniciado - sincronização desabilitada');
            return;
        }

        this.pollTimer = setInterval(() => {
            this.checkForChanges();
        }, this.pollInterval);

        console.log(`🔁 Polling iniciado a cada ${this.pollInterval / 1000}s`);
    }

    // Parar polling
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        console.log('⏹️ Polling interrompido');
    }

    // Verificar mudanças no repositório
    async checkForChanges() {
        if (!this.enabled || this.isUpdating || !this.gitHub || !this.gitHub.token) {
            return;
        }

        try {
            const response = await fetch(`${this.gitHub.apiUrl}/repos/${this.gitHub.owner}/${this.gitHub.repo}/commits/main`, {
                headers: {
                    'Authorization': `token ${this.gitHub.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const commit = await response.json();
                const currentSha = commit.sha;

                if (this.lastCommitSha && this.lastCommitSha !== currentSha) {
                    console.log('🔄 Mudanças detectadas no repositório');
                    console.log(`📍 ${this.lastCommitSha.substring(0, 7)} → ${currentSha.substring(0, 7)}`);
                    
                    // Verificar se não é mudança própria (evitar loop)
                    if (!this.isUpdating) {
                        await this.handleRemoteChanges(commit);
                    } else {
                        console.log('⏭️ Ignorando mudança própria para evitar loop');
                    }
                }

                this.lastCommitSha = currentSha;
            }
        } catch (error) {
            console.error('Erro ao verificar mudanças:', error);
            this.emitEvent('onError', error);
        }
    }

    // Processar mudanças remotas
    async handleRemoteChanges(commit) {
        if (this.isUpdating) return;

        this.isUpdating = true;
        this.emitEvent('onSyncStart');

        try {
            // Verificar se a mudança não foi feita por este usuário
            if (commit.committer.email !== this.gitHub.userEmail) {
                console.log('👥 Mudança feita por outro usuário:', commit.committer.name);
                
                // Buscar dados atualizados
                const dadosAtualizados = await this.gitHub.sincronizarAutomatico();
                
                if (dadosAtualizados) {
                    // Notificar componentes sobre mudanças
                    this.emitEvent('onDataChanged', {
                        type: 'remote',
                        data: dadosAtualizados,
                        commit: commit,
                        author: commit.committer.name
                    });

                    // Disparar evento global para todos os componentes
                    window.dispatchEvent(new CustomEvent('dadosSincronizados', {
                        detail: {
                            tipo: 'sincronizacao_remota',
                            dados: dadosAtualizados,
                            autor: commit.committer.name,
                            commit: commit.sha
                        }
                    }));

                    // Mostrar notificação para o usuário
                    this.showSyncNotification(commit);
                }
            } else {
                console.log('📤 Mudança própria detectada - ignorando');
            }

        } catch (error) {
            console.error('Erro ao processar mudanças remotas:', error);
            this.emitEvent('onError', error);
        } finally {
            this.isUpdating = false;
            this.emitEvent('onSyncEnd');
        }
    }

    // Mostrar notificação de sincronização
    showSyncNotification(commit) {
        const message = `🔄 Dados atualizados por ${commit.committer.name}`;
        
        // Tentar usar sistema de toast se existir
        if (typeof showMessage === 'function') {
            showMessage(message, 'info');
        } else if (window.toast) {
            window.toast(message, 'info');
        } else {
            // Criar notificação própria
            this.createNotification(message);
        }

        console.log('🔔', message);
    }

    // Criar notificação visual
    createNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <div class="sync-notification-content">
                <span class="sync-icon">🔄</span>
                <span class="sync-message">${message}</span>
                <button class="sync-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Estilos inline
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        // Adicionar CSS da animação se não existir
        if (!document.getElementById('sync-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'sync-notification-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .sync-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sync-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 8px;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Sincronizar agora (manual)
    async syncNow() {
        console.log('🔄 Sincronização manual iniciada...');
        await this.checkForChanges();
    }

    // Adicionar evento à fila
    queueEvent(type, data) {
        this.eventQueue.push({
            type,
            data,
            timestamp: Date.now()
        });

        // Processar fila
        this.processEventQueue();
    }

    // Processar fila de eventos
    async processEventQueue() {
        if (this.isUpdating || this.eventQueue.length === 0) return;

        const event = this.eventQueue.shift();
        
        if (event.type === 'local_change') {
            console.log('📤 Processando mudança local para sincronização');
            // A mudança já foi salva pelo sistema GitHub, aguardar um pouco mais
            setTimeout(() => {
                if (!this.isUpdating) {
                    this.checkForChanges();
                }
            }, 5000); // Aumentar delay para evitar conflitos
        }
    }

    // Sistema de callbacks
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    emitEvent(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no callback ${event}:`, error);
                }
            });
        }
    }

    // Configurar sincronização
    configure(options) {
        if (options.pollInterval && options.pollInterval >= 1000) {
            this.pollInterval = options.pollInterval;
            console.log(`⏱️ Intervalo de polling alterado para ${this.pollInterval / 1000}s`);
            
            if (this.enabled) {
                this.startPolling();
            }
        }

        if (options.enabled !== undefined) {
            if (options.enabled && this.gitHub && this.gitHub.token) {
                this.enable();
            } else {
                this.disable();
            }
        }
    }

    // Habilitar sincronização
    enable() {
        if (!this.gitHub || !this.gitHub.token) {
            console.error('❌ Não é possível habilitar - GitHub não configurado');
            return false;
        }

        this.enabled = true;
        this.startPolling();
        console.log('✅ Sincronização em tempo real habilitada');
        return true;
    }

    // Desabilitar sincronização
    disable() {
        this.enabled = false;
        this.stopPolling();
        console.log('⏸️ Sincronização em tempo real desabilitada');
    }

    // Status da sincronização
    getStatus() {
        return {
            enabled: this.enabled,
            polling: !!this.pollTimer,
            interval: this.pollInterval,
            lastCommit: this.lastCommitSha,
            isUpdating: this.isUpdating,
            queueSize: this.eventQueue.length,
            hasGitHub: !!(this.gitHub && this.gitHub.token)
        };
    }

    // Destruir instância
    destroy() {
        this.stopPolling();
        this.callbacks = {};
        this.eventQueue = [];
        console.log('🗑️ Sincronização em tempo real destruída');
    }
}

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para outros sistemas carregarem
    setTimeout(() => {
        window.realTimeSync = new RealTimeSync();
        
        // Funções globais de conveniência
        window.sincronizarAgora = () => window.realTimeSync.syncNow();
        window.statusSincronizacao = () => window.realTimeSync.getStatus();
        
        console.log('🚀 Sistema de sincronização em tempo real inicializado');
    }, 1000);
});

// Exportar classe para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeSync;
}