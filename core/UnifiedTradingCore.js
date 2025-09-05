// UnifiedTradingCore.js - THE SINGLE SOURCE OF TRUTH
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Initialize Module Auto-Loader
const ModuleAutoLoader = require('./ModuleAutoLoader');

class UnifiedTradingCore extends EventEmitter {
  constructor(profile) {
    super();
    this.profile = profile;
    this.modules = new Map();
    this.patterns = new Map();
    this.mode = profile.mode || 'LIVE'; // 'LIVE' | 'PAPER' | 'BACKTEST'
    this.port = process.env.UNIFIED_PORT || 3010; // ALWAYS USE 3010
    
    // Module auto-loader instance - NO HARDCODED PATHS
    this.moduleLoader = new ModuleAutoLoader();
    
    // Load modules based on profile
    this.loadModules();
  }
  
  async loadModules() {
    console.log(`🔧 Loading modules for ${this.profile.name} in ${this.mode} mode`);
    
    // Use auto-loader to get available modules
    const availableModules = await this.moduleLoader.discover();
    
    // Module manifest defines what each tier gets
    const moduleManifest = {
      tier1: {
        execution: 'ExecutionLayer',
        basics: 'BasicTrading',
        indicators: 'BasicIndicators'
      },
      tier2: {
        timeGAN: 'ogz_timegan_js',
        gann: 'ogz_gann_js',
        patterns: 'AdvancedPatterns',
        multiExchange: 'MultiExchangeManager'
      },
      tier3: {
        neuralMesh: 'NeuralMeshCore',
        quantumGAN: 'quantum-gan-angam-tensorflow',
        divine: 'DivineModuleIntegration',
        reality: 'RealityBendingMode'
      },
      quantum: {
        neuromorphic: 'QuantumNeuromorphicCore',
        sb2: 'SB2Algorithm',
        visa: 'VISAAlgorithm',
        ssbm: 'SSBMAlgorithm',
        vector: 'VectorAnnealing',
        qnd: 'QNDDiffusion'
      }
    };
    
    // Load modules based on profile tiers
    for (const [tier, modules] of Object.entries(moduleManifest)) {
      if (this.profile.tiers.includes(tier)) {
        for (const [name, moduleName] of Object.entries(modules)) {
          // Use auto-loader, NOT require()
          const Module = await this.moduleLoader.load(moduleName);
          if (Module) {
            const config = this.profile.config[name] || {};
            this.modules.set(name, new Module({
              ...config,
              port: this.port, // ENFORCE UNIFIED PORT
              mode: this.mode
            }));
            console.log(`   ✅ Loaded ${name} (${tier})`);
          }
        }
      }
    }
    
    this.emit('modules_loaded', Array.from(this.modules.keys()));
  }
  
  // THIS METHOD IS USED BY BOTH BOT AND BACKTESTER
  async processMarketData(data) {
    // EXACT SAME LOGIC regardless of mode
    const signals = await this.generateSignals(data);
    const decision = await this.makeDecision(signals);
    
    // Log to Archon for learning
    await this.logToArchon({
      type: 'market_processing',
      mode: this.mode,
      signals,
      decision,
      timestamp: Date.now()
    });
    
    return this.executeTrade(decision, data);
  }
  
  async generateSignals(data) {
    const signals = {};
    const enabledModules = this.getEnabledModules();
    
    // Run all enabled modules in parallel
    const promises = enabledModules.map(async ([name, module]) => {
      try {
        const signal = await module.analyze(data);
        return { name, signal };
      } catch (error) {
        console.error(`Module ${name} error:`, error);
        return { name, signal: null };
      }
    });
    
    const results = await Promise.all(promises);
    
    // Aggregate signals
    results.forEach(({ name, signal }) => {
      if (signal) {
        signals[name] = signal;
      }
    });
    
    return signals;
  }
  
  async makeDecision(signals) {
    // Weighted voting based on profile config
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const [moduleName, signal] of Object.entries(signals)) {
      const weight = this.profile.weights?.[moduleName] || 1.0;
      totalWeight += weight;
      
      // Convert signal to score (-1 to 1)
      const score = this.normalizeSignal(signal);
      weightedScore += score * weight;
    }
    
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    return {
      action: finalScore > 0.3 ? 'BUY' : finalScore < -0.3 ? 'SELL' : 'HOLD',
      confidence: Math.abs(finalScore),
      signals,
      finalScore
    };
  }
  
  normalizeSignal(signal) {
    // Convert various signal formats to -1 to 1 scale
    if (typeof signal === 'number') {
      return Math.max(-1, Math.min(1, signal));
    }
    if (signal.action === 'BUY') return signal.confidence || 0.5;
    if (signal.action === 'SELL') return -(signal.confidence || 0.5);
    return 0;
  }
  
  
  async executeTrade(decision, data) {
    // Live trading mode - real execution
    if (decision.action === 'HOLD') {
      return { mode: 'LIVE', action: 'HOLD' };
    }
    
    // Use execution layer module if available
    const executor = this.modules.get('execution');
    if (executor) {
      return await executor.execute(decision, data);
    }
    
    throw new Error('No execution module available for live trading');
  }
  
  
  getEnabledModules() {
    return Array.from(this.modules.entries()).filter(([name, module]) => {
      // Check if module is enabled for current tier
      return this.isModuleEnabled(name);
    });
  }
  
  isModuleEnabled(moduleName) {
    // Check feature flags
    const flags = this.profile.featureFlags || {};
    if (flags[moduleName] === false) return false;
    
    // Check if module is in current tier
    return this.modules.has(moduleName);
  }
  
  async logToArchon(data) {
    // Send to Archon for learning
    try {
      const archonUrl = process.env.ARCHON_API_URL || 'http://localhost:8181';
      await fetch(`${archonUrl}/api/knowledge/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trading_activity',
          source: `unified_core_${this.profile.name}`,
          content: data
        })
      });
    } catch (error) {
      // Don't crash if Archon is down
      console.error('Archon logging failed:', error.message);
    }
  }
  
  // Dynamic module updates
  async reloadModule(moduleName) {
    console.log(`🔄 Reloading module: ${moduleName}`);
    
    // Unload old module
    const oldModule = this.modules.get(moduleName);
    if (oldModule && oldModule.cleanup) {
      await oldModule.cleanup();
    }
    
    // Load fresh module using auto-loader
    const Module = await this.moduleLoader.load(moduleName);
    if (Module) {
      const config = this.profile.config[moduleName] || {};
      this.modules.set(moduleName, new Module({
        ...config,
        port: this.port,
        mode: this.mode
      }));
      
      this.emit('module_reloaded', moduleName);
    }
  }
  
  // Get current state for monitoring
  getState() {
    return {
      profile: this.profile.name,
      mode: this.mode,
      tier: this.profile.tier,
      modules: Array.from(this.modules.keys()),
      port: this.port,
      uptime: process.uptime()
    };
  }
  
  // Cleanup
  async shutdown() {
    console.log('🛑 Shutting down UnifiedTradingCore');
    
    // Cleanup all modules
    for (const [name, module] of this.modules) {
      if (module.cleanup) {
        await module.cleanup();
      }
    }
    
    this.modules.clear();
    this.emit('shutdown');
  }
}

module.exports = UnifiedTradingCore;