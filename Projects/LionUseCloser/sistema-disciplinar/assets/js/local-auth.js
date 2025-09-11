// Sistema de Autenticação Local (substitui Firebase Auth)
class LocalAuth {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Obter usuários cadastrados
  getRegisteredUsers() {
    const users = localStorage.getItem('system_users');
    if (!users) {
      // Criar usuários padrão se não existir
      const defaultUsers = {
        'admin@escola.com': {
          password: 'admin123',
          displayName: 'Administrador',
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        'eecmjupiara@gmail.com': {
          password: '123456',
          displayName: 'EECM Jupiara',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      };
      localStorage.setItem('system_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(users);
  }

  // Fazer login
  async signInWithEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      // Simular delay de rede
      setTimeout(() => {
        const users = this.getRegisteredUsers();
        
        // Verificar login básico ou usuários cadastrados
        const isDefaultLogin = (email === 'admin@escola.com' && password === 'admin123') || 
                              (email === 'admin' && password === 'admin123') ||
                              (email === 'admin' && password === 'admin') ||
                              (email === 'admin@escola.com' && password === 'admin');
        
        const userExists = users[email] && users[email].password === password;
        
        if (isDefaultLogin || userExists) {
          const userData = users[email] || {
            displayName: 'Administrador',
            role: 'admin'
          };
          
          this.currentUser = {
            uid: email.replace('@', '_').replace('.', '_'),
            email: email === 'admin' ? 'admin@escola.com' : email,
            displayName: userData.displayName || 'Usuário',
            role: userData.role || 'admin',
            emailVerified: true,
            updatePassword: async (newPassword) => {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  if (newPassword && newPassword.length >= 6) {
                    // Atualizar senha no sistema
                    const users = this.getRegisteredUsers();
                    users[this.currentUser.email].password = newPassword;
                    localStorage.setItem('system_users', JSON.stringify(users));
                    console.log('🔒 Senha atualizada com sucesso');
                    resolve();
                  } else {
                    reject(new Error('Senha deve ter pelo menos 6 caracteres'));
                  }
                }, 500);
              });
            }
          };
          
          this.isAuthenticated = true;
          
          // Salvar no localStorage
          localStorage.setItem('localAuth', JSON.stringify({
            user: this.currentUser,
            timestamp: Date.now()
          }));
          
          console.log('✅ Login realizado com sucesso:', this.currentUser.email);
          resolve({ user: this.currentUser });
        } else {
          reject(new Error('Email ou senha incorretos'));
        }
      }, 500);
    });
  }

  // Fazer logout
  async signOut() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('localAuth');
    console.log('🚪 Logout realizado');
    return Promise.resolve();
  }

  // Verificar se usuário está logado
  getCurrentUser() {
    return this.currentUser;
  }

  // Listener para mudanças de autenticação
  onAuthStateChanged(callback) {
    // Verificar se há sessão salva
    const savedAuth = localStorage.getItem('localAuth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        
        // Verificar se não expirou (24 horas)
        const isExpired = (Date.now() - authData.timestamp) > (24 * 60 * 60 * 1000);
        
        if (!isExpired) {
          // Recuperar dados atualizados do usuário do sistema
          const users = this.getRegisteredUsers();
          const userData = users[authData.user.email] || authData.user;
          
          this.currentUser = {
            uid: authData.user.uid,
            email: authData.user.email,
            displayName: userData.displayName || authData.user.displayName,
            role: userData.role || authData.user.role || 'admin',
            emailVerified: true,
            updatePassword: async (newPassword) => {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  if (newPassword && newPassword.length >= 6) {
                    // Atualizar senha no sistema
                    const users = this.getRegisteredUsers();
                    users[this.currentUser.email].password = newPassword;
                    localStorage.setItem('system_users', JSON.stringify(users));
                    console.log('🔒 Senha atualizada com sucesso');
                    resolve();
                  } else {
                    reject(new Error('Senha deve ter pelo menos 6 caracteres'));
                  }
                }, 500);
              });
            }
          };
          this.isAuthenticated = true;
          console.log('🔑 Sessão recuperada:', this.currentUser.email, 'Role:', this.currentUser.role);
          callback(this.currentUser);
          return;
        } else {
          localStorage.removeItem('localAuth');
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        localStorage.removeItem('localAuth');
      }
    }
    
    callback(null);
  }

  // Definir persistência (compatibilidade Firebase)
  async setPersistence(persistence) {
    // No sistema local, sempre persiste no localStorage
    return Promise.resolve();
  }

  // Redefinição de senha (simulada)
  async sendPasswordResetEmail(email) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@escola.com' || email === 'admin') {
          console.log('📧 Email de redefinição enviado (simulado)');
          resolve();
        } else {
          reject(new Error('Email não encontrado'));
        }
      }, 500);
    });
  }

  // Criar usuário
  async createUserWithEmailAndPassword(email, password, displayName = '', role = 'user') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getRegisteredUsers();
        
        // Verificar se usuário já existe
        if (users[email]) {
          reject(new Error('Este email já está cadastrado'));
          return;
        }
        
        // Validar dados
        if (!email || !email.includes('@')) {
          reject(new Error('Email inválido'));
          return;
        }
        
        if (!password || password.length < 6) {
          reject(new Error('Senha deve ter pelo menos 6 caracteres'));
          return;
        }
        
        // Criar usuário
        users[email] = {
          password: password,
          displayName: displayName || email.split('@')[0],
          role: role,
          createdAt: new Date().toISOString(),
          createdBy: this.currentUser?.email || 'system'
        };
        
        localStorage.setItem('system_users', JSON.stringify(users));
        
        // Sincronizar com GitHub se disponível
        this.syncUsersToGitHub();
        
        console.log('👤 Novo usuário criado:', email);
        resolve({
          user: {
            uid: email.replace('@', '_').replace('.', '_'),
            email: email,
            displayName: users[email].displayName,
            role: users[email].role
          }
        });
      }, 500);
    });
  }

  // Listar usuários (apenas para admins)
  async listUsers() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem listar usuários');
    }
    
    const users = this.getRegisteredUsers();
    return Object.keys(users).map(email => ({
      email: email,
      displayName: users[email].displayName,
      role: users[email].role,
      createdAt: users[email].createdAt
    }));
  }

  // Excluir usuário (apenas para admins)
  async deleteUser(email) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem excluir usuários');
    }
    
    if (email === 'admin@escola.com') {
      throw new Error('Não é possível excluir o usuário administrador principal');
    }
    
    const users = this.getRegisteredUsers();
    if (!users[email]) {
      throw new Error('Usuário não encontrado');
    }
    
    delete users[email];
    localStorage.setItem('system_users', JSON.stringify(users));
    console.log('🗑️ Usuário excluído:', email);
    return true;
  }

  // Alterar papel do usuário
  async updateUserRole(email, newRole) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem alterar papéis');
    }
    
    const users = this.getRegisteredUsers();
    if (!users[email]) {
      throw new Error('Usuário não encontrado');
    }
    
    users[email].role = newRole;
    localStorage.setItem('system_users', JSON.stringify(users));
    console.log('👑 Papel do usuário alterado:', email, '->', newRole);
    return true;
  }

  // Sincronizar usuários com GitHub
  async syncUsersToGitHub() {
    if (window.gitHubSync && window.gitHubSync.podeEscrever()) {
      try {
        const users = this.getRegisteredUsers();
        // Remover senhas por segurança na sincronização
        const safeUsers = {};
        Object.keys(users).forEach(email => {
          safeUsers[email] = {
            displayName: users[email].displayName,
            role: users[email].role,
            createdAt: users[email].createdAt,
            createdBy: users[email].createdBy
          };
        });
        
        console.log('🐙 Sincronizando usuários com GitHub...');
        // Poderia implementar sincronização real aqui se necessário
      } catch (error) {
        console.warn('⚠️ Falha ao sincronizar usuários:', error.message);
      }
    }
  }
}

// Inicializar autenticação local
const localAuth = new LocalAuth();

// Garantir que usuário padrão sempre exista
localAuth.getRegisteredUsers();

// Compatibilidade com código existente do Firebase Auth
window.firebase = window.firebase || {};
window.firebase.auth = () => localAuth;

// Constantes de persistência para compatibilidade
window.firebase.auth.Auth = {
  Persistence: {
    LOCAL: 'local',
    SESSION: 'session',
    NONE: 'none'
  }
};

// Função requireAuth compatível
window.requireAuth = function(options = {}) {
  const loginPath = options.loginPath || 'login.html';
  const onAuth = options.onAuth || (() => {});
  
  localAuth.onAuthStateChanged((user) => {
    if (user) {
      onAuth(user);
    } else {
      // Redirecionar para login se não estiver na página de login
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = loginPath;
      }
    }
  });
};

// Expor para uso global
window.localAuth = localAuth;