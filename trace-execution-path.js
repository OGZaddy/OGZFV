// ========================================================================
// TRACE EXECUTION PATH - VERIFY REAL CONFIDENCE IS USED
// ========================================================================

const fs = require('fs');

console.log('\n🔍 TRACING EXECUTION PATH TO VERIFY CONFIDENCE');
console.log('═══════════════════════════════════════════════════════════════════\n');

const botFile = './run-trading-bot-v13-simplified.js';
const botCode = fs.readFileSync(botFile, 'utf8');

// Step 1: Find where trades actually happen
console.log('📍 Step 1: Finding trade execution path...\n');

// Find performTradingCycle
const cycleMatch = botCode.match(/async performTradingCycle\(\)[\s\S]*?^\s{2}\}/m);
if (cycleMatch) {
  const cycleCode = cycleMatch[0];
  console.log('Found performTradingCycle() method');
  
  // Check what confidence calculation it uses
  if (cycleCode.includes('const confidence = 0.65')) {
    console.log('❌ STILL USING HARDCODED 0.65 CONFIDENCE!');
  } else if (cycleCode.includes('calculateTradingConfidence')) {
    console.log('✅ Calls calculateTradingConfidence()');
    
    // Now check what calculateTradingConfidence does
    const calcMatch = botCode.match(/calculateTradingConfidence\([^)]*\)[\s\S]*?return[^;]+;/);
    if (calcMatch) {
      const calcCode = calcMatch[0];
      if (calcCode.includes('return 0.65')) {
        console.log('  ❌ But calculateTradingConfidence returns hardcoded 0.65!');
      } else if (calcCode.includes('calculateRealConfidence')) {
        console.log('  ✅ And it calls calculateRealConfidence()!');
      } else {
        console.log('  ⚠️ But calculateTradingConfidence has unknown logic');
        console.log('  Content:', calcCode.substring(0, 200));
      }
    }
  } else if (cycleCode.includes('calculateRealConfidence')) {
    console.log('✅ Directly calls calculateRealConfidence()');
  } else {
    console.log('⚠️ Unknown confidence calculation method');
  }
}

// Step 2: Find where the confidence affects trading
console.log('\n📍 Step 2: Finding where confidence affects trading decisions...\n');

// Look for confidence thresholds
const thresholdPattern = /if\s*\([^)]*confidence[^)]*>=?\s*[\d.]+[^)]*\)/g;
const thresholdMatches = botCode.match(thresholdPattern);

if (thresholdMatches) {
  console.log(`Found ${thresholdMatches.length} confidence threshold checks:`);
  thresholdMatches.slice(0, 5).forEach(match => {
    console.log(`  • ${match}`);
  });
}

// Step 3: Verify defensive modules are in path
console.log('\n📍 Step 3: Checking if defensive modules are in execution path...\n');

if (cycleMatch) {
  const cycleCode = cycleMatch[0];
  
  const hasRiskCheck = cycleCode.includes('riskManager.assessTradeRisk') || 
                       cycleCode.includes('this.riskManager');
  const hasSafetyCheck = cycleCode.includes('safetyNet.checkMarketConditions') || 
                         cycleCode.includes('this.safetyNet');
  
  console.log(`RiskManager in trading cycle: ${hasRiskCheck ? '✅ YES' : '❌ NO'}`);
  console.log(`SafetyNet in trading cycle: ${hasSafetyCheck ? '✅ YES' : '❌ NO'}`);
  
  if (!hasRiskCheck || !hasSafetyCheck) {
    console.log('\n⚠️ Defensive modules might be instantiated but not used in trading!');
  }
}

// Step 4: Create execution trace
console.log('\n📍 Step 4: Creating execution trace...\n');

const trace = [];

// Trace from start to trade
if (botCode.includes('setInterval')) {
  trace.push('1. setInterval() triggers every X seconds');
}
if (botCode.includes('performTradingCycle')) {
  trace.push('2. performTradingCycle() is called');
}
if (botCode.includes('getMarketData')) {
  trace.push('3. getMarketData() fetches prices');
}
if (botCode.includes('calculateIndicators')) {
  trace.push('4. calculateIndicators() computes RSI/MACD/etc');
}
if (botCode.includes('analyzePatterns')) {
  trace.push('5. analyzePatterns() looks for patterns');
}
if (botCode.includes('calculateTradingConfidence') || botCode.includes('calculateRealConfidence')) {
  trace.push('6. Confidence is calculated');
}
if (botCode.includes('riskManager.assessTradeRisk')) {
  trace.push('7. RiskManager assesses trade risk');
}
if (botCode.includes('safetyNet.checkMarketConditions')) {
  trace.push('8. SafetyNet checks market conditions');
}
if (botCode.includes('executeTrade')) {
  trace.push('9. executeTrade() places the order');
}

console.log('EXECUTION TRACE:');
trace.forEach(step => console.log(`  ${step}`));

// Summary
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                    VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Check for the critical issue
if (botCode.includes('const confidence = 0.65')) {
  console.log('🚨 CRITICAL: Hardcoded confidence STILL EXISTS!');
  console.log('   Run: node fix-hardcoded-confidence.js');
} else {
  console.log('✅ No hardcoded confidence = 0.65 found');
}

// Create a simple test
console.log('\n📝 Creating simple test to verify...\n');

const testCode = `
// Quick test to see what confidence is calculated
const bot = require('./run-trading-bot-v13-simplified.js');

// Mock market data
const testMarketData = {
  price: 50000,
  rsi: 30,  // Oversold
  macd: 0.5,
  trend: 'uptrend',
  volume: 100000
};

// Try to calculate confidence
try {
  const confidence = bot.calculateTradingConfidence ? 
    bot.calculateTradingConfidence(testMarketData) :
    bot.calculateRealConfidence ? 
      bot.calculateRealConfidence(testMarketData) : 
      'NO METHOD FOUND';
      
  console.log('Calculated confidence:', confidence);
  
  if (confidence === 0.65) {
    console.log('❌ STILL RETURNING HARDCODED 0.65!');
  } else if (typeof confidence === 'number') {
    console.log('✅ Returns dynamic value:', confidence);
  }
} catch (error) {
  console.log('Error testing confidence:', error.message);
}
`;

fs.writeFileSync('test-confidence.js', testCode);
console.log('Created test-confidence.js - Run it to verify confidence calculation');

console.log('\n🎯 Next: Run these commands:');
console.log('  1. node fix-hardcoded-confidence.js  (if hardcoded still exists)');
console.log('  2. node test-confidence.js           (to verify it works)');
console.log('');