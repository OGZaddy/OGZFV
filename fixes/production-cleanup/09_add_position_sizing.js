// Target: UnifiedTradingCore.js
// ADD this method to the class:

calculatePositionSize(data, accountBalance) {
  const tier = this.tier;
  const volatility = data.volatility || 0.02;
  
  // Tier-based sizing
  if (tier === 'tier1' || tier === 'tier2') {
    // Volatility-based for basic tiers
    const baseSize = accountBalance * 0.05;
    const volMultiplier = 1 / (1 + volatility * 10);
    return {
      size: baseSize * volMultiplier,
      units: (baseSize * volMultiplier) / data.price
    };
  } else {
    // Quantum sizing for elite/quantum tiers
    const baseSize = accountBalance * 0.08;
    // Add your quantum factors here
    return {
      size: baseSize,
      units: baseSize / data.price
    };
  }
}

// CALL it in processMarketData before executing:
const position = this.calculatePositionSize(data, this.accountBalance);