#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando consolidação de dados...');

// Carregar arquivo principal com todos os 351 alunos
const dbPath = path.join(__dirname, 'data', 'db.json');
const frequenciaPath = path.join(__dirname, 'dados', 'frequencia.json');

try {
  // Carregar dados principais
  console.log('📂 Carregando data/db.json...');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  // Carregar dados de frequencia atual
  console.log('📂 Carregando dados/frequencia.json...');
  let frequenciaData;
  try {
    frequenciaData = JSON.parse(fs.readFileSync(frequenciaPath, 'utf8'));
  } catch (error) {
    console.log('⚠️  Arquivo frequencia.json não encontrado, criando novo...');
    frequenciaData = {
      "lastUpdate": new Date().toISOString(),
      "version": "1.0",
      "total": 0,
      "registros": []
    };
  }

  // Extrair dados de frequência do db.json
  console.log('🔍 Extraindo dados de frequência...');
  const registrosFrequencia = [];
  let idCounter = 1;

  // Verificar se existe frequencia_diaria no db.json
  if (dbData.frequencia_diaria && typeof dbData.frequencia_diaria === 'object') {
    console.log('✅ Encontrados registros de frequência no db.json');
    
    // Converter registros do formato do db.json para o formato esperado
    Object.values(dbData.frequencia_diaria).forEach(registro => {
      if (registro.data && registro.codigo_aluno && registro.nome_aluno) {
        registrosFrequencia.push({
          "data": registro.data,
          "codigo_aluno": registro.codigo_aluno.toString(),
          "nome_aluno": registro.nome_aluno,
          "turma": registro.turma || "N/A",
          "marcacao": registro.marcacao || registro.status || "P",
          "id": `freq_2024_${idCounter.toString().padStart(6, '0')}`,
          "created_at": registro.created_at || new Date().toISOString()
        });
        idCounter++;
      }
    });
  } else {
    console.log('⚠️  Nenhum registro de frequência encontrado no db.json');
  }

  // Manter registros existentes do arquivo frequencia.json se não conflitarem
  if (frequenciaData.registros && Array.isArray(frequenciaData.registros)) {
    console.log(`📋 Mantendo ${frequenciaData.registros.length} registros existentes`);
    
    // Criar mapa para evitar duplicatas
    const existingMap = new Map();
    registrosFrequencia.forEach(reg => {
      const key = `${reg.codigo_aluno}_${reg.data}`;
      existingMap.set(key, reg);
    });

    // Adicionar registros existentes que não conflitam
    frequenciaData.registros.forEach(reg => {
      const key = `${reg.codigo_aluno}_${reg.data}`;
      if (!existingMap.has(key)) {
        registrosFrequencia.push({
          ...reg,
          "id": `freq_2024_${idCounter.toString().padStart(6, '0')}`
        });
        idCounter++;
      }
    });
  }

  // Criar estrutura final consolidada
  const dadosConsolidados = {
    "lastUpdate": new Date().toISOString(),
    "version": "2.0",
    "total": registrosFrequencia.length,
    "alunos_unicos": [...new Set(registrosFrequencia.map(r => r.codigo_aluno))].length,
    "registros": registrosFrequencia.sort((a, b) => {
      // Ordenar por código do aluno e depois por data
      if (a.codigo_aluno !== b.codigo_aluno) {
        return a.codigo_aluno.localeCompare(b.codigo_aluno);
      }
      return new Date(a.data) - new Date(b.data);
    })
  };

  // Salvar arquivo consolidado
  console.log('💾 Salvando dados consolidados...');
  fs.writeFileSync(frequenciaPath, JSON.stringify(dadosConsolidados, null, 2));

  // Atualizar também um arquivo de backup no data/
  const backupPath = path.join(__dirname, 'data', 'frequencia-consolidada.json');
  fs.writeFileSync(backupPath, JSON.stringify(dadosConsolidados, null, 2));

  console.log('✅ Consolidação concluída!');
  console.log(`📊 Total de registros: ${dadosConsolidados.total}`);
  console.log(`👥 Alunos únicos: ${dadosConsolidados.alunos_unicos}`);
  console.log(`📝 Arquivo salvo: ${frequenciaPath}`);
  console.log(`💾 Backup salvo: ${backupPath}`);

  // Se há poucos registros, gerar alguns dados exemplo para demonstração
  if (dadosConsolidados.alunos_unicos < 50) {
    console.log('⚠️  Poucos dados de frequência encontrados.');
    console.log('💡 Para gerar dados de exemplo, execute: node gerar-dados-exemplo.js');
  }

} catch (error) {
  console.error('❌ Erro durante consolidação:', error);
  process.exit(1);
}