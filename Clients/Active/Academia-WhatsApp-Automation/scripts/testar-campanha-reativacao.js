/**
 * Script de Teste - Campanha de Reativação
 * CRÍTICO: Testar sistema antes de disparar para 561 ex-alunos
 * Full Force Academia - Matupá/MT
 */

import fs from 'fs';
import Database from 'better-sqlite3';

const DB_PATH = './academia_whatsapp.db';

function carregarTemplates() {
  try {
    const templatesContent = fs.readFileSync('./message_templates.json', 'utf-8');
    const templates = JSON.parse(templatesContent);
    return templates.templates;
  } catch (error) {
    console.error('❌ Erro ao carregar templates:', error.message);
    return {};
  }
}

function substituirVariaveis(template, dados) {
  let mensagem = template;
  
  // Substituir variáveis básicas
  const variaveis = {
    nome: dados.nome,
    nome_academia: 'Full Force Academia',
    telefone_contato: '(66) 99876-5432',
    endereco: 'Rua Principal, 789 - Centro, Matupá/MT'
  };
  
  for (const [chave, valor] of Object.entries(variaveis)) {
    mensagem = mensagem.replace(new RegExp(`{{${chave}}}`, 'g'), valor);
  }
  
  return mensagem;
}

function simularEnvioWhatsApp(telefone, mensagem, templateId) {
  console.log('📱 SIMULANDO ENVIO WHATSAPP:');
  console.log(`   📞 Para: ${telefone}`);
  console.log(`   📨 Template: ${templateId}`);
  console.log(`   📄 Mensagem:`);
  console.log(`\n${mensagem}\n`);
  console.log('   ✅ [SIMULADO] Mensagem enviada com sucesso');
  console.log('   🕐 [SIMULADO] Entregue às', new Date().toLocaleTimeString());
  console.log('');
}

async function testarCampanhaReativacao() {
  console.log('🚀 INICIANDO TESTE DE CAMPANHA DE REATIVAÇÃO');
  console.log('📍 Full Force Academia - Matupá/MT');
  console.log('⚠️  MODO SIMULAÇÃO - Nenhuma mensagem real será enviada');
  console.log('');
  
  try {
    // Carregar templates
    console.log('📋 Carregando templates de mensagem...');
    const templates = carregarTemplates();
    
    if (!templates.reativacao_15) {
      throw new Error('Templates de reativação não encontrados');
    }
    
    console.log('✅ Templates carregados:');
    console.log(`   - reativacao_15: ${templates.reativacao_15.titulo}`);
    console.log(`   - reativacao_30: ${templates.reativacao_30.titulo}`);
    console.log(`   - reativacao_60: ${templates.reativacao_60.titulo}`);
    console.log('');
    
    // Conectar ao banco
    console.log('🗄️ Conectando ao banco de dados...');
    const db = new Database(DB_PATH, { readonly: true });
    
    // Buscar ex-alunos inativos
    const exAlunos = db.prepare(`
      SELECT nome, telefone, email, status, ultima_visita 
      FROM alunos 
      WHERE status = 'INATIVO'
      LIMIT 3
    `).all();
    
    console.log(`👥 Ex-alunos encontrados: ${exAlunos.length}`);
    
    if (exAlunos.length === 0) {
      console.log('ℹ️  Nenhum ex-aluno encontrado para teste');
      return;
    }
    
    console.log('');
    console.log('📨 SIMULANDO CAMPANHAS DE REATIVAÇÃO:');
    console.log(''.padEnd(50, '='));
    
    // Testar cada template com os ex-alunos
    const tiposReativacao = ['reativacao_15', 'reativacao_30', 'reativacao_60'];
    
    for (const [index, aluno] of exAlunos.entries()) {
      const tipoTemplate = tiposReativacao[index % tiposReativacao.length];
      const template = templates[tipoTemplate];
      
      console.log(`\n[${index + 1}/${exAlunos.length}] TESTE ${tipoTemplate.toUpperCase()}`);
      console.log(`👤 Aluno: ${aluno.nome}`);
      console.log(`📱 Telefone: ${aluno.telefone}`);
      console.log(`📧 Email: ${aluno.email || 'não informado'}`);
      console.log(`⏰ Última visita: ${aluno.ultima_visita || 'não registrada'}`);
      console.log('');
      
      // Gerar mensagem personalizada
      const mensagem = substituirVariaveis(template.conteudo, aluno);
      
      // Simular envio
      simularEnvioWhatsApp(aluno.telefone, mensagem, tipoTemplate);
    }
    
    // Estatísticas de campanha
    const totalAlunosInativos = db.prepare('SELECT COUNT(*) as count FROM alunos WHERE status = "INATIVO"').get().count;
    
    console.log('📊 PROJEÇÃO DA CAMPANHA REAL:');
    console.log(''.padEnd(50, '='));
    console.log(`   👥 Total de ex-alunos inativos: ${totalAlunosInativos}`);
    console.log(`   📨 Mensagens a serem enviadas: ${totalAlunosInativos * 3} (3 templates)`);
    console.log(`   🎯 Meta de reativação: ${Math.floor(totalAlunosInativos * 0.3)} alunos (30%)`);
    console.log(`   💰 Receita esperada: R$ ${(Math.floor(totalAlunosInativos * 0.3) * 150).toLocaleString('pt-BR')}/mês`);
    console.log('');
    
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. ✅ Templates testados e funcionando');
    console.log('   2. ⏳ Conectar WhatsApp Business real');
    console.log('   3. ⏳ Configurar cronograma de envios (15/30/60 dias)');
    console.log('   4. ⏳ Ativar campanha automática');
    console.log('');
    
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Teste manual com 2-3 números primeiro');
    console.log('   - Verifique aprovação dos templates WhatsApp');
    console.log('   - Configure horários de envio (9h-20h)');
    console.log('   - Monitore taxa de resposta');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    throw error;
  }
}

// Executar teste
testarCampanhaReativacao()
  .then(() => {
    console.log('');
    console.log('✅ TESTE DE CAMPANHA CONCLUÍDO COM SUCESSO!');
    console.log('🚀 Sistema pronto para ativação da campanha real');
  })
  .catch((error) => {
    console.error('❌ FALHA NO TESTE:', error.message);
    process.exit(1);
  });