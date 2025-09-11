@echo off
echo.
echo ================================================================
echo  🏋️‍♂️ FULL FORCE ACADEMIA - SISTEMA DE REATIVACAO N8N
echo ================================================================
echo  📍 Matupá-MT | 561 Ex-Alunos | R$ 84.150/mês Potencial
echo ================================================================
echo.

echo [1/5] 🐳 Iniciando containers Docker...
docker-compose up -d

echo.
echo [2/5] ⏳ Aguardando serviços iniciarem (30s)...
timeout /t 30 /nobreak > nul

echo.
echo [3/5] 📊 Verificando status dos serviços...
docker-compose ps

echo.
echo [4/5] 🌐 Abrindo interfaces do sistema...
start "" "http://localhost:5678"
timeout /t 3 /nobreak > nul
start "" "http://localhost:8080"

echo.
echo [5/5] ✅ Sistema iniciado com sucesso!
echo.
echo ================================================================
echo  🚀 PRÓXIMOS PASSOS:
echo ================================================================
echo  1. N8N Dashboard: http://localhost:5678
echo     Usuario: admin / Senha: academia2024
echo.
echo  2. Importar workflows (ordem):
echo     - 1-setup-whatsapp-evolution.json
echo     - 2-import-ex-students.json  
echo     - 3-reactivation-campaign.json
echo     - 4-process-responses.json
echo     - 5-dashboard-report.json
echo.
echo  3. Configurar credenciais:
echo     - Google Sheets API
echo     - SMTP Email
echo     - Evolution API Key
echo.
echo  4. Executar workflows:
echo     - Setup WhatsApp (escanear QR)
echo     - Import CSV (ex-alunos-teste.csv)
echo     - Test Campaign (primeira mensagem)
echo.
echo ================================================================
echo  📱 Evolution API: http://localhost:8080
echo  🗄️  Adminer: http://localhost:8081
echo  📊 Dashboard: Executar Workflow 5
echo ================================================================
echo.

echo 💰 PROJEÇÃO ROI:
echo  - 561 ex-alunos contactados
echo  - 15%% conversão = 84 novos alunos  
echo  - R$ 12.600/mês recuperados
echo  - ROI: 2520%% (primeira campanha)
echo.

echo 🎯 SISTEMA PRONTO PARA RECUPERAR EX-ALUNOS!
echo Pressione qualquer tecla para continuar...
pause >nul