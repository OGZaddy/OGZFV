// 19_fix_websocket_singleton.js - FIX WEBSOCKET MANAGER SINGLETON BUG
// TARGET: core/WebsocketManager.js
// FIXES: Singleton pattern, port 3010 only, 127.0.0.1 only

const fs = require('fs');
const path = require('path');

const WEBSOCKET_MANAGER_PATH = path.join(__dirname, '..', 'OGZFV-quantumgigahookuporgy', 'OGZFV-quantum', 'core', 'WebsocketManager.js');

// Fixed WebSocketManager with proper singleton - MINIMAL FIX
const WEBSOCKET_SINGLETON_FIX = `
// Add this at the top of WebsocketManager.js to enforce singleton

// SINGLETON INSTANCE
let singletonInstance = null;

// In the constructor, add this check:
class WebsocketManager {
  constructor(config = {}) {
    // ENFORCE SINGLETON
    if (singletonInstance) {
      console.log('⚠️ WebSocketManager singleton already exists');
      return singletonInstance;
    }
    
    // FORCE CORRECT CONFIG
    this.config = {
      port: 3010, // ALWAYS 3010
      host: '127.0.0.1', // NEVER 'localhost'
      ...config
    };
    
    // Override any incorrect settings
    this.config.port = 3010;
    this.config.host = '127.0.0.1';
    
    // Your existing initialization code...
    this.servers = new Map();
    this.clients = new Map();
    
    // Store singleton
    singletonInstance = this;
    
    console.log('🌐 WebSocketManager singleton created on ' + this.config.host + ':' + this.config.port);
  }
  
  // Fix the server key bug - use consistent keys
  getOrCreateServer(port = 3010) {
    const serverKey = '127.0.0.1:' + port; // CONSISTENT KEY
    
    if (this.servers.has(serverKey)) {
      return this.servers.get(serverKey);
    }
    
    // Create new server
    const server = this.createServer(port);
    this.servers.set(serverKey, server); // USE SAME KEY
    return server;
  }
  
  // Static getInstance method
  static getInstance(config) {
    if (!singletonInstance) {
      singletonInstance = new WebsocketManager(config);
    }
    return singletonInstance;
  }
}

module.exports = WebsocketManager;
`;

function fixWebSocketManager() {
  console.log('🔧 FIXING WEBSOCKET MANAGER SINGLETON');
  console.log('=====================================');
  
  try {
    // Check if file exists
    if (!fs.existsSync(WEBSOCKET_MANAGER_PATH)) {
      console.error('❌ WebsocketManager.js not found at:', WEBSOCKET_MANAGER_PATH);
      console.log('Creating new WebsocketManager with singleton pattern...');
      
      // Create new file with proper singleton
      fs.writeFileSync(WEBSOCKET_MANAGER_PATH, createFullWebSocketManager(), 'utf8');
      console.log('  ✅ Created new WebsocketManager with singleton pattern');
      return true;
    }
    
    // Read existing file
    let content = fs.readFileSync(WEBSOCKET_MANAGER_PATH, 'utf8');
    
    // Backup original
    const backupPath = WEBSOCKET_MANAGER_PATH + '.backup';
    fs.copyFileSync(WEBSOCKET_MANAGER_PATH, backupPath);
    console.log('  ✅ Backup created:', backupPath);
    
    // Apply fixes
    let fixCount = 0;
    
    // Fix 1: Add singleton instance at top
    if (!content.includes('let singletonInstance')) {
      content = 'let singletonInstance = null;\n\n' + content;
      fixCount++;
      console.log('  ✅ Added singleton instance variable');
    }
    
    // Fix 2: Add singleton check in constructor
    if (!content.includes('if (singletonInstance)')) {
      const constructorRegex = /constructor\s*\([^)]*\)\s*{/;
      content = content.replace(constructorRegex, (match) => {
        return match + `
    // ENFORCE SINGLETON
    if (singletonInstance) {
      console.log('⚠️ WebSocketManager singleton already exists');
      return singletonInstance;
    }
    singletonInstance = this;
    `;
      });
      fixCount++;
      console.log('  ✅ Added singleton enforcement in constructor');
    }
    
    // Fix 3: Force port 3010
    content = content.replace(/port:\s*\d+/g, 'port: 3010');
    content = content.replace(/this\.config\.port\s*=\s*[^;]+;/g, 'this.config.port = 3010;');
    fixCount++;
    console.log('  ✅ Forced port to 3010');
    
    // Fix 4: Force 127.0.0.1
    content = content.replace(/'localhost'/g, "'127.0.0.1'");
    content = content.replace(/"localhost"/g, '"127.0.0.1"');
    content = content.replace(/host:\s*['"][^'"]+['"]/g, "host: '127.0.0.1'");
    fixCount++;
    console.log('  ✅ Forced host to 127.0.0.1');
    
    // Fix 5: Fix server key consistency
    if (!content.includes('const serverKey = ')) {
      content = content.replace(/this\.servers\[port\]/g, 'this.servers[serverKey]');
      content = content.replace(/this\.servers\.set\(port/g, 'this.servers.set(serverKey');
      fixCount++;
      console.log('  ✅ Fixed server key consistency');
    }
    
    // Fix 6: Add getInstance if missing
    if (!content.includes('static getInstance')) {
      content += `
// Static getInstance method for singleton
WebsocketManager.getInstance = function(config) {
  if (!singletonInstance) {
    singletonInstance = new WebsocketManager(config);
  }
  return singletonInstance;
};
`;
      fixCount++;
      console.log('  ✅ Added getInstance method');
    }
    
    // Write fixed file
    fs.writeFileSync(WEBSOCKET_MANAGER_PATH, content, 'utf8');
    
    console.log(`\n✅ Applied ${fixCount} fixes to WebSocketManager`);
    console.log('✅ Singleton pattern enforced');
    console.log('✅ Port locked to 3010');
    console.log('✅ Host locked to 127.0.0.1');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

// Create full WebSocketManager if file doesn't exist
function createFullWebSocketManager() {
  return `
const WebSocket = require('ws');
const EventEmitter = require('events');

// SINGLETON INSTANCE
let singletonInstance = null;

class WebsocketManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // ENFORCE SINGLETON
    if (singletonInstance) {
      console.log('⚠️ WebSocketManager singleton already exists');
      return singletonInstance;
    }
    
    // FORCE CORRECT CONFIG
    this.config = {
      port: 3010, // ALWAYS 3010
      host: '127.0.0.1', // NEVER 'localhost'
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      ...config
    };
    
    // Override any incorrect settings
    this.config.port = 3010;
    this.config.host = '127.0.0.1';
    
    this.servers = new Map();
    this.clients = new Map();
    this.isConnected = false;
    
    // Store singleton
    singletonInstance = this;
    
    console.log('🌐 WebSocketManager singleton created');
    console.log('  Port: ' + this.config.port);
    console.log('  Host: ' + this.config.host);
  }
  
  getOrCreateServer(port = 3010) {
    const serverKey = this.config.host + ':' + port;
    
    if (this.servers.has(serverKey)) {
      return this.servers.get(serverKey);
    }
    
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ port, host: this.config.host });
    
    wss.on('connection', (ws) => {
      const clientId = Date.now().toString();
      this.clients.set(clientId, ws);
      
      ws.on('close', () => {
        this.clients.delete(clientId);
      });
    });
    
    this.servers.set(serverKey, wss);
    console.log('✅ WebSocket server created on ' + serverKey);
    
    return wss;
  }
  
  broadcast(message) {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    
    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
  
  static getInstance(config) {
    if (!singletonInstance) {
      singletonInstance = new WebsocketManager(config);
    }
    return singletonInstance;
  }
}

module.exports = WebsocketManager;
`;
}

// Scan for WebSocket issues in other files
function scanForWebSocketIssues() {
  console.log('\n🔍 Scanning for WebSocket configuration issues...');
  
  const projectRoot = path.join(__dirname, '..', 'OGZFV-quantumgigahookuporgy', 'OGZFV-quantum');
  const issues = [];
  const filesToCheck = [
    'run-trading-bot-v13-quantum.js',
    'quantum_ssl_server.js',
    'core/UnifiedTradingCore.js'
  ];
  
  for (const file of filesToCheck) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for localhost usage
      if (content.includes("'localhost'") || content.includes('"localhost"')) {
        issues.push(file + ': uses "localhost" instead of "127.0.0.1"');
      }
      
      // Check for wrong ports
      const portMatches = content.match(/port['"\s:]+(\d{4})/gi);
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
  console.log('\n🚀 EXECUTING WEBSOCKET SINGLETON FIX');
  console.log('===================================\n');
  
  const success = fixWebSocketManager();
  
  if (success) {
    scanForWebSocketIssues();
    console.log('\n✅ WEBSOCKET MANAGER SUCCESSFULLY FIXED!');
    console.log('🌐 Singleton pattern enforced');
    console.log('🔒 Locked to 127.0.0.1:3010');
    console.log('🚀 Ready for unified communication!\n');
  } else {
    console.log('\n❌ FIX FAILED - Manual intervention required');
  }
}

module.exports = { fixWebSocketManager, scanForWebSocketIssues };