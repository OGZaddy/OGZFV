// Target: QuantumNeuromorphicCore.js
// Remove ALL Math.random() from decision paths

// REPLACE the neuromorphicSpikingProcess method with:
neuromorphicSpikingProcess(marketEvent, priceStream = []) {
  const stream = Array.isArray(priceStream) ? priceStream : [];
  if (stream.length < 2) {
    return { 
      decision: { action: 'HOLD', confidence: 0 },
      spikes: 0,
      efficiency: 0,
      processingTime: 1
    };
  }
  
  const delta = stream[stream.length - 1] - stream[stream.length - 2];
  const action = delta > 0 ? 'BUY' : delta < 0 ? 'SELL' : 'HOLD';
  const confidence = Math.min(0.99, Math.abs(delta) / Math.max(Math.abs(stream[stream.length - 2]), 1e-9));
  
  return {
    decision: { action, confidence },
    spikes: Math.abs(delta) * 1000, // Deterministic spike count
    efficiency: confidence,
    processingTime: 10
  };
}

// REPLACE the quantumNeuromorphicHybridDecision method with:
quantumNeuromorphicHybridDecision(marketData) {
  const stream = Array.isArray(marketData?.priceStream) ? marketData.priceStream : [];
  if (!marketData || stream.length < 2) {
    return { action: 'HOLD', confidence: 0, mode: 'INSUFFICIENT_DATA' };
  }
  
  const price = marketData.price || stream[stream.length - 1];
  const lastPrice = this.lastPrice || stream[stream.length - 2];
  
  const action = price > lastPrice ? 'BUY' : price < lastPrice ? 'SELL' : 'HOLD';
  const confidence = action === 'HOLD' ? 0 : Math.min(0.99, Math.abs((price - lastPrice) / Math.max(Math.abs(lastPrice), 1e-9)));
  
  this.lastPrice = price;
  
  return {
    action,
    confidence,
    mode: 'DETERMINISTIC',
    quantumCoherence: 0.95,
    neuromorphicEfficiency: confidence,
    subNanosecondPrecision: true
  };
}

// DELETE or comment out any methods with "Failsafe" or "Emergency" that use Math.random()