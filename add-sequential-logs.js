const fs = require('fs');
const file = '/root/OGZFV-valhalla/run-trading-bot-v13-simplified.js';
let content = fs.readFileSync(file, 'utf8');

// Find performTradingCycle function and add sequential logging
const tradingCycleRegex = /async performTradingCycle\(\) {[\s\S]*?console\.log\('🔍 Performing trading cycle\.\.\.'\);/;

const sequentialLogs = `async performTradingCycle() {
    console.log('[TRADE CYCLE START] ========================================');
    console.log('[1/8] MARKET DATA: Fetching current price feed...');
    
    if (!this.systemState.active || this.systemState.emergencyMode) {
      console.log('[ABORT] System inactive or emergency mode active');
      return;
    }

    try {
      console.log('[2/8] SAFETY CHECK: Validating market conditions with TradingSafetyNet...');`;

content = content.replace(/async performTradingCycle\(\) {[\s\S]*?try {/, sequentialLogs);

fs.writeFileSync(file, content);
console.log('Added sequential trade cycle logging');
