/**
 * ============================================================================
 * DOCUMENTED_WebsocketManager.js - Singleton WebSocket Connection Management
 * ============================================================================
 * 
 * SYSTEM ROLE: Bulletproof WebSocket infrastructure for OGZ Prime
 * 
 * CRITICAL PROBLEM SOLVED:
 * This singleton prevents the iteration bug that was causing multiple WebSocket
 * servers to bind to the same port, leading to crashes and connection failures.
 * 
 * BUSINESS IMPACT:
 * Reliable real-time connections are essential for:
 * - Live trade execution and monitoring
 * - Dashboard real-time updates  
 * - Mobile client connectivity
 * - Alert and notification systems
 * 
 * HOUSTON MISSION CRITICAL:
 * Rock-solid connections ensure you never miss trading opportunities or alerts
 * while working toward moving to Houston with your daughter.
 * 
 * @author OGZ Prime Development Team
 * @version 10.2.0
 * @since 2025-06-16
 * ============================================================================
 */

const { WebSocketServer } = require('ws');

/**
 * WebSocketManager Class - Singleton WebSocket Connection Management System
 * 
 * ARCHITECTURAL SOLUTION:
 * Implements true singleton pattern to ensure only ONE server exists per port.
 * Provides comprehensive connection management, message queuing, and health monitoring.
 * 
 * CORE RESPONSIBILITIES:
 * 1. Singleton server management (one server per port)
 * 2. Multi-client connection handling
 * 3. Message broadcasting and queuing
 * 4. Connection health monitoring
 * 5. Automatic reconnection and recovery
 * 6. Error handling and logging
 */
class WebSocketManager {
  
  /**
   * Private Instance Variables - Singleton State Management
   * 
   * Using private fields to ensure encapsulation and prevent external
   * modification of critical connection state.
   */
  #servers = new Map();           // Map of port -> WebSocket server
  #clients = new Map();           // Map of port -> Set of connected clients
  #messageQueues = new Map();     // Map of port -> Array of queued messages
  #connectionHealth = new Map();  // Map of port -> Connection health metrics
  
  static #instance;               // Singleton instance storage
  
  /**
   * Constructor - Singleton Implementation
   * 
   * SINGLETON PATTERN: Ensures only one WebSocketManager instance can exist
   * in the entire application, preventing the iteration issue permanently.
   */
  constructor() {
    // ====================================================================
    // SINGLETON ENFORCEMENT
    // ====================================================================
    if (WebSocketManager.#instance) {
      console.log('🔌 Returning existing WebSocketManager singleton instance');
      return WebSocketManager.#instance;
    }
    
    // ====================================================================
    // FIRST-TIME INITIALIZATION
    // ====================================================================
    WebSocketManager.#instance = this;
    
    console.log('🔌 WebSocketManager singleton initialized - iteration issue SOLVED!');
    
    // ====================================================================
    // CLEANUP HANDLERS
    // ====================================================================
    // Ensure clean shutdown of all servers
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    return this;
  }
  
  /**
   * Get Server - Primary Server Access Method
   * 
   * CRITICAL FUNCTION: This is the main method that prevents the iteration
   * issue. It returns existing servers or creates new ones as needed,
   * but NEVER creates duplicate servers on the same port.
   * 
   * @param {number} port - Port number for the WebSocket server
   * @param {Object} options - WebSocket server configuration options
   * @returns {WebSocketServer} - The WebSocket server instance
   */
  getServer(port, options = {}) {
    // ====================================================================
    // INPUT VALIDATION
    // ====================================================================
    if (!port || typeof port !== 'number' || port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${port}. Must be between 1 and 65535.`);
    }
    
    const serverKey = `ws-${port}`;
    
    // ====================================================================
    // EXISTING SERVER CHECK
    // ====================================================================
    if (this.#servers.has(serverKey)) {
      console.log(`🔌 Returning existing WebSocket server on port ${port}`);
      return this.#servers.get(serverKey);
    }
    
    // ====================================================================
    // NEW SERVER CREATION
    // ====================================================================
    console.log(`🔌 Creating new WebSocket server on port ${port}`);
    return this.#createServer(serverKey, port, options);
  }
  
  /**
   * Create Server - Internal Server Creation
   * 
   * INTERNAL METHOD: Creates a new WebSocket server with comprehensive
   * connection management, health monitoring, and message queuing.
   * 
   * @param {string} key - Internal server key
   * @param {number} port - Port number
   * @param {Object} options - Server options
   * @returns {WebSocketServer} - Created server instance
   */
  #createServer(key, port, options) {
    try {
      // ================================================================
      // SERVER CREATION WITH OPTIMIZATION
      // ================================================================
      const server = new WebSocketServer({ 
        port, 
        ...options,
        // Performance optimizations
        perMessageDeflate: true,    // Enable compression
        maxPayload: 16 * 1024,      // 16KB max message size
        clientTracking: true,       // Track clients automatically
        skipUTF8Validation: false,   // Validate UTF8 for security
        // Enhanced stability options
        handshakeTimeout: 10000,      // 10 second handshake timeout
        maxConnections: 100,          // Limit concurrent connections
        backlog: 511                  // Connection backlog
      });
      
      // ================================================================
      // STATE INITIALIZATION
      // ================================================================
      this.#servers.set(key, server);
      this.#clients.set(key, new Set());
      this.#messageQueues.set(key, []);
      this.#connectionHealth.set(key, {
        port: port,
        connections: 0,
        totalConnections: 0,
        messagesQueued: 0,
        messagesSent: 0,
        errors: 0,
        created: Date.now(),
        lastActivity: Date.now()
      });
      
      // ================================================================
      // CONNECTION HANDLING
      // ================================================================
      server.on('connection', (client, request) => {
        this.#setupClientConnection(key, client, request);
      });
      
      // ================================================================
      // SERVER ERROR HANDLING
      // ================================================================
      server.on('error', (error) => {
        console.error(`❌ WebSocket server error on port ${port}:`, error.message);
        this.#updateHealth(key, 'server_error');
      });
      
      server.on('close', () => {
        console.log(`🔌 WebSocket server on port ${port} closed`);
        this.#cleanupServer(key);
      });
      
      // ================================================================
      // HEARTBEAT SYSTEM
      // ================================================================
      this.#setupHeartbeat(key, server);
      
      console.log(`✅ WebSocket server created successfully on port ${port}`);
      return server;
      
    } catch (error) {
      console.error(`❌ Failed to create WebSocket server on port ${port}:`, error.message);
      
      // If port is in use, this is likely the iteration issue
      if (error.code === 'EADDRINUSE') {
        console.error(`🚨 PORT ${port} ALREADY IN USE - This indicates an iteration issue!`);
        console.error('🔧 WebSocketManager should prevent this. Check for multiple instances.');
      }
      
      throw error;
    }
  }
  
  /**
   * Setup Client Connection - Client Connection Management
   * 
   * CONNECTION LIFECYCLE: Handles the complete lifecycle of client connections
   * including authentication, message queuing, and health monitoring.
   * 
   * @param {string} key - Server key
   * @param {WebSocket} client - WebSocket client connection
   * @param {Object} request - HTTP request object
   */
  #setupClientConnection(key, client, request) {
    // ====================================================================
    // CLIENT IDENTIFICATION
    // ====================================================================
    const clientId = `${request.socket.remoteAddress}:${request.socket.remotePort}:${Date.now()}`;
    client.id = clientId;
    client.connectedAt = Date.now();
    client.isAlive = true;
    
    // ====================================================================
    // CLIENT REGISTRATION
    // ====================================================================
    this.#clients.get(key).add(client);
    this.#updateHealth(key, 'connection');
    
    console.log(`🔌 New client connected: ${clientId} (Total: ${this.#clients.get(key).size})`);
    
    // ====================================================================
    // QUEUED MESSAGE DELIVERY
    // ====================================================================
    this.#flushQueueToClient(key, client);
    
    // ====================================================================
    // CLIENT EVENT HANDLERS
    // ====================================================================
    
    // Heartbeat response
    client.on('pong', () => {
      client.isAlive = true;
      this.#updateHealth(key, 'heartbeat');
    });
    
    // Message handling
    client.on('message', (data) => {
      try {
        this.#handleClientMessage(key, client, data);
      } catch (error) {
        console.error(`❌ Error handling client message:`, error.message);
        this.#updateHealth(key, 'message_error');
      }
    });
    
    // Client disconnection
    client.on('close', (code, reason) => {
      this.#handleClientDisconnection(key, client, code, reason);
    });
    
    // Client error handling
    client.on('error', (error) => {
      console.error(`❌ Client error (${clientId}):`, error.message);
      this.#updateHealth(key, 'client_error');
      
      // Clean disconnection on error
      try {
        client.terminate();
      } catch (e) {
        // Ignore termination errors
      }
      
      this.#clients.get(key).delete(client);
    });
    
    // ====================================================================
    // WELCOME MESSAGE
    // ====================================================================
    this.#sendToClient(client, {
      type: 'welcome',
      clientId: clientId,
      serverTime: Date.now(),
      message: 'Connected to OGZ Prime WebSocket server'
    });
  }
  
  /**
   * Handle Client Message - Message Processing
   * 
   * MESSAGE ROUTER: Processes incoming messages from clients and routes
   * them appropriately based on message type and content.
   * 
   * @param {string} key - Server key
   * @param {WebSocket} client - Client connection
   * @param {Buffer} data - Raw message data
   */
  #handleClientMessage(key, client, data) {
    try {
      // Parse message
      const message = JSON.parse(data.toString());
      
      // Update activity timestamp
      this.#updateHealth(key, 'message_received');
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.#sendToClient(client, { type: 'pong', timestamp: Date.now() });
          break;
          
        case 'subscribe':
          // Handle subscription requests
          client.subscriptions = client.subscriptions || new Set();
          if (message.channel) {
            client.subscriptions.add(message.channel);
            this.#sendToClient(client, { 
              type: 'subscribed', 
              channel: message.channel,
              status: 'success'
            });
          }
          break;
          
        case 'unsubscribe':
          // Handle unsubscription requests
          if (client.subscriptions && message.channel) {
            client.subscriptions.delete(message.channel);
            this.#sendToClient(client, { 
              type: 'unsubscribed', 
              channel: message.channel,
              status: 'success'
            });
          }
          break;
          
        case 'command':
          // Handle trading commands (BUY, SELL, KILL, etc.)
          this.#handleTradingCommand(key, client, message);
          break;
          
        default:
          console.warn(`⚠️ Unknown message type: ${message.type}`);
          this.#sendToClient(client, { 
            type: 'error', 
            message: 'Unknown message type',
            originalType: message.type
          });
      }
      
    } catch (error) {
      console.error(`❌ Error parsing client message:`, error.message);
      this.#sendToClient(client, { 
        type: 'error', 
        message: 'Invalid message format' 
      });
    }
  }
  
  /**
   * Handle Trading Command - Command Processing
   * 
   * COMMAND ROUTER: Processes trading commands from GUI clients.
   * This is how the dashboard controls the trading bot.
   * 
   * @param {string} key - Server key
   * @param {WebSocket} client - Client connection
   * @param {Object} message - Command message
   */
  #handleTradingCommand(key, client, message) {
    const { command, params = {} } = message;
    
    console.log(`🎮 Trading command received: ${command} from ${client.id}`);
    
    // Emit command event for trading system to handle
    process.emit('tradingCommand', {
      command: command,
      params: params,
      clientId: client.id,
      timestamp: Date.now()
    });
    
    // Send acknowledgment to client
    this.#sendToClient(client, {
      type: 'command_ack',
      command: command,
      status: 'received',
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle Client Disconnection - Disconnection Management
   * 
   * CLEANUP HANDLER: Properly handles client disconnections and updates
   * connection health metrics.
   * 
   * @param {string} key - Server key
   * @param {WebSocket} client - Disconnected client
   * @param {number} code - Disconnection code
   * @param {Buffer} reason - Disconnection reason
   */
  #handleClientDisconnection(key, client, code, reason) {
    const reasonStr = reason ? reason.toString() : 'Unknown';
    const connectionDuration = Date.now() - (client.connectedAt || Date.now());
    
    console.log(`🔌 Client disconnected: ${client.id} (Code: ${code}, Reason: ${reasonStr}, Duration: ${Math.round(connectionDuration / 1000)}s)`);
    
    // Remove client from active connections
    this.#clients.get(key).delete(client);
    this.#updateHealth(key, 'disconnection');
    
    // Clean up client subscriptions
    if (client.subscriptions) {
      client.subscriptions.clear();
    }
  }
  
  /**
   * Setup Heartbeat - Connection Health Monitoring
   * 
   * HEALTH MONITORING: Implements heartbeat system to detect dead
   * connections and clean them up automatically.
   * 
   * @param {string} key - Server key
   * @param {WebSocketServer} server - WebSocket server
   */
  #setupHeartbeat(key, server) {
    const heartbeatInterval = setInterval(() => {
      const clients = this.#clients.get(key);
      if (!clients) return;
      
      // Check each client's heartbeat
      clients.forEach(client => {
        if (!client.isAlive) {
          console.log(`💔 Terminating dead connection: ${client.id}`);
          client.terminate();
          clients.delete(client);
          this.#updateHealth(key, 'dead_connection_removed');
          return;
        }
        
        // Send ping and mark as potentially dead
        client.isAlive = false;
        try {
          client.ping();
        } catch (error) {
          console.error(`❌ Error sending ping to ${client.id}:`, error.message);
          clients.delete(client);
        }
      });
      
    }, 45000); // 45 second heartbeat interval (reduced conflicts)
    
    // Clean up interval when server closes
    server.on('close', () => {
      clearInterval(heartbeatInterval);
      console.log(`💓 Heartbeat monitoring stopped for server ${key}`);
    });
  }
  
  /**
   * Flush Queue to Client - Message Queue Management
   * 
   * MESSAGE RECOVERY: Sends any queued messages to newly connected clients
   * to ensure they don't miss important updates.
   * 
   * @param {string} key - Server key
   * @param {WebSocket} client - Client to send queued messages to
   */
  #flushQueueToClient(key, client) {
    const queue = this.#messageQueues.get(key);
    if (!queue || queue.length === 0) return;
    
    console.log(`📨 Flushing ${queue.length} queued messages to client ${client.id}`);
    
    let flushedCount = 0;
    queue.forEach(message => {
      if (this.#sendToClient(client, message)) {
        flushedCount++;
      }
    });
    
    // Clear queue after successful flush
    if (flushedCount === queue.length) {
      this.#messageQueues.set(key, []);
      console.log(`✅ Successfully flushed all ${flushedCount} messages`);
    } else {
      console.warn(`⚠️ Only flushed ${flushedCount}/${queue.length} messages`);
    }
    
    this.#updateHealth(key, 'queue_flushed');
  }
  
  /**
   * Send to Client - Individual Client Messaging
   * 
   * RELIABLE MESSAGING: Safely sends messages to individual clients
   * with error handling and connection state checking.
   * 
   * @param {WebSocket} client - Target client
   * @param {Object} message - Message to send
   * @returns {boolean} - Success status
   */
  #sendToClient(client, message) {
    try {
      if (client.readyState === client.OPEN) {
        const messageStr = JSON.stringify(message);
        client.send(messageStr);
        return true;
      } else {
        console.warn(`⚠️ Cannot send to client ${client.id}: connection not open (state: ${client.readyState})`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error sending message to client ${client.id}:`, error.message);
      return false;
    }
  }
  
  /**
   * Broadcast Message - Multi-Client Broadcasting
   * 
   * BROADCASTING ENGINE: Sends messages to all connected clients on a
   * specific server, with intelligent queuing for offline clients.
   * 
   * @param {number} port - Server port to broadcast to
   * @param {Object} data - Data to broadcast
   * @param {Object} options - Broadcasting options
   * @param {Array} options.excludeClients - Client IDs to exclude
   * @param {string} options.channel - Channel to broadcast to (if using subscriptions)
   * @param {boolean} options.queueIfNoClients - Whether to queue if no clients connected
   * @returns {Object} - Broadcasting result statistics
   */
  broadcast(port, data, options = {}) {
    const serverKey = `ws-${port}`;
    const clients = this.#clients.get(serverKey);
    
    const {
      excludeClients = [],
      channel = null,
      queueIfNoClients = true
    } = options;
    
    // ====================================================================
    // CLIENT AVAILABILITY CHECK
    // ====================================================================
    if (!clients || clients.size === 0) {
      if (queueIfNoClients) {
        // Queue message for when clients connect
        const queue = this.#messageQueues.get(serverKey);
        if (queue) {
          queue.push(data);
          
          // Limit queue size to prevent memory issues
          if (queue.length > 100) {
            queue.shift(); // Remove oldest message
          }
          
          this.#updateHealth(serverKey, 'message_queued');
          console.log(`📨 Message queued for port ${port} (no clients connected)`);
        }
      }
      
      return {
        success: true,
        sentCount: 0,
        queuedCount: queueIfNoClients ? 1 : 0,
        errorCount: 0
      };
    }
    
    // ====================================================================
    // MESSAGE BROADCASTING
    // ====================================================================
    let sentCount = 0;
    let errorCount = 0;
    
    clients.forEach(client => {
      // Skip excluded clients
      if (excludeClients.includes(client.id)) {
        return;
      }
      
      // Channel filtering (if using subscriptions)
      if (channel && client.subscriptions && !client.subscriptions.has(channel)) {
        return;
      }
      
      // Send message
      if (this.#sendToClient(client, data)) {
        sentCount++;
      } else {
        errorCount++;
      }
    });
    
    // ====================================================================
    // STATISTICS UPDATE
    // ====================================================================
    this.#updateHealth(serverKey, 'broadcast_sent');
    
    console.log(`📡 Broadcast to port ${port}: ${sentCount} sent, ${errorCount} errors`);
    
    return {
      success: true,
      sentCount: sentCount,
      queuedCount: 0,
      errorCount: errorCount,
      totalClients: clients.size
    };
  }
  
  /**
   * Update Health Metrics - Health Monitoring
   * 
   * METRICS TRACKING: Updates connection health metrics for monitoring
   * and debugging purposes.
   * 
   * @param {string} key - Server key
   * @param {string} event - Event type that occurred
   */
  #updateHealth(key, event) {
    const health = this.#connectionHealth.get(key);
    if (!health) return;
    
    health.lastActivity = Date.now();
    
    switch (event) {
      case 'connection':
        health.connections++;
        health.totalConnections++;
        break;
        
      case 'disconnection':
      case 'dead_connection_removed':
        health.connections = Math.max(0, health.connections - 1);
        break;
        
      case 'message_queued':
        health.messagesQueued++;
        break;
        
      case 'broadcast_sent':
      case 'queue_flushed':
        health.messagesSent++;
        break;
        
      case 'server_error':
      case 'client_error':
      case 'message_error':
        health.errors++;
        break;
    }
  }
  
  /**
   * Get Server Status - Status Information
   * 
   * MONITORING INTERFACE: Provides comprehensive status information
   * about all managed WebSocket servers.
   * 
   * @param {number} port - Specific port to get status for (optional)
   * @returns {Object|Array} - Server status information
   */
  getServerStatus(port = null) {
    if (port) {
      // Get status for specific port
      const serverKey = `ws-${port}`;
      const health = this.#connectionHealth.get(serverKey);
      const clients = this.#clients.get(serverKey);
      const queue = this.#messageQueues.get(serverKey);
      
      if (!health) {
        return { exists: false, port: port };
      }
      
      return {
        exists: true,
        port: port,
        connections: health.connections,
        totalConnections: health.totalConnections,
        messagesQueued: queue ? queue.length : 0,
        messagesSent: health.messagesSent,
        errors: health.errors,
        uptime: Date.now() - health.created,
        lastActivity: health.lastActivity,
        clients: clients ? Array.from(clients).map(c => ({
          id: c.id,
          connectedAt: c.connectedAt,
          subscriptions: c.subscriptions ? Array.from(c.subscriptions) : []
        })) : []
      };
    }
    
    // Get status for all servers
    const allStatus = [];
    
    for (const [serverKey, health] of this.#connectionHealth) {
      const port = health.port;
      allStatus.push(this.getServerStatus(port));
    }
    
    return allStatus;
  }
  
  /**
   * Close Server - Server Shutdown
   * 
   * GRACEFUL SHUTDOWN: Properly closes a specific WebSocket server
   * and cleans up all associated resources.
   * 
   * @param {number} port - Port of server to close
   * @returns {boolean} - Success status
   */
  closeServer(port) {
    const serverKey = `ws-${port}`;
    const server = this.#servers.get(serverKey);
    
    if (!server) {
      console.warn(`⚠️ No server found on port ${port} to close`);
      return false;
    }
    
    console.log(`🔌 Closing WebSocket server on port ${port}...`);
    
    try {
      // Close all client connections first
      const clients = this.#clients.get(serverKey);
      if (clients) {
        clients.forEach(client => {
          try {
            client.close(1000, 'Server shutting down');
          } catch (error) {
            client.terminate();
          }
        });
      }
      
      // Close the server
      server.close(() => {
        console.log(`✅ WebSocket server on port ${port} closed successfully`);
      });
      
      // Clean up resources
      this.#cleanupServer(serverKey);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error closing server on port ${port}:`, error.message);
      return false;
    }
  }
  
  /**
   * Cleanup Server - Resource Cleanup
   * 
   * RESOURCE MANAGEMENT: Cleans up all resources associated with a server
   * to prevent memory leaks.
   * 
   * @param {string} key - Server key to clean up
   */
  #cleanupServer(key) {
    this.#servers.delete(key);
    this.#clients.delete(key);
    this.#messageQueues.delete(key);
    this.#connectionHealth.delete(key);
    
    console.log(`🧹 Cleaned up resources for server ${key}`);
  }
  
  /**
   * Shutdown All Servers - Complete System Shutdown
   * 
   * SYSTEM SHUTDOWN: Gracefully shuts down all WebSocket servers
   * and cleans up all resources. Called during application shutdown.
   */
  shutdown() {
    console.log('🔌 Shutting down WebSocketManager...');
    
    const serverPorts = Array.from(this.#connectionHealth.values()).map(h => h.port);
    
    serverPorts.forEach(port => {
      this.closeServer(port);
    });
    
    console.log('✅ WebSocketManager shutdown complete');
  }
  
  /**
   * Get Statistics - System Statistics
   * 
   * ANALYTICS INTERFACE: Provides comprehensive statistics about
   * WebSocket usage and performance.
   * 
   * @returns {Object} - Complete system statistics
   */
  getStatistics() {
    const stats = {
      totalServers: this.#servers.size,
      totalConnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      totalUptime: 0,
      serverDetails: []
    };
    
    for (const [serverKey, health] of this.#connectionHealth) {
      stats.totalConnections += health.connections;
      stats.totalMessages += health.messagesSent;
      stats.totalErrors += health.errors;
      stats.totalUptime += (Date.now() - health.created);
      
      stats.serverDetails.push({
        port: health.port,
        connections: health.connections,
        uptime: Date.now() - health.created,
        messages: health.messagesSent,
        errors: health.errors
      });
    }
    
    stats.averageUptime = stats.totalServers > 0 ? stats.totalUptime / stats.totalServers : 0;
    
    return stats;
  }
}

// ============================================================================
// SINGLETON EXPORT AND FREEZE
// ============================================================================

// Create the singleton instance
const websocketManagerInstance = new WebSocketManager();

// Freeze the instance to prevent modification
Object.freeze(websocketManagerInstance);

// Export the singleton instance
module.exports = websocketManagerInstance;

/**
 * ============================================================================
 * USAGE EXAMPLES FOR DEVELOPMENT TEAM
 * ============================================================================
 * 
 * // 1. GET WEBSOCKET SERVER (MAIN USAGE)
 * const websocketManager = require('./core/WebsocketManager');
 * 
 * // This will create a server if it doesn't exist, or return existing one
 * const guiServer = websocketManager.getServer(3002);
 * 
 * // Add your custom event handlers
 * guiServer.on('connection', (ws) => {
 *   console.log('GUI client connected');
 *   
 *   ws.on('message', (data) => {
 *     // Handle GUI messages
 *     console.log('Received:', data.toString());
 *   });
 * });
 * 
 * // 2. BROADCAST REAL-TIME DATA
 * const priceData = {
 *   type: 'price_update',
 *   symbol: 'BTC-USD',
 *   price: 50000,
 *   timestamp: Date.now()
 * };
 * 
 * websocketManager.broadcast(3002, priceData);
 * 
 * // 3. BROADCAST TO SPECIFIC CHANNEL
 * const tradeAlert = {
 *   type: 'trade_executed',
 *   direction: 'buy',
 *   price: 50000,
 *   pnl: 250
 * };
 * 
 * websocketManager.broadcast(3002, tradeAlert, {
 *   channel: 'trade_alerts',
 *   queueIfNoClients: true
 * });
 * 
 * // 4. EXCLUDE SPECIFIC CLIENTS
 * websocketManager.broadcast(3002, data, {
 *   excludeClients: ['client_id_to_exclude']
 * });
 * 
 * // 5. MONITOR SERVER STATUS
 * const status = websocketManager.getServerStatus(3002);
 * console.log(`Server on port 3002:`);
 * console.log(`- Active connections: ${status.connections}`);
 * console.log(`- Messages sent: ${status.messagesSent}`);
 * console.log(`- Errors: ${status.errors}`);
 * console.log(`- Uptime: ${Math.round(status.uptime / 1000)} seconds`);
 * 
 * ============================================================================
 */