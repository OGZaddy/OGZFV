// trade-logger.js
// Module to log trades in GP's exact format for live_vs_backtest.js
// Add this to your bot to log every fill

const fs = require('fs').promises;
const path = require('path');

class TradeLogger {
  constructor(logFile = 'live-trades.jsonl') {
    this.logFile = path.resolve(logFile);
    this.positions = new Map(); // Track open positions
  }
  
  /**
   * Log trade entry in GP's format
   */
  async logEntry(trade) {
    const record = {
      tsSignal: trade.signalTime || Date.now(),       // When signal fired
      tsOrderSent: trade.orderSentTime || Date.now(), // When order API called
      tsFill: trade.fillTime || Date.now(),           // When exchange confirmed
      symbol: this.normalizeSymbol(trade.symbol),     // Format: X:BTCUSD
      side: trade.side.toLowerCase(),                 // "buy" or "sell"
      qty: trade.quantity,
      fillPrice: trade.price,
      fee: trade.fee || 0,
      kind: "entry",                                  // Mark as entry
      positionId: trade.id || this.generatePositionId(),
      backtestWindow: {
        start: "2024-12-01T00:00:00Z",              // Your backtest window
        end: "2024-12-15T00:00:00Z"
      }
    };
    
    // Store position for P&L calculation
    this.positions.set(record.positionId, {
      entryPrice: record.fillPrice,
      qty: record.qty,
      side: record.side,
      entryTime: record.tsFill
    });
    
    // Append to JSONL file
    await this.appendToLog(record);
    
    return record;
  }
  
  /**
   * Log trade exit in GP's format
   */
  async logExit(trade) {
    const record = {
      tsSignal: trade.signalTime || Date.now(),
      tsOrderSent: trade.orderSentTime || Date.now(),
      tsFill: trade.fillTime || Date.now(),
      symbol: this.normalizeSymbol(trade.symbol),
      side: trade.side.toLowerCase(),  // Exit side (opposite of entry)
      qty: trade.quantity,
      fillPrice: trade.price,
      fee: trade.fee || 0,
      kind: "exit",                    // Mark as exit
      positionId: trade.positionId || trade.id,
      backtestWindow: {
        start: "2024-12-01T00:00:00Z",
        end: "2024-12-15T00:00:00Z"
      }
    };
    
    // Calculate P&L if we have the entry
    if (this.positions.has(record.positionId)) {
      const entry = this.positions.get(record.positionId);
      const direction = entry.side === 'buy' ? 1 : -1;
      const pnl = direction * (record.fillPrice - entry.entryPrice) * entry.qty;
      record.realizedPnL = pnl - (record.fee || 0);
      
      // Remove from open positions
      this.positions.delete(record.positionId);
    }
    
    // Append to JSONL file
    await this.appendToLog(record);
    
    return record;
  }
  
  /**
   * Normalize symbol to Polygon format
   */
  normalizeSymbol(symbol) {
    // Convert various formats to Polygon format
    // Examples: BTC-USD -> X:BTCUSD, BTC/USD -> X:BTCUSD
    const clean = symbol.replace(/[-\/]/g, '').toUpperCase();
    
    // Add Polygon prefix if not present
    if (!clean.startsWith('X:')) {
      return `X:${clean}`;
    }
    return clean;
  }
  
  /**
   * Generate unique position ID
   */
  generatePositionId() {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Append record to JSONL file
   */
  async appendToLog(record) {
    try {
      const line = JSON.stringify(record) + '\n';
      await fs.appendFile(this.logFile, line);
      
      // Also log to console for monitoring
      console.log(`📝 Trade logged: ${record.kind} ${record.side} ${record.qty} @ ${record.fillPrice}`);
      
      if (record.realizedPnL !== undefined) {
        const plSign = record.realizedPnL >= 0 ? '+' : '';
        console.log(`   P&L: ${plSign}${record.realizedPnL.toFixed(2)}`);
      }
      
    } catch (error) {
      console.error('Failed to log trade:', error);
    }
  }
  
  /**
   * Get current open positions
   */
  getOpenPositions() {
    return Array.from(this.positions.entries()).map(([id, pos]) => ({
      positionId: id,
      ...pos,
      age: Date.now() - pos.entryTime
    }));
  }
  
  /**
   * Calculate unrealized P&L for open positions
   */
  getUnrealizedPnL(currentPrices) {
    let totalUnrealized = 0;
    
    for (const [id, pos] of this.positions) {
      const symbol = this.normalizeSymbol(pos.symbol || 'BTC-USD');
      const currentPrice = currentPrices[symbol];
      
      if (currentPrice) {
        const direction = pos.side === 'buy' ? 1 : -1;
        const unrealized = direction * (currentPrice - pos.entryPrice) * pos.qty;
        totalUnrealized += unrealized;
      }
    }
    
    return totalUnrealized;
  }
}

// Export for use in main bot
module.exports = TradeLogger;

// Example usage in your bot:
/*
const TradeLogger = require('./trade-logger');
const logger = new TradeLogger('live-trades.jsonl');

// On trade entry:
await logger.logEntry({
  signalTime: Date.now() - 350,  // When signal was generated
  orderSentTime: Date.now() - 50, // When order was sent
  fillTime: Date.now(),           // When fill confirmed
  symbol: 'BTC-USD',
  side: 'buy',
  quantity: 0.001,
  price: 97351.42,
  fee: 0.12,
  id: 'trade_123'
});

// On trade exit:
await logger.logExit({
  signalTime: Date.now() - 300,
  orderSentTime: Date.now() - 40,
  fillTime: Date.now(),
  symbol: 'BTC-USD',
  side: 'sell',  // Opposite of entry
  quantity: 0.001,
  price: 97851.50,
  fee: 0.12,
  positionId: 'trade_123'  // Same as entry ID
});
*/