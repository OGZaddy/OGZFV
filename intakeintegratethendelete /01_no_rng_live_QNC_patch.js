// Target: core/QuantumNeuromorphicCore.js
// Remove RNG from quantumNeuromorphicHybridDecision (LIVE).

function deterministicHybridDecision(marketData) {
  const stream = Array.isArray(marketData?.priceStream) ? marketData.priceStream : [];
  if (!marketData || stream.length < 2) {
    return { action: 'HOLD', confidence: 0, mode: 'INSUFFICIENT_DATA' };
  }
  const price = marketData.price ?? stream.at(-1);
  const prev  = stream.at(-2);
  const action = price > prev ? 'BUY' : price < prev ? 'SELL' : 'HOLD';
  const conf   = Math.min(0.99, Math.abs((price - prev) / Math.max(Math.abs(prev), 1e-9)));
  return { action, confidence: action === 'HOLD' ? 0 : conf, mode: 'DETERMINISTIC' };
}
// Integrator: replace random-based blocks with the function above.
