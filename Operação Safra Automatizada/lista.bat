@echo off
cd "C:\Users\User\Desktop\Gabriel - Leão"

echo ===== Estrutura da pasta Operacao-Safra-Automatizada ===== > estrutura.txt

:: Lista tudo, mas ignora arquivos irrelevantes
for /r %%F in (*) do (
    echo %%~nxF | findstr /i /r "\.log$ \.tmp$ \.bak$ \.lock$ \.cache$ \.pyc$ \.pyo$ \.db$" >nul
    if errorlevel 1 (
        echo %%F >> estrutura.txt
    )
)

notepad estrutura.txt