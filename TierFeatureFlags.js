// TierFeatureFlags.js - Subscription tier management for OGZ Trading System
// Controls feature access based on subscription levels

class TierFeatureFlags {
  constructor(tier = 'starter') {
    this.tier = tier.toLowerCase();
    this.features = this.loadTierFeatures();

    console.log(`🎭 TierFeatureFlags initialized for ${this.tier} tier`);
  }

  /**
   * Load features based on subscription tier
   */
  loadTierFeatures() {
    const tiers = {
      starter: {
        patterns: 'Basic (3)',
        maxPositions: 1,
        multiDirectional: false,
        quantum: false,
        leverage: 1,
        riskManagement: 'Basic',
        analytics: 'Basic',
        strategies: ['Simple'],
        maxDailyTrades: 10,
        stopLoss: true,
        takeProfit: true,
        trailingStop: false,
        arbitrage: false,
        optionsTrading: false,
        futuresTrading: false,
        forexTrading: false,
        cryptoTrading: true,
        mlLearning: false,
        customIndicators: false,
        backtesting: 'Basic',
        liveAlerts: false,
        apiAccess: false,
        priority: 'Standard'
      },

      pro: {
        patterns: 'Advanced (10)',
        maxPositions: 5,
        multiDirectional: true,
        quantum: false,
        leverage: 3,
        riskManagement: 'Advanced',
        analytics: 'Advanced',
        strategies: ['Simple', 'Pattern', 'Momentum'],
        maxDailyTrades: 50,
        stopLoss: true,
        takeProfit: true,
        trailingStop: true,
        arbitrage: true,
        optionsTrading: false,
        futuresTrading: false,
        forexTrading: true,
        cryptoTrading: true,
        mlLearning: true,
        customIndicators: true,
        backtesting: 'Advanced',
        liveAlerts: true,
        apiAccess: 'Limited',
        priority: 'High'
      },

      elite: {
        patterns: 'All (25+)',
        maxPositions: 20,
        multiDirectional: true,
        quantum: true,
        leverage: 5,
        riskManagement: 'Elite',
        analytics: 'Elite',
        strategies: ['All Available'],
        maxDailyTrades: 500,
        stopLoss: true,
        takeProfit: true,
        trailingStop: true,
        arbitrage: true,
        optionsTrading: true,
        futuresTrading: true,
        forexTrading: true,
        cryptoTrading: true,
        mlLearning: true,
        customIndicators: true,
        backtesting: 'Professional',
        liveAlerts: true,
        apiAccess: 'Full',
        priority: 'VIP'
      }
    };

    return tiers[this.tier] || tiers.starter;
  }

  /**
   * Check if a feature is enabled for current tier
   */
  isEnabled(feature) {
    return this.features[feature] || false;
  }

  /**
   * Get feature value for current tier
   */
  getValue(feature) {
    return this.features[feature];
  }

  /**
   * Get tier summary for display
   */
  getTierSummary() {
    return {
      tier: this.tier,
      patterns: this.features.patterns,
      maxPositions: this.features.maxPositions,
      multiDirectional: this.features.multiDirectional,
      quantum: this.features.quantum,
      leverage: this.features.leverage,
      analytics: this.features.analytics,
      strategies: this.features.strategies.join(', '),
      maxDailyTrades: this.features.maxDailyTrades
    };
  }

  /**
   * Check if user can access a specific trading feature
   */
  canTrade(asset) {
    switch(asset.toLowerCase()) {
      case 'crypto':
        return this.features.cryptoTrading;
      case 'options':
        return this.features.optionsTrading;
      case 'futures':
        return this.features.futuresTrading;
      case 'forex':
        return this.features.forexTrading;
      default:
        return true; // Stocks are available to all tiers
    }
  }

  /**
   * Check if user can use a specific strategy
   */
  canUseStrategy(strategy) {
    if (this.features.strategies.includes('All Available')) {
      return true;
    }
    return this.features.strategies.includes(strategy);
  }

  /**
   * Get maximum position size based on tier
   */
  getMaxPositionSize(baseSize) {
    const multiplier = this.features.leverage;
    return baseSize * multiplier;
  }

  /**
   * Check if user has reached daily trade limit
   */
  canMakeMoreTrades(currentTrades) {
    return currentTrades < this.features.maxDailyTrades;
  }

  /**
   * Get tier upgrade recommendations
   */
  getUpgradeRecommendations() {
    if (this.tier === 'starter') {
      return {
        nextTier: 'pro',
        benefits: [
          'Multi-directional trading',
          'Advanced patterns',
          'ML learning systems',
          'Forex trading',
          'Live alerts'
        ]
      };
    } else if (this.tier === 'pro') {
      return {
        nextTier: 'elite',
        benefits: [
          'Quantum features',
          'Options & Futures trading',
          'Professional backtesting',
          'Full API access',
          'VIP support'
        ]
      };
    }

    return { nextTier: null, benefits: ['You have the highest tier!'] };
  }

  /**
   * Display tier information
   */
  displayTierInfo() {
    const summary = this.getTierSummary();
    console.log(`\n🏆 SUBSCRIPTION TIER: ${summary.tier.toUpperCase()}`);
    console.log(`📊 Patterns: ${summary.patterns}`);
    console.log(`💼 Max Positions: ${summary.maxPositions}`);
    console.log(`🔄 Multi-Directional: ${summary.multiDirectional ? 'YES' : 'NO'}`);
    console.log(`⚛️ Quantum Features: ${summary.quantum ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📈 Max Leverage: ${summary.leverage}x`);
    console.log(`🎯 Strategies: ${summary.strategies}`);
    console.log(`📈 Daily Trades: ${summary.maxDailyTrades}`);
  }
}

module.exports = TierFeatureFlags;