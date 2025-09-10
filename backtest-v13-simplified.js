// ========================================================================
// 🔬 BACKTEST FOR V13-SIMPLIFIED - TESTING THE FAKE BOT AS-IS
// ========================================================================
// This backtests the v13-simplified bot with its hardcoded 65% confidence
// and all its unused modules. Let's see how bad (or good?) it really is!
// ========================================================================

const fs = require('fs');
const path = require('path');

class V13SimplifiedBacktest {
  constructor(config = {}) {
    this.config = {
      initialBalance: config.initialBalance || 10000,
      maxPositionSize: config.maxPositionSize || 0.25, // 25% max position
      minTradeConfidence: config.minTradeConfidence || 0.55, // Bot's default
      stopLoss: config.stopLoss || 0.015, // 1.5% stop loss
      takeProfit: config.takeProfit || 0.025, // 2.5% take profit
      fee: config.fee || 0.001, // 0.1% trading fee
      slippage: config.slippage || 0.0005, // 0.05% slippage
      ...config
    };

    this.results = {
      trades: [],
      balance: this.config.initialBalance,
      equity: [this.config.initialBalance],
      wins: 0,
      losses: 0,
      totalFees: 0,
      maxDrawdown: 0,
      peakBalance: this.config.initialBalance
    };

    this.position = null;
    this.patterns = [];
    
    console.log('\n🔬 V13-SIMPLIFIED BACKTEST ENGINE');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Testing the bot with its hardcoded 65% confidence logic...');
    console.log('════════════════════════════════════════════════════════════\n');
  }

  /**
   * Simulate the bot's hardcoded confidence calculation
   * THIS IS EXACTLY WHAT THE BOT DOES!
   */
  calculateTradingConfidence(marketData, patterns) {
    let confidence = 0.65; // FIXED: Start with 65% base confidence
    
    try {
      // Pattern strength bonus - MUCH MORE AGGRESSIVE
      const patternBonus = patterns.reduce((sum, pattern) => {
        return sum + (pattern.strength * pattern.confidence);
      }, 0);
      
      confidence += patternBonus * 0.8; // Max 80% from patterns
      
      // Market conditions bonus
      if (marketData.volume > 500000) {
        confidence += 0.1; // High volume bonus
      }
      
      if (marketData.volatility > 0.02 && marketData.volatility < 0.04) {
        confidence += 0.1; // Optimal volatility bonus
      }
      
      // RSI confirmation bonus
      if ((marketData.rsi < 45 && patterns.some(p => p.direction === 'buy')) ||
          (marketData.rsi > 55 && patterns.some(p => p.direction === 'sell'))) {
        confidence += 0.15; // RSI confirmation bonus
      }
      
      // MACD confirmation bonus
      if ((marketData.macd > 0 && patterns.some(p => p.direction === 'buy')) ||
          (marketData.macd < 0 && patterns.some(p => p.direction === 'sell'))) {
        confidence += 0.1; // MACD confirmation bonus
      }
      
      // ALWAYS ADD VOLATILITY PATTERN TO GUARANTEE PATTERNS
      if (patterns.length === 0) {
        confidence += 0.2; // Volatility trading bonus
      }
      
      // Cap confidence at 95%
      confidence = Math.min(confidence, 0.95);
      
    } catch (error) {
      confidence = 0.6; // Higher safe fallback
    }
    
    return confidence;
  }

  /**
   * Simulate pattern detection (fake patterns like the bot)
   */
  detectPatterns(priceHistory) {
    const patterns = [];
    
    // Simulate finding random patterns (since the bot doesn't really use them)
    if (Math.random() > 0.5) {
      patterns.push({
        name: 'FakePattern',
        direction: Math.random() > 0.5 ? 'buy' : 'sell',
        strength: Math.random() * 0.3,
        confidence: Math.random() * 0.5 + 0.5
      });
    }
    
    return patterns;
  }

  /**
   * Calculate basic indicators
   */
  calculateIndicators(priceHistory) {
    if (priceHistory.length < 20) {
      return {
        rsi: 50,
        macd: 0,
        ema20: priceHistory[priceHistory.length - 1],
        volume: Math.random() * 1000000,
        volatility: 0.03
      };
    }

    // Simple RSI calculation
    const changes = [];
    for (let i = 1; i < priceHistory.length; i++) {
      changes.push(priceHistory[i] - priceHistory[i-1]);
    }
    
    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
    
    const avgGain = gains.length ? gains.reduce((a,b) => a+b, 0) / gains.length : 0;
    const avgLoss = losses.length ? losses.reduce((a,b) => a+b, 0) / losses.length : 0.001;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    // Simple MACD (12-26 EMA difference)
    const ema12 = this.calculateEMA(priceHistory, 12);
    const ema26 = this.calculateEMA(priceHistory, 26);
    const macd = ema12 - ema26;
    
    // Volatility (standard deviation)
    const avg = priceHistory.reduce((a,b) => a+b, 0) / priceHistory.length;
    const variance = priceHistory.reduce((sum, price) => {
      return sum + Math.pow(price - avg, 2);
    }, 0) / priceHistory.length;
    const volatility = Math.sqrt(variance) / avg;
    
    return {
      rsi,
      macd,
      ema20: this.calculateEMA(priceHistory, 20),
      volume: Math.random() * 1000000, // Fake volume since we don't have it
      volatility
    };
  }

  calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }
    
    return ema;
  }

  /**
   * Execute a trade
   */
  executeTrade(signal, price, timestamp) {
    const fee = price * this.config.fee;
    const slippage = price * this.config.slippage * Math.random();
    const actualPrice = signal.action === 'BUY' ? 
      price + slippage : price - slippage;
    
    if (signal.action === 'BUY' && !this.position) {
      // Open position
      const positionSize = this.results.balance * this.config.maxPositionSize;
      const shares = positionSize / actualPrice;
      const cost = (shares * actualPrice) + fee;
      
      if (cost <= this.results.balance) {
        this.position = {
          shares,
          entryPrice: actualPrice,
          entryTime: timestamp,
          stopLoss: actualPrice * (1 - this.config.stopLoss),
          takeProfit: actualPrice * (1 + this.config.takeProfit)
        };
        
        this.results.balance -= cost;
        this.results.totalFees += fee;
        
        console.log(`📈 BUY: ${shares.toFixed(4)} shares @ $${actualPrice.toFixed(2)} (Confidence: ${signal.confidence.toFixed(2)})`);
      }
    } else if (signal.action === 'SELL' && this.position) {
      // Close position
      const proceeds = (this.position.shares * actualPrice) - fee;
      const profit = proceeds - (this.position.shares * this.position.entryPrice);
      const profitPct = (profit / (this.position.shares * this.position.entryPrice)) * 100;
      
      this.results.balance += proceeds;
      this.results.totalFees += fee;
      
      if (profit > 0) {
        this.results.wins++;
      } else {
        this.results.losses++;
      }
      
      this.results.trades.push({
        entryTime: this.position.entryTime,
        exitTime: timestamp,
        entryPrice: this.position.entryPrice,
        exitPrice: actualPrice,
        profit: profit,
        profitPct: profitPct,
        confidence: signal.confidence
      });
      
      console.log(`📉 SELL: ${this.position.shares.toFixed(4)} shares @ $${actualPrice.toFixed(2)} | Profit: ${profit > 0 ? '✅' : '❌'} ${profitPct.toFixed(2)}%`);
      
      this.position = null;
    }
    
    // Check stop loss and take profit
    if (this.position) {
      if (price <= this.position.stopLoss) {
        console.log('🛑 STOP LOSS TRIGGERED!');
        this.executeTrade({ action: 'SELL', confidence: 1.0 }, price, timestamp);
      } else if (price >= this.position.takeProfit) {
        console.log('🎯 TAKE PROFIT TRIGGERED!');
        this.executeTrade({ action: 'SELL', confidence: 1.0 }, price, timestamp);
      }
    }
    
    // Track equity
    const currentEquity = this.position ? 
      this.results.balance + (this.position.shares * price) : 
      this.results.balance;
    
    this.results.equity.push(currentEquity);
    
    // Track drawdown
    if (currentEquity > this.results.peakBalance) {
      this.results.peakBalance = currentEquity;
    }
    const drawdown = (this.results.peakBalance - currentEquity) / this.results.peakBalance;
    if (drawdown > this.results.maxDrawdown) {
      this.results.maxDrawdown = drawdown;
    }
  }

  /**
   * Run the backtest
   */
  async runBacktest(historicalData) {
    console.log(`\n📊 Running backtest on ${historicalData.length} data points...`);
    console.log(`💰 Initial Balance: $${this.config.initialBalance}`);
    console.log(`📈 Min Confidence: ${this.config.minTradeConfidence}`);
    console.log(`📉 Stop Loss: ${this.config.stopLoss * 100}%`);
    console.log(`🎯 Take Profit: ${this.config.takeProfit * 100}%\n`);
    
    const priceHistory = [];
    
    for (let i = 0; i < historicalData.length; i++) {
      const dataPoint = historicalData[i];
      const price = dataPoint.close || dataPoint.price || dataPoint;
      const timestamp = dataPoint.timestamp || i;
      
      priceHistory.push(price);
      if (priceHistory.length > 100) {
        priceHistory.shift();
      }
      
      // Only trade after we have enough history
      if (priceHistory.length < 20) continue;
      
      // Calculate indicators
      const marketData = this.calculateIndicators(priceHistory);
      marketData.price = price;
      
      // Detect patterns (fake ones)
      this.patterns = this.detectPatterns(priceHistory);
      
      // Calculate confidence using bot's hardcoded logic
      const confidence = this.calculateTradingConfidence(marketData, this.patterns);
      
      // Generate signal
      let signal = { action: 'HOLD', confidence: confidence };
      
      if (confidence >= this.config.minTradeConfidence) {
        if (!this.position) {
          // Look for buy signal
          if (marketData.rsi < 45 || this.patterns.some(p => p.direction === 'buy')) {
            signal.action = 'BUY';
          }
        } else {
          // Look for sell signal
          if (marketData.rsi > 55 || this.patterns.some(p => p.direction === 'sell')) {
            signal.action = 'SELL';
          }
        }
      }
      
      // Execute trade if signal
      if (signal.action !== 'HOLD') {
        this.executeTrade(signal, price, timestamp);
      }
      
      // Progress indicator
      if ((i + 1) % Math.floor(historicalData.length / 10) === 0) {
        const progress = ((i + 1) / historicalData.length * 100).toFixed(0);
        console.log(`⏳ Progress: ${progress}%`);
      }
    }
    
    // Close any open position at end
    if (this.position) {
      const lastPrice = historicalData[historicalData.length - 1].close || historicalData[historicalData.length - 1];
      this.executeTrade({ action: 'SELL', confidence: 1.0 }, lastPrice, historicalData.length);
    }
    
    return this.generateReport();
  }

  /**
   * Generate backtest report
   */
  generateReport() {
    const totalTrades = this.results.trades.length;
    const winRate = totalTrades > 0 ? (this.results.wins / totalTrades) * 100 : 0;
    const finalEquity = this.results.equity[this.results.equity.length - 1];
    const totalReturn = ((finalEquity - this.config.initialBalance) / this.config.initialBalance) * 100;
    
    // Calculate average trade
    const avgProfit = totalTrades > 0 ? 
      this.results.trades.reduce((sum, t) => sum + t.profitPct, 0) / totalTrades : 0;
    
    // Calculate Sharpe ratio (simplified)
    const returns = [];
    for (let i = 1; i < this.results.equity.length; i++) {
      returns.push((this.results.equity[i] - this.results.equity[i-1]) / this.results.equity[i-1]);
    }
    const avgReturn = returns.reduce((a,b) => a+b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('                  📊 BACKTEST RESULTS');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`\n💰 FINANCIAL PERFORMANCE:`);
    console.log(`  Initial Balance:  $${this.config.initialBalance.toFixed(2)}`);
    console.log(`  Final Balance:    $${finalEquity.toFixed(2)}`);
    console.log(`  Total Return:     ${totalReturn > 0 ? '📈' : '📉'} ${totalReturn.toFixed(2)}%`);
    console.log(`  Max Drawdown:     ${(this.results.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`  Total Fees Paid:  $${this.results.totalFees.toFixed(2)}`);
    
    console.log(`\n📈 TRADING STATISTICS:`);
    console.log(`  Total Trades:     ${totalTrades}`);
    console.log(`  Winning Trades:   ${this.results.wins}`);
    console.log(`  Losing Trades:    ${this.results.losses}`);
    console.log(`  Win Rate:         ${winRate.toFixed(1)}%`);
    console.log(`  Avg Trade Return: ${avgProfit.toFixed(2)}%`);
    console.log(`  Sharpe Ratio:     ${sharpeRatio.toFixed(2)}`);
    
    console.log(`\n🎲 CONFIDENCE ANALYSIS:`);
    if (totalTrades > 0) {
      const avgConfidence = this.results.trades.reduce((sum, t) => sum + t.confidence, 0) / totalTrades;
      console.log(`  Avg Trade Confidence: ${avgConfidence.toFixed(2)}`);
      console.log(`  Min Confidence Used:  ${Math.min(...this.results.trades.map(t => t.confidence)).toFixed(2)}`);
      console.log(`  Max Confidence Used:  ${Math.max(...this.results.trades.map(t => t.confidence)).toFixed(2)}`);
    }
    
    console.log(`\n⚠️ REALITY CHECK:`);
    console.log(`  This bot starts with 65% confidence ALWAYS`);
    console.log(`  Pattern detection is NOT connected`);
    console.log(`  Risk management is NOT connected`);
    console.log(`  23 imported modules are NOT USED`);
    
    console.log('\n════════════════════════════════════════════════════════════\n');
    
    // Save results
    const report = {
      config: this.config,
      results: {
        ...this.results,
        finalEquity,
        totalReturn,
        winRate,
        avgProfit,
        sharpeRatio
      },
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('backtest-results-v13-simplified.json', JSON.stringify(report, null, 2));
    console.log('📁 Results saved to: backtest-results-v13-simplified.json\n');
    
    return report;
  }
}

// ========================================================================
// 🚀 RUN THE BACKTEST
// ========================================================================

async function main() {
  // Load historical data
  console.log('📂 Loading historical data...');
  
  let historicalData;
  
  // Try to load Polygon BTC data
  try {
    const btcData = JSON.parse(fs.readFileSync('polygon-btc-1y.json', 'utf8'));
    if (Array.isArray(btcData)) {
      historicalData = btcData.map(d => ({
        price: d.c || d.close || d.price,
        close: d.c || d.close || d.price,
        timestamp: d.t || d.timestamp
      }));
    } else if (btcData.results) {
      historicalData = btcData.results.map(d => ({
        price: d.c || d.close,
        close: d.c || d.close,
        timestamp: d.t
      }));
    }
    console.log(`✅ Loaded ${historicalData.length} BTC price points\n`);
  } catch (error) {
    console.log('⚠️ No historical data found, generating synthetic data...');
    
    // Generate synthetic price data
    historicalData = [];
    let price = 30000;
    for (let i = 0; i < 1000; i++) {
      // Random walk with trend
      const change = (Math.random() - 0.48) * 500; // Slight upward bias
      price = Math.max(20000, Math.min(60000, price + change));
      historicalData.push({
        price: price,
        close: price,
        timestamp: Date.now() + i * 3600000
      });
    }
    console.log(`✅ Generated ${historicalData.length} synthetic price points\n`);
  }
  
  // Create backtester
  const backtester = new V13SimplifiedBacktest({
    initialBalance: 10000,
    maxPositionSize: 0.25,
    minTradeConfidence: 0.55, // Bot's default
    stopLoss: 0.015,
    takeProfit: 0.025
  });
  
  // Run backtest
  const results = await backtester.runBacktest(historicalData);
  
  console.log('✅ BACKTEST COMPLETE!\n');
  console.log('The v13-simplified bot with hardcoded 65% confidence has been tested.');
  console.log('As expected, it\'s basically trading on random signals with fake patterns.\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { V13SimplifiedBacktest };