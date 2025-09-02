// Target: UnifiedTradingCore.js
// Remove random slippage calculation

// REPLACE calculateSlippage method with:
calculateSlippage(data) {
  const volatility = data.volatility || 0.001;
  // Deterministic slippage based on volatility only
  // Always costs money (positive value)
  return data.price * volatility * 0.5; // Fixed 50% of volatility as slippage
}

// ENSURE mode enforcement in constructor:
constructor(profile) {
  // ... existing code ...
  
  if (process.env.NODE_ENV === 'production' && this.mode !== 'LIVE') {
    throw new Error('Production must use LIVE mode only');
  }
}