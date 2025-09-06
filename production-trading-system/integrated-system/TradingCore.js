/**
 * INTEGRATED TRADING CORE
 * Combines YOUR optimizations with production-ready structure
 */

// YOUR MODULES
const QuantumSignalClassifier = require('../../core/QuantumSignalClassifier');
const { QuantumOptimizer } = require('../../core/QuantumOptimizer');
const ProfitMaximizer = require('../../core/ProfitMaximizer');
const TurboBoostOptimizer = require('../../core/TurboBoostOptimizer');

// Production essentials
const EventEmitter = require('events');

class TradingCore extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // YOUR OPTIMIZERS - The stuff you built that's actually good
    this.signalClassifier = new QuantumSignalClassifier({
      maxHoldCount: 5,  // Your loop prevention
      dynamicHoldThreshold: true
    });
    
    this.optimizer = new QuantumOptimizer();  // Your speed optimizations
    this.profitMaximizer = new ProfitMaximizer();  // Your strategies
    this.turboBoost = new TurboBoostOptimizer();  // Your aggression scaling
    
    // Trading state
    this.balance = config.initialBalance || 10000;
    this.positions = [];
    this.priceHistory = [];
    this.currentPrice = null;
    this.lastTradeTime = 0;
    
    // Performance tracking
    this.trades = 0;
    this.wins = 0;
    this.losses = 0;
    this.totalPnL = 0;
    
    console.log('🚀 Trading Core Initialized with YOUR optimizations!');
  }

  /**
   * MAIN TRADING LOOP - Using YOUR systems
   */
  async processTick(marketData) {
    // Store price history
    this.currentPrice = marketData.price;
    this.priceHistory.push(marketData);
    if (this.priceHistory.length > 100) this.priceHistory.shift();
    
    // 1. USE YOUR QUANTUM OPTIMIZER for fast indicator calculation
    const indicators = this.optimizer.batchCalculateIndicators(this.priceHistory);
    
    // 2. USE YOUR PROFIT MAXIMIZER for strategy signals
    const profitSignal = await this.profitMaximizer.executeMasterStrategy(
      {
        currentPrice: this.currentPrice,
        candles: this.priceHistory
      },
      marketData.orderBook,
      { binance: this.currentPrice, coinbase: this.currentPrice * 1.001 }
    );
    
    // 3. USE YOUR SIGNAL CLASSIFIER to prevent loops
    if (profitSignal && profitSignal.primary) {
      const classifiedSignal = await this.signalClassifier.classifyQuantumSignal(
        {
          rsi: indicators.rsi[indicators.rsi.length - 1],
          macdHistogram: indicators.macd.histogram[indicators.macd.histogram.length - 1],
          volatility: this.calculateVolatility(),
          momentum: this.optimizer.calculateMomentum(this.priceHistory, 10),
          trend: this.optimizer.calculateTrend(this.priceHistory)
        },
        this.priceHistory,
        { quantumClassifyTradingSignal: async () => profitSignal.primary }
      );
      
      // 4. USE YOUR TURBO BOOST for position sizing
      if (classifiedSignal && classifiedSignal.action !== 'HOLD') {
        const turboExecution = await this.turboBoost.executeTurboTrade(
          classifiedSignal,
          {
            currentPrice: this.currentPrice,
            volatility: this.calculateVolatility(),
            currentBalance: this.balance,
            initialBalance: 10000,
            availableCapital: this.balance,
            priceHistory: this.priceHistory.map(p => p.price || p)
          },
          this.positions[0] // Current position if any
        );
        
        // Execute the trade
        if (turboExecution && this.canTrade()) {
          await this.executeTrade(turboExecution);
        }
      }
    }
    
    // Manage existing positions
    this.managePositions(marketData);
  }

  /**
   * EXECUTE TRADE - Using YOUR optimization logic
   */
  async executeTrade(signal) {
    // Check cooldown
    if (Date.now() - this.lastTradeTime < 15000) return; // 15 second cooldown
    
    // YOUR position sizing logic
    const optimalPosition = this.optimizer.calculateOptimalPosition(
      this.wins / (this.wins + this.losses + 1),
      100,  // avg win
      50,   // avg loss
      this.balance
    );
    
    // Apply YOUR turbo boost multipliers
    const finalSize = Math.min(
      signal.size || (this.balance * optimalPosition.percentage / 100),
      this.balance * 0.05  // Safety cap at 5%
    );
    
    const position = {
      id: Date.now().toString(),
      action: signal.action,
      entry: this.currentPrice,
      size: finalSize,
      stopLoss: this.currentPrice * (signal.action === 'BUY' ? 0.98 : 1.02),
      takeProfit: this.currentPrice * (signal.action === 'BUY' ? 1.03 : 0.97),
      confidence: signal.confidence,
      strategy: signal.strategy || 'INTEGRATED',
      openTime: Date.now()
    };
    
    this.positions.push(position);
    this.lastTradeTime = Date.now();
    this.trades++;
    
    console.log(`
🎯 TRADE EXECUTED (Using YOUR systems):
├─ Action: ${position.action}
├─ Entry: ${position.entry}
├─ Size: ${position.size.toFixed(2)}
├─ Confidence: ${(position.confidence * 100).toFixed(1)}%
├─ Aggression: ${signal.aggression?.multiplier?.toFixed(1)}x
├─ Loop Prevention: Active (${this.signalClassifier.holdCount} holds)
└─ Strategy: ${position.strategy}
    `);
    
    this.emit('trade', position);
    return position;
  }

  /**
   * MANAGE POSITIONS - Using YOUR smart exit logic
   */
  managePositions(marketData) {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const position = this.positions[i];
      
      if (position.status === 'CLOSED') continue;
      
      // Check YOUR turbo boost smart exits
      const exitSignal = this.turboBoost.smartExitStrategy(
        position,
        { holdCount: this.signalClassifier.holdCount },
        { currentPrice: this.currentPrice }
      );
      
      if (exitSignal.exit) {
        this.closePosition(position, exitSignal.reason);
      }
      // Standard stop/target checks
      else if (position.action === 'BUY') {
        if (this.currentPrice <= position.stopLoss) {
          this.closePosition(position, 'STOP_LOSS');
        } else if (this.currentPrice >= position.takeProfit) {
          this.closePosition(position, 'TAKE_PROFIT');
        }
      }
    }
  }

  /**
   * CLOSE POSITION
   */
  closePosition(position, reason) {
    const exitPrice = this.currentPrice;
    const pnl = position.action === 'BUY' ? 
      (exitPrice - position.entry) * position.size :
      (position.entry - exitPrice) * position.size;
    
    position.status = 'CLOSED';
    position.exitPrice = exitPrice;
    position.pnl = pnl;
    position.exitReason = reason;
    
    // Update stats
    if (pnl > 0) {
      this.wins++;
      this.turboBoost.trackPerformance({ profit: pnl }); // YOUR performance tracking
    } else {
      this.losses++;
    }
    this.totalPnL += pnl;
    this.balance += pnl;
    
    console.log(`
📊 POSITION CLOSED:
├─ Reason: ${reason}
├─ P&L: ${pnl > 0 ? '✅' : '❌'} ${pnl.toFixed(2)}
├─ Win Rate: ${(this.wins / (this.wins + this.losses) * 100).toFixed(1)}%
└─ Balance: ${this.balance.toFixed(2)}
    `);
    
    this.emit('positionClosed', position);
  }

  /**
   * HELPERS
   */
  canTrade() {
    // YOUR circuit breaker
    const loss = (10000 - this.balance) / 10000;
    const breaker = this.optimizer.circuitBreaker(loss);
    
    if (breaker.stop) {
      console.log('🚨 Circuit breaker activated!');
      return false;
    }
    
    // Position limit
    const openPositions = this.positions.filter(p => p.status !== 'CLOSED');
    if (openPositions.length >= 3) return false;
    
    return true;
  }
  
  calculateVolatility() {
    if (this.priceHistory.length < 20) return 0.01;
    return this.optimizer.calculateVolatility(this.priceHistory);
  }

  /**
   * GET STATUS - Shows YOUR optimizations working
   */
  getStatus() {
    const winRate = this.wins / (this.wins + this.losses + 1);
    const optimizerStatus = this.optimizer.getStatus();
    const classifierStatus = this.signalClassifier.getStatus();
    const turboStatus = this.turboBoost.trackPerformance({ profit: 0 });
    
    return {
      // Trading stats
      balance: this.balance,
      totalPnL: this.totalPnL,
      trades: this.trades,
      winRate: (winRate * 100).toFixed(1) + '%',
      
      // YOUR optimizer stats
      cacheHitRate: optimizerStatus.cacheHitRate,
      avgExecutionTime: optimizerStatus.avgExecutionTime,
      
      // YOUR loop prevention stats
      holdCount: classifierStatus.holdCount,
      maxHoldCount: classifierStatus.maxHoldCount,
      entropy: classifierStatus.entropy,
      
      // YOUR turbo boost stats
      tradesPerHour: turboStatus.current.tradesPerHour,
      profitImprovement: turboStatus.improvement?.profit?.toFixed(1) + '%',
      
      // Positions
      openPositions: this.positions.filter(p => p.status !== 'CLOSED').length
    };
  }
}

module.exports = TradingCore;