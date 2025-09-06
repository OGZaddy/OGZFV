// RegertsEngine.js - Master controller for No Raegerts Mode
const EventEmitter = require('events');
const LostHopesUI = require('./lost-hopes-ui');
const VoiceManager = require('./voice-manager');
const RegertsFinalDescent = require('./regerts-final-descent');
const NoRaegertsLeaderboard = require('./leaderboard');

class RegertsEngine extends EventEmitter {
  constructor(tradingBrain) {
    super();
    
    this.tradingBrain = tradingBrain;
    this.isActive = false;
    this.sessionStats = {
      tradesExecuted: 0,
      totalDegeneracy: 0,
      lowestLogic: 100,
      highestDegeneracy: 0,
      timeInMode: 0,
      profitLoss: 0
    };
    
    // Initialize components
    this.ui = new LostHopesUI();
    this.voiceManager = new VoiceManager();
    this.finalDescent = new RegertsFinalDescent(tradingBrain, this.voiceManager);
    this.leaderboard = new NoRaegertsLeaderboard(); // 🏆 HOOKUP: Leaderboard for prizes!
    
    // Configuration
    this.config = {
      autoTriggerAt99: true,
      degeneracyDecayRate: 0.5,
      tradeBoostMultiplier: 1.5,
      disableStopLoss: false,
      voicePackPath: './voices/',
      enableChoppedAndScrewed: true
    };
    
    // Setup connections
    this.setupConnections();
  }

  // Initialize the entire system
  async initialize(container) {
    console.log('🔥 Initializing Regerts Engine...');
    
    try {
      // Load voice pack
      await this.voiceManager.loadVoices(this.config.voicePackPath);
      
      // Initialize UI
      this.ui.init(container);
      this.ui.setVoiceManager(this.voiceManager);
      
      // Connect UI to final descent
      this.ui.onFinalDescent = () => {
        if (this.config.autoTriggerAt99) {
          this.triggerFinalDescent();
        }
      };
      
      console.log('✅ Regerts Engine initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Regerts Engine:', error);
      this.emit('error', error);
    }
  }

  // Setup event connections between components
  setupConnections() {
    // Trading brain events
    if (this.tradingBrain) {
      this.tradingBrain.on('trade-executed', (trade) => {
        if (this.isActive) {
          this.onTradeExecuted(trade);
        }
      });
      
      this.tradingBrain.on('analysis-complete', (analysis) => {
        if (this.isActive) {
          this.onAnalysisComplete(analysis);
        }
      });
    }
    
    // Final descent events
    this.finalDescent.on('regerts-trade', (tradeParams) => {
      this.emit('execute-trade', tradeParams);
    });
    
    this.finalDescent.on('descent-complete', () => {
      this.onDescentComplete();
    });
  }

  // Activate No Raegerts Mode
  activate(options = {}) {
    if (this.isActive) {
      console.log('⚠️ Regerts Mode already active');
      return;
    }
    
    console.log('💀 ACTIVATING NO RAEGERTS MODE');
    this.isActive = true;
    this.sessionStats.startTime = Date.now();
    
    // Merge options with config
    Object.assign(this.config, options);
    
    // Activate UI
    this.ui.activate();
    
    // Modify trading parameters
    this.modifyTradingBehavior();
    
    // Emit activation event
    this.emit('activated', {
      timestamp: Date.now(),
      config: this.config
    });
    
    // Start background processes
    this.startBackgroundProcesses();
  }

  // Deactivate the mode
  deactivate() {
    if (!this.isActive) return;
    
    console.log('💀 DEACTIVATING NO RAEGERTS MODE');
    this.isActive = false;
    
    // Calculate session stats
    this.sessionStats.timeInMode = Date.now() - this.sessionStats.startTime;
    
    // 🏆 HOOKUP: Submit run to leaderboard!
    const runData = {
      timeToZero: Math.floor(this.sessionStats.timeInMode / 1000), // Convert to seconds
      maxDegeneracy: this.sessionStats.highestDegeneracy,
      biggestLoss: Math.abs(Math.min(0, this.sessionStats.profitLoss)), // Track biggest loss
      totalTrades: this.sessionStats.tradesExecuted,
      timeTo999: this.sessionStats.timeTo999 || Infinity,
      voiceLinesTriggered: this.voiceManager.getTriggeredCount ? this.voiceManager.getTriggeredCount() : 0,
      finalMessage: this.ui.getFinalMessage ? this.ui.getFinalMessage() : "No ragrets"
    };
    
    const username = this.config.username || 'Anonymous_Degen';
    const result = this.leaderboard.submitRun(username, runData);
    
    console.log(`\n🏆 LEADERBOARD SUBMISSION:`);
    console.log(`   Rank: #${result.rank}`);
    console.log(`   Score: ${result.entry.score}`);
    if (result.beaten.length > 0) {
      console.log(`   🔥 ACHIEVEMENTS: ${result.beaten.join(', ')}`);
    }
    
    // Deactivate UI
    this.ui.deactivate();
    
    // Restore normal trading parameters
    this.restoreTradingBehavior();
    
    // Stop background processes
    this.stopBackgroundProcesses();
    
    // Play exit voice line
    this.voiceManager.play('i_warned_you');
    
    // Emit deactivation event with stats
    this.emit('deactivated', {
      timestamp: Date.now(),
      stats: { ...this.sessionStats }
    });
    
    // Log session summary
    this.logSessionSummary();
  }

  // Toggle mode
  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
    return this.isActive;
  }

  // Modify trading behavior for maximum degeneracy
  modifyTradingBehavior() {
    if (!this.tradingBrain) return;
    
    // Store original values
    this.originalConfig = {
      riskPerTrade: this.tradingBrain.config.riskPerTrade,
      stopLossEnabled: this.tradingBrain.config.stopLossEnabled,
      confidenceThreshold: this.tradingBrain.config.confidenceThreshold
    };
    
    // Apply degeneracy modifications
    this.tradingBrain.config.riskPerTrade *= this.config.tradeBoostMultiplier;
    this.tradingBrain.config.stopLossEnabled = !this.config.disableStopLoss;
    this.tradingBrain.config.confidenceThreshold *= 0.5; // Lower standards
    
    console.log('📉 Trading behavior modified for maximum degeneracy');
  }

  // Restore normal trading behavior
  restoreTradingBehavior() {
    if (!this.tradingBrain || !this.originalConfig) return;
    
    Object.assign(this.tradingBrain.config, this.originalConfig);
    console.log('📈 Trading behavior restored to normal');
  }

  // Handle trade execution in regerts mode
  onTradeExecuted(trade) {
    this.sessionStats.tradesExecuted++;
    
    // Update UI
    this.ui.onTradeExecuted();
    
    // Play appropriate voice line
    const voiceOptions = [
      'trade_sent',
      'emotional_trading',
      'bird_deployed'
    ];
    
    const randomVoice = voiceOptions[Math.floor(Math.random() * voiceOptions.length)];
    this.voiceManager.play(randomVoice);
    
    // Track stats
    const state = this.ui.getState();
    this.sessionStats.totalDegeneracy += state.degeneracyLevel;
    this.sessionStats.lowestLogic = Math.min(this.sessionStats.lowestLogic, state.logicLevel);
    this.sessionStats.highestDegeneracy = Math.max(this.sessionStats.highestDegeneracy, state.degeneracyLevel);
    
    // 💀 HOOKUP: Track time to 99.9% for leaderboard
    if (state.degeneracyLevel >= 99.9 && !this.sessionStats.timeTo999) {
      this.sessionStats.timeTo999 = Math.floor((Date.now() - this.sessionStats.startTime) / 1000);
      console.log(`💀 HIT 99.9% DEGENERACY IN ${this.sessionStats.timeTo999} SECONDS!`);
    }
    
    // Check if we should trigger special events
    if (state.degeneracyLevel >= 99.9 && !this.finalDescentTriggered) {
      this.triggerFinalDescent();
    }
  }

  // Handle analysis completion
  onAnalysisComplete(analysis) {
    if (!this.isActive) return;
    
    // Add degeneracy bias to analysis
    const state = this.ui.getState();
    const degeneracyBias = state.degeneracyLevel / 100;
    
    // Make the bot more aggressive based on degeneracy
    if (analysis.confidence) {
      analysis.confidence += degeneracyBias * 0.3;
      analysis.confidence = Math.min(analysis.confidence, 1);
    }
    
    // Override cautious signals when degeneracy is high
    if (state.degeneracyLevel > 80 && analysis.signal === 'WAIT') {
      analysis.signal = analysis.trend > 0 ? 'BUY' : 'SELL';
      analysis.reason = 'DEGENERACY_OVERRIDE';
      
      this.voiceManager.play('emotional_trading');
    }
  }

  // Trigger the final descent sequence
  async triggerFinalDescent() {
    if (this.finalDescentTriggered) return;
    this.finalDescentTriggered = true;
    
    console.log('🚀 TRIGGERING FINAL DESCENT SEQUENCE');
    
    // Get current market state
    const currentState = this.tradingBrain ? 
      await this.tradingBrain.getCurrentState() : 
      { price: 100, trend: 1, symbol: 'DEGEN/USD' };
    
    // Trigger the sequence
    await this.finalDescent.trigger(currentState);
  }

  // Handle descent completion
  onDescentComplete() {
    console.log('💀 Final descent complete');
    
    // Optional: Auto-deactivate after final descent
    setTimeout(() => {
      if (this.config.autoDeactivateAfterDescent) {
        this.deactivate();
      }
    }, 5000);
  }

  // Start background processes
  startBackgroundProcesses() {
    // Periodic voice taunts
    this.tauntInterval = setInterval(() => {
      if (!this.isActive) return;
      
      const state = this.ui.getState();
      
      // Random taunts based on state
      if (Math.random() > 0.9) {
        if (state.logicLevel < 20) {
          this.voiceManager.playRandom('commentary');
        } else if (state.degeneracyLevel > 70) {
          this.voiceManager.play('degeneracy_detected');
        }
      }
    }, 30000); // Every 30 seconds
    
    // Degeneracy acceleration
    this.accelerationInterval = setInterval(() => {
      if (!this.isActive) return;
      
      const state = this.ui.getState();
      
      // Accelerate degeneracy if no trades in last minute
      const timeSinceLastTrade = Date.now() - (this.lastTradeTime || this.sessionStats.startTime);
      if (timeSinceLastTrade > 60000) {
        this.ui.degeneracyLevel = Math.min(100, this.ui.degeneracyLevel + 2);
        this.ui.updateMeters(this.ui.logicLevel, this.ui.degeneracyLevel);
      }
    }, 5000);
  }

  // Stop background processes
  stopBackgroundProcesses() {
    clearInterval(this.tauntInterval);
    clearInterval(this.accelerationInterval);
  }

  // Log session summary
  logSessionSummary() {
    const duration = Math.floor(this.sessionStats.timeInMode / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log('\n💀 NO RAEGERTS MODE SESSION SUMMARY 💀');
    console.log('=====================================');
    console.log(`Duration: ${minutes}m ${seconds}s`);
    console.log(`Trades Executed: ${this.sessionStats.tradesExecuted}`);
    console.log(`Lowest Logic: ${this.sessionStats.lowestLogic.toFixed(1)}%`);
    console.log(`Highest Degeneracy: ${this.sessionStats.highestDegeneracy.toFixed(1)}%`);
    console.log(`Average Degeneracy: ${(this.sessionStats.totalDegeneracy / Math.max(1, this.sessionStats.tradesExecuted)).toFixed(1)}%`);
    console.log('=====================================\n');
  }

  // Get current state
  getState() {
    return {
      isActive: this.isActive,
      uiState: this.ui.getState(),
      sessionStats: { ...this.sessionStats },
      config: { ...this.config }
    };
  }
  
  // 🏆 HOOKUP: Get leaderboard data
  getLeaderboard() {
    const weekly = this.leaderboard.getWeeklyLeaderboard();
    console.log('\n🏆 NORAEGERTS WEEKLY LEADERBOARD 🏆');
    console.log('=====================================');
    console.log('TOP DEGENS (Overall Score):');
    weekly.overall.slice(0, 5).forEach((entry, i) => {
      console.log(`  ${i+1}. ${entry.username} - Score: ${entry.score}`);
    });
    console.log('\nFASTEST BLOWUPS:');
    weekly.speedrun.slice(0, 3).forEach((entry, i) => {
      console.log(`  ${i+1}. ${entry.username} - ${entry.timeToZero}s`);
    });
    console.log('\nMAX DEGENERACY:');
    weekly.degeneracy.slice(0, 3).forEach((entry, i) => {
      console.log(`  ${i+1}. ${entry.username} - ${entry.maxDegeneracy.toFixed(1)}%`);
    });
    console.log('=====================================\n');
    return weekly;
  }

  // Configure the engine
  configure(options) {
    Object.assign(this.config, options);
    return this.config;
  }

  // Force trigger specific events (for testing)
  forceEvent(eventName, ...args) {
    switch (eventName) {
      case 'overflow':
        this.ui.triggerOverflowSequence();
        break;
      case 'final-descent':
        this.triggerFinalDescent();
        break;
      case 'trade':
        this.onTradeExecuted({ symbol: 'TEST', direction: 'BUY', size: 100 });
        break;
      default:
        console.warn(`Unknown event: ${eventName}`);
    }
  }

  // Integration helper for existing systems
  static createMiddleware(tradingBrain) {
    const engine = new RegertsEngine(tradingBrain);
    
    return {
      engine,
      
      // Express middleware example
      expressMiddleware: (req, res, next) => {
        req.ragertsEngine = engine;
        next();
      },
      
      // WebSocket handler example
      wsHandler: (ws) => {
        ws.on('message', (msg) => {
          try {
            const data = JSON.parse(msg);
            if (data.type === 'TOGGLE_REGERTS') {
              engine.toggle();
              ws.send(JSON.stringify({
                type: 'REGERTS_STATUS',
                active: engine.isActive,
                state: engine.getState()
              }));
            }
          } catch (e) {
            console.error('WS error:', e);
          }
        });
      },
      
      // CLI commands
      commands: {
        'regerts': () => engine.toggle(),
        'regerts-status': () => console.log(engine.getState()),
        'regerts-stats': () => engine.logSessionSummary(),
        'regerts-overflow': () => engine.forceEvent('overflow'),
        'regerts-descent': () => engine.forceEvent('final-descent')
      }
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegertsEngine;
}