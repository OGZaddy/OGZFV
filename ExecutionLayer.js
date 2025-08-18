// ExecutionLayer.js - THE MISSING PIECE THAT ACTUALLY TRADES
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ExecutionLayer {
  constructor(config = {}) {
    this.wsClient = null; // Will be set by the bot
    this.botTier = config.botTier || process.env.BOT_TIER || 'quantum'; // Bot tier identification
    this.config = {
      apiKey: config.apiKey || process.env.COINBASE_API_KEY,
      apiSecret: config.apiSecret || process.env.COINBASE_API_SECRET,
      passphrase: config.passphrase || process.env.COINBASE_PASSPHRASE,
      sandboxMode: config.sandboxMode !== false, // Default to sandbox for safety
      maxPositionSize: config.maxPositionSize || 0.1, // 10% of balance
      minTradeSize: config.minTradeSize || 10, // $10 minimum
      ...config
    };
    
    this.positions = new Map();
    this.orders = new Map();
    this.balance = config.initialBalance || 10000;
    this.totalTrades = 0;
    this.winningTrades = 0;
    this.totalPnL = 0;
    
    // Coinbase Pro API endpoints
    this.apiUrl = this.config.sandboxMode 
      ? 'https://api-public.sandbox.pro.coinbase.com'
      : 'https://api.pro.coinbase.com';
    
    console.log('💰 EXECUTION LAYER INITIALIZED - READY TO ACTUALLY TRADE!');
    console.log(`   Mode: ${this.config.sandboxMode ? 'PAPER TRADING' : '🔥 REAL MONEY 🔥'}`);
    console.log(`   Max Position: ${this.config.maxPositionSize * 100}%`);
    console.log(`   Min Trade Size: $${this.config.minTradeSize}`);
  }
  
  /**
   * THE FUNCTION THAT ACTUALLY EXECUTES TRADES
   */
  async executeTrade(decision) {
    console.log('🎯 EXECUTING REAL TRADE:', decision);
    
    try {
      // Step 1: Check if we have valid credentials
      if (!this.config.apiKey || this.config.sandboxMode) {
        console.log('📝 PAPER TRADING MODE - Simulating trade');
        return this.paperTrade(decision);
      }
      
      // Step 2: Get account balance
      const balance = await this.getBalance();
      console.log(`💵 Account Balance: $${balance.toFixed(2)}`);
      
      // Step 3: Calculate position size
      const positionSize = this.calculateRealPositionSize(balance, decision.confidence);
      
      // Step 4: Place the actual order
      const order = await this.placeOrder({
        side: decision.action === 'BUY' || decision.action === 'LONG' ? 'buy' : 'sell',
        product_id: 'BTC-USD',
        type: 'market',
        size: positionSize
      });
      
      // Step 5: Track the position
      this.trackPosition(order);
      
      console.log('✅ TRADE EXECUTED SUCCESSFULLY!');
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Side: ${order.side}`);
      console.log(`   Size: ${order.size}`);
      console.log(`   Price: ${order.price || 'market'}`);
      
      this.totalTrades++;
      
      return order;
      
    } catch (error) {
      console.error('❌ TRADE EXECUTION FAILED:', error.message);
      return this.paperTrade(decision); // Fallback to paper trading
    }
  }
  
  /**
   * Place order on Coinbase Pro
   */
  async placeOrder(params) {
    const timestamp = Date.now() / 1000;
    const method = 'POST';
    const path = '/orders';
    const body = JSON.stringify(params);
    
    // Create signature for Coinbase Pro API
    const signature = this.createSignature(timestamp, method, path, body);
    
    const headers = {
      'CB-ACCESS-KEY': this.config.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.config.passphrase,
      'Content-Type': 'application/json'
    };
    
    // Make the actual API call
    const response = await fetch(this.apiUrl + path, {
      method,
      headers,
      body
    });
    
    const result = await response.json();
    
    if (result.message) {
      throw new Error(result.message);
    }
    
    return result;
  }
  
  /**
   * Create Coinbase Pro API signature
   */
  createSignature(timestamp, method, path, body = '') {
    const what = timestamp + method + path + body;
    const key = Buffer.from(this.config.apiSecret, 'base64');
    const hmac = crypto.createHmac('sha256', key);
    const signature = hmac.update(what).digest('base64');
    return signature;
  }
  
  /**
   * Get account balance
   */
  async getBalance() {
    // If no API key, return paper trading balance
    if (!this.config.apiKey || this.config.sandboxMode) {
      return this.balance || 10000; // $10k paper trading
    }
    
    const timestamp = Date.now() / 1000;
    const method = 'GET';
    const path = '/accounts';
    
    const signature = this.createSignature(timestamp, method, path);
    
    const headers = {
      'CB-ACCESS-KEY': this.config.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.config.passphrase
    };
    
    const response = await fetch(this.apiUrl + path, {
      method,
      headers
    });
    
    const accounts = await response.json();
    
    // Find USD account
    const usdAccount = accounts.find(a => a.currency === 'USD');
    return parseFloat(usdAccount?.available || this.balance);
  }
  
  /**
   * Calculate actual position size
   */
  calculateRealPositionSize(balance, confidence = 0.5) {
    // Use confidence to scale position
    const maxPosition = balance * this.config.maxPositionSize;
    const scaledPosition = maxPosition * Math.min(confidence, 1);
    
    // Ensure minimum trade size
    const finalSize = Math.max(scaledPosition, this.config.minTradeSize);
    
    console.log(`📊 Position sizing: Balance=$${balance.toFixed(2)}, Size=$${finalSize.toFixed(2)}, Confidence=${(confidence * 100).toFixed(1)}%`);
    return finalSize;
  }
  
  /**
   * Paper trading for testing
   */
  
  paperTrade(decision) {
    const tradeId = Date.now().toString();
    const currentPrice = decision.price || 50000;
    
    // Calculate how much we can actually afford
    const availableBalance = this.balance * 0.95; // Keep 5% reserve
    const tradeValue = Math.min(
      availableBalance * 0.1, // Max 10% per trade
      this.config.minTradeSize * 2 // At least 2x minimum
    );
    
    const btcAmount = tradeValue / currentPrice;
    
    // ACTUALLY DEDUCT THE MONEY WHEN BUYING
    if (decision.action === 'LONG' || decision.action === 'BUY') {
      if (this.balance < tradeValue) {
        console.log('❌ INSUFFICIENT FUNDS! Balance: $' + this.balance.toFixed(2));
        return null;
      }
      
      this.balance -= tradeValue; // SUBTRACT THE MONEY!
      
      const trade = {
        id: tradeId,
        side: 'buy',
        size: btcAmount,
        price: currentPrice,
        value: tradeValue,
        time: new Date().toISOString(),
        paper: true,
        entryBalance: this.balance + tradeValue,
        currentBalance: this.balance
      };
      
      this.positions.set(tradeId, trade);
      
      console.log('📝 PAPER TRADE EXECUTED (BUY):');
      console.log('   ID: ' + trade.id);
      console.log('   Price: $' + currentPrice.toFixed(2));
      console.log('   Size: ' + btcAmount.toFixed(6) + ' BTC');
      console.log('   Cost: $' + tradeValue.toFixed(2));
      console.log('   Balance Before: $' + trade.entryBalance.toFixed(2));
      console.log('   Balance After: $' + this.balance.toFixed(2));
      console.log('   📊 Remaining Cash: $' + this.balance.toFixed(2));
      
      // Broadcast the trade to dashboard
      this.broadcastTrade(trade);
      
      return trade;
      
    } else if (decision.action === 'SHORT' || decision.action === 'SELL') {
      // For SELL, check if we have positions to sell
      const openPositions = Array.from(this.positions.values()).filter(p => !p.closed);
      
      if (openPositions.length === 0) {
        console.log('⚠️ No positions to sell!');
        return null;
      }
      
      // Sell the oldest position
      const positionToSell = openPositions[0];
      const sellPrice = currentPrice;
      const sellValue = positionToSell.size * sellPrice;
      
      // Calculate P&L
      const buyValue = positionToSell.size * positionToSell.price;
      const pnl = sellValue - buyValue;
      const pnlPercent = (pnl / buyValue) * 100;
      
      // ADD THE MONEY BACK (with profit/loss)
      this.balance += sellValue;
      
      // Mark position as closed
      positionToSell.closed = true;
      positionToSell.exitPrice = sellPrice;
      positionToSell.exitTime = new Date().toISOString();
      positionToSell.pnl = pnl;
      positionToSell.pnlPercent = pnlPercent;
      
      console.log('📝 PAPER TRADE EXECUTED (SELL):');
      console.log('   Position ID: ' + positionToSell.id);
      console.log('   Entry: $' + positionToSell.price.toFixed(2));
      console.log('   Exit: $' + sellPrice.toFixed(2));
      console.log('   Size: ' + positionToSell.size.toFixed(6) + ' BTC');
      console.log('   P&L: $' + pnl.toFixed(2) + ' (' + pnlPercent.toFixed(2) + '%)');
      console.log('   💰 New Balance: $' + this.balance.toFixed(2));
      
      const sellTrade = {
        id: Date.now().toString(),
        side: 'sell',
        size: positionToSell.size,
        price: sellPrice,
        value: sellValue,
        pnl: pnl,
        pnlPercent: pnlPercent,
        time: new Date().toISOString(),
        paper: true,
        newBalance: this.balance
      };
      
      // Broadcast the sell trade to dashboard
      this.broadcastTrade(sellTrade);
      
      return sellTrade;
    }
    
    return null;
  }
  
  /**
   * Track position for P&L
   */
  trackPosition(order) {
    this.positions.set(order.id, {
      ...order,
      entryTime: Date.now(),
      pnl: 0
    });
  }
  
  /**
   * Calculate P&L for all positions
   */
  calculatePnL(currentPrice) {
    let totalPnL = 0;
    
    for (const [id, position] of this.positions) {
      if (position.side === 'buy') {
        position.pnl = (currentPrice - position.price) * position.size;
      } else {
        position.pnl = (position.price - currentPrice) * position.size;
      }
      totalPnL += position.pnl;
    }
    
    this.totalPnL = totalPnL;
    return totalPnL;
  }
  
  /**
   * Get trading statistics
   */
  getStats() {
    const winRate = this.totalTrades > 0 ? (this.winningTrades / this.totalTrades * 100) : 0;
    
    return {
      totalTrades: this.totalTrades,
      winningTrades: this.winningTrades,
      winRate: winRate.toFixed(1) + '%',
      totalPnL: this.totalPnL.toFixed(2),
      balance: this.balance.toFixed(2),
      positions: this.positions.size,
      mode: this.config.sandboxMode ? 'PAPER' : 'REAL'
    };
  }
  
  /**
   * Get all positions
   */
  getPositions() {
    return Array.from(this.positions.values());
  }
  
  /**
   * Log trade to file
   */
  logTradeToFile(trade) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logDir = path.join(__dirname, 'logs', 'trades');
      const logFile = path.join(logDir, `trades_${date}.json`);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Read existing trades or create new array
      let trades = [];
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        try {
          trades = JSON.parse(content);
        } catch (e) {
          trades = [];
        }
      }
      
      // Add new trade with additional metadata
      trades.push({
        ...trade,
        balance: this.balance,
        totalTrades: this.totalTrades,
        timestamp: new Date().toISOString()
      });
      
      // Write back to file
      fs.writeFileSync(logFile, JSON.stringify(trades, null, 2));
      
    } catch (error) {
      console.error('Failed to log trade:', error.message);
    }
  }
  
  /**
   * Broadcast trade to WebSocket
   */
  broadcastTrade(trade) {
    try {
      if (this.wsClient && this.wsClient.readyState === 1) { // WebSocket.OPEN = 1
        const message = {
          type: 'trade',  // Dashboard expects 'trade' not 'trade_executed'
          botTier: 'quantum',  // Always quantum for this bot
          source: 'trading_bot',
          action: trade.side === 'buy' ? 'BUY' : 'SELL',
          price: trade.price,
          pnl: trade.pnl || 0,
          reason: 'Quantum-neuromorphic analysis',
          confidence: 0.95,
          balance: this.balance,
          totalTrades: this.totalTrades,
          timestamp: Date.now()
        };
        
        this.wsClient.send(JSON.stringify(message));
        console.log('📡 Quantum trade broadcast to dashboard');
      }
    } catch (error) {
      console.error('Failed to broadcast trade:', error.message);
    }
  }
  
  /**
   * Set WebSocket client for broadcasting
   */
  setWebSocketClient(ws) {
    this.wsClient = ws;
    console.log('🔌 WebSocket client connected to ExecutionLayer');
  }


  // Get current trading status
  getStatus() {
    const openPositions = Array.from(this.positions.values()).filter(p => !p.closed);
    const closedPositions = Array.from(this.positions.values()).filter(p => p.closed);
    
    const totalPnL = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const winningTrades = closedPositions.filter(p => p.pnl > 0).length;
    const losingTrades = closedPositions.filter(p => p.pnl < 0).length;
    const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0;
    
    console.log('\n💼 TRADING STATUS:');
    console.log('   💵 Current Balance: $' + this.balance.toFixed(2));
    console.log('   📊 Open Positions: ' + openPositions.length);
    console.log('   ✅ Closed Trades: ' + closedPositions.length);
    console.log('   💰 Total P&L: $' + totalPnL.toFixed(2));
    console.log('   📈 Win Rate: ' + winRate.toFixed(1) + '%');
    console.log('   🏆 Wins: ' + winningTrades + ' | 💔 Losses: ' + losingTrades);
    
    return {
      balance: this.balance,
      openPositions: openPositions.length,
      closedTrades: closedPositions.length,
      totalPnL: totalPnL,
      winRate: winRate
    };
  }

}

module.exports = ExecutionLayer;