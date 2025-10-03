/**
 * INTEGRATE REAL TRADING INTO YOUR BOT
 * Add this to your run-trading-bot-v13-simplified.js
 */

// At the top of your file, add:
const RealKrakenTrading = require('./RealKrakenTrading');

// In your constructor, add:
this.krakenTrader = new RealKrakenTrading();

// Replace your executeTrade method with this:
async executeTrade(direction, sizePercent, confidence, marketData, patterns) {
  console.log(`\n💎 EXECUTE TRADE CALLED`);
  console.log(`Direction: ${direction}, Size: ${(sizePercent * 100).toFixed(2)}%, Confidence: ${(confidence * 100).toFixed(1)}%`);
  
  try {
    // Get current balance
    const balance = await this.krakenTrader.getBalance();
    const portfolioValue = balance.usd + (balance.btc * marketData.price);
    
    // Calculate BTC amount based on percentage
    const tradeValueUSD = portfolioValue * sizePercent;
    const tradeSizeBTC = tradeValueUSD / marketData.price;
    
    console.log(`📊 Trade Calculation:`);
    console.log(`   Portfolio: $${portfolioValue.toFixed(2)}`);
    console.log(`   Trade Value: $${tradeValueUSD.toFixed(2)}`);
    console.log(`   BTC Amount: ${tradeSizeBTC.toFixed(8)}`);
    
    // EXECUTE REAL TRADE
    const result = await this.krakenTrader.executeTrade(
      direction,
      tradeSizeBTC,
      confidence
    );
    
    if (result.success) {
      // Track the position
      this.activePositions.set(result.orderId, {
        orderId: result.orderId,
        direction: direction,
        entryPrice: result.price,
        size: result.size,
        confidence: confidence,
        timestamp: Date.now(),
        patterns: patterns,
        stopLoss: result.price * (direction === 'buy' ? 0.97 : 1.03),
        takeProfit: result.price * (direction === 'buy' ? 1.05 : 0.95),
        trailingStop: null,
        currentProfit: 0
      });
      
      console.log(`✅ Position added to tracking: ${result.orderId}`);
      
      // Update system state
      this.systemState.totalTrades++;
      this.systemState.lastTradeTime = Date.now();
      
      // Broadcast to dashboard
      this.broadcastTradeExecution(result);
      
      return result;
    } else {
      console.log(`❌ Trade failed: ${result.reason || result.error}`);
      this.systemState.failedTrades++;
      return result;
    }
    
  } catch (error) {
    console.error(`❌ CRITICAL TRADE ERROR: ${error.message}`);
    this.systemState.failedTrades++;
    return { success: false, error: error.message };
  }
}

// Add this method to check and update your positions:
async updateTrailingStops(currentPrice) {
  for (const [orderId, position] of this.activePositions) {
    const profitPercent = position.direction === 'buy'
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
      : ((position.entryPrice - currentPrice) / position.entryPrice) * 100;
    
    position.currentProfit = profitPercent;
    
    console.log(`📊 Position ${orderId}: ${profitPercent.toFixed(2)}% profit`);
    
    // Check stop loss
    if (position.direction === 'buy' && currentPrice <= position.stopLoss) {
      console.log(`🚨 STOP LOSS HIT! Selling position ${orderId}`);
      await this.krakenTrader.executeTrade('sell', position.size, 1.0);
      this.activePositions.delete(orderId);
    } else if (position.direction === 'sell' && currentPrice >= position.stopLoss) {
      console.log(`🚨 STOP LOSS HIT! Buying to close ${orderId}`);
      await this.krakenTrader.executeTrade('buy', position.size, 1.0);
      this.activePositions.delete(orderId);
    }
    
    // Check take profit
    if (position.direction === 'buy' && currentPrice >= position.takeProfit) {
      console.log(`🎯 TAKE PROFIT HIT! Selling position ${orderId}`);
      await this.krakenTrader.executeTrade('sell', position.size, 1.0);
      this.activePositions.delete(orderId);
      this.systemState.successfulTrades++;
    } else if (position.direction === 'sell' && currentPrice <= position.takeProfit) {
      console.log(`🎯 TAKE PROFIT HIT! Buying to close ${orderId}`);
      await this.krakenTrader.executeTrade('buy', position.size, 1.0);
      this.activePositions.delete(orderId);
      this.systemState.successfulTrades++;
    }
    
    // Update trailing stop if in profit
    if (profitPercent > 1.0 && !position.trailingStop) {
      position.trailingStop = currentPrice * (position.direction === 'buy' ? 0.98 : 1.02);
      console.log(`📈 Trailing stop activated at $${position.trailingStop.toFixed(2)}`);
    } else if (position.trailingStop) {
      // Update trailing stop if price moved favorably
      if (position.direction === 'buy' && currentPrice > position.entryPrice) {
        const newStop = currentPrice * 0.98;
        if (newStop > position.trailingStop) {
          position.trailingStop = newStop;
          console.log(`📈 Trailing stop updated to $${newStop.toFixed(2)}`);
        }
      }
    }
  }
}

// Add emergency stop method:
async emergencyStop() {
  console.log('🚨 EMERGENCY STOP ACTIVATED!');
  
  // Close all positions
  await this.krakenTrader.closeAllPositions();
  
  // Stop trading
  this.systemState.active = false;
  this.systemState.emergencyMode = true;
  
  // Clear intervals
  if (this.tradingInterval) clearInterval(this.tradingInterval);
  if (this.patternUpdateInterval) clearInterval(this.patternUpdateInterval);
  if (this.riskCheckInterval) clearInterval(this.riskCheckInterval);
  
  console.log('✅ All trading stopped, positions closed');
}
