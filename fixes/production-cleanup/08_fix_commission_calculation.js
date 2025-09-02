// Target: Wherever commission is calculated (UnifiedTradingCore, ExecutionLayer, etc.)

// FIND any line like:
// commission: data.price * 0.001
// OR commission = price * 0.001

// REPLACE with:
calculateCommission(price, quantity) {
  // Your 1.2% total overhead as you specified
  const totalOverhead = 0.012;
  return (price * quantity) * totalOverhead;
}

// Usage:
const commission = this.calculateCommission(data.price, positionSize.units);