#!/usr/bin/env node

const fs = require('fs');

// Carregar variáveis de ambiente
try { require('dotenv').config(); } catch (e) { /* dotenv opcional */ }

const CSV_ENCODING = process.env.CSV_ENCODING || 'utf8';
const CSV_DELIMITER = process.env.DEFAULT_CSV_DELIMITER || ',';

console.log('📥 Importando CSV completo...');

// Usar os dados CSV que você forneceu
const csvCompleto = `Código,Nome,turma,1,4,5,6,7,8,11,12,13,14,15,18,19,20,,,
2639458,Alberto de Jesus Sousa Pereira,6A,P,P,P,P,P,P,P,P,P,P,P,P,F,P,,,
2590632,Ana Clara da Silva Coelho,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2230465,Ana Júlia da Silva,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2208832,Aysha Micaelly dos Santos B. Lemos,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2308886,Azaff Gabriel Souza Pereira da Cunha,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2257848,Bruna Santos Oliveira,6A,P,P,P,P,P,F,F,P,P,P,P,P,F,P,,,
2235078,Davi de Lima Trevisan Araújo,6A,P,P,P,P,F,P,P,P,P,P,F,P,P,P,,,
2590882,Eduarda Gomes da Silva,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2557498,Enzo Gabriel Oliveira Costa,6A,P,F,F,P,F,P,F,F,P,F,F,P,F,F,,,
2595270,Enzo Samuel Alves R. Carvalho,6A,F,P,P,P,P,F,P,P,P,P,P,F,P,P,,,
2221844,Everton Peris dos Santos,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2611953,Felipe Santana Silva Fonseca,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2572796,Gabriela da Silva Conceição,6A,P,P,P,F,P,F,F,P,P,P,F,P,F,P,,,
2221796,Graziely Soyane Brito Januário,6A,P,P,P,P,P,P,A,A,F,P,P,P,P,P,,,
2590991,Hector Harthur Morais Rodrigues,6A,P,F,P,P,P,F,F,P,P,P,P,P,P,F,,,
2218077,José Bruno Xavier Pereira,6A,P,P,P,P,P,P,P,P,P,P,F,P,P,P,,,
2238497,Kamila Cristina de Oliveira da Silva,6A,P,F,P,P,P,P,A,A,A,A,A,P,P,P,,,
2410707,Kawanny Latyffa Carvalho Neto,6A,P,F,P,P,P,P,F,P,P,F,P,P,P,P,,,
2590602,Ludmila Silva Figueiredo,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2590937,Luna Samya Ferreira da Silva,6A,P,P,P,P,P,F,F,P,P,P,P,F,F,P,,,
2642036,Malvina Sophie Barbosa R. Goffi Savi,6A,F,F,P,P,P,P,P,P,P,P,P,P,P,P,,,
2264960,Maria Vitória Ramos dos Santos,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2579209,Mariana Prado Fujii,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2229922,Nathiely Nunes Oliveira,6A,P,P,P,P,P,F,P,P,P,P,P,P,P,P,,,
2415239,Nicolly Soffie Freitas Marczal,6A,P,P,F,P,F,P,F,P,P,P,P,P,P,P,,,
2266996,Nikolas Cézar Dias da Silva,6A,P,P,P,P,P,P,P,P,F,P,P,P,P,P,,,
2590976,Pedro Henrique Carneiro,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2260814,Pedro Henrique Magalhães Neves,6A,P,F,P,P,P,P,P,P,P,P,F,P,P,P,,,
2231253,Rafael Augusto Nunes Rodrigues - MP,6A,P,P,P,P,P,F,P,P,P,P,P,P,P,F,,,
2492468,Rafael Rosalvo de Souza,6A,P,P,P,P,P,P,P,P,P,P,P,P,P,P,,,
2467698,Ruan Gregório Fonseca Barboza,6A,F,F,F,P,P,F,F,P,P,P,P,F,P,F,,,
2483240,Wenia Pereira Gomes,6A,P,F,P,P,P,F,P,P,P,P,P,P,P,P,,,
2335511,IZABELLY EDUARDA RODRIGUES PIRES,9A,F,F,F,F,F,F,F,F,F,F,F,F,F,F,,,`;

try {
    const linhas = csvCompleto.split('\n').filter(linha => linha.trim());
    console.log(`📋 Total de linhas: ${linhas.length}`);
    
    // Processar cabeçalho
    const cabecalho = linhas[0].split(',').map(col => col.trim().replace(/['"]/g, ''));
    
    // Dias úteis do CSV (14 dias)
    const diasUteisCSV = [1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20];
    const ano = 2024;
    const mes = '08';
    
    console.log(`📅 Processando ${diasUteisCSV.length} dias úteis`);
    
    const registrosProcessados = [];
    let alunosProcessados = 0;
    
    // Processar cada linha (aluno)
    for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        if (!linha.trim()) continue;
        
        const colunas = linha.split(',').map(col => col.trim().replace(/['"]/g, ''));
        
        if (colunas.length < 6) continue;
        
        const codigoAluno = colunas[0];
        const nomeAluno = colunas[1];
        const turma = colunas[2];
        const marcacoesDias = colunas.slice(3);
        
        alunosProcessados++;
        
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
                continue;
            }
            
            // Criar data no formato YYYY-MM-DD
            const diaFormatado = diaUtil.toString().padStart(2, '0');
            const dataCompleta = `${ano}-${mes}-${diaFormatado}`;
            
            const registro = {
                data: dataCompleta,
                codigo_aluno: codigoAluno,
                nome_aluno: nomeAluno,
                turma: turma,
                marcacao: marcacao,
                id: `freq_real_${Date.now()}_${i}_${j}`,
                created_at: new Date().toISOString()
            };
            
            registrosProcessados.push(registro);
        }
    }
    
    console.log(`📊 RESULTADO:`);
    console.log(`👥 Alunos processados: ${alunosProcessados}`);
    console.log(`📋 Registros gerados: ${registrosProcessados.length}`);
    
    // Verificar Izabelly especificamente
    const izabelly = registrosProcessados.filter(r => r.nome_aluno.toUpperCase().includes('IZABELLY'));
    if (izabelly.length > 0) {
        const contadores = { P: 0, F: 0, FC: 0, A: 0 };
        izabelly.forEach(r => contadores[r.marcacao]++);
        console.log(`🎯 IZABELLY: ${contadores.F} faltas, ${contadores.P} presenças ✅`);
    }
    
    // Salvar resultado
    const dadosCompletos = {
        "lastUpdate": new Date().toISOString(),
        "version": "5.0",
        "total": registrosProcessados.length,
        "dias_letivos": diasUteisCSV.length,
        "periodo": "Agosto 2024 - Dados Reais Completos",
        "alunos_processados": alunosProcessados,
        "registros": registrosProcessados
    };
    
    fs.writeFileSync('dados/frequencia.json', JSON.stringify(dadosCompletos, null, 2));
    console.log('✅ Dados salvos em dados/frequencia.json');
    
} catch (error) {
    console.error('❌ Erro:', error);
}