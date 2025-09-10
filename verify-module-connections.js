// ========================================================================
// VERIFY MODULE CONNECTIONS - ARE THEY REALLY IN THE EXECUTION PATH?
// ========================================================================

const fs = require('fs');

console.log('\n🔍 VERIFYING MODULE CONNECTIONS IN EXECUTION PATH');
console.log('═══════════════════════════════════════════════════════════════════\n');

const botFile = './run-trading-bot-v13-simplified.js';
const botCode = fs.readFileSync(botFile, 'utf8');

// Find the actual trading execution path
console.log('📍 Finding where trades are actually executed...\n');

// Method 1: Look for performTradingCycle
const performTradingCycleStart = botCode.indexOf('async performTradingCycle()');
let performTradingCycleEnd = -1;

if (performTradingCycleStart !== -1) {
  // Find the end of this method (matching closing brace)
  let braceCount = 0;
  let inMethod = false;
  
  for (let i = performTradingCycleStart; i < botCode.length; i++) {
    if (botCode[i] === '{') {
      braceCount++;
      inMethod = true;
    } else if (botCode[i] === '}' && inMethod) {
      braceCount--;
      if (braceCount === 0) {
        performTradingCycleEnd = i;
        break;
      }
    }
  }
  
  const tradingCycleCode = botCode.substring(performTradingCycleStart, performTradingCycleEnd + 1);
  
  console.log('MODULES IN performTradingCycle():');
  console.log('─────────────────────────────────');
  
  // Check each module
  const modules = {
    'RiskManager': ['this.riskManager', 'riskManager.assessTradeRisk', 'riskManager.shouldTrade'],
    'SafetyNet': ['this.safetyNet', 'safetyNet.checkMarketConditions', 'safetyNet.updateBalance'],
    'TradingBrain': ['this.tradingBrain', 'tradingBrain.processAnalysis', 'tradingBrain.openPosition'],
    'PatternRecognition': ['this.patternRecognition', 'patternRecognition.analyzePatterns'],
    'QuantumSizer': ['this.quantumSizer', 'quantumSizer.calculateOptimalPosition'],
    'ProfitManager': ['this.profitManager', 'profitManager.shouldTakeProfit'],
    'PerformanceAnalyzer': ['this.performanceAnalyzer', 'performanceAnalyzer.recordTrade']
  };
  
  Object.entries(modules).forEach(([moduleName, patterns]) => {
    const found = patterns.some(pattern => tradingCycleCode.includes(pattern));
    console.log(`  ${found ? '✅' : '❌'} ${moduleName}`);
    
    if (found) {
      // Show where it's used
      patterns.forEach(pattern => {
        if (tradingCycleCode.includes(pattern)) {
          const index = tradingCycleCode.indexOf(pattern);
          const context = tradingCycleCode.substring(Math.max(0, index - 30), Math.min(tradingCycleCode.length, index + 50));
          console.log(`      Found: ...${context.trim()}...`);
        }
      });
    }
  });
}

// Check if modules are instantiated in constructor
console.log('\n📍 Checking constructor initialization...\n');

const constructorMatch = botCode.match(/constructor\s*\([^)]*\)[\s\S]*?^\s{2}\}/m);
if (constructorMatch) {
  const constructorCode = constructorMatch[0];
  
  console.log('MODULES INITIALIZED IN CONSTRUCTOR:');
  console.log('───────────────────────────────────');
  
  const moduleInits = {
    'RiskManager': 'new RiskManager',
    'SafetyNet': 'new TradingSafetyNet',
    'TradingBrain': 'new OptimizedTradingBrain',
    'PatternRecognition': 'new EnhancedPatternRecognition',
    'QuantumSizer': 'new QuantumPositionSizer',
    'ProfitManager': 'new MaxProfitManager'
  };
  
  Object.entries(moduleInits).forEach(([moduleName, pattern]) => {
    const initialized = constructorCode.includes(pattern);
    console.log(`  ${initialized ? '✅' : '❌'} ${moduleName}`);
  });
}

// Find where executeTrade is called
console.log('\n📍 Checking executeTrade method...\n');

const executeTradeMatch = botCode.match(/async executeTrade\([^)]*\)[\s\S]*?^\s{2}\}/m);
if (executeTradeMatch) {
  const executeTradeCode = executeTradeMatch[0];
  
  console.log('DEFENSIVE CHECKS IN executeTrade():');
  console.log('───────────────────────────────────');
  
  const hasRiskCheck = executeTradeCode.includes('riskManager');
  const hasSafetyCheck = executeTradeCode.includes('safetyNet');
  
  console.log(`  ${hasRiskCheck ? '✅' : '❌'} RiskManager check before trade`);
  console.log(`  ${hasSafetyCheck ? '✅' : '❌'} SafetyNet check before trade`);
  
  if (!hasRiskCheck || !hasSafetyCheck) {
    console.log('\n⚠️ WARNING: Defensive modules might not be blocking trades!');
  }
}

// Create a fix if modules aren't connected
console.log('\n📝 Creating connection fix script...\n');

const fixScript = `// FIX MODULE CONNECTIONS
const fs = require('fs');
const botFile = './run-trading-bot-v13-simplified.js';
let botCode = fs.readFileSync(botFile, 'utf8');

console.log('Connecting defensive modules to trading cycle...');

// Find performTradingCycle and add defensive checks
const cyclePattern = /async performTradingCycle\\(\\)[\\s\\S]*?{/;
const cycleMatch = botCode.match(cyclePattern);

if (cycleMatch && !botCode.includes('this.riskManager.assessTradeRisk')) {
  const insertPoint = cycleMatch.index + cycleMatch[0].length;
  
  const defensiveCode = \`
    try {
      // Get market data
      const marketData = await this.getMarketData();
      if (!marketData) return;
      
      // Calculate indicators
      const analysis = await this.analyzeMarket(marketData);
      
      // Calculate REAL confidence
      const confidence = this.calculateRealConfidence ? 
        this.calculateRealConfidence(analysis) : 
        this.calculateTradingConfidence(analysis);
      
      // SAFETY CHECK FIRST
      if (this.safetyNet) {
        const safetyCheck = await this.safetyNet.checkMarketConditions({
          price: marketData.price,
          volume: marketData.volume,
          volatility: analysis.volatility || 0.02
        });
        
        if (!safetyCheck.approved) {
          console.log(\\\`🚫 SafetyNet blocked: \\\${safetyCheck.reason}\\\`);
          return;
        }
      }
      
      // RISK CHECK SECOND
      if (this.riskManager && confidence >= this.config.minTradeConfidence) {
        const riskCheck = this.riskManager.assessTradeRisk({
          confidence,
          marketConditions: analysis
        });
        
        if (!riskCheck.approved) {
          console.log(\\\`🚫 RiskManager blocked: \\\${riskCheck.reason}\\\`);
          return;
        }
        
        // If both checks pass, execute trade
        await this.executeTrade({
          ...analysis,
          confidence,
          approved: true
        });
      }
    } catch (error) {
      console.error('Trading cycle error:', error);
    }
  \`;
  
  // Replace the method content
  const methodEnd = botCode.indexOf('}', insertPoint);
  botCode = botCode.substring(0, insertPoint) + defensiveCode + '}' + botCode.substring(methodEnd + 1);
  
  fs.writeFileSync(botFile, botCode);
  console.log('✅ Connected defensive modules to trading cycle!');
} else if (botCode.includes('this.riskManager.assessTradeRisk')) {
  console.log('✅ Defensive modules already connected!');
} else {
  console.log('❌ Could not find performTradingCycle method');
}
`;

fs.writeFileSync('connect-defensive-modules.js', fixScript);
console.log('Created connect-defensive-modules.js');

// Summary
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                    CONNECTION SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('TO FIX ALL PROBLEMS:');
console.log('  1. node fix-safenet-drawdown.js      (fix emergency stop bug)');
console.log('  2. node fix-hardcoded-confidence.js  (remove fake confidence)');
console.log('  3. node connect-defensive-modules.js (wire up defenses)');
console.log('  4. node trace-execution-path.js      (verify everything)');
console.log('  5. node test-bot-system.js           (final test)');
console.log('');