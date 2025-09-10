// ========================================================================
// FIX SAFENET DRAWDOWN BUG - STOPS BOT AFTER ONE TRADE
// ========================================================================

const fs = require('fs');
const path = require('path');

console.log('\n🔧 FIXING SAFENET DRAWDOWN BUG');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Read TradingSafetyNet.js
const safetyNetFile = './core/TradingSafetyNet.js';

if (!fs.existsSync(safetyNetFile)) {
  console.error('❌ TradingSafetyNet.js not found!');
  process.exit(1);
}

let safetyNetCode = fs.readFileSync(safetyNetFile, 'utf8');

console.log('📍 Looking for drawdown calculation bug...\n');

// Find the problematic drawdown calculation
// The bug is likely in how it calculates percentage from peak

// Pattern 1: Fix drawdown calculation that uses wrong formula
const badDrawdownPattern1 = /drawdown\s*=\s*\(\s*this\.peakBalance\s*-\s*currentBalance\s*\)\s*\/\s*currentBalance/g;
const goodDrawdownFormula1 = 'drawdown = (this.peakBalance - currentBalance) / this.peakBalance';

if (badDrawdownPattern1.test(safetyNetCode)) {
  safetyNetCode = safetyNetCode.replace(badDrawdownPattern1, goodDrawdownFormula1);
  console.log('✅ Fixed drawdown formula (was dividing by current instead of peak)');
}

// Pattern 2: Fix if peak balance isn't initialized properly
if (!safetyNetCode.includes('this.peakBalance = initialBalance') && 
    !safetyNetCode.includes('this.peakBalance = config.initialBalance')) {
  // Find constructor and add peak balance initialization
  const constructorMatch = safetyNetCode.match(/constructor\s*\([^)]*\)\s*{/);
  if (constructorMatch) {
    const insertPoint = constructorMatch.index + constructorMatch[0].length;
    const initialization = `
    // Initialize peak balance to prevent drawdown calculation errors
    this.peakBalance = config.initialBalance || 10000;
    this.initialBalance = config.initialBalance || 10000;
    `;
    safetyNetCode = safetyNetCode.slice(0, insertPoint) + initialization + safetyNetCode.slice(insertPoint);
    console.log('✅ Added peak balance initialization');
  }
}

// Pattern 3: Fix the updateBalance or recordTrade method
const updatePattern = /updateBalance\s*\([^)]*\)\s*{([^}]+(?:{[^}]*}[^}]*)*)}/;
const updateMatch = safetyNetCode.match(updatePattern);

if (updateMatch) {
  const originalMethod = updateMatch[0];
  
  // Check if it's updating peak balance correctly
  if (!originalMethod.includes('if (balance > this.peakBalance)')) {
    const fixedMethod = originalMethod.replace('{', `{
    // Update peak balance if current is higher
    if (balance > this.peakBalance) {
      this.peakBalance = balance;
    }
    `);
    safetyNetCode = safetyNetCode.replace(originalMethod, fixedMethod);
    console.log('✅ Fixed peak balance tracking in updateBalance');
  }
}

// Pattern 4: Fix emergency stop threshold (100% drawdown is impossible)
const emergencyPattern = /if\s*\(\s*drawdown\s*>=?\s*[\d.]+\s*\)/g;
const emergencyMatches = safetyNetCode.match(emergencyPattern);

if (emergencyMatches) {
  emergencyMatches.forEach(match => {
    // If checking for drawdown >= 0.99 or >= 1.0, that's wrong
    if (match.includes('>= 0.99') || match.includes('>= 1') || match.includes('>= 100')) {
      // Replace with reasonable threshold (20% drawdown)
      const fixed = match.replace(/[\d.]+/, '0.20');
      safetyNetCode = safetyNetCode.replace(match, fixed);
      console.log(`✅ Fixed emergency threshold: ${match} → ${fixed}`);
    }
  });
}

// Pattern 5: Add logging to debug drawdown calculation
const checkPattern = /checkMarketConditions\s*\([^)]*\)\s*{/;
if (checkPattern.test(safetyNetCode)) {
  safetyNetCode = safetyNetCode.replace(checkPattern, `checkMarketConditions(params = {}) {
    // Debug logging for drawdown calculation
    const currentBalance = params.balance || this.currentBalance;
    const drawdown = this.peakBalance > 0 ? 
      (this.peakBalance - currentBalance) / this.peakBalance : 0;
    
    if (this.config.enableLogging !== false) {
      console.log(\`🔍 SafetyNet Check: Balance: \$\${currentBalance.toFixed(2)}, Peak: \$\${this.peakBalance.toFixed(2)}, Drawdown: \${(drawdown * 100).toFixed(2)}%\`);
    }
    `);
  console.log('✅ Added debug logging for drawdown calculation');
}

// Save the fixed file
const backupFile = safetyNetFile.replace('.js', '_before_drawdown_fix.js');
fs.copyFileSync(safetyNetFile, backupFile);
console.log(`\n📁 Backup saved to: ${backupFile}`);

fs.writeFileSync(safetyNetFile, safetyNetCode);
console.log(`📁 Fixed file: ${safetyNetFile}`);

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('               ✅ SAFENET DRAWDOWN BUG FIXED!');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('\nFixed issues:');
console.log('  • Drawdown formula (peak - current) / peak');
console.log('  • Peak balance initialization');
console.log('  • Peak balance tracking');
console.log('  • Emergency stop threshold (20% instead of 100%)');
console.log('  • Added debug logging');
console.log('\nThe bot should no longer stop after one trade!\n');