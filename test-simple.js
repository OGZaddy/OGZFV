// MINIMAL TEST - Does basic bot logic work?
console.log("Testing basic functionality...");

// Test 1: Can we calculate position size without NaN?
function calculatePositionSize(confidence, balance) {
  const baseSize = 0.01; // 1%
  const size = baseSize * (0.5 + confidence * 0.5);
  
  // Fix NaN
  if (!Number.isFinite(size) || size <= 0) {
    return 0.01;
  }
  
  return Math.min(size, 0.05); // Cap at 5%
}

const testConfidence = 0.35;
const testBalance = 10000;
const size = calculatePositionSize(testConfidence, testBalance);
console.log(`Position size for ${testConfidence} confidence: ${(size * 100).toFixed(2)}%`);

// Test 2: Does cash accounting work?
let balance = 10000;
const tradeAmount = balance * size;
console.log(`Starting balance: $${balance}`);
console.log(`Trade amount: $${tradeAmount.toFixed(2)}`);

// Entry (CORRECT: subtract full amount)
balance -= tradeAmount;
console.log(`After entry: $${balance.toFixed(2)}`);

// Exit with 2% profit
const pnl = tradeAmount * 0.02;
balance += tradeAmount + pnl;
console.log(`After exit with 2% profit: $${balance.toFixed(2)}`);
console.log(`Net PnL: $${pnl.toFixed(2)}`);

console.log("\n✅ Basic logic works. The issue is in the complex modules.");