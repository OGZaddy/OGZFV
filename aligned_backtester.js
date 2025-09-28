#!/usr/bin/env node

/**
 * ALIGNED BACKTESTER - 100% matches live trading system
 * Uses EXACT same logic as simple_kraken_trader.js and RealKrakenTrading.js
 */

require('dotenv').config();
const fs = require('fs');

class AlignedBacktester {
  constructor(config = {}) {
    // EXACT same config as simple_kraken_trader.js
    this.config = {
      symbol: 'BTC-USD',
      tradeAmount: 0.001, // Same as live trader
      interval: 60000, // 1 minute between trades
      startBalance: config.startBalance || 1000, // Starting USD
      ...config
    };

    // Trading state
    this.balance = this.config.startBalance;
    this.btcHoldings = 0;
    this.trades = [];
    this.tradeCount = 0;

    // Performance tracking
    this.stats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      maxDrawdown: 0,
      peakBalance: this.config.startBalance
    };

    console.log(`🔬 ALIGNED BACKTESTER INITIALIZED`);
    console.log(`💰 Starting balance: $${this.balance}`);
    console.log(`₿ Trade amount: ${this.config.tradeAmount} BTC`);
  }

  /**
   * EXACT SAME TRADING LOGIC as simple_kraken_trader.js
   */
  makeTradeDecision(price) {
    // Simple trading logic - buy if price ends in even number, sell if odd
    // THIS MUST MATCH simple_kraken_trader.js EXACTLY
    const shouldBuy = Math.floor(price) % 2 === 0;
    return shouldBuy ? 'buy' : 'sell';
  }

  /**
   * Execute trade with EXACT same logic as live system
   */
  executeTrade(direction, price, timestamp) {
    const tradeValue = this.config.tradeAmount * price;

    // Kraken fees (0.26% maker/taker)
    const feeRate = 0.0026;
    const fee = tradeValue * feeRate;

    let trade = {
      id: `backtest_${this.tradeCount++}`,
      timestamp,
      direction,
      price,
      quantity: this.config.tradeAmount,
      value: tradeValue,
      fee,
      success: false,
      reason: null
    };

    if (direction === 'buy') {
      // Check if we have enough USD to buy
      const totalCost = tradeValue + fee;
      if (this.balance >= totalCost) {
        this.balance -= totalCost;
        this.btcHoldings += this.config.tradeAmount;
        trade.success = true;
        trade.balanceAfter = this.balance;
        trade.btcAfter = this.btcHoldings;
      } else {
        trade.reason = 'Insufficient USD balance';
      }
    } else { // sell
      // Check if we have enough BTC to sell
      if (this.btcHoldings >= this.config.tradeAmount) {
        this.btcHoldings -= this.config.tradeAmount;
        this.balance += (tradeValue - fee);
        trade.success = true;
        trade.balanceAfter = this.balance;
        trade.btcAfter = this.btcHoldings;
      } else {
        trade.reason = 'Insufficient BTC holdings';
      }
    }

    if (trade.success) {
      this.stats.totalTrades++;
      this.updatePerformanceStats(trade);
    }

    this.trades.push(trade);
    return trade;
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats(trade) {
    const currentPortfolioValue = this.getCurrentPortfolioValue(trade.price);

    // Track peak and drawdown
    if (currentPortfolioValue > this.stats.peakBalance) {
      this.stats.peakBalance = currentPortfolioValue;
    }

    const drawdown = (this.stats.peakBalance - currentPortfolioValue) / this.stats.peakBalance;
    if (drawdown > this.stats.maxDrawdown) {
      this.stats.maxDrawdown = drawdown;
    }

    // Calculate trade profit (only after completing a round trip)
    if (this.trades.length >= 2) {
      const lastTrade = this.trades[this.trades.length - 2];
      if (lastTrade.direction !== trade.direction && lastTrade.success && trade.success) {
        let profit = 0;
        if (lastTrade.direction === 'buy' && trade.direction === 'sell') {
          profit = (trade.price - lastTrade.price) * trade.quantity - lastTrade.fee - trade.fee;
        } else if (lastTrade.direction === 'sell' && trade.direction === 'buy') {
          profit = (lastTrade.price - trade.price) * trade.quantity - lastTrade.fee - trade.fee;
        }

        this.stats.totalProfit += profit;
        if (profit > 0) {
          this.stats.winningTrades++;
        } else {
          this.stats.losingTrades++;
        }
      }
    }
  }

  /**
   * Get current portfolio value in USD
   */
  getCurrentPortfolioValue(currentBtcPrice) {
    return this.balance + (this.btcHoldings * currentBtcPrice);
  }

  /**
   * Run backtest on historical data
   */
  async runBacktest(historicalData) {
    console.log(`\n🚀 Starting backtest with ${historicalData.length} data points...\n`);

    for (let i = 0; i < historicalData.length; i++) {
      const dataPoint = historicalData[i];
      const price = dataPoint.price || dataPoint.close || dataPoint.c;
      const timestamp = dataPoint.timestamp || dataPoint.time || Date.now();

      // Make trading decision using EXACT same logic as live system
      const direction = this.makeTradeDecision(price);

      // Execute trade
      const trade = this.executeTrade(direction, price, timestamp);

      // Log progress every 100 trades
      if (i % 100 === 0) {
        const portfolioValue = this.getCurrentPortfolioValue(price);
        console.log(`📊 Trade ${i}: ${direction.toUpperCase()} at $${price.toFixed(2)} | Portfolio: $${portfolioValue.toFixed(2)}`);
      }
    }

    return this.generateResults();
  }

  /**
   * Generate final backtest results
   */
  generateResults() {
    const finalPrice = this.trades.length > 0 ? this.trades[this.trades.length - 1].price : 0;
    const finalPortfolioValue = this.getCurrentPortfolioValue(finalPrice);
    const totalReturn = ((finalPortfolioValue - this.config.startBalance) / this.config.startBalance) * 100;
    const winRate = this.stats.totalTrades > 0 ? (this.stats.winningTrades / this.stats.totalTrades) * 100 : 0;

    const results = {
      summary: {
        startBalance: this.config.startBalance,
        finalBalance: this.balance,
        btcHoldings: this.btcHoldings,
        finalPortfolioValue,
        totalReturn: `${totalReturn.toFixed(2)}%`,
        totalProfit: this.stats.totalProfit
      },
      performance: {
        totalTrades: this.stats.totalTrades,
        winningTrades: this.stats.winningTrades,
        losingTrades: this.stats.losingTrades,
        winRate: `${winRate.toFixed(2)}%`,
        maxDrawdown: `${(this.stats.maxDrawdown * 100).toFixed(2)}%`
      },
      trades: this.trades
    };

    // Display results
    console.log(`\n✅ BACKTEST COMPLETE\n`);
    console.log(`📊 PERFORMANCE SUMMARY:`);
    console.log(`   Starting Balance: $${results.summary.startBalance}`);
    console.log(`   Final Portfolio Value: $${results.summary.finalPortfolioValue.toFixed(2)}`);
    console.log(`   Total Return: ${results.summary.totalReturn}`);
    console.log(`   Total Profit: $${results.summary.totalProfit.toFixed(2)}`);
    console.log(`\n📈 TRADING STATS:`);
    console.log(`   Total Trades: ${results.performance.totalTrades}`);
    console.log(`   Win Rate: ${results.performance.winRate}`);
    console.log(`   Max Drawdown: ${results.performance.maxDrawdown}`);

    return results;
  }

  /**
   * Save results to file
   */
  saveResults(results, filename = 'aligned_backtest_results.json') {
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to ${filename}`);
  }
}

// Sample usage with mock data
async function runSampleBacktest() {
  // Generate sample historical data (you'd replace this with real data)
  const sampleData = [];
  let basePrice = 109000;

  for (let i = 0; i < 1000; i++) {
    // Random walk price data
    const change = (Math.random() - 0.5) * 1000;
    basePrice += change;
    basePrice = Math.max(basePrice, 50000); // Floor at $50k

    sampleData.push({
      timestamp: Date.now() + (i * 60000), // 1 minute intervals
      price: basePrice
    });
  }

  const backtester = new AlignedBacktester({
    startBalance: 1000
  });

  const results = await backtester.runBacktest(sampleData);
  backtester.saveResults(results);
}

module.exports = AlignedBacktester;

// Run sample if called directly
if (require.main === module) {
  runSampleBacktest().catch(console.error);
}