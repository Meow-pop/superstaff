@echo off
setlocal
cd /d "%~dp0"
docker compose -f docker-compose.yml -f docker-compose.local-ai.yml down
endlocal
