// 04_fix_websocket_singleton.js - FIX WEBSOCKET MANAGER SINGLETON BUG
// TARGET: core/WebsocketManager.js
// FIXES: Singleton pattern, port 3010 only, 127.0.0.1 only

const fs = require('fs');
const path = require('path');

const WEBSOCKET_MANAGER_PATH = path.join(__dirname, 'core', 'WebsocketManager.js');

// Fixed WebSocketManager with proper singleton
const FIXED_WEBSOCKET_MANAGER = `
// FIXED WEBSOCKET MANAGER - PROPER SINGLETON PATTERN
const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // ENFORCE SINGLETON
    if (WebSocketManager.instance) {
      console.log('⚠️ WebSocketManager singleton already exists, returning existing instance');
      return WebSocketManager.instance;
    }
    
    this.config = {
      port: 3010, // ALWAYS 3010
      host: '127.0.0.1', // NEVER 'localhost'
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      ...config
    };
    
    // OVERRIDE any incorrect settings
    this.config.port = 3010;
    this.config.host = '127.0.0.1';
    
    // Singleton state
    this.servers = new Map();
    this.clients = new Map();
    this.reconnectTimers = new Map();
    this.reconnectAttempts = new Map();
    this.messageQueue = [];
    this.isConnected = false;
    
    // Store singleton instance
    WebSocketManager.instance = this;
    
    console.log('🌐 WebSocketManager singleton created');
    console.log('  Port: ' + this.config.port);
    console.log('  Host: ' + this.config.host);
    
    // Start the unified server
    this.initializeUnifiedServer();
  }
  
  // Initialize the unified WebSocket server
  initializeUnifiedServer() {
    const serverKey = this.config.host + ':' + this.config.port;
    
    // Check if server already exists (FIX: use consistent key)
    if (this.servers.has(serverKey)) {
      console.log('✅ WebSocket server already running on ' + serverKey);
      return this.servers.get(serverKey);
    }
    
    try {
      // Create HTTP server first
      const http = require('http');
      const express = require('express');
      const app = express();
      
      const server = http.createServer(app);
      
      // Create WebSocket server
      const wss = new WebSocket.Server({ 
        server,
        path: '/ws',
        perMessageDeflate: false
      });
      
      // Handle connections
      wss.on('connection', (ws, req) => {
        const clientId = this.generateClientId();
        this.clients.set(clientId, ws);
        
        console.log('🔌 New WebSocket connection: ' + clientId);
        
        // Send identification
        ws.send(JSON.stringify({
          type: 'connection_established',
          clientId: clientId,
          server: serverKey,
          timestamp: Date.now()
        }));
        
        // Handle messages
        ws.on('message', (data) => {
          this.handleMessage(clientId, data);
        });
        
        // Handle disconnection
        ws.on('close', () => {
          console.log('🔌 WebSocket disconnected: ' + clientId);
          this.clients.delete(clientId);
        });
        
        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error for ' + clientId + ':', error.message);
        });
      });
      
      // Start server
      server.listen(this.config.port, this.config.host, () => {
        console.log('✅ WebSocket server listening on ' + serverKey);
        this.isConnected = true;
        this.emit('server_started', serverKey);
      });
      
      // Store server reference (FIX: use consistent key)
      this.servers.set(serverKey, { wss, server });
      
      // Setup heartbeat
      this.setupHeartbeat(wss);
      
      return { wss, server };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket server:', error);
      throw error;
    }
  }
  
  // Connect as a client to the unified server
  connectToUnifiedServer(options = {}) {
    const url = 'ws://' + this.config.host + ':' + this.config.port + '/ws';
    
    console.log('🔌 Connecting to unified server: ' + url);
    
    const ws = new WebSocket(url);
    const clientId = this.generateClientId();
    
    ws.on('open', () => {
      console.log('✅ Connected to unified server as ' + clientId);
      this.clients.set(clientId, ws);
      
      // Identify self
      ws.send(JSON.stringify({
        type: 'identify',
        source: options.source || 'module',
        clientId: clientId,
        timestamp: Date.now()
      }));
      
      // Process queued messages
      this.processMessageQueue(ws);
      
      this.emit('connected', clientId);
    });
    
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });
    
    ws.on('close', () => {
      console.log('❌ Disconnected from unified server: ' + clientId);
      this.clients.delete(clientId);
      
      // Attempt reconnection
      this.scheduleReconnect(url, options);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
    });
    
    return ws;
  }
  
  // Handle incoming messages
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      
      // Emit message for processing
      this.emit('message', {
        clientId: clientId,
        message: message,
        timestamp: Date.now()
      });
      
      // Handle specific message types
      switch (message.type) {
        case 'market_data':
          this.emit('market_data', message.data);
          break;
          
        case 'trade_executed':
          this.emit('trade', message.data);
          break;
          
        case 'status_update':
          this.emit('status', message.data);
          break;
          
        default:
          // Broadcast to other clients
          this.broadcast(message, clientId);
      }
      
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  // Broadcast message to all connected clients
  broadcast(message, excludeClientId = null) {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    
    for (const [clientId, ws] of this.clients) {
      if (clientId !== excludeClientId && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
  
  // Send message to specific client
  send(clientId, message) {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      ws.send(data);
      return true;
    }
    
    // Queue message if not connected
    this.messageQueue.push({ clientId, message });
    return false;
  }
  
  // Process queued messages
  processMessageQueue(ws) {
    while (this.messageQueue.length > 0) {
      const { message } = this.messageQueue.shift();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }
  
  // Setup heartbeat to keep connections alive
  setupHeartbeat(wss) {
    setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, this.config.heartbeatInterval);
  }
  
  // Schedule reconnection
  scheduleReconnect(url, options) {
    const attempts = this.reconnectAttempts.get(url) || 0;
    
    if (attempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for ' + url);
      return;
    }
    
    const timer = setTimeout(() => {
      console.log('🔄 Attempting reconnection to ' + url + ' (attempt ' + (attempts + 1) + ')');
      this.reconnectAttempts.set(url, attempts + 1);
      this.connectToUnifiedServer(options);
    }, this.config.reconnectInterval);
    
    this.reconnectTimers.set(url, timer);
  }
  
  // Generate unique client ID
  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Get singleton instance
  static getInstance(config) {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(config);
    }
    return WebSocketManager.instance;
  }
  
  // Get status
  getStatus() {
    return {
      isConnected: this.isConnected,
      servers: Array.from(this.servers.keys()),
      clients: this.clients.size,
      queuedMessages: this.messageQueue.length,
      config: {
        port: this.config.port,
        host: this.config.host
      }
    };
  }
  
  // Cleanup
  cleanup() {
    // Clear timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    
    // Close all connections
    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    
    // Close servers
    for (const { wss, server } of this.servers.values()) {
      wss.close();
      server.close();
    }
    
    this.clients.clear();
    this.servers.clear();
    this.messageQueue = [];
    this.isConnected = false;
    
    // Clear singleton
    WebSocketManager.instance = null;
    
    console.log('🛑 WebSocketManager cleaned up');
  }
}

// Export singleton instance
module.exports = WebSocketManager;

// Also export getInstance for compatibility
module.exports.getInstance = WebSocketManager.getInstance;
`;

function fixWebSocketManager() {
  console.log('🔧 FIXING WEBSOCKET MANAGER SINGLETON');
  console.log('=====================================');
  
  try {
    // Backup original
    const backupPath = WEBSOCKET_MANAGER_PATH + '.backup';
    if (fs.existsSync(WEBSOCKET_MANAGER_PATH)) {
      fs.copyFileSync(WEBSOCKET_MANAGER_PATH, backupPath);
      console.log('  ✅ Backup created:', backupPath);
    }
    
    // Write fixed WebSocketManager
    fs.writeFileSync(WEBSOCKET_MANAGER_PATH, FIXED_WEBSOCKET_MANAGER, 'utf8');
    
    console.log('  ✅ WebSocketManager singleton fixed');
    console.log('  ✅ Port locked to 3010');
    console.log('  ✅ Host locked to 127.0.0.1');
    console.log('  ✅ Singleton pattern enforced');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

// Scan for WebSocket issues in other files
function scanForWebSocketIssues() {
  console.log('\\n🔍 Scanning for WebSocket configuration issues...');
  
  const issues = [];
  const filesToCheck = [
    'run-trading-bot-v13-quantum.js',
    'quantum_ssl_server.js',
    'core/UnifiedTradingCore.js'
  ];
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for localhost usage
      if (content.includes("'localhost'") || content.includes('"localhost"')) {
        issues.push(file + ': uses "localhost" instead of "127.0.0.1"');
      }
      
      // Check for wrong ports
      const portMatches = content.match(/port['"\\s:]+(\d{4})/gi);
      if (portMatches) {
        portMatches.forEach(match => {
          const port = match.match(/\d{4}/)[0];
          if (port !== '3010' && port !== '3011' && port !== '3443') {
            issues.push(file + ': uses port ' + port + ' (should be 3010)');
          }
        });
      }
    }
  }
  
  if (issues.length > 0) {
    console.log('  ⚠️ Found WebSocket configuration issues:');
    issues.forEach(issue => console.log('    -', issue));
  } else {
    console.log('  ✅ No WebSocket configuration issues found');
  }
  
  return issues;
}

// Execute if run directly
if (require.main === module) {
  console.log('\\n🚀 EXECUTING WEBSOCKET SINGLETON FIX');
  console.log('===================================\\n');
  
  const success = fixWebSocketManager();
  
  if (success) {
    scanForWebSocketIssues();
    console.log('\\n✅ WEBSOCKET MANAGER SUCCESSFULLY FIXED!');
    console.log('🌐 Singleton pattern enforced');
    console.log('🔒 Locked to 127.0.0.1:3010');
    console.log('🚀 Ready for unified communication!\\n');
  } else {
    console.log('\\n❌ FIX FAILED - Manual intervention required');
  }
}

module.exports = { fixWebSocketManager, scanForWebSocketIssues };