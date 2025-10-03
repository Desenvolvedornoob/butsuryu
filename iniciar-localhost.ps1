# Script PowerShell para iniciar o servidor em localhost:3000
Write-Host "Iniciando servidor em localhost:3000..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
npx vite --port 3000 --host localhost 