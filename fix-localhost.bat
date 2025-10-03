@echo off
echo Iniciando servidor em localhost:3000...
cd /d %~dp0
npx vite --port 3000 --host localhost
pause 