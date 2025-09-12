@echo off
echo 🏋️‍♀️ FULL FORCE ACADEMIA - TESTE N8N CREDENCIAIS
echo ============================================
echo 📧 Login: eugabrielmktd@gmail.com
echo 🔒 Senha: Adogo123
echo.

echo 🔄 Verificando N8N...
curl -s -o nul -w "N8N Status: %%{http_code}" http://localhost:5678
echo.

echo 🔄 Verificando WhatsApp Bridge...
curl -s -o nul -w "Bridge Status: %%{http_code}" http://localhost:3001/status
echo.

echo 📊 Status WhatsApp Bridge:
curl -s http://localhost:3001/status
echo.
echo.

echo 📈 Estatísticas Bridge:
curl -s http://localhost:3001/stats
echo.
echo.

echo 🌐 ABRINDO INTERFACES...
start "" "http://localhost:5678"
echo.

echo ✅ SISTEMA PRONTO PARA IMPLEMENTAÇÃO!
echo.
echo 📋 PRÓXIMOS PASSOS:
echo 1. Login N8N: eugabrielmktd@gmail.com / Adogo123
echo 2. Importar workflows (pasta n8n/workflows/)
echo 3. Configurar credenciais Google Sheets + SMTP
echo 4. Testar workflows
echo 5. Ativar para produção
echo.
echo 💰 ROI: R$ 12.600/mês de 561 ex-alunos
echo 🎯 META: 84 reativações/mês
echo.

pause