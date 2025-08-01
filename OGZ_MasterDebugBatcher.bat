@echo off
title OGZ Prime - Diagnostic Launcher
color 0A

echo ========================================
echo  OGZ Prime Valhalla Launch - Debug Mode
echo ========================================
echo.

echo [✓] Verifying Node.js...
node -v
IF %ERRORLEVEL% NEQ 0 (
    echo [✗] Node.js not found in PATH. Exiting...
    pause
    exit /b
)

echo [✓] Node is available.
timeout /t 1 >nul

echo [✓] Launching Trading Bot (simulate mode)...
start cmd /k "echo [Bot] Running run-trading-bot-v13-simplified.js && node run-trading-bot-v13-simplified.js --simulate --profile default --asset BTC-USD"

timeout /t 2 >nul

echo [✓] Launching Data Feed...
start cmd /k "echo [Feed] Running historical-data-loader.js && node historical-data-loader.js"

timeout /t 2 >nul

echo [✓] Opening Valhalla GUI...
start "" "valhalla-dashboard.html"

echo.
echo ✅ All systems triggered. Check each terminal window.
pause
