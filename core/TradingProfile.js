// TradingProfile.js - Configuration that drives everything
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TradingProfile {
  constructor(name, config = {}) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.version = Date.now();
    this.tier = config.tier || 'tier1';
    this.tiers = this.getTiersForLevel(this.tier);
    this.config = config;
    this.patterns = new Map();
    this.logs = [];
    this.performance = {
      trades: 0,
      wins: 0,
      losses: 0,
      profit: 0
    };
    
    // Feature flags - what's enabled for this profile
    this.featureFlags = this.generateFeatureFlags();
    
    // Module weights for decision making
    this.weights = config.weights || this.getDefaultWeights();
  }
  
  getTiersForLevel(tier) {
    // Cumulative tiers - higher tiers include lower ones
    const tierMap = {
      'tier1': ['tier1'],
      'tier2': ['tier1', 'tier2'],
      'tier3': ['tier1', 'tier2', 'tier3'],
      'quantum': ['quantum'] // Quantum is separate
    };
    return tierMap[tier] || ['tier1'];
  }
  
  generateFeatureFlags() {
    const flags = {
      // Tier 1 - Basic (Everyone gets these)
      'basic_trading': this.tiers.includes('tier1'),
      'live_trading_only': true,  // NO PAPER BULLSHIT
      'basic_indicators': this.tiers.includes('tier1'),
      'basic_backtest': this.tiers.includes('tier1'),
      
      // Tier 2 - Advanced
      'timeGAN': this.tiers.includes('tier2'),
      'gann_analysis': this.tiers.includes('tier2'),
      'advanced_patterns': this.tiers.includes('tier2'),
      'multi_exchange': this.tiers.includes('tier2'),
      'parallel_backtest': this.tiers.includes('tier2'),
      
      // Tier 3 - Divine
      'neural_mesh': this.tiers.includes('tier3'),
      'quantum_gan': this.tiers.includes('tier3'),
      'divine_modules': this.tiers.includes('tier3'),
      'reality_bending': this.tiers.includes('tier3'),
      'unlimited_backtests': this.tiers.includes('tier3'),
      
      // Quantum - Separate beast
      'quantum_algorithms': this.tier === 'quantum',
      'quantum_portfolio': this.tier === 'quantum',
      'neuromorphic': this.tier === 'quantum'
    };
    
    return flags;
  }
  
  getDefaultWeights() {
    // Default module weights based on tier
    const weights = {
      tier1: {
        execution: 0.5,
        basics: 0.3,
        indicators: 0.2
      },
      tier2: {
        execution: 0.2,
        basics: 0.1,
        indicators: 0.1,
        timeGAN: 0.2,
        gann: 0.2,
        patterns: 0.2
      },
      tier3: {
        execution: 0.1,
        timeGAN: 0.15,
        gann: 0.15,
        neuralMesh: 0.2,
        quantumGAN: 0.2,
        divine: 0.2
      },
      quantum: {
        neuromorphic: 0.3,
        sb2: 0.15,
        visa: 0.15,
        ssbm: 0.15,
        vector: 0.15,
        qnd: 0.1
      }
    };
    
    return weights[this.tier] || weights.tier1;
  }
  
  // Get module manifest for this profile
  getModuleManifest() {
    const manifest = {};
    
    // Add modules based on feature flags
    Object.entries(this.featureFlags).forEach(([feature, enabled]) => {
      if (enabled) {
        manifest[feature] = true;
      }
    });
    
    return manifest;
  }
  
  // Update performance metrics
  updatePerformance(trade) {
    this.performance.trades++;
    
    if (trade.profit > 0) {
      this.performance.wins++;
      this.performance.profit += trade.profit;
    } else {
      this.performance.losses++;
      this.performance.profit += trade.profit;
    }
    
    // Calculate additional metrics
    this.performance.winRate = this.performance.wins / this.performance.trades;
    this.performance.avgProfit = this.performance.profit / this.performance.trades;
  }
  
  // Add pattern to profile
  addPattern(pattern) {
    this.patterns.set(pattern.id, {
      ...pattern,
      addedAt: Date.now(),
      usage: 0
    });
  }
  
  // Log activity
  log(entry) {
    this.logs.push({
      timestamp: Date.now(),
      ...entry
    });
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
  
  // Save profile to disk
  async save() {
    const profileData = {
      id: this.id,
      name: this.name,
      version: this.version,
      tier: this.tier,
      tiers: this.tiers,
      config: this.config,
      featureFlags: this.featureFlags,
      weights: this.weights,
      patterns: Array.from(this.patterns.entries()),
      performance: this.performance,
      lastSaved: Date.now()
    };
    
    const profilePath = path.join(__dirname, '..', 'profiles', `${this.name}.json`);
    await fs.mkdir(path.dirname(profilePath), { recursive: true });
    await fs.writeFile(profilePath, JSON.stringify(profileData, null, 2));
    
    console.log(`💾 Profile saved: ${this.name}`);
    return profilePath;
  }
  
  // Load profile from disk
  static async load(name) {
    const profilePath = path.join(__dirname, '..', 'profiles', `${name}.json`);
    
    try {
      const data = await fs.readFile(profilePath, 'utf8');
      const profileData = JSON.parse(data);
      
      const profile = new TradingProfile(profileData.name, profileData.config);
      
      // Restore all properties
      profile.id = profileData.id;
      profile.version = profileData.version;
      profile.tier = profileData.tier;
      profile.tiers = profileData.tiers;
      profile.featureFlags = profileData.featureFlags;
      profile.weights = profileData.weights;
      profile.performance = profileData.performance;
      
      // Restore patterns
      if (profileData.patterns) {
        profileData.patterns.forEach(([id, pattern]) => {
          profile.patterns.set(id, pattern);
        });
      }
      
      console.log(`📂 Profile loaded: ${name} (v${profile.version})`);
      return profile;
    } catch (error) {
      console.log(`Creating new profile: ${name}`);
      return new TradingProfile(name);
    }
  }
  
  // Clone profile with new name
  clone(newName) {
    const cloned = new TradingProfile(newName, this.config);
    cloned.tier = this.tier;
    cloned.tiers = [...this.tiers];
    cloned.featureFlags = { ...this.featureFlags };
    cloned.weights = { ...this.weights };
    
    // Copy patterns
    this.patterns.forEach((pattern, id) => {
      cloned.patterns.set(id, { ...pattern });
    });
    
    return cloned;
  }
  
  // Upgrade tier
  upgradeTier(newTier) {
    console.log(`⬆️ Upgrading ${this.name} from ${this.tier} to ${newTier}`);
    
    this.tier = newTier;
    this.tiers = this.getTiersForLevel(newTier);
    this.featureFlags = this.generateFeatureFlags();
    
    // Adjust weights if needed
    if (!this.config.weights) {
      this.weights = this.getDefaultWeights();
    }
    
    this.version = Date.now();
    this.log({ event: 'tier_upgrade', from: this.tier, to: newTier });
  }
  
  // Export for backtesting
  exportForBacktest() {
    return {
      name: this.name,
      tier: this.tier,
      tiers: this.tiers,
      config: this.config,
      weights: this.weights,
      mode: 'BACKTEST'
    };
  }
  
  // Get enabled features list
  getEnabledFeatures() {
    return Object.entries(this.featureFlags)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
  }
  
  // Calculate profile hash for versioning
  getHash() {
    const data = JSON.stringify({
      tier: this.tier,
      config: this.config,
      weights: this.weights
    });
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 8);
  }
}

module.exports = TradingProfile;