#!/usr/bin/env node

// ============================================================================
// OGZ PRIME VALHALLA V12 - THE ULTIMATE TRADING MACHINE! 🎯🚀💎
// ============================================================================
// INTEGRATED SYSTEMS:
// ✅ OGZ Prime Bot - Core trading engine with fixed Kelly Criterion
// ✅ ML Learning System - Real-time pattern recognition & adaptation
// ✅ Correlation Analyzer - Multi-asset market intelligence
// ✅ Multi-Directional Trader - Long/Short/Hedge/Arbitrage execution
// ✅ Ultimate Trading System - The integration brain
// ✅ Hitch NLP - Natural language trading commands
// ✅ WebSocket Manager - Real-time data feeds
// ✅ SSL Security - Encrypted connections
//
// THIS IS THE FINAL BOSS VERSION! 💀⚡

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const EventEmitter = require('events');

// Import all core systems
const UltimateTradingSystem = require('./core/UltimateTradingSystem');
const CorrelationAnalyzer = require('./core/CorrelationAnalyzer');
const MultiDirectionalTrader = require('./core/MultiDirectionalTrader');
const LogLearningSystem = require('./core/LogLearningSystem');
const MLLogProcessor = require('./core/MLLogProcessor');

// SSL Configuration
const SSL_CONFIG = {
  key: fs.existsSync('./ssl/server.key') ? fs.readFileSync('./ssl/server.key') : null,
  cert: fs.existsSync('./ssl/server.crt') ? fs.readFileSync('./ssl/server.crt') : null
};

// System Configuration
const SYSTEM_CONFIG = {
  // Core settings
  name: 'OGZ PRIME VALHALLA V12',
  version: '12.0.0',
  
  // Server settings
  port: process.env.PORT || 8445,
  sslPort: process.env.SSL_PORT || 8446,
  enableSSL: SSL_CONFIG.key && SSL_CONFIG.cert,
  
  // Trading settings
  primaryAsset: 'BTC',
  enableLiveTrading: process.argv.includes('-live') || process.argv.includes('--live'),
  enableLearning: process.argv.includes('-learn') || process.argv.includes('--learning'),
  enableCorrelation: true,
  enableMultiDirectional: true,
  enableArbitrage: true,
  
  // Risk management
  maxSystemExposure: 0.8,
  emergencyStopLoss: 0.15,
  
  // Advanced features
  enableHitch: true,
  enableML: true,
  enableWebSockets: true,
  
  // Analysis intervals
  analysisInterval: 30000,    // 30 seconds
  rebalanceInterval: 300000,  // 5 minutes
  learningInterval: 60000,    // 1 minute
  
  // Logging
  enableAdvancedLogging: process.argv.includes('-log') || process.argv.includes('--logging'),
  logLevel: process.argv.includes('-debug') ? 'debug' : 'info'
};

class OGZPrimeV12System extends EventEmitter {
  constructor() {
    super();
    
    this.config = SYSTEM_CONFIG;
    this.isRunning = false;
    this.startTime = Date.now();
    
    // System components
    this.systems = {
      ultimate: null,
      correlation: null,
      multiDirectional: null,
      learning: null,
      mlProcessor: null,
      hitch: null,
      webSocketManager: null
    };
    
    // Express app
    this.app = express();
    this.server = null;
    this.sslServer = null;
    
    // WebSocket servers
    this.wsServer = null;
    this.wssServer = null;
    
    // System metrics
    this.metrics = {
      totalTrades: 0,
      profitableTrades: 0,
      totalPnL: 0,
      systemUptime: 0,
      analysisCount: 0,
      learningUpdates: 0,
      correlationSignals: 0,
      arbitrageExecutions: 0,
      hitchCommands: 0
    };
    
    // Status tracking
    this.status = {
      initialized: false,
      trading: false,
      learning: false,
      emergency: false,
      lastActivity: Date.now(),
      activeConnections: 0,
      systemHealth: 'excellent'
    };
    
    console.log('🚀 OGZ PRIME VALHALLA V12 INITIALIZING...');
    console.log('💎 THE ULTIMATE TRADING MACHINE!');
    
    this.initializeSystem();
  }
  
  /**
   * Initialize all system components
   */
  async initializeSystem() {
    console.log('\n🔧 INITIALIZING ALL SYSTEMS...\n');
    
    try {
      // Setup Express middleware
      this.setupExpressMiddleware();
      
      // Initialize ML Learning System
      if (this.config.enableLearning) {
        await this.initializeLearningSystem();
      }
      
      // Initialize Ultimate Trading System
      await this.initializeUltimateTradingSystem();
      
      // Initialize Hitch NLP System
      if (this.config.enableHitch) {
        await this.initializeHitchSystem();
      }
      
      // Setup API routes
      this.setupAPIRoutes();
      
      // Initialize WebSocket servers
      if (this.config.enableWebSockets) {
        await this.initializeWebSocketServers();
      }
      
      // Setup system event handlers
      this.setupSystemEventHandlers();
      
      this.status.initialized = true;
      console.log('\n✅ ALL SYSTEMS INITIALIZED SUCCESSFULLY!\n');
      
    } catch (error) {
      console.error('❌ System initialization failed:', error);
      process.exit(1);
    }
  }
  
  /**
   * Setup Express middleware
   */
  setupExpressMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      if (this.config.enableAdvancedLogging) {
        console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      }
      next();
    });
  }
  
  /**
   * Initialize ML Learning System
   */
  async initializeLearningSystem() {
    console.log('🧠 Initializing ML Learning System...');
    
    this.systems.mlProcessor = new MLLogProcessor({
      enableCompression: true,
      compressionRatio: 0.9,
      enableLearning: true,
      learningRate: 0.01
    });
    
    this.systems.learning = new LogLearningSystem({
      enableRealTimeLearning: true,
      adaptationRate: 0.02,
      minConfidenceThreshold: 0.7,
      enablePerformanceTracking: true
    });
    
    // Connect learning system to main bot
    this.systems.learning.on('adaptationRecommendation', (recommendation) => {
      console.log(`🧠 Learning Adaptation: ${recommendation.reason}`);
      this.handleLearningAdaptation(recommendation);
    });
    
    console.log('✅ ML Learning System initialized');
  }
  
  /**
   * Initialize Ultimate Trading System
   */
  async initializeUltimateTradingSystem() {
    console.log('🎯 Initializing Ultimate Trading System...');
    
    this.systems.ultimate = new UltimateTradingSystem({
      primaryAsset: this.config.primaryAsset,
      enableCorrelationAnalysis: this.config.enableCorrelation,
      enableMultiDirectional: this.config.enableMultiDirectional,
      enableLearning: this.config.enableLearning,
      analysisInterval: this.config.analysisInterval,
      rebalanceInterval: this.config.rebalanceInterval,
      maxSystemExposure: this.config.maxSystemExposure,
      emergencyStopLoss: this.config.emergencyStopLoss
    });
    
    // Connect external systems
    this.systems.ultimate.connectExternalSystems({
      learningSystem: this.systems.learning,
      mlProcessor: this.systems.mlProcessor
    });
    
    // Setup Ultimate Trading System events
    this.systems.ultimate.on('analysisComplete', (analysis) => {
      this.metrics.analysisCount++;
      this.handleAnalysisComplete(analysis);
    });
    
    this.systems.ultimate.on('positionOpened', (position) => {
      this.metrics.totalTrades++;
      this.handlePositionOpened(position);
    });
    
    this.systems.ultimate.on('positionClosed', (position) => {
      if (position.realizedPnL > 0) {
        this.metrics.profitableTrades++;
      }
      this.metrics.totalPnL += position.realizedPnL;
      this.handlePositionClosed(position);
    });
    
    this.systems.ultimate.on('arbitrageExecuted', (arbitrage) => {
      this.metrics.arbitrageExecutions++;
      this.handleArbitrageExecuted(arbitrage);
    });
    
    this.systems.ultimate.on('emergencyTriggered', (emergency) => {
      this.status.emergency = true;
      this.handleEmergency(emergency);
    });
    
    console.log('✅ Ultimate Trading System initialized');
  }
  
  /**
   * Initialize Hitch NLP System
   */
  async initializeHitchSystem() {
    console.log('🗣️ Initializing Hitch NLP System...');
    
    // Create simple Hitch NLP interface
    this.systems.hitch = {
      processCommand: async (command) => {
        console.log(`🗣️ Hitch Command: "${command}"`);
        
        this.metrics.hitchCommands++;
        
        // Route command to Ultimate Trading System
        if (this.systems.ultimate) {
          return await this.systems.ultimate.executeHitchCommand(command);
        }
        
        return { success: true, message: 'Command processed' };
      }
    };
    
    // Connect to Ultimate Trading System
    if (this.systems.ultimate) {
      this.systems.ultimate.connectExternalSystems({
        hitchSystem: this.systems.hitch
      });
    }
    
    console.log('✅ Hitch NLP System initialized');
  }
  
  /**
   * Setup API routes
   */
  setupAPIRoutes() {
    console.log('🌐 Setting up API routes...');
    
    // System status
    this.app.get('/api/status', (req, res) => {
      res.json(this.getSystemStatus());
    });
    
    // System metrics
    this.app.get('/api/metrics', (req, res) => {
      res.json({
        metrics: this.metrics,
        uptime: Date.now() - this.startTime,
        timestamp: Date.now()
      });
    });
    
    // Ultimate Trading System status
    this.app.get('/api/ultimate/status', (req, res) => {
      if (this.systems.ultimate) {
        res.json(this.systems.ultimate.getSystemStatus());
      } else {
        res.status(503).json({ error: 'Ultimate Trading System not available' });
      }
    });
    
    // Market intelligence
    this.app.get('/api/market/intelligence', (req, res) => {
      if (this.systems.ultimate) {
        res.json(this.systems.ultimate.marketIntelligence);
      } else {
        res.status(503).json({ error: 'Market intelligence not available' });
      }
    });
    
    // Learning system status
    this.app.get('/api/learning/status', (req, res) => {
      if (this.systems.learning) {
        res.json(this.systems.learning.getSystemStatus());
      } else {
        res.status(503).json({ error: 'Learning system not available' });
      }
    });
    
    // Hitch NLP interface
    this.app.post('/api/hitch/command', async (req, res) => {
      try {
        const { command } = req.body;
        
        if (!command) {
          return res.status(400).json({ error: 'Command required' });
        }
        
        if (this.systems.hitch) {
          const result = await this.systems.hitch.processCommand(command);
          res.json(result);
        } else {
          res.status(503).json({ error: 'Hitch system not available' });
        }
      } catch (error) {
        console.error('❌ Hitch command error:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // System control
    this.app.post('/api/system/start', async (req, res) => {
      try {
        await this.startTradingSystem();
        res.json({ success: true, message: 'Trading system started' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/system/stop', async (req, res) => {
      try {
        await this.stopTradingSystem();
        res.json({ success: true, message: 'Trading system stopped' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/system/emergency-stop', async (req, res) => {
      try {
        await this.emergencyStop('api_request');
        res.json({ success: true, message: 'Emergency stop activated' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        systems: {
          ultimate: !!this.systems.ultimate,
          learning: !!this.systems.learning,
          hitch: !!this.systems.hitch
        },
        uptime: Date.now() - this.startTime,
        timestamp: Date.now()
      });
    });
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: this.config.name,
        version: this.config.version,
        status: this.status,
        message: 'OGZ PRIME VALHALLA V12 - THE ULTIMATE TRADING MACHINE! 🚀💎',
        endpoints: [
          'GET /api/status',
          'GET /api/metrics',
          'GET /api/ultimate/status',
          'GET /api/market/intelligence',
          'GET /api/learning/status',
          'POST /api/hitch/command',
          'POST /api/system/start',
          'POST /api/system/stop',
          'POST /api/system/emergency-stop',
          'GET /health'
        ]
      });
    });
    
    console.log('✅ API routes configured');
  }
  
  /**
   * Initialize WebSocket servers
   */
  async initializeWebSocketServers() {
    console.log('🌐 Initializing WebSocket servers...');
    
    // Create WebSocket server for real-time updates
    if (this.server) {
      this.wsServer = new WebSocket.Server({ server: this.server });
      this.setupWebSocketHandlers(this.wsServer, 'WS');
    }
    
    if (this.sslServer) {
      this.wssServer = new WebSocket.Server({ server: this.sslServer });
      this.setupWebSocketHandlers(this.wssServer, 'WSS');
    }
    
    console.log('✅ WebSocket servers initialized');
  }
  
  /**
   * Setup WebSocket handlers
   */
  setupWebSocketHandlers(wsServer, type) {
    wsServer.on('connection', (ws, req) => {
      this.status.activeConnections++;
      console.log(`🔌 ${type} client connected. Total: ${this.status.activeConnections}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to OGZ PRIME VALHALLA V12',
        timestamp: Date.now()
      }));
      
      // Send current status
      ws.send(JSON.stringify({
        type: 'status',
        data: this.getSystemStatus(),
        timestamp: Date.now()
      }));
      
      // Handle messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message,
            timestamp: Date.now()
          }));
        }
      });
      
      // Handle disconnect
      ws.on('close', () => {
        this.status.activeConnections--;
        console.log(`🔌 ${type} client disconnected. Total: ${this.status.activeConnections}`);
      });
    });
  }
  
  /**
   * Handle WebSocket message
   */
  async handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'hitch_command':
        if (this.systems.hitch && data.command) {
          const result = await this.systems.hitch.processCommand(data.command);
          ws.send(JSON.stringify({
            type: 'hitch_response',
            data: result,
            timestamp: Date.now()
          }));
        }
        break;
        
      case 'get_status':
        ws.send(JSON.stringify({
          type: 'status',
          data: this.getSystemStatus(),
          timestamp: Date.now()
        }));
        break;
        
      case 'get_market_intelligence':
        if (this.systems.ultimate) {
          ws.send(JSON.stringify({
            type: 'market_intelligence',
            data: this.systems.ultimate.marketIntelligence,
            timestamp: Date.now()
          }));
        }
        break;
    }
  }
  
  /**
   * Setup system event handlers
   */
  setupSystemEventHandlers() {
    console.log('⚡ Setting up system event handlers...');
    
    // Broadcast system events to all WebSocket clients
    this.on('systemEvent', (event) => {
      this.broadcastToClients({
        type: 'systemEvent',
        data: event,
        timestamp: Date.now()
      });
    });
    
    // Update system health periodically
    setInterval(() => {
      this.updateSystemHealth();
    }, 60000); // Every minute
    
    console.log('✅ System event handlers configured');
  }
  
  /**
   * Start the trading system
   */
  async startTradingSystem() {
    if (this.isRunning) {
      console.log('⚠️ System already running');
      return;
    }
    
    console.log('\n🚀 STARTING OGZ PRIME VALHALLA V12 TRADING SYSTEM...\n');
    
    try {
      // Start HTTP server
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🌐 HTTP Server running on port ${this.config.port}`);
      });
      
      // Start HTTPS server if SSL enabled
      if (this.config.enableSSL) {
        this.sslServer = https.createServer(SSL_CONFIG, this.app).listen(this.config.sslPort, () => {
          console.log(`🔐 HTTPS Server running on port ${this.config.sslPort}`);
        });
      }
      
      // Initialize WebSocket servers if not already done
      if (this.config.enableWebSockets && !this.wsServer) {
        await this.initializeWebSocketServers();
      }
      
      // Start Ultimate Trading System
      if (this.systems.ultimate) {
        await this.systems.ultimate.start();
      }
      
      this.isRunning = true;
      this.status.trading = true;
      
      console.log('\n🎯 SYSTEM CONFIGURATION:');
      console.log(`   Trading Mode: ${this.config.enableLiveTrading ? 'LIVE' : 'PAPER'}`);
      console.log(`   Learning: ${this.config.enableLearning ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Correlation Analysis: ${this.config.enableCorrelation ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Multi-Directional Trading: ${this.config.enableMultiDirectional ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Arbitrage: ${this.config.enableArbitrage ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Hitch NLP: ${this.config.enableHitch ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   WebSockets: ${this.config.enableWebSockets ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   SSL/HTTPS: ${this.config.enableSSL ? 'ENABLED' : 'DISABLED'}`);
      
      console.log('\n💎 OGZ PRIME VALHALLA V12 IS NOW LIVE!');
      console.log('🎯 THE ULTIMATE TRADING MACHINE IS OPERATIONAL!');
      console.log(`🌐 Access the system at: http://localhost:${this.config.port}`);
      
      if (this.config.enableSSL) {
        console.log(`🔐 Secure access at: https://localhost:${this.config.sslPort}`);
      }
      
      console.log('\n🗣️ Try these Hitch commands:');
      console.log('   "analyze market"');
      console.log('   "activate aggressive mode"');
      console.log('   "rebalance portfolio"');
      console.log('   "emergency stop"');
      
      this.emit('systemEvent', {
        type: 'system_started',
        message: 'OGZ PRIME VALHALLA V12 trading system started',
        config: this.config
      });
      
    } catch (error) {
      console.error('❌ Failed to start trading system:', error);
      throw error;
    }
  }
  
  /**
   * Stop the trading system
   */
  async stopTradingSystem() {
    if (!this.isRunning) {
      console.log('⚠️ System not running');
      return;
    }
    
    console.log('🛑 STOPPING OGZ PRIME VALHALLA V12...');
    
    try {
      // Stop Ultimate Trading System
      if (this.systems.ultimate) {
        await this.systems.ultimate.stop();
      }
      
      // Close servers
      if (this.server) {
        this.server.close();
      }
      
      if (this.sslServer) {
        this.sslServer.close();
      }
      
      this.isRunning = false;
      this.status.trading = false;
      
      console.log('✅ System stopped gracefully');
      
      this.emit('systemEvent', {
        type: 'system_stopped',
        message: 'OGZ PRIME VALHALLA V12 trading system stopped'
      });
      
    } catch (error) {
      console.error('❌ Error stopping system:', error);
      throw error;
    }
  }
  
  /**
   * Emergency stop
   */
  async emergencyStop(reason = 'manual') {
    console.log(`🚨 EMERGENCY STOP ACTIVATED: ${reason}`);
    
    this.status.emergency = true;
    
    // Stop all trading immediately
    if (this.systems.ultimate) {
      await this.systems.ultimate.stop();
    }
    
    // Broadcast emergency
    this.broadcastToClients({
      type: 'emergency',
      reason: reason,
      timestamp: Date.now()
    });
    
    this.emit('systemEvent', {
      type: 'emergency_stop',
      reason: reason,
      message: 'Emergency stop activated'
    });
  }
  
  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    const uptime = Date.now() - this.startTime;
    
    return {
      system: {
        name: this.config.name,
        version: this.config.version,
        uptime: uptime,
        isRunning: this.isRunning,
        ...this.status
      },
      config: this.config,
      metrics: {
        ...this.metrics,
        winRate: this.metrics.totalTrades > 0 
          ? (this.metrics.profitableTrades / this.metrics.totalTrades * 100).toFixed(1) + '%'
          : '0%',
        totalPnLFormatted: (this.metrics.totalPnL * 100).toFixed(2) + '%'
      },
      systems: {
        ultimate: !!this.systems.ultimate,
        correlation: !!this.systems.correlation,
        multiDirectional: !!this.systems.multiDirectional,
        learning: !!this.systems.learning,
        mlProcessor: !!this.systems.mlProcessor,
        hitch: !!this.systems.hitch
      },
      connectivity: {
        activeConnections: this.status.activeConnections,
        wsServer: !!this.wsServer,
        wssServer: !!this.wssServer
      },
      lastUpdate: Date.now()
    };
  }
  
  /**
   * Event handlers
   */
  handleAnalysisComplete(analysis) {
    console.log(`📊 Analysis complete: ${analysis.marketIntelligence.currentRegime} regime`);
    
    this.broadcastToClients({
      type: 'analysis_complete',
      data: analysis,
      timestamp: Date.now()
    });
  }
  
  handlePositionOpened(position) {
    console.log(`📈 Position opened: ${position.asset} ${position.direction.toUpperCase()}`);
    
    this.broadcastToClients({
      type: 'position_opened',
      data: position,
      timestamp: Date.now()
    });
  }
  
  handlePositionClosed(position) {
    const pnl = (position.realizedPnL * 100).toFixed(2);
    console.log(`📊 Position closed: ${position.asset} | PnL: ${pnl}%`);
    
    this.broadcastToClients({
      type: 'position_closed',
      data: position,
      timestamp: Date.now()
    });
  }
  
  handleArbitrageExecuted(arbitrage) {
    console.log(`💎 Arbitrage executed: ${arbitrage.type}`);
    
    this.broadcastToClients({
      type: 'arbitrage_executed',
      data: arbitrage,
      timestamp: Date.now()
    });
  }
  
  handleEmergency(emergency) {
    console.log(`🚨 EMERGENCY: ${emergency.reason}`);
    
    this.broadcastToClients({
      type: 'emergency',
      data: emergency,
      timestamp: Date.now()
    });
  }
  
  handleLearningAdaptation(recommendation) {
    this.metrics.learningUpdates++;
    
    this.broadcastToClients({
      type: 'learning_adaptation',
      data: recommendation,
      timestamp: Date.now()
    });
  }
  
  /**
   * Broadcast to all WebSocket clients
   */
  broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
    
    if (this.wssServer) {
      this.wssServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }
  
  /**
   * Update system health
   */
  updateSystemHealth() {
    let health = 'excellent';
    
    if (this.status.emergency) {
      health = 'critical';
    } else if (!this.isRunning) {
      health = 'offline';
    } else if (this.metrics.totalTrades > 10 && (this.metrics.profitableTrades / this.metrics.totalTrades) < 0.4) {
      health = 'poor';
    } else if (this.status.activeConnections === 0) {
      health = 'good';
    }
    
    this.status.systemHealth = health;
    this.status.lastActivity = Date.now();
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n🚀 LAUNCHING OGZ PRIME VALHALLA V12...\n');
  console.log('💎 THE ULTIMATE TRADING MACHINE!');
  console.log('⚡ All systems integrating...\n');
  
  // Create the ultimate system
  const ogzPrime = new OGZPrimeV12System();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await ogzPrime.stopTradingSystem();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await ogzPrime.stopTradingSystem();
    process.exit(0);
  });
  
  // Start the system
  try {
    await ogzPrime.startTradingSystem();
    
    console.log('\n🎯 READY FOR COMMANDS!');
    console.log('💬 Use POST /api/hitch/command to send natural language commands');
    console.log('🌐 Connect via WebSocket for real-time updates');
    console.log('📊 Access /api/status for system information');
    
  } catch (error) {
    console.error('❌ Failed to start OGZ PRIME VALHALLA V12:', error);
    process.exit(1);
  }
}

// Start the system
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = OGZPrimeV12System;