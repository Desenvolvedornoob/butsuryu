@echo off
echo Corrigindo erro de sintaxe do PowerShell...
echo.

REM Verificar se o PowerShell está disponível
powershell -Command "Write-Host 'PowerShell disponível'" 2>nul
if errorlevel 1 (
    echo ERRO: PowerShell não está disponível
    pause
    exit /b 1
)

REM Executar o comando npm run dev com sintaxe correta
echo Executando: npm run dev
echo.

REM Opção 1: Usar cmd diretamente
echo Opção 1: Executando via CMD...
cmd /c "npm run dev"

REM Se a opção 1 falhar, tentar opção 2
if errorlevel 1 (
    echo.
    echo Opção 1 falhou, tentando Opção 2...
    echo Opção 2: Executando via PowerShell com sintaxe correta...
    powershell -Command "npm run dev"
)

REM Se ambas falharem, mostrar instruções
if errorlevel 1 (
    echo.
    echo Ambas as opções falharam.
    echo.
    echo INSTRUÇÕES MANUAIS:
    echo 1. Abra o PowerShell como administrador
    echo 2. Navegue até a pasta do projeto:
    echo    cd "C:\Users\user\Documents\GitHub\otics-agenda 06.2-08-2025"
    echo 3. Execute: npm run dev
    echo.
    pause
)

echo.
echo Script concluído.
pause 