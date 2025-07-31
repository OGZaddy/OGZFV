/**
 * 🔥 DISABLED: PHANTOM WEBSOCKET CLIENT REMOVED
 * 
 * This file was creating duplicate WebSocket connections causing:
 * - Ghost identify messages every few seconds
 * - Duplicate bot_status pings every 10 seconds  
 * - Ping-pong spam and connection conflicts
 * - Exponential backoff reconnection loops
 * 
 * DO NOT RE-ENABLE WITHOUT FULL INTEGRATION REVIEW
 */

console.log("🔥 DISABLED: Rogue WebSocket client was here. Do not re-enable.");
return; // KILL SWITCH - PREVENTS ANY EXECUTION

const WebSocket = require('ws');

// Enhanced WebSocket client configuration for the trading bot
class EnhancedWebSocketClient {
  constructor(botInstance) {
    this.bot = botInstance;
    this.ws = null;
    this.wsConnected = false;
    this.wsReconnectInterval = null;
    this.lastDataReceived = null;
    this.lastHeartbeat = null;
    this.healthMonitorInterval = null;
    this.cachedMarketData = {
      price: null,
      volume: null,
      timestamp: null,
      symbol: null
    };
    this.assetPrices = {};
    this.connectionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * 🔌 Enhanced WebSocket connection with bot identification
   */
  connectWebSocket() {
    const sslServerHost = process.env.SSL_SERVER_HOST || '127.0.0.1';
    const sslServerPort = process.env.SSL_SERVER_PORT || '3010';
    const wsUrl = `ws://${sslServerHost}:${sslServerPort}`;
    
    console.log(`🔌 Connecting to SSL server WebSocket at ${wsUrl}...`);
    console.log(`🤖 Bot will identify itself for CRITICAL priority...`);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket connected to SSL server');
        this.wsConnected = true;
        this.reconnectAttempts = 0;
        
        // 🚀 IMMEDIATELY IDENTIFY AS TRADING BOT FOR PRIORITY TREATMENT
        console.log('🤖 Sending bot identification...');
        this.ws.send(JSON.stringify({
          type: 'identify',
          source: 'trading_bot',
          version: 'V13-SIMPLIFIED',
          capabilities: ['trading', 'realtime', 'priority'],
          startTime: this.bot.systemState.startTime,
          config: {
            primaryAsset: this.bot.config.primaryAsset,
            mode: this.bot.config.simulate ? 'SIMULATION' : 'LIVE'
          }
        }));
        
        // Clear any existing reconnection interval
        if (this.wsReconnectInterval) {
          clearInterval(this.wsReconnectInterval);
          this.wsReconnectInterval = null;
        }
        
        // Request immediate market snapshot
        console.log('📊 Requesting market snapshot...');
        this.ws.send(JSON.stringify({
          type: 'request',
          action: 'market_snapshot',
          assets: [this.bot.config.primaryAsset, 'ETH-USD', 'SOL-USD']
        }));
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Enhanced message logging
          if (message.type !== 'heartbeat' && message.type !== 'ping') {
            console.log(`📨 MESSAGE: ${message.type}`, 
              message.data ? `(${JSON.stringify(message.data).substring(0, 100)}...)` : '');
          }
          
          // Handle different message types
          switch (message.type) {
            case 'welcome':
              console.log('👋 Welcome message received');
              console.log(`   Connection ID: ${message.connectionId}`);
              console.log(`   Server capabilities:`, message.capabilities);
              this.connectionId = message.connectionId;
              break;
              
            case 'identification_confirmed':
              console.log('✅ BOT IDENTIFICATION CONFIRMED!');
              console.log(`   Connection ID: ${message.connectionId}`);
              console.log(`   Priority: ${message.priority}`);
              console.log(`   Message: ${message.message}`);
              break;
              
            case 'price':
              // CRITICAL: Process price updates
              // The Advanced WebSocket System wraps messages, so we need to unwrap them
              const actualPriceData = message.data?.data || message.data;
              
              if (actualPriceData) {
                console.log(`🔍 Price data received for ${actualPriceData.asset}, primary asset is ${this.bot.config.primaryAsset}`);
                
                // Update cached market data for ALL assets
                if (actualPriceData.asset === this.bot.config.primaryAsset) {
                  this.cachedMarketData = {
                    price: parseFloat(actualPriceData.price),
                    volume: actualPriceData.volume || 1000,
                    timestamp: actualPriceData.timestamp || Date.now(),
                    symbol: actualPriceData.asset
                  };
                  this.lastDataReceived = Date.now();
                  
                  console.log(`💰 ${actualPriceData.asset} PRICE: $${actualPriceData.price.toFixed(2)}`);
                  
                  // Update bot's price history for technical indicators
                  if (this.bot.priceHistory) {
                    this.bot.priceHistory.push({
                      c: parseFloat(actualPriceData.price), // close price
                      o: parseFloat(actualPriceData.price), // open (same as close for now)
                      h: parseFloat(actualPriceData.price) * 1.001, // high
                      l: parseFloat(actualPriceData.price) * 0.999, // low
                      v: actualPriceData.volume || 1000,
                      t: actualPriceData.timestamp || Date.now()
                    });
                    
                    // Keep only the last 100 prices
                    if (this.bot.priceHistory.length > this.bot.maxPriceHistory) {
                      this.bot.priceHistory.shift();
                    }
                  }
                }
                
                // Store all asset prices for correlation analysis
                if (actualPriceData.allPrices) {
                  this.assetPrices = actualPriceData.allPrices;
                  console.log(`📊 All prices updated:`, Object.entries(actualPriceData.allPrices)
                    .map(([asset, price]) => `${asset}: $${price.toFixed(2)}`).join(', '));
                    
                  // Also update cached data if primary asset is in allPrices
                  if (actualPriceData.allPrices[this.bot.config.primaryAsset]) {
                    this.cachedMarketData = {
                      price: parseFloat(actualPriceData.allPrices[this.bot.config.primaryAsset]),
                      volume: 1000,
                      timestamp: actualPriceData.timestamp || Date.now(),
                      symbol: this.bot.config.primaryAsset
                    };
                    this.lastDataReceived = Date.now();
                    console.log(`💰 Updated ${this.bot.config.primaryAsset} from allPrices: $${this.cachedMarketData.price.toFixed(2)}`);
                  }
                }
                
                // Send ACK if required
                if (message.requiresAck) {
                  this.ws.send(JSON.stringify({
                    type: 'ack',
                    messageId: message.id,
                    timestamp: Date.now()
                  }));
                }
              }
              break;
              
            case 'status':
              console.log(`📋 Status update:`, message.data);
              break;
              
            case 'heartbeat':
              // Respond to heartbeat
              this.lastHeartbeat = Date.now();
              if (message.expectsPong) {
                this.ws.send(JSON.stringify({
                  type: 'pong',
                  timestamp: Date.now()
                }));
              }
              break;
              
            case 'ping':
              // Respond to ping immediately
              this.ws.send(JSON.stringify({
                type: 'pong',
                id: message.id,
                timestamp: message.timestamp
              }));
              break;
              
            case 'market_snapshot':
              console.log(`📸 Market snapshot received:`, message.data);
              // Process initial market state
              if (message.data && message.data.prices) {
                this.assetPrices = message.data.prices;
              }
              break;
              
            case 'server_shutdown':
              console.warn('⚠️ SERVER SHUTDOWN NOTICE:', message.message);
              this.wsConnected = false;
              this.scheduleReconnect();
              break;
              
            case 'data_feed_status':
              console.log(`📡 Data feed status: ${message.status}`);
              if (message.status === 'disconnected') {
                console.warn('⚠️ Market data feed disconnected!');
              }
              break;
              
            default:
              console.log(`❓ Unknown message type: ${message.type}`);
          }
          
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          console.error('Raw data was:', data.toString());
        }
      });
      
      this.ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket disconnected from SSL server`);
        console.log(`   Code: ${code}`);
        console.log(`   Reason: ${reason || 'No reason provided'}`);
        this.wsConnected = false;
        this.scheduleReconnect();
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        this.wsConnected = false;
      });
      
      // Set up connection health monitoring
      this.startConnectionHealthMonitor();
      
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 🔄 Smart reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.wsReconnectInterval) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`⏳ Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000}s...`);
    
    this.wsReconnectInterval = setTimeout(() => {
      this.wsReconnectInterval = null;
      
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`🔄 Attempting to reconnect WebSocket...`);
        this.connectWebSocket();
      } else {
        console.error('❌ Max reconnection attempts reached. Manual intervention required.');
      }
    }, delay);
  }

  /**
   * 💓 Monitor connection health
   */
  startConnectionHealthMonitor() {
    // Clear existing monitor if any
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    
    this.healthMonitorInterval = setInterval(() => {
      if (!this.wsConnected) return;
      
      const now = Date.now();
      
      // Check last data received
      if (this.lastDataReceived) {
        const dataAge = now - this.lastDataReceived;
        if (dataAge > 30000) { // 30 seconds without data
          console.warn(`⚠️ No price data for ${(dataAge/1000).toFixed(1)}s`);
          
          // Request market update
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'request',
              action: 'price_update',
              asset: this.bot.config.primaryAsset
            }));
          }
        }
      }
      
      // Check heartbeat
      if (this.lastHeartbeat) {
        const heartbeatAge = now - this.lastHeartbeat;
        if (heartbeatAge > 15000) { // 15 seconds without heartbeat
          console.warn(`⚠️ No heartbeat for ${(heartbeatAge/1000).toFixed(1)}s`);
        }
      }
      
      // Send periodic status update
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'bot_status',
          data: {
            connectionId: this.connectionId,
            uptime: now - this.bot.systemState.startTime,
            totalTrades: this.bot.systemState.totalTrades,
            balance: this.bot.systemState.currentBalance,
            activePositions: this.bot.activePositions.size,
            lastTradeTime: this.bot.systemState.lastTradeTime,
            mode: this.bot.systemState.mode,
            lastDataReceived: this.lastDataReceived,
            dataAge: this.lastDataReceived ? now - this.lastDataReceived : null
          }
        }));
      }
      
    }, 10000); // Every 10 seconds
  }

  /**
   * 📊 Enhanced market data retrieval
   */
  async getMarketData() {
    // Check if we have recent cached data from WebSocket
    if (this.cachedMarketData.price && this.lastDataReceived) {
      const dataAge = Date.now() - this.lastDataReceived;
      
      // Use environment variable for data freshness window, default to 45 seconds
      const dataFreshnessWindow = parseInt(process.env.DATA_FRESHNESS_WINDOW) || 45000;
      
      // If data is within the freshness window, use it
      if (dataAge < dataFreshnessWindow) {
        // Calculate technical indicators from price history
        const technicals = this.bot.calculateTechnicalIndicators();
        
        return {
          price: this.cachedMarketData.price,
          open: this.cachedMarketData.price, 
          high: this.cachedMarketData.price * 1.001,
          low: this.cachedMarketData.price * 0.999,
          volume: this.cachedMarketData.volume,
          timestamp: this.cachedMarketData.timestamp,
          
          // Technical indicators
          rsi: technicals.rsi || 50,
          macd: technicals.macd || 0,
          volatility: technicals.volatility || 0.02,
          trend: this.bot.determineTrend(this.bot.priceHistory),
          
          // Market metadata
          symbol: this.cachedMarketData.symbol,
          source: 'WEBSOCKET_PRIORITY',
          lastUpdated: this.lastDataReceived,
          dataAge: dataAge,
          
          // Correlation data
          correlatedAssets: this.assetPrices
        };
      } else {
        console.warn(`⚠️ Market data is stale (${(dataAge/1000).toFixed(1)}s old)`);
        
        // Request fresh data
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'request',
            action: 'price_update',
            asset: this.bot.config.primaryAsset,
            priority: 'critical'
          }));
        }
      }
    }
    
    // If no recent data, return null
    console.warn('⚠️ No recent market data available from WebSocket');
    return null;
  }

  /**
   * 🛑 Enhanced shutdown with proper cleanup
   */
  async shutdown() {
    console.log('🛑 Shutting down WebSocket connection...');
    
    try {
      // Notify server of shutdown
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'bot_shutdown',
          connectionId: this.connectionId,
          reason: 'graceful_shutdown',
          stats: {
            totalTrades: this.bot.systemState.totalTrades,
            finalBalance: this.bot.systemState.currentBalance,
            uptime: Date.now() - this.bot.systemState.startTime
          }
        }));
        
        // Give message time to send
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Clear intervals
      if (this.wsReconnectInterval) {
        clearTimeout(this.wsReconnectInterval);
        this.wsReconnectInterval = null;
      }
      
      if (this.healthMonitorInterval) {
        clearInterval(this.healthMonitorInterval);
        this.healthMonitorInterval = null;
      }
      
      // Close WebSocket
      if (this.ws) {
        console.log('🔌 Closing WebSocket connection...');
        this.ws.close(1000, 'Bot shutdown');
        this.ws = null;
      }
      
      console.log('✅ WebSocket shutdown complete');
      
    } catch (error) {
      console.error('❌ WebSocket shutdown error:', error);
    }
  }
}

// Export the enhanced client
module.exports = EnhancedWebSocketClient;

/**
 * ===================================================================
 * 💡 INTEGRATION INSTRUCTIONS
 * ===================================================================
 * 
 * 1. In your trading bot file, import this enhanced client:
 *    const EnhancedWebSocketClient = require('./trading-bot-websocket-integration');
 * 
 * 2. In your bot constructor, create the client:
 *    this.wsClient = new EnhancedWebSocketClient(this);
 * 
 * 3. Replace your connectWebSocket() method with:
 *    connectWebSocket() {
 *      this.wsClient.connectWebSocket();
 *    }
 * 
 * 4. Replace your getMarketData() method with:
 *    async getMarketData() {
 *      return await this.wsClient.getMarketData();
 *    }
 * 
 * 5. In your shutdown() method, add:
 *    await this.wsClient.shutdown();
 * 
 * That's it! Your bot now has CRITICAL PRIORITY in the WebSocket system!
 * 
 * ===================================================================
 */
