@echo off
echo ========================================
echo  OGZ PRIME PUBLIC DEMO LAUNCHER
echo ========================================
echo.

echo [1/3] Starting your real trading bot (v10.2)...
start "OGZ Prime Bot" cmd /c "node run-trading-bot-v10.2.js"

echo [2/3] Waiting 10 seconds for bot to initialize...
timeout /t 10 /nobreak

echo [3/3] Starting public dashboard proxy (45s delay)...
start "Public Dashboard Proxy" cmd /c "node public-dashboard-proxy.js"

echo.
echo ========================================
echo  READY FOR NGROK TUNNELING!
echo ========================================
echo.
echo Your services are now running:
echo - Real bot: localhost:3002 (private)
echo - Public demo: localhost:3010 (45s delayed)
echo.
echo Next steps:
echo 1. Open new terminal
echo 2. Run: ngrok http 3010
echo 3. Share the ngrok URL with investors
echo.
echo Press any key to continue...
pause >nul
