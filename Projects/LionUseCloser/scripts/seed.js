// Script para popular o banco com dados iniciais
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('🌱 Populando banco de dados...');

  try {
    // Criar usuário admin padrão
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('admin@escola.com', ${hashedPassword}, 'Administrador', 'admin')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Usuário admin criado');

    // Criar alguns usuários de exemplo
    const professor1Password = await bcrypt.hash('prof123', 10);
    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('professor1@escola.com', ${professor1Password}, 'Professor Silva', 'professor')
      ON CONFLICT (email) DO NOTHING
    `;

    const gestorPassword = await bcrypt.hash('gestor123', 10);
    await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('gestor@escola.com', ${gestorPassword}, 'Gestor Santos', 'gestor')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Usuários de exemplo criados');

    // Buscar ID do admin para usar como created_by
    const adminUser = await sql`SELECT id FROM users WHERE email = 'admin@escola.com' LIMIT 1`;
    const adminId = adminUser[0].id;

    // Criar turmas e alunos de exemplo
    const turmas = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B'];
    const nomes = [
      'Ana Silva', 'Bruno Santos', 'Carlos Oliveira', 'Diana Costa', 'Eduardo Lima',
      'Fernanda Souza', 'Gabriel Ferreira', 'Helena Martins', 'Igor Alves', 'Julia Rodrigues'
    ];

    let matricula = 2024001;
    for (const turma of turmas) {
      for (let i = 0; i < 5; i++) {
        const nomeIndex = Math.floor(Math.random() * nomes.length);
        const nome = `${nomes[nomeIndex]} ${turma}`;
        
        await sql`
          INSERT INTO alunos (nome, turma, matricula, created_by)
          VALUES (${nome}, ${turma}, ${matricula.toString()}, ${adminId})
          ON CONFLICT (matricula) DO NOTHING
        `;
        matricula++;
      }
    }
    console.log('✅ Alunos de exemplo criados');

    // Criar algumas medidas disciplinares de exemplo
    const tiposMedidas = ['Advertência Verbal', 'Advertência Escrita', 'Suspensão', 'Reunião com Responsáveis'];
    const descricoes = [
      'Desrespeito ao professor durante a aula',
      'Uso indevido do celular em sala',
      'Atraso recorrente',
      'Não realização das atividades',
      'Comportamento inadequado no recreio'
    ];

    const alunos = await sql`SELECT id FROM alunos LIMIT 10`;
    
    for (const aluno of alunos) {
      // Criar 1-2 medidas por aluno
      const numMedidas = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numMedidas; i++) {
        const tipo = tiposMedidas[Math.floor(Math.random() * tiposMedidas.length)];
        const descricao = descricoes[Math.floor(Math.random() * descricoes.length)];
        const diasAtras = Math.floor(Math.random() * 30);
        const data = new Date();
        data.setDate(data.getDate() - diasAtras);
        
        await sql`
          INSERT INTO medidas (aluno_id, tipo, descricao, data, created_by)
          VALUES (${aluno.id}, ${tipo}, ${descricao}, ${data.toISOString().split('T')[0]}, ${adminId})
        `;
      }
    }
    console.log('✅ Medidas disciplinares de exemplo criadas');

    // Criar registros de frequência para hoje
    const hoje = new Date().toISOString().split('T')[0];
    const statusOptions = ['P', 'P', 'P', 'P', 'F', 'FJ']; // Mais presenças que faltas
    
    for (const aluno of alunos) {
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const observacao = status === 'F' ? 'Falta não justificada' : 
                       status === 'FJ' ? 'Atestado médico apresentado' : null;
      
      await sql`
        INSERT INTO frequencia (aluno_id, data, status, observacao, created_by)
        VALUES (${aluno.id}, ${hoje}, ${status}, ${observacao}, ${adminId})
        ON CONFLICT (aluno_id, data) DO NOTHING
      `;
    }
    console.log('✅ Frequência de exemplo criada');

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📧 Credenciais de acesso:');
    console.log('   Admin: admin@escola.com / admin123');
    console.log('   Professor: professor1@escola.com / prof123');
    console.log('   Gestor: gestor@escola.com / gestor123');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

seed();