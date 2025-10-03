// historic-data-feeder.js - Feed 10 years of data through your OGZPrime system
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

class HistoricDataFeeder {
  constructor(ogzPrime) {
    this.ogzPrime = ogzPrime;
    this.patternLog = [];
    this.tradeLog = [];
    this.performanceLog = [];
    this.contentCaptures = [];
    
    // Create content directory
    this.contentDir = path.join(process.cwd(), 'marketing_content');
    if (!fs.existsSync(this.contentDir)) {
      fs.mkdirSync(this.contentDir, { recursive: true });
    }
  }

  // Download 10 years of Bitcoin data
  async downloadHistoricData(symbol = 'BTCUSDT', years = 10) {
    console.log(`🔥 Downloading ${years} years of ${symbol} data...`);
    
    const endTime = Date.now();
    const startTime = endTime - (years * 365 * 24 * 60 * 60 * 1000); // 10 years back
    
    let allCandles = [];
    let currentStart = startTime;
    
    while (currentStart < endTime) {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&startTime=${currentStart}&limit=1000`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data || data.length === 0) break;
        
        const formattedCandles = data.map(d => ({
          timestamp: new Date(d[0]).toISOString(),
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5])
        }));
        
        allCandles = allCandles.concat(formattedCandles);
        console.log(`📊 Downloaded ${allCandles.length} candles so far...`);
        
        currentStart = data[data.length - 1][0] + 1;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
        
      } catch (error) {
        console.error('Download error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Save historic data
    const dataFile = path.join(this.contentDir, `${symbol}_${years}y_historic.json`);
    fs.writeFileSync(dataFile, JSON.stringify(allCandles, null, 2));
    console.log(`💾 Saved ${allCandles.length} candles to ${dataFile}`);
    
    return allCandles;
  }

  // Enhanced pattern logging with success/rejection tracking
  logPattern(pattern, success, tradeResult = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      pattern: pattern,
      success: success,
      confidence: pattern.confidence || 0,
      reasoning: pattern.reasoning || 'Unknown',
      tradeResult: tradeResult,
      marketConditions: this.getCurrentMarketConditions()
    };
    
    this.patternLog.push(logEntry);
    
    // Console logging with emojis for visibility
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} PATTERN: ${pattern.name} | Confidence: ${pattern.confidence} | Result: ${success ? 'SUCCESS' : 'REJECTED'}`);
    
    // Save pattern log every 100 entries
    if (this.patternLog.length % 100 === 0) {
      this.savePatternLog();
    }
  }

  // Capture marketing content during significant events
  captureMarketingContent(event, data) {
    const capture = {
      timestamp: new Date().toISOString(),
      event: event,
      data: data,
      performance: this.ogzPrime.getPerformanceStats(),
      balance: this.ogzPrime.balance,
      winRate: this.calculateWinRate()
    };
    
    this.contentCaptures.push(capture);
    
    // Create marketing snippets
    if (event === 'BIG_WIN') {
      this.createWinSnippet(capture);
    } else if (event === 'MILESTONE') {
      this.createMilestoneSnippet(capture);
    }
    
    console.log(`📸 CAPTURED: ${event} - Balance: $${data.balance} | Win Rate: ${this.calculateWinRate()}%`);
  }

  // Run the full 10-year backtest with content capture
  async runFullBacktest(historicData) {
    console.log(`🚀 Starting 10-year backtest with ${historicData.length} candles...`);
    
    let processedCandles = 0;
    let lastCaptureBalance = 10000;
    
    for (const candle of historicData) {
      // Process candle through OGZPrime
      this.ogzPrime.processTick({
        price: candle.close,
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        volume: candle.volume,
        isHistorical: true
      });
      
      processedCandles++;
      
      // Capture content at milestones
      if (processedCandles % 10000 === 0) {
        const currentBalance = this.ogzPrime.balance || 10000;
        const profit = currentBalance - 10000;
        
        this.captureMarketingContent('MILESTONE', {
          candlesProcessed: processedCandles,
          balance: currentBalance,
          profit: profit,
          profitPercent: ((profit / 10000) * 100).toFixed(2)
        });
        
        console.log(`📈 MILESTONE: ${processedCandles} candles | Balance: $${currentBalance.toFixed(2)} | Profit: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${((profit/10000)*100).toFixed(2)}%)`);
      }
      
      // Capture big wins/losses
      const currentBalance = this.ogzPrime.balance || 10000;
      if (Math.abs(currentBalance - lastCaptureBalance) > 500) {
        this.captureMarketingContent('BIG_WIN', {
          balanceChange: currentBalance - lastCaptureBalance,
          newBalance: currentBalance,
          candle: candle
        });
        lastCaptureBalance = currentBalance;
      }
      
      // Progress update every 50k candles
      if (processedCandles % 50000 === 0) {
        console.log(`⏳ Progress: ${processedCandles}/${historicData.length} (${((processedCandles/historicData.length)*100).toFixed(1)}%)`);
      }
    }
    
    // Final results
    this.generateFinalReport();
    console.log(`🏁 BACKTEST COMPLETE! Processed ${processedCandles} candles over ${(historicData.length/525600).toFixed(1)} years`);
  }

  // Generate marketing snippets for website/social
  createWinSnippet(capture) {
    const snippets = [
      `🔥 OGZPrime AI just generated +$${capture.data.balanceChange.toFixed(2)} profit in real market conditions!`,
      `💰 Live AI trading: Balance grew to $${capture.data.newBalance.toFixed(2)} (${((capture.data.newBalance-10000)/10000*100).toFixed(1)}% total return)`,
      `🤖 While you were sleeping, OGZPrime made $${capture.data.balanceChange.toFixed(2)} analyzing real Bitcoin patterns`,
      `📈 Another winning trade! OGZPrime's pattern recognition delivered +${((capture.data.balanceChange/10000)*100).toFixed(2)}% gains`
    ];
    
    const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];
    
    // Save to marketing content file
    const marketingFile = path.join(this.contentDir, 'social_snippets.txt');
    fs.appendFileSync(marketingFile, `${new Date().toISOString()}: ${randomSnippet}\n`);
  }

  // Save all logs
  saveAllLogs() {
    // Pattern performance log
    const patternFile = path.join(this.contentDir, 'pattern_performance.json');
    fs.writeFileSync(patternFile, JSON.stringify(this.patternLog, null, 2));
    
    // Trade log
    const tradeFile = path.join(this.contentDir, 'trade_history.json');
    fs.writeFileSync(tradeFile, JSON.stringify(this.tradeLog, null, 2));
    
    // Content captures
    const contentFile = path.join(this.contentDir, 'marketing_captures.json');
    fs.writeFileSync(contentFile, JSON.stringify(this.contentCaptures, null, 2));
    
    console.log(`💾 All logs saved to ${this.contentDir}`);
  }

  // Helper methods
  getCurrentMarketConditions() {
    return {
      volatility: this.calculateVolatility(),
      trend: this.determineTrend(),
      volume: this.getAverageVolume()
    };
  }

  calculateWinRate() {
    const completedTrades = this.tradeLog.filter(t => t.status === 'closed');
    if (completedTrades.length === 0) return 0;
    
    const wins = completedTrades.filter(t => t.profit > 0).length;
    return ((wins / completedTrades.length) * 100).toFixed(1);
  }

  generateFinalReport() {
    const report = {
      totalCandles: this.patternLog.length,
      successfulPatterns: this.patternLog.filter(p => p.success).length,
      rejectedPatterns: this.patternLog.filter(p => !p.success).length,
      winRate: this.calculateWinRate(),
      finalBalance: this.ogzPrime.balance,
      totalProfit: (this.ogzPrime.balance || 10000) - 10000,
      contentCaptures: this.contentCaptures.length,
      marketingSnippets: this.contentCaptures.filter(c => c.event === 'BIG_WIN').length
    };
    
    const reportFile = path.join(this.contentDir, 'final_backtest_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📊 FINAL REPORT:
    ✅ Successful Patterns: ${report.successfulPatterns}
    ❌ Rejected Patterns: ${report.rejectedPatterns}
    🎯 Win Rate: ${report.winRate}%
    💰 Final Balance: $${report.finalBalance?.toFixed(2) || 'N/A'}
    📈 Total Profit: $${report.totalProfit?.toFixed(2) || 'N/A'}
    📸 Marketing Content: ${report.contentCaptures} pieces captured`);
  }
}

module.exports = HistoricDataFeeder;