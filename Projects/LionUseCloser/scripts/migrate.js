// Script para criar tabelas no NeonDB
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🚀 Iniciando migração do banco de dados...');

  try {
    // Limpar tabelas se existirem (para recriar)
    await sql`DROP TABLE IF EXISTS frequencia CASCADE`;
    await sql`DROP TABLE IF EXISTS medidas CASCADE`;
    await sql`DROP TABLE IF EXISTS alunos CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    console.log('🧹 Tabelas antigas removidas');

    // Tabela de usuários
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'professor',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela users criada');

    // Tabela de alunos
    await sql`
      CREATE TABLE alunos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        turma VARCHAR(20) NOT NULL,
        matricula VARCHAR(50) UNIQUE,
        data_nascimento DATE,
        responsavel_nome VARCHAR(255),
        responsavel_telefone VARCHAR(20),
        observacoes TEXT,
        active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela alunos criada');

    // Tabela de medidas disciplinares
    await sql`
      CREATE TABLE medidas (
        id SERIAL PRIMARY KEY,
        aluno_id INTEGER NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT NOT NULL,
        data DATE NOT NULL,
        providencias TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela medidas criada');

    // Tabela de frequência
    await sql`
      CREATE TABLE frequencia (
        id SERIAL PRIMARY KEY,
        aluno_id INTEGER NOT NULL,
        data DATE NOT NULL,
        status CHAR(2) NOT NULL,
        observacao TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(aluno_id, data)
      )
    `;
    console.log('✅ Tabela frequencia criada');

    // Adicionar foreign keys após criar todas as tabelas
    await sql`ALTER TABLE alunos ADD CONSTRAINT fk_alunos_created_by FOREIGN KEY (created_by) REFERENCES users(id)`;
    await sql`ALTER TABLE medidas ADD CONSTRAINT fk_medidas_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE`;
    await sql`ALTER TABLE medidas ADD CONSTRAINT fk_medidas_created_by FOREIGN KEY (created_by) REFERENCES users(id)`;
    await sql`ALTER TABLE frequencia ADD CONSTRAINT fk_frequencia_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE`;
    await sql`ALTER TABLE frequencia ADD CONSTRAINT fk_frequencia_created_by FOREIGN KEY (created_by) REFERENCES users(id)`;
    console.log('✅ Foreign keys adicionadas');

    // Índices para performance
    await sql`CREATE INDEX idx_alunos_turma ON alunos(turma)`;
    await sql`CREATE INDEX idx_medidas_aluno ON medidas(aluno_id)`;
    await sql`CREATE INDEX idx_medidas_data ON medidas(data)`;
    await sql`CREATE INDEX idx_frequencia_data ON frequencia(data)`;
    await sql`CREATE INDEX idx_frequencia_aluno ON frequencia(aluno_id)`;
    console.log('✅ Índices criados');

    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();