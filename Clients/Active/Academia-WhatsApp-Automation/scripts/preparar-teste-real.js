/**
 * Preparador de Teste Real - WhatsApp Pessoal
 * Converte qualquer planilha para formato de teste
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';

console.log('🧪 PREPARADOR DE TESTE REAL - WHATSAPP PESSOAL');
console.log('📱 Vamos testar o sistema com seus próprios dados');
console.log('');

// Função para detectar formato da planilha
function detectarFormatoPlanilha(arquivo) {
  console.log(`📄 Analisando arquivo: ${arquivo}`);
  
  if (!fs.existsSync(arquivo)) {
    throw new Error(`❌ Arquivo não encontrado: ${arquivo}`);
  }
  
  const conteudo = fs.readFileSync(arquivo, 'utf-8');
  const linhas = conteudo.split('\n');
  const cabecalho = linhas[0];
  
  console.log(`📋 Cabeçalho detectado: ${cabecalho}`);
  console.log(`📊 Total de linhas: ${linhas.length - 1}`);
  
  // Tentar fazer parse
  try {
    const dados = parse(conteudo, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`✅ Parse bem-sucedido! ${dados.length} registros encontrados`);
    console.log('📝 Primeiro registro como exemplo:');
    console.log(JSON.stringify(dados[0], null, 2));
    
    return {
      dados,
      colunas: Object.keys(dados[0] || {}),
      total: dados.length
    };
    
  } catch (error) {
    throw new Error(`❌ Erro ao processar CSV: ${error.message}`);
  }
}

// Função para criar CSV de teste personalizado
function criarCsvTeste(dados, seuTelefone) {
  console.log('🔄 Convertendo para formato de teste...');
  
  const csvTeste = [];
  
  // Adicionar seu próprio número primeiro (para teste seguro)
  csvTeste.push({
    nome: 'TESTE - Seu Nome',
    telefone: seuTelefone,
    email: 'seu.email@teste.com',
    status: 'INATIVO',
    ultimaVisita: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    valorMensalidade: '150.00',
    dataMatricula: '2024-01-15',
    planoAnterior: 'Teste'
  });
  
  // Converter até 3 registros da planilha original (para teste seguro)
  const dadosParaTeste = dados.slice(0, 3);
  
  dadosParaTeste.forEach((registro, index) => {
    // Tentar mapear campos automaticamente
    const nomeField = Object.keys(registro).find(k => 
      k.toLowerCase().includes('nome') || 
      k.toLowerCase().includes('name')
    );
    
    const telefoneField = Object.keys(registro).find(k => 
      k.toLowerCase().includes('telefone') || 
      k.toLowerCase().includes('phone') || 
      k.toLowerCase().includes('celular') ||
      k.toLowerCase().includes('whatsapp')
    );
    
    const emailField = Object.keys(registro).find(k => 
      k.toLowerCase().includes('email') || 
      k.toLowerCase().includes('mail')
    );
    
    // Criar registro de teste
    const registroTeste = {
      nome: registro[nomeField] || `Pessoa Teste ${index + 1}`,
      telefone: registro[telefoneField] || `669998765${40 + index}`, // Números fictícios MT
      email: registro[emailField] || `teste${index + 1}@email.com`,
      status: 'INATIVO',
      ultimaVisita: new Date(Date.now() - (15 + index * 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      valorMensalidade: '149.90',
      dataMatricula: '2024-02-01',
      planoAnterior: 'Plano Gold'
    };
    
    csvTeste.push(registroTeste);
  });
  
  return csvTeste;
}

// Função para salvar CSV de teste
function salvarCsvTeste(dados) {
  const cabecalho = 'nome,telefone,email,status,ultimaVisita,valorMensalidade,dataMatricula,planoAnterior\n';
  const linhas = dados.map(reg => 
    `${reg.nome},${reg.telefone},${reg.email},${reg.status},${reg.ultimaVisita},${reg.valorMensalidade},${reg.dataMatricula},${reg.planoAnterior}`
  ).join('\n');
  
  const csvFinal = cabecalho + linhas;
  const nomeArquivo = `teste-real-${Date.now()}.csv`;
  
  fs.writeFileSync(nomeArquivo, csvFinal);
  
  console.log(`💾 CSV de teste salvo: ${nomeArquivo}`);
  return nomeArquivo;
}

// Função principal
async function prepararTeste() {
  console.log('🎯 INSTRUÇÕES PARA TESTE REAL:');
  console.log('');
  console.log('1️⃣ PREPARAR SUA PLANILHA:');
  console.log('   - Salve sua planilha como .csv');
  console.log('   - Coloque no mesmo diretório do projeto');
  console.log('   - Execute: node scripts/preparar-teste-real.js sua-planilha.csv SEU_TELEFONE');
  console.log('');
  console.log('2️⃣ FORMATO DO TELEFONE:');
  console.log('   - Com DDD: 11999887766');
  console.log('   - Ou internacional: 5511999887766');
  console.log('   - SEM símbolos (+, -, espaços)');
  console.log('');
  console.log('3️⃣ EXEMPLO DE USO:');
  console.log('   node scripts/preparar-teste-real.js minha-lista.csv 11999887766');
  console.log('');
  
  // Verificar argumentos
  if (process.argv.length < 4) {
    console.log('⚠️  Argumentos necessários:');
    console.log('   - Arquivo CSV da sua planilha');
    console.log('   - Seu número de telefone (para teste seguro)');
    return;
  }
  
  const arquivoPlanilha = process.argv[2];
  const seuTelefone = process.argv[3];
  
  try {
    // Processar planilha
    const resultado = detectarFormatoPlanilha(arquivoPlanilha);
    
    // Criar CSV de teste
    const dadosTeste = criarCsvTeste(resultado.dados, seuTelefone);
    
    // Salvar arquivo de teste
    const arquivoTeste = salvarCsvTeste(dadosTeste);
    
    console.log('');
    console.log('✅ PREPARAÇÃO CONCLUÍDA!');
    console.log('');
    console.log('📋 RESUMO:');
    console.log(`   📄 Arquivo original: ${arquivoPlanilha} (${resultado.total} registros)`);
    console.log(`   🧪 Arquivo de teste: ${arquivoTeste} (${dadosTeste.length} registros)`);
    console.log(`   📱 Seu telefone: ${seuTelefone} (primeiro da lista)`);
    console.log('');
    console.log('🚀 PRÓXIMO PASSO:');
    console.log(`   node scripts/importar-exalunos-simples.js ${arquivoTeste}`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - O primeiro registro sempre será SEU número');
    console.log('   - Apenas 4 registros serão criados (teste seguro)');
    console.log('   - Nenhuma mensagem real será enviada ainda');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.log('');
    console.log('💡 SOLUÇÕES POSSÍVEIS:');
    console.log('   - Verifique se o arquivo existe');
    console.log('   - Confirme que é um CSV válido');
    console.log('   - Tente salvar a planilha como CSV UTF-8');
  }
}

// Executar
prepararTeste();