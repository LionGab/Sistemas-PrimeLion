// Cliente API para comunicação com Netlify Functions + NeonDB

class APIClient {
  constructor() {
    // Configuração para usecloser.com.br/sistema-disciplinar
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.baseURL = 'http://localhost:8888/.netlify/functions/api';
    } else {
      // Produção em usecloser.com.br/sistema-disciplinar
      this.baseURL = '/sistema-disciplinar/api';
    }
    
    this.token = localStorage.getItem('authToken');
  }

  // Headers padrão
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha no login');
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/pages/login.html';
  }

  // Get User Data
  getUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if logged in
  isAuthenticated() {
    return !!this.token;
  }

  // ALUNOS
  async getAlunos() {
    const response = await fetch(`${this.baseURL}/alunos`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) throw new Error('Erro ao buscar alunos');
    return response.json();
  }

  async createAluno(data) {
    const response = await fetch(`${this.baseURL}/alunos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Erro ao criar aluno');
    return response.json();
  }

  // MEDIDAS
  async getMedidas() {
    const response = await fetch(`${this.baseURL}/medidas`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) throw new Error('Erro ao buscar medidas');
    return response.json();
  }

  async createMedida(data) {
    const response = await fetch(`${this.baseURL}/medidas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Erro ao criar medida');
    return response.json();
  }

  // FREQUÊNCIA
  async getFrequencia(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${this.baseURL}/frequencia?${query}` : `${this.baseURL}/frequencia`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) throw new Error('Erro ao buscar frequência');
    return response.json();
  }

  async saveFrequencia(registros) {
    const response = await fetch(`${this.baseURL}/frequencia`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ registros })
    });
    
    if (!response.ok) throw new Error('Erro ao salvar frequência');
    return response.json();
  }

  // DASHBOARD
  async getDashboardStats() {
    const response = await fetch(`${this.baseURL}/dashboard`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) throw new Error('Erro ao buscar estatísticas');
    return response.json();
  }
}

// Exportar instância única
window.apiClient = new APIClient();

// Auto-redirect removido - será tratado individualmente em cada página