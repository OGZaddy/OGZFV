// ===================================================================
// PROFILE-SPECIFIC PATTERN MEMORY MANAGER
// ===================================================================
// Each trading profile gets its own pattern memory for optimal learning

const fs = require('fs').promises;
const path = require('path');

class ProfilePatternManager {
  constructor() {
    this.patternsDirectory = path.join(process.cwd(), 'data', 'patterns', 'profiles');
    this.currentProfile = null;
    this.patterns = new Map();
    this.saveInterval = null;
    
    // Ensure directory structure exists
    this.ensureDirectoryStructure();
  }
  
  /**
   * Initialize pattern memory for a specific profile
   */
  async initialize(profileName) {
    console.log(`📊 Initializing pattern memory for profile: ${profileName}`);
    
    this.currentProfile = profileName;
    const patternFile = this.getPatternFilePath(profileName);
    
    try {
      // Load existing patterns for this profile
      const data = await fs.readFile(patternFile, 'utf8');
      const profilePatterns = JSON.parse(data);
      
      // Convert to Map structure
      this.patterns = new Map(Object.entries(profilePatterns.patterns || {}));
      
      console.log(`✅ Loaded ${this.patterns.size} patterns for ${profileName}`);
      
      // Log pattern statistics
      this.logPatternStats();
      
    } catch (error) {
      // No existing patterns - start fresh
      console.log(`📝 Creating new pattern memory for ${profileName}`);
      this.patterns = new Map();
      await this.savePatterns();
    }
    
    // Auto-save every 5 minutes
    this.startAutoSave();
    
    return this.patterns;
  }
  
  /**
   * Get pattern file path for a specific profile
   */
  getPatternFilePath(profileName) {
    // Sanitize profile name for filesystem
    const safeName = profileName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    return path.join(this.patternsDirectory, `${safeName}_patterns.json`);
  }
  
  /**
   * Store a new pattern with profile-specific learning
   */
  async storePattern(features, trade) {
    if (!this.currentProfile) {
      console.error('❌ No profile loaded for pattern storage!');
      return;
    }
    
    const patternKey = this.generatePatternKey(features);
    
    // Get or create pattern entry
    let patternData = this.patterns.get(patternKey) || {
      profile: this.currentProfile,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      occurrences: 0,
      trades: [],
      performance: {
        wins: 0,
        losses: 0,
        totalProfit: 0,
        avgProfit: 0,
        winRate: 0,
        confidence: 0.5
      },
      features: features,
      
      // Profile-specific metadata
      profileMetadata: {
        isScalper: this.currentProfile.includes('scalper'),
        isQuantum: this.currentProfile.includes('quantum'),
        isAggressive: this.currentProfile.includes('aggressive'),
        tradingStyle: this.determineStyle(this.currentProfile)
      }
    };
    
    // Update pattern data
    patternData.lastSeen = Date.now();
    patternData.occurrences++;
    
    // Add trade result
    const tradeResult = {
      timestamp: Date.now(),
      action: trade.action,
      price: trade.price,
      profit: trade.profit || 0,
      success: trade.success || false,
      confidence: trade.confidence,
      holdTime: trade.holdTime || 0,
      
      // Profile-specific trade data
      profileContext: {
        aggressive: trade.wasAggressive || false,
        forced: trade.wasForced || false,
        cosmic: trade.cosmicInfluence || 0,
        quantum: trade.quantumState || 'classical'
      }
    };
    
    patternData.trades.push(tradeResult);
    
    // Limit trade history to last 100 trades
    if (patternData.trades.length > 100) {
      patternData.trades = patternData.trades.slice(-100);
    }
    
    // Recalculate performance metrics
    this.updatePatternPerformance(patternData);
    
    // Store pattern
    this.patterns.set(patternKey, patternData);
    
    console.log(`📊 Pattern stored for ${this.currentProfile}: ${patternKey}`);
    
    // Log if this is a high-value pattern
    if (patternData.performance.winRate > 0.7 && patternData.occurrences > 10) {
      console.log(`🌟 HIGH-VALUE PATTERN DETECTED for ${this.currentProfile}!`);
      console.log(`   Win Rate: ${(patternData.performance.winRate * 100).toFixed(1)}%`);
      console.log(`   Avg Profit: ${(patternData.performance.avgProfit * 100).toFixed(2)}%`);
    }
  }
  
  /**
   * Get pattern confidence for current profile
   */
  getPatternConfidence(features) {
    const patternKey = this.generatePatternKey(features);
    const pattern = this.patterns.get(patternKey);
    
    if (!pattern) {
      return {
        confidence: 0,
        reason: 'New pattern',
        profileMatch: false
      };
    }
    
    // Profile-specific confidence adjustments
    let confidence = pattern.performance.confidence;
    
    // Boost confidence for profile-matching patterns
    if (this.isProfileMatch(pattern)) {
      confidence *= 1.2; // 20% boost for profile alignment
    }
    
    // Reduce confidence for old patterns (decay)
    const daysSinceLastSeen = (Date.now() - pattern.lastSeen) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen > 7) {
      confidence *= 0.9; // 10% decay after a week
    }
    
    return {
      confidence: Math.min(confidence, 0.95), // Cap at 95%
      reason: `${pattern.occurrences} occurrences, ${(pattern.performance.winRate * 100).toFixed(1)}% win rate`,
      profileMatch: this.isProfileMatch(pattern),
      pattern: pattern
    };
  }
  
  /**
   * Check if pattern matches current profile characteristics
   */
  isProfileMatch(pattern) {
    if (!pattern.profileMetadata) return true; // Legacy patterns
    
    const currentStyle = this.determineStyle(this.currentProfile);
    return pattern.profileMetadata.tradingStyle === currentStyle;
  }
  
  /**
   * Determine trading style from profile name
   */
  determineStyle(profileName) {
    const name = profileName.toLowerCase();
    
    if (name.includes('scalper')) return 'scalper';
    if (name.includes('swing')) return 'swing';
    if (name.includes('conservative')) return 'conservative';
    if (name.includes('quantum')) return 'quantum';
    if (name.includes('cosmic')) return 'cosmic';
    if (name.includes('aggressive')) return 'aggressive';
    
    return 'standard';
  }
  
  /**
   * Update pattern performance metrics
   */
  updatePatternPerformance(patternData) {
    const trades = patternData.trades;
    const wins = trades.filter(t => t.success).length;
    const losses = trades.length - wins;
    
    patternData.performance.wins = wins;
    patternData.performance.losses = losses;
    patternData.performance.winRate = trades.length > 0 ? wins / trades.length : 0;
    
    // Calculate average profit
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    patternData.performance.totalProfit = totalProfit;
    patternData.performance.avgProfit = trades.length > 0 ? totalProfit / trades.length : 0;
    
    // Calculate confidence based on performance and sample size
    const sampleSizeConfidence = Math.min(trades.length / 20, 1); // Max confidence at 20 trades
    const performanceConfidence = patternData.performance.winRate;
    patternData.performance.confidence = (sampleSizeConfidence * 0.3 + performanceConfidence * 0.7);
  }
  
  /**
   * Generate pattern key from features
   */
  generatePatternKey(features) {
    // Create a string representation of key features
    const keyComponents = [
      `rsi_${Math.round(features[0] * 10)}`,
      `macd_${features[1] > 0 ? 'pos' : 'neg'}`,
      `trend_${features[2]}`,
      `vol_${Math.round(features[4] * 1000)}`,
      `action_${features[8] || 0}`
    ];
    
    return keyComponents.join('_');
  }
  
  /**
   * Save patterns to profile-specific file
   */
  async savePatterns() {
    if (!this.currentProfile) return;
    
    const patternFile = this.getPatternFilePath(this.currentProfile);
    
    const data = {
      profile: this.currentProfile,
      lastUpdated: new Date().toISOString(),
      patternCount: this.patterns.size,
      patterns: Object.fromEntries(this.patterns),
      statistics: this.calculateStatistics()
    };
    
    try {
      await fs.writeFile(patternFile, JSON.stringify(data, null, 2));
      console.log(`💾 Saved ${this.patterns.size} patterns for ${this.currentProfile}`);
    } catch (error) {
      console.error(`❌ Error saving patterns for ${this.currentProfile}:`, error);
    }
  }
  
  /**
   * Calculate profile statistics
   */
  calculateStatistics() {
    let totalTrades = 0;
    let totalWins = 0;
    let totalProfit = 0;
    let highValuePatterns = 0;
    
    for (const [key, pattern] of this.patterns) {
      totalTrades += pattern.trades.length;
      totalWins += pattern.performance.wins;
      totalProfit += pattern.performance.totalProfit;
      
      if (pattern.performance.winRate > 0.6 && pattern.occurrences > 5) {
        highValuePatterns++;
      }
    }
    
    return {
      totalPatterns: this.patterns.size,
      totalTrades: totalTrades,
      overallWinRate: totalTrades > 0 ? totalWins / totalTrades : 0,
      totalProfit: totalProfit,
      avgProfitPerTrade: totalTrades > 0 ? totalProfit / totalTrades : 0,
      highValuePatterns: highValuePatterns,
      profileCharacteristics: {
        style: this.determineStyle(this.currentProfile),
        aggressiveness: this.currentProfile.includes('aggressive') ? 'high' : 'normal',
        complexity: this.currentProfile.includes('quantum') || this.currentProfile.includes('cosmic') ? 'advanced' : 'standard'
      }
    };
  }
  
  /**
   * Log pattern statistics
   */
  logPatternStats() {
    const stats = this.calculateStatistics();
    
    console.log(`
📊 PATTERN STATISTICS for ${this.currentProfile}:
├─ Total Patterns: ${stats.totalPatterns}
├─ Total Trades: ${stats.totalTrades}
├─ Overall Win Rate: ${(stats.overallWinRate * 100).toFixed(1)}%
├─ Avg Profit/Trade: ${(stats.avgProfitPerTrade * 100).toFixed(3)}%
├─ High-Value Patterns: ${stats.highValuePatterns}
└─ Profile Style: ${stats.profileCharacteristics.style}
    `);
  }
  
  /**
   * Ensure directory structure exists
   */
  async ensureDirectoryStructure() {
    try {
      await fs.mkdir(this.patternsDirectory, { recursive: true });
      
      // Create profile subdirectories for common profiles
      const commonProfiles = [
        'btc_scalper_quantum',
        'btc_scalper',
        'eth_scalper',
        'conservative',
        'balanced',
        'aggressive',
        'quantum_warrior',
        'cosmic_trader'
      ];
      
      // Ensure each profile has a patterns file
      for (const profile of commonProfiles) {
        const filePath = this.getPatternFilePath(profile);
        try {
          await fs.access(filePath);
        } catch {
          // File doesn't exist - create empty pattern file
          const emptyPatterns = {
            profile: profile,
            lastUpdated: new Date().toISOString(),
            patternCount: 0,
            patterns: {},
            statistics: {}
          };
          await fs.writeFile(filePath, JSON.stringify(emptyPatterns, null, 2));
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating pattern directories:', error);
    }
  }
  
  /**
   * Start auto-save interval
   */
  startAutoSave() {
    // Clear existing interval
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    // Save every 5 minutes
    this.saveInterval = setInterval(() => {
      this.savePatterns();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Switch to a different profile
   */
  async switchProfile(newProfile) {
    console.log(`🔄 Switching from ${this.currentProfile} to ${newProfile}`);
    
    // Save current patterns
    if (this.currentProfile) {
      await this.savePatterns();
    }
    
    // Load new profile
    await this.initialize(newProfile);
  }
  
  /**
   * Get profile comparison report
   */
  async getProfileComparison() {
    const profiles = [
      'btc_scalper_quantum',
      'btc_scalper',
      'conservative',
      'balanced'
    ];
    
    const comparison = {};
    
    for (const profile of profiles) {
      try {
        const patternFile = this.getPatternFilePath(profile);
        const data = await fs.readFile(patternFile, 'utf8');
        const profileData = JSON.parse(data);
        
        comparison[profile] = {
          patterns: profileData.patternCount || 0,
          winRate: profileData.statistics?.overallWinRate || 0,
          avgProfit: profileData.statistics?.avgProfitPerTrade || 0,
          highValuePatterns: profileData.statistics?.highValuePatterns || 0
        };
      } catch {
        comparison[profile] = { patterns: 0, winRate: 0, avgProfit: 0, highValuePatterns: 0 };
      }
    }
    
    return comparison;
  }
  
  /**
   * Export patterns for analysis
   */
  async exportPatterns(format = 'json') {
    const exportDir = path.join(process.cwd(), 'data', 'exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `${this.currentProfile}_patterns_${timestamp}.${format}`;
    const filepath = path.join(exportDir, filename);
    
    if (format === 'json') {
      const data = {
        profile: this.currentProfile,
        exported: new Date().toISOString(),
        patterns: Object.fromEntries(this.patterns),
        statistics: this.calculateStatistics()
      };
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = 'PatternKey,Occurrences,WinRate,AvgProfit,Confidence,FirstSeen,LastSeen\n';
      
      for (const [key, pattern] of this.patterns) {
        csv += `${key},${pattern.occurrences},${pattern.performance.winRate},${pattern.performance.avgProfit},${pattern.performance.confidence},${pattern.firstSeen},${pattern.lastSeen}\n`;
      }
      
      await fs.writeFile(filepath, csv);
    }
    
    console.log(`📤 Exported patterns to: ${filepath}`);
    return filepath;
  }
}

module.exports = ProfilePatternManager;