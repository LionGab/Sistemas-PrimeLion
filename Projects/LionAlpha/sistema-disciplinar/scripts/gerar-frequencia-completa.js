#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Gerando dados de frequência para todos os alunos...');

const dbPath = path.join(__dirname, 'data', 'db.json');
const frequenciaPath = path.join(__dirname, 'dados', 'frequencia.json');

try {
  // Carregar dados principais
  console.log('📂 Carregando data/db.json...');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  // Extrair todos os alunos únicos
  const alunosUnicos = new Map();
  
  // Buscar alunos na coleção 'alunos'
  if (dbData.alunos && typeof dbData.alunos === 'object') {
    Object.entries(dbData.alunos).forEach(([id, aluno]) => {
      if (aluno.nome_completo || aluno.nome) {
        alunosUnicos.set(id, {
          codigo: id,
          nome: aluno.nome_completo || aluno.nome,
          turma: aluno.turma || '6A'
        });
      }
    });
  }
  
  // Se não encontrou na estrutura 'alunos', procurar em outras coleções
  if (alunosUnicos.size === 0) {
    console.log('⚠️  Estrutura alunos não encontrada, procurando em outras coleções...');
    
    // Buscar em todas as chaves do objeto principal
    Object.entries(dbData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([id, item]) => {
          if (item && typeof item === 'object') {
            // Procurar campos que indicam dados de aluno
            if (item.nome_completo || item.nome_aluno || item.nome) {
              const codigo = item.codigo_aluno || item.codigo || id;
              const nome = item.nome_completo || item.nome_aluno || item.nome;
              const turma = item.turma || '6A';
              
              if (!alunosUnicos.has(codigo)) {
                alunosUnicos.set(codigo, {
                  codigo,
                  nome,
                  turma
                });
              }
            }
          }
        });
      }
    });
  }
  
  console.log(`👥 Encontrados ${alunosUnicos.size} alunos únicos`);
  
  if (alunosUnicos.size === 0) {
    throw new Error('Nenhum aluno encontrado no banco de dados');
  }
  
  // Gerar dados de frequência para agosto de 2024
  const registrosFrequencia = [];
  let idCounter = 1;
  
  // Dias úteis de agosto até 20/08 (dia 21 só foi lançado para turma 9A)
  const diasLetivos = [
    '2024-08-01', '2024-08-04', '2024-08-05', '2024-08-06', '2024-08-07', '2024-08-08', 
    '2024-08-11', '2024-08-12', '2024-08-13', '2024-08-14', '2024-08-15', 
    '2024-08-18', '2024-08-19', '2024-08-20'
  ];
  
  // Dia 21 apenas para turma 9A (será adicionado separadamente)
  const dia21 = '2024-08-21';
  
  console.log(`📅 Gerando frequência para ${diasLetivos.length} dias letivos...`);
  
  // Para cada aluno
  alunosUnicos.forEach(aluno => {
    // Para cada dia letivo (14 dias para todas as turmas)
    diasLetivos.forEach(data => {
      // Gerar presença/falta aleatória (80% presença, 20% falta)
      const marcacao = Math.random() < 0.8 ? 'P' : 'F';
      
      registrosFrequencia.push({
        "data": data,
        "codigo_aluno": aluno.codigo.toString(),
        "nome_aluno": aluno.nome,
        "turma": aluno.turma,
        "marcacao": marcacao,
        "id": `freq_2024_${idCounter.toString().padStart(6, '0')}`,
        "created_at": new Date().toISOString()
      });
      
      idCounter++;
    });
    
    // Adicionar dia 21 APENAS para turma 9A
    if (aluno.turma === '9A') {
      const marcacao = Math.random() < 0.8 ? 'P' : 'F';
      
      registrosFrequencia.push({
        "data": dia21,
        "codigo_aluno": aluno.codigo.toString(),
        "nome_aluno": aluno.nome,
        "turma": aluno.turma,
        "marcacao": marcacao,
        "id": `freq_2024_${idCounter.toString().padStart(6, '0')}`,
        "created_at": new Date().toISOString()
      });
      
      idCounter++;
    }
  });
  
  // Carregar dados existentes de frequência para preservar
  let dadosExistentes = [];
  try {
    const frequenciaExistente = JSON.parse(fs.readFileSync(frequenciaPath, 'utf8'));
    if (frequenciaExistente.registros && Array.isArray(frequenciaExistente.registros)) {
      dadosExistentes = frequenciaExistente.registros;
      console.log(`📋 Preservando ${dadosExistentes.length} registros existentes`);
    }
  } catch (error) {
    console.log('⚠️  Nenhum arquivo de frequência existente encontrado');
  }
  
  // Mesclar dados existentes com os novos (evitar duplicatas)
  const mapExistentes = new Map();
  dadosExistentes.forEach(reg => {
    const key = `${reg.codigo_aluno}_${reg.data}`;
    mapExistentes.set(key, reg);
  });
  
  // Adicionar novos registros que não existem
  registrosFrequencia.forEach(novoReg => {
    const key = `${novoReg.codigo_aluno}_${novoReg.data}`;
    if (!mapExistentes.has(key)) {
      mapExistentes.set(key, novoReg);
    }
  });
  
  // Converter Map de volta para array
  const todosRegistros = Array.from(mapExistentes.values()).sort((a, b) => {
    // Ordenar por código do aluno e depois por data
    if (a.codigo_aluno !== b.codigo_aluno) {
      return a.codigo_aluno.localeCompare(b.codigo_aluno);
    }
    return new Date(a.data) - new Date(b.data);
  });
  
  // Criar estrutura final
  const dadosCompletos = {
    "lastUpdate": new Date().toISOString(),
    "version": "3.0",
    "total": todosRegistros.length,
    "alunos_unicos": alunosUnicos.size,
    "dias_letivos": diasLetivos.length,
    "periodo": "Agosto 2024",
    "registros": todosRegistros
  };
  
  // Salvar arquivo
  console.log('💾 Salvando dados completos de frequência...');
  fs.writeFileSync(frequenciaPath, JSON.stringify(dadosCompletos, null, 2));
  
  // Criar backup
  const backupPath = path.join(__dirname, 'data', 'frequencia-completa.json');
  fs.writeFileSync(backupPath, JSON.stringify(dadosCompletos, null, 2));
  
  console.log('✅ Frequência completa gerada!');
  console.log(`📊 Total de registros: ${dadosCompletos.total}`);
  console.log(`👥 Alunos únicos: ${dadosCompletos.alunos_unicos}`);
  console.log(`📅 Dias letivos: ${dadosCompletos.dias_letivos}`);
  console.log(`📝 Arquivo salvo: ${frequenciaPath}`);
  console.log(`💾 Backup salvo: ${backupPath}`);
  
  // Estatísticas
  const estatisticas = {
    presencas: todosRegistros.filter(r => r.marcacao === 'P').length,
    faltas: todosRegistros.filter(r => r.marcacao === 'F').length
  };
  
  console.log(`📈 Estatísticas: ${estatisticas.presencas} presenças, ${estatisticas.faltas} faltas`);
  console.log(`📊 Taxa de presença: ${((estatisticas.presencas / todosRegistros.length) * 100).toFixed(1)}%`);

} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}