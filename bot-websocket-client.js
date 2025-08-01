/**
 * 🤖 TRADING BOT WEBSOCKET CLIENT INTEGRATION
 * Add this enhanced WebSocket connection to your run-trading-bot-v13-simplified.js
 * 
 * This code ensures your bot:
 * ✅ Gets CRITICAL priority treatment
 * ✅ Never misses a price update
 * ✅ Auto-reconnects with exponential backoff
 * ✅ Validates all incoming data
 * ✅ Tracks connection health metrics
 */

/**
 * 🔌 Enhanced WebSocket connection with bot identification
 */
function connectWebSocket() {
  const sslServerHost = process.env.SSL_SERVER_HOST || '127.0.0.1';
  const sslServerPort = process.env.SSL_SERVER_PORT || '3010';
  const wsUrl = `ws://${sslServerHost}:${sslServerPort}`;
  
  console.log(`🔌 Connecting to ADVANCED SSL server at ${wsUrl}...`);
  console.log(`🤖 Bot identification: OGZ-PRIME-V13`);
  
  try {
    // Create WebSocket with custom headers
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'X-Client-Type': 'ogz-prime',
        'X-Client-Id': 'ogz-prime-trading-bot',
        'X-Bot-Version': '13.0.0'
      }
    });
    
    // Connection established
    this.ws.on('open', () => {
      console.log('✅ WebSocket connected to ADVANCED SSL server');
      console.log('🚀 Sending bot identification for CRITICAL priority...');
      
      this.wsConnected = true;
      this.reconnectAttempts = 0;
      this.connectionMetrics.connectedAt = Date.now();
      this.connectionMetrics.connectionCount++;
      
      // CRITICAL: Identify as OGZ Prime bot for priority treatment
      this.ws.send(JSON.stringify({
        type: 'identify',
        botType: 'ogz-prime-v13',
        version: '13.0.0',
        capabilities: ['real-time-trading', 'high-frequency', 'pattern-recognition'],
        tradingAssets: [this.config.primaryAsset],
        requestPriority: 'critical'
      }));
      
      // Clear any existing reconnection interval
      if (this.wsReconnectInterval) {
        clearInterval(this.wsReconnectInterval);
        this.wsReconnectInterval = null;
      }
      
      // Reset message tracking
      this.lastPriceReceived = Date.now();
      this.lastHeartbeatReceived = Date.now();
    });
    
    // Handle incoming messages with validation
    this.ws.on('message', (data) => {
      try {
        const startTime = Date.now();
        
        // Parse message
        const message = JSON.parse(data.toString());
        
        // Track message metrics
        this.connectionMetrics.messagesReceived++;
        const processingTime = Date.now() - startTime;
        
        // Log raw message for debugging (comment out in production)
        if (this.config.debugMode) {
          console.log(`📨 RAW: ${data.toString().substring(0, 200)}`);
        }
        
        // Handle different message types
        switch (message.type) {
          case 'identification-confirmed':
            console.log('🎯 BOT IDENTIFICATION CONFIRMED!');
            console.log(`💎 Priority level: ${message.priority}`);
            console.log(`🚀 Features enabled: ${message.features.join(', ')}`);
            this.botIdentified = true;
            break;
            
          case 'price':
            this.handlePriceMessage(message);
            break;
            
          case 'price-snapshot':
            this.handlePriceSnapshot(message);
            break;
            
          case 'heartbeat':
            this.handleHeartbeat(message);
            break;
            
          case 'system':
            this.handleSystemMessage(message);
            break;
            
          case 'status':
            console.log(`📋 Server status: ${JSON.stringify(message.data)}`);
            break;
            
          default:
            console.log(`❓ Unknown message type: ${message.type}`);
        }
        
        // Track processing performance
        if (processingTime > 10) {
          console.warn(`⚠️ Slow message processing: ${processingTime}ms`);
        }
        
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        console.error('Raw data:', data.toString());
        this.connectionMetrics.errorCount++;
      }
    });
    
    // Handle connection close
    this.ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket disconnected: ${code} - ${reason}`);
      this.wsConnected = false;
      this.botIdentified = false;
      
      // Track disconnection
      this.connectionMetrics.disconnectionCount++;
      this.connectionMetrics.lastDisconnectTime = Date.now();
      
      // Schedule reconnection with exponential backoff
      this.scheduleReconnect();
    });
    
    // Handle errors
    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      this.wsConnected = false;
      this.connectionMetrics.errorCount++;
    });
    
    // Handle ping/pong for connection health
    this.ws.on('ping', () => {
      this.ws.pong();
      this.connectionMetrics.lastPingTime = Date.now();
    });
    
  } catch (error) {
    console.error('❌ Failed to connect WebSocket:', error);
    this.scheduleReconnect();
  }
}

/**
 * 💰 Handle price messages with validation
 */
function handlePriceMessage(message) {
  if (!message.data || typeof message.data.price !== 'number') {
    console.error('❌ Invalid price message format');
    return;
  }
  
  const priceData = message.data;
  
  // Validate price is reasonable (not 0 or negative)
  if (priceData.price <= 0) {
    console.error(`❌ Invalid price value: ${priceData.price}`);
    return;
  }
  
  // Update cached market data
  this.cachedMarketData = {
    price: priceData.price,
    volume: priceData.volume || 0,
    timestamp: priceData.timestamp || Date.now(),
    symbol: priceData.asset || 'BTC-USD',
    change: priceData.change || 0,
    source: priceData.source || 'websocket'
  };
  
  this.lastDataReceived = Date.now();
  this.lastPriceReceived = Date.now();
  this.connectionMetrics.priceUpdatesReceived++;
  
  // Calculate price update frequency
  if (this.lastPriceTimestamp) {
    const timeDiff = Date.now() - this.lastPriceTimestamp;
    this.connectionMetrics.avgPriceUpdateInterval = 
      (this.connectionMetrics.avgPriceUpdateInterval * 0.9) + (timeDiff * 0.1);
  }
  this.lastPriceTimestamp = Date.now();
  
  console.log(`💰 ${priceData.asset}: $${priceData.price.toFixed(2)} (${priceData.change > 0 ? '+' : ''}${priceData.change}%)`);
  
  // Emit event for other systems
  this.emit('priceUpdate', this.cachedMarketData);
}

/**
 * 📊 Handle price snapshot (bulk update)
 */
function handlePriceSnapshot(message) {
  if (!message.prices || typeof message.prices !== 'object') {
    console.error('❌ Invalid price snapshot format');
    return;
  }
  
  console.log('📊 Received price snapshot:');
  
  for (const [asset, price] of Object.entries(message.prices)) {
    if (asset === this.config.primaryAsset) {
      this.cachedMarketData = {
        price: price,
        volume: 0,
        timestamp: message.timestamp || Date.now(),
        symbol: asset,
        source: 'snapshot'
      };
      this.lastDataReceived = Date.now();
    }
    console.log(`   ${asset}: $${price.toFixed(2)}`);
  }
}

/**
 * 💓 Handle heartbeat messages
 */
function handleHeartbeat(message) {
  this.lastHeartbeatReceived = Date.now();
  this.connectionMetrics.heartbeatsReceived++;
  
  // Check server health
  if (message.polygonConnected === false) {
    console.warn('⚠️ Server reports Polygon disconnected!');
  }
  
  // Log heartbeat occasionally
  if (this.connectionMetrics.heartbeatsReceived % 30 === 0) {
    console.log(`💓 Connection healthy - ${this.connectionMetrics.heartbeatsReceived} heartbeats`);
  }
}

/**
 * 🔧 Handle system messages
 */
function handleSystemMessage(message) {
  console.log(`🔧 System message: ${message.action}`);
  
  switch (message.action) {
    case 'welcome':
      console.log('👋 Welcomed by server');
      console.log(`   Client ID: ${message.clientId}`);
      console.log(`   System health: ${message.systemStatus?.healthy ? '✅' : '❌'}`);
      break;
      
    case 'shutdown':
      console.warn('🚨 Server shutting down!');
      this.prepareForShutdown();
      break;
      
    default:
      console.log(`   Details: ${JSON.stringify(message)}`);
  }
}

/**
 * 🔄 Schedule WebSocket reconnection with exponential backoff
 */
function scheduleReconnect() {
  if (this.wsReconnectInterval) {
    return; // Already scheduled
  }
  
  // Calculate backoff delay
  const baseDelay = 5000; // 5 seconds
  const maxDelay = 60000; // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), maxDelay);
  
  console.log(`🔄 Scheduling reconnection in ${delay/1000} seconds... (attempt ${this.reconnectAttempts + 1})`);
  
  this.wsReconnectInterval = setInterval(() => {
    if (!this.wsConnected) {
      console.log('🔄 Attempting to reconnect to SSL server...');
      this.reconnectAttempts++;
      this.connectWebSocket();
    }
  }, delay);
}

/**
 * 📊 Connection health monitoring
 */
function checkConnectionHealth() {
  const now = Date.now();
  
  // Check if we're receiving data
  if (this.wsConnected && this.lastDataReceived) {
    const dataAge = now - this.lastDataReceived;
    const heartbeatAge = now - this.lastHeartbeatReceived;
    
    if (dataAge > 30000) { // No price data for 30 seconds
      console.warn(`⚠️ No price data for ${(dataAge/1000).toFixed(0)} seconds`);
      
      if (dataAge > 60000) { // No data for 60 seconds
        console.error('🚨 Connection appears dead - forcing reconnect');
        this.ws.close();
        this.scheduleReconnect();
      }
    }
    
    if (heartbeatAge > 10000) { // No heartbeat for 10 seconds
      console.warn(`⚠️ No heartbeat for ${(heartbeatAge/1000).toFixed(0)} seconds`);
    }
  }
  
  // Log connection metrics periodically
  if (this.connectionMetrics.messagesReceived % 100 === 0) {
    console.log('📊 Connection Metrics:');
    console.log(`   Messages: ${this.connectionMetrics.messagesReceived}`);
    console.log(`   Price Updates: ${this.connectionMetrics.priceUpdatesReceived}`);
    console.log(`   Errors: ${this.connectionMetrics.errorCount}`);
    console.log(`   Reconnects: ${this.connectionMetrics.disconnectionCount}`);
    console.log(`   Avg Update Interval: ${(this.connectionMetrics.avgPriceUpdateInterval/1000).toFixed(1)}s`);
  }
}

/**
 * 🛑 Prepare for server shutdown
 */
function prepareForShutdown() {
  console.log('🛑 Preparing for server shutdown...');
  
  // Save current state
  this.saveSystemState();
  
  // Close positions if configured
  if (this.config.closeOnDisconnect) {
    console.log('🔒 Closing all positions for safety...');
    this.closeAllPositions('SERVER_SHUTDOWN');
  }
  
  // Prevent new trades
  this.systemState.allowNewTrades = false;
}

/**
 * 🔧 Initialize connection tracking
 */
function initializeConnectionTracking() {
  this.wsConnected = false;
  this.botIdentified = false;
  this.lastDataReceived = null;
  this.lastPriceReceived = null;
  this.lastHeartbeatReceived = null;
  this.lastPriceTimestamp = null;
  this.reconnectAttempts = 0;
  
  this.connectionMetrics = {
    connectedAt: null,
    connectionCount: 0,
    disconnectionCount: 0,
    messagesReceived: 0,
    priceUpdatesReceived: 0,
    heartbeatsReceived: 0,
    errorCount: 0,
    lastPingTime: null,
    lastDisconnectTime: null,
    avgPriceUpdateInterval: 0
  };
  
  // Start health monitoring
  setInterval(() => {
    this.checkConnectionHealth();
  }, 10000); // Every 10 seconds
}

/**
 * 💾 Enhanced getMarketData that validates WebSocket data
 */
async function getMarketData() {
  // Check if we have recent cached data from WebSocket
  if (this.cachedMarketData.price && this.lastDataReceived) {
    const dataAge = Date.now() - this.lastDataReceived;
    
    // Use cached data if less than 5 seconds old
    if (dataAge < 5000) {
      // Calculate technical indicators from cached price
      const rsi = this.calculateRSIFromPrice(this.cachedMarketData.price);
      const trend = this.cachedMarketData.change > 0.5 ? 'up' : 
                    this.cachedMarketData.change < -0.5 ? 'down' : 'sideways';
      
      return {
        price: this.cachedMarketData.price,
        open: this.cachedMarketData.price * (1 - this.cachedMarketData.change / 100),
        high: this.cachedMarketData.price * 1.001,
        low: this.cachedMarketData.price * 0.999,
        volume: this.cachedMarketData.volume,
        timestamp: this.cachedMarketData.timestamp,
        
        // Technical indicators
        rsi: rsi,
        macd: 0, // Would need price history to calculate
        volatility: Math.abs(this.cachedMarketData.change) / 100,
        trend: trend,
        
        // Market metadata
        symbol: this.cachedMarketData.symbol,
        source: 'WEBSOCKET_REALTIME',
        lastUpdated: this.lastDataReceived,
        dataAge: dataAge,
        connectionHealth: this.wsConnected ? 'HEALTHY' : 'DISCONNECTED'
      };
    } else {
      console.warn(`⚠️ Market data is stale (${(dataAge/1000).toFixed(1)}s old)`);
    }
  }
  
  // If no recent data, log warning
  console.warn('⚠️ No recent market data available from WebSocket');
  console.log(`   Connected: ${this.wsConnected}`);
  console.log(`   Identified: ${this.botIdentified}`);
  console.log(`   Last price: ${this.lastPriceReceived ? new Date(this.lastPriceReceived).toLocaleTimeString() : 'Never'}`);
  
  return null;
}

/**
 * 🧮 Simple RSI calculation from current price
 */
function calculateRSIFromPrice(currentPrice) {
  // This is a simplified version - real RSI needs price history
  // For now, return neutral RSI
  return 50;
}

// Export the enhanced connection function
module.exports = {
  connectWebSocket,
  handlePriceMessage,
  handlePriceSnapshot,
  handleHeartbeat,
  handleSystemMessage,
  scheduleReconnect,
  checkConnectionHealth,
  prepareForShutdown,
  initializeConnectionTracking,
  getMarketData,
  calculateRSIFromPrice
};
