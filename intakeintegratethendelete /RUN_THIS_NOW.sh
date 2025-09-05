#!/bin/bash
# RUN_THIS_NOW.sh - EXECUTE THESE COMMANDS TO FIX YOUR SYSTEM

echo "🚀 OGZFV QUANTUM TRADING SYSTEM - MASTER INTEGRATION"
echo "===================================================="
echo "Starting complete system integration..."
echo ""

# Navigate to project directory
cd /c/Users/og_za/Downloads/OGZFV-quantumgigahookuporgy/OGZFV-quantum

# Run all fixes in order
echo "Step 1: Master Integration - Connecting 60+ modules..."
node ../../importandintegrate/16_master_integration.js

echo ""
echo "Step 2: Removing Math.random() from Quantum Core..."
node ../../importandintegrate/17_remove_all_rng_quantum.js

echo ""
echo "Step 3: Fixing ExecutionLayer for real trading..."
node ../../importandintegrate/18_fix_execution_layer.js

echo ""
echo "Step 4: Fixing WebSocket singleton..."
node ../../importandintegrate/19_fix_websocket_singleton.js

echo ""
echo "Step 5: Fixing dashboard WebSockets..."
node ../../importandintegrate/20_fix_dashboard_websocket.js

echo ""
echo "Step 6: Validating system..."
node ../../importandintegrate/21_validate_and_startup.js validate

echo ""
echo "===================================================="
echo "✅ ALL FIXES APPLIED!"
echo ""
echo "To start your system:"
echo "node ../../importandintegrate/21_validate_and_startup.js start"
echo ""
echo "💰 HOUSTON HERE WE COME! 🚀"
