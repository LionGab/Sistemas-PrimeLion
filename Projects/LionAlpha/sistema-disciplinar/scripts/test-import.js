#!/usr/bin/env node

const fs = require('fs');

console.log('🧪 Testando importação CSV...');

// Simular a lógica de importação CSV
try {
    const csvContent = fs.readFileSync('frequencia_real.csv', 'utf8');
    const linhas = csvContent.split('\n').filter(linha => linha.trim());
    
    console.log(`📋 Total de linhas: ${linhas.length}`);
    
    // Processar cabeçalho
    const cabecalho = linhas[0].split(',').map(col => col.trim().replace(/['"]/g, ''));
    console.log('📋 Cabeçalho:', cabecalho);
    
    // Dias úteis do CSV
    const diasUteisCSV = [1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20];
    const ano = 2024;
    const mes = '08';
    
    console.log(`📅 Processando ${diasUteisCSV.length} dias úteis:`, diasUteisCSV);
    
    const registrosProcessados = [];
    
    // Processar cada linha (aluno)
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;
        
        const colunas = linha.split(',').map(col => col.trim().replace(/['"]/g, ''));
        
        if (colunas.length < 6) {
            console.warn(`Linha ${i + 1}: Dados insuficientes`);
            continue;
        }
        
        const codigoAluno = colunas[0];
        const nomeAluno = colunas[1];
        const turma = colunas[2];
        const marcacoesDias = colunas.slice(3); // Marcações dos dias
        
        console.log(`\n🔍 Processando: ${nomeAluno} (${turma})`);
        console.log(`📋 Marcações:`, marcacoesDias.slice(0, diasUteisCSV.length));
        
        // Contar marcações para este aluno
        const contadores = { P: 0, F: 0, FC: 0, A: 0 };
        
        // Processar cada dia
        for (let j = 0; j < diasUteisCSV.length && j < marcacoesDias.length; j++) {
            const diaUtil = diasUteisCSV[j];
            const marcacaoOriginal = marcacoesDias[j];
            const marcacao = marcacaoOriginal.toUpperCase().trim();
            
            // Pular se não há marcação ou está vazio
            if (!marcacao || marcacao === '' || marcacao === '-') {
                continue;
            }
            
            // Validar marcação
            if (!['P', 'F', 'FC', 'A'].includes(marcacao)) {
                console.warn(`Linha ${i + 1}, Dia ${diaUtil}: Marcação inválida: "${marcacaoOriginal}"`);
                continue;
            }
            
            contadores[marcacao]++;
            
            // Criar data no formato YYYY-MM-DD
            const diaFormatado = diaUtil.toString().padStart(2, '0');
            const dataCompleta = `${ano}-${mes}-${diaFormatado}`;
            
            const registro = {
                data: dataCompleta,
                codigo_aluno: codigoAluno,
                nome_aluno: nomeAluno,
                turma: turma,
                marcacao: marcacao,
                id: `freq_test_${i}_${j}`,
                created_at: new Date().toISOString()
            };
            
            registrosProcessados.push(registro);
        }
        
        console.log(`📊 Contadores para ${nomeAluno}:`, contadores);
        
        // Verificar caso específico da Izabelly
        if (nomeAluno.toUpperCase().includes('IZABELLY')) {
            console.log(`🎯 IZABELLY ENCONTRADA!`);
            console.log(`✅ Total de faltas (F): ${contadores.F}`);
            console.log(`✅ Total de presenças (P): ${contadores.P}`);
        }
    }
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`📋 Total de registros processados: ${registrosProcessados.length}`);
    
    // Salvar resultado
    const dadosCompletos = {
        "lastUpdate": new Date().toISOString(),
        "version": "4.0",
        "total": registrosProcessados.length,
        "dias_letivos": diasUteisCSV.length,
        "periodo": "Agosto 2024 - Dados Reais",
        "registros": registrosProcessados
    };
    
    fs.writeFileSync('dados/frequencia.json', JSON.stringify(dadosCompletos, null, 2));
    console.log('✅ Dados salvos em dados/frequencia.json');
    
} catch (error) {
    console.error('❌ Erro:', error);
}