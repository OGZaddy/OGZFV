@echo off
REM RUN_THIS_NOW.bat - EXECUTE THIS TO FIX YOUR ENTIRE SYSTEM
REM Run from your OGZFV-quantum directory

echo ========================================================
echo    OGZFV QUANTUM TRADING SYSTEM - MASTER INTEGRATION
echo    YOUR PATH TO HOUSTON STARTS HERE!
echo ========================================================
echo.

REM Change to the OGZFV-quantum directory
cd /d C:\Users\og_za\Downloads\OGZFV-quantumgigahookuporgy\OGZFV-quantum

echo Step 1: Master Integration - Connecting 60+ modules...
echo -------------------------------------------------------
node ..\..\importandintegrate\16_master_integration.js
if errorlevel 1 goto error
echo.

echo Step 2: Removing Math.random() from Quantum Core...
echo -------------------------------------------------------
node ..\..\importandintegrate\17_remove_all_rng_quantum.js
if errorlevel 1 goto error
echo.

echo Step 3: Fixing ExecutionLayer for real trading...
echo -------------------------------------------------------
node ..\..\importandintegrate\18_fix_execution_layer.js
if errorlevel 1 goto error
echo.

echo Step 4: Fixing WebSocket singleton...
echo -------------------------------------------------------
node ..\..\importandintegrate\19_fix_websocket_singleton.js
if errorlevel 1 goto error
echo.

echo Step 5: Fixing dashboard WebSockets...
echo -------------------------------------------------------
node ..\..\importandintegrate\20_fix_dashboard_websocket.js
if errorlevel 1 goto error
echo.

echo Step 6: Validating system...
echo -------------------------------------------------------
node ..\..\importandintegrate\21_validate_and_startup.js validate
if errorlevel 1 goto warning
echo.

echo ========================================================
echo    ALL FIXES SUCCESSFULLY APPLIED!
echo ========================================================
echo.
echo To start your trading system, run:
echo node ..\..\importandintegrate\21_validate_and_startup.js start
echo.
echo Or to force start without validation:
echo node ..\..\importandintegrate\21_validate_and_startup.js force-start
echo.
echo HOUSTON HERE WE COME! 
echo Your path to financial freedom is ready!
echo.
pause
exit /b 0

:error
echo.
echo ========================================================
echo    ERROR: Fix failed! Check the output above.
echo ========================================================
echo.
echo Manual intervention may be required.
echo Check the error message and fix before continuing.
echo.
pause
exit /b 1

:warning
echo.
echo ========================================================
echo    WARNING: Validation found issues!
echo ========================================================
echo.
echo Review the validation output above.
echo You can force start with: force-start
echo But it's recommended to fix issues first.
echo.
pause
exit /b 0
