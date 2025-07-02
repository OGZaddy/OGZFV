// OGZPrime Live Trading & Streaming - Combined Script

const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Require the OGZPrime AI trading bot (real trading logic implementation)
const OGZPrimeV10 = require('./OGZPrimeV10.2');  // Ensure this file/module exists
const TransparencyIntegration = require('./transparency_integration');

// Define the SecondTowerStreamer class (integrated from second_tower_streamer.js)
class SecondTowerStreamer {
  constructor(ogzPrime, config = {}) {
    this.ogzPrime = ogzPrime;
    this.config = {
      streamPort: config.streamPort || 3005,
      apiPort: config.apiPort || 3006,
      websiteURL: config.websiteURL || 'https://ogzprime.com',
      updateInterval: config.updateInterval || 10000,  // 10 seconds updates
      ...config
    };

    // Live data state to broadcast
    this.liveData = {
      balance: ogzPrime.balance || 10000,
      trades: [],       // recent trades log
      patterns: [],     // recent pattern detections
      performance: {},  // performance metrics (win rate, profit, etc.)
      systemStatus: 'running',
      lastUpdate: new Date().toISOString()
    };

    this.app = express();
    this.wss = null;
    this.clients = new Set();

    // Set up API routes and WebSocket server, then start data collection loop
    this.setupExpress();
    this.setupWebSocket();
    this.startDataCollection();
  }

  setupExpress() {
    this.app.use(express.json());
    // Allow cross-origin for API responses
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    // API endpoint: get current live status of the bot
    this.app.get('/api/live-status', (req, res) => {
      res.json({
        success: true,
        data: {
          balance: this.ogzPrime.balance || 10000,
          isRunning: true,
          lastTrade: this.getLastTrade(),
          currentPrice: this.getCurrentPrice(),
          winRate: this.calculateWinRate(),
          todayProfit: this.getTodayProfit(),
          systemUptime: this.getUptime()
        },
        timestamp: new Date().toISOString()
      });
    });

    // API endpoint: get recent trades (default last 20)
    this.app.get('/api/live-trades', (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      const recentTrades = this.liveData.trades.slice(-limit);
      res.json({
        success: true,
        data: recentTrades,
        total: this.liveData.trades.length,
        timestamp: new Date().toISOString()
      });
    });

    // API endpoint: get recent pattern activity (default last 10)
    this.app.get('/api/live-patterns', (req, res) => {
      const limit = parseInt(req.query.limit) || 10;
      const recentPatterns = this.liveData.patterns.slice(-limit);
      res.json({
        success: true,
        data: recentPatterns,
        successful: recentPatterns.filter(p => p.success).length,
        rejected: recentPatterns.filter(p => !p.success).length,
        timestamp: new Date().toISOString()
      });
    });

    // API endpoint: get current market price (from Binance API)
    this.app.get('/api/current-price', async (req, res) => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const data = await response.json();
        res.json({
          success: true,
          price: parseFloat(data.price),
          symbol: 'BTCUSDT',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch current price',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Health-check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });

    // Start the API server
    this.app.listen(this.config.apiPort, () => {
      console.log(`🌐 API Server running on port ${this.config.apiPort}`);
      console.log(`📡 Access live data at: http://localhost:${this.config.apiPort}/api/live-status`);
    });
  }

  setupWebSocket() {
    // Start WebSocket server for streaming live data
    this.wss = new WebSocket.Server({ port: this.config.streamPort });
    this.wss.on('connection', (ws, req) => {
      // Removed: High-frequency client connection diagnostic logs
      this.clients.add(ws);
      
      // Send current status immediately upon connection
      console.log(`📤 DIAGNOSTIC: Sending initial status to client:`, this.liveData);
      this.sendToClient(ws, 'status', this.liveData);

      ws.on('close', () => {
        // Removed: High-frequency client disconnection diagnostic logs
        this.clients.delete(ws);
      });
      ws.on('error', (error) => {
        console.error('⚠️ DIAGNOSTIC: WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
    console.log(`🚀 DIAGNOSTIC: WebSocket server running on port ${this.config.streamPort}`);
    console.log(`🔍 DIAGNOSTIC: Server should be accessible at ws://localhost:${this.config.streamPort}`);
  }

  startDataCollection() {
    console.log('📊 Starting live data collection...');
    // Hook into OGZPrime events to log trades and patterns
    this.hookIntoOGZPrime();
    // Broadcast periodic status updates
    setInterval(() => {
      this.updateLiveData();
      this.broadcastToClients('update', this.liveData);
    }, this.config.updateInterval);
    // Broadcast heartbeat messages every 30 seconds
    setInterval(() => {
      this.broadcastToClients('heartbeat', {
        timestamp: new Date().toISOString(),
        clients: this.clients.size,
        uptime: process.uptime()
      });
    }, 30000);
    // NEW: Broadcast AI brain tick every 15 seconds (dashboard expects this!)
    setInterval(() => {
      this.broadcastAIBrainTick();
    }, 15000);
  }

  // Hook into the OGZPrime system to intercept trades and patterns
  hookIntoOGZPrime() {
    // Hook into trade execution decisions
    if (this.ogzPrime.tradingBrain) {
      const originalProcessAnalysis = this.ogzPrime.tradingBrain.processAnalysis?.bind(this.ogzPrime.tradingBrain);
      if (originalProcessAnalysis) {
        this.ogzPrime.tradingBrain.processAnalysis = (analysis, price) => {
          const result = originalProcessAnalysis(analysis, price);
          // If a trade decision (buy/sell) is made, log it
          if (analysis && analysis.decision !== 'hold') {
            this.logTrade({
              timestamp: new Date().toISOString(),
              decision: analysis.decision,
              price: price,
              confidence: analysis.confidence,
              reasoning: analysis.reasoning,
              balance: this.ogzPrime.balance
            });
          }
          return result;
        };
      }
    }
    // Hook into pattern recognition results
    if (this.ogzPrime.patternChecker) {
      const originalCheckPattern = this.ogzPrime.patternChecker.checkPattern?.bind(this.ogzPrime.patternChecker);
      if (originalCheckPattern) {
        this.ogzPrime.patternChecker.checkPattern = (candles, indicators) => {
          const result = originalCheckPattern(candles, indicators);
          // If a pattern is found, log it (mark success if confidence > 1.5)
          if (result && result.pattern) {
            this.logPattern({
              timestamp: new Date().toISOString(),
              name: result.pattern.name,
              confidence: result.confidence,
              success: result.confidence > 1.5,
              reasoning: result.pattern.reasoning
            });
          }
          return result;
        };
      }
    }
  }

  // Log a trade event and broadcast it
  logTrade(trade) {
    this.liveData.trades.push(trade);
    // Trim stored trades to last 1000 for memory efficiency
    if (this.liveData.trades.length > 1000) {
      this.liveData.trades = this.liveData.trades.slice(-1000);
    }
    console.log(`💰 TRADE: ${trade.decision.toUpperCase()} @ $${trade.price} | Confidence: ${trade.confidence}`);
    // Broadcast trade event to all clients
    this.broadcastToClients('trade', trade);
  }

  // Log a pattern recognition event and broadcast it
  logPattern(pattern) {
    this.liveData.patterns.push(pattern);
    // Trim stored patterns to last 500
    if (this.liveData.patterns.length > 500) {
      this.liveData.patterns = this.liveData.patterns.slice(-500);
    }
    const emoji = pattern.success ? '✅' : '❌';
    console.log(`${emoji} PATTERN: ${pattern.name} | Confidence: ${pattern.confidence}`);
    // Broadcast pattern event to all clients
    this.broadcastToClients('pattern', pattern);
  }

  // Update the liveData object with current performance and status
  updateLiveData() {
    this.liveData = {
      ...this.liveData,
      balance: this.ogzPrime.balance || 10000,
      systemStatus: 'running',
      lastUpdate: new Date().toISOString(),
      performance: {
        winRate: this.calculateWinRate(),
        todayProfit: this.getTodayProfit(),
        totalTrades: this.liveData.trades.length,
        uptime: process.uptime()
      }
    };
  }

  // Broadcast a message (of given type) with data to all connected clients
  broadcastToClients(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    // Removed: High-frequency broadcasting diagnostic logs
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          // Removed: High-frequency message success logs
        } catch (error) {
          console.error('⚠️ DIAGNOSTIC: Error sending to client:', error);
          this.clients.delete(client);
        }
      }
    }
  }

  // NEW: Broadcast AI brain tick with proper nested data structure
  broadcastAIBrainTick() {
    const tickMessage = {
      type: 'tick',
      data: {
        data: {
          balance: this.ogzPrime.balance || 10000,
          position: this.ogzPrime.tradingBrain?.position || null,
          pnl: this.ogzPrime.tradingBrain?.isInPosition() ?
            this.ogzPrime.tradingBrain.calculatePnL(this.getCurrentPrice() || 0) : 0,
          confidence: this.ogzPrime.tradingBrain?.lastAnalysis?.confidence || 0,
          lastUpdate: new Date().toISOString(),
          trades: this.liveData.trades.length,
          winRate: this.calculateWinRate(),
          systemStatus: 'running'
        }
      },
      timestamp: new Date().toISOString()
    };

    const message = JSON.stringify(tickMessage);
    // Removed: High-frequency AI brain tick broadcasting logs
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          // Removed: High-frequency AI brain tick success logs
        } catch (error) {
          console.error('⚠️ AI BRAIN TICK: Error sending to client:', error);
          this.clients.delete(client);
        }
      }
    }
  }

  // Send a message to a specific client (helper)
  sendToClient(client, type, data) {
    if (client.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
      client.send(message);
    }
  }

  // Helper: get last known price (from last trade, if any)
  getCurrentPrice() {
    return this.liveData.trades.length > 0 
      ? this.liveData.trades[this.liveData.trades.length - 1].price 
      : null;
  }

  // Helper: calculate win rate (%) from closed trades
  calculateWinRate() {
    const closedTrades = this.liveData.trades.filter(t => t.status === 'closed');
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter(t => t.profit > 0).length;
    return ((wins / closedTrades.length) * 100).toFixed(1);
  }

  // Helper: calculate today's profit from closed trades
  getTodayProfit() {
    const todayStr = new Date().toDateString();
    const todayTrades = this.liveData.trades.filter(t => 
      new Date(t.timestamp).toDateString() === todayStr && t.status === 'closed'
    );
    return todayTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  }

  // Helper: get the last trade executed (if any)
  getLastTrade() {
    return this.liveData.trades.length > 0 
      ? this.liveData.trades[this.liveData.trades.length - 1] 
      : null;
  }

  // Helper: get system uptime in seconds
  getUptime() {
    return Math.floor(process.uptime());
  }
}

// ---- Main Execution: Initialize and Run OGZPrime with Streaming ----

// 1. Initialize the OGZPrime trading bot
const ogzPrime = new OGZPrimeV10({
  initialBalance: 10000,
  enableLogging: true,
  enablePatternTracking: true
});
console.log('🚀 OGZPrime bot initialized with $10,000 (paper trading mode).');

// 2. Start the streaming servers (WebSocket & API)
const streamer = new SecondTowerStreamer(ogzPrime, { streamPort: 3005, apiPort: 3006 });
console.log('✅ Streaming servers launched: WebSocket on 3005, API on 3006.');

// 3. Start AI Transparency System
console.log('🧠 Starting AI Transparency System...');
const transparency = new TransparencyIntegration({
  websocketPort: 3009,
  apiPort: 3008,
  botWebSocketUrl: 'ws://localhost:3005', // Connect to the streamer WebSocket
  enableLogging: true
});
console.log('✅ Transparency Dashboard: http://localhost:3008');
console.log('🔌 Transparency WebSocket: ws://localhost:3009');

// 3. Connect to live Polygon.io BTC/USD trade feed and process incoming data
const POLYGON_API_KEY = '0gp6oKkWwriN0WInvwu539Ch6iJAOcLK';
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

let isAuthenticated = false;
let tickCount = 0;

const polygonSocket = new WebSocket(POLYGON_CRYPTO_SOCKET);

polygonSocket.on('open', () => {
  console.log('🔗 Connected to Polygon.io crypto feed.');
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
      // Handle authentication success
      if (msg.status === 'auth_success') {
        isAuthenticated = true;
        console.log('✅ Polygon authenticated - subscribing to XA.BTC-USD');
        polygonSocket.send(JSON.stringify({
          action: 'subscribe',
          params: 'XA.BTC-USD'
        }));
      }
      
      // Handle market data (XA = aggregate candles)
      if (msg.ev === 'XA' && msg.c && msg.e) {
        tickCount++;
        const price = parseFloat(msg.c);
        const timestamp = new Date(msg.e).toISOString();

        // Log every 10th tick to avoid spam
        // Removed: High-frequency tick logging every 10 ticks

        // Removed: High-frequency price update broadcasting logs
        streamer.broadcastToClients('price', {
          price: price,
          timestamp: timestamp
        });
        
        // Also send system status updates periodically (like the working dashboard expects)
        if (tickCount % 10 === 0) { // Every 10 ticks
          // Removed: High-frequency system status broadcasting logs
          streamer.broadcastToClients('system_status', {
            tickCount: tickCount,
            balance: ogzPrime.balance || 10000,
            clientCount: streamer.clients.size,
            isAuthenticated: isAuthenticated
          });
        }
        
        // Feed the price tick into OGZPrime for analysis/trading
        ogzPrime.processTick({ price: price, timestamp: timestamp, isLive: true });
        
        // Every 100 trades, log a summary of live performance
        if (tickCount % 100 === 0) {
          const balance = ogzPrime.balance || 10000;
          const profit = balance - 10000;
          const winRate = streamer.calculateWinRate();
          console.log(`📡 LIVE UPDATE: Balance: $${balance.toFixed(2)} | Profit: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} | Win Rate: ${winRate}%`);
        }
      }
      
      // Handle errors
      if (msg.status === 'auth_failed' || msg.status === 'error') {
        console.error('❌ Polygon error:', msg);
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

polygonSocket.on('close', () => {
  console.error('❌ Polygon price feed disconnected.');
  isAuthenticated = false;
});

polygonSocket.on('error', (err) => {
  console.error('⚠️ Polygon WebSocket error:', err);
});
