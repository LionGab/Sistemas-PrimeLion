let dadosAlunos = [];
let dadosMedidas = [];

document.addEventListener("DOMContentLoaded", function() {
    console.log("Sistema carregando...");
    inicializar();
});

function inicializar() {
    log("Sistema inicializado");
    
    // Elementos para alunos
    const fileInput = document.getElementById("fileAlunos");
    const btnImport = document.getElementById("btnImportarAlunos");
    
    // Elementos para medidas
    const fileMedidas = document.getElementById("fileMedidas");
    const btnImportMedidas = document.getElementById("btnImportarMedidas");
    
    if (!fileInput || !btnImport) {
        log("Elementos de alunos não encontrados", "error");
        return;
    }
    
    if (!fileMedidas || !btnImportMedidas) {
        log("Elementos de medidas não encontrados", "error");
        return;
    }
    
    // Event listeners para alunos
    fileInput.addEventListener("change", handleFile);
    btnImport.addEventListener("click", importData);
    
    // Event listeners para medidas
    fileMedidas.addEventListener("change", handleMedidasFile);
    btnImportMedidas.addEventListener("click", importMedidasData);
    
    log("Pronto para usar!");
}

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    log("Arquivo: " + file.name);
    
    if (typeof XLSX === "undefined") {
        log("XLSX não carregado", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let workbook;
            
            // Detectar tipo de arquivo e usar método apropriado
            if (file.name.toLowerCase().endsWith('.csv')) {
                // Para CSV, usar readAsText com encoding UTF-8
                const csvText = e.target.result;
                log("Processando CSV com encoding UTF-8");
                workbook = XLSX.read(csvText, {type: "string", raw: false, codepage: 65001});
            } else {
                // Para Excel (.xlsx, .xls), usar ArrayBuffer
                const data = new Uint8Array(e.target.result);
                workbook = XLSX.read(data, {type: "array", raw: false, codepage: 65001});
            }
            
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1, raw: false});
            
            dadosAlunos = processData(jsonData);
            showPreview(dadosAlunos);
            
            document.getElementById("btnImportarAlunos").disabled = false;
            log(dadosAlunos.length + " alunos prontos");
        } catch (err) {
            log("Erro: " + err.message, "error");
        }
    };
    
    // Usar método de leitura apropriado baseado no tipo do arquivo
    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function processData(data) {
    const result = [];
    
    // Log do cabeçalho para debug
    if (data.length > 0) {
        log("📋 Cabeçalhos detectados: " + data[0].map((col, idx) => `${String.fromCharCode(65 + idx)}: ${col}`).join(", "));
    }
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] || row[1]) {
            // Mapear campos baseado na posição (ajustar conforme sua estrutura)
            const aluno = {
                codigo: row[0] ? String(row[0]).trim() : "",
                nome_completo: row[1] ? String(row[1]).trim() : "",
                turma: row[2] ? String(row[2]).trim() : "",
                responsavel: row[3] ? String(row[3]).trim() : "",
                cpf_responsavel: row[4] ? String(row[4]).trim() : "",
                telefone1: row[5] ? String(row[5]).trim() : "",
                telefone2: row[6] ? String(row[6]).trim() : "",
                // Campos adicionais se existirem
                email_responsavel: row[7] ? String(row[7]).trim() : ""
            };
            
            // Combinar telefones em um campo se necessário
            const telefones = [aluno.telefone1, aluno.telefone2].filter(t => t).join(" / ");
            aluno.telefone_responsavel = telefones;
            
            result.push(aluno);
        }
    }
    
    log(`📊 ${result.length} alunos processados do CSV`);
    return result;
}

function showPreview(data) {
    const container = document.getElementById("previewAlunosContent");
    if (!container) return;
    
    let html = "<h4>Preview: " + data.length + " alunos</h4>";
    html += "<table border=1><tr><th>Código</th><th>Nome</th><th>Turma</th></tr>";
    
    for (let i = 0; i < Math.min(3, data.length); i++) {
        html += "<tr><td>" + data[i].codigo + "</td><td>" + data[i].nome_completo + "</td><td>" + data[i].turma + "</td></tr>";
    }
    html += "</table>";
    
    container.innerHTML = html;
    document.getElementById("previewAlunos").style.display = "block";
}

async function importData() {
    // Confirmar sincronização completa
    const confirmar = confirm("⚠️ SINCRONIZAÇÃO COMPLETA\n\nEsta operação irá:\n• Remover TODOS os alunos do banco atual\n• Importar APENAS os alunos do CSV\n• Excluir duplicatas automaticamente\n\nTem certeza que deseja prosseguir?");
    
    if (!confirmar) {
        log("Operação cancelada pelo usuário");
        return;
    }
    
    log("🔄 Iniciando SINCRONIZAÇÃO COMPLETA...");
    
    // Verificar se o usuário está autenticado
    const user = window.localAuth.currentUser;
    if (!user) {
        log("Erro: Você precisa estar logado para importar dados", "error");
        return;
    }
    
    log("Usuário autenticado: " + user.email);
    
    if (!window.db) {
        if (typeof window.localDb !== "undefined" && window.localDb.loaded) {
            window.db = window.db;
        } else {
            log("Sistema Local não carregado", "error");
            return;
        }
    }

    try {
        // ETAPA 1: Remover TODOS os alunos existentes
        log("🗑️ ETAPA 1: Removendo todos os alunos existentes...");
        const alunosExistentes = await db.collection("alunos").get();
        let removidos = 0;
        
        for (const doc of alunosExistentes.docs) {
            await db.collection("alunos").doc(doc.id).delete();
            removidos++;
        }
        log(`✅ ${removidos} alunos removidos do banco`);

        // ETAPA 2: Remover duplicatas do CSV (por código ou nome)
        log("🔍 ETAPA 2: Removendo duplicatas do CSV...");
        const alunosUnicos = new Map();
        
        for (const aluno of dadosAlunos) {
            const chave = aluno.codigo || aluno.nome_completo;
            if (chave && !alunosUnicos.has(chave)) {
                alunosUnicos.set(chave, aluno);
            }
        }
        
        const dadosLimpos = Array.from(alunosUnicos.values());
        log(`✅ ${dadosAlunos.length - dadosLimpos.length} duplicatas removidas do CSV`);
        log(`📊 ${dadosLimpos.length} alunos únicos para importar`);

        // ETAPA 3: Importar todos os alunos do CSV limpo
        log("📥 ETAPA 3: Importando alunos do CSV...");
        let importados = 0;
        let errors = 0;
        
        for (const aluno of dadosLimpos) {
            try {
                const docId = aluno.codigo || "aluno_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
                
                await db.collection("alunos").doc(docId).set({
                    codigo: aluno.codigo || "",
                    nome_completo: aluno.nome_completo || "",
                    turma: aluno.turma || "",
                    responsavel: aluno.responsavel || "",
                    cpf_responsavel: aluno.cpf_responsavel || "",
                    telefone_responsavel: aluno.telefone_responsavel || "",
                    telefone1: aluno.telefone1 || "",
                    telefone2: aluno.telefone2 || "",
                    email_responsavel: aluno.email_responsavel || "",
                    status: "ativo",
                    created_at: new Date().toISOString(),
                    created_by: user.uid,
                    updated_at: new Date().toISOString(),
                    updated_by: user.uid
                });
                
                importados++;
                log(`✅ Importado: ${aluno.nome_completo} (ID: ${docId})`);
                
            } catch (err) {
                errors++;
                log(`❌ Erro ao importar ${aluno.nome_completo}: ${err.message}`, "error");
            }
        }
        
        log("🎉 SINCRONIZAÇÃO COMPLETA FINALIZADA!");
        log(`📊 RESUMO: ${importados} alunos importados, ${errors} erros`);
        log(`✅ Base de dados sincronizada com o CSV!`);
        
        // Inicializar notas disciplinares para os alunos
        if (importados > 0) {
            try {
                log("🔄 Inicializando notas disciplinares automático...");
                await inicializarNotasAutomatico();
                log("✅ Notas disciplinares inicializadas automaticamente!");
                
            } catch (error) {
                log(`⚠️ Aviso: Erro ao inicializar notas: ${error.message}`, "error");
                log("ℹ️ Acesse a página de Medidas Disciplinares para inicializar manualmente.");
            }
        }

    } catch (error) {
        log(`❌ ERRO CRÍTICO na sincronização: ${error.message}`, "error");
    }
}

// FUNÇÕES PARA MEDIDAS DISCIPLINARES
function handleMedidasFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    log("Arquivo de medidas: " + file.name);
    
    if (typeof XLSX === "undefined") {
        log("XLSX não carregado", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let workbook;
            
            // Detectar tipo de arquivo e usar método apropriado
            if (file.name.toLowerCase().endsWith('.csv')) {
                // Para CSV, usar readAsText com encoding UTF-8
                const csvText = e.target.result;
                log("Processando CSV de medidas com encoding UTF-8");
                workbook = XLSX.read(csvText, {type: "string", raw: false, codepage: 65001});
            } else {
                // Para Excel (.xlsx, .xls), usar ArrayBuffer
                const data = new Uint8Array(e.target.result);
                workbook = XLSX.read(data, {type: "array", raw: false, codepage: 65001});
            }
            
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1, raw: false});
            
            dadosMedidas = processMedidasData(jsonData);
            showMedidasPreview(dadosMedidas);
            
            document.getElementById("btnImportarMedidas").disabled = false;
            log(dadosMedidas.length + " medidas prontas");
        } catch (err) {
            log("Erro: " + err.message, "error");
        }
    };
    
    // Usar método de leitura apropriado baseado no tipo do arquivo
    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function processMedidasData(data) {
    const result = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] || row[1]) {
            result.push({
                codigo_aluno: row[0] ? String(row[0]).trim() : "",
                nome_aluno: row[1] ? String(row[1]).trim() : "",
                turma: row[2] ? String(row[2]).trim() : "",
                data: row[3] ? String(row[3]).trim() : "",
                especificacao: row[4] ? String(row[4]).trim() : "",
                observacao: row[5] ? String(row[5]).trim() : "",
                tipo_medida: row[6] ? String(row[6]).trim() : "",
                nr_medida: row[7] ? String(row[7]).trim() : ""
            });
        }
    }
    return result;
}

function showMedidasPreview(data) {
    const container = document.getElementById("previewMedidasContent");
    if (!container) return;
    
    let html = "<h4>Preview: " + data.length + " medidas</h4>";
    html += "<table border=1><tr><th>Código</th><th>Nome</th><th>Data</th><th>Especificação</th></tr>";
    
    for (let i = 0; i < Math.min(3, data.length); i++) {
        html += "<tr><td>" + data[i].codigo_aluno + "</td><td>" + data[i].nome_aluno + "</td><td>" + data[i].data + "</td><td>" + data[i].especificacao + "</td></tr>";
    }
    html += "</table>";
    
    container.innerHTML = html;
    document.getElementById("previewMedidas").style.display = "block";
}

async function importMedidasData() {
    log("Importando medidas...");
    
    // Verificar se o usuário está autenticado
    const user = window.localAuth.currentUser;
    if (!user) {
        log("Erro: Você precisa estar logado para importar medidas", "error");
        return;
    }
    
    log("Usuário autenticado: " + user.email);
    
    if (!window.db) {
        if (typeof window.localDb !== "undefined" && window.localDb.loaded) {
            window.db = window.db;
        } else {
            log("Sistema Local não carregado", "error");
            return;
        }
    }
    
    let success = 0;
    let updated = 0;
    let errors = 0;
    
    for (const medida of dadosMedidas) {
        try {
            let medidaExistente = null;
            let docId = null;

            // Tentar encontrar medida existente (mesmo aluno, mesma data, mesma especificação)
            if (medida.codigo_aluno && medida.data && medida.especificacao) {
                const querySnap = await db.collection("medidas_disciplinares")
                    .where("codigo_aluno", "==", medida.codigo_aluno)
                    .where("data", "==", medida.data)
                    .where("especificacao", "==", medida.especificacao)
                    .limit(1)
                    .get();
                
                if (!querySnap.empty) {
                    const doc = querySnap.docs[0];
                    medidaExistente = { id: doc.id, ...doc.data() };
                    docId = doc.id;
                }
            }

            if (medidaExistente) {
                // Atualizar medida existente com novos dados (se houver)
                const dadosMerge = {};
                
                Object.keys(medida).forEach(key => {
                    if (medida[key] && medida[key].toString().trim()) {
                        dadosMerge[key] = medida[key];
                    }
                });

                await db.collection("medidas_disciplinares").doc(docId).update({
                    ...dadosMerge,
                    updated_at: new Date().toISOString(),
                    updated_by: user.uid
                });
                
                updated++;
                log("Atualizada: " + medida.nome_aluno + " - " + medida.especificacao);
            } else {
                // Criar nova medida
                docId = "medida_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
                
                await db.collection("medidas_disciplinares").doc(docId).set({
                    ...medida,
                    created_at: new Date().toISOString(),
                    created_by: user.uid
                });
                
                success++;
                log("Criada: " + medida.nome_aluno + " - " + medida.especificacao);
            }

        } catch (err) {
            errors++;
            log("Erro ao processar medida de " + medida.nome_aluno + ": " + err.message, "error");
        }
    }
    
    log("Medidas concluídas: " + success + " novas, " + updated + " atualizadas, " + errors + " erros");
    
    // Recalcular notas disciplinares automaticamente após importação
    if (success > 0 || updated > 0) {
        try {
            log("Recalculando notas disciplinares automaticamente...");
            
            // Verificar se as funções estão disponíveis
            if (typeof window.recalcularTodasNotas === 'function') {
                const resultado = await window.recalcularTodasNotas();
                log(`✅ ${resultado.contador} notas disciplinares recalculadas automaticamente!`);
            } else {
                log("Função de recálculo não disponível. Acesse a página de Medidas Disciplinares para recalcular.");
            }
        } catch (error) {
            log("Erro ao recalcular notas: " + error.message, "error");
        }
    }
}

// Função para inicializar notas disciplinares automaticamente
async function inicializarNotasAutomatico() {
    const user = window.localAuth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar todos os alunos
    const alunosSnapshot = await db.collection("alunos").get();
    let contador = 0;

    for (const alunoDoc of alunosSnapshot.docs) {
        const alunoData = alunoDoc.data();
        const alunoId = alunoDoc.id;

        // Verificar se já existe nota disciplinar para este aluno
        const notasSnapshot = await db.collection("notas_disciplinares")
            .where("codigo_aluno", "==", alunoData.codigo || alunoId)
            .limit(1)
            .get();

        // Se não existir, criar nota inicial
        if (notasSnapshot.empty) {
            const notaId = `nota_${alunoId}`;
            
            await db.collection("notas_disciplinares").doc(notaId).set({
                codigo_aluno: alunoData.codigo || alunoId,
                nome_aluno: alunoData.nome_completo || "",
                turma: alunoData.turma || "",
                nota_comportamento: 10.0,
                total_ocorrencias: 0,
                ocorrencias_graves: 0,
                ocorrencias_leves: 0,
                media_mensal: 10.0,
                status: "regular",
                observacoes: "Nota inicial criada automaticamente",
                ultima_atualizacao: new Date().toISOString(),
                created_at: new Date().toISOString(),
                created_by: user.uid,
                updated_at: new Date().toISOString(),
                updated_by: user.uid
            });

            contador++;
        }
    }

    return { atualizados: contador };
}

// Função para remover duplicatas apenas (sem reimportar)
async function removerDuplicatas() {
    const confirmar = confirm("🔍 REMOVER DUPLICATAS\n\nEsta operação irá:\n• Buscar alunos duplicados (mesmo código ou nome)\n• Manter apenas o mais recente de cada duplicata\n• NÃO importar novos dados\n\nDeseja prosseguir?");
    
    if (!confirmar) {
        log("Operação cancelada pelo usuário");
        return;
    }
    
    log("🔍 Iniciando remoção de duplicatas...");
    
    const user = window.localAuth.currentUser;
    if (!user) {
        log("Erro: Você precisa estar logado", "error");
        return;
    }
    
    try {
        const alunosSnapshot = await db.collection("alunos").get();
        const duplicatasMap = new Map();
        const paraRemover = [];
        
        // Agrupar por código ou nome
        alunosSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const chave = data.codigo || data.nome_completo;
            
            if (chave) {
                if (!duplicatasMap.has(chave)) {
                    duplicatasMap.set(chave, []);
                }
                duplicatasMap.get(chave).push({
                    id: doc.id,
                    data: data,
                    created_at: data.created_at || data.atualizadoEm || '1970-01-01'
                });
            }
        });
        
        // Identificar duplicatas
        let duplicatas = 0;
        duplicatasMap.forEach((docs, chave) => {
            if (docs.length > 1) {
                // Ordenar por data de criação (mais recente primeiro)
                docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                // Marcar todos exceto o primeiro (mais recente) para remoção
                for (let i = 1; i < docs.length; i++) {
                    paraRemover.push(docs[i]);
                    duplicatas++;
                }
            }
        });
        
        log(`📊 Encontradas ${duplicatas} duplicatas para remover`);
        
        // Remover duplicatas
        for (const item of paraRemover) {
            await db.collection("alunos").doc(item.id).delete();
            log(`🗑️ Removido: ${item.data.nome_completo} (${item.id})`);
        }
        
        log(`✅ ${duplicatas} duplicatas removidas com sucesso!`);
        
    } catch (error) {
        log(`❌ Erro ao remover duplicatas: ${error.message}`, "error");
    }
}

function log(msg, type) {
    const container = document.getElementById("logImportacao");
    if (!container) {
        console.log(msg);
        return;
    }
    
    const time = new Date().toLocaleTimeString();
    container.textContent += time + " - " + msg + "\n";
    container.scrollTop = container.scrollHeight;
    console.log(msg);
}
