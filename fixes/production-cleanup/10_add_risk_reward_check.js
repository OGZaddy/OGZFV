// Target: UnifiedTradingCore.js or ExecutionLayer.js
// ADD before executing any trade:

validateRiskReward(entry, target, stopLoss, quantity) {
  const potentialProfit = Math.abs(target - entry) * quantity;
  const potentialLoss = Math.abs(entry - stopLoss) * quantity;
  const ratio = potentialProfit / potentialLoss;
  
  if (ratio < 2.0) {
    console.log(`❌ R:R ratio ${ratio.toFixed(2)} below minimum 2.0`);
    return false;
  }
  
  console.log(`✅ R:R ratio ${ratio.toFixed(2)} acceptable`);
  return true;
}

// Usage in executeTrade:
const target = data.price * 1.06;  // 6% target
const stopLoss = data.price * 0.97; // 3% stop

if (!this.validateRiskReward(data.price, target, stopLoss, position.units)) {
  return { action: 'REJECTED', reason: 'Risk/Reward below 2:1' };
}