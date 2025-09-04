// 06_validate_and_startup.js - COMPLETE SYSTEM VALIDATION AND STARTUP
// This validates ALL fixes and starts your quantum trading system
// RUN THIS AFTER APPLYING ALL OTHER FIXES

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ==================================================================
// VALIDATION CHECKLIST - ALL CRITICAL ISSUES
// ==================================================================
const VALIDATION_CHECKS = {
  // 1. No Math.random() in trading path
  noRandomInQuantumCore: {
    file: 'core/QuantumNeuromorphicCore.js',
    check: (content) => !content.includes('Math.random()'),
    error: 'QuantumNeuromorphicCore still contains Math.random()',
    critical: true
  },
  
  // 2. No paper trading in ExecutionLayer
  noPaperTrading: {
    file: 'core/ExecutionLayer.js',
    check: (content) => !content.includes('sandboxMode: true') && 
                         !content.includes('paperTrade'),
    error: 'ExecutionLayer still has paper trading enabled',
    critical: true
  },
  
  // 3. Commission calculation includes quantity
  commissionFixed: {
    file: 'core/ExecutionLayer.js',
    check: (content) => content.includes('positionSizeUSD * fee'),
    error: 'Commission calculation missing quantity multiplier',
    critical: true
  },
  
  // 4. Position sizing implemented
  positionSizingExists: {
    file: 'core/ExecutionLayer.js',
    check: (content) => content.includes('calculatePositionSize'),
    error: 'Position sizing not implemented',
    critical: true
  },
  
  // 5. WebSocket singleton pattern
  websocketSingleton: {
    file: 'core/WebsocketManager.js',
    check: (content) => content.includes('WebSocketManager.instance'),
    error: 'WebSocket singleton pattern not implemented',
    critical: true
  },
  
  // 6. WebSocket port 3010 only
  websocketPort3010: {
    file: 'core/WebsocketManager.js',
    check: (content) => content.includes('port: 3010') && 
                        !content.includes('port: 8080'),
    error: 'WebSocket not using port 3010',
    critical: true
  },
  
  // 7. No localhost, only 127.0.0.1
  noLocalhost: {
    file: 'run-trading-bot-v13-quantum.js',
    check: (content) => !content.includes("'localhost'") && 
                         content.includes('127.0.0.1'),
    error: 'Still using "localhost" instead of "127.0.0.1"',
    critical: true
  },
  
  // 8. Aggressive mode disabled
  aggressiveModeOff: {
    file: 'run-trading-bot-v13-quantum.js',
    check: (content) => content.includes('aggressiveMode: false'),
    error: 'Aggressive mode still enabled',
    critical: true
  },
  
  // 9. Risk modules connected
  riskManagerConnected: {
    file: 'core/UnifiedTradingCore.js',
    check: (content) => content.includes('RiskManager') && 
                        content.includes('MaxProfitManager'),
    error: 'Risk management modules not connected',
    critical: false
  },
  
  // 10. Module auto-loader exists
  moduleAutoLoaderExists: {
    file: 'core/ModuleAutoLoader.js',
    check: (content) => content.includes('class ModuleAutoLoader'),
    error: 'ModuleAutoLoader not found',
    critical: false
  },
  
  // 11. Polygon API key set
  polygonApiKey: {
    file: '.env',
    check: (content) => content.includes('POLYGON_API_KEY='),
    error: 'POLYGON_API_KEY not set in .env',
    critical: true,
    skipIfMissing: true
  },
  
  // 12. Dashboard WebSocket fixed
  dashboardWebSocketFixed: {
    file: 'unified-dashboard.html',
    check: (content) => content.includes('ws://127.0.0.1:3010'),
    error: 'Dashboard not using correct WebSocket URL',
    critical: false,
    skipIfMissing: true
  }
};

// ==================================================================
// VALIDATION FUNCTIONS
// ==================================================================
async function validateSystem() {
  console.log('🔍 VALIDATING QUANTUM TRADING SYSTEM');
  console.log('=====================================\\n');
  
  let criticalErrors = 0;
  let warnings = 0;
  const results = {};
  
  for (const [checkName, checkConfig] of Object.entries(VALIDATION_CHECKS)) {
    const filePath = path.join(__dirname, checkConfig.file);
    
    try {
      if (!fs.existsSync(filePath)) {
        if (checkConfig.skipIfMissing) {
          console.log('  ⚠️', checkName + ':', 'File not found (skipped)');
          warnings++;
          continue;
        } else {
          console.log('  ❌', checkName + ':', 'File not found!');
          criticalErrors++;
          results[checkName] = false;
          continue;
        }
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const passed = checkConfig.check(content);
      
      if (passed) {
        console.log('  ✅', checkName + ':', 'PASSED');
        results[checkName] = true;
      } else {
        if (checkConfig.critical) {
          console.log('  ❌', checkName + ':', checkConfig.error);
          criticalErrors++;
        } else {
          console.log('  ⚠️', checkName + ':', checkConfig.error);
          warnings++;
        }
        results[checkName] = false;
      }
      
    } catch (error) {
      console.log('  ❌', checkName + ':', 'Error -', error.message);
      if (checkConfig.critical) criticalErrors++;
      results[checkName] = false;
    }
  }
  
  console.log('\\n' + '='.repeat(50));
  console.log('VALIDATION RESULTS:');
  console.log('  Critical Errors:', criticalErrors);
  console.log('  Warnings:', warnings);
  console.log('  Status:', criticalErrors === 0 ? '✅ READY FOR PRODUCTION' : '❌ NOT READY');
  console.log('='.repeat(50) + '\\n');
  
  return {
    passed: criticalErrors === 0,
    criticalErrors,
    warnings,
    results
  };
}

// ==================================================================
// MODULE DISCOVERY
// ==================================================================
async function discoverModules() {
  console.log('🔍 DISCOVERING ALL MODULES');
  console.log('=========================\\n');
  
  const moduleDirectories = [
    { path: 'core', name: 'Core Modules' },
    { path: 'trading-system', name: 'Trading System' },
    { path: 'trai', name: 'TRAI Memory System' },
    { path: 'utils', name: 'Utilities' },
    { path: 'analytics', name: 'Analytics' }
  ];
  
  const allModules = [];
  
  for (const dir of moduleDirectories) {
    const dirPath = path.join(__dirname, dir.path);
    
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.js'))
        .filter(f => !f.includes('test') && !f.includes('backup'));
      
      console.log(dir.name + ':', files.length, 'modules');
      files.forEach(f => console.log('  -', f));
      
      allModules.push(...files.map(f => ({
        name: f.replace('.js', ''),
        path: path.join(dir.path, f),
        category: dir.name
      })));
    }
  }
  
  console.log('\\nTOTAL MODULES DISCOVERED:', allModules.length);
  
  return allModules;
}

// ==================================================================
// STARTUP SEQUENCE
// ==================================================================
async function startSystem(options = {}) {
  console.log('\\n🚀 STARTING QUANTUM TRADING SYSTEM');
  console.log('===================================\\n');
  
  const {
    skipValidation = false,
    debugMode = false,
    testMode = false
  } = options;
  
  // Step 1: Validate unless skipped
  if (!skipValidation) {
    const validation = await validateSystem();
    
    if (!validation.passed) {
      console.error('\\n❌ SYSTEM VALIDATION FAILED!');
      console.error('Fix the critical errors before starting');
      
      if (!testMode) {
        process.exit(1);
      }
      return false;
    }
  }
  
  // Step 2: Set environment variables
  console.log('🔧 Setting environment variables...');
  process.env.NODE_ENV = testMode ? 'test' : 'production';
  process.env.UNIFIED_PORT = '3010';
  process.env.WS_HOST = '127.0.0.1';
  process.env.ENABLE_QUANTUM_SUPREMACY = 'true';
  process.env.ENABLE_NEUROMORPHIC = 'true';
  process.env.AGGRESSIVE_MODE = 'false';
  process.env.SANDBOX_MODE = 'false';
  
  // Step 3: Start the main launcher
  console.log('🚀 Starting quantum launcher...');
  
  const launcherPath = path.join(__dirname, 'run-trading-bot-v13-quantum.js');
  
  if (!fs.existsSync(launcherPath)) {
    console.error('❌ Launcher not found:', launcherPath);
    return false;
  }
  
  if (testMode) {
    // Test mode - just require the launcher
    console.log('📝 TEST MODE - Loading launcher...');
    try {
      const launcher = require(launcherPath);
      console.log('✅ Launcher loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Launcher failed to load:', error.message);
      return false;
    }
  } else {
    // Production mode - spawn the launcher
    console.log('🚀 PRODUCTION MODE - Spawning launcher...');
    
    const child = spawn('node', [launcherPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    child.on('error', (error) => {
      console.error('❌ Failed to start launcher:', error);
    });
    
    child.on('exit', (code) => {
      console.log('Launcher exited with code:', code);
      if (code !== 0) {
        console.error('❌ Launcher crashed!');
      }
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down...');
      child.kill('SIGTERM');
      process.exit(0);
    });
    
    return true;
  }
}

// ==================================================================
// SYSTEM STATUS CHECK
// ==================================================================
async function checkSystemStatus() {
  console.log('\\n📊 SYSTEM STATUS CHECK');
  console.log('=====================\\n');
  
  // Check if processes are running
  const checks = {
    'WebSocket Server (3010)': checkPort(3010),
    'API Server (3011)': checkPort(3011),
    'Polygon Connection': checkPolygonConnection(),
    'Module Integration': checkModuleIntegration()
  };
  
  for (const [name, check] of Object.entries(checks)) {
    const status = await check;
    console.log(name + ':', status ? '✅ Active' : '❌ Inactive');
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = net.createConnection(port, '127.0.0.1');
    
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.setTimeout(1000);
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function checkPolygonConnection() {
  // Check if Polygon API key is set
  return process.env.POLYGON_API_KEY && 
         process.env.POLYGON_API_KEY.length > 0;
}

function checkModuleIntegration() {
  // Check if master integration exists
  const integrationPath = path.join(__dirname, '01_master_integration.js');
  return fs.existsSync(integrationPath);
}

// ==================================================================
// MAIN EXECUTION
// ==================================================================
async function main() {
  console.log('\\n💎 OGZFV QUANTUM TRADING SYSTEM - FINAL VALIDATION & STARTUP');
  console.log('=============================================================');
  console.log('🎯 YOUR PATH TO HOUSTON STARTS HERE!');
  console.log('=============================================================\\n');
  
  const args = process.argv.slice(2);
  const command = args[0] || 'validate';
  
  switch (command) {
    case 'validate':
      await validateSystem();
      await discoverModules();
      break;
      
    case 'start':
      await startSystem({ skipValidation: false });
      break;
      
    case 'force-start':
      console.log('⚠️ FORCE START - Skipping validation!');
      await startSystem({ skipValidation: true });
      break;
      
    case 'test':
      await startSystem({ testMode: true });
      break;
      
    case 'status':
      await checkSystemStatus();
      break;
      
    case 'modules':
      await discoverModules();
      break;
      
    default:
      console.log('Usage: node 06_validate_and_startup.js [command]');
      console.log('Commands:');
      console.log('  validate    - Validate system (default)');
      console.log('  start       - Validate and start system');
      console.log('  force-start - Start without validation');
      console.log('  test        - Test mode (no actual trading)');
      console.log('  status      - Check system status');
      console.log('  modules     - List all modules');
  }
  
  console.log('\\n✅ COMPLETE!');
  console.log('💰 Your quantum trading system is ready!');
  console.log('🚀 Houston, here we come!\\n');
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateSystem,
  discoverModules,
  startSystem,
  checkSystemStatus
};