/**
 * Script de Importação de Ex-Alunos - Full Force Academia
 * CRÍTICO: Importar 561 ex-alunos para campanha de reativação
 * 
 * Uso:
 * node scripts/importar-exalunos.js caminho/para/arquivo.csv
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configuração da Full Force Academia
const ACADEMIA_CONFIG = {
  id: 'full-force-matupa',
  nome: 'Full Force Academia',
  cnpj: '48.123.456/0001-78',
  telefone: '+55 66 99876-5432',
  whatsappNumber: '+55 66 99876-5432'
};

async function criarOuObterAcademia() {
  console.log('🏢 Verificando academia no banco de dados...');
  
  let academia = await prisma.academia.findFirst({
    where: { cnpj: ACADEMIA_CONFIG.cnpj }
  });
  
  if (!academia) {
    console.log('➕ Criando registro da Full Force Academia...');
    academia = await prisma.academia.create({
      data: ACADEMIA_CONFIG
    });
  }
  
  console.log(`✅ Academia configurada: ${academia.nome} (ID: ${academia.id})`);
  return academia;
}

async function importarExAlunos(caminhoArquivo) {
  try {
    console.log('🚀 INICIANDO IMPORTAÇÃO DE EX-ALUNOS');
    console.log('📍 Full Force Academia - Matupá/MT');
    console.log('💰 Oportunidade: R$ 50k+/mês em reativações');
    console.log('');
    
    // Verificar se arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
    }
    
    // Criar/obter academia
    const academia = await criarOuObterAcademia();
    
    // Ler e processar CSV
    console.log(`📄 Lendo arquivo: ${caminhoArquivo}`);
    const csvContent = fs.readFileSync(caminhoArquivo, 'utf-8');
    const registros = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`📊 ${registros.length} registros encontrados no CSV`);
    console.log('');
    
    let importados = 0;
    let erros = 0;
    let jaExistentes = 0;
    
    for (const [index, registro] of registros.entries()) {
      try {
        console.log(`[${index + 1}/${registros.length}] Processando: ${registro.nome}`);
        
        // Limpar telefone (remover espaços, parênteses, hífens)
        const telefone = registro.telefone.replace(/\D/g, '');
        
        // Verificar se já existe
        const alunoExistente = await prisma.aluno.findFirst({
          where: {
            telefone,
            academiaId: academia.id
          }
        });
        
        if (alunoExistente) {
          console.log(`   ⚠️  Já existe: ${registro.nome} (${telefone})`);
          jaExistentes++;
          continue;
        }
        
        // Criar novo aluno
        const novoAluno = await prisma.aluno.create({
          data: {
            nome: registro.nome,
            telefone,
            email: registro.email || null,
            status: registro.status || 'INATIVO',
            ultimaVisita: registro.ultimaVisita ? new Date(registro.ultimaVisita) : null,
            valorMensalidade: registro.valorMensalidade || null,
            dataMatricula: registro.dataMatricula ? new Date(registro.dataMatricula) : new Date(),
            permiteWhatsApp: true,
            academiaId: academia.id
          }
        });
        
        console.log(`   ✅ Importado: ${novoAluno.nome} (ID: ${novoAluno.id})`);
        importados++;
        
      } catch (error) {
        console.error(`   ❌ Erro ao importar ${registro.nome}:`, error.message);
        erros++;
      }
    }
    
    // Resumo da importação
    console.log('');
    console.log('📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`   ✅ Importados com sucesso: ${importados}`);
    console.log(`   ⚠️  Já existentes: ${jaExistentes}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📈 Total processados: ${registros.length}`);
    
    // Calcular potencial de receita
    const receitaPotencial = importados * 150; // R$ 150 média por aluno/mês
    const metaReativacao = Math.floor(importados * 0.3); // 30% de reativação
    const receitaEsperada = metaReativacao * 150;
    
    console.log('');
    console.log('💰 POTENCIAL DE RECEITA:');
    console.log(`   🎯 Meta de reativação: ${metaReativacao} ex-alunos (30%)`);
    console.log(`   💵 Receita esperada: R$ ${receitaEsperada.toLocaleString('pt-BR')}/mês`);
    console.log(`   📈 ROI anual estimado: R$ ${(receitaEsperada * 12).toLocaleString('pt-BR')}`);
    
    console.log('');
    console.log('🚀 PRÓXIMO PASSO: Executar campanha de reativação');
    console.log('💬 Comando: npm run automation:start-reactivation');
    
    return {
      importados,
      erros,
      jaExistentes,
      total: registros.length,
      receitaEsperada
    };
    
  } catch (error) {
    console.error('❌ Erro na importação:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar importação se chamado diretamente
if (process.argv.length < 3) {
  console.log('❌ Uso: node scripts/importar-exalunos.js caminho/para/arquivo.csv');
  console.log('');
  console.log('📝 Exemplo de CSV (exemplo-importacao-exalunos.csv):');
  console.log('nome,telefone,email,status,ultimaVisita,valorMensalidade,dataMatricula,planoAnterior');
  console.log('João Silva,66999876543,joao@email.com,INATIVO,2024-12-15,149.90,2024-01-15,Gold');
  process.exit(1);
}

const caminhoArquivo = process.argv[2];
importarExAlunos(caminhoArquivo)
  .then((resultado) => {
    console.log('');
    console.log('✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FALHA NA IMPORTAÇÃO:', error.message);
    process.exit(1);
  });