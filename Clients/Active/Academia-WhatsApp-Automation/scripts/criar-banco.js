/**
 * Script para criar banco SQLite manualmente
 * Bypass dos problemas do Prisma
 */

import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = './academia_whatsapp.db';

// Remover banco existente se houver
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️  Banco anterior removido');
}

console.log('🚀 Criando banco SQLite para Full Force Academia...');

const db = new Database(DB_PATH);

// Criar tabelas essenciais
const createTables = `
-- Tabela de Academias
CREATE TABLE academias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  telefone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Alunos
CREATE TABLE alunos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'ATIVO',
  ultima_visita DATETIME,
  data_matricula DATETIME DEFAULT CURRENT_TIMESTAMP,
  valor_mensalidade TEXT,
  permite_whatsapp BOOLEAN DEFAULT 1,
  academia_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(telefone, academia_id),
  FOREIGN KEY (academia_id) REFERENCES academias(id) ON DELETE CASCADE
);

-- Tabela de Mensagens
CREATE TABLE mensagens (
  id TEXT PRIMARY KEY,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT DEFAULT 'ENVIADA',
  whatsapp_id TEXT,
  aluno_id TEXT,
  academia_id TEXT NOT NULL,
  enviada_em DATETIME,
  respondida BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE SET NULL,
  FOREIGN KEY (academia_id) REFERENCES academias(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_alunos_status_visita ON alunos(status, ultima_visita);
CREATE INDEX idx_alunos_telefone ON alunos(telefone);
CREATE INDEX idx_mensagens_tipo_status ON mensagens(tipo, status);
CREATE INDEX idx_mensagens_enviada ON mensagens(enviada_em);
`;

try {
  // Executar criação das tabelas
  db.exec(createTables);
  
  console.log('✅ Tabelas criadas com sucesso:');
  console.log('   - academias');
  console.log('   - alunos'); 
  console.log('   - mensagens');
  
  // Inserir Full Force Academia
  const insertAcademia = db.prepare(`
    INSERT INTO academias (id, nome, cnpj, telefone, whatsapp_number)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertAcademia.run(
    'full-force-matupa',
    'Full Force Academia', 
    '48.123.456/0001-78',
    '+55 66 99876-5432',
    '+55 66 99876-5432'
  );
  
  console.log('🏢 Full Force Academia inserida no banco');
  
  // Verificar estrutura
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('');
  console.log('📊 Estrutura do banco:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   - ${table.name}: ${count.count} registros`);
  });
  
  console.log('');
  console.log('✅ BANCO CRIADO COM SUCESSO!');
  console.log('📁 Arquivo: academia_whatsapp.db');
  console.log('🚀 Pronto para importação de ex-alunos');
  
} catch (error) {
  console.error('❌ Erro ao criar banco:', error.message);
  process.exit(1);
} finally {
  db.close();
}