@echo off
setlocal
cd /d "%~dp0"
echo Starting Superstaff with the local Qwen model...
echo The first launch downloads model weights and can take several minutes.
docker compose -f docker-compose.yml -f docker-compose.local-ai.yml up -d --build
if errorlevel 1 exit /b %errorlevel%
start "" http://127.0.0.1:8080/
endlocal
