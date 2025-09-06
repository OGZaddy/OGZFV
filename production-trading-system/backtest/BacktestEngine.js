/**
 * BACKTESTING ENGINE - ACCURATE & REALISTIC
 * Tests strategies with real market conditions
 */

const fs = require('fs');
const path = require('path');

class BacktestEngine {
  constructor(config = {}) {
    this.config = {
      initialBalance: config.initialBalance || 10000,
      slippage: config.slippage || 0.0005,           // 0.05% slippage
      makerFee: config.makerFee || 0.001,            // 0.1% maker fee
      takerFee: config.takerFee || 0.001,            // 0.1% taker fee
      startDate: config.startDate || '2023-01-01',
      endDate: config.endDate || '2024-01-01',
      timeframe: config.timeframe || '5m',           // 5 minute candles
      marginEnabled: config.marginEnabled || false,
      maxLeverage: config.maxLeverage || 1
    };
    
    this.results = {
      trades: [],
      equity: [this.config.initialBalance],
      returns: [],
      metrics: {}
    };
  }

  /**
   * RUN BACKTEST
   * Main backtest loop
   */
  async runBacktest(strategy, historicalData) {
    console.log('🔬 Starting Backtest...');
    console.log(`📅 Period: ${this.config.startDate} to ${this.config.endDate}`);
    console.log(`💰 Initial Balance: $${this.config.initialBalance}`);
    
    let balance = this.config.initialBalance;
    let positions = [];
    let trades = [];
    
    // Process each candle
    for (let i = 50; i < historicalData.length; i++) {
      const currentCandle = historicalData[i];
      const marketData = this.prepareMarketData(historicalData, i);
      
      // 1. Update open positions
      const positionUpdates = this.updatePositions(positions, currentCandle);
      
      // 2. Close positions that hit stops or targets
      for (const update of positionUpdates) {
        if (update.closed) {
          const pnl = this.calculatePnL(update.position, currentCandle);
          balance += pnl;
          trades.push({
            ...update.position,
            exitPrice: update.exitPrice,
            exitTime: currentCandle.timestamp,
            pnl: pnl,
            pnlPercent: (pnl / update.position.size) * 100,
            balance: balance
          });
          
          // Remove from open positions
          positions = positions.filter(p => p.id !== update.position.id);
        }
      }
      
      // 3. Check for new signals
      const signal = await strategy.executeTrade(marketData, balance);
      
      if (signal && signal.action) {
        // Apply slippage and fees
        const entryPrice = this.applySlippage(signal.entry, signal.action);
        const cost = signal.size * entryPrice;
        const fee = cost * this.config.takerFee;
        
        if (cost + fee <= balance) {
          const position = {
            id: `${i}_${Date.now()}`,
            ...signal,
            entry: entryPrice,
            size: signal.size,
            cost: cost + fee,
            openTime: currentCandle.timestamp,
            status: 'OPEN'
          };
          
          positions.push(position);
          balance -= (cost + fee);
          
          console.log(`📈 Trade #${trades.length + 1}: ${signal.action} at ${entryPrice}`);
        }
      }
      
      // 4. Record equity
      const totalEquity = balance + this.calculateOpenEquity(positions, currentCandle);
      this.results.equity.push(totalEquity);
      this.results.returns.push((totalEquity - this.config.initialBalance) / this.config.initialBalance);
    }
    
    // Close any remaining positions
    for (const position of positions) {
      const pnl = this.calculatePnL(position, historicalData[historicalData.length - 1]);
      balance += pnl;
      trades.push({
        ...position,
        exitPrice: historicalData[historicalData.length - 1].close,
        exitTime: historicalData[historicalData.length - 1].timestamp,
        pnl: pnl,
        status: 'FORCE_CLOSED'
      });
    }
    
    this.results.trades = trades;
    this.results.finalBalance = balance;
    
    // Calculate metrics
    this.calculateMetrics();
    
    return this.results;
  }

  /**
   * PREPARE MARKET DATA
   * Format data for strategy
   */
  prepareMarketData(historicalData, currentIndex) {
    const lookback = 50;
    const startIndex = Math.max(0, currentIndex - lookback);
    const slice = historicalData.slice(startIndex, currentIndex + 1);
    
    return {
      price: slice[slice.length - 1].close,
      prices: slice.map(c => c.close),
      volumes: slice.map(c => c.volume),
      highs: slice.map(c => c.high),
      lows: slice.map(c => c.low),
      
      // Calculate indicators
      rsi: this.calculateRSI(slice.map(c => c.close)),
      bollinger: this.calculateBollinger(slice.map(c => c.close)),
      ema20: this.calculateEMA(slice.map(c => c.close), 20),
      ema50: this.calculateEMA(slice.map(c => c.close), 50),
      supports: this.findSupportLevels(slice),
      resistances: this.findResistanceLevels(slice),
      
      timestamp: slice[slice.length - 1].timestamp,
      candle: slice[slice.length - 1]
    };
  }

  /**
   * UPDATE POSITIONS
   * Check stops and targets
   */
  updatePositions(positions, candle) {
    const updates = [];
    
    for (const position of positions) {
      // Check stop loss
      if (position.action === 'BUY' && candle.low <= position.stopLoss) {
        updates.push({
          position,
          closed: true,
          exitPrice: position.stopLoss,
          reason: 'STOP_LOSS'
        });
      }
      // Check take profit
      else if (position.action === 'BUY' && candle.high >= position.takeProfit) {
        updates.push({
          position,
          closed: true,
          exitPrice: position.takeProfit,
          reason: 'TAKE_PROFIT'
        });
      }
      // Short positions
      else if (position.action === 'SELL' && candle.high >= position.stopLoss) {
        updates.push({
          position,
          closed: true,
          exitPrice: position.stopLoss,
          reason: 'STOP_LOSS'
        });
      }
      else if (position.action === 'SELL' && candle.low <= position.takeProfit) {
        updates.push({
          position,
          closed: true,
          exitPrice: position.takeProfit,
          reason: 'TAKE_PROFIT'
        });
      }
    }
    
    return updates;
  }

  /**
   * CALCULATE P&L
   * Including fees and slippage
   */
  calculatePnL(position, candle) {
    const exitPrice = this.applySlippage(candle.close, position.action === 'BUY' ? 'SELL' : 'BUY');
    const exitValue = position.size * exitPrice;
    const exitFee = exitValue * this.config.takerFee;
    
    if (position.action === 'BUY') {
      return exitValue - position.cost - exitFee;
    } else {
      return position.cost - exitValue - exitFee;
    }
  }

  /**
   * CALCULATE OPEN EQUITY
   */
  calculateOpenEquity(positions, candle) {
    let equity = 0;
    
    for (const position of positions) {
      const currentValue = position.size * candle.close;
      if (position.action === 'BUY') {
        equity += currentValue - position.cost;
      } else {
        equity += position.cost - currentValue;
      }
    }
    
    return equity;
  }

  /**
   * APPLY SLIPPAGE
   * Realistic order execution
   */
  applySlippage(price, action) {
    if (action === 'BUY') {
      return price * (1 + this.config.slippage);
    } else {
      return price * (1 - this.config.slippage);
    }
  }

  /**
   * CALCULATE METRICS
   * Performance statistics
   */
  calculateMetrics() {
    const trades = this.results.trades;
    const returns = this.results.returns;
    
    // Basic metrics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    
    this.results.metrics = {
      // Trade statistics
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / trades.length * 100).toFixed(2) + '%',
      
      // Returns
      totalReturn: ((this.results.finalBalance - this.config.initialBalance) / this.config.initialBalance * 100).toFixed(2) + '%',
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0,
      
      // Risk metrics
      maxDrawdown: this.calculateMaxDrawdown(),
      sharpeRatio: this.calculateSharpeRatio(),
      profitFactor: this.calculateProfitFactor(),
      
      // Other metrics
      avgHoldTime: this.calculateAvgHoldTime(),
      expectancy: this.calculateExpectancy()
    };
    
    // Risk/Reward ratio
    if (this.results.metrics.avgLoss !== 0) {
      this.results.metrics.riskRewardRatio = Math.abs(this.results.metrics.avgWin / this.results.metrics.avgLoss);
    }
  }

  /**
   * CALCULATE MAX DRAWDOWN
   */
  calculateMaxDrawdown() {
    let peak = this.results.equity[0];
    let maxDrawdown = 0;
    
    for (const value of this.results.equity) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return (maxDrawdown * 100).toFixed(2) + '%';
  }

  /**
   * CALCULATE SHARPE RATIO
   */
  calculateSharpeRatio() {
    if (this.results.returns.length === 0) return 0;
    
    const avgReturn = this.results.returns.reduce((a, b) => a + b, 0) / this.results.returns.length;
    const variance = this.results.returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / this.results.returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    // Annualized Sharpe (assuming 5-minute bars, ~105,120 bars per year)
    const annualizedReturn = avgReturn * Math.sqrt(105120);
    const annualizedStdDev = stdDev * Math.sqrt(105120);
    
    return (annualizedReturn / annualizedStdDev).toFixed(2);
  }

  /**
   * CALCULATE PROFIT FACTOR
   */
  calculateProfitFactor() {
    const grossProfit = this.results.trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(this.results.trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    if (grossLoss === 0) return grossProfit > 0 ? 'Infinite' : 0;
    
    return (grossProfit / grossLoss).toFixed(2);
  }

  /**
   * CALCULATE AVERAGE HOLD TIME
   */
  calculateAvgHoldTime() {
    if (this.results.trades.length === 0) return 0;
    
    const holdTimes = this.results.trades.map(t => t.exitTime - t.openTime);
    const avgMs = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
    
    // Convert to hours
    return (avgMs / 3600000).toFixed(1) + ' hours';
  }

  /**
   * CALCULATE EXPECTANCY
   */
  calculateExpectancy() {
    if (this.results.trades.length === 0) return 0;
    
    const winRate = this.results.metrics.winningTrades / this.results.trades.length;
    const avgWin = this.results.metrics.avgWin;
    const avgLoss = Math.abs(this.results.metrics.avgLoss);
    
    return (winRate * avgWin - (1 - winRate) * avgLoss).toFixed(2);
  }

  /**
   * INDICATOR CALCULATIONS
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss || 0.0001);
    
    return 100 - (100 / (1 + rs));
  }

  calculateBollinger(prices, period = 20, stdDev = 2) {
    if (prices.length < period) {
      return { upper: prices[prices.length - 1], lower: prices[prices.length - 1], middle: prices[prices.length - 1] };
    }
    
    const slice = prices.slice(-period);
    const sma = slice.reduce((a, b) => a + b) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      lower: sma - (std * stdDev),
      middle: sma
    };
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  findSupportLevels(candles) {
    const lows = candles.map(c => c.low);
    const supports = [];
    
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        supports.push(lows[i]);
      }
    }
    
    return supports.slice(-3); // Return last 3 support levels
  }

  findResistanceLevels(candles) {
    const highs = candles.map(c => c.high);
    const resistances = [];
    
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        resistances.push(highs[i]);
      }
    }
    
    return resistances.slice(-3); // Return last 3 resistance levels
  }

  /**
   * GENERATE REPORT
   */
  generateReport() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    BACKTEST RESULTS                         ║
╚════════════════════════════════════════════════════════════╝

📊 PERFORMANCE SUMMARY:
├─ Total Return: ${this.results.metrics.totalReturn}
├─ Total Trades: ${this.results.metrics.totalTrades}
├─ Win Rate: ${this.results.metrics.winRate}
├─ Profit Factor: ${this.results.metrics.profitFactor}
└─ Max Drawdown: ${this.results.metrics.maxDrawdown}

💰 TRADE STATISTICS:
├─ Winning Trades: ${this.results.metrics.winningTrades}
├─ Losing Trades: ${this.results.metrics.losingTrades}
├─ Average Win: $${this.results.metrics.avgWin.toFixed(2)}
├─ Average Loss: $${this.results.metrics.avgLoss.toFixed(2)}
└─ Risk/Reward: ${this.results.metrics.riskRewardRatio?.toFixed(2) || 'N/A'}

📈 RISK METRICS:
├─ Sharpe Ratio: ${this.results.metrics.sharpeRatio}
├─ Expectancy: $${this.results.metrics.expectancy}
└─ Avg Hold Time: ${this.results.metrics.avgHoldTime}

💵 FINAL RESULTS:
├─ Starting Balance: $${this.config.initialBalance}
├─ Ending Balance: $${this.results.finalBalance.toFixed(2)}
└─ Net Profit: $${(this.results.finalBalance - this.config.initialBalance).toFixed(2)}
    `);
    
    return this.results;
  }

  /**
   * EXPORT RESULTS
   */
  exportResults(filename = 'backtest_results.json') {
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`📁 Results exported to ${outputPath}`);
  }
}

module.exports = BacktestEngine;