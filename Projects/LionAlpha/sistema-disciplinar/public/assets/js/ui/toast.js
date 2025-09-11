// assets/js/ui/toast.js
// Sistema de notificações toast

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Set();
    this.init();
  }

  init() {
    // Criar container se não existir
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 4000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    this.toasts.add(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remover
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }

    // Adicionar evento de clique para fechar
    toast.addEventListener('click', () => {
      this.remove(toast);
    });

    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Ícone baseado no tipo
    let icon = '';
    switch (type) {
      case 'success':
        icon = '✅';
        break;
      case 'error':
        icon = '❌';
        break;
      case 'warning':
        icon = '⚠️';
        break;
      case 'info':
      default:
        icon = 'ℹ️';
        break;
    }
    
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="event.stopPropagation()">&times;</button>
    `;
    
    // Evento de fechar no botão
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.remove(toast);
    });

    return toast;
  }

  remove(toast) {
    if (!this.toasts.has(toast)) return;

    toast.classList.remove('show');
    toast.classList.add('hiding');

    setTimeout(() => {
      if (this.container.contains(toast)) {
        this.container.removeChild(toast);
      }
      this.toasts.delete(toast);
    }, 300);
  }

  clear() {
    this.toasts.forEach(toast => {
      this.remove(toast);
    });
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Instância global
let toastManager = null;

// Função global para compatibilidade
function showToast(message, type = 'info', duration = 4000) {
  if (!toastManager) {
    toastManager = new ToastManager();
  }
  return toastManager.show(message, type, duration);
}

// Funções de conveniência
function showSuccessToast(message, duration) {
  return showToast(message, 'success', duration);
}

function showErrorToast(message, duration) {
  return showToast(message, 'error', duration);
}

function showWarningToast(message, duration) {
  return showToast(message, 'warning', duration);
}

function showInfoToast(message, duration) {
  return showToast(message, 'info', duration);
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  if (!toastManager) {
    toastManager = new ToastManager();
  }
});

// Exportar para uso global
window.ToastManager = ToastManager;
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;