# SafetyNet NaN Bug Analysis - Claude Code Session
**Date**: 2025-01-15
**Author**: Claude Code (CC)
**Status**: DIAGNOSED - Ready to Fix

## 🔍 PROBLEM IDENTIFIED
SafetyNet blocking ALL trades with "Position size NaN% exceeds limit 20.0%"

## ROOT CAUSE
The `calculatePositionSize()` function in backtest-v13-production.js is returning NaN or undefined in certain conditions, which then gets passed to SafetyNet's validation.

## WHERE IT HAPPENS
```javascript
// backtest-v13-production.js:583-589
const safetyCheck = this.safetyNet.validateTrade({
  symbol: 'BTC-USD',
  direction: tradeDirection === 'long' ? 'BUY' : 'SELL',
  size: this.calculatePositionSize(confidence, marketData),  // <-- Returns NaN
  price: marketData.price,
  confidence: confidence
}, marketData);
```

## THE CHAIN OF FAILURE
1. `calculatePositionSize()` returns NaN (likely when quantumSizer isn't initialized properly)
2. SafetyNet receives `size: NaN`
3. `checkPositionSize()` tries to compare NaN <= maxPositionSize (always false)
4. Trade gets blocked with "Position size NaN%"

## QUICK FIX OPTIONS

### Option 1: Add NaN Guard in calculatePositionSize
```javascript
calculatePositionSize(confidence, marketData) {
  let size;
  
  if (this.quantumSizer) {
    size = this.quantumSizer.calculateOptimalPosition(...);
  } else {
    size = /* fallback calculation */;
  }
  
  // Guard against NaN
  if (isNaN(size) || size === undefined || size === null) {
    size = this.config.defaultPositionSize || 0.01; // 1% default
  }
  
  return size;
}
```

### Option 2: Add SafetyNet Bypass (IMMEDIATE)
In .env:
```
SAFETYNET_BYPASS=true
```

Then restart:
```bash
pm2 restart clean-trading --update-env
```

### Option 3: Fix in SafetyNet
```javascript
checkPositionSize(tradeRequest) {
  let positionSize = tradeRequest.size || 0;
  
  // Fix NaN issues
  if (isNaN(positionSize)) {
    positionSize = 0.01; // Default to 1%
  }
  
  return {
    passed: positionSize <= this.config.maxPositionSize,
    code: 'POSITION_SIZE',
    reason: `Position size ${(positionSize * 100).toFixed(1)}% exceeds limit`
  };
}
```

## VERIFICATION
After fix, run:
```bash
npm run backtest:quick -- --file=data/btc-5m-sept2024.json --limit=100
```

Should see trades executing, not "Position size NaN%" blocks.

## FOR NEXT SESSION
1. Check if quantumSizer is being initialized properly
2. Add defensive NaN checks in all position size calculations
3. Consider making SafetyNet more forgiving of calculation errors