/**
 * TIER FEATURE FLAGS - Control what features each subscription tier gets
 * This is the master control for all tier-based features
 */

class TierFeatureFlags {
  constructor(tier = 'starter') {
    this.tier = tier.toLowerCase();
    
    // Master feature flag configuration
    this.features = {
      starter: {
        // Basic features - NO PATTERNS
        patterns: {
          enabled: false,
          type: 'none',          // No patterns for starter
          maxPatterns: 0,        // No patterns
        },
        indicators: {
          rsi: true,
          macd: true,
          ema: true,
          bollinger: false,
          stochastic: false,
          ichimoku: false
        },
        trading: {
          maxPositions: 1,       // Only 1 position at a time
          multiDirectional: false, // Can't go short
          leverageEnabled: false,
          maxLeverage: 1
        },
        risk: {
          stopLoss: true,
          takeProfit: true,
          trailingStop: false,
          riskManager: false,     // No advanced risk management
          safetyNet: false,       // No safety net
          maxDrawdown: 0.20       // 20% max drawdown
        },
        quantum: {
          enabled: false,         // No quantum features
          enhancement: false,
          positionSizer: false,
          correlationAnalysis: false
        },
        performance: {
          dashboard: false,       // No performance dashboard
          analytics: false,       // No advanced analytics
          reporting: 'basic'      // Basic reports only
        },
        api: {
          rateLimit: 60,         // 60 requests per minute
          webhooks: false,       // No webhooks
          customAlerts: false    // No custom alerts
        }
      },
      
      pro: {
        // Pro features - ONLY 4 PATTERNS
        patterns: {
          enabled: true,
          type: 'basic',         // Basic patterns only
          maxPatterns: 4,        // Only 4 patterns for 2nd tier
        },
        indicators: {
          rsi: true,
          macd: true,
          ema: true,
          bollinger: true,       // Added
          stochastic: true,      // Added
          ichimoku: false
        },
        trading: {
          maxPositions: 3,       // Up to 3 positions
          multiDirectional: true, // Can go long and short
          leverageEnabled: true,
          maxLeverage: 2
        },
        risk: {
          stopLoss: true,
          takeProfit: true,
          trailingStop: true,    // Added
          riskManager: true,     // Added
          safetyNet: true,       // Added
          maxDrawdown: 0.15      // 15% max drawdown
        },
        quantum: {
          enabled: false,        // Still no quantum
          enhancement: false,
          positionSizer: false,
          correlationAnalysis: false
        },
        performance: {
          dashboard: true,       // Added
          analytics: true,       // Added
          reporting: 'detailed'  // Detailed reports
        },
        api: {
          rateLimit: 300,        // 300 requests per minute
          webhooks: true,        // Added
          customAlerts: true     // Added
        }
      },
      
      elite: {
        // Elite gets EVERYTHING
        patterns: {
          enabled: true,
          type: 'comprehensive', // All 94 patterns
          maxPatterns: 999,      // No limit
        },
        indicators: {
          rsi: true,
          macd: true,
          ema: true,
          bollinger: true,
          stochastic: true,
          ichimoku: true         // Added
        },
        trading: {
          maxPositions: 10,      // Up to 10 positions
          multiDirectional: true,
          leverageEnabled: true,
          maxLeverage: 5         // 5x leverage
        },
        risk: {
          stopLoss: true,
          takeProfit: true,
          trailingStop: true,
          riskManager: true,
          safetyNet: true,
          maxDrawdown: 0.10      // 10% max drawdown (tighter control)
        },
        quantum: {
          enabled: true,         // QUANTUM FEATURES ENABLED
          enhancement: true,     // Quantum enhancement layer
          positionSizer: true,   // Quantum position sizing
          correlationAnalysis: true // Advanced correlation
        },
        performance: {
          dashboard: true,
          analytics: true,
          reporting: 'professional' // Professional grade reports
        },
        api: {
          rateLimit: 9999,       // Essentially unlimited
          webhooks: true,
          customAlerts: true
        }
      }
    };
    
    // Set current feature set
    this.currentFeatures = this.features[this.tier] || this.features.starter;
    
    console.log(`🎯 Feature flags loaded for ${tier.toUpperCase()} tier`);
  }
  
  /**
   * Check if a feature is enabled
   */
  isEnabled(feature) {
    const parts = feature.split('.');
    let current = this.currentFeatures;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return false;
      }
      current = current[part];
    }
    
    return current === true || current === 'enabled';
  }
  
  /**
   * Get feature value (for non-boolean features)
   */
  getFeatureValue(feature) {
    const parts = feature.split('.');
    let current = this.currentFeatures;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return null;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Get pattern detector based on tier
   */
  getPatternDetector() {
    const patternConfig = this.currentFeatures.patterns;
    
    if (!patternConfig.enabled) {
      return null;
    }
    
    if (patternConfig.type === 'comprehensive') {
      // Elite tier gets the full comprehensive detector
      const ComprehensivePatternDetector = require('./ComprehensivePatternDetector');
      return new ComprehensivePatternDetector();
    } else {
      // Other tiers get the basic detector with limited patterns
      const EnhancedPatternRecognition = require('./EnhancedPatternRecognition');
      const detector = new EnhancedPatternRecognition();
      detector.maxPatterns = patternConfig.maxPatterns;
      return detector;
    }
  }
  
  /**
   * Check if user can use a specific module
   */
  canUseModule(moduleName) {
    const moduleMap = {
      'RiskManager': 'risk.riskManager',
      'TradingSafetyNet': 'risk.safetyNet',
      'QuantumPositionSizer': 'quantum.positionSizer',
      'RealQuantumEnhancement': 'quantum.enhancement',
      'MultiDirectionalTrader': 'trading.multiDirectional',
      'PerformanceDashboard': 'performance.dashboard',
      'CorrelationAnalyzer': 'quantum.correlationAnalysis'
    };
    
    const featurePath = moduleMap[moduleName];
    return featurePath ? this.isEnabled(featurePath) : false;
  }
  
  /**
   * Get tier summary
   */
  getTierSummary() {
    const patternCount = this.currentFeatures.patterns.type === 'comprehensive' ? 94 : 
                        this.currentFeatures.patterns.maxPatterns;
    
    return {
      tier: this.tier,
      patterns: patternCount,
      maxPositions: this.currentFeatures.trading.maxPositions,
      quantum: this.currentFeatures.quantum.enabled,
      multiDirectional: this.currentFeatures.trading.multiDirectional,
      riskManager: this.currentFeatures.risk.riskManager,
      leverage: this.currentFeatures.trading.maxLeverage
    };
  }
  
  /**
   * Upgrade tier (for testing)
   */
  upgradeTier(newTier) {
    if (this.features[newTier]) {
      this.tier = newTier;
      this.currentFeatures = this.features[newTier];
      console.log(`✅ Upgraded to ${newTier.toUpperCase()} tier`);
      return true;
    }
    return false;
  }
}

module.exports = TierFeatureFlags;