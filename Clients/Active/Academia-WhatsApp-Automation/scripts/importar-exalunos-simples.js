/**
 * Script Simplificado de Importação de Ex-Alunos
 * Usando SQLite direto (bypass Prisma)
 * CRÍTICO: Importar 561 ex-alunos para reativação
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const DB_PATH = './academia_whatsapp.db';

async function importarExAlunos(caminhoArquivo) {
  console.log('🚀 INICIANDO IMPORTAÇÃO DE EX-ALUNOS');
  console.log('📍 Full Force Academia - Matupá/MT');
  console.log('💰 Oportunidade: R$ 50k+/mês em reativações');
  console.log('');
  
  // Verificar arquivo
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }
  
  // Conectar ao banco
  const db = new Database(DB_PATH);
  
  try {
    // Verificar academia
    const academia = db.prepare('SELECT * FROM academias LIMIT 1').get();
    if (!academia) {
      throw new Error('Academia não encontrada no banco');
    }
    
    console.log(`🏢 Academia: ${academia.nome}`);
    
    // Ler CSV
    console.log(`📄 Lendo arquivo: ${caminhoArquivo}`);
    const csvContent = fs.readFileSync(caminhoArquivo, 'utf-8');
    const registros = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`📊 ${registros.length} registros encontrados no CSV`);
    console.log('');
    
    // Preparar statements
    const verificarAluno = db.prepare('SELECT id FROM alunos WHERE telefone = ? AND academia_id = ?');
    const inserirAluno = db.prepare(`
      INSERT INTO alunos (
        id, nome, telefone, email, status, ultima_visita, 
        valor_mensalidade, data_matricula, permite_whatsapp, academia_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let importados = 0;
    let erros = 0;
    let jaExistentes = 0;
    
    // Processar cada registro
    for (const [index, registro] of registros.entries()) {
      try {
        console.log(`[${index + 1}/${registros.length}] Processando: ${registro.nome}`);
        
        // Limpar telefone
        const telefone = registro.telefone.replace(/\D/g, '');
        
        // Verificar se já existe
        const existente = verificarAluno.get(telefone, academia.id);
        if (existente) {
          console.log(`   ⚠️  Já existe: ${registro.nome} (${telefone})`);
          jaExistentes++;
          continue;
        }
        
        // Inserir novo aluno
        const novoId = randomUUID();
        inserirAluno.run(
          novoId,
          registro.nome,
          telefone,
          registro.email || null,
          registro.status || 'INATIVO',
          registro.ultimaVisita || null,
          registro.valorMensalidade || null,
          registro.dataMatricula || new Date().toISOString(),
          1, // permite_whatsapp = true
          academia.id
        );
        
        console.log(`   ✅ Importado: ${registro.nome} (ID: ${novoId.substring(0, 8)}...)`);
        importados++;
        
      } catch (error) {
        console.error(`   ❌ Erro ao importar ${registro.nome}:`, error.message);
        erros++;
      }
    }
    
    // Estatísticas finais
    const totalAlunos = db.prepare('SELECT COUNT(*) as count FROM alunos').get().count;
    
    console.log('');
    console.log('📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`   ✅ Importados com sucesso: ${importados}`);
    console.log(`   ⚠️  Já existentes: ${jaExistentes}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📈 Total processados: ${registros.length}`);
    console.log(`   👥 Total de alunos no banco: ${totalAlunos}`);
    
    // Potencial de receita
    const receitaMedia = 150; // R$ 150 por aluno/mês
    const metaReativacao = Math.floor(importados * 0.3); // 30% de reativação
    const receitaEsperada = metaReativacao * receitaMedia;
    
    console.log('');
    console.log('💰 POTENCIAL DE RECEITA:');
    console.log(`   🎯 Meta de reativação: ${metaReativacao} ex-alunos (30%)`);
    console.log(`   💵 Receita esperada: R$ ${receitaEsperada.toLocaleString('pt-BR')}/mês`);
    console.log(`   📈 ROI anual estimado: R$ ${(receitaEsperada * 12).toLocaleString('pt-BR')}`);
    
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS CRÍTICOS:');
    console.log('   1. ✅ Ex-alunos importados com sucesso');
    console.log('   2. ⏳ Conectar WhatsApp Business');
    console.log('   3. ⏳ Configurar templates de mensagens');
    console.log('   4. ⏳ Disparar campanha de reativação');
    
    return {
      importados,
      erros,
      jaExistentes,
      total: registros.length,
      totalAlunosNoBanco: totalAlunos,
      receitaEsperada
    };
    
  } finally {
    db.close();
  }
}

// Executar se chamado diretamente
if (process.argv.length < 3) {
  console.log('❌ Uso: node scripts/importar-exalunos-simples.js caminho/para/arquivo.csv');
  console.log('');
  console.log('📝 Formato do CSV esperado:');
  console.log('nome,telefone,email,status,ultimaVisita,valorMensalidade,dataMatricula,planoAnterior');
  process.exit(1);
}

const caminhoArquivo = process.argv[2];
importarExAlunos(caminhoArquivo)
  .then((resultado) => {
    console.log('');
    console.log('✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🚀 Sistema pronto para iniciar campanhas de reativação');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FALHA NA IMPORTAÇÃO:', error.message);
    process.exit(1);
  });