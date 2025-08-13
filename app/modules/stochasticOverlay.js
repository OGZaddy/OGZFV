// 📊 STOCHASTIC OSCILLATOR MODULE - PRECISION SIGNALS
// Momentum indicator for perfect entries and exits

window.updateStochasticDisplay = function(stochastic, signal) {
  const elem = document.getElementById('stochastic-display');
  if (!elem) return;

  // Parse values
  const k = parseFloat(stochastic || 0).toFixed(1);
  const d = parseFloat(signal || stochastic || 0).toFixed(1);
  const diff = (k - d).toFixed(1);

  // Clear and update
  elem.innerHTML = 'Stochastic: ';
  
  const span = document.createElement('span');
  span.style.fontWeight = 'bold';
  span.style.transition = 'all 0.3s ease';
  
  // Determine market condition
  let condition = '';
  let color = '';
  let signal_strength = '';
  
  if (k > 80 && d > 80) {
    condition = 'OVERBOUGHT';
    color = '#ff3333';
    signal_strength = '⚠️';
  } else if (k < 20 && d < 20) {
    condition = 'OVERSOLD';
    color = '#00ff00';
    signal_strength = '🎯';
  } else if (k > d && diff > 5) {
    condition = 'BULLISH';
    color = '#00ff00';
    signal_strength = '📈';
  } else if (k < d && diff < -5) {
    condition = 'BEARISH';
    color = '#ff3333';
    signal_strength = '📉';
  } else {
    condition = 'NEUTRAL';
    color = '#ffff00';
    signal_strength = '➖';
  }
  
  // Format display
  span.textContent = `K:${k} D:${d} (${diff > 0 ? '+' : ''}${diff}) ${signal_strength} ${condition}`;
  span.style.color = color;
  
  // Add glow effect for extreme conditions
  if (k > 80 || k < 20) {
    span.style.textShadow = `0 0 10px ${color}`;
  }
  
  elem.appendChild(span);
  
  // Trigger alerts for extreme conditions
  if (k < 20 && window.stochasticLastValue > 20) {
    // Crossed into oversold
    if (window.showNotification) {
      window.showNotification('🎯 Stochastic OVERSOLD - Potential BUY signal!', 'info');
    }
  } else if (k > 80 && window.stochasticLastValue < 80) {
    // Crossed into overbought
    if (window.showNotification) {
      window.showNotification('⚠️ Stochastic OVERBOUGHT - Consider taking profits!', 'warning');
    }
  }
  
  // Store last value for crossover detection
  window.stochasticLastValue = k;
};

// Calculate stochastic if needed (backup calculation)
window.calculateStochastic = function(candles, period = 14) {
  if (!candles || candles.length < period) return { k: 50, d: 50 };
  
  const recent = candles.slice(-period);
  const highs = recent.map(c => c.high || c);
  const lows = recent.map(c => c.low || c);
  const close = candles[candles.length - 1].close || candles[candles.length - 1];
  
  const highest = Math.max(...highs);
  const lowest = Math.min(...lows);
  
  const k = highest !== lowest ? 
    ((close - lowest) / (highest - lowest)) * 100 : 50;
  
  // Simple 3-period SMA for %D
  const d = k; // Simplified for now
  
  return { k, d };
};

// Auto-initialize
window.stochasticLastValue = 50;

// Make it work with module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateStochasticDisplay, calculateStochastic };
}