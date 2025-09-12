@echo off
echo 🚀 CONFIGURACAO N8N - FULL FORCE ACADEMIA
echo ==========================================
echo.

echo ✅ Verificando servicos...
docker-compose ps

echo.
echo 🌐 Abrindo interfaces...
start "" "http://localhost:5678"
echo.

echo 📋 CHECKLIST DE CONFIGURACAO:
echo.
echo [ ] 1. N8N aberto no navegador (admin/academia2024)
echo [ ] 2. Google Cloud Console - Criar Service Account
echo [ ] 3. Baixar JSON key do Service Account  
echo [ ] 4. N8N - Credentials - Add Google Sheets API
echo [ ] 5. Importar workflows na ordem:
echo       - 1-setup-whatsapp-evolution.json
echo       - 2-import-ex-students.json
echo       - 3-reactivation-campaign.json
echo       - 4-process-responses.json
echo       - 5-dashboard-report.json
echo [ ] 6. Configurar SMTP para emails
echo [ ] 7. Testar workflow 2 com ex-alunos-teste.csv
echo.

echo 🔗 Links importantes:
echo - N8N: http://localhost:5678
echo - Google Cloud: https://console.cloud.google.com
echo - Adminer: http://localhost:8081
echo.

echo 📊 Dados de teste prontos:
echo - ex-alunos-teste.csv (10 registros)
echo - Workflows configurados para Full Force Academia
echo - Templates personalizados para Matupá-MT
echo.

echo ⏰ Tempo estimado de configuracao: 45 minutos
echo 💰 ROI esperado: R$ 12.600/mes (561 ex-alunos)
echo.

pause