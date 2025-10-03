#!/usr/bin/env node

/**
 * FINAL SYSTEM CHECK
 * Verifies all components are ready for production
 */

const fs = require('fs');
const { exec } = require('child_process');
const WebSocket = require('ws');

console.log('═══════════════════════════════════════════════════════');
console.log('         OGZ PRIME FINAL SYSTEM CHECK');
console.log('═══════════════════════════════════════════════════════\n');

const checks = {
  modules: { passed: 0, failed: 0, items: [] },
  processes: { passed: 0, failed: 0, items: [] },
  features: { passed: 0, failed: 0, items: [] },
  connections: { passed: 0, failed: 0, items: [] }
};

// Check 1: All Core Modules
console.log('📦 CHECKING CORE MODULES...');
const requiredModules = [
  'core/RiskManager.js',
  'core/OptimizedTradingBrain.js',
  'core/MaxProfitManager.js',
  'core/TradingSafetyNet.js',
  'core/PerformanceAnalyzer.js',
  'core/QuantumPositionSizer.js',
  'core/PerformanceValidator.js',
  'core/PerformanceVisualizer.js',
  'core/AdvancedWebSocketBroadcastSystem.js',
  'core/RealQuantumEnhancement.js',
  'core/OGZPrimeV14_QuantumDeFi.js'
];

requiredModules.forEach(module => {
  const path = `/root/OGZFV-valhalla/${module}`;
  if (fs.existsSync(path)) {
    console.log(`  ✅ ${module}`);
    checks.modules.passed++;
  } else {
    console.log(`  ❌ ${module} - MISSING`);
    checks.modules.failed++;
  }
});

// Check 2: Running Processes
console.log('\n🚀 CHECKING RUNNING PROCESSES...');
exec('pm2 jlist', (error, stdout) => {
  if (!error) {
    try {
      const processes = JSON.parse(stdout);
      const required = ['v13-stable', 'valhalla-bot', 'ssl-advance', 'mover-ai'];
      
      required.forEach(name => {
        const proc = processes.find(p => p.name === name);
        if (proc && proc.pm2_env.status === 'online') {
          console.log(`  ✅ ${name} - ONLINE`);
          checks.processes.passed++;
        } else {
          console.log(`  ❌ ${name} - ${proc ? proc.pm2_env.status : 'NOT FOUND'}`);
          checks.processes.failed++;
        }
      });
    } catch (e) {
      console.log('  ❌ Failed to check PM2 processes');
    }
  }
  
  // Check 3: Trading Features
  console.log('\n⚙️ CHECKING TRADING FEATURES...');
  const features = {
    'Kill Switch': checkFileContains('run-trading-bot-v13-simplified.js', 'emergencyStop'),
    'Breakeven Protection': checkFileContains('run-trading-bot-v13-simplified.js', 'breakevenActivated'),
    'Tiered Exit System': checkFileContains('run-trading-bot-v13-simplified.js', 'tieredExit'),
    'Pattern Recognition': checkFileContains('run-trading-bot-v13-simplified.js', 'patterns'),
    'Multi-Asset Support': checkFileContains('ogzprime_ssl_server_advanced.js', 'XA.BTC-USD'),
    'Risk Management': checkFileContains('run-trading-bot-v13-simplified.js', 'RiskManager'),
    'Quantum Enhancement': checkFileContains('run-trading-bot-v13-simplified.js', 'RealQuantumEnhancement')
  };
  
  for (const [feature, exists] of Object.entries(features)) {
    if (exists) {
      console.log(`  ✅ ${feature}`);
      checks.features.passed++;
    } else {
      console.log(`  ❌ ${feature}`);
      checks.features.failed++;
    }
  }
  
  // Check 4: WebSocket Connections
  console.log('\n🔌 CHECKING WEBSOCKET CONNECTIONS...');
  
  // Check main data feed
  const ws = new WebSocket('ws://127.0.0.1:3010/ws');
  let wsConnected = false;
  
  ws.on('open', () => {
    wsConnected = true;
    console.log('  ✅ Main WebSocket (3010) - CONNECTED');
    checks.connections.passed++;
    ws.close();
    
    // Check Polygon connection via logs
    exec('tail -100 /root/.pm2/logs/ssl-advance-out.log | grep "Connected to Polygon"', (err, stdout) => {
      if (stdout.includes('Connected to Polygon')) {
        console.log('  ✅ Polygon.io Feed - CONNECTED');
        checks.connections.passed++;
      } else {
        console.log('  ❌ Polygon.io Feed - NOT CONNECTED');
        checks.connections.failed++;
      }
      
      printSummary();
    });
  });
  
  ws.on('error', () => {
    console.log('  ❌ Main WebSocket (3010) - FAILED');
    checks.connections.failed++;
    printSummary();
  });
  
  setTimeout(() => {
    if (!wsConnected) {
      console.log('  ❌ Main WebSocket (3010) - TIMEOUT');
      checks.connections.failed++;
      ws.close();
      printSummary();
    }
  }, 5000);
});

function checkFileContains(filename, searchString) {
  const path = `/root/OGZFV-valhalla/${filename}`;
  if (!fs.existsSync(path)) return false;
  const content = fs.readFileSync(path, 'utf8');
  return content.includes(searchString);
}

function printSummary() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                    SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [category, results] of Object.entries(checks)) {
    totalPassed += results.passed;
    totalFailed += results.failed;
    const emoji = results.failed === 0 ? '✅' : '⚠️';
    console.log(`${emoji} ${category.toUpperCase()}: ${results.passed} passed, ${results.failed} failed`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`OVERALL: ${totalPassed} PASSED / ${totalFailed} FAILED`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 SYSTEM IS READY FOR PRODUCTION!');
  } else if (totalFailed <= 3) {
    console.log('\n⚠️ SYSTEM IS MOSTLY READY - Minor issues to fix');
  } else {
    console.log('\n❌ SYSTEM NEEDS WORK - Multiple issues detected');
  }
  
  console.log('\n📋 CRITICAL ISSUES REMAINING:');
  console.log('  1. Trading confidence always returns 0');
  console.log('  2. No GUI launcher for non-tech users');
  console.log('  3. No license/distribution system');
  console.log('  4. Dashboard display connection issues');
  console.log('═══════════════════════════════════════════════════════');
}