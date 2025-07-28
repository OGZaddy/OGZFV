// ==========================================
// FILE: mover-server.js
// WebSocket server and API router - COMPLETE VERSION
// ==========================================
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const MoverCore = require('./mover-core');
const MoverMemory = require('./mover-memory');
const MoverLogInterpreter = require('./mover-log-interpreter');

// Import expansion modules if they exist
let MoverIntegrationHub;
try {
  MoverIntegrationHub = require('./mover-integration-hub');
} catch (e) {
  console.log('[MoverServer] Integration hub not found, running in basic mode');
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

class MoverServer {
  constructor(config = {}) {
    this.config = {
      httpPort: process.env.MOVER_HTTP_PORT || 4000,
      wsPort: process.env.MOVER_WS_PORT || 4001,
      botWsUrl: process.env.BOT_WS_URL || 'ws://localhost:8080',
      voiceEnabled: process.env.VOICE_ENABLED === 'true',
      ...config
    };
    
    // Initialize components
    this.moverCore = new MoverCore({
      personality: process.env.MOVER_PERSONALITY || 'houston_focused',
      accountBalance: parseFloat(process.env.ACCOUNT_BALANCE) || 10000,
      houstonTarget: parseFloat(process.env.HOUSTON_TARGET) || 25000
    });
    
    this.moverMemory = new MoverMemory({
      memoryDir: process.env.MEMORY_DIR || './memory'
    });
    
    this.logInterpreter = new MoverLogInterpreter({
      moverCore: this.moverCore,
      moverMemory: this.moverMemory
    });
    
    // Initialize Integration Hub if available
    if (MoverIntegrationHub) {
      this.integrationHub = new MoverIntegrationHub(this.moverCore, this.moverMemory);
      console.log('[MoverServer] Integration Hub initialized - Full capabilities online!');
    }
    
    // Client connections
    this.wsClients = new Set();
    this.botConnection = null;
    
    this.initializeServer();
  }

  async initializeServer() {
    try {
      // Set up Express server
      this.app = express();
      this.app.use(express.json());
      this.app.use(express.static(path.join(__dirname, 'public')));
      this.setupRoutes();
      
      // Create HTTP server
      this.httpServer = http.createServer(this.app);
      
      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        port: this.config.wsPort 
      });
      
      this.setupWebSocketServer();
      
      // Connect to OGZ Prime bot
      await this.connectToBot();
      
      // Load initial doctrine
      if (process.env.INITIAL_DOCTRINE) {
        await this.moverCore.loadDoctrine(process.env.INITIAL_DOCTRINE);
        await this.moverMemory.ingestDoctrine(
          process.env.INITIAL_DOCTRINE, 
          'primary_doctrine'
        );
      }
      
      // Start HTTP server
      this.httpServer.listen(this.config.httpPort, () => {
        console.log(`[MoverServer] HTTP API running on port ${this.config.httpPort}`);
        console.log(`[MoverServer] WebSocket server running on port ${this.config.wsPort}`);
        console.log(`[MoverServer] The Mover is ONLINE! 🧠🚀`);
        
        if (this.integrationHub) {
          console.log(`[MoverServer] Full Integration Mode Active:`);
          console.log(`  - Tech Support: ✅`);
          console.log(`  - Content Creation: ✅`);
          console.log(`  - Sales Engine: ✅`);
          console.log(`  - Hitch NLP Connection: ${process.env.HITCH_WS_URL ? '✅' : '❌'}`);
        }
      });
      
      // Set up core event handlers
      this.setupCoreHandlers();
      
    } catch (error) {
      console.error('[MoverServer] Initialization failed:', error);
      process.exit(1);
    }
  }

  setupRoutes() {
    // Serve frontend if it exists
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'mover-frontend.html'));
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'online',
        uptime: process.uptime(),
        connections: {
          clients: this.wsClients.size,
          botConnected: !!this.botConnection
        },
        stats: {
          ...this.moverCore.getSessionReport(),
          memory: this.moverMemory.getMemoryStats()
        },
        capabilities: {
          basic: true,
          integrationHub: !!this.integrationHub,
          techSupport: !!this.integrationHub?.support,
          contentCreation: !!this.integrationHub?.content,
          salesEngine: !!this.integrationHub?.sales,
          hitchConnected: !!this.integrationHub?.hitch
        }
      });
    });
    
    // Ingest doctrine
    this.app.post('/doctrine/ingest', async (req, res) => {
      try {
        const { path: doctrinePath, id } = req.body;
        const insights = await this.moverMemory.ingestDoctrine(doctrinePath, id);
        await this.moverCore.loadDoctrine(doctrinePath);
        
        res.json({
          success: true,
          doctrineId: id,
          insightsExtracted: insights.length
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Manual narration trigger
    this.app.post('/narrate', async (req, res) => {
      try {
        const response = await this.moverCore.processTradeEvent(req.body);
        res.json({
          success: true,
          narration: response
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Memory recall
    this.app.get('/memory/recall', (req, res) => {
      const { query, limit } = req.query;
      const results = this.moverMemory.recall(query, { limit: parseInt(limit) || 10 });
      res.json(results);
    });
    
    // Session report
    this.app.get('/report', (req, res) => {
      res.json({
        session: this.moverCore.getSessionReport(),
        memory: this.moverMemory.getMemoryStats()
      });
    });
    
    // Voice control
    this.app.post('/voice/toggle', (req, res) => {
      this.config.voiceEnabled = !this.config.voiceEnabled;
      res.json({
        voiceEnabled: this.config.voiceEnabled
      });
    });
    
    // ========== EXPANSION ROUTES ==========
    
    // Tech Support Routes
    if (this.integrationHub?.support) {
      this.app.post('/support/diagnose', async (req, res) => {
        try {
          const result = await this.integrationHub.support.diagnoseProblem(req.body.issue);
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
      
      this.app.get('/support/health', async (req, res) => {
        const health = await this.integrationHub.support.checkSystemHealth();
        res.json(health);
      });
    }
    
    // Content Creation Routes
    if (this.integrationHub?.content) {
      this.app.post('/content/youtube', async (req, res) => {
        try {
          const script = await this.integrationHub.content.generateYouTubeScript(req.body);
          res.json(script);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
      
      this.app.post('/content/social', async (req, res) => {
        try {
          const posts = await this.integrationHub.content.generateSocialMediaPost(req.body);
          res.json(posts);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
      
      this.app.post('/content/short', async (req, res) => {
        try {
          const content = await this.integrationHub.content.generateShortFormContent(req.body);
          res.json(content);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
    
    // Sales Engine Routes
    if (this.integrationHub?.sales) {
      this.app.get('/sales/visitor/:id', async (req, res) => {
        try {
          const result = await this.integrationHub.sales.handleVisitor({
            id: req.params.id,
            ...req.query
          });
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
      
      this.app.post('/sales/objection', async (req, res) => {
        try {
          const response = await this.integrationHub.sales.handleObjection(
            req.body.objection,
            req.body.context
          );
          res.json(response);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
      
      this.app.get('/sales/page', async (req, res) => {
        try {
          const page = await this.integrationHub.sales.generateSalesPage();
          res.json(page);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
    
    // Integration Hub Routes
    if (this.integrationHub) {
      this.app.post('/query', async (req, res) => {
        try {
          const response = await this.integrationHub.handleUserQuery(
            req.body.query,
            req.body.context || {}
          );
          res.json(response);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
      
      this.app.get('/report/daily', async (req, res) => {
        try {
          const report = await this.integrationHub.generateDailyReport();
          res.json(report);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('[MoverServer] New client connected');
      
      // Add to clients set
      this.wsClients.add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to The Mover',
        personality: this.moverCore.config.personality,
        voiceEnabled: this.config.voiceEnabled,
        capabilities: {
          narration: true,
          techSupport: !!this.integrationHub?.support,
          contentCreation: !!this.integrationHub?.content,
          salesSupport: !!this.integrationHub?.sales
        }
      }));
      
      // Handle client messages
      ws.on('message', (message) => {
        this.handleClientMessage(ws, message);
      });
      
      // Handle disconnection
      ws.on('close', () => {
        this.wsClients.delete(ws);
        console.log('[MoverServer] Client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('[MoverServer] WebSocket error:', error);
        this.wsClients.delete(ws);
      });
    });
  }

  async handleClientMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          // Client wants real-time narrations
          ws.isSubscribed = true;
          ws.send(JSON.stringify({
            type: 'subscribed',
            message: 'You will receive real-time narrations'
          }));
          break;
          
        case 'command':
          // Process user command
          const response = await this.processUserCommand(data.command);
          ws.send(JSON.stringify({
            type: 'command_response',
            response
          }));
          break;
          
        case 'query':
          // Memory query or general query
          if (this.integrationHub) {
            const response = await this.integrationHub.handleUserQuery(
              data.query,
              data.context || {}
            );
            ws.send(JSON.stringify({
              type: 'query_response',
              response
            }));
          } else {
            const results = this.moverMemory.recall(data.query);
            ws.send(JSON.stringify({
              type: 'query_results',
              results
            }));
          }
          break;
          
        case 'support':
          // Tech support request
          if (this.integrationHub?.support) {
            const diagnosis = await this.integrationHub.support.diagnoseProblem(data.issue);
            ws.send(JSON.stringify({
              type: 'support_response',
              diagnosis
            }));
          }
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  async processUserCommand(command) {
    // Simple command processor
    const cmd = command.toLowerCase().trim();
    
    if (cmd.includes('status')) {
      return this.moverCore.getSessionReport();
    } else if (cmd.includes('help')) {
      const commands = [
        'status - Get current session report',
        'memory stats - Get memory statistics',
        'voice on/off - Toggle voice output',
        'personality [type] - Change personality'
      ];
      
      if (this.integrationHub) {
        commands.push(
          'diagnose [issue] - Get tech support',
          'daily report - Get comprehensive daily report'
        );
      }
      
      return { commands };
    } else if (cmd.includes('memory stats')) {
      return this.moverMemory.getMemoryStats();
    } else if (cmd.includes('voice on')) {
      this.config.voiceEnabled = true;
      return 'Voice output enabled';
    } else if (cmd.includes('voice off')) {
      this.config.voiceEnabled = false;
      return 'Voice output disabled';
    } else if (cmd.startsWith('personality')) {
      const personality = cmd.split(' ')[1];
      if (personality) {
        this.moverCore.config.personality = personality;
        return `Personality changed to: ${personality}`;
      }
    } else if (cmd.includes('daily report') && this.integrationHub) {
      return await this.integrationHub.generateDailyReport();
    }
    
    return 'Command not recognized. Type "help" for available commands.';
  }

  async connectToBot() {
    try {
      console.log(`[MoverServer] Connecting to OGZ Prime at ${this.config.botWsUrl}`);
      
      this.botConnection = new WebSocket(this.config.botWsUrl);
      
      this.botConnection.on('open', () => {
        console.log('[MoverServer] Connected to OGZ Prime bot!');
        
        // Subscribe to trade events
        this.botConnection.send(JSON.stringify({
          type: 'subscribe',
          channels: ['trades', 'analysis', 'alerts']
        }));
      });
      
      this.botConnection.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.processBotMessage(data);
        } catch (error) {
          console.error('[MoverServer] Error processing bot message:', error);
        }
      });
      
      this.botConnection.on('close', () => {
        console.log('[MoverServer] Disconnected from bot. Reconnecting in 5s...');
        this.botConnection = null;
        setTimeout(() => this.connectToBot(), 5000);
      });
      
      this.botConnection.on('error', (error) => {
        console.error('[MoverServer] Bot connection error:', error);
      });
      
    } catch (error) {
      console.error('[MoverServer] Failed to connect to bot:', error);
      setTimeout(() => this.connectToBot(), 5000);
    }
  }

  async processBotMessage(data) {
    // Record in memory
    const eventId = this.moverMemory.recordEvent(data.type || 'bot_message', data);
    
    // Process based on type
    if (data.type === 'trade' || data.action) {
      // Trade event - generate narration
      const narration = await this.moverCore.processTradeEvent(data);
      
      // Broadcast to subscribed clients
      this.broadcastToClients({
        type: 'narration',
        source: 'trade',
        content: narration,
        data: data,
        eventId,
        timestamp: Date.now()
      });
      
      // Send to voice pipeline if enabled
      if (this.config.voiceEnabled) {
        this.sendToVoicePipeline(narration);
      }
      
      // If integration hub exists, process for content/sales
      if (this.integrationHub && data.profitLoss > 0) {
        this.integrationHub.emit('profitable_trade', data);
      }
      
    } else if (data.type === 'analysis') {
      // Market analysis update
      if (data.marketRegime) {
        this.moverCore.state.currentMarketRegime = data.marketRegime;
      }
      
      // Generate analysis narration
      const narration = await this.moverCore.generateResponse(data, {
        type: 'market_analysis',
        marketRegime: data.marketRegime,
        confidence: data.confidence
      });
      
      this.broadcastToClients({
        type: 'narration',
        source: 'analysis',
        content: narration,
        data: data,
        eventId,
        timestamp: Date.now()
      });
      
    } else if (data.type === 'alert') {
      // System alert
      this.broadcastToClients({
        type: 'alert',
        content: data.message || 'System alert received',
        severity: data.severity || 'info',
        eventId,
        timestamp: Date.now()
      });
      
      // If integration hub exists, might need tech support
      if (this.integrationHub && data.severity === 'error') {
        this.integrationHub.emit('system_error', data);
      }
    }
  }

  setupCoreHandlers() {
    // Handle narrations from core
    this.moverCore.on('narration', (narration) => {
      this.broadcastToClients(narration);
      
      if (this.config.voiceEnabled) {
        this.sendToVoicePipeline(narration.response);
      }
    });
    
    // Handle doctrine updates
    this.moverMemory.on('doctrine_ingested', (info) => {
      this.broadcastToClients({
        type: 'system',
        message: `Doctrine ingested: ${info.doctrineId} (${info.insightCount} insights)`,
        timestamp: Date.now()
      });
    });
    
    // If integration hub exists, set up its handlers
    if (this.integrationHub) {
      this.integrationHub.on('content_created', (content) => {
        this.broadcastToClients({
          type: 'content',
          platform: content.platform,
          content: content,
          timestamp: Date.now()
        });
      });
      
      this.integrationHub.on('support_ticket_resolved', (ticket) => {
        this.broadcastToClients({
          type: 'support',
          message: `Support ticket resolved: ${ticket.issue}`,
          solution: ticket.solution,
          timestamp: Date.now()
        });
      });
    }
  }

  broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isSubscribed) {
        client.send(messageStr);
      }
    });
  }

  sendToVoicePipeline(text) {
    // Placeholder for voice integration
    // This would connect to ElevenLabs or other TTS service
    console.log(`[Voice Output] ${text}`);
    
    // Emit event for external voice handlers
    this.moverCore.emit('voice_output', {
      text,
      personality: this.moverCore.config.personality,
      timestamp: Date.now()
    });
  }

  async shutdown() {
    console.log('[MoverServer] Shutting down...');
    
    // Close WebSocket connections
    this.wsClients.forEach(client => client.close());
    this.wss.close();
    
    if (this.botConnection) {
      this.botConnection.close();
    }
    
    // Save memory
    await this.moverMemory.cleanup();
    
    // Close HTTP server
    this.httpServer.close();
    
    console.log('[MoverServer] Shutdown complete');
  }
}

// Launch server if run directly
if (require.main === module) {
  const server = new MoverServer();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
  });
}

module.exports = MoverServer;