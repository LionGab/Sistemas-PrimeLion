// Netlify Function - API principal
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuração do NeonDB
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Helper para CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper para verificar JWT
function verifyToken(token) {
  try {
    if (!token) return null;
    return jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Handler principal
exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  const token = event.headers.authorization;
  
  console.log('🚀 API Request:', { 
    originalPath: event.path, 
    processedPath: path, 
    method,
    body: event.body ? JSON.parse(event.body) : null 
  });
  
  try {
    // Rotas públicas
    if (path === '/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body);
      
      // Buscar usuário
      const users = await sql`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `;
      
      if (!users[0]) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Email ou senha incorretos' })
        };
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, users[0].password_hash);
      if (!validPassword) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Email ou senha incorretos' })
        };
      }

      // Gerar token
      const tokenPayload = {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        role: users[0].role
      };
      
      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: accessToken,
          user: tokenPayload
        })
      };
    }

    // Verificar autenticação para outras rotas
    const user = verifyToken(token);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Não autorizado' })
      };
    }

    // ROTAS PROTEGIDAS

    // GET /alunos
    if (path === '/alunos' && method === 'GET') {
      const alunos = await sql`
        SELECT * FROM alunos ORDER BY turma, nome
      `;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(alunos)
      };
    }

    // POST /alunos
    if (path === '/alunos' && method === 'POST') {
      const { nome, turma, matricula } = JSON.parse(event.body);
      
      const result = await sql`
        INSERT INTO alunos (nome, turma, matricula, created_by)
        VALUES (${nome}, ${turma}, ${matricula}, ${user.id})
        RETURNING *
      `;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // GET /medidas
    if (path === '/medidas' && method === 'GET') {
      const medidas = await sql`
        SELECT m.*, a.nome as aluno_nome, a.turma 
        FROM medidas m
        JOIN alunos a ON m.aluno_id = a.id
        ORDER BY m.created_at DESC
        LIMIT 100
      `;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(medidas)
      };
    }

    // POST /medidas
    if (path === '/medidas' && method === 'POST') {
      const { aluno_id, tipo, descricao, data } = JSON.parse(event.body);
      
      const result = await sql`
        INSERT INTO medidas (aluno_id, tipo, descricao, data, created_by)
        VALUES (${aluno_id}, ${tipo}, ${descricao}, ${data}, ${user.id})
        RETURNING *
      `;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // GET /frequencia
    if (path === '/frequencia' && method === 'GET') {
      const { data, turma } = event.queryStringParameters || {};
      
      let query = 'SELECT f.*, a.nome as aluno_nome FROM frequencia f JOIN alunos a ON f.aluno_id = a.id WHERE 1=1';
      const params = [];
      
      if (data) {
        params.push(data);
        query += ` AND f.data = $${params.length}`;
      }
      
      if (turma) {
        params.push(turma);
        query += ` AND a.turma = $${params.length}`;
      }
      
      query += ' ORDER BY a.turma, a.nome';
      
      const frequencia = await sql(query, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(frequencia)
      };
    }

    // POST /frequencia
    if (path === '/frequencia' && method === 'POST') {
      const { registros } = JSON.parse(event.body);
      
      // Inserir múltiplos registros
      for (const reg of registros) {
        await sql`
          INSERT INTO frequencia (aluno_id, data, status, observacao, created_by)
          VALUES (${reg.aluno_id}, ${reg.data}, ${reg.status}, ${reg.observacao}, ${user.id})
          ON CONFLICT (aluno_id, data) 
          DO UPDATE SET status = ${reg.status}, observacao = ${reg.observacao}
        `;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, count: registros.length })
      };
    }

    // GET /dashboard
    if (path === '/dashboard' && method === 'GET') {
      const stats = await sql`
        SELECT 
          (SELECT COUNT(*) FROM alunos) as total_alunos,
          (SELECT COUNT(*) FROM medidas WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as medidas_mes,
          (SELECT COUNT(*) FROM frequencia WHERE data = CURRENT_DATE AND status = 'F') as faltas_hoje,
          (SELECT COUNT(DISTINCT turma) FROM alunos) as total_turmas
      `;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(stats[0])
      };
    }

    // Rota não encontrada
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Rota não encontrada' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};