// QUANTUM SIGNAL CLASSIFICATION WITH LOOP PREVENTION
// This modular fix prevents infinite HOLD loops while maintaining quantum edge

class QuantumSignalClassifier {
  constructor(config = {}) {
    // Track consecutive holds to prevent infinite loops
    this.holdCount = 0;
    this.maxHoldCount = config.maxHoldCount || 5;
    
    // Dynamic threshold based on market volatility
    this.dynamicHoldThreshold = config.dynamicHoldThreshold || true;
    
    // Market regime tracker
    this.marketRegime = 'neutral';
    this.lastSignalTimestamp = Date.now();
    
    // Signal history for entropy calculation
    this.signalHistory = [];
    this.maxHistorySize = 50;
  }

  /**
   * FIXED: Quantum Signal Classification with Loop Prevention
   */
  async classifyQuantumSignal(features, historicalData = [], quantumCore) {
    console.log('🌀⚛️ QUANTUM SIGNAL CLASSIFICATION WITH LOOP PREVENTION...');
    
    try {
      // Get quantum signal
      const quantumSignal = await quantumCore.quantumClassifyTradingSignal(
        features,
        historicalData
      );
      
      // CRITICAL FIX: Handle ensemble disagreement with intelligence
      if (quantumSignal.ensembleAgreement > 0.7) {
        console.log(`⚛️ Quantum Signal: ${quantumSignal.action} (${(quantumSignal.confidence * 100).toFixed(1)}%)`);
        console.log(`🌀 Quantum Advantage: ${quantumSignal.quantumAdvantage}`);
        
        // Reset hold count on decisive action
        if (quantumSignal.action !== 'HOLD') {
          this.holdCount = 0;
        }
        
        // Update signal history
        this.updateSignalHistory(quantumSignal);
        
        return quantumSignal;
        
      } else {
        // INCREMENT HOLD COUNT
        this.holdCount++;
        
        // CALCULATE DYNAMIC THRESHOLD based on market entropy
        const holdThreshold = this.calculateDynamicHoldThreshold(features);
        
        console.warn(`⚠️ Ensemble disagreement (Hold #${this.holdCount}/${holdThreshold})`);
        
        // CRITICAL: Break infinite loop with intelligent fallback
        if (this.holdCount > holdThreshold) {
          console.log('🔄 Breaking hold loop - activating fallback strategy');
          
          // Determine fallback action based on multiple factors
          const fallbackAction = this.determineFallbackAction(
            features,
            historicalData,
            quantumSignal
          );
          
          // Reset hold count after fallback
          this.holdCount = 0;
          
          return fallbackAction;
        }
        
        // Continue holding but with decreasing confidence
        const decayFactor = Math.exp(-this.holdCount * 0.2);
        return { 
          action: 'HOLD', 
          confidence: Math.max(0.01, 0.5 * decayFactor), 
          mode: 'ENSEMBLE_DISAGREEMENT',
          holdCount: this.holdCount
        };
      }
      
    } catch (error) {
      console.error('❌ Quantum signal classification error:', error);
      
      // Intelligent error recovery
      return this.handleClassificationError(error, features);
    }
  }

  /**
   * Calculate dynamic hold threshold based on market conditions
   */
  calculateDynamicHoldThreshold(features) {
    if (!this.dynamicHoldThreshold) {
      return this.maxHoldCount;
    }
    
    // Calculate signal entropy (higher entropy = more unpredictable)
    const entropy = this.calculateSignalEntropy();
    
    // Calculate volatility from features
    const volatility = features.volatility || this.estimateVolatility(features);
    
    // High entropy/volatility = lower threshold (exit hold loops faster)
    // Low entropy/volatility = higher threshold (can wait longer)
    let threshold = this.maxHoldCount;
    
    if (entropy > 0.7) {
      threshold = Math.max(3, this.maxHoldCount - 2); // Fast markets need quick decisions
    } else if (entropy < 0.3) {
      threshold = Math.min(10, this.maxHoldCount + 2); // Stable markets can wait
    }
    
    // Adjust for volatility
    if (volatility > 0.02) { // 2% volatility threshold
      threshold = Math.max(3, threshold - 1);
    }
    
    console.log(`📊 Dynamic hold threshold: ${threshold} (entropy: ${entropy.toFixed(2)}, vol: ${volatility.toFixed(4)})`);
    
    return threshold;
  }

  /**
   * Determine intelligent fallback action
   */
  determineFallbackAction(features, historicalData, quantumSignal) {
    console.log('🎯 Determining fallback action...');
    
    // 1. Check market regime
    const regime = this.detectMarketRegime(features, historicalData);
    
    // 2. Analyze recent performance
    const recentPerformance = this.analyzeRecentPerformance();
    
    // 3. Check technical indicators consensus
    const technicalBias = this.getTechnicalBias(features);
    
    // 4. Risk-adjusted decision
    let action = 'HOLD';
    let confidence = 0.3;
    let reason = 'FALLBACK';
    
    // Trending market - follow the trend
    if (regime === 'trend_up') {
      action = 'BUY';
      confidence = 0.4;
      reason = 'TREND_FOLLOWING_FALLBACK';
    } else if (regime === 'trend_down') {
      action = 'SELL';
      confidence = 0.4;
      reason = 'TREND_FOLLOWING_FALLBACK';
    }
    // Range-bound market - mean reversion
    else if (regime === 'range') {
      if (features.rsi < 30) {
        action = 'BUY';
        confidence = 0.35;
        reason = 'OVERSOLD_FALLBACK';
      } else if (features.rsi > 70) {
        action = 'SELL';
        confidence = 0.35;
        reason = 'OVERBOUGHT_FALLBACK';
      }
    }
    // Volatile market - reduce exposure
    else if (regime === 'volatile') {
      if (recentPerformance < 0) {
        action = 'SELL';
        confidence = 0.25;
        reason = 'RISK_REDUCTION_FALLBACK';
      }
    }
    
    // Boost confidence if technical indicators agree
    if (technicalBias === action) {
      confidence = Math.min(0.6, confidence * 1.3);
    }
    
    console.log(`🔄 Fallback decision: ${action} (${(confidence * 100).toFixed(1)}%) - ${reason}`);
    
    return {
      action: action,
      confidence: confidence,
      mode: reason,
      fallback: true,
      regime: regime,
      quantumAdvantage: quantumSignal.quantumAdvantage || 0
    };
  }

  /**
   * Detect current market regime
   */
  detectMarketRegime(features, historicalData) {
    // Simple regime detection - can be enhanced with HMM
    const momentum = features.momentum || 0;
    const volatility = features.volatility || 0;
    const trend = features.trend || 0;
    
    if (Math.abs(trend) > 0.7 && volatility < 0.02) {
      return trend > 0 ? 'trend_up' : 'trend_down';
    } else if (volatility > 0.03) {
      return 'volatile';
    } else if (Math.abs(momentum) < 0.3 && volatility < 0.015) {
      return 'range';
    }
    
    return 'neutral';
  }

  /**
   * Calculate signal entropy for adaptivity
   */
  calculateSignalEntropy() {
    if (this.signalHistory.length < 10) {
      return 0.5; // Default middle entropy
    }
    
    // Count signal distribution
    const counts = { BUY: 0, SELL: 0, HOLD: 0 };
    this.signalHistory.forEach(signal => {
      counts[signal.action] = (counts[signal.action] || 0) + 1;
    });
    
    // Calculate Shannon entropy
    let entropy = 0;
    const total = this.signalHistory.length;
    
    Object.values(counts).forEach(count => {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    });
    
    // Normalize to 0-1 range
    return entropy / Math.log2(3); // Max entropy for 3 states
  }

  /**
   * Update signal history with sliding window
   */
  updateSignalHistory(signal) {
    this.signalHistory.push({
      action: signal.action,
      confidence: signal.confidence,
      timestamp: Date.now()
    });
    
    // Maintain window size
    if (this.signalHistory.length > this.maxHistorySize) {
      this.signalHistory.shift();
    }
  }

  /**
   * Analyze recent trading performance
   */
  analyzeRecentPerformance() {
    // This would connect to your performance tracking
    // For now, returning neutral
    return 0;
  }

  /**
   * Get technical indicators bias
   */
  getTechnicalBias(features) {
    let buySignals = 0;
    let sellSignals = 0;
    
    // RSI
    if (features.rsi < 30) buySignals++;
    if (features.rsi > 70) sellSignals++;
    
    // MACD
    if (features.macdHistogram > 0) buySignals++;
    if (features.macdHistogram < 0) sellSignals++;
    
    // Moving averages
    if (features.priceAboveSMA) buySignals++;
    else sellSignals++;
    
    if (buySignals > sellSignals) return 'BUY';
    if (sellSignals > buySignals) return 'SELL';
    return 'HOLD';
  }

  /**
   * Handle classification errors intelligently
   */
  handleClassificationError(error, features) {
    console.error('🔧 Handling classification error:', error.message);
    
    // Increment error count
    this.holdCount++;
    
    // Safe fallback based on risk management
    const volatility = features.volatility || 0.01;
    const confidence = Math.max(0.01, 0.2 * (1 - volatility * 10));
    
    return {
      action: 'HOLD',
      confidence: confidence,
      mode: 'ERROR_RECOVERY',
      error: error.message,
      holdCount: this.holdCount
    };
  }

  /**
   * Estimate volatility from features
   */
  estimateVolatility(features) {
    // Simple volatility estimate from price range
    if (features.high && features.low && features.close) {
      return (features.high - features.low) / features.close;
    }
    return 0.01; // Default 1% volatility
  }

  /**
   * Reset classifier state
   */
  reset() {
    this.holdCount = 0;
    this.signalHistory = [];
    this.lastSignalTimestamp = Date.now();
    console.log('🔄 Classifier state reset');
  }

  /**
   * Get classifier status
   */
  getStatus() {
    return {
      holdCount: this.holdCount,
      maxHoldCount: this.maxHoldCount,
      signalHistorySize: this.signalHistory.length,
      entropy: this.calculateSignalEntropy(),
      marketRegime: this.marketRegime,
      timeSinceLastSignal: Date.now() - this.lastSignalTimestamp
    };
  }
}

// Export for modular use
module.exports = QuantumSignalClassifier;