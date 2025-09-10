// ========================================================================
// 🔍 OGZ PRIME SYSTEM AUDIT - WHAT'S ACTUALLY CONNECTED?
// ========================================================================
// This script audits your entire bot to see:
// 1. Which modules are imported
// 2. Which modules are actually initialized
// 3. Which modules are ACTUALLY USED in trading decisions
// 4. Which modules are just dead weight
// ========================================================================

const fs = require('fs');
const path = require('path');

class SystemAuditor {
  constructor() {
    console.log('\n🔍 OGZ PRIME COMPLETE SYSTEM AUDIT');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('Finding what\'s REAL vs what\'s FAKE in your bot...');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    this.modules = {
      imported: new Set(),
      initialized: new Set(),
      used: new Set(),
      unused: new Set()
    };

    this.connections = {
      tradingBrain: [],
      riskManager: [],
      patternRecognition: [],
      indicators: [],
      profitManager: [],
      safetyNet: [],
      performanceAnalyzer: [],
      quantumSizer: [],
      multiDirectional: [],
      other: []
    };

    this.tradingFlow = {
      dataSource: null,
      indicatorCalculation: [],
      patternDetection: [],
      confidenceCalculation: [],
      riskAssessment: [],
      positionSizing: [],
      entryLogic: [],
      exitLogic: [],
      profitManagement: []
    };
  }

  /**
   * Audit the main bot file
   */
  async auditMainBot() {
    console.log('📂 Auditing main bot files...\n');

    // Check which main file exists
    const mainFiles = [
      'run-trading-bot-v13-simplified.js',
      'run-trading-bot-v13.js',
      'index.js',
      'main.js'
    ];

    let mainFile = null;
    for (const file of mainFiles) {
      if (fs.existsSync(file)) {
        mainFile = file;
        break;
      }
    }

    if (!mainFile) {
      console.error('❌ No main bot file found!');
      return;
    }

    console.log(`📄 Found main file: ${mainFile}\n`);
    const content = fs.readFileSync(mainFile, 'utf8');

    // Find all imports/requires
    this.findImports(content);
    
    // Find all initializations
    this.findInitializations(content);
    
    // Find actual usage in trading logic
    this.findUsageInTradingLogic(content);
    
    // Trace the trading flow
    this.traceTradingFlow(content);
  }

  /**
   * Find all imported modules
   */
  findImports(content) {
    console.log('🔍 FINDING IMPORTED MODULES:');
    console.log('─────────────────────────────');

    // Find require statements
    const requirePattern = /(?:const|let|var)\s+(?:{[^}]+}|\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
    let match;
    
    while ((match = requirePattern.exec(content)) !== null) {
      const modulePath = match[1];
      if (modulePath.startsWith('./')) {
        const moduleName = path.basename(modulePath, '.js');
        this.modules.imported.add(moduleName);
        console.log(`  ✅ Imported: ${moduleName}`);
      }
    }

    console.log(`\n📦 Total imported modules: ${this.modules.imported.size}\n`);
  }

  /**
   * Find initialized modules (with 'new' keyword)
   */
  findInitializations(content) {
    console.log('🔨 FINDING INITIALIZED MODULES:');
    console.log('─────────────────────────────');

    // Common module patterns
    const modulePatterns = [
      /this\.(\w+)\s*=\s*new\s+(\w+)/g,
      /const\s+(\w+)\s*=\s*new\s+(\w+)/g,
      /let\s+(\w+)\s*=\s*new\s+(\w+)/g
    ];

    const initialized = new Set();

    modulePatterns.forEach(pattern => {
      let match;
      const contentCopy = content;
      while ((match = pattern.exec(contentCopy)) !== null) {
        const varName = match[1];
        const className = match[2];
        initialized.add(`${varName} = new ${className}`);
        this.modules.initialized.add(className);
      }
    });

    initialized.forEach(init => {
      console.log(`  ✅ ${init}`);
    });

    console.log(`\n🔧 Total initialized: ${this.modules.initialized.size}\n`);
  }

  /**
   * Find what's actually USED in trading logic
   */
  findUsageInTradingLogic(content) {
    console.log('⚡ FINDING ACTUAL USAGE IN TRADING:');
    console.log('────────────────────────────────────');

    // Key trading method patterns
    const tradingMethods = [
      'performTradingCycle',
      'executeTrade',
      'openPosition',
      'closePosition',
      'calculateConfidence',
      'calculatePositionSize',
      'managePosition',
      'updateTrailingStops'
    ];

    // Extract each trading method's content
    tradingMethods.forEach(methodName => {
      const methodRegex = new RegExp(`${methodName}[^{]*{([^}]+(?:{[^}]*}[^}]*)*)}`,'s');
      const match = content.match(methodRegex);
      
      if (match) {
        const methodContent = match[1];
        console.log(`\n  📍 In ${methodName}():`);
        
        // Check for module usage
        this.checkModuleUsage(methodContent, methodName);
      }
    });

    console.log(`\n🎯 Modules actually used: ${this.modules.used.size}\n`);
  }

  /**
   * Check which modules are used in a method
   */
  checkModuleUsage(methodContent, methodName) {
    const moduleChecks = {
      'tradingBrain': /this\.tradingBrain\./g,
      'riskManager': /this\.riskManager\./g,
      'profitManager': /this\.profitManager\./g,
      'safetyNet': /this\.safetyNet\./g,
      'quantumSizer': /this\.quantumSizer\./g,
      'performanceAnalyzer': /this\.performanceAnalyzer\./g,
      'multiDirectionalTrader': /this\.multiDirectionalTrader\./g,
      'patternRecognition': /this\.patternRecognition\./g,
      'correlationAnalyzer': /this\.correlationAnalyzer\./g,
      'polygonWS': /this\.polygonWS\./g,
      'timeFrameManager': /this\.timeFrameManager\./g,
      'performanceValidator': /this\.performanceValidator\./g,
      'performanceVisualizer': /this\.performanceVisualizer\./g
    };

    Object.entries(moduleChecks).forEach(([module, pattern]) => {
      if (pattern.test(methodContent)) {
        this.modules.used.add(module);
        console.log(`    ✅ Uses ${module}`);
        
        // Track connection
        if (!this.connections[module]) {
          this.connections[module] = [];
        }
        this.connections[module].push(methodName);
      }
    });
  }

  /**
   * Trace the complete trading flow
   */
  traceTradingFlow(content) {
    console.log('\n🔄 TRACING COMPLETE TRADING FLOW:');
    console.log('══════════════════════════════════════════════════');

    // 1. DATA SOURCE
    console.log('\n1️⃣ DATA SOURCE:');
    if (content.includes('getMarketData')) {
      if (content.includes('this.cachedMarketData')) {
        console.log('  ✅ WebSocket (cachedMarketData)');
        this.tradingFlow.dataSource = 'WebSocket';
      }
      if (content.includes('polygonWS')) {
        console.log('  ✅ Polygon WebSocket');
        this.tradingFlow.dataSource = 'Polygon';
      }
      if (content.includes('fetch') || content.includes('axios')) {
        console.log('  ✅ HTTP API calls');
      }
    }

    // 2. INDICATOR CALCULATION
    console.log('\n2️⃣ INDICATOR CALCULATION:');
    const indicators = ['RSI', 'MACD', 'EMA', 'Bollinger', 'ATR', 'Stochastic'];
    indicators.forEach(indicator => {
      if (content.includes(`calculate${indicator}`)) {
        console.log(`  ✅ ${indicator}`);
        this.tradingFlow.indicatorCalculation.push(indicator);
      }
    });

    // 3. PATTERN DETECTION
    console.log('\n3️⃣ PATTERN DETECTION:');
    if (content.includes('patternRecognition')) {
      console.log('  ✅ EnhancedPatternRecognition');
      this.tradingFlow.patternDetection.push('EnhancedPatternRecognition');
    }
    if (content.includes('analyzePatterns')) {
      console.log('  ✅ Pattern Analysis');
      this.tradingFlow.patternDetection.push('PatternAnalysis');
    }

    // 4. CONFIDENCE CALCULATION
    console.log('\n4️⃣ CONFIDENCE CALCULATION:');
    if (content.includes('calculateTradingConfidence')) {
      console.log('  ✅ calculateTradingConfidence()');
      
      // Check what affects confidence
      const confMethod = content.match(/calculateTradingConfidence[^}]+}/s);
      if (confMethod) {
        if (confMethod[0].includes('patternBonus')) {
          console.log('    • Pattern strength bonus');
        }
        if (confMethod[0].includes('volume')) {
          console.log('    • Volume confirmation');
        }
        if (confMethod[0].includes('volatility')) {
          console.log('    • Volatility adjustment');
        }
        if (confMethod[0].includes('RSI')) {
          console.log('    • RSI confirmation');
        }
      }
    }

    // 5. RISK ASSESSMENT
    console.log('\n5️⃣ RISK ASSESSMENT:');
    if (content.includes('riskManager.assessTradeRisk')) {
      console.log('  ✅ RiskManager.assessTradeRisk()');
      this.tradingFlow.riskAssessment.push('RiskManager');
    }
    if (content.includes('safetyNet.checkMarketConditions')) {
      console.log('  ✅ TradingSafetyNet.checkMarketConditions()');
      this.tradingFlow.riskAssessment.push('TradingSafetyNet');
    }

    // 6. POSITION SIZING
    console.log('\n6️⃣ POSITION SIZING:');
    if (content.includes('quantumSizer.calculateOptimalPosition')) {
      console.log('  ✅ QuantumPositionSizer');
      this.tradingFlow.positionSizing.push('QuantumPositionSizer');
    }
    if (content.includes('calculatePositionSize')) {
      console.log('  ✅ calculatePositionSize()');
      this.tradingFlow.positionSizing.push('Basic calculation');
    }

    // 7. ENTRY LOGIC
    console.log('\n7️⃣ ENTRY LOGIC:');
    if (content.includes('tradingBrain.openPosition')) {
      console.log('  ✅ OptimizedTradingBrain.openPosition()');
      this.tradingFlow.entryLogic.push('TradingBrain');
    }
    if (content.includes('multiDirectionalTrader.evaluateTrade')) {
      console.log('  ✅ MultiDirectionalTrader.evaluateTrade()');
      this.tradingFlow.entryLogic.push('MultiDirectional');
    }

    // 8. EXIT LOGIC
    console.log('\n8️⃣ EXIT LOGIC:');
    if (content.includes('updateTrailingStops')) {
      console.log('  ✅ Trailing Stops');
      this.tradingFlow.exitLogic.push('TrailingStops');
    }
    if (content.includes('tradingBrain.managePosition')) {
      console.log('  ✅ TradingBrain.managePosition()');
      this.tradingFlow.exitLogic.push('TradingBrain');
    }
    if (content.includes('profitManager')) {
      console.log('  ✅ MaxProfitManager');
      this.tradingFlow.exitLogic.push('MaxProfitManager');
    }
  }

  /**
   * Audit core modules directory
   */
  async auditCoreModules() {
    console.log('\n📂 AUDITING CORE MODULES DIRECTORY:');
    console.log('════════════════════════════════════════');

    const coreDir = './core';
    if (!fs.existsSync(coreDir)) {
      console.error('❌ Core directory not found!');
      return;
    }

    const files = fs.readdirSync(coreDir).filter(f => f.endsWith('.js'));
    const moduleInfo = {};

    files.forEach(file => {
      const filePath = path.join(coreDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      const size = (fs.statSync(filePath).size / 1024).toFixed(1);
      
      // Check if module exports a class
      const hasClass = /class\s+\w+/.test(content);
      const hasExports = /module\.exports/.test(content);
      
      // Check for key trading methods
      const hasTradingLogic = /(?:executeTrade|openPosition|closePosition|calculateSignal)/.test(content);
      
      moduleInfo[file] = {
        lines,
        size: `${size}KB`,
        hasClass,
        hasExports,
        hasTradingLogic,
        isUsed: this.modules.used.has(path.basename(file, '.js'))
      };
    });

    // Display module status
    console.log('\n📊 MODULE STATUS:');
    console.log('─────────────────────────────────────────────────────');
    console.log('Module Name                    | Lines | Size  | Used?');
    console.log('─────────────────────────────────────────────────────');
    
    Object.entries(moduleInfo).forEach(([file, info]) => {
      const status = info.isUsed ? '✅ YES' : '❌ NO ';
      const name = file.padEnd(30);
      const lines = info.lines.toString().padEnd(5);
      const size = info.size.padEnd(6);
      console.log(`${name} | ${lines} | ${size}| ${status}`);
    });
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('                    🔥 AUDIT REPORT 🔥');
    console.log('═══════════════════════════════════════════════════════════════════');

    // Calculate unused modules
    this.modules.imported.forEach(module => {
      if (!this.modules.used.has(module)) {
        this.modules.unused.add(module);
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log(`  • Modules Imported:    ${this.modules.imported.size}`);
    console.log(`  • Modules Initialized: ${this.modules.initialized.size}`);
    console.log(`  • Modules USED:        ${this.modules.used.size}`);
    console.log(`  • Modules UNUSED:      ${this.modules.unused.size}`);

    if (this.modules.unused.size > 0) {
      console.log('\n❌ UNUSED MODULES (dead weight):');
      this.modules.unused.forEach(module => {
        console.log(`  • ${module}`);
      });
    }

    console.log('\n✅ ACTIVELY USED MODULES:');
    this.modules.used.forEach(module => {
      const connections = this.connections[module] || [];
      console.log(`  • ${module}`);
      if (connections.length > 0) {
        console.log(`    └─ Used in: ${connections.join(', ')}`);
      }
    });

    console.log('\n🔄 TRADING FLOW:');
    console.log(`  1. Data: ${this.tradingFlow.dataSource || 'UNKNOWN'}`);
    console.log(`  2. Indicators: ${this.tradingFlow.indicatorCalculation.join(', ') || 'NONE'}`);
    console.log(`  3. Patterns: ${this.tradingFlow.patternDetection.join(', ') || 'NONE'}`);
    console.log(`  4. Risk Check: ${this.tradingFlow.riskAssessment.join(', ') || 'NONE'}`);
    console.log(`  5. Position Size: ${this.tradingFlow.positionSizing.join(', ') || 'NONE'}`);
    console.log(`  6. Entry: ${this.tradingFlow.entryLogic.join(', ') || 'NONE'}`);
    console.log(`  7. Exit: ${this.tradingFlow.exitLogic.join(', ') || 'NONE'}`);

    console.log('\n⚠️ CRITICAL FINDINGS:');
    
    // Check for missing critical components
    const criticalModules = ['RiskManager', 'TradingBrain', 'PatternRecognition'];
    criticalModules.forEach(module => {
      if (!this.modules.used.has(module.toLowerCase())) {
        console.log(`  ❌ ${module} is NOT connected to trading flow!`);
      }
    });

    if (this.tradingFlow.indicatorCalculation.length === 0) {
      console.log('  ❌ No technical indicators being calculated!');
    }

    if (this.tradingFlow.riskAssessment.length === 0) {
      console.log('  ❌ No risk assessment before trades!');
    }

    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('  1. Remove unused modules to reduce complexity');
    console.log('  2. Connect RiskManager if not already connected');
    console.log('  3. Ensure all indicators are being calculated');
    console.log('  4. Verify pattern recognition is feeding into confidence');
    console.log('  5. Check that all safety systems are active');

    console.log('\n═══════════════════════════════════════════════════════════════════\n');
  }

  /**
   * Save audit results to file
   */
  saveAuditResults() {
    const results = {
      timestamp: new Date().toISOString(),
      modules: {
        imported: Array.from(this.modules.imported),
        initialized: Array.from(this.modules.initialized),
        used: Array.from(this.modules.used),
        unused: Array.from(this.modules.unused)
      },
      connections: this.connections,
      tradingFlow: this.tradingFlow
    };

    fs.writeFileSync('system-audit-results.json', JSON.stringify(results, null, 2));
    console.log('📁 Audit results saved to: system-audit-results.json\n');
  }
}

// ========================================================================
// 🚀 RUN THE AUDIT
// ========================================================================

async function main() {
  const auditor = new SystemAuditor();
  
  // Audit main bot file
  await auditor.auditMainBot();
  
  // Audit core modules
  await auditor.auditCoreModules();
  
  // Generate report
  auditor.generateReport();
  
  // Save results
  auditor.saveAuditResults();
  
  console.log('✅ AUDIT COMPLETE - Now you know what\'s REAL vs FAKE in your bot!\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SystemAuditor };