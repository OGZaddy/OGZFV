// MasterOrchestrator.js - Manages all 4 bots with unified architecture
const { Worker } = require('worker_threads');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Initialize Module Auto-Loader
const ModuleAutoLoader = require('./ModuleAutoLoader');
const moduleLoader = new ModuleAutoLoader();

// Load modules using auto-loader
const UnifiedTradingCore = moduleLoader.load('UnifiedTradingCore');
const TradingProfile = moduleLoader.load('TradingProfile');

class MasterOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.profiles = new Map();
    this.bots = new Map();
    this.workers = [];
    this.port = process.env.UNIFIED_PORT || 3010; // ALWAYS 3010
    
    // Pattern system shared across everything
    this.patternLibrary = null;
    
    // Unified logging to Archon
    this.archonUrl = process.env.ARCHON_API_URL || 'http://localhost:8181';
    
    // Bot configurations for the 4 tiers
    this.botConfigs = {
      'bot-starter': {
        tier: 'tier1',
        pm2Name: 'bot-starter',
        file: 'bot-starter-tier.js',
        maxRisk: 0.01,
        features: ['basic_trading', 'paper_trading', 'basic_indicators']
      },
      'bot-pro': {
        tier: 'tier2',
        pm2Name: 'bot-pro',
        file: 'bot-pro-tier.js',
        maxRisk: 0.02,
        features: ['tier1', 'timeGAN', 'gann_analysis', 'advanced_patterns']
      },
      'bot-elite': {
        tier: 'tier3',
        pm2Name: 'bot-elite',
        file: 'bot-elite-tier.js',
        maxRisk: 0.03,
        features: ['tier2', 'neural_mesh', 'quantum_gan', 'divine_modules']
      },
      'quantum-beast': {
        tier: 'quantum',
        pm2Name: 'quantum-beast',
        file: 'run-trading-bot-v13-quantum.js',
        maxRisk: 0.05,
        features: ['quantum_algorithms', 'neuromorphic', 'reality_bending']
      }
    };
    
    // Initialize worker pool for parallel backtesting
    this.initializeWorkerPool();
  }
  
  async initialize() {
    console.log('🚀 Initializing Master Orchestrator');
    
    // Load pattern library
    try {
      const PatternLibrary = require('./PatternLibrary');
      this.patternLibrary = new PatternLibrary();
      await this.patternLibrary.load();
    } catch (error) {
      console.log('Pattern library not found, continuing without it');
    }
    
    // Create default profiles for each bot
    await this.createDefaultProfiles();
    
    // Log to Archon
    await this.logToArchon({
      event: 'orchestrator_initialized',
      bots: Object.keys(this.botConfigs),
      timestamp: Date.now()
    });
    
    console.log('✅ Master Orchestrator initialized');
  }
  
  async createDefaultProfiles() {
    for (const [botName, config] of Object.entries(this.botConfigs)) {
      // Check if profile exists
      const profileName = `${botName}-default`;
      let profile;
      
      try {
        profile = await TradingProfile.load(profileName);
      } catch (error) {
        // Create new profile
        profile = this.createProfile(profileName, {
          tier: config.tier,
          maxRisk: config.maxRisk,
          features: config.features,
          weights: this.getDefaultWeights(config.tier)
        });
        await profile.save();
      }
      
      this.profiles.set(botName, profile);
    }
  }
  
  getDefaultWeights(tier) {
    const weights = {
      tier1: {
        execution: 0.5,
        basics: 0.3,
        indicators: 0.2
      },
      tier2: {
        execution: 0.2,
        timeGAN: 0.25,
        gann: 0.25,
        patterns: 0.3
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
        sb2: 0.2,
        visa: 0.2,
        quantum: 0.3
      }
    };
    
    return weights[tier] || weights.tier1;
  }
  
  // Create profile that automatically propagates to all systems
  createProfile(name, config) {
    const profile = new TradingProfile(name, config);
    
    // Link pattern system if available
    if (this.patternLibrary) {
      profile.patterns = this.patternLibrary.getPatterns(config.patternSet || 'default');
    }
    
    this.profiles.set(name, profile);
    return profile;
  }
  
  // Launch live bot with profile
  async launchBot(botName, mode = 'LIVE') {
    const profile = this.profiles.get(botName);
    if (!profile) {
      throw new Error(`No profile found for ${botName}`);
    }
    
    console.log(`🤖 Launching ${botName} in ${mode} mode`);
    
    // Create unified core with profile
    const bot = new UnifiedTradingCore({
      ...profile,
      mode: mode,
      name: botName
    });
    
    // Initialize the bot
    await bot.loadModules();
    
    this.bots.set(botName, bot);
    
    // Log to Archon
    await this.logToArchon({
      event: 'bot_launched',
      bot: botName,
      mode: mode,
      tier: profile.tier,
      modules: bot.getState().modules
    });
    
    return bot;
  }
  
  // Stop a bot
  async stopBot(botName) {
    const bot = this.bots.get(botName);
    if (bot) {
      await bot.shutdown();
      this.bots.delete(botName);
      console.log(`🛑 Stopped ${botName}`);
    }
  }
  
  // Initialize worker pool for parallel backtesting
  initializeWorkerPool() {
    const numCores = 24; // Your beast machine
    
    for (let i = 0; i < numCores; i++) {
      this.workers.push({
        id: i,
        busy: false,
        worker: null
      });
    }
    
    console.log(`💪 Initialized ${numCores} worker threads for parallel backtesting`);
  }
  
  // Run parallel backtests with auto-inherited modules
  async massBacktest(configurations, historicalData) {
    console.log(`🔥 Starting massive parallel backtest with ${configurations.length} configs`);
    
    const chunks = this.splitDataIntoChunks(historicalData, this.workers.length);
    const results = [];
    const promises = [];
    
    for (let i = 0; i < configurations.length; i++) {
      const config = configurations[i];
      const workerIndex = i % this.workers.length;
      
      promises.push(
        this.runWorkerBacktest(workerIndex, config, chunks[workerIndex])
      );
    }
    
    const backtestResults = await Promise.all(promises);
    
    // Aggregate and sort results
    const sortedResults = backtestResults.sort((a, b) => {
      // Sort by Sharpe ratio (risk-adjusted returns)
      return b.metrics.sharpe - a.metrics.sharpe;
    });
    
    // Log best configurations to Archon
    await this.logToArchon({
      event: 'backtest_complete',
      total_configs: configurations.length,
      best_config: sortedResults[0],
      top_5: sortedResults.slice(0, 5).map(r => ({
        profile: r.profile,
        sharpe: r.metrics.sharpe,
        winRate: r.metrics.winRate
      }))
    });
    
    return sortedResults;
  }
  
  // Run backtest on worker thread
  async runWorkerBacktest(workerIndex, config, data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'BacktestWorker.js'), {
        workerData: {
          config: config,
          data: data,
          workerId: workerIndex
        }
      });
      
      worker.on('message', (result) => {
        resolve(result);
        worker.terminate();
      });
      
      worker.on('error', reject);
      
      this.workers[workerIndex].worker = worker;
      this.workers[workerIndex].busy = true;
    });
  }
  
  // Split data for parallel processing
  splitDataIntoChunks(data, numChunks) {
    const chunkSize = Math.ceil(data.length / numChunks);
    const chunks = [];
    
    for (let i = 0; i < numChunks; i++) {
      chunks.push(data.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    
    return chunks;
  }
  
  // Hyperparameter optimization
  async optimizeParameters(botName, historicalData) {
    console.log(`🔧 Optimizing parameters for ${botName}`);
    
    const configurations = [];
    const baseProfile = this.profiles.get(botName);
    
    // Generate test configurations
    for (let timeganWeight = 0.1; timeganWeight <= 1; timeganWeight += 0.2) {
      for (let gannWeight = 0.1; gannWeight <= 1; gannWeight += 0.2) {
        for (let confidence = 0.5; confidence <= 0.9; confidence += 0.1) {
          configurations.push({
            ...baseProfile.exportForBacktest(),
            weights: {
              ...baseProfile.weights,
              timeGAN: timeganWeight,
              gann: gannWeight
            },
            config: {
              ...baseProfile.config,
              confidenceThreshold: confidence
            }
          });
        }
      }
    }
    
    // Run parallel backtests
    const results = await this.massBacktest(configurations, historicalData);
    
    // Update profile with best configuration
    const best = results[0];
    baseProfile.weights = best.config.weights;
    baseProfile.config = best.config.config;
    await baseProfile.save();
    
    console.log(`✅ Optimization complete. Best Sharpe: ${best.metrics.sharpe}`);
    
    return best;
  }
  
  // Genetic algorithm for strategy evolution
  async evolveStrategies(generations = 50) {
    console.log(`🧬 Starting genetic evolution for ${generations} generations`);
    
    let population = this.generateInitialPopulation(100);
    
    for (let gen = 0; gen < generations; gen++) {
      // Test entire population in parallel
      const fitness = await this.evaluatePopulation(population);
      
      // Natural selection - keep top 20%
      const survivors = this.selectBest(population, fitness, 0.2);
      
      // Mutation and crossover
      population = this.mutateAndCrossover(survivors, 100);
      
      console.log(`Generation ${gen}: Best fitness = ${fitness[0].fitness}`);
      
      // Save best strategy
      if (gen % 10 === 0) {
        const bestStrategy = population[0];
        await this.saveStrategy(bestStrategy, `evolved_gen${gen}`);
      }
    }
    
    return population[0]; // Return the ultimate strategy
  }
  
  generateInitialPopulation(size) {
    const population = [];
    
    for (let i = 0; i < size; i++) {
      population.push({
        id: i,
        genes: {
          timeGAN: Math.random(),
          gann: Math.random(),
          neuralMesh: Math.random(),
          confidence: 0.5 + Math.random() * 0.4,
          riskPerTrade: 0.01 + Math.random() * 0.04
        }
      });
    }
    
    return population;
  }
  
  async evaluatePopulation(population) {
    // Evaluate fitness in parallel
    const evaluations = population.map(individual => ({
      ...individual,
      fitness: this.calculateFitness(individual)
    }));
    
    return evaluations.sort((a, b) => b.fitness - a.fitness);
  }
  
  calculateFitness(individual) {
    // Simplified fitness function
    const sharpe = individual.genes.timeGAN * 0.3 + 
                   individual.genes.gann * 0.3 + 
                   individual.genes.neuralMesh * 0.4;
    
    const riskPenalty = individual.genes.riskPerTrade > 0.03 ? 0.5 : 1;
    
    return sharpe * riskPenalty;
  }
  
  selectBest(population, fitness, keepRatio) {
    const keepCount = Math.floor(population.length * keepRatio);
    return fitness.slice(0, keepCount).map(f => f);
  }
  
  mutateAndCrossover(survivors, targetSize) {
    const newPopulation = [...survivors];
    
    while (newPopulation.length < targetSize) {
      // Select two parents
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];
      
      // Crossover
      const child = {
        id: newPopulation.length,
        genes: {}
      };
      
      Object.keys(parent1.genes).forEach(key => {
        // Random crossover point
        child.genes[key] = Math.random() > 0.5 ? parent1.genes[key] : parent2.genes[key];
        
        // Mutation (10% chance)
        if (Math.random() < 0.1) {
          child.genes[key] += (Math.random() - 0.5) * 0.2;
          child.genes[key] = Math.max(0, Math.min(1, child.genes[key]));
        }
      });
      
      newPopulation.push(child);
    }
    
    return newPopulation;
  }
  
  async saveStrategy(strategy, name) {
    const strategyPath = path.join(__dirname, '..', 'strategies', `${name}.json`);
    await fs.mkdir(path.dirname(strategyPath), { recursive: true });
    await fs.writeFile(strategyPath, JSON.stringify(strategy, null, 2));
  }
  
  // Log to Archon for learning
  async logToArchon(data) {
    try {
      await fetch(`${this.archonUrl}/api/knowledge/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'orchestrator_event',
          source: 'master_orchestrator',
          content: data,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      // Don't crash if Archon is down
      console.error('Archon logging failed:', error.message);
    }
  }
  
  // Get status of all bots
  getStatus() {
    const status = {
      orchestrator: 'running',
      port: this.port,
      bots: {},
      workers: {
        total: this.workers.length,
        busy: this.workers.filter(w => w.busy).length
      }
    };
    
    for (const [name, bot] of this.bots) {
      status.bots[name] = bot.getState();
    }
    
    return status;
  }
  
  // Shutdown everything
  async shutdown() {
    console.log('🛑 Shutting down Master Orchestrator');
    
    // Stop all bots
    for (const [name, bot] of this.bots) {
      await bot.shutdown();
    }
    
    // Terminate workers
    for (const worker of this.workers) {
      if (worker.worker) {
        worker.worker.terminate();
      }
    }
    
    this.emit('shutdown');
  }
}

module.exports = MasterOrchestrator;