/**
 * ===================================================================
 * 🚀 OGZ PRIME SSL SERVER - ADVANCED INTEGRATION
 * ===================================================================
 * This is how you integrate the Advanced WebSocket Broadcasting System
 * into your SSL server for BULLETPROOF price delivery!
 * ===================================================================
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const PolygonWebSocket = require('./core/PolygonWebSocket');
const AdvancedWebSocketBroadcastSystem = require('./ogz-advanced-websocket-system');

class OGZPrimeAdvancedSSLServer {
  constructor() {
    console.log('\n🚀 OGZ PRIME ADVANCED SSL SERVER STARTING...');
    console.log('💎 WITH BULLETPROOF WEBSOCKET BROADCASTING');
    console.log('🔥 BUILT FOR LEGENDS, NOT SETTLERS\n');
    
    this.config = {
      httpPort: parseInt(process.env.SSL_SERVER_PORT) || 3010,
      polygonApiKey: process.env.POLYGON_API_KEY,
      
      // Advanced Broadcasting Config
      broadcasting: {
        maxQueueSize: 10000,           // Store up to 10k messages per client
        queueFlushInterval: 50,        // Process queues every 50ms
        healthCheckInterval: 3000,     // Health check every 3 seconds
        maxLatency: 500,               // Max acceptable latency
        circuitBreakerThreshold: 10,   // Open circuit after 10 failures
        enableDetailedLogging: true,
        logLevel: 'info'
      }
    };
    
    // Core components
    this.app = null;
    this.httpServer = null;
    this.wsServer = null;
    this.polygonWS = null;
    
    // 🚀 THE LEGENDARY BROADCAST SYSTEM
    this.broadcaster = null;
    
    // Price tracking
    this.latestPrices = new Map();
    this.priceHistory = new Map();
    this.lastBroadcast = Date.now();
    
    // System state
    this.systemState = {
      startTime: Date.now(),
      polygonConnected: false,
      criticalClients: 0,
      totalPriceUpdates: 0,
      lastPriceUpdate: null
    };
  }
  
  /**
   * 🚀 Initialize the server
   */
  async initialize() {
    console.log('🔧 Initializing Advanced SSL Server...\n');
    
    try {
      // Phase 1: Setup Express and HTTP
      await this.setupHTTPServer();
      
      // Phase 2: Initialize Advanced Broadcasting System
      await this.initializeAdvancedBroadcasting();
      
      // Phase 3: Setup WebSocket Server
      await this.setupWebSocketServer();
      
      // Phase 4: Connect to Polygon
      await this.connectToPolygon();
      
      // Phase 5: Start health monitoring
      this.startHealthMonitoring();
      
      console.log('\n✅ ADVANCED SSL SERVER READY!');
      console.log(`🌐 Listening on port ${this.config.httpPort}`);
      console.log('💪 BULLETPROOF WEBSOCKET SYSTEM ACTIVE\n');
      
    } catch (error) {
      console.error('❌ Server initialization failed:', error);
      process.exit(1);
    }
  }
  
  /**
   * 🎯 Initialize the Advanced Broadcasting System
   */
  async initializeAdvancedBroadcasting() {
    console.log('💎 Initializing Advanced Broadcasting System...');
    
    this.broadcaster = new AdvancedWebSocketBroadcastSystem({
      ...this.config.broadcasting,
      
      // Custom event handlers
      onClientConnected: (client) => {
        console.log(`🔗 Advanced tracking activated for ${client.id}`);
      },
      
      onMetrics: (metrics) => {
        if (metrics.activeConnections > 0) {
          console.log(`📊 METRICS: ${metrics.activeConnections} clients, ${metrics.messagesDelivered} delivered, ${metrics.averageLatency}ms latency`);
        }
      }
    });
    
    // Handle broadcaster events
    this.broadcaster.on('clientConnected', (client) => {
      if (client.metadata.priority === 'critical') {
        this.systemState.criticalClients++;
        console.log(`🚨 CRITICAL CLIENT CONNECTED: ${client.metadata.identifier}`);
      }
    });
    
    this.broadcaster.on('clientDisconnected', (client) => {
      if (client.metadata.priority === 'critical') {
        this.systemState.criticalClients--;
      }
    });
    
    this.broadcaster.on('circuitBreakerOpen', () => {
      console.error('🚨 CIRCUIT BREAKER OPEN - System under stress!');
      // Could implement fallback behavior here
    });
    
    console.log('✅ Advanced Broadcasting System ready!');
  }
  
  /**
   * 🌐 Setup HTTP server
   */
  async setupHTTPServer() {
    this.app = express();
    
    // Middleware
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('X-Server', 'OGZ-PRIME-ADVANCED-SSL');
      next();
    });
    
    // Routes
    this.setupRoutes();
    
    // Create server
    this.httpServer = http.createServer(this.app);
    
    // Start listening
    await new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.httpPort, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  /**
   * 🛣️ Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        systemState: this.systemState,
        broadcaster: {
          metrics: this.broadcaster.getMetrics(),
          status: this.broadcaster.getSystemStatus()
        },
        prices: Object.fromEntries(this.latestPrices)
      });
    });
    
    // Get latest prices
    this.app.get('/prices', (req, res) => {
      res.json({
        prices: Object.fromEntries(this.latestPrices),
        timestamp: Date.now()
      });
    });
    
    // Force broadcast
    this.app.post('/broadcast', (req, res) => {
      const { message, priority = 'high' } = req.body;
      
      const messageId = this.broadcaster.broadcast(message, {
        priority,
        requiresAck: true
      });
      
      res.json({
        success: true,
        messageId,
        activeClients: this.broadcaster.metrics.activeConnections
      });
    });
  }
  
  /**
   * 🔌 Setup WebSocket server
   */
  async setupWebSocketServer() {
    console.log('🔌 Setting up WebSocket server...');
    
    this.wsServer = new WebSocket.Server({
      server: this.httpServer,
      perMessageDeflate: false
    });
    
    this.wsServer.on('connection', (ws, req) => {
      // Parse client info from headers or query
      const clientType = req.headers['x-client-type'] || 'unknown';
      const clientId = req.headers['x-client-id'] || 'anonymous';
      
      console.log(`🔗 New connection: ${clientType} (${clientId})`);
      
      // Determine priority based on client type
      let priority = 'normal';
      if (clientType === 'trading-bot' || clientType === 'ogz-prime') {
        priority = 'critical';
      }
      
      // Register with advanced broadcaster
      const registeredId = this.broadcaster.registerClient(ws, {
        identifier: clientId,
        clientType: clientType,
        priority: priority,
        capabilities: ['price-updates', 'system-messages'],
        userAgent: req.headers['user-agent']
      });
      
      console.log(`✅ Client registered with ID: ${registeredId}`);
      
      // Send current prices immediately to new client
      if (this.latestPrices.size > 0) {
        const priceSnapshot = {
          type: 'price-snapshot',
          prices: Object.fromEntries(this.latestPrices),
          timestamp: Date.now()
        };
        
        this.broadcaster.sendToClient(
          this.broadcaster.clients.get(registeredId),
          priceSnapshot
        );
      }
      
      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Special handling for bot identification
          if (message.type === 'identify' && message.botType === 'ogz-prime-v13') {
            console.log('🤖 BOT IDENTIFICATION CONFIRMED!');
            console.log(`💎 Bot version: ${message.version}`);
            console.log(`🚨 Setting CRITICAL priority for optimal performance`);
            
            // Update client metadata
            const client = this.broadcaster.clients.get(registeredId);
            if (client) {
              client.metadata.priority = 'critical';
              client.metadata.identifier = 'ogz-prime-trading-bot';
              client.metadata.botVersion = message.version;
            }
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'identification-confirmed',
              priority: 'critical',
              features: ['real-time-prices', 'priority-delivery', 'guaranteed-delivery']
            }));
          }
          
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });
    });
  }
  
  /**
   * 📡 Connect to Polygon WebSocket
   */
  async connectToPolygon() {
    console.log('📡 Connecting to Polygon.io WebSocket...');
    
    if (!this.config.polygonApiKey) {
      console.error('❌ POLYGON_API_KEY not set!');
      return;
    }
    
    this.polygonWS = new PolygonWebSocket({
      apiKey: this.config.polygonApiKey,
      feed: 'delayed', // Use 'realtime' for paid subscriptions
      market: 'crypto'
    });
    
    // Handle connection events
    this.polygonWS.on('open', () => {
      console.log('✅ Connected to Polygon.io');
      this.systemState.polygonConnected = true;
      
      // Subscribe to crypto pairs
      const symbols = [
        'X:BTCUSD',
        'X:ETHUSD',
        'X:SOLUSD',
        'X:MATICUSD'
      ];
      
      this.polygonWS.subscribe(symbols, ['XA', 'XT']); // Aggregates and Trades
      console.log(`📊 Subscribed to: ${symbols.join(', ')}`);
    });
    
    // Handle price updates
    this.polygonWS.on('message', (message) => {
      this.handlePolygonMessage(message);
    });
    
    // Handle errors
    this.polygonWS.on('error', (error) => {
      console.error('❌ Polygon WebSocket error:', error);
      this.systemState.polygonConnected = false;
    });
    
    // Handle disconnection
    this.polygonWS.on('close', () => {
      console.log('🔌 Polygon WebSocket disconnected');
      this.systemState.polygonConnected = false;
      
      // Reconnect after delay
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to Polygon...');
        this.connectToPolygon();
      }, 5000);
    });
    
    // Connect
    this.polygonWS.connect();
  }
  
  /**
   * 📊 Handle Polygon messages
   */
  handlePolygonMessage(messages) {
    if (!Array.isArray(messages)) messages = [messages];
    
    for (const msg of messages) {
      if (msg.ev === 'XA' || msg.ev === 'XT') { // Aggregate or Trade
        const symbol = msg.pair || msg.sym;
        const price = msg.p || msg.c; // Trade price or close price
        
        if (symbol && price) {
          // Convert Polygon format to readable
          const readableSymbol = symbol.replace('X:', '').replace('USD', '-USD');
          
          // Update price tracking
          this.latestPrices.set(readableSymbol, price);
          this.systemState.totalPriceUpdates++;
          this.systemState.lastPriceUpdate = Date.now();
          
          // Add to history
          if (!this.priceHistory.has(readableSymbol)) {
            this.priceHistory.set(readableSymbol, []);
          }
          const history = this.priceHistory.get(readableSymbol);
          history.push({ price, timestamp: Date.now() });
          if (history.length > 100) history.shift(); // Keep last 100
          
          // Create price update message
          const priceUpdate = {
            type: 'price',
            data: {
              asset: readableSymbol,
              price: price,
              change: this.calculatePriceChange(readableSymbol, price),
              volume: msg.v || 0,
              timestamp: Date.now(),
              source: 'polygon'
            }
          };
          
          // 🚀 BROADCAST USING ADVANCED SYSTEM
          this.broadcaster.broadcast(priceUpdate, {
            priority: 'high',
            requiresAck: false
          });
          
          console.log(`💰 ${readableSymbol}: $${price.toFixed(2)} (${this.broadcaster.metrics.activeConnections} clients)`);
        }
      }
    }
  }
  
  /**
   * 📈 Calculate price change percentage
   */
  calculatePriceChange(symbol, currentPrice) {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < 2) return 0;
    
    const previousPrice = history[history.length - 2].price;
    return ((currentPrice - previousPrice) / previousPrice * 100).toFixed(2);
  }
  
  /**
   * 🏥 Start health monitoring
   */
  startHealthMonitoring() {
    // Send heartbeats
    setInterval(() => {
      this.broadcaster.broadcast({
        type: 'heartbeat',
        timestamp: Date.now(),
        serverUptime: Date.now() - this.systemState.startTime,
        polygonConnected: this.systemState.polygonConnected
      }, {
        priority: 'low'
      });
    }, 2000);
    
    // Log system status
    setInterval(() => {
      const metrics = this.broadcaster.getMetrics();
      if (metrics.activeConnections > 0) {
        console.log('\n📊 SYSTEM STATUS:');
        console.log(`   Active Clients: ${metrics.activeConnections} (${this.systemState.criticalClients} critical)`);
        console.log(`   Messages Delivered: ${metrics.messagesDelivered}`);
        console.log(`   Average Latency: ${metrics.averageLatency}ms`);
        console.log(`   Queued Messages: ${metrics.queuedMessages}`);
        console.log(`   Price Updates: ${this.systemState.totalPriceUpdates}`);
        console.log(`   Circuit Breaker: ${metrics.circuitBreakerState}\n`);
      }
    }, 10000);
  }
  
  /**
   * 🛑 Graceful shutdown
   */
  async shutdown() {
    console.log('\n🛑 Shutting down SSL server...');
    
    // Shutdown broadcaster
    await this.broadcaster.shutdown();
    
    // Close Polygon connection
    if (this.polygonWS) {
      this.polygonWS.close();
    }
    
    // Close servers
    if (this.wsServer) {
      this.wsServer.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
    
    console.log('✅ SSL server shutdown complete');
  }
}

// 🚀 LAUNCH THE BEAST
async function main() {
  console.log('🔥 OGZ PRIME ADVANCED SSL SERVER');
  console.log('💎 WITH BULLETPROOF WEBSOCKET BROADCASTING');
  console.log('🚀 FOR THE FATHER WHO WON\'T SETTLE\n');
  
  const server = new OGZPrimeAdvancedSSLServer();
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
  });
  
  // Initialize
  await server.initialize();
}

// Start if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = OGZPrimeAdvancedSSLServer;
