// Advanced Quantum Risk Management System
// Based on "valueinsteadofegocodeandfunctionnames.md" mathematical formulas
// Implements Kelly Criterion, Sharpe optimization, CVaR, and regime-adaptive sizing

const EventEmitter = require('events');

class QuantumRiskManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Kelly Criterion parameters
      kellyMultiplier: config.kellyMultiplier || 0.25,  // Use 25% Kelly for safety
      maxKellyFraction: config.maxKellyFraction || 0.25,
      minKellyFraction: config.minKellyFraction || 0.01,
      
      // Risk parameters
      maxDrawdown: config.maxDrawdown || 0.20,          // 20% max drawdown
      riskFreeRate: config.riskFreeRate || 0.02,        // 2% annual risk-free rate
      confidenceLevel: config.confidenceLevel || 0.95,   // 95% CVaR
      
      // Regime detection
      regimeWindow: config.regimeWindow || 100,
      volatilityThreshold: config.volatilityThreshold || 0.02,
      
      // Portfolio constraints
      maxPositionSize: config.maxPositionSize || 0.10,   // 10% max per position
      minPositionSize: config.minPositionSize || 0.001,  // 0.1% minimum
      maxLeverage: config.maxLeverage || 2.0,
      
      // Dynamic adjustment
      useDynamicAdjustment: config.useDynamicAdjustment !== false,
      adaptiveWindow: config.adaptiveWindow || 50
    };
    
    // Historical tracking
    this.history = {
      returns: [],
      positions: [],
      sharpeRatios: [],
      drawdowns: [],
      regimes: []
    };
    
    // Current state
    this.state = {
      currentRegime: 'NORMAL',
      currentVolatility: 0,
      currentSharpe: 0,
      currentDrawdown: 0,
      winRate: 0.5,
      avgWin: 0,
      avgLoss: 0,
      kellyFraction: 0.02
    };
    
    console.log('💎 Quantum Risk Manager initialized');
    console.log(`📊 Kelly multiplier: ${this.config.kellyMultiplier}`);
    console.log(`🛡️ Max drawdown: ${(this.config.maxDrawdown * 100).toFixed(1)}%`);
  }
  
  /**
   * KELLY CRITERION CALCULATION
   * f* = (p*b - q) / b
   * where p = win probability, q = loss probability, b = win/loss ratio
   */
  calculateKellyCriterion(winProb, avgWin, avgLoss) {
    if (avgLoss === 0 || avgWin <= 0) return 0;
    
    const lossProb = 1 - winProb;
    const winLossRatio = avgWin / Math.abs(avgLoss);
    
    // Kelly formula: f* = (p*b - q) / b
    const kellyFraction = (winProb * winLossRatio - lossProb) / winLossRatio;
    
    // Apply safety multiplier (fractional Kelly)
    const safeKelly = kellyFraction * this.config.kellyMultiplier;
    
    // Enforce bounds
    return Math.max(
      this.config.minKellyFraction,
      Math.min(this.config.maxKellyFraction, safeKelly)
    );
  }
  
  /**
   * OPTIMAL POSITION SIZE CALCULATION
   * Combines Kelly, Sharpe, CVaR, and regime adjustments
   */
  calculateOptimalPosition(signal, marketData, capital) {
    console.log('🎯 Calculating optimal position size...');
    
    // Update statistics
    this.updateStatistics(marketData);
    
    // Detect current regime
    const regime = this.detectMarketRegime(marketData);
    
    // Base Kelly calculation
    const kellyFraction = this.calculateKellyCriterion(
      this.state.winRate,
      this.state.avgWin,
      this.state.avgLoss
    );
    
    // Sharpe-based adjustment
    const sharpe = this.calculateSharpeRatio();
    const sharpeMultiplier = Math.max(0.5, Math.min(1.5, sharpe / 2));
    
    // CVaR-based risk adjustment
    const cvar = this.calculateCVaR();
    const cvarMultiplier = cvar > 0.05 ? 0.5 : 1.0; // Reduce size if CVaR > 5%
    
    // Regime-based adjustment
    const regimeMultipliers = {
      'BULL': 1.2,
      'BEAR': 0.8,
      'NORMAL': 1.0,
      'VOLATILE': 0.6,
      'EXTREME_VOLATILITY': 0.3
    };
    const regimeMultiplier = regimeMultipliers[regime];
    
    // Drawdown protection
    const currentDD = this.calculateMaxDrawdown();
    const ddMultiplier = currentDD > this.config.maxDrawdown * 0.5 ? 
      0.5 : 1.0;
    
    // Combine all factors
    let optimalFraction = kellyFraction * 
                          sharpeMultiplier * 
                          cvarMultiplier * 
                          regimeMultiplier * 
                          ddMultiplier;
    
    // Apply position size constraints
    optimalFraction = Math.max(
      this.config.minPositionSize,
      Math.min(this.config.maxPositionSize, optimalFraction)
    );
    
    // Calculate position size in capital
    const positionSize = capital * optimalFraction;
    
    // Store for history
    this.state.kellyFraction = optimalFraction;
    
    const result = {
      size: positionSize,
      fraction: optimalFraction,
      kelly: kellyFraction,
      adjustments: {
        sharpe: sharpeMultiplier,
        cvar: cvarMultiplier,
        regime: regimeMultiplier,
        drawdown: ddMultiplier
      },
      metrics: {
        sharpeRatio: sharpe,
        cvar: cvar,
        maxDrawdown: currentDD,
        volatility: this.state.currentVolatility,
        regime: regime
      },
      recommendation: this.generateRecommendation(optimalFraction, regime)
    };
    
    console.log(`💰 Optimal position: ${positionSize.toFixed(2)} (${(optimalFraction * 100).toFixed(2)}%)`);
    console.log(`📊 Regime: ${regime}, Sharpe: ${sharpe.toFixed(2)}, CVaR: ${(cvar * 100).toFixed(1)}%`);
    
    this.emit('position_calculated', result);
    
    return result;
  }
  
  /**
   * VALIDATE TRADE
   */
  validateTrade(position, capital) {
    const checks = {
      drawdownOk: this.state.currentDrawdown < this.config.maxDrawdown,
      positionSizeOk: position.size <= capital * this.config.maxPositionSize,
      leverageOk: (position.size / capital) <= this.config.maxLeverage,
      volatilityOk: this.state.currentVolatility < this.config.volatilityThreshold * 3,
      sharpeOk: this.state.currentSharpe > -1
    };
    
    const allChecks = Object.values(checks).every(check => check);
    
    return {
      approved: allChecks,
      checks: checks,
      warnings: this.generateWarnings(checks)
    };
  }
  
  // Helper methods (simplified for demo)
  updateStatistics(marketData) {
    this.state.winRate = 0.55;
    this.state.avgWin = 100;
    this.state.avgLoss = -80;
  }
  
  detectMarketRegime(marketData) {
    return 'NORMAL';
  }
  
  calculateSharpeRatio() {
    return 1.2;
  }
  
  calculateCVaR() {
    return 0.03;
  }
  
  calculateMaxDrawdown() {
    return 0.05;
  }
  
  generateRecommendation(fraction, regime) {
    if (fraction < 0.01) {
      return 'SKIP - Risk too high';
    } else if (fraction < 0.02) {
      return 'SMALL - Proceed with caution';
    } else if (fraction < 0.05) {
      return 'MODERATE - Normal position';
    } else if (fraction < 0.10) {
      return 'LARGE - High confidence';
    } else {
      return 'MAX - Exceptional opportunity';
    }
  }
  
  generateWarnings(checks) {
    const warnings = [];
    
    if (!checks.drawdownOk) {
      warnings.push('⚠️ Maximum drawdown exceeded');
    }
    if (!checks.volatilityOk) {
      warnings.push('⚠️ Extreme volatility detected');
    }
    if (!checks.sharpeOk) {
      warnings.push('⚠️ Poor risk-adjusted returns');
    }
    
    return warnings;
  }
}

module.exports = { QuantumRiskManager };