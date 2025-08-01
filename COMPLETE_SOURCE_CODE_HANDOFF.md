# 🔥 COMPLETE SOURCE CODE HANDOFF PACKAGE
**ALL FILES INCLUDED - READY TO DEBUG AND FIX**

## 📁 ACTUAL SOURCE FILES PROVIDED

### 1. MAIN SERVER FILE: `ogzprime_ssl_server_advanced.js`

```javascript
/**
 * ===================================================================
 * 🚀 OGZ PRIME SSL SERVER - ADVANCED INTEGRATION
 * ===================================================================
 * This is how you integrate the Advanced WebSocket Broadcasting System
 * into your SSL server for BULLETPROOF real-time data delivery
 * ===================================================================
 */

const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 🔥 IMPORT THE ADVANCED WEBSOCKET SYSTEM
const AdvancedWebSocketBroadcastSystem = require('./core/AdvancedWebSocketBroadcastSystem');
const { CONFIG } = require('./core/WebSocketConfig');

// Set SSL server flag
process.env.OGZ_SSL_SERVER = 'true';

// Initialize the ADVANCED broadcasting system
const broadcaster = new AdvancedWebSocketBroadcastSystem({
  // Connection health
  heartbeatInterval: 5000,
  connectionTimeout: 30000,
  
  // Message delivery
  messageTimeout: 3000,
  maxRetries: 3,
  ackTimeout: 2000,
  
  // Performance optimization
  maxQueueSize: 10000,
  batchSize: 50,
  throttleMs: 10,
  compressionThreshold: 1024,
  
  // Circuit breaker for resilience
  circuitBreakerThreshold: 10,
  circuitBreakerResetTime: 60000,
  
  // Monitoring
  metricsInterval: 30000,
  performanceAlertThreshold: 100
});

// Special handling for bot connections
broadcaster.on('bot_disconnected', (connection) => {
  console.error('🚨 CRITICAL: Trading bot disconnected!');
  console.error(`   Connection ID: ${connection.id}`);
  console.error(`   Connected for: ${((Date.now() - connection.metadata.connectedAt) / 1000).toFixed(2)}s`);
  console.error(`   Last activity: ${new Date(connection.metadata.lastActivity).toLocaleTimeString()}`);
  
  // Alert system - in production, this would send notifications
  console.error('🔔 ALERT: Attempting automatic recovery...');
});

console.log(`[SSL-${Date.now()}] Advanced SSL Server starting...`);
console.log('🚀 OGZPrime SSL Server with ADVANCED BROADCASTING SYSTEM');
console.log('💪 Built for warriors who don\'t take shortcuts');

// Express setup
const app = express();
const apiPort = 3010;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('X-Powered-By', 'OGZ-Prime-Advanced');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Dashboard routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

// Enhanced status endpoint with broadcaster stats
app.get('/api/live-status', (req, res) => {
  const broadcasterStats = broadcaster.getStatistics();
  
  res.json({
    balance: 10000,
    timestamp: new Date().toISOString(),
    isRunning: true,
    trades: 0,
    decisionsToday: 0,
    currentPrice: lastKnownPrice,
    
    // ADVANCED METRICS
    websocketStats: {
      totalConnections: broadcasterStats.connections.total,
      connectionsByType: broadcasterStats.connections.byType,
      messageRate: broadcasterStats.performance.messagesPerSecond,
      averageLatency: broadcasterStats.performance.averageLatency,
      successRate: broadcasterStats.performance.successRate,
      queuedMessages: broadcasterStats.queues.totalQueued
    },
    
    serverInfo: {
      supportsSSL: true,
      wsPort: apiPort,
      secureWsPort: 443,
      apiPort: apiPort,
      secureApiPort: 443,
      advancedBroadcasting: true
    }
  });
});

// System health endpoint
app.get('/api/health', (req, res) => {
  const stats = broadcaster.getStatistics();
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    websockets: stats,
    timestamp: Date.now()
  });
});

// Complete Stripe integration from basic server
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    console.log(`🔥 Creating Stripe checkout session for price: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${req.protocol}://${req.get('host')}/success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/pricing.html`,
      metadata: {
        priceId: priceId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Stripe session created: ${session.id}`);
    res.json({ sessionId: session.id });

  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Regular HTTP server
const httpServer = http.createServer(app);
httpServer.listen(apiPort, '0.0.0.0', () => {
  console.log(`🌐 HTTP API Server running on port ${apiPort} (all interfaces)`);
});

// Single WebSocket server on unified port
const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws'  // Optional: use path-based routing
});

wss.on('connection', (ws, req) => {
  // Register ALL connections with broadcaster
  const connectionId = broadcaster.registerConnection(ws, {
    type: 'unknown',
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  console.log(`✅ New connection registered: ${connectionId}`);
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // CRITICAL: Handle ping/pong for connection health
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong', 
          id: data.id,
          timestamp: data.timestamp || Date.now()
        }));
        console.log(`🏓 Responded to ping from ${connectionId}`);
        return;
      }
      
      if (data.type === 'pong') {
        console.log(`✅ Received pong from ${connectionId}`);
        return;
      }
      
      // Special handling for bot identification
      if (data.type === 'identify' && data.source === 'trading_bot') {
        console.log('🤖 TRADING BOT IDENTIFIED!');
        
        // Update connection metadata
        const connection = broadcaster.connections.get(connectionId);
        if (connection) {
          connection.metadata.type = 'bot';
          connection.state.priority = 'critical';
          
          // Send confirmation
          broadcaster.sendDirect(connection, {
            type: 'identification_confirmed',
            connectionId: connectionId,
            priority: 'critical',
            message: 'You are now registered as a critical trading bot connection'
          });
        }
      }
      
      // Special handling for dashboard identification
      if (data.type === 'identify' && data.source === 'dashboard') {
        const connection = broadcaster.connections.get(connectionId);
        if (connection) {
          connection.metadata.type = 'dashboard';
          console.log('📊 Dashboard identified');
        }
      }
      
    } catch (err) {
      console.error(`Error parsing message from ${connectionId}:`, err);
    }
  });
});

// Market data variables
let lastKnownPrice = null;
let tickCount = 0;
let assetPrices = {};
let currentAsset = 'BTC-USD';

// 🔌 Polygon.io WebSocket connection
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

// Check if API key is configured
if (!POLYGON_API_KEY) {
  console.error('❌ POLYGON_API_KEY environment variable not set!');
  console.error('   Add POLYGON_API_KEY=your_key_here to your .env file');
  process.exit(1);
}

const polygonSocket = new WebSocket(POLYGON_CRYPTO_SOCKET);

polygonSocket.on('open', () => {
  console.log('🔌 Connected to Polygon.io crypto feed');
  polygonSocket.send(JSON.stringify({
    action: 'auth',
    params: POLYGON_API_KEY
  }));
});

polygonSocket.on('message', (data) => {
  try {
    const messages = JSON.parse(data);
    const msgArray = Array.isArray(messages) ? messages : [messages];

    for (const msg of msgArray) {
      // Debug logging
      if (msg.ev || msg.status || msg.message) {
        console.log(`🔍 POLYGON MSG:`, JSON.stringify(msg).substring(0, 200));
      }
      
      if (msg.status === 'auth_success') {
        console.log('✅ Polygon authenticated - subscribing to multiple assets');
        
        const assets = ['XA.BTC-USD', 'XA.ETH-USD', 'XA.SOL-USD', 'XA.ADA-USD'];
        assets.forEach(asset => {
          polygonSocket.send(JSON.stringify({
            action: 'subscribe',
            params: asset
          }));
          console.log(`📡 Subscribed to ${asset}`);
        });
      }
      
      if (msg.ev === 'XA' && msg.c && msg.e) {
        tickCount++;
        const price = parseFloat(msg.c);
        const timestamp = new Date(msg.e).toISOString();
        
        // Determine asset
        let asset = 'BTC-USD';
        if (msg.pair) {
          // Fix: Only add dash if not already present
          asset = msg.pair.includes('-') ? msg.pair : msg.pair.replace('USD', '-USD');
        }
        
        // Store price
        assetPrices[asset] = price;
        if (asset === currentAsset) {
          lastKnownPrice = price;
        }

        // Log periodically
        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`🎯 TICK #${tickCount}: ${asset} $${price.toFixed(2)} @ ${new Date(msg.e).toLocaleTimeString()}`);
        }

        // 🚀 BROADCAST USING ADVANCED SYSTEM
        const priceMessage = {
          type: 'price',
          data: {
            asset: asset,
            price: price,
            timestamp: Date.now(),
            allPrices: assetPrices,
            tickCount: tickCount
          }
        };
        
        // Broadcast to ALL connections with high priority
        const result = broadcaster.broadcast(priceMessage, {
          priority: 'high',
          requiresAck: false // Don't require ACK for price updates
        });
        
        // Broadcast specifically to bots with critical priority
        broadcaster.broadcast(priceMessage, {
          type: 'bot',
          priority: 'critical',
          requiresAck: true // Require ACK from bots
        });
        
        // Log broadcast results
        if (result.sent > 0) {
          console.log(`📡 Price broadcast: ${asset} $${price.toFixed(2)} to ${result.sent} clients`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SSL server...');
  
  broadcaster.shutdown();
  
  if (polygonSocket.readyState === WebSocket.OPEN) {
    polygonSocket.close();
  }
  
  process.exit(0);
});

console.log('\n✅ OGZ Prime ADVANCED Server Running');
console.log('🚀 Powered by Advanced WebSocket Broadcasting System');
console.log(`📡 WebSocket: ws://localhost:${apiPort}/ws`);
console.log(`🌐 API: http://localhost:${apiPort}/api/live-status`);
console.log('\n💪 FOR HOUSTON! FOR FINANCIAL FREEDOM! FOR VICTORY! 💪\n');
```

---

### 2. TRADING BOT CLIENT: `run-trading-bot-v13-simplified.js`

```javascript
/**
 * OGZ Prime Trading Bot V13 - SIMPLIFIED WEBSOCKET VERSION
 * ========================================================
 * This is the CORE trading bot that connects to the SSL server
 * via WebSocket and processes real-time market data
 * ========================================================
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const net = require('net');

// Import configurations
const { getWebSocketUrl, CONFIG } = require('./core/WebSocketConfig');

console.log('🚀 OGZ Prime Trading Bot V13 - SIMPLIFIED STARTING...');
console.log('💪 Built for Houston Mission - Financial Freedom Through AI');

// Trading Bot Configuration
const TRADING_CONFIG = {
  initialBalance: 10000,
  riskPerTrade: 0.02,    // 2% risk per trade
  maxDrawdown: 0.15,     // 15% max drawdown
  stopLoss: 0.05,        // 5% stop loss
  takeProfit: 0.10,      // 10% take profit
  maxPositions: 3,       // Max concurrent positions
  tradingMode: 'AGGRESSIVE' // CONSERVATIVE, BALANCED, AGGRESSIVE
};

// Enhanced Message Handler with Error Recovery
class RobustMessageHandler extends EventEmitter {
  constructor() {
    super();
    this.handlers = new Map();
    this.messageQueue = [];
    this.processingQueue = false;
    
    // Set up default handlers
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    this.handlers.set('price', this.handlePriceUpdate.bind(this));
    this.handlers.set('ping', this.handlePing.bind(this));
    this.handlers.set('pong', this.handlePong.bind(this));
    this.handlers.set('identification_confirmed', this.handleIdentificationConfirmed.bind(this));
    this.handlers.set('system_status', this.handleSystemStatus.bind(this));
    this.handlers.set('error', this.handleError.bind(this));
    this.handlers.set('default', this.handleUnknownMessage.bind(this));
  }

  addMessage(rawData) {
    this.messageQueue.push(rawData);
    this.processQueue();
  }

  async processQueue() {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const rawData = this.messageQueue.shift();
      try {
        await this.processMessage(rawData);
      } catch (error) {
        console.error('❌ Message processing error (non-fatal):', error);
        // Continue processing - don't let one bad message break everything
      }
    }
    
    this.processingQueue = false;
  }

  async processMessage(rawData) {
    try {
      // Parse message safely
      let message;
      try {
        message = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('Raw data:', rawData.toString().substring(0, 200));
        return; // Skip this message
      }
      
      if (!message || typeof message !== 'object') {
        console.error('❌ Invalid message format:', message);
        return;
      }
      
      const messageType = message.type || 'unknown';
      const handler = this.handlers.get(messageType) || this.handlers.get('default');
      
      // Execute handler safely
      try {
        await handler.call(this, message);
      } catch (handlerError) {
        console.error(`❌ Handler error for ${messageType}:`, handlerError);
        // Don't crash - continue processing
      }
      
    } catch (outerError) {
      console.error('❌ Critical message processing error:', outerError);
      // Even in worst case, don't crash the connection
    }
  }

  handlePriceUpdate(message) {
    try {
      const { data } = message;
      if (!data || !data.price) {
        console.error('❌ Invalid price data:', data);
        return;
      }
      
      const price = parseFloat(data.price);
      const asset = data.asset || 'BTC-USD';
      const timestamp = data.timestamp || Date.now();
      
      console.log(`💰 PRICE UPDATE: ${asset} $${price.toFixed(2)}`);
      
      // Send ACK if required
      if (message._meta && message._meta.requiresAck) {
        this.sendAck(message._meta.id, 'received');
      }
      
      // Process trading logic
      this.processTradingDecision(asset, price, timestamp);
      
    } catch (error) {
      console.error('❌ Price update processing error:', error);
    }
  }

  handlePing(message) {
    try {
      console.log(`🏓 Received ping: ${message.id}`);
      
      // Send pong response
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'pong',
          id: message.id,
          timestamp: Date.now()
        }));
        console.log(`🏓 Sent pong response: ${message.id}`);
      }
    } catch (error) {
      console.error('❌ Ping handling error:', error);
    }
  }

  handlePong(message) {
    console.log(`✅ Received pong: ${message.id}`);
  }

  handleIdentificationConfirmed(message) {
    console.log('🤖 ✅ BOT IDENTIFICATION CONFIRMED!');
    console.log(`   Connection ID: ${message.connectionId}`);
    console.log(`   Priority: ${message.priority}`);
    console.log(`   Message: ${message.message}`);
    
    this.emit('bot_identified', message);
  }

  handleSystemStatus(message) {
    const { data } = message;
    if (data) {
      console.log(`📊 System Status: ${data.serverStatus} | Connections: ${data.totalConnections}`);
    }
  }

  handleError(message) {
    console.error('🚨 Server Error:', message.error);
  }

  handleUnknownMessage(message) {
    console.log(`❓ Unknown message type: ${message.type}`);
  }

  processTradingDecision(asset, price, timestamp) {
    try {
      // Simple trading logic - REPLACE WITH YOUR ACTUAL ALGORITHM
      const decision = this.analyzeMarket(asset, price);
      
      if (decision !== 'HOLD') {
        console.log(`🎯 TRADING DECISION: ${decision} ${asset} at $${price.toFixed(2)}`);
        console.log(`   Reasoning: ${decision === 'BUY' ? 'Bullish momentum detected' : 'Bearish trend identified'}`);
        
        // In real implementation, execute the trade here
        this.emit('trading_decision', {
          action: decision,
          asset: asset,
          price: price,
          timestamp: timestamp,
          confidence: 0.75
        });
      }
      
    } catch (error) {
      console.error('❌ Trading decision error:', error);
    }
  }

  analyzeMarket(asset, price) {
    // PLACEHOLDER LOGIC - Replace with actual trading algorithm
    const random = Math.random();
    if (random > 0.95) return 'BUY';
    if (random < 0.05) return 'SELL';
    return 'HOLD';
  }

  sendAck(messageId, status = 'received') {
    try {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'ack',
          messageId: messageId,
          status: status,
          timestamp: Date.now()
        }));
        console.log(`✅ Sent ACK for message: ${messageId}`);
      }
    } catch (error) {
      console.error('❌ ACK sending error:', error);
    }
  }

  setWebSocketConnection(ws) {
    this.wsConnection = ws;
  }
}

// Enhanced WebSocket Client with Robust Reconnection
class TradingBotWebSocketClient extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this.url = url;
    this.options = {
      maxReconnectAttempts: 20,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      connectionTimeout: 30000,
      ...options
    };
    
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.connectionTimer = null;
    
    // Initialize message handler
    this.messageHandler = new RobustMessageHandler();
    this.messageHandler.setWebSocketConnection = (ws) => {
      this.messageHandler.wsConnection = ws;
    };
    
    // Set up message handler events
    this.messageHandler.on('bot_identified', (data) => {
      this.emit('bot_identified', data);
    });
    
    this.messageHandler.on('trading_decision', (decision) => {
      this.emit('trading_decision', decision);
    });
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to: ${this.url}`);
        
        this.ws = new WebSocket(this.url);
        
        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            console.error('❌ Connection timeout');
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.options.connectionTimeout);
        
        this.ws.on('open', () => {
          clearTimeout(this.connectionTimer);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          console.log('✅ WebSocket connected successfully');
          
          // Set up message handler connection
          this.messageHandler.setWebSocketConnection(this.ws);
          
          // Send bot identification immediately
          this.identifyAsBot();
          
          // Start heartbeat
          this.startHeartbeat();
          
          resolve();
        });
        
        this.ws.on('message', (data) => {
          try {
            // Feed message to robust handler
            this.messageHandler.addMessage(data);
          } catch (error) {
            console.error('❌ Message handling error:', error);
            // Don't crash - keep connection alive
          }
        });
        
        this.ws.on('close', (code, reason) => {
          this.isConnected = false;
          clearInterval(this.heartbeatTimer);
          console.log(`❌ WebSocket closed: ${code} - ${reason}`);
          
          this.emit('disconnected', { code, reason });
          
          // Attempt reconnection
          this.attemptReconnection();
        });
        
        this.ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
        });
        
      } catch (error) {
        console.error('❌ Connection setup error:', error);
        reject(error);
      }
    });
  }

  identifyAsBot() {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const identificationMessage = {
          type: 'identify',
          source: 'trading_bot',
          version: 'V13-SIMPLIFIED',
          capabilities: ['trading', 'realtime', 'priority'],
          timestamp: Date.now(),
          clientId: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.ws.send(JSON.stringify(identificationMessage));
        console.log('🤖 Sent bot identification');
      }
    } catch (error) {
      console.error('❌ Bot identification error:', error);
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'ping',
            id: `ping_${Date.now()}`,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('❌ Heartbeat error:', error);
      }
    }, this.options.heartbeatInterval);
  }

  attemptReconnection() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.options.maxReconnectAttempts}) reached`);
      this.emit('max_reconnect_attempts_reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    const cappedDelay = Math.min(delay, 60000); // Max 1 minute
    
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} in ${cappedDelay}ms`);
    
    setTimeout(() => {
      this.connect().catch((error) => {
        console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      });
    }, cappedDelay);
  }

  disconnect() {
    this.isConnected = false;
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.connectionTimer);
    
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Wait for server to be ready
async function waitForServer(port = 3010, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const checkConnection = () => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      
      socket.on('connect', () => {
        socket.destroy();
        console.log(`✅ Server is ready on ${host}:${port}`);
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        console.log(`⏳ Waiting for server on ${host}:${port}...`);
        setTimeout(checkConnection, 2000);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        setTimeout(checkConnection, 2000);
      });
      
      socket.connect(port, host);
    };
    
    checkConnection();
  });
}

// Main Trading Bot Logic
class OGZPrimeTradingBot {
  constructor() {
    this.balance = TRADING_CONFIG.initialBalance;
    this.positions = new Map();
    this.tradeHistory = [];
    this.isRunning = false;
    this.wsClient = null;
    
    console.log(`💰 Initial Balance: $${this.balance.toLocaleString()}`);
    console.log(`📊 Trading Mode: ${TRADING_CONFIG.tradingMode}`);
    console.log(`⚡ Risk Per Trade: ${(TRADING_CONFIG.riskPerTrade * 100).toFixed(1)}%`);
  }

  async start() {
    try {
      console.log('🚀 Starting OGZ Prime Trading Bot...');
      
      // Wait for server to be ready
      console.log('⏳ Waiting for WebSocket server...');
      await waitForServer(3010);
      
      // Get WebSocket URL
      const wsUrl = getWebSocketUrl('client');
      console.log(`🔗 WebSocket URL: ${wsUrl}`);
      
      // Create WebSocket client
      this.wsClient = new TradingBotWebSocketClient(wsUrl);
      
      // Set up event handlers
      this.wsClient.on('bot_identified', (data) => {
        console.log('🤖 ✅ Bot successfully identified with server!');
        this.isRunning = true;
      });
      
      this.wsClient.on('trading_decision', (decision) => {
        console.log(`📈 TRADING DECISION: ${decision.action} ${decision.asset}`);
        this.executeTrade(decision);
      });
      
      this.wsClient.on('disconnected', (data) => {
        console.log('❌ WebSocket disconnected, bot paused');
        this.isRunning = false;
      });
      
      this.wsClient.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
      
      // Connect to WebSocket
      await this.wsClient.connect();
      
      console.log('✅ OGZ Prime Trading Bot is LIVE and ready to trade!');
      
    } catch (error) {
      console.error('❌ Failed to start trading bot:', error);
      process.exit(1);
    }
  }
  
  executeTrade(decision) {
    // Placeholder for actual trade execution
    console.log(`🎯 Executing ${decision.action} for ${decision.asset} at $${decision.price}`);
  }
  
  stop() {
    console.log('🛑 Stopping trading bot...');
    this.isRunning = false;
    if (this.wsClient) {
      this.wsClient.disconnect();
    }
  }
}

// Start the bot
const bot = new OGZPrimeTradingBot();
bot.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down trading bot...');
  bot.stop();
  process.exit(0);
});
```

---

### 3. MISSING CONFIG FILE: `core/WebSocketConfig.js` (MUST CREATE)

```javascript
const net = require('net');

class WebSocketConfig {
  constructor() {
    this.CONFIG = {
      unifiedPort: 3010,
      path: '/ws',
      maxReconnectAttempts: 10,
      reconnectInterval: 5000,      // 5 seconds
      connectionTimeout: 30000,     // 30 seconds
      heartbeatInterval: 15000,     // 15 seconds
      ackTimeout: 5000,             // 5 seconds
      messageQueueLimit: 1000,
      retryBackoffMultiplier: 1.5,
      maxRetryDelay: 60000          // 1 minute max
    };
  }

  getWebSocketUrl(type = 'client') {
    const protocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
    const host = process.env.WS_HOST || 'localhost';
    const port = process.env.WS_PORT || this.CONFIG.unifiedPort;
    return `${protocol}://${host}:${port}${this.CONFIG.path}`;
  }

  async waitForServer(port = 3010, host = '127.0.0.1', timeout = 60000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Server not available after ${timeout}ms`));
          return;
        }

        const socket = new net.Socket();
        socket.setTimeout(2000);
        
        socket.on('connect', () => {
          socket.destroy();
          console.log(`✅ Server is ready on ${host}:${port}`);
          resolve();
        });
        
        socket.on('error', () => {
          socket.destroy();
          setTimeout(checkConnection, 1000);
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          setTimeout(checkConnection, 1000);
        });
        
        socket.connect(port, host);
      };
      
      checkConnection();
    });
  }

  getRetryDelay(attempt) {
    const delay = this.CONFIG.reconnectInterval * Math.pow(this.CONFIG.retryBackoffMultiplier, attempt);
    return Math.min(delay, this.CONFIG.maxRetryDelay);
  }
}

// Export both class and config object
const configInstance = new WebSocketConfig();
module.exports = { 
  WebSocketConfig, 
  CONFIG: configInstance.CONFIG,
  getWebSocketUrl: configInstance.getWebSocketUrl.bind(configInstance)
};
```

---

### 4. ADVANCED BROADCASTING SYSTEM: `core/AdvancedWebSocketBroadcastSystem.js`

```javascript
const EventEmitter = require('events');
const WebSocket = require('ws');

class AdvancedWebSocketBroadcastSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      heartbeatInterval: 5000,
      connectionTimeout: 30000,
      messageTimeout: 3000,
      maxRetries: 3,
      ackTimeout: 2000,
      maxQueueSize: 10000,
      batchSize: 50,
      throttleMs: 10,
      compressionThreshold: 1024,
      circuitBreakerThreshold: 10,
      circuitBreakerResetTime: 60000,
      metricsInterval: 30000,
      performanceAlertThreshold: 100,
      ...options
    };
    
    // Connection management
    this.connections = new Map();
    this.connectionTypes = {
      bot: new Set(),
      dashboard: new Set(),
      unknown: new Set()
    };
    
    // Message queues and tracking
    this.messageQueue = [];
    this.pendingAcks = new Map();
    this.messageHistory = [];
    
    // Performance metrics
    this.metrics = {
      messagesPerSecond: 0,
      averageLatency: 0,
      successRate: 100,
      failureCount: 0,
      totalMessages: 0
    };
    
    // Circuit breaker state
    this.circuitBreaker = {
      failures: 0,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailure: null
    };
    
    this.startMetricsCollection();
  }
  
  registerConnection(ws, metadata = {}) {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const connection = {
      id: connectionId,
      ws: ws,
      metadata: {
        type: metadata.type || 'unknown',
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        ...metadata
      },
      state: {
        priority: 'normal',
        isHealthy: true,
        lastPing: null,
        consecutiveFailures: 0
      },
      stats: {
        messagesSent: 0,
        messagesReceived: 0,
        averageResponseTime: 0
      }
    };
    
    this.connections.set(connectionId, connection);
    this.connectionTypes[connection.metadata.type].add(connectionId);
    
    // Set up connection event handlers
    ws.on('close', () => {
      this.unregisterConnection(connectionId);
    });
    
    ws.on('error', (error) => {
      console.error(`Connection ${connectionId} error:`, error);
      connection.state.isHealthy = false;
    });
    
    console.log(`📡 Connection registered: ${connectionId} (${connection.metadata.type})`);
    return connectionId;
  }
  
  unregisterConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Remove from type tracking
    this.connectionTypes[connection.metadata.type].delete(connectionId);
    
    // Special handling for bot disconnections
    if (connection.metadata.type === 'bot') {
      this.emit('bot_disconnected', connection);
    }
    
    this.connections.delete(connectionId);
    console.log(`📡 Connection unregistered: ${connectionId}`);
  }
  
  broadcast(message, options = {}) {
companionId, options = {}) {
    const {
      type = null,           // Target connection type
      priority = 'normal',   // normal, high, critical
      requiresAck = false,   // Require acknowledgment
      timeout = this.options.messageTimeout
    } = options;
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const broadcastMessage = {
      ...message,
      _meta: {
        id: messageId,
        priority: priority,
        requiresAck: requiresAck,
        timestamp: Date.now(),
        retryCount: 0
      }
    };
    
    let targetConnections = [];
    
    if (type) {
      // Broadcast to specific connection type
      const connectionIds = Array.from(this.connectionTypes[type] || []);
      targetConnections = connectionIds
        .map(id => this.connections.get(id))
        .filter(conn => conn && conn.state.isHealthy);
    } else {
      // Broadcast to all healthy connections
      targetConnections = Array.from(this.connections.values())
        .filter(conn => conn.state.isHealthy);
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const connection of targetConnections) {
      try {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify(broadcastMessage));
          connection.stats.messagesSent++;
          sent++;
          
          // Track ACKs if required
          if (requiresAck) {
            this.trackPendingAck(messageId, connection.id, timeout);
          }
        } else {
          failed++;
          connection.state.isHealthy = false;
        }
      } catch (error) {
        console.error(`Failed to send to ${connection.id}:`, error);
        failed++;
        connection.state.consecutiveFailures++;
      }
    }
    
    this.metrics.totalMessages++;
    
    return {
      messageId: messageId,
      sent: sent,
      failed: failed,
      targetType: type || 'all'
    };
  }
  
  sendDirect(connection, message, options = {}) {
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const messageId = `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const directMessage = {
      ...message,
      _meta: {
        id: messageId,
        timestamp: Date.now(),
        direct: true
      }
    };
    
    try {
      connection.ws.send(JSON.stringify(directMessage));
      connection.stats.messagesSent++;
      return true;
    } catch (error) {
      console.error(`Direct send failed to ${connection.id}:`, error);
      connection.state.consecutiveFailures++;
      return false;
    }
  }
  
  trackPendingAck(messageId, connectionId, timeout) {
    const ackTimer = setTimeout(() => {
      console.warn(`⚠️ ACK timeout for message ${messageId} from ${connectionId}`);
      this.pendingAcks.delete(messageId);
      this.metrics.failureCount++;
    }, timeout);
    
    this.pendingAcks.set(messageId, {
      connectionId: connectionId,
      timer: ackTimer,
      timestamp: Date.now()
    });
  }
  
  handleAck(messageId, connectionId) {
    const pending = this.pendingAcks.get(messageId);
    if (pending && pending.connectionId === connectionId) {
      clearTimeout(pending.timer);
      this.pendingAcks.delete(messageId);
      
      // Update metrics
      const latency = Date.now() - pending.timestamp;
      this.updateLatencyMetrics(latency);
      
      return true;
    }
    return false;
  }
  
  updateLatencyMetrics(latency) {
    // Exponential moving average
    const alpha = 0.1;
    this.metrics.averageLatency = this.metrics.averageLatency * (1 - alpha) + latency * alpha;
  }
  
  getStatistics() {
    const connectionsByType = {};
    for (const [type, connections] of Object.entries(this.connectionTypes)) {
      connectionsByType[type] = connections.size;
    }
    
    return {
      connections: {
        total: this.connections.size,
        byType: connectionsByType,
        healthy: Array.from(this.connections.values()).filter(c => c.state.isHealthy).length
      },
      performance: {
        messagesPerSecond: this.metrics.messagesPerSecond,
        averageLatency: Math.round(this.metrics.averageLatency * 100) / 100,
        successRate: this.calculateSuccessRate(),
        totalMessages: this.metrics.totalMessages
      },
      queues: {
        pending: this.messageQueue.length,
        pendingAcks: this.pendingAcks.size,
        totalQueued: this.messageQueue.length + this.pendingAcks.size
      },
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures
      }
    };
  }
  
  calculateSuccessRate() {
    if (this.metrics.totalMessages === 0) return 100;
    const successRate = ((this.metrics.totalMessages - this.metrics.failureCount) / this.metrics.totalMessages) * 100;
    return Math.round(successRate * 100) / 100;
  }
  
  startMetricsCollection() {
    let lastMessageCount = 0;
    
    setInterval(() => {
      const currentMessages = this.metrics.totalMessages;
      this.metrics.messagesPerSecond = (currentMessages - lastMessageCount) / (this.options.metricsInterval / 1000);
      lastMessageCount = currentMessages;
      
      // Update success rate
      this.metrics.successRate = this.calculateSuccessRate();
      
    }, this.options.metricsInterval);
  }
  
  shutdown() {
    console.log('🛑 Shutting down Advanced WebSocket Broadcasting System...');
    
    // Clear all timers
    for (const [messageId, pending] of this.pendingAcks) {
      clearTimeout(pending.timer);
    }
    
    // Close all connections
    for (const connection of this.connections.values()) {
      try {
        connection.ws.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
    
    this.connections.clear();
    this.pendingAcks.clear();
    this.messageQueue = [];
    
    console.log('✅ Advanced WebSocket Broadcasting System shutdown complete');
  }
}

module.exports = AdvancedWebSocketBroadcastSystem;
```

---

### 5. ENVIRONMENT TEMPLATE: `.env.example`

```bash
# ===================================
# OGZ PRIME ENVIRONMENT CONFIGURATION
# ===================================

NODE_ENV=development
PORT=3010

# ===================================
# API KEYS (GET YOUR OWN FROM PROVIDERS)
# ===================================

# Stripe Payment Processing
# Get from: https://dashboard.stripe.com/
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Polygon.io Market Data (FREE TIER AVAILABLE)
# Get from: https://polygon.io/
POLYGON_API_KEY=your_polygon_api_key_here

# Alpha Vantage Backup Data (FREE TIER AVAILABLE)  
# Get from: https://www.alphavantage.co/
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# ===================================
# WEBSOCKET CONFIGURATION
# ===================================
WS_HOST=localhost
WS_PORT=3010
WS_PATH=/ws

# ===================================
# TRADING BOT SETTINGS
# ===================================
TRADING_MODE=PAPER
STARTING_BALANCE=10000
MAX_DRAWDOWN=15
RISK_PER_TRADE=2

# ===================================
# SECURITY
# ===================================
JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
```

---

### 6. PACKAGE.JSON DEPENDENCIES

```json
{
  "name": "ogz-prime-websocket-system",
  "version": "1.0.0",
  "description": "OGZ Prime Trading Bot WebSocket System",
  "main": "ogzprime_ssl_server_advanced.js",
  "scripts": {
    "start": "node ogzprime_ssl_server_advanced.js",
    "bot": "node run-trading-bot-v13-simplified.js",
    "test": "node test-websocket-client.js",
    "dev": "nodemon ogzprime_ssl_server_advanced.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "stripe": "^14.25.0",
    "node-fetch": "^2.7.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🚨 CRITICAL ISSUES TO FIX

### **ISSUE #1: Missing WebSocketConfig.js**
The bot tries to import `./core/WebSocketConfig.js` but it doesn't exist. Create the file above.

### **ISSUE #2: Connection Instability**
The bot loses connection and doesn't reconnect properly. The robust reconnection logic is implemented but needs testing.

### **ISSUE #3: Message Processing Crashes**
JSON parsing errors can crash the connection. The error handling is improved but verify it works.

### **ISSUE #4: Port Confusion**
Everything should use port 3010. Check all configurations match.

---

## 🎯 TESTING INSTRUCTIONS

### **STEP 1: Install Dependencies**
```bash
npm install
```

### **STEP 2: Set Up Environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

### **STEP 3: Start Server**
```bash
npm start
```

### **STEP 4: Start Bot**
```bash
npm run bot
```

### **STEP 5: Expected Output**
```
🚀 OGZ Prime SSL Server with ADVANCED BROADCASTING SYSTEM
🌐 HTTP API Server running on port 3010
🤖 TRADING BOT IDENTIFIED!
✅ Bot identification confirmed
💰 PRICE UPDATE: BTC-USD $97543.21
📡 Price broadcast: BTC-USD $97543.21 to 1 clients
```

---

## ✅ SUCCESS CRITERIA

**WEBSOCKET SYSTEM IS FIXED WHEN:**
1. ✅ Server starts without errors
2. ✅ Bot connects and stays connected  
3. ✅ Real-time price data flows server → bot
4. ✅ Bot sends ACK messages back
5. ✅ Connection survives interruptions
6. ✅ Dashboard receives live updates
7. ✅ No crashes from malformed messages

---

**DEVELOPER NOTES:**
- Get FREE API keys from Polygon.io and Alpha Vantage
- Use Stripe test keys for payment testing
- Focus on WebSocket stability first
- All the source code is provided - debug and fix!

**END OF COMPLETE SOURCE CODE HANDOFF**
