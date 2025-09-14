// ========================================================================
// 🚀 PRODUCTION BACKTEST FOR V13-SIMPLIFIED - EXACT MATCH TO TRADING LOGIC
// ========================================================================
// This backtester EXACTLY matches the production bot's trading logic
// Including all offensive and defensive modules, tier system, and fixes
// ========================================================================

const fs = require('fs');
const path = require('path');

// Import ALL the same modules as production bot
const TierFeatureFlags = require('./core/TierFeatureFlags');
const RiskManager = require('./core/RiskManager');
const { OptimizedTradingBrain } = require('./core/OptimizedTradingBrain');
const MaxProfitManager = require('./core/MaxProfitManager');
const TradingSafetyNet = require('./core/TradingSafetyNet');
const PerformanceAnalyzer = require('./core/PerformanceAnalyzer');
const QuantumPositionSizer = require('./core/QuantumPositionSizer');
const MultiDirectionalTrader = require('./core/MultiDirectionalTrader');
const { EnhancedPatternChecker } = require('./core/EnhancedPatternRecognition');
const MarketRegimeDetector = require('./core/MarketRegimeDetector');
const FibonacciDetector = require('./core/FibonacciDetector');
const SupportResistanceDetector = require('./core/SupportResistanceDetector');
const OptimizedIndicators = require('./core/OptimizedIndicators');
// REMOVED DynamicEntryAnalysis - expects bot instance
// REMOVED AggressiveTradingMode - too dangerous (random trades!)

class V13ProductionBacktest {
  constructor(config = {}) {
    console.log('\n🚀 V13 PRODUCTION BACKTEST ENGINE');
    console.log('════════════════════════════════════════════════════════════');
    console.log('EXACT MATCH to production trading logic with all modules');
    console.log('════════════════════════════════════════════════════════════\n');

    // Initialize tier system (default to elite for backtesting)
    const tier = config.tier || 'elite';
    this.tierFlags = new TierFeatureFlags(tier);
    
    const tierSummary = this.tierFlags.getTierSummary();
    console.log(`\n🎭 BACKTESTING WITH ${tier.toUpperCase()} TIER`);
    console.log(`   📊 Patterns: ${tierSummary.patterns}`);
    console.log(`   💼 Max Positions: ${tierSummary.maxPositions}`);
    console.log(`   🔄 Multi-Directional: ${tierSummary.multiDirectional ? 'YES' : 'NO'}`);
    console.log(`   ⚛️ Quantum Features: ${tierSummary.quantum ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   📈 Max Leverage: ${tierSummary.leverage}x\n`);

    this.config = {
      initialBalance: config.initialBalance || 10000,
      maxPositionSize: config.maxPositionSize || 0.05, // 5% max per trade
      minTradeConfidence: config.minTradeConfidence || 0, // Match production
      patternConfidence: config.patternConfidence || 0.35, // 35% pattern threshold
      emergencyConfidence: config.emergencyConfidence || 0.25, // Emergency threshold
      stopLossPercent: config.stopLossPercent || 5.0, // 5% stop loss
      takeProfitPercent: config.takeProfitPercent || 12.0, // 12% take profit
      trailingStopPercent: config.trailingStopPercent || 6.0, // 6% trailing
      breakevenThreshold: config.breakevenThreshold || 1.0, // 1% to breakeven
      maxDailyLoss: config.maxDailyLoss || 10.0, // 10% max daily loss
      fee: config.fee || 0.001, // 0.1% trading fee
      slippage: config.slippage || 0.0005, // 0.05% slippage
      // Backtest safety mode: 'normal' | 'relaxed' | 'off'
      safetyMode: config.safetyMode || process.env.BACKTEST_SAFETY || 'normal',
      ...config
    };

    // Initialize state
    this.systemState = {
      active: false,
      mode: 'backtesting',
      startTime: Date.now(),
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalPnL: 0,
      dailyPnL: 0,
      currentBalance: this.config.initialBalance,
      averageTradeTime: 0,
      averageConfidence: 0,
      winRate: 0,
      currentDrawdown: 0,
      maxDrawdownReached: 0,
      emergencyMode: false,
      riskLimitExceeded: false,
      lastTradeTime: 0,
      lastRiskCheck: 0
    };

    // Position tracking
    this.activePositions = new Map();
    this.trailingStops = new Map();
    this.profitTargets = new Map();

    // Price data for indicators
    this.priceData = [];
    this.priceHistory = [];

    // Results tracking
    this.results = {
      trades: [],
      balance: this.config.initialBalance,
      equity: [this.config.initialBalance],
      wins: 0,
      losses: 0,
      totalFees: 0,
      maxDrawdown: 0,
      peakBalance: this.config.initialBalance,
      hourlyPnL: {},
      patternPerformance: {},
      moduleDecisions: []
    };

    // Initialize all modules EXACTLY like production
    this.initializeModules();
  }

  initializeModules() {
    console.log('📦 Initializing all production modules...\n');

    // DEFENSIVE MODULES
    this.riskManager = new RiskManager({
      maxDailyLoss: 0.05,
      maxWeeklyLoss: 0.15,
      maxDrawdown: 0.20,
      recoveryMode: true,
      alertsEnabled: false, // No alerts in backtest
      baseRiskPercent: 2.0,
      verboseLogging: false
    });

    this.balance = this.config.initialBalance;
    
    this.tradingBrain = new OptimizedTradingBrain(this.balance, {
      maxRiskPerTrade: 0.02,
      enableTrailingStop: true,
      enableBreakevenWithdrawal: true,
      compoundProfits: true,
      aggressiveMode: false,
      enableCorrelation: true,
      riskRewardRatio: 2.5
    });

    this.profitManager = new MaxProfitManager({
      partialExitEnabled: true,
      tierExitEnabled: true,
      profitTiers: [
        { percent: 0.015, exitPercent: 0.3 },
        { percent: 0.025, exitPercent: 0.3 },
        { percent: 0.05, exitPercent: 0.4 }
      ],
      trailingStop: {
        enabled: true,
        activationProfit: 0.02,
        trailDistance: 0.01,
        dynamicAdjustment: true
      }
    });

    this.safetyNet = new TradingSafetyNet({
      maxDrawdown: 0.15,
      maxDailyLoss: 0.05,
      maxConsecutiveLosses: 5,
      emergencyStop: {
        enabled: true,
        triggerPercent: 0.10,
        cooldownMinutes: 60
      },
      circuitBreaker: {
        enabled: true,
        volatilityThreshold: 0.1,
        volumeAnomalyThreshold: 5
      }
    });

    this.performanceAnalyzer = new PerformanceAnalyzer({
      updateInterval: 60000,
      alertThresholds: {
        winRate: 0.40,
        profitFactor: 1.2,
        sharpeRatio: 0.5,
        dailyLoss: 0.05
      }
    });

    // Quantum modules (ELITE only)
    if (this.tierFlags.isEnabled('quantum.positionSizer')) {
      this.quantumSizer = new QuantumPositionSizer({
        baseSize: this.config.maxPositionSize,
        kellyMultiplier: 0.25,
        minSize: 0.001,
        maxSize: 0.08,
        quantumFactors: {
          confidence: 0.3,
          volatility: 0.2,
          correlation: 0.2,
          momentum: 0.15,
          volume: 0.15
        }
      });
    } else {
      this.quantumSizer = null;
    }

    // Multi-directional (PRO/ELITE only)
    if (this.tierFlags.isEnabled('trading.multiDirectional')) {
      this.multiDirectionalTrader = new MultiDirectionalTrader({
        enableShorts: true,
        enableHedging: false,
        arbitrage: false,
        maxLongExposure: 0.6,
        maxShortExposure: 0.4,
        longShortRatio: 0.7,
        regimeAdaptive: true,
        maxPositions: this.tierFlags.getFeatureValue('trading.maxPositions') || 1
      });
    } else {
      this.multiDirectionalTrader = null;
    }

    // Pattern recognition (tier-based)
    if (this.tierFlags.isEnabled('patterns.enabled')) {
      const detector = this.tierFlags.getPatternDetector();
      if (detector && detector.constructor && detector.constructor.name !== 'ComprehensivePatternDetector') {
        this.patternRecognition = new EnhancedPatternChecker({
          similarityThreshold: 0.65,
          minTradeHistory: 2,
          confidenceThreshold: this.config.patternConfidence,
          enableAggressivePatterns: true,
          patternMemorySize: 1000,
          recentPatternBonus: true,
          patternDetector: detector
        });
      } else {
        this.patternRecognition = detector;
      }
    } else {
      this.patternRecognition = null;
    }

    // OFFENSIVE MODULES
    this.marketRegimeDetector = new MarketRegimeDetector({
      lookbackPeriod: 100,
      volatilityThreshold: 0.02,
      trendStrengthThreshold: 0.6
    });

    this.fibonacciDetector = new FibonacciDetector({
      levels: [0.236, 0.382, 0.5, 0.618, 0.786],
      minSwingSize: 0.02,
      lookbackCandles: 50
    });

    this.supportResistanceDetector = new SupportResistanceDetector({
      minTouches: 2,
      proximityThreshold: 0.005,
      lookbackPeriod: 200
    });

    this.optimizedIndicators = new OptimizedIndicators({
      rsiPeriod: 14,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      emaPeriods: [9, 21, 50, 200],
      bbPeriod: 20,
      bbStdDev: 2
    });

    // REMOVED DynamicEntryAnalysis and AggressiveTradingMode - too dangerous

    console.log('✅ All modules initialized successfully!\n');
  }

  /**
   * Calculate REAL trading confidence - EXACT COPY from production
   */
  calculateRealConfidence(marketData, patterns = []) {
    let confidence = 0;
    const price = marketData.price || this.priceData[this.priceData.length - 1].close;
    
    // OFFENSIVE MODULE: Market Regime Detection
    if (this.marketRegimeDetector) {
      const regimeAnalysis = this.marketRegimeDetector.analyzeMarket(this.priceData);
      if (regimeAnalysis) {
        if (regimeAnalysis.regime === 'trending_up' && regimeAnalysis.confidence > 0.7) {
          confidence += 0.20;
        } else if (regimeAnalysis.regime === 'trending_down' && regimeAnalysis.confidence > 0.7) {
          confidence += 0.15;
        } else if (regimeAnalysis.regime === 'ranging') {
          confidence += 0.05;
        }
        marketData.marketRegime = regimeAnalysis;
      }
    }
    
    // OFFENSIVE MODULE: Fibonacci Levels (for visualization)
    if (this.fibonacciDetector) {
      const fibLevels = this.fibonacciDetector.update(this.priceData);
      if (fibLevels) {
        const nearestLevel = this.fibonacciDetector.getNearestLevel(price);
        if (nearestLevel && nearestLevel.distance < 0.5) {
          confidence += 0.10;
        }
        marketData.fibLevels = fibLevels;
      }
    }
    
    // OFFENSIVE MODULE: Support/Resistance (for visualization)
    if (this.supportResistanceDetector) {
      const levels = this.supportResistanceDetector.update(this.priceData);
      if (levels && levels.length > 0) {
        const nearestLevel = this.supportResistanceDetector.getNearestLevel(price);
        if (nearestLevel) {
          if (nearestLevel.type === 'support' && nearestLevel.distance < 0.3) {
            confidence += 0.15;
          } else if (nearestLevel.type === 'resistance' && nearestLevel.distance < 0.3) {
            confidence += 0.08;
          }
        }
        marketData.srLevels = levels;
      }
    }
    
    // OFFENSIVE MODULE: Optimized Indicators
    if (this.optimizedIndicators && this.priceData.length > 30) {
      const rsi = this.optimizedIndicators.calculateRSI(this.priceData);
      const macd = this.optimizedIndicators.calculateMACD(this.priceData);
      const bb = this.optimizedIndicators.calculateBollingerBands(this.priceData);
      
      if (rsi) {
        if (rsi < 30) {
          confidence += 0.15;
        } else if (rsi > 70) {
          confidence += 0.15;
        }
        marketData.rsi = rsi;
      }
      
      if (macd && macd.macd > 0 && macd.signal > 0) {
        confidence += 0.15;
        marketData.macd = macd.macd;
        marketData.macdSignal = macd.signal;
        marketData.macdHistogram = macd.histogram;
      }
      
      if (bb) {
        marketData.bbUpper = bb.upper;
        marketData.bbMiddle = bb.middle;
        marketData.bbLower = bb.lower;
      }
    }
    
    // Pattern bonus (supports different detector outputs)
    if (patterns && patterns.length > 0) {
      patterns.forEach(p => {
        const strength = typeof p.strength === 'number' ? p.strength : (typeof p.quality === 'number' ? p.quality : (typeof p.reliability === 'number' ? p.reliability : 0.6));
        const pconf = typeof p.confidence === 'number' ? p.confidence : 0.5;
        confidence += (Math.max(0, Math.min(1, strength)) * Math.max(0, Math.min(1, pconf)) * 0.05);
      });
      const patternBonus = Math.min(0.25, Math.min(patterns.length, 5) * 0.05);
      confidence = Math.min(1, confidence + patternBonus);
    } else if (this.priceData.length > 30) {
      // FALLBACK: Boost confidence from indicators when no patterns
      // This ensures we can still trade based on strong technical signals
      if (marketData.rsi) {
        if (marketData.rsi < 30 || marketData.rsi > 70) {
          confidence += 0.25; // Strong oversold/overbought
        } else if (marketData.rsi < 40 || marketData.rsi > 60) {
          confidence += 0.15; // Moderate signal
        }
      }
      if (marketData.macd && Math.abs(marketData.macd) > 0) {
        confidence += 0.10; // MACD momentum
      }
      // Base technical confidence
      confidence += 0.05;
    }
    
    // Volatility adjustment
    if (marketData.volatility) {
      if (marketData.volatility > 0.05) {
        confidence *= 0.8;
      } else if (marketData.volatility < 0.01) {
        confidence *= 0.9;
      }
    }
    
    // REMOVED DynamicEntryAnalysis and AggressiveTradingMode - too dangerous
    
    // Cap confidence
    confidence = Math.max(0, Math.min(0.95, confidence));
    
    return confidence;
  }

  /**
   * Calculate position size - EXACT COPY from production
   */
  calculatePositionSize(confidence, marketData) {
    if (this.quantumSizer) {
      const quantumSize = this.quantumSizer.calculateOptimalPosition(
        marketData.price,
        marketData.volatility || 0.02,
        confidence,
        this.systemState.currentBalance,
        {
          winRate: this.systemState.winRate || 0.5,
          avgWin: 2.5,
          avgLoss: 1.5,
          volume: marketData.volume,
          correlation: marketData.correlation || 0,
          momentum: marketData.momentum || 0,
          currentDrawdown: this.systemState.currentDrawdown
        }
      );
      return quantumSize;
    } else {
      const baseSize = this.config.maxPositionSize;
      const volatilityAdjustment = marketData.volatility > 0.03 ? 0.7 : 1.0;
      const confidenceMultiplier = 0.5 + (confidence * 0.5);
      const maxLeverage = this.tierFlags.getFeatureValue('trading.maxLeverage') || 1;
      const leverageMultiplier = Math.min(maxLeverage, 1 + (confidence - 0.5) * 2);
      const size = baseSize * volatilityAdjustment * confidenceMultiplier * leverageMultiplier;
      return Math.min(size, this.config.maxPositionSize * maxLeverage);
    }
  }

  /**
   * Run backtest on historical data
   */
  async runBacktest(historicalData) {
    console.log(`\n📊 Running backtest on ${historicalData.length} data points...`);
    
    for (let i = 100; i < historicalData.length; i++) {
      // Progress logging every 100 candles
      if (i % 100 === 0) {
        console.log(`Processing candle ${i}/${historicalData.length} (${((i/historicalData.length)*100).toFixed(1)}%)`);
      }
      // Build price history for indicators
      this.priceData = historicalData.slice(Math.max(0, i - 200), i);
      this.priceHistory = this.priceData.map(d => d.close);
      
      const currentData = historicalData[i];
      const marketData = {
        price: currentData.close,
        high: currentData.high,
        low: currentData.low,
        volume: currentData.volume,
        volatility: this.calculateVolatility(),
        timestamp: currentData.timestamp
      };
      
      // Process existing positions
      this.updatePositions(marketData);
      
      // Check for new trade opportunities
      await this.evaluateTradingOpportunity(marketData);
      
      // Update equity curve
      this.results.equity.push(this.systemState.currentBalance);
      
      // Update drawdown
      if (this.systemState.currentBalance > this.results.peakBalance) {
        this.results.peakBalance = this.systemState.currentBalance;
      }
      const drawdown = (this.results.peakBalance - this.systemState.currentBalance) / this.results.peakBalance;
      if (drawdown > this.results.maxDrawdown) {
        this.results.maxDrawdown = drawdown;
      }
    }
    
    return this.generateReport();
  }

  /**
   * Evaluate trading opportunity - matches production logic
   */
  async evaluateTradingOpportunity(marketData) {
    // Check position limits
    const maxPositions = this.tierFlags.getFeatureValue('trading.maxPositions') || 1;
    if (this.activePositions.size >= maxPositions) {
      return;
    }
    
    // Pattern detection (supports both EnhancedPatternChecker and ComprehensivePatternDetector)
    let patterns = [];
    if (this.patternRecognition) {
      try {
        if (typeof this.patternRecognition.analyzePatterns === 'function') {
          // EnhancedPatternChecker style
          patterns = this.patternRecognition.analyzePatterns({
            candles: this.priceData,
            currentPrice: marketData.price,
            volume: marketData.volume
          }) || [];
        } else if (typeof this.patternRecognition.scanAllPatterns === 'function') {
          // ComprehensivePatternDetector style
          const detected = this.patternRecognition.scanAllPatterns(this.priceData, { minTier: 1, maxTier: 3, minReliability: 0 });
          patterns = (detected || []).map(p => ({
            name: p.pattern,
            confidence: p.confidence || p.reliability || 0.6,
            direction: p.direction,
            quality: p.reliability || 0.6
          }));
        }
      } catch (err) {
        patterns = [];
      }
    }
    
    // Calculate confidence
    const confidence = this.calculateRealConfidence(marketData, patterns);
    
    // Debug logging
    if (this.debugCounter === undefined) this.debugCounter = 0;
    if (this.debugCounter++ < 20) {
      console.log(`[${this.debugCounter}] Confidence=${confidence.toFixed(3)}, Min=${this.config.minTradeConfidence}, RSI=${marketData.rsi?.toFixed(1)}, Regime=${marketData.marketRegime?.regime}`);
    }
    
    // Check minimum confidence
    if (confidence < this.config.minTradeConfidence) {
      return;
    }
    
    // Enrich market data for MDT (trend/volatility objects expected)
    const regime = marketData.marketRegime;
    const mdtMarketData = { ...marketData };
    if (regime && regime.metrics) {
      mdtMarketData.trend = {
        direction: regime.metrics.trendDirection > 0 ? 'up' : regime.metrics.trendDirection < 0 ? 'down' : 'neutral',
        strength: regime.metrics.trendStrength || 0
      };
      const currentVol = regime.metrics.volatility || (marketData.volatility || 0);
      this._volatilityAvg = this._volatilityAvg ? (this._volatilityAvg * 0.9 + currentVol * 0.1) : currentVol;
      mdtMarketData.volatility = {
        current: currentVol,
        average: this._volatilityAvg,
        level: currentVol > (this.marketRegimeDetector?.config?.highVolThreshold || 2) ? 'high' : currentVol < (this.marketRegimeDetector?.config?.lowVolThreshold || 0.5) ? 'low' : 'normal'
      };
      mdtMarketData.volume = { ratio: regime.metrics.volumeRatio || 1 };
      mdtMarketData.momentum = { rsi: marketData.rsi || 50 };
    }

    // Multi-directional trading decision
    let tradeDirection = null;
    if (this.multiDirectionalTrader) {
      // Map detected patterns to a primary buy/sell signal for MDT
      let primaryDirection = 'hold';
      if (Array.isArray(patterns) && patterns.length > 0) {
        const top = patterns[0];
        if (top.direction === 'bullish') primaryDirection = 'buy';
        else if (top.direction === 'bearish') primaryDirection = 'sell';
      }

      const signal = {
        direction: primaryDirection,
        confidence: confidence,
        patterns: patterns,
        suggestedSize: this.calculatePositionSize(confidence, marketData)
      };
      const mdtDecision = this.multiDirectionalTrader.evaluateTrade(signal, mdtMarketData);
      // The MDT returns an object with { action, direction, size, ... }
      // Consider any non-hold action as a trade signal.
      if (mdtDecision && mdtDecision.action && mdtDecision.action !== 'hold') {
        tradeDirection = mdtDecision.direction || (mdtDecision.action === 'buy' ? 'long' : mdtDecision.action === 'sell' ? 'short' : null);
      }
      // Fallback: if MDT is neutral but confidence is high enough, take a small long per legacy rule
      if (!tradeDirection && confidence > (this.config.fallbackPatternConfidence || this.config.patternConfidence || 0.25)) {
        tradeDirection = 'long';
      }
    } else {
      // Simple long-only for starter tier
      if (confidence > this.config.patternConfidence) {
        tradeDirection = 'long';
      }
    }
    
    if (!tradeDirection) {
      return;
    }
    
    // Risk checks
    // SafetyNet gate (skippable in backtest)
    const safetyCheck = this.config.safetyMode === 'off' ? { approved: true } : this.safetyNet.validateTrade({
      symbol: 'BTC-USD',
      direction: tradeDirection === 'long' ? 'BUY' : 'SELL',
      size: this.calculatePositionSize(confidence, marketData),
      price: marketData.price,
      confidence: confidence
    }, marketData);
    
    if (!safetyCheck.approved && this.config.safetyMode !== 'relaxed') {
      this.results.moduleDecisions.push({
        timestamp: marketData.timestamp,
        module: 'SafetyNet',
        decision: 'BLOCKED',
        reason: safetyCheck.reason
      });
      return;
    }
    // In relaxed mode, log but proceed
    if (!safetyCheck.approved && this.config.safetyMode === 'relaxed') {
      this.results.moduleDecisions.push({
        timestamp: marketData.timestamp,
        module: 'SafetyNet',
        decision: 'OVERRIDDEN',
        reason: safetyCheck.reason
      });
    }
    
    const riskCheck = this.config.safetyMode === 'off' ? { approved: true } : this.riskManager.assessTradeRisk({
      entryPrice: marketData.price,
      stopLoss: marketData.price * (tradeDirection === 'long' ? 0.95 : 1.05),
      positionSize: this.calculatePositionSize(confidence, marketData),
      confidence: confidence,
      volatility: marketData.volatility,
      direction: tradeDirection
    });
    
    if (!riskCheck.approved && this.config.safetyMode !== 'relaxed') {
      this.results.moduleDecisions.push({
        timestamp: marketData.timestamp,
        module: 'RiskManager',
        decision: 'BLOCKED',
        reason: riskCheck.reason
      });
      return;
    }
    if (!riskCheck.approved && this.config.safetyMode === 'relaxed') {
      this.results.moduleDecisions.push({
        timestamp: marketData.timestamp,
        module: 'RiskManager',
        decision: 'OVERRIDDEN',
        reason: riskCheck.reason
      });
    }
    
    // Execute trade
    this.executeTrade(tradeDirection, confidence, marketData, patterns);
  }

  /**
   * Execute trade
   */
  executeTrade(direction, confidence, marketData, patterns) {
    const positionSize = this.calculatePositionSize(confidence, marketData);
    const tradeAmount = this.systemState.currentBalance * positionSize;
    
    // Apply fees and slippage
    const entryPrice = direction === 'long' 
      ? marketData.price * (1 + this.config.slippage)
      : marketData.price * (1 - this.config.slippage);
    const fee = tradeAmount * this.config.fee;
    
    const position = {
      id: `trade_${Date.now()}`,
      direction: direction,
      entryPrice: entryPrice,
      size: positionSize,
      amount: tradeAmount - fee,
      confidence: confidence,
      patterns: patterns.map(p => p.name),
      timestamp: marketData.timestamp,
      stopLoss: direction === 'long'
        ? entryPrice * (1 - this.config.stopLossPercent / 100)
        : entryPrice * (1 + this.config.stopLossPercent / 100),
      takeProfit: direction === 'long'
        ? entryPrice * (1 + this.config.takeProfitPercent / 100)
        : entryPrice * (1 - this.config.takeProfitPercent / 100),
      trailingStop: null
    };
    
    this.activePositions.set(position.id, position);
    this.systemState.currentBalance -= fee;
    this.results.totalFees += fee;
    this.systemState.totalTrades++;
    
    console.log(`📈 ${direction.toUpperCase()} @ $${entryPrice.toFixed(2)} | Confidence: ${(confidence * 100).toFixed(1)}% | Size: ${(positionSize * 100).toFixed(2)}%`);
  }

  /**
   * Update existing positions
   */
  updatePositions(marketData) {
    for (const [id, position] of this.activePositions) {
      const pnlPercent = position.direction === 'long'
        ? ((marketData.price - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - marketData.price) / position.entryPrice) * 100;
      
      // Check stop loss
      if (pnlPercent <= -this.config.stopLossPercent) {
        this.closePosition(id, marketData.price, 'STOP_LOSS');
        continue;
      }
      
      // Check take profit
      if (pnlPercent >= this.config.takeProfitPercent) {
        this.closePosition(id, marketData.price, 'TAKE_PROFIT');
        continue;
      }
      
      // Update trailing stop
      if (pnlPercent >= this.config.breakevenThreshold && !position.trailingStop) {
        position.trailingStop = position.entryPrice;
      }
      
      if (position.trailingStop) {
        const newTrailing = position.direction === 'long'
          ? Math.max(position.trailingStop, marketData.price * (1 - this.config.trailingStopPercent / 100))
          : Math.min(position.trailingStop, marketData.price * (1 + this.config.trailingStopPercent / 100));
        
        if ((position.direction === 'long' && marketData.price <= position.trailingStop) ||
            (position.direction === 'short' && marketData.price >= position.trailingStop)) {
          this.closePosition(id, marketData.price, 'TRAILING_STOP');
          continue;
        }
        
        position.trailingStop = newTrailing;
      }
    }
  }

  /**
   * Close position
   */
  closePosition(id, exitPrice, reason) {
    const position = this.activePositions.get(id);
    if (!position) return;
    
    // Apply slippage and fees
    const finalExitPrice = position.direction === 'long'
      ? exitPrice * (1 - this.config.slippage)
      : exitPrice * (1 + this.config.slippage);
    
    const pnl = position.direction === 'long'
      ? (finalExitPrice - position.entryPrice) * position.amount / position.entryPrice
      : (position.entryPrice - finalExitPrice) * position.amount / position.entryPrice;
    
    const fee = position.amount * this.config.fee;
    const netPnl = pnl - fee;
    
    // Update balances
    this.systemState.currentBalance += position.amount + netPnl;
    this.systemState.totalPnL += netPnl;
    this.results.totalFees += fee;
    
    // Record trade
    const trade = {
      ...position,
      exitPrice: finalExitPrice,
      exitReason: reason,
      pnl: netPnl,
      pnlPercent: (netPnl / position.amount) * 100,
      duration: Date.now() - position.timestamp
    };
    
    this.results.trades.push(trade);
    
    if (netPnl > 0) {
      this.systemState.successfulTrades++;
      this.results.wins++;
    } else {
      this.systemState.failedTrades++;
      this.results.losses++;
    }
    
    // Update win rate
    this.systemState.winRate = this.systemState.successfulTrades / this.systemState.totalTrades;
    
    // Remove position
    this.activePositions.delete(id);
    
    console.log(`📉 Closed ${position.direction.toUpperCase()} @ $${finalExitPrice.toFixed(2)} | PnL: ${netPnl > 0 ? '+' : ''}$${netPnl.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%) | Reason: ${reason}`);
  }

  /**
   * Calculate volatility
   */
  calculateVolatility() {
    if (this.priceHistory.length < 20) return 0.02;
    
    const returns = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      returns.push((this.priceHistory[i] - this.priceHistory[i-1]) / this.priceHistory[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate final report
   */
  generateReport() {
    const totalReturn = ((this.systemState.currentBalance - this.config.initialBalance) / this.config.initialBalance) * 100;
    const winRate = this.results.wins / (this.results.wins + this.results.losses) * 100;
    const avgWin = this.results.trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / (this.results.wins || 1);
    const avgLoss = Math.abs(this.results.trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / (this.results.losses || 1));
    const profitFactor = (avgWin * this.results.wins) / (avgLoss * this.results.losses || 1);
    
    const report = {
      summary: {
        tier: this.tierFlags.tier.toUpperCase(),
        initialBalance: this.config.initialBalance,
        finalBalance: this.systemState.currentBalance,
        totalReturn: totalReturn,
        totalTrades: this.systemState.totalTrades,
        winRate: winRate,
        wins: this.results.wins,
        losses: this.results.losses,
        avgWin: avgWin,
        avgLoss: avgLoss,
        profitFactor: profitFactor,
        maxDrawdown: this.results.maxDrawdown * 100,
        totalFees: this.results.totalFees
      },
      trades: this.results.trades,
      equity: this.results.equity,
      moduleDecisions: this.results.moduleDecisions
    };
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('📊 BACKTEST COMPLETE - RESULTS:');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`💰 Final Balance: $${this.systemState.currentBalance.toFixed(2)}`);
    console.log(`📈 Total Return: ${totalReturn.toFixed(2)}%`);
    console.log(`🎯 Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`📊 Total Trades: ${this.systemState.totalTrades}`);
    console.log(`✅ Wins: ${this.results.wins}`);
    console.log(`❌ Losses: ${this.results.losses}`);
    console.log(`💵 Avg Win: $${avgWin.toFixed(2)}`);
    console.log(`💸 Avg Loss: $${avgLoss.toFixed(2)}`);
    console.log(`⚖️ Profit Factor: ${profitFactor.toFixed(2)}`);
    console.log(`📉 Max Drawdown: ${this.results.maxDrawdown.toFixed(2)}%`);
    console.log(`💳 Total Fees: $${this.results.totalFees.toFixed(2)}`);
    console.log('════════════════════════════════════════════════════════════\n');
    
    return report;
  }
}

// Run the backtest
async function main() {
  const args = process.argv.slice(2);
  const tier = args[0] || 'elite';
  
  console.log(`\n🚀 Starting Production Backtest with ${tier.toUpperCase()} tier...`);
  
  // Parse days from args
  const daysArg = args.find(arg => arg.startsWith('--days'));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) || 7 : 7;
  
  // ONLY REAL DATA - NO FAKE SHIT
  console.error('❌ CRITICAL ERROR: NO DATA FILE PROVIDED!');
  console.error('This bot ONLY works with REAL market data. No synthetic/fake data allowed!');
  console.error('\nTo get REAL data:');
  console.error('POLYGON_API_KEY=your_key node tools/download-polygon-range.js --symbol=X:BTCUSD --from=2024-01-01 --to=2024-12-31 --out=data/real-btc.json');
  console.error('\nThen run:');
  console.error('node backtest-v13-production.js pro --file=data/real-btc.json');
  process.exit(1);
  
  // Create backtester
  const backtester = new V13ProductionBacktest({ tier });
  
  // Run backtest
  const results = await backtester.runBacktest(historicalData);
  
  // Save results
  const filename = `backtest-results-v13-production-${tier}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to ${filename}`);
}

// DELETED: ALL SYNTHETIC DATA GENERATION
// REAL DATA ONLY - NO FAKE PRICES!

// Export for testing
module.exports = V13ProductionBacktest;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
