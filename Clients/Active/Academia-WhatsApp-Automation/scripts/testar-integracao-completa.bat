@echo off
echo 🏋️‍♀️ FULL FORCE ACADEMIA - TESTE INTEGRAÇÃO COMPLETA
echo ==================================================
echo 📍 Matupá-MT - Sistema WhatsApp + N8N
echo.

echo 📋 VERIFICANDO PRÉ-REQUISITOS...
echo.

echo ✅ 1. Verificando N8N...
curl -s -o nul -w "N8N Status: %%{http_code}" http://localhost:5678
echo.

echo ✅ 2. Verificando Docker Services...
docker-compose ps
echo.

echo 🚀 3. INICIANDO WHATSAPP BRIDGE SERVER...
echo.
echo 📱 IMPORTANTE: 
echo - Certifique-se que o WhatsApp já foi conectado
echo - Se não conectou ainda, execute: ativar-whatsapp-agora.bat
echo.

pause
echo.

echo 🔄 Iniciando servidor bridge na porta 3001...
start /B node whatsapp-bridge-server.js
echo.

echo ⏳ Aguardando 5 segundos para servidor inicializar...
timeout /t 5 /nobreak > nul
echo.

echo 🧪 TESTANDO ENDPOINTS...
echo.

echo 📊 1. Status do Bridge Server:
curl -s http://localhost:3001/status
echo.
echo.

echo 🏥 2. Health Check:
curl -s http://localhost:3001/health  
echo.
echo.

echo 🌐 3. Abrindo interfaces para configuração...
start "" "http://localhost:5678"
start "" "http://localhost:3001/status"
echo.

echo ✅ SISTEMA PRONTO! Próximos passos:
echo.
echo 📋 NO N8N (http://localhost:5678):
echo 1. Importar workflow: 3-reactivation-campaign-whatsapp-real.json
echo 2. Configurar Google Sheets credentials
echo 3. Configurar SMTP para emails
echo 4. Testar com dados de ex-alunos-teste.csv
echo.
echo 💰 ROI ESPERADO HOJE: R$ 450+ (primeira recuperação)
echo 🎯 META: 84 ex-alunos reativados em 30 dias
echo 💪 RECEITA MENSAL: R$ 12.600
echo.

pause