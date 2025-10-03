# Script PowerShell para executar npm run dev com sintaxe correta
Write-Host "Corrigindo erro de sintaxe do PowerShell..." -ForegroundColor Green
Write-Host ""

# Verificar se estamos no diretório correto
$currentDir = Get-Location
Write-Host "Diretório atual: $currentDir" -ForegroundColor Yellow

# Verificar se o package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de estar no diretório correto do projeto." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "INSTRUÇÕES:" -ForegroundColor Cyan
    Write-Host "1. Navegue até a pasta do projeto:" -ForegroundColor White
    Write-Host "   cd 'C:\Users\user\Documents\GitHub\otics-agenda 06.2-08-2025'" -ForegroundColor White
    Write-Host "2. Execute este script novamente" -ForegroundColor White
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "AVISO: node_modules não encontrado!" -ForegroundColor Yellow
    Write-Host "Instalando dependências..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao instalar dependências!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

# Executar npm run dev
Write-Host "Executando: npm run dev" -ForegroundColor Green
Write-Host ""

try {
    npm run dev
} catch {
    Write-Host "ERRO: Falha ao executar npm run dev" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "ALTERNATIVAS:" -ForegroundColor Cyan
    Write-Host "1. Tente executar manualmente: npm run dev" -ForegroundColor White
    Write-Host "2. Verifique se o Node.js está instalado: node --version" -ForegroundColor White
    Write-Host "3. Verifique se o npm está instalado: npm --version" -ForegroundColor White
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "Script concluído com sucesso!" -ForegroundColor Green 