/**
 * LinkedIn Headline Rotator - Sistema de A/B Testing Automatizado
 * Versão: 2.0
 * Autor: Growth Masters
 * 
 * INSTRUÇÕES DE USO:
 * 1. Instale a extensão Tampermonkey no Chrome/Firefox
 * 2. Crie um novo script e cole este código
 * 3. Configure suas headlines no array HEADLINES
 * 4. O script rotacionará automaticamente a cada período definido
 * 5. Métricas são salvas no localStorage do navegador
 */

// ==UserScript==
// @name         LinkedIn Headline Rotator Pro
// @namespace    http://linkedin.com/
// @version      2.0
// @description  Rotaciona headlines para A/B testing com tracking automático
// @author       Growth Masters
// @match        https://www.linkedin.com/*
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    
    // ========== CONFIGURAÇÕES ==========
    const CONFIG = {
        // Headlines para testar (adicione quantas quiser)
        HEADLINES: [
            {
                id: 'roi3x',
                text: 'Especialista em Sistema ROI 3X | +R$50M gerados | CEO @ Growth Masters',
                emoji: '🚀'
            },
            {
                id: 'framework',
                text: 'Criador do Framework de Escala Validado™ | 150+ empresas aceleradas',
                emoji: '📈'
            },
            {
                id: 'receita',
                text: 'Aceleração de Receita Recorrente | MRR +300% em 6 meses | Estrategista B2B',
                emoji: '💰'
            },
            {
                id: 'transformacao',
                text: 'Transformação Executiva 90 Dias | Scale-up R$500k→R$5M | Mentor de CEOs',
                emoji: '🎯'
            },
            {
                id: 'consultoria',
                text: 'Consultoria Premium para Scale-ups | Faturamento Previsível | Top Voice',
                emoji: '🏆'
            }
        ],
        
        // Configurações de rotação
        ROTATION_DAYS: 7,              // Dias antes de trocar headline
        TRACK_METRICS: true,            // Ativar tracking de métricas
        SHOW_NOTIFICATIONS: true,       // Mostrar notificações
        AUTO_EXPORT: true,              // Exportar dados automaticamente
        EXPORT_INTERVAL_DAYS: 30,       // Intervalo para export automático
    };
    
    // ========== ESTADO DO SISTEMA ==========
    class HeadlineManager {
        constructor() {
            this.currentHeadline = this.getCurrentHeadline();
            this.metrics = this.loadMetrics();
            this.initializeSystem();
        }
        
        // Inicializa o sistema
        initializeSystem() {
            console.log('🚀 LinkedIn Headline Rotator iniciado');
            this.injectUI();
            this.checkRotation();
            this.trackPageViews();
            this.setupEventListeners();
            
            if (CONFIG.AUTO_EXPORT) {
                this.checkAutoExport();
            }
        }
        
        // Obtém headline atual
        getCurrentHeadline() {
            const stored = localStorage.getItem('lhr_current_headline');
            if (!stored) {
                const first = CONFIG.HEADLINES[0];
                this.saveCurrentHeadline(first);
                return first;
            }
            return JSON.parse(stored);
        }
        
        // Salva headline atual
        saveCurrentHeadline(headline) {
            const data = {
                ...headline,
                startDate: new Date().toISOString(),
                endDate: null
            };
            localStorage.setItem('lhr_current_headline', JSON.stringify(data));
        }
        
        // Carrega métricas
        loadMetrics() {
            const stored = localStorage.getItem('lhr_metrics');
            return stored ? JSON.parse(stored) : {};
        }
        
        // Salva métricas
        saveMetrics() {
            localStorage.setItem('lhr_metrics', JSON.stringify(this.metrics));
        }
        
        // Verifica se deve rotacionar
        checkRotation() {
            const startDate = new Date(this.currentHeadline.startDate);
            const now = new Date();
            const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            
            if (daysPassed >= CONFIG.ROTATION_DAYS) {
                this.rotateHeadline();
            } else {
                const daysLeft = CONFIG.ROTATION_DAYS - daysPassed;
                this.showNotification(`⏰ Próxima rotação em ${daysLeft} dias`, 'info');
            }
        }
        
        // Rotaciona headline
        rotateHeadline() {
            // Finaliza métricas da headline atual
            this.finalizeCurrentMetrics();
            
            // Encontra próxima headline
            const currentIndex = CONFIG.HEADLINES.findIndex(h => h.id === this.currentHeadline.id);
            const nextIndex = (currentIndex + 1) % CONFIG.HEADLINES.length;
            const nextHeadline = CONFIG.HEADLINES[nextIndex];
            
            // Atualiza headline
            this.saveCurrentHeadline(nextHeadline);
            this.currentHeadline = nextHeadline;
            
            // Notifica usuário
            this.showNotification(
                `🔄 Headline rotacionada!\nNova: ${nextHeadline.emoji} ${nextHeadline.text}`,
                'success'
            );
            
            // Atualiza UI
            this.updateUI();
        }
        
        // Finaliza métricas atuais
        finalizeCurrentMetrics() {
            const id = this.currentHeadline.id;
            if (!this.metrics[id]) {
                this.metrics[id] = this.createEmptyMetrics();
            }
            
            this.metrics[id].endDate = new Date().toISOString();
            this.metrics[id].status = 'completed';
            this.saveMetrics();
        }
        
        // Cria objeto de métricas vazio
        createEmptyMetrics() {
            return {
                headline: this.currentHeadline.text,
                views: 0,
                connections: 0,
                messages: 0,
                profileClicks: 0,
                startDate: this.currentHeadline.startDate,
                endDate: null,
                status: 'active',
                conversionRate: 0
            };
        }
        
        // Rastreia visualizações
        trackPageViews() {
            // Simula tracking de page views
            if (window.location.pathname === '/in/') {
                const id = this.currentHeadline.id;
                if (!this.metrics[id]) {
                    this.metrics[id] = this.createEmptyMetrics();
                }
                this.metrics[id].views++;
                this.saveMetrics();
            }
        }
        
        // Injeta UI no LinkedIn
        injectUI() {
            const style = document.createElement('style');
            style.textContent = `
                .lhr-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 320px;
                }
                .lhr-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .lhr-title {
                    font-weight: 600;
                    color: #0077b5;
                    font-size: 14px;
                }
                .lhr-close {
                    cursor: pointer;
                    color: #666;
                    font-size: 20px;
                    line: 1;
                }
                .lhr-current {
                    background: linear-gradient(135deg, #0077b5, #00a0dc);
                    color: white;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    font-size: 13px;
                }
                .lhr-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .lhr-metric {
                    background: #f3f2ef;
                    padding: 8px;
                    border-radius: 6px;
                    text-align: center;
                }
                .lhr-metric-value {
                    font-size: 18px;
                    font-weight: bold;
                    color: #0077b5;
                }
                .lhr-metric-label {
                    font-size: 11px;
                    color: #666;
                    margin-top: 2px;
                }
                .lhr-actions {
                    display: flex;
                    gap: 8px;
                }
                .lhr-btn {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .lhr-btn-primary {
                    background: #0077b5;
                    color: white;
                }
                .lhr-btn-primary:hover {
                    background: #005885;
                }
                .lhr-btn-secondary {
                    background: #f3f2ef;
                    color: #666;
                }
                .lhr-btn-secondary:hover {
                    background: #e1e0dd;
                }
            `;
            document.head.appendChild(style);
            
            const widget = document.createElement('div');
            widget.className = 'lhr-widget';
            widget.id = 'lhr-widget';
            widget.innerHTML = this.getWidgetHTML();
            document.body.appendChild(widget);
        }
        
        // HTML do widget
        getWidgetHTML() {
            const metrics = this.metrics[this.currentHeadline.id] || this.createEmptyMetrics();
            const startDate = new Date(this.currentHeadline.startDate);
            const daysPassed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="lhr-header">
                    <div class="lhr-title">🚀 Headline Rotator Pro</div>
                    <span class="lhr-close" onclick="document.getElementById('lhr-widget').style.display='none'">×</span>
                </div>
                <div class="lhr-current">
                    <strong>Ativa:</strong> ${this.currentHeadline.emoji} ${this.currentHeadline.text.substring(0, 50)}...
                    <br><small>Dia ${daysPassed + 1} de ${CONFIG.ROTATION_DAYS}</small>
                </div>
                <div class="lhr-metrics">
                    <div class="lhr-metric">
                        <div class="lhr-metric-value">${metrics.views || 0}</div>
                        <div class="lhr-metric-label">Views</div>
                    </div>
                    <div class="lhr-metric">
                        <div class="lhr-metric-value">${metrics.connections || 0}</div>
                        <div class="lhr-metric-label">Conexões</div>
                    </div>
                    <div class="lhr-metric">
                        <div class="lhr-metric-value">${metrics.messages || 0}</div>
                        <div class="lhr-metric-label">Mensagens</div>
                    </div>
                    <div class="lhr-metric">
                        <div class="lhr-metric-value">${((metrics.connections / metrics.views) * 100 || 0).toFixed(1)}%</div>
                        <div class="lhr-metric-label">Taxa Conv.</div>
                    </div>
                </div>
                <div class="lhr-actions">
                    <button class="lhr-btn lhr-btn-primary" onclick="headlineManager.forceRotate()">
                        Rotacionar Agora
                    </button>
                    <button class="lhr-btn lhr-btn-secondary" onclick="headlineManager.exportData()">
                        Exportar Dados
                    </button>
                </div>
            `;
        }
        
        // Atualiza UI
        updateUI() {
            const widget = document.getElementById('lhr-widget');
            if (widget) {
                widget.innerHTML = this.getWidgetHTML();
            }
        }
        
        // Força rotação manual
        forceRotate() {
            if (confirm('Tem certeza que deseja rotacionar a headline agora?')) {
                this.rotateHeadline();
            }
        }
        
        // Exporta dados
        exportData() {
            const data = {
                currentHeadline: this.currentHeadline,
                metrics: this.metrics,
                exportDate: new Date().toISOString(),
                config: CONFIG
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `linkedin-headline-metrics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            this.showNotification('📊 Dados exportados com sucesso!', 'success');
        }
        
        // Verifica export automático
        checkAutoExport() {
            const lastExport = localStorage.getItem('lhr_last_export');
            if (!lastExport) {
                localStorage.setItem('lhr_last_export', new Date().toISOString());
                return;
            }
            
            const daysSinceExport = Math.floor((new Date() - new Date(lastExport)) / (1000 * 60 * 60 * 24));
            if (daysSinceExport >= CONFIG.EXPORT_INTERVAL_DAYS) {
                this.exportData();
                localStorage.setItem('lhr_last_export', new Date().toISOString());
            }
        }
        
        // Configura event listeners
        setupEventListeners() {
            // Detecta cliques em conexões
            document.addEventListener('click', (e) => {
                if (e.target.textContent?.includes('Conectar') || e.target.textContent?.includes('Connect')) {
                    const id = this.currentHeadline.id;
                    if (!this.metrics[id]) {
                        this.metrics[id] = this.createEmptyMetrics();
                    }
                    this.metrics[id].connections++;
                    this.saveMetrics();
                    this.updateUI();
                }
            });
            
            // Atualiza UI a cada minuto
            setInterval(() => this.updateUI(), 60000);
        }
        
        // Mostra notificação
        showNotification(message, type = 'info') {
            if (!CONFIG.SHOW_NOTIFICATIONS) return;
            
            // Notificação nativa do browser se disponível
            if (typeof GM_notification !== 'undefined') {
                GM_notification({
                    title: 'LinkedIn Headline Rotator',
                    text: message,
                    timeout: 5000
                });
            } else {
                console.log(`[LHR ${type}] ${message}`);
            }
        }
    }
    
    // ========== INICIALIZAÇÃO ==========
    window.headlineManager = new HeadlineManager();
    
    // Mensagem de boas-vindas
    console.log(`
╔════════════════════════════════════════╗
║   LinkedIn Headline Rotator Pro 2.0    ║
║   Sistema de A/B Testing Automatizado   ║
║   © Growth Masters                      ║
╚════════════════════════════════════════╝
    `);
    
})();