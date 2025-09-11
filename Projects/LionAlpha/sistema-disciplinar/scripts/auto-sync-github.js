#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Carregar variáveis de ambiente
try { require('dotenv').config(); } catch (e) { /* dotenv opcional */ }

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

console.log('🚀 Auto-sync para GitHub iniciado...');

if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('❌ GITHUB_TOKEN e GITHUB_REPO devem estar definidos no .env');
  process.exit(1);
}

try {
    // Verificar se há dados para sincronizar
    const dadosPath = path.join(__dirname, 'dados', 'frequencia.json');
    
    if (!fs.existsSync(dadosPath)) {
        console.log('❌ Arquivo dados/frequencia.json não encontrado');
        process.exit(1);
    }
    
    // Verificar se há alterações
    try {
        const gitStatus = execSync('git status --porcelain dados/frequencia.json', { encoding: 'utf8' });
        
        if (!gitStatus.trim()) {
            console.log('✅ Nenhuma alteração detectada no arquivo de frequência');
            process.exit(0);
        }
        
        console.log('📝 Alterações detectadas, fazendo commit...');
        
    } catch (error) {
        console.log('📝 Arquivo novo detectado, fazendo commit...');
    }
    
    // Ler dados para estatísticas
    const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));
    const stats = {
        total: dados.total || dados.registros?.length || 0,
        alunos: dados.alunos_unicos || [...new Set(dados.registros?.map(r => r.codigo_aluno) || [])].length,
        turmas: dados.turmas_unicas || [...new Set(dados.registros?.map(r => r.turma) || [])].length,
        dias: dados.dias_letivos || [...new Set(dados.registros?.map(r => r.data) || [])].length
    };
    
    console.log('📊 Estatísticas dos dados:');
    console.log(`- Total de registros: ${stats.total}`);
    console.log(`- Alunos únicos: ${stats.alunos}`);
    console.log(`- Turmas únicas: ${stats.turmas}`);
    console.log(`- Dias letivos: ${stats.dias}`);
    
    // Executar comandos git
    console.log('📦 Adicionando arquivo ao Git...');
    execSync('git add dados/frequencia.json', { stdio: 'inherit' });
    
    const commitMessage = `Atualizar dados de frequência via CSV

📊 Estatísticas:
- ${stats.total} registros de frequência
- ${stats.alunos} alunos únicos
- ${stats.turmas} turmas
- ${stats.dias} dias letivos

🤖 Commit automático via sistema de importação CSV
🕒 ${new Date().toLocaleString('pt-BR')}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
    
    console.log('💾 Fazendo commit...');
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log('🚀 Fazendo push para GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Sincronização concluída com sucesso!');
    console.log('🌐 Dados disponíveis em: https://github.com/AttilioJohner/sistema-disciplinar-revisado');
    
} catch (error) {
    console.error('❌ Erro durante a sincronização:', error.message);
    process.exit(1);
}