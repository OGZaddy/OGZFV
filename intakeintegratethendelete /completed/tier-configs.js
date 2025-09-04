// config/tier-configs.js
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL TIER CONFIGURATIONS

const TIER_CONFIGS = {
  starter: {
    name: 'Starter Tier',
    price: 97,
    indicators: ['RSI', 'MACD'],
    features: {
      maxPositions: 1,
      maxTradesPerDay: 10,
      positionSize: 0.001,
      minConfidence: 65,
      tradingDelay: 30000, // 30 seconds between trades
      paperTradingOnly: true,
      patternRecognition: false,
      multiTimeframe: false,
      advancedIndicators: false
    },
    weights: {
      RSI: 1.0,
      MACD: 1.0
    },
    indicatorConfig: {
      RSI: { period: 14 }, // Use standard 14-period RSI
      MACD: { fast: 12, slow: 26, signal: 9 } // Use standard MACD
    }
  },

  pro: {
    name: 'Pro Tier',
    price: 297,
    indicators: ['RSI', 'MACD', 'BollingerBands', 'VWAP', 'PatternRecognition'],
    features: {
      maxPositions: 3,
      maxTradesPerDay: 50,
      positionSize: 0.002,
      minConfidence: 70,
      tradingDelay: 20000, // 20 seconds between trades
      paperTradingOnly: false,
      patternRecognition: true,
      multiTimeframe: true,
      advancedIndicators: true
    },
    weights: {
      RSI: 0.8,
      MACD: 0.8,
      BollingerBands: 1.0,
      VWAP: 0.9,
      PatternRecognition: 1.2
    },
    indicatorConfig: {
      RSI: { period: 14 },
      MACD: { fast: 12, slow: 26, signal: 9 },
      BollingerBands: { period: 20, stdDev: 2 },
      VWAP: { anchorPeriod: 'session' },
      PatternRecognition: {
        patterns: ['Head & Shoulders', 'Double Bottom', 'Ascending Triangle', 'Bull Flag']
      }
    }
  },

  elite: {
    name: 'Elite Tier',
    price: 997,
    indicators: ['RSI', 'MACD', 'BollingerBands', 'VWAP', 'PatternRecognition', 
                 'FibonacciRetracement', 'IchimokuCloud', 'MarketProfile'],
    features: {
      maxPositions: 10,
      maxTradesPerDay: 200,
      positionSize: 0.005,
      minConfidence: 65,
      tradingDelay: 10000, // 10 seconds between trades
      paperTradingOnly: false,
      patternRecognition: true,
      multiTimeframe: true,
      advancedIndicators: true,
      neuralNetworkSignals: true,
      sentimentAnalysis: true,
      orderFlowAnalysis: true
    },
    weights: {
      RSI: 0.6,
      MACD: 0.6,
      BollingerBands: 0.8,
      VWAP: 0.8,
      PatternRecognition: 1.0,
      FibonacciRetracement: 0.9,
      IchimokuCloud: 1.1,
      MarketProfile: 1.2,
      NeuralSignals: 1.5
    },
    indicatorConfig: {
      RSI: { period: 14, overbought: 70, oversold: 30 },
      MACD: { fast: 12, slow: 26, signal: 9 },
      BollingerBands: { period: 20, stdDev: 2 },
      VWAP: { anchorPeriod: 'session' },
      PatternRecognition: {
        patterns: ['Head & Shoulders', 'Double Bottom', 'Ascending Triangle', 
                   'Bull Flag', 'Cup and Handle', 'Wedge', 'Triangle']
      },
      FibonacciRetracement: { levels: [0.236, 0.382, 0.5, 0.618, 0.786] },
      IchimokuCloud: { conversionPeriod: 9, basePeriod: 26, spanPeriod: 52 }
    }
  },

  quantum: {
    name: 'Quantum Tier',
    price: 9997,
    indicators: ['RSI', 'MACD', 'BollingerBands', 'VWAP', 'PatternRecognition',
                 'FibonacciRetracement', 'IchimokuCloud', 'MarketProfile',
                 'QuantumNeuromorphic', 'SB2Algorithm', 'VISAAlgorithm'],
    features: {
      maxPositions: -1, // Unlimited
      maxTradesPerDay: -1, // Unlimited
      positionSize: 0.01,
      minConfidence: 60,
      tradingDelay: 5000, // 5 seconds between trades
      paperTradingOnly: false,
      patternRecognition: true,
      multiTimeframe: true,
      advancedIndicators: true,
      neuralNetworkSignals: true,
      sentimentAnalysis: true,
      orderFlowAnalysis: true,
      quantumAlgorithms: true,
      realityBending: true,
      divineIntegration: true,
      highFrequencyTrading: true
    },
    weights: {
      RSI: 0.4,
      MACD: 0.4,
      BollingerBands: 0.6,
      VWAP: 0.6,
      PatternRecognition: 0.8,
      FibonacciRetracement: 0.7,
      IchimokuCloud: 0.9,
      MarketProfile: 1.0,
      NeuralSignals: 1.2,
      QuantumNeuromorphic: 2.0,
      SB2Algorithm: 1.8,
      VISAAlgorithm: 1.8
    },
    indicatorConfig: {
      RSI: { period: 14, overbought: 70, oversold: 30 },
      MACD: { fast: 12, slow: 26, signal: 9 },
      BollingerBands: { period: 20, stdDev: 2 },
      VWAP: { anchorPeriod: 'session' },
      PatternRecognition: {
        patterns: ['ALL'], // All known patterns
        ai_enhanced: true
      },
      QuantumNeuromorphic: {
        dimensions: 11,
        entanglementDepth: 6,
        quantumGates: ['hadamard', 'cnot', 'pauli-x', 'pauli-y', 'pauli-z'],
        measurementBasis: 'computational'
      },
      SB2Algorithm: {
        consensusThreshold: 0.8,
        validatorCount: 5
      },
      VISAAlgorithm: {
        vectorDimensions: 256,
        annealingSchedule: 'linear'
      }
    }
  }
};

// Helper function to get tier config
function getTierConfig(tierName) {
  const config = TIER_CONFIGS[tierName.toLowerCase()];
  if (!config) {
    throw new Error(`Unknown tier: ${tierName}. Valid tiers are: ${Object.keys(TIER_CONFIGS).join(', ')}`);
  }
  return config;
}

// Helper function to check if a feature is enabled for a tier
function isFeatureEnabled(tierName, featureName) {
  const config = getTierConfig(tierName);
  return config.features[featureName] === true;
}

// Helper function to get indicator configuration
function getIndicatorConfig(tierName, indicatorName) {
  const config = getTierConfig(tierName);
  return config.indicatorConfig[indicatorName] || {};
}

// Calculate realistic fees based on tier
function calculateFees(tierName, tradeAmount) {
  const baseFee = 0.012; // 1.2% base fee (exchange + slippage + gas)
  
  // Higher tiers get better rates
  const tierMultipliers = {
    starter: 1.0,    // 1.2% total
    pro: 0.9,        // 1.08% total
    elite: 0.75,     // 0.9% total
    quantum: 0.5     // 0.6% total (best execution)
  };
  
  const multiplier = tierMultipliers[tierName.toLowerCase()] || 1.0;
  return tradeAmount * baseFee * multiplier;
}

module.exports = {
  TIER_CONFIGS,
  getTierConfig,
  isFeatureEnabled,
  getIndicatorConfig,
  calculateFees
};