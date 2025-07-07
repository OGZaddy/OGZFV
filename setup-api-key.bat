@echo off
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                  🔑 OGZ API KEY SETUP 🔑                         ║
echo ║                  SET YOUR POLYGON API KEY                        ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo This will set your Polygon API key for live trading
echo ⚠️  Make sure you have your Polygon.io API key ready!
echo.
set /p api_key="Enter your Polygon API key: "

if "%api_key%"=="" (
    echo ❌ No API key entered. Exiting...
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up API key...

REM Set environment variable for current session
set POLYGON_API_KEY=%api_key%

REM Create .env file for persistent storage
echo POLYGON_API_KEY=%api_key% > .env

echo ✅ API key configured successfully!
echo 📁 Saved to .env file for persistence
echo 🔌 Environment variable set for current session
echo.
echo 🚀 You can now run the autonomous trader with live data!
echo    Run: node LAUNCH-AUTONOMOUS-3DAY.js
echo.
pause