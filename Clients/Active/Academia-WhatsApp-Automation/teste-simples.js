// Teste simples para verificar se o ambiente está funcionando
import fs from 'fs';
import dotenv from 'dotenv';

console.log('🚀 Iniciando teste do sistema Academia WhatsApp Automation');
console.log('📍 Full Force Academia - Matupá/MT');
console.log('');

// Testar configurações
console.log('✅ Configurações carregadas:');
try {
  const academyConfig = JSON.parse(fs.readFileSync('./academy.config.json', 'utf8'));
  console.log(`   - Academia: ${academyConfig.academia.nome}`);
  console.log(`   - Cidade: ${academyConfig.academia.cidade}/${academyConfig.academia.estado}`);
  console.log(`   - WhatsApp: ${academyConfig.academia.whatsapp}`);
} catch (error) {
  console.error('❌ Erro ao carregar configurações:', error.message);
}

// Testar variáveis de ambiente
console.log('');
console.log('✅ Variáveis de ambiente:');
dotenv.config();
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'não configurado'}`);
console.log(`   - PORT: ${process.env.PORT || '3001'}`);
console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'configurado (SQLite)' : 'não configurado'}`);

// Status das dependências
console.log('');
console.log('✅ Dependências principais:');
try {
  await import('fastify');
  console.log('   - Fastify: ✅ instalado');
} catch { console.log('   - Fastify: ❌ não encontrado'); }

try {
  await import('@whiskeysockets/baileys');
  console.log('   - Baileys (WhatsApp): ✅ instalado');
} catch { console.log('   - Baileys (WhatsApp): ❌ não encontrado'); }

try {
  await import('@prisma/client');
  console.log('   - Prisma: ✅ instalado');
} catch { console.log('   - Prisma: ❌ não encontrado'); }

// Próximos passos
console.log('');
console.log('🎯 PRÓXIMOS PASSOS URGENTES:');
console.log('   1. ✅ Configuração Full Force Academy - CONCLUÍDO');
console.log('   2. ⏳ Configurar banco de dados SQLite');
console.log('   3. ⏳ Conectar WhatsApp Business');
console.log('   4. ⏳ Importar 561 ex-alunos do SCA Online');
console.log('   5. ⏳ Disparar primeira campanha de reativação');
console.log('');
console.log('💰 OPORTUNIDADE CRÍTICA: R$ 50k+/mês esperados dos 561 ex-alunos');
console.log('🎯 META: 168 reativações (30% dos ex-alunos)');
console.log('⏰ PRAZO: Sistema funcionando HOJE');