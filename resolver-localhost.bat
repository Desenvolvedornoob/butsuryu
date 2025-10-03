@echo off
echo Iniciando servidor de desenvolvimento com configurações específicas para localhost...
cd /d %~dp0
npm run dev -- --port 3000 --host localhost
pause 