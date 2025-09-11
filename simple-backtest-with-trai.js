// ========================================================================
// 🚀 SIMPLE BACKTEST WITH TRAI INTEGRATION
// ========================================================================
// Simplified backtest that sends all trades to TRAI for analysis
// ========================================================================

const fs = require('fs');
const WebSocket = require('ws');

class SimpleBacktestWithTRAI {
  constructor(config = {}) {
    console.log('\n🚀 SIMPLE BACKTEST WITH TRAI');
    console.log('════════════════════════════════════════');
    
    this.config = {
      initialBalance: config.initialBalance || 10000,
      positionSize: config.positionSize || 0.1, // 10% per trade
      stopLoss: config.stopLoss || 0.03, // 3% stop loss
      takeProfit: config.takeProfit || 0.05, // 5% take profit
      fee: config.fee || 0.001 // 0.1% fee
    };
    
    // State
    this.balance = this.config.initialBalance;
    this.position = null;
    this.trades = [];
    this.wins = 0;
    this.losses = 0;
    
    // TRAI connection
    this.traiConnected = false;
    this.traiWs = null;
    this.traiResponses = [];
  }
  
  async connectToTRAI() {
    console.log('🔌 Connecting to TRAI via SSL server...');
    
    return new Promise((resolve) => {
      this.traiWs = new WebSocket('ws://127.0.0.1:3010/ws', {
        headers: {
          'X-Client-Type': 'SimpleBacktest',
          'User-Agent': 'Simple-Backtest-TRAI'
        }
      });
      
      this.traiWs.on('open', () => {
        console.log('✅ Connected to TRAI');
        this.traiConnected = true;
        
        // Identify
        this.traiWs.send(JSON.stringify({
          type: 'identify',
          source: 'simple_backtest',
          purpose: 'testing_trai_integration'
        }));
        
        resolve();
      });
      
      this.traiWs.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'trade_analysis' || msg.type === 'answer') {
            console.log('\n🧠 TRAI Response:', 
              msg.data?.analysis?.substring(0, 100) || 
              msg.data?.answer?.substring(0, 100) || 
              'Analysis received');
            this.traiResponses.push(msg);
          }
        } catch (error) {
          console.error('Failed to parse TRAI message');
        }
      });
      
      this.traiWs.on('error', (error) => {
        console.error('❌ TRAI connection error:', error.message);
        resolve(); // Continue without TRAI
      });
      
      this.traiWs.on('close', () => {
        console.log('TRAI connection closed');
        this.traiConnected = false;
      });
      
      // Timeout
      setTimeout(() => {
        if (!this.traiConnected) {
          console.log('⚠️ TRAI timeout - continuing without');
          resolve();
        }
      }, 3000);
    });
  }
  
  sendToTRAI(type, data) {
    if (!this.traiConnected) return;
    
    try {
      this.traiWs.send(JSON.stringify({
        type: type,
        data: data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to send to TRAI:', error.message);
    }
  }
  
  calculateRSI(prices) {
    if (prices.length < 14) return 50;
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i-1];
      if (change > 0) gains.push(change);
      else losses.push(Math.abs(change));
    }
    
    const avgGain = gains.length > 0 ? gains.reduce((a,b) => a+b, 0) / 14 : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a,b) => a+b, 0) / 14 : 1;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  executeTrade(direction, price, confidence, reason) {
    const size = this.balance * this.config.positionSize;
    const fee = size * this.config.fee;
    
    const trade = {
      id: `trade_${this.trades.length + 1}`,
      direction: direction,
      entryPrice: price,
      size: size - fee,
      confidence: confidence,
      reason: reason,
      timestamp: Date.now()
    };
    
    this.position = trade;
    this.trades.push(trade);
    
    console.log(`\n📈 ${direction.toUpperCase()} @ $${price.toFixed(2)}`);
    console.log(`   Size: $${trade.size.toFixed(2)}, Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   Reason: ${reason}`);
    
    // Send to TRAI for analysis
    this.sendToTRAI('trade', {
      ...trade,
      balance: this.balance,
      totalTrades: this.trades.length
    });
    
    // Ask TRAI for insight every 5 trades
    if (this.trades.length % 5 === 0) {
      this.sendToTRAI('question', 
        `Analyze the last 5 trades. Win rate: ${(this.wins/(this.wins+this.losses)*100).toFixed(1)}%. What patterns do you see?`
      );
    }
  }
  
  closePosition(price, reason) {
    if (!this.position) return;
    
    const pnl = this.position.direction === 'long'
      ? (price - this.position.entryPrice) / this.position.entryPrice
      : (this.position.entryPrice - price) / this.position.entryPrice;
    
    const pnlAmount = this.position.size * pnl;
    this.balance += this.position.size + pnlAmount;
    
    if (pnl > 0) {
      this.wins++;
      console.log(`   ✅ CLOSED: +${(pnl * 100).toFixed(2)}% ($${pnlAmount.toFixed(2)})`);
    } else {
      this.losses++;
      console.log(`   ❌ CLOSED: ${(pnl * 100).toFixed(2)}% ($${pnlAmount.toFixed(2)})`);
    }
    console.log(`   Balance: $${this.balance.toFixed(2)}`);
    
    // Send result to TRAI
    this.sendToTRAI('trade_result', {
      tradeId: this.position.id,
      exitPrice: price,
      pnl: pnl,
      pnlAmount: pnlAmount,
      reason: reason,
      balance: this.balance
    });
    
    this.position = null;
  }
  
  async run(data) {
    await this.connectToTRAI();
    
    console.log(`\n📊 Running backtest on ${data.length} candles...\n`);
    
    const prices = [];
    
    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      const price = candle.close || candle.c || candle.price;
      prices.push(price);
      
      if (prices.length < 100) continue; // Need history
      
      const rsi = this.calculateRSI(prices.slice(-14));
      const momentum = (price - prices[prices.length - 10]) / prices[prices.length - 10];
      
      // Check position management
      if (this.position) {
        const pnl = this.position.direction === 'long'
          ? (price - this.position.entryPrice) / this.position.entryPrice
          : (this.position.entryPrice - price) / this.position.entryPrice;
        
        if (pnl >= this.config.takeProfit) {
          this.closePosition(price, 'TAKE_PROFIT');
        } else if (pnl <= -this.config.stopLoss) {
          this.closePosition(price, 'STOP_LOSS');
        }
      }
      
      // Entry signals
      if (!this.position) {
        let confidence = 0.5; // Base confidence
        let direction = null;
        let reason = '';
        
        // Oversold bounce
        if (rsi < 30 && momentum > 0) {
          direction = 'long';
          confidence = 0.7;
          reason = `Oversold bounce (RSI=${rsi.toFixed(1)})`;
        }
        // Overbought short
        else if (rsi > 70 && momentum < 0) {
          direction = 'short';
          confidence = 0.65;
          reason = `Overbought reversal (RSI=${rsi.toFixed(1)})`;
        }
        // Momentum long
        else if (momentum > 0.01 && rsi < 60) {
          direction = 'long';
          confidence = 0.6;
          reason = `Momentum surge (${(momentum*100).toFixed(2)}%)`;
        }
        
        if (direction && confidence > 0.55) {
          this.executeTrade(direction, price, confidence, reason);
        }
      }
      
      // Progress
      if (i % 500 === 0) {
        console.log(`Progress: ${i}/${data.length} (${(i/data.length*100).toFixed(1)}%)`);
      }
    }
    
    // Close any open position
    if (this.position) {
      const lastPrice = prices[prices.length - 1];
      this.closePosition(lastPrice, 'END_OF_DATA');
    }
    
    // Final report
    this.printReport();
    
    // Ask TRAI for final analysis
    if (this.traiConnected) {
      this.sendToTRAI('question', 
        `Final backtest results: ${this.trades.length} trades, ${this.wins} wins, ${this.losses} losses, ` +
        `final balance $${this.balance.toFixed(2)} from $${this.config.initialBalance}. ` +
        `What are your key insights and recommendations?`
      );
      
      // Wait for TRAI's response
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Close connection
    if (this.traiWs) {
      this.traiWs.close();
    }
  }
  
  printReport() {
    const totalReturn = ((this.balance - this.config.initialBalance) / this.config.initialBalance) * 100;
    const winRate = this.trades.length > 0 ? (this.wins / this.trades.length) * 100 : 0;
    
    console.log('\n════════════════════════════════════════');
    console.log('📊 BACKTEST RESULTS');
    console.log('════════════════════════════════════════');
    console.log(`Initial Balance: $${this.config.initialBalance}`);
    console.log(`Final Balance: $${this.balance.toFixed(2)}`);
    console.log(`Total Return: ${totalReturn.toFixed(2)}%`);
    console.log(`Total Trades: ${this.trades.length}`);
    console.log(`Wins: ${this.wins}`);
    console.log(`Losses: ${this.losses}`);
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    
    if (this.traiResponses.length > 0) {
      console.log(`\n🧠 TRAI Insights Received: ${this.traiResponses.length}`);
    }
  }
}

// Main execution
async function main() {
  try {
    // Load data
    const data = JSON.parse(fs.readFileSync('polygon-btc-1y.json', 'utf8'));
    const testData = data.slice(-2000); // Last 2000 candles
    
    console.log(`📊 Loaded ${testData.length} candles for testing`);
    
    // Create and run backtest
    const backtest = new SimpleBacktestWithTRAI({
      initialBalance: 10000,
      positionSize: 0.1,
      stopLoss: 0.03,
      takeProfit: 0.05
    });
    
    await backtest.run(testData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleBacktestWithTRAI;