#!/usr/bin/env node
// ========================================================================
// PAPER TRADING CONTROLLER - Safe paper trading with kill switches
// As suggested by Claude for testing before going live
// ========================================================================

const fs = require('fs').promises;
const WebSocket = require('ws');
const { EventEmitter } = require('events');

// Global kill switch (can be toggled via ENV or WebSocket)
let GLOBAL_KILL_SWITCH = false;
let TRADING_HALTED = process.env.TRADING_HALT === 'true';

class PaperTradingController extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Trading limits
      maxOrdersPerMinute: config.maxOrdersPerMinute || 5,
      maxConcurrentPositions: config.maxConcurrentPositions || 3,
      maxDailyLoss: config.maxDailyLoss || 100, // $100 max daily loss
      maxDrawdown: config.maxDrawdown || 0.15,  // 15% max drawdown
      
      // Slippage guards
      maxSlippageBps: config.maxSlippageBps || 50, // 50 basis points max slippage
      maxPriceDrift: config.maxPriceDrift || 0.005, // 0.5% max price drift
      
      // Paper trading settings
      initialBalance: config.initialBalance || 10000,
      paperMode: true,
      
      // Logging
      logFile: config.logFile || 'paper-trades.jsonl',
      auditFile: config.auditFile || 'paper-audit.jsonl'
    };
    
    // Trading state
    this.state = {
      balance: this.config.initialBalance,
      positions: new Map(),
      orderCount: 0,
      orderTimestamps: [],
      dailyPnL: 0,
      maxDrawdown: 0,
      peakBalance: this.config.initialBalance,
      startTime: Date.now(),
      lastOrderTime: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };
    
    // Idempotent order tracking
    this.processedOrders = new Set();
    
    // Setup kill switch listeners
    this.setupKillSwitches();
    
    // Setup WebSocket command listener
    this.setupWebSocketCommands();
    
    console.log('🎯 Paper Trading Controller Initialized');
    console.log(`💰 Initial Balance: ${this.config.initialBalance}`);
    console.log(`🛡️ Max Daily Loss: ${this.config.maxDailyLoss}`);
    console.log(`🎯 Max Positions: ${this.config.maxConcurrentPositions}`);
    console.log(`⚡ Max Orders/Min: ${this.config.maxOrdersPerMinute}`);
  }
  
  /**
   * Setup kill switch mechanisms
   */
  setupKillSwitches() {
    // ENV-based kill switch
    process.on('SIGUSR1', () => {
      console.log('🚨 KILL SWITCH ACTIVATED (SIGUSR1)');
      this.halt('SIGUSR1 signal');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🛑 Graceful shutdown initiated...');
      await this.shutdown();
      process.exit(0);
    });
    
    // Emergency halt on uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('💥 UNCAUGHT EXCEPTION - EMERGENCY HALT:', error);
      this.halt('Uncaught exception');
      setTimeout(() => process.exit(1), 1000);
    });
  }
  
  /**
   * Setup WebSocket command listener
   */
  setupWebSocketCommands() {
    // Create WebSocket server for control commands
    this.controlServer = new WebSocket.Server({ port: 9999 });
    
    this.controlServer.on('connection', (ws) => {
      console.log('🎮 Control connection established');
      
      ws.on('message', async (message) => {
        try {
          const command = JSON.parse(message);
          await this.handleCommand(command, ws);
        } catch (error) {
          ws.send(JSON.stringify({ 
            error: error.message,
            timestamp: Date.now()
          }));
        }
      });
    });
    
    console.log('🎮 Control server listening on port 9999');
  }
  
  /**
   * Handle control commands
   */
  async handleCommand(command, ws) {
    const response = { 
      command: command.type,
      timestamp: Date.now()
    };
    
    switch (command.type) {
      case 'halt':
        this.halt(command.reason || 'WebSocket command');
        response.status = 'HALTED';
        break;
        
      case 'resume':
        this.resume();
        response.status = 'RESUMED';
        break;
        
      case 'status':
        response.status = this.getStatus();
        break;
        
      case 'positions':
        response.positions = Array.from(this.state.positions.values());
        break;
        
      case 'stats':
        response.stats = this.getStats();
        break;
        
      case 'close_all':
        await this.closeAllPositions(command.reason || 'Manual close all');
        response.status = 'ALL_POSITIONS_CLOSED';
        break;
        
      default:
        response.error = 'Unknown command';
    }
    
    ws.send(JSON.stringify(response));
  }
  
  /**
   * HALT all trading immediately
   */
  halt(reason = 'Unknown') {
    GLOBAL_KILL_SWITCH = true;
    TRADING_HALTED = true;
    
    console.log('════════════════════════════════════════════════════════');
    console.log('                 🚨 TRADING HALTED 🚨');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Reason: ${reason}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('════════════════════════════════════════════════════════');
    
    // Log halt event
    this.auditLog({
      event: 'TRADING_HALT',
      reason,
      state: this.state,
      timestamp: Date.now()
    });
    
    this.emit('halt', { reason, timestamp: Date.now() });
  }
  
  /**
   * Resume trading
   */
  resume() {
    if (!GLOBAL_KILL_SWITCH) {
      console.log('⚠️ Trading was not halted');
      return;
    }
    
    GLOBAL_KILL_SWITCH = false;
    TRADING_HALTED = false;
    
    console.log('════════════════════════════════════════════════════════');
    console.log('                 ✅ TRADING RESUMED ✅');
    console.log('════════════════════════════════════════════════════════');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('════════════════════════════════════════════════════════');
    
    this.auditLog({
      event: 'TRADING_RESUME',
      timestamp: Date.now()
    });
    
    this.emit('resume', { timestamp: Date.now() });
  }
  
  /**
   * Check if trading is allowed
   */
  canTrade() {
    // Check global kill switch
    if (GLOBAL_KILL_SWITCH || TRADING_HALTED) {
      console.log('🚫 Trading halted by kill switch');
      return false;
    }
    
    // Check daily loss limit
    if (Math.abs(this.state.dailyPnL) >= this.config.maxDailyLoss) {
      console.log(`🚫 Daily loss limit reached: ${Math.abs(this.state.dailyPnL).toFixed(2)}`);
      this.halt('Daily loss limit exceeded');
      return false;
    }
    
    // Check drawdown limit
    const currentDrawdown = (this.state.peakBalance - this.state.balance) / this.state.peakBalance;
    if (currentDrawdown >= this.config.maxDrawdown) {
      console.log(`🚫 Max drawdown reached: ${(currentDrawdown * 100).toFixed(2)}%`);
      this.halt('Max drawdown exceeded');
      return false;
    }
    
    // Check position limit
    if (this.state.positions.size >= this.config.maxConcurrentPositions) {
      console.log(`⚠️ Max positions reached: ${this.state.positions.size}/${this.config.maxConcurrentPositions}`);
      return false;
    }
    
    // Check rate limiting
    const now = Date.now();
    const recentOrders = this.state.orderTimestamps.filter(t => now - t < 60000);
    if (recentOrders.length >= this.config.maxOrdersPerMinute) {
      console.log(`⚠️ Rate limit reached: ${recentOrders.length} orders in last minute`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Place a paper order with all safety checks
   */
  async placeOrder(order) {
    // Generate idempotent order ID if not provided
    const orderId = order.id || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check idempotency
    if (this.processedOrders.has(orderId)) {
      console.log(`⚠️ Duplicate order rejected: ${orderId}`);
      return { success: false, reason: 'Duplicate order' };
    }
    
    // Check if trading is allowed
    if (!this.canTrade()) {
      return { success: false, reason: 'Trading not allowed' };
    }
    
    // Validate slippage
    const slippage = this.calculateSlippage(order);
    if (slippage > this.config.maxSlippageBps) {
      console.log(`🚫 Order rejected - excessive slippage: ${slippage} bps`);
      return { success: false, reason: `Slippage ${slippage} bps exceeds limit` };
    }
    
    // Mark order as processed
    this.processedOrders.add(orderId);
    this.state.orderTimestamps.push(Date.now());
    
    // Execute paper trade
    const execution = {
      orderId,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price,
      signalPrice: order.signalPrice,
      slippage,
      timestamp: Date.now(),
      latency: Date.now() - (order.signalTime || Date.now())
    };
    
    // Update position
    const position = {
      id: orderId,
      ...execution,
      entryPrice: order.price,
      currentPrice: order.price,
      unrealizedPnL: 0,
      realizedPnL: 0
    };
    
    this.state.positions.set(orderId, position);
    this.state.totalTrades++;
    
    // Log trade
    await this.logTrade(execution);
    
    console.log(`📝 Paper order placed: ${order.side} ${order.quantity} ${order.symbol} @ ${order.price}`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Slippage: ${slippage} bps`);
    console.log(`   Latency: ${execution.latency}ms`);
    
    return { 
      success: true, 
      orderId,
      execution
    };
  }
  
  /**
   * Calculate slippage in basis points
   */
  calculateSlippage(order) {
    if (!order.signalPrice) return 0;
    
    const slippagePct = Math.abs(order.price - order.signalPrice) / order.signalPrice;
    return Math.round(slippagePct * 10000); // Convert to basis points
  }
  
  /**
   * Update position prices and P&L
   */
  async updatePositions(marketPrices) {
    for (const [id, position] of this.state.positions) {
      const price = marketPrices[position.symbol];
      if (!price) continue;
      
      position.currentPrice = price;
      
      // Calculate unrealized P&L
      if (position.side === 'buy') {
        position.unrealizedPnL = (price - position.entryPrice) * position.quantity;
      } else {
        position.unrealizedPnL = (position.entryPrice - price) * position.quantity;
      }
      
      // Check stop loss / take profit
      if (this.shouldClosePosition(position)) {
        await this.closePosition(id, price, 'Auto close');
      }
    }
  }
  
  /**
   * Check if position should be closed
   */
  shouldClosePosition(position) {
    // Add your stop loss / take profit logic here
    const profitPct = position.unrealizedPnL / (position.entryPrice * position.quantity);
    
    // Stop loss at -2%
    if (profitPct <= -0.02) {
      console.log(`🛑 Stop loss triggered for ${position.id}`);
      return true;
    }
    
    // Take profit at 5%
    if (profitPct >= 0.05) {
      console.log(`💰 Take profit triggered for ${position.id}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Close a position
   */
  async closePosition(positionId, price, reason = 'Manual close') {
    const position = this.state.positions.get(positionId);
    if (!position) {
      console.log(`⚠️ Position not found: ${positionId}`);
      return;
    }
    
    // Calculate realized P&L
    if (position.side === 'buy') {
      position.realizedPnL = (price - position.entryPrice) * position.quantity;
    } else {
      position.realizedPnL = (position.entryPrice - price) * position.quantity;
    }
    
    // Update stats
    this.state.dailyPnL += position.realizedPnL;
    this.state.balance += position.realizedPnL;
    
    if (position.realizedPnL > 0) {
      this.state.winningTrades++;
    } else {
      this.state.losingTrades++;
    }
    
    // Update peak balance
    if (this.state.balance > this.state.peakBalance) {
      this.state.peakBalance = this.state.balance;
    }
    
    // Log close
    const closeRecord = {
      event: 'POSITION_CLOSE',
      positionId,
      reason,
      exitPrice: price,
      realizedPnL: position.realizedPnL,
      timestamp: Date.now()
    };
    
    await this.logTrade(closeRecord);
    
    // Remove position
    this.state.positions.delete(positionId);
    
    console.log(`📕 Position closed: ${positionId}`);
    console.log(`   P&L: ${position.realizedPnL >= 0 ? '+' : ''}${position.realizedPnL.toFixed(2)}`);
    console.log(`   Reason: ${reason}`);
  }
  
  /**
   * Close all positions
   */
  async closeAllPositions(reason = 'Close all') {
    console.log(`🛑 Closing all ${this.state.positions.size} positions...`);
    
    for (const [id, position] of this.state.positions) {
      await this.closePosition(id, position.currentPrice, reason);
    }
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      halted: GLOBAL_KILL_SWITCH || TRADING_HALTED,
      balance: this.state.balance,
      positions: this.state.positions.size,
      dailyPnL: this.state.dailyPnL,
      totalTrades: this.state.totalTrades,
      winRate: this.state.totalTrades > 0 ? 
        (this.state.winningTrades / this.state.totalTrades * 100).toFixed(1) + '%' : '0%',
      uptime: Math.floor((Date.now() - this.state.startTime) / 1000) + 's'
    };
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const winRate = this.state.totalTrades > 0 ? 
      this.state.winningTrades / this.state.totalTrades : 0;
    
    const currentDrawdown = (this.state.peakBalance - this.state.balance) / this.state.peakBalance;
    
    return {
      balance: this.state.balance,
      initialBalance: this.config.initialBalance,
      returnPct: ((this.state.balance - this.config.initialBalance) / this.config.initialBalance * 100),
      totalTrades: this.state.totalTrades,
      winningTrades: this.state.winningTrades,
      losingTrades: this.state.losingTrades,
      winRate: (winRate * 100).toFixed(1) + '%',
      dailyPnL: this.state.dailyPnL,
      currentDrawdown: (currentDrawdown * 100).toFixed(2) + '%',
      maxDrawdown: (this.state.maxDrawdown * 100).toFixed(2) + '%',
      positions: this.state.positions.size,
      uptime: Math.floor((Date.now() - this.state.startTime) / 1000)
    };
  }
  
  /**
   * Log trade to JSONL file
   */
  async logTrade(record) {
    const logEntry = {
      ...record,
      balance: this.state.balance,
      mode: 'PAPER'
    };
    
    await fs.appendFile(this.config.logFile, JSON.stringify(logEntry) + '\n');
  }
  
  /**
   * Audit log for important events
   */
  async auditLog(record) {
    await fs.appendFile(this.config.auditFile, JSON.stringify(record) + '\n');
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('📊 Shutting down paper trading...');
    
    // Close all positions
    await this.closeAllPositions('Shutdown');
    
    // Save final stats
    const finalStats = this.getStats();
    await this.auditLog({
      event: 'SHUTDOWN',
      finalStats,
      timestamp: Date.now()
    });
    
    console.log('📊 Final Statistics:');
    console.log(JSON.stringify(finalStats, null, 2));
    
    // Close WebSocket server
    if (this.controlServer) {
      this.controlServer.close();
    }
  }
}

// Export for use in main bot
module.exports = PaperTradingController;

// Run standalone if executed directly
if (require.main === module) {
  const controller = new PaperTradingController({
    initialBalance: parseFloat(process.env.PAPER_BALANCE) || 10000,
    maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS) || 100,
    maxOrdersPerMinute: parseInt(process.env.MAX_ORDERS_PER_MIN) || 5
  });
  
  console.log('\n════════════════════════════════════════════════════════');
  console.log('           PAPER TRADING CONTROLLER ACTIVE');
  console.log('════════════════════════════════════════════════════════');
  console.log('Control Commands (send to ws://localhost:9999):');
  console.log('  {"type":"halt"}     - Stop all trading');
  console.log('  {"type":"resume"}   - Resume trading');
  console.log('  {"type":"status"}   - Get current status');
  console.log('  {"type":"stats"}    - Get statistics');
  console.log('  {"type":"positions"} - List open positions');
  console.log('  {"type":"close_all"} - Close all positions');
  console.log('════════════════════════════════════════════════════════\n');
  
  // Keep process alive
  process.stdin.resume();
}