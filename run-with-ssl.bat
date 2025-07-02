@echo off
echo Starting OGZ Prime with SSL Server...
echo.

REM Start SSL server in background
start "SSL Server" cmd /c node start-ssl-server.js

REM Wait 3 seconds for SSL to initialize
timeout /t 3 /nobreak > nul

REM Start main trading bot
echo Starting Trading Bot...
node run-trading-bot-v10.2.js

pause