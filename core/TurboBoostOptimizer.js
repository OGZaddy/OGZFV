// TURBO BOOST OPTIMIZER - CAPITALIZE ON YOUR LOOP PREVENTION SUCCESS
// Since the loop prevention is crushing it, let's 10x that advantage!

class TurboBoostOptimizer {
  constructor() {
    this.performanceBaseline = {
      preOptimization: {
        tradesPerHour: 5,
        winRate: 0.45,
        avgProfit: 50
      },
      current: {
        tradesPerHour: 0,
        winRate: 0,
        avgProfit: 0
      }
    };
    
    this.startTime = Date.now();
    this.trades = [];
  }

  /**
   * AGGRESSION MULTIPLIER
   * Since loop prevention works, be MORE aggressive when signals are clear
   */
  aggressionMultiplier(signal, marketConditions) {
    console.log('🔥 AGGRESSION MODE: ACTIVATED');
    
    // Base multiplier
    let multiplier = 1.0;
    
    // If we broke out of a hold loop, that's a STRONG signal
    if (signal.fallback && signal.confidence > 0.3) {
      multiplier *= 2.0; // DOUBLE DOWN on loop breakouts
      console.log('💪 LOOP BREAKOUT DETECTED - DOUBLING POSITION!');
    }
    
    // If multiple timeframes agree after breaking loop
    if (signal.multiTimeframeAlignment > 0.7) {
      multiplier *= 1.5;
      console.log('📊 MULTI-TIMEFRAME ALIGNMENT - 1.5x BOOST!');
    }
    
    // If volatility is low (easier to predict)
    if (marketConditions.volatility < 0.01) {
      multiplier *= 1.3;
      console.log('🎯 LOW VOLATILITY - PRECISION STRIKE!');
    }
    
    // If we're on a win streak
    const recentWins = this.getRecentWinStreak();
    if (recentWins >= 3) {
      multiplier *= 1.2;
      console.log(`🏆 ${recentWins} WIN STREAK - RIDING THE WAVE!`);
    }
    
    return {
      multiplier: Math.min(multiplier, 3.0), // Cap at 3x
      reason: `Aggression level: ${(multiplier * 100).toFixed(0)}%`,
      confidence: signal.confidence * multiplier
    };
  }

  /**
   * SPEED DEMON MODE
   * Execute trades FASTER when loop prevention triggers
   */
  speedDemonMode(signal) {
    // If we just broke a loop, execute IMMEDIATELY
    if (signal.holdCount && signal.holdCount > 0) {
      return {
        executeNow: true,
        delay: 0,
        priority: 'ULTRA_HIGH',
        reason: 'Loop break detected - INSTANT EXECUTION'
      };
    }
    
    // Normal execution with smart delays
    return {
      executeNow: signal.confidence > 0.7,
      delay: signal.confidence > 0.5 ? 100 : 500,
      priority: signal.confidence > 0.6 ? 'HIGH' : 'NORMAL',
      reason: 'Standard execution path'
    };
  }

  /**
   * PROFIT ACCELERATOR
   * Compound profits aggressively when winning
   */
  profitAccelerator(currentBalance, initialBalance) {
    const profit = currentBalance - initialBalance;
    const profitPercent = (profit / initialBalance) * 100;
    
    let accelerationFactor = 1.0;
    let riskBudget = 0.1; // 10% base risk
    
    if (profitPercent > 10) {
      // Up 10%+ - increase risk budget
      accelerationFactor = 1.5;
      riskBudget = 0.15;
      console.log('💰 PROFIT ZONE - ACCELERATING!');
    }
    
    if (profitPercent > 20) {
      // Up 20%+ - go aggressive
      accelerationFactor = 2.0;
      riskBudget = 0.20;
      console.log('🚀 MOON MODE - MAXIMUM ACCELERATION!');
    }
    
    if (profitPercent > 50) {
      // Up 50%+ - YOLO with house money
      accelerationFactor = 3.0;
      riskBudget = 0.25;
      console.log('🌙 HOUSTON INCOMING - FULL SEND!');
    }
    
    return {
      factor: accelerationFactor,
      riskBudget: riskBudget,
      maxPosition: currentBalance * riskBudget,
      profitLevel: profitPercent,
      status: profitPercent > 50 ? 'HOUSTON_BOUND' : 
              profitPercent > 20 ? 'CRUSHING_IT' : 
              profitPercent > 10 ? 'WINNING' : 'BUILDING'
    };
  }

  /**
   * MOMENTUM RIDER
   * When loop prevention works, ride the momentum harder
   */
  momentumRider(signal, priceHistory) {
    const momentum = this.calculateMomentum(priceHistory);
    
    // If we broke a loop AND momentum is strong
    if (signal.fallback && Math.abs(momentum) > 0.02) {
      const direction = momentum > 0 ? 'BULL' : 'BEAR';
      
      return {
        ride: true,
        direction: direction,
        strength: Math.abs(momentum),
        action: momentum > 0 ? 'BUY' : 'SELL',
        holdTime: Math.abs(momentum) * 100000, // Hold longer with stronger momentum
        takeProfit: Math.abs(momentum) * 5, // 5x momentum as profit target
        confidence: Math.min(0.9, Math.abs(momentum) * 10),
        message: `🏄 RIDING ${direction} MOMENTUM AT ${(Math.abs(momentum) * 100).toFixed(1)}%!`
      };
    }
    
    return { ride: false };
  }

  /**
   * SMART EXITS
   * Exit positions intelligently based on loop prevention signals
   */
  smartExitStrategy(position, currentSignal, marketData) {
    const profitPercent = ((marketData.currentPrice - position.entryPrice) / position.entryPrice) * 100;
    
    // If we're entering a new hold loop, EXIT IMMEDIATELY
    if (currentSignal.holdCount > 2 && profitPercent > 0) {
      return {
        exit: true,
        reason: 'HOLD_LOOP_FORMING',
        urgency: 'HIGH',
        message: '⚠️ Potential loop forming - TAKING PROFITS!'
      };
    }
    
    // Dynamic profit targets based on market state
    let profitTarget = 2.0; // Base 2%
    
    if (currentSignal.regime === 'volatile') {
      profitTarget = 1.0; // Quick 1% in volatile markets
    } else if (currentSignal.regime === 'trend_up' && position.side === 'BUY') {
      profitTarget = 5.0; // Let winners run in trends
    }
    
    if (profitPercent >= profitTarget) {
      return {
        exit: true,
        reason: 'PROFIT_TARGET_HIT',
        urgency: 'NORMAL',
        message: `✅ Target ${profitTarget}% hit - BANKING PROFITS!`
      };
    }
    
    // Trailing stop loss that tightens as profit increases
    const stopLoss = profitPercent > 3 ? -0.5 : // Tight stop when winning
                     profitPercent > 1 ? -1.0 : // Medium stop
                     -2.0; // Normal stop
    
    if (profitPercent <= stopLoss) {
      return {
        exit: true,
        reason: 'STOP_LOSS',
        urgency: 'HIGH',
        message: `🛑 Stop loss at ${stopLoss}% - PROTECTING CAPITAL!`
      };
    }
    
    return { exit: false };
  }

  /**
   * PERFORMANCE TRACKER
   * Real-time performance metrics
   */
  trackPerformance(trade) {
    this.trades.push({
      ...trade,
      timestamp: Date.now()
    });
    
    // Calculate current metrics
    const wins = this.trades.filter(t => t.profit > 0).length;
    const losses = this.trades.filter(t => t.profit <= 0).length;
    const totalProfit = this.trades.reduce((sum, t) => sum + t.profit, 0);
    
    this.performanceBaseline.current = {
      tradesPerHour: (this.trades.length / ((Date.now() - this.startTime) / 3600000)),
      winRate: wins / (wins + losses || 1),
      avgProfit: totalProfit / (this.trades.length || 1)
    };
    
    // Calculate improvement
    const improvement = {
      speed: (this.performanceBaseline.current.tradesPerHour / 
              this.performanceBaseline.preOptimization.tradesPerHour - 1) * 100,
      winRate: (this.performanceBaseline.current.winRate / 
                this.performanceBaseline.preOptimization.winRate - 1) * 100,
      profit: (this.performanceBaseline.current.avgProfit / 
               this.performanceBaseline.preOptimization.avgProfit - 1) * 100
    };
    
    return {
      current: this.performanceBaseline.current,
      improvement: improvement,
      status: improvement.profit > 100 ? 'CRUSHING_IT' : 
              improvement.profit > 50 ? 'KILLING_IT' : 
              improvement.profit > 0 ? 'WINNING' : 'BUILDING'
    };
  }

  /**
   * CALCULATE MOMENTUM
   */
  calculateMomentum(priceHistory, period = 10) {
    if (priceHistory.length < period) return 0;
    
    const recent = priceHistory.slice(-period);
    const oldPrice = recent[0];
    const newPrice = recent[recent.length - 1];
    
    return (newPrice - oldPrice) / oldPrice;
  }

  /**
   * GET RECENT WIN STREAK
   */
  getRecentWinStreak() {
    let streak = 0;
    for (let i = this.trades.length - 1; i >= 0; i--) {
      if (this.trades[i].profit > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * MASTER EXECUTION WITH ALL OPTIMIZATIONS
   */
  async executeTurboTrade(signal, marketData, position = null) {
    console.log('⚡ TURBO BOOST ENGAGED!');
    
    // 1. Apply aggression multiplier
    const aggression = this.aggressionMultiplier(signal, marketData);
    
    // 2. Check speed demon mode
    const speed = this.speedDemonMode(signal);
    
    // 3. Calculate profit acceleration
    const acceleration = this.profitAccelerator(
      marketData.currentBalance,
      marketData.initialBalance
    );
    
    // 4. Check momentum
    const momentum = this.momentumRider(signal, marketData.priceHistory);
    
    // 5. Check exits if we have a position
    if (position) {
      const exitSignal = this.smartExitStrategy(position, signal, marketData);
      if (exitSignal.exit) {
        console.log(exitSignal.message);
        return {
          action: 'EXIT',
          ...exitSignal
        };
      }
    }
    
    // 6. Calculate final position size
    const baseSize = marketData.availableCapital * 0.05;
    const finalSize = baseSize * aggression.multiplier * acceleration.factor;
    
    // 7. Build execution plan
    const execution = {
      action: momentum.ride ? momentum.action : signal.action,
      size: Math.min(finalSize, acceleration.maxPosition),
      confidence: Math.max(signal.confidence, momentum.confidence || 0),
      speed: speed,
      aggression: aggression,
      acceleration: acceleration,
      momentum: momentum,
      timestamp: Date.now()
    };
    
    // 8. Log the MEGA trade
    console.log(`
🎯 TURBO TRADE EXECUTION:
├─ Action: ${execution.action}
├─ Size: ${execution.size.toFixed(2)}
├─ Confidence: ${(execution.confidence * 100).toFixed(1)}%
├─ Aggression: ${aggression.multiplier.toFixed(1)}x
├─ Acceleration: ${acceleration.factor.toFixed(1)}x
├─ Speed: ${speed.priority}
├─ Profit Status: ${acceleration.status}
└─ Mode: ${momentum.ride ? 'MOMENTUM RIDING' : 'STANDARD'}
    `);
    
    return execution;
  }
}

module.exports = TurboBoostOptimizer;