// Target: core/QuantumNeuromorphicCore.js
// Remove RNG from neuromorphicSpikingProcess (LIVE).

function deterministicSpikingProcess(priceStream = []) {
  const stream = Array.isArray(priceStream) ? priceStream : [];
  if (stream.length < 2) return { decision: { action: 'HOLD', confidence: 0 } };
  const d = stream.at(-1) - stream.at(-2);
  const action = d > 0 ? 'BUY' : d < 0 ? 'SELL' : 'HOLD';
  const confidence = Math.min(0.99, Math.abs(d) / Math.max(Math.abs(stream.at(-2)), 1e-9));
  return { decision: { action, confidence } };
}
// Integrator: return deterministicSpikingProcess(priceStream) in neuromorphicSpikingProcess.
