/**
 * REAL KRAKEN TRADING MODULE
 * This connects your bot to ACTUAL Kraken trading
 * No more simulation - REAL MONEY TRADES!
 */

const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

class RealKrakenTrading {
  constructor() {
    // Your Kraken API credentials
    this.apiKey = process.env.KRAKEN_API_KEY;
    this.apiSecret = process.env.KRAKEN_API_SECRET;
    this.apiUrl = 'https://api.kraken.com';
    
    // Safety limits
    this.maxOrderSize = 0.001; // Start with 0.001 BTC max
    this.dailyLossLimit = 100; // $100 max daily loss
    this.todaysLoss = 0;
    
    console.log('🚀 REAL KRAKEN TRADING MODULE INITIALIZED');
    console.log(`💰 Max order size: ${this.maxOrderSize} BTC`);
    console.log(`🛡️ Daily loss limit: $${this.dailyLossLimit}`);
  }

  /**
   * Generate Kraken API signature
   */
  generateSignature(path, data, nonce) {
    const message = path + crypto.createHash('sha256')
      .update(nonce + data)
      .digest('binary');
    
    return crypto.createHmac('sha512', Buffer.from(this.apiSecret, 'base64'))
      .update(message, 'binary')
      .digest('base64');
  }

  /**
   * Make authenticated API request to Kraken
   */
  async krakenRequest(endpoint, params = {}) {
    const nonce = Date.now() * 1000;
    const data = new URLSearchParams({ nonce, ...params }).toString();
    const path = `/0/private/${endpoint}`;
    const signature = this.generateSignature(path, data, nonce);
    
    try {
      const response = await axios.post(
        `${this.apiUrl}${path}`,
        data,
        {
          headers: {
            'API-Key': this.apiKey,
            'API-Sign': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data.error && response.data.error.length > 0) {
        throw new Error(response.data.error[0]);
      }
      
      return response.data.result;
    } catch (error) {
      console.error(`❌ Kraken API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    try {
      const balance = await this.krakenRequest('Balance');
      console.log('💰 Current Kraken Balance:');
      
      // Show USD and BTC balances
      const usdBalance = parseFloat(balance.ZUSD || 0);
      const btcBalance = parseFloat(balance.XXBT || 0);
      
      console.log(`   USD: $${usdBalance.toFixed(2)}`);
      console.log(`   BTC: ${btcBalance.toFixed(8)}`);
      
      return { usd: usdBalance, btc: btcBalance };
    } catch (error) {
      console.error('❌ Failed to get balance:', error.message);
      return { usd: 0, btc: 0 };
    }
  }

  /**
   * Get current BTC price
   */
  async getCurrentPrice() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/0/public/Ticker?pair=XBTUSD`
      );
      
      const tickerData = response.data.result.XXBTZUSD;
      const currentPrice = parseFloat(tickerData.c[0]);
      
      console.log(`📊 Current BTC Price: $${currentPrice.toFixed(2)}`);
      return currentPrice;
    } catch (error) {
      console.error('❌ Failed to get price:', error.message);
      return 0;
    }
  }

  /**
   * EXECUTE REAL TRADE ON KRAKEN
   */
  async executeTrade(direction, sizeInBTC, confidence = 0.5) {
    console.log('\n🚀 EXECUTING REAL KRAKEN TRADE');
    console.log('═══════════════════════════════════════');
    
    try {
      // Step 1: Safety checks
      if (this.todaysLoss >= this.dailyLossLimit) {
        console.log('🚫 TRADE BLOCKED: Daily loss limit reached');
        return { success: false, reason: 'daily_loss_limit' };
      }
      
      // Step 2: Validate size
      const tradeSize = Math.min(sizeInBTC, this.maxOrderSize);
      if (tradeSize < 0.0001) {
        console.log('🚫 TRADE BLOCKED: Size too small');
        return { success: false, reason: 'size_too_small' };
      }
      
      // Step 3: Check balance
      const balance = await this.getBalance();
      const currentPrice = await this.getCurrentPrice();
      
      if (direction === 'buy') {
        const requiredUSD = tradeSize * currentPrice * 1.01; // +1% for fees
        if (balance.usd < requiredUSD) {
          console.log(`🚫 TRADE BLOCKED: Insufficient USD (need $${requiredUSD.toFixed(2)}, have $${balance.usd.toFixed(2)})`);
          return { success: false, reason: 'insufficient_funds' };
        }
      } else {
        if (balance.btc < tradeSize) {
          console.log(`🚫 TRADE BLOCKED: Insufficient BTC (need ${tradeSize}, have ${balance.btc})`);
          return { success: false, reason: 'insufficient_btc' };
        }
      }
      
      // Step 4: Place the order
      console.log(`📝 Placing ${direction.toUpperCase()} order:`);
      console.log(`   Size: ${tradeSize.toFixed(8)} BTC`);
      console.log(`   Value: $${(tradeSize * currentPrice).toFixed(2)}`);
      console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
      
      const orderParams = {
        pair: 'XXBTZUSD',
        type: direction,
        ordertype: 'market',
        volume: tradeSize.toFixed(8)
      };
      
      // Add stop-loss for safety
      if (direction === 'buy') {
        orderParams.close = {
          ordertype: 'stop-loss',
          price: (currentPrice * 0.97).toFixed(2) // 3% stop-loss
        };
      }
      
      console.log('🔄 Sending order to Kraken...');
      const result = await this.krakenRequest('AddOrder', orderParams);
      
      if (result.txid && result.txid.length > 0) {
        const orderId = result.txid[0];
        console.log(`✅ ORDER PLACED SUCCESSFULLY!`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Type: ${direction.toUpperCase()}`);
        console.log(`   Size: ${tradeSize} BTC`);
        console.log(`   Price: $${currentPrice.toFixed(2)}`);
        console.log('═══════════════════════════════════════\n');
        
        // Track the order
        this.trackOrder(orderId, direction, tradeSize, currentPrice);
        
        return {
          success: true,
          orderId: orderId,
          direction: direction,
          size: tradeSize,
          price: currentPrice,
          timestamp: Date.now()
        };
      } else {
        throw new Error('No order ID returned');
      }
      
    } catch (error) {
      console.error(`❌ TRADE EXECUTION FAILED: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Track order for monitoring
   */
  async trackOrder(orderId, direction, size, entryPrice) {
    console.log(`📊 Tracking order ${orderId}...`);
    
    // Check order status after 5 seconds
    setTimeout(async () => {
      try {
        const orders = await this.krakenRequest('QueryOrders', {
          txid: orderId
        });
        
        if (orders[orderId]) {
          const order = orders[orderId];
          console.log(`📊 Order Update: ${orderId}`);
          console.log(`   Status: ${order.status}`);
          console.log(`   Filled: ${order.vol_exec}/${order.vol}`);
          
          if (order.status === 'closed') {
            const avgPrice = parseFloat(order.price);
            console.log(`✅ Order FILLED at $${avgPrice.toFixed(2)}`);
            
            // Calculate immediate P&L
            const currentPrice = await this.getCurrentPrice();
            const pnl = direction === 'buy' 
              ? (currentPrice - avgPrice) * size
              : (avgPrice - currentPrice) * size;
            
            console.log(`💰 Unrealized P&L: $${pnl.toFixed(2)}`);
            
            if (pnl < 0) {
              this.todaysLoss += Math.abs(pnl);
              console.log(`📊 Today's Loss: $${this.todaysLoss.toFixed(2)}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error tracking order:', error.message);
      }
    }, 5000);
  }

  /**
   * Close all positions (emergency)
   */
  async closeAllPositions() {
    console.log('🚨 CLOSING ALL POSITIONS...');
    
    try {
      // Get open orders
      const openOrders = await this.krakenRequest('OpenOrders');
      
      if (openOrders.open) {
        for (const orderId in openOrders.open) {
          console.log(`🔄 Canceling order ${orderId}...`);
          await this.krakenRequest('CancelOrder', { txid: orderId });
        }
      }
      
      // Check BTC balance and sell if we have any
      const balance = await this.getBalance();
      if (balance.btc > 0.0001) {
        console.log(`💰 Selling ${balance.btc} BTC...`);
        await this.executeTrade('sell', balance.btc, 1.0);
      }
      
      console.log('✅ All positions closed');
    } catch (error) {
      console.error('❌ Error closing positions:', error.message);
    }
  }

  /**
   * Test connection
   */
  async testConnection() {
    console.log('🔍 Testing Kraken connection...');
    
    try {
      const balance = await this.getBalance();
      const price = await this.getCurrentPrice();
      
      if (balance && price) {
        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log(`   USD Balance: $${balance.usd.toFixed(2)}`);
        console.log(`   BTC Balance: ${balance.btc.toFixed(8)}`);
        console.log(`   BTC Price: $${price.toFixed(2)}`);
        console.log(`   Portfolio Value: $${(balance.usd + balance.btc * price).toFixed(2)}`);
        return true;
      }
    } catch (error) {
      console.error('❌ CONNECTION FAILED:', error.message);
      return false;
    }
  }
}

// Export for use in your bot
module.exports = RealKrakenTrading;

// Test if run directly
if (require.main === module) {
  const trader = new RealKrakenTrading();
  
  // Test connection
  trader.testConnection().then(async (connected) => {
    if (connected) {
      console.log('\n🎯 Ready to trade! Use trader.executeTrade("buy", 0.0001) to test');
      
      // Uncomment to test a real trade (BE CAREFUL!)
      // await trader.executeTrade('buy', 0.0001, 0.75);
    }
  });
}
