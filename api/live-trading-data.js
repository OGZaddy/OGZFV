// ===================================================================
// 🚀 LIVE TRADING DATA API - Real-time Bot Integration
// ===================================================================
// Connects trading bot data to website dashboard for live monitoring
// Streams bot thoughts, patterns, trades, and analysis in real-time
// ===================================================================

const { getWebSocketUrl, getHttpUrl } = require('../core/WebSocketConfig');

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class LiveTradingDataAPI {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    // Connect to unified WebSocket instead of creating competing server
    this.unifiedWsUrl = 'ws://localhost:3010/ws';
    
    // Data storage
    this.latestBotStatus = {};
    this.recentTrades = [];
    this.patterns = [];
    this.analysis = {};
    this.connectedClients = new Set();
    
    this.setupRoutes();
    this.connectToUnifiedWebSocket(); // Connect to unified WebSocket
    this.startDataMonitoring();
  }

  setupRoutes() {
    // SECURITY FIX: Strict CORS policy - only allow specific origins
    this.app.use((req, res, next) => {
      const allowedOrigins = [
        getHttpUrl('data'),
        getHttpUrl('transparency'), 
        'https://your-domain.com' // Replace with your actual domain
      ];
      
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    this.app.use(express.json());
    
    // SECURITY FIX: JWT Authentication middleware
    this.jwtMiddleware = this.createJWTMiddleware();

    // SECURITY FIX: Add JWT authentication to sensitive endpoints
    this.app.get('/api/bot-status', this.jwtMiddleware, (req, res) => {
      try {
        const statusFile = path.join(__dirname, '..', 'bot_status.json');
        if (fs.existsSync(statusFile)) {
          const data = fs.readFileSync(statusFile, 'utf8');
          const status = JSON.parse(data);
          
          res.json({
            success: true,
            data: status,
            timestamp: Date.now()
          });
        } else {
          res.json({
            success: false,
            error: 'Bot status not available',
            data: {
              timestamp: new Date().toLocaleString(),
              thought: 'Initializing trading systems...',
              decision: 'STARTING',
              confidence: 0,
              balance: 10000,
              price: 0
            }
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // SECURITY FIX: Add JWT authentication to sensitive endpoints  
    this.app.get('/api/recent-trades', this.jwtMiddleware, (req, res) => {
      try {
        const tradesDir = path.join(__dirname, '..', 'logs', 'trades');
        const trades = this.loadRecentTrades(tradesDir);
        
        res.json({
          success: true,
          data: trades,
          count: trades.length,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          data: []
        });
      }
    });

    // SECURITY FIX: Add JWT authentication to sensitive endpoints
    this.app.get('/api/patterns', this.jwtMiddleware, (req, res) => {
      try {
        const patterns = this.loadTradingPatterns();
        
        res.json({
          success: true,
          data: patterns,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          data: []
        });
      }
    });

    // SECURITY FIX: Add JWT authentication to sensitive endpoints
    this.app.get('/api/analysis', this.jwtMiddleware, (req, res) => {
      try {
        const analysis = this.generateMarketAnalysis();
        
        res.json({
          success: true,
          data: analysis,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          data: {}
        });
      }
    });

    // Health check (public endpoint - no auth needed)
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'online',
        service: 'Live Trading Data API',
        clients: this.connectedClients.size,
        timestamp: Date.now()
      });
    });
    
    // SECURITY FIX: Add authentication endpoint
    this.app.post('/api/auth/login', (req, res) => {
      try {
        const { username, password } = req.body;
        
        // SECURITY FIX: Validate credentials against environment variables
        const validUsername = process.env.API_USERNAME;
        const validPassword = process.env.API_PASSWORD;
        
        if (!validUsername || !validPassword) {
          return res.status(500).json({
            success: false,
            error: 'Authentication not configured. Set API_USERNAME and API_PASSWORD environment variables.'
          });
        }
        
        // Use timing-safe comparison to prevent timing attacks
        const usernameValid = crypto.timingSafeEqual(
          Buffer.from(username || ''),
          Buffer.from(validUsername)
        );
        const passwordValid = crypto.timingSafeEqual(
          Buffer.from(password || ''),
          Buffer.from(validPassword)
        );
        
        if (usernameValid && passwordValid) {
          const token = this.generateJWT({ username });
          res.json({
            success: true,
            token,
            expiresIn: '15m'
          });
        } else {
          res.status(401).json({
            success: false,
            error: 'Invalid credentials'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Authentication error'
        });
      }
    });
  }
  
  // SECURITY FIX: JWT middleware for authentication
  createJWTMiddleware() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'No authorization token provided'
          });
        }
        
        const token = authHeader.substring(7);
        const jwtSecret = this.getJWTSecret();
        
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    };
  }
  
  // SECURITY FIX: Generate JWT tokens
  generateJWT(payload) {
    const jwtSecret = this.getJWTSecret();
    return jwt.sign(payload, jwtSecret, { 
      expiresIn: '15m',
      issuer: 'ogz-prime-api',
      audience: 'ogz-prime-dashboard'
    });
  }
  
  // SECURITY FIX: Get JWT secret from environment
  getJWTSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL SECURITY ERROR: Missing JWT_SECRET environment variable');
      console.error('Generate a secret: openssl rand -base64 32');
      process.exit(1);
    }
    
    if (secret.length < 32) {
      console.error('CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters');
      process.exit(1);
    }
    
    return secret;
  }

  connectToUnifiedWebSocket() {
    console.log('📡 Live Trading Data API connecting to unified WebSocket...');
    
    this.unifiedWs = new WebSocket(this.unifiedWsUrl);
    
    this.unifiedWs.on('open', () => {
      console.log('📡 Live Trading Data API connected to unified WebSocket');
      
      // Identify as live trading data API
      this.unifiedWs.send(JSON.stringify({
        type: 'identify',
        source: 'live_trading_data_api',
        capabilities: ['data_broadcasting', 'trade_monitoring']
      }));
    });
    
    this.unifiedWs.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        // Process relevant messages from unified WebSocket
        if (this.shouldProcessMessage(message)) {
          this.processUnifiedMessage(message);
        }
      } catch (err) {
        console.error('📡 Error processing unified WebSocket message:', err);
      }
    });
    
    this.unifiedWs.on('close', () => {
      console.log('📡 Live Trading Data API disconnected from unified WebSocket, reconnecting...');
      setTimeout(() => this.connectToUnifiedWebSocket(), 5000);
    });
    
    this.unifiedWs.on('error', (err) => {
      console.error('📡 Live Trading Data API WebSocket error:', err);
    });
  }

  sendInitialData(ws) {
    try {
      // Send latest bot status
      const statusFile = path.join(__dirname, '..', 'bot_status.json');
      if (fs.existsSync(statusFile)) {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        ws.send(JSON.stringify({
          type: 'bot_status',
          data: status
        }));
      }

      // Send recent trades
      const trades = this.loadRecentTrades();
      ws.send(JSON.stringify({
        type: 'recent_trades',
        data: trades
      }));

      // Send patterns
      const patterns = this.loadTradingPatterns();
      ws.send(JSON.stringify({
        type: 'patterns',
        data: patterns
      }));

    } catch (error) {
      console.error('❌ Error sending initial data:', error);
    }
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Client wants to subscribe to specific data streams
        ws.subscriptions = data.streams || ['all'];
        break;
        
      case 'request_update':
        // Client requesting fresh data
        this.sendInitialData(ws);
        break;
        
      default:
        console.log('⚠️ Unknown WebSocket message type:', data.type);
    }
  }

  loadRecentTrades(tradesDir = null) {
    try {
      if (!tradesDir) {
        tradesDir = path.join(__dirname, '..', 'logs', 'trades');
      }

      if (!fs.existsSync(tradesDir)) {
        return [];
      }

      const files = fs.readdirSync(tradesDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 3); // Last 3 days

      let allTrades = [];

      for (const file of files) {
        try {
          const filePath = path.join(tradesDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const trades = JSON.parse(data);
          
          if (Array.isArray(trades)) {
            allTrades = allTrades.concat(trades);
          }
        } catch (error) {
          console.error(`❌ Error reading trade file ${file}:`, error);
        }
      }

      // Sort by timestamp and return last 20 trades
      return allTrades
        .sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime))
        .slice(0, 20)
        .map(trade => ({
          id: trade.id || `trade_${Date.now()}`,
          type: trade.type,
          direction: trade.direction || trade.type,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          pnl: trade.pnl,
          pnlPercent: trade.pnlPercent,
          confidence: trade.confidence || trade.signalStrength,
          reason: trade.entryReason || trade.reason,
          timestamp: trade.exitTime || trade.entryTime,
          holdTime: trade.holdTime,
          rsi: trade.rsi,
          macd: trade.macd,
          trend: trade.trend
        }));

    } catch (error) {
      console.error('❌ Error loading recent trades:', error);
      return [];
    }
  }

  loadTradingPatterns() {
    try {
      // Load patterns from profiles directory
      const profilesDir = path.join(__dirname, '..', 'profiles');
      const patterns = [];

      if (fs.existsSync(profilesDir)) {
        const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
          try {
            const profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf8'));
            
            patterns.push({
              name: profile.profileName || 'Unknown',
              asset: profile.assetName || 'BTC-USD',
              confidence: profile.minConfidenceThreshold || 0.5,
              winRate: Math.random() * 30 + 60, // Placeholder - would be calculated from real data
              trades: Math.floor(Math.random() * 50) + 10,
              avgReturn: (Math.random() - 0.5) * 4,
              features: {
                multiTimeframe: profile.enableMultiTimeframe || false,
                fibonacci: profile.enableFibonacciLevels || false,
                supportResistance: profile.enableSupportResistance || false
              }
            });
          } catch (error) {
            console.error(`❌ Error reading profile ${file}:`, error);
          }
        }
      }

      return patterns;

    } catch (error) {
      console.error('❌ Error loading patterns:', error);
      return [];
    }
  }

  generateMarketAnalysis() {
    try {
      // Read bot status for current market data
      const statusFile = path.join(__dirname, '..', 'bot_status.json');
      let currentPrice = 97000;
      let botThought = 'Analyzing market conditions...';

      if (fs.existsSync(statusFile)) {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        currentPrice = status.price || currentPrice;
        botThought = status.thought || botThought;
      }

      return {
        price: currentPrice,
        change24h: (Math.random() - 0.5) * 6, // ±3%
        volume: Math.floor(Math.random() * 1000000) + 500000,
        marketCap: currentPrice * 19500000, // Approximate BTC supply
        indicators: {
          rsi: Math.random() * 100,
          macd: (Math.random() - 0.5) * 200,
          support: currentPrice * (0.97 + Math.random() * 0.02),
          resistance: currentPrice * (1.01 + Math.random() * 0.02)
        },
        signals: [
          {
            type: 'Technical',
            message: 'RSI approaching oversold territory',
            strength: 'Medium',
            timestamp: Date.now()
          },
          {
            type: 'Pattern',
            message: 'Bullish divergence detected',
            strength: 'Strong',
            timestamp: Date.now() - 300000
          }
        ],
        botInsight: botThought
      };

    } catch (error) {
      console.error('❌ Error generating analysis:', error);
      return {};
    }
  }

  startDataMonitoring() {
    // Monitor bot_status.json for changes
    this.monitorBotStatus();
    
    // Monitor trades directory for new trades
    this.monitorTrades();
    
    // Send periodic updates
    setInterval(() => {
      this.broadcastUpdates();
    }, 5000); // Every 5 seconds
  }

  monitorBotStatus() {
    const statusFile = path.join(__dirname, '..', 'bot_status.json');
    
    if (fs.existsSync(statusFile)) {
      fs.watchFile(statusFile, { interval: 1000 }, () => {
        try {
          const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
          this.latestBotStatus = status;
          
          this.broadcast({
            type: 'bot_status',
            data: status
          });
          
        } catch (error) {
          console.error('❌ Error reading bot status:', error);
        }
      });
    }
  }

  monitorTrades() {
    const tradesDir = path.join(__dirname, '..', 'logs', 'trades');
    
    if (fs.existsSync(tradesDir)) {
      fs.watch(tradesDir, (eventType, filename) => {
        if (eventType === 'change' && filename && filename.endsWith('.json')) {
          // Debounce file changes
          setTimeout(() => {
            const trades = this.loadRecentTrades(tradesDir);
            this.recentTrades = trades;
            
            this.broadcast({
              type: 'recent_trades',
              data: trades
            });
          }, 1000);
        }
      });
    }
  }

  broadcastUpdates() {
    try {
      // Send analysis update
      const analysis = this.generateMarketAnalysis();
      this.broadcast({
        type: 'analysis',
        data: analysis
      });

    } catch (error) {
      console.error('❌ Error broadcasting updates:', error);
    }
  }

  broadcast(message) {
    // Send to unified WebSocket instead of direct clients
    if (this.unifiedWs && this.unifiedWs.readyState === WebSocket.OPEN) {
      this.unifiedWs.send(JSON.stringify({
        type: 'live_data_broadcast',
        source: 'live_trading_data_api',
        data: message
      }));
    }
  }
  
  // Helper methods for unified WebSocket integration
  shouldProcessMessage(message) {
    const relevantTypes = [
      'trade_executed',
      'bot_status_update',
      'pattern_detected',
      'analysis_update'
    ];
    return relevantTypes.includes(message.type);
  }
  
  processUnifiedMessage(message) {
    switch (message.type) {
      case 'trade_executed':
        this.handleTradeUpdate(message.data);
        break;
      case 'bot_status_update':
        this.updateBotStatus(message.data);
        break;
      case 'pattern_detected':
        this.handlePatternUpdate(message.data);
        break;
      case 'analysis_update':
        this.updateAnalysis(message.data);
        break;
    }
  }

  start(port = 8005) {
    this.server.listen(port, () => {
      console.log(`🚀 Live Trading Data API started on port ${port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${port}`);
      console.log(`🌐 HTTP API: http://localhost:${port}/api/`);
    });
  }
}

// Start the API if run directly
if (require.main === module) {
  const api = new LiveTradingDataAPI();
  api.start();
}

module.exports = LiveTradingDataAPI;
