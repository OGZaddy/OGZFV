/**
 * @fileoverview PolygonWebSocket - Bulletproof Polygon.io Connection
 * @description Handles Polygon.io crypto data feed without crashing the main bot
 * @version 2.0.0 - CASCADE-PROOF EDITION
 * @author OGZ Prime Development Team
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class PolygonWebSocket extends EventEmitter {
  constructor(onTick) {
    super();
    
    this.onTick = onTick;
    this.apiKey = process.env.POLYGON_API_KEY;
    this.socket = null;
    this.isAuthenticated = false;
    this.isIntentionalDisconnect = false;
    
    // Reconnection settings
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 60000;
    
    // Connection state
    this.connectionState = 'disconnected';
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = null;
    this.reconnectTimer = null;
    
    // Data validation
    this.lastPrice = 0;
    this.priceChangeThreshold = 0.20; // 20% max price change
    
    console.log('🔌 PolygonWebSocket initialized - CASCADE-PROOF VERSION');
  }

  /**
   * Connect to Polygon.io with full error protection
   */
  async connect() {
    // Prevent multiple simultaneous connections
    if (this.connectionState === 'connecting') {
      console.log('⚠️ Already connecting to Polygon - skipping duplicate request');
      return;
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('✅ Already connected to Polygon');
      return;
    }
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.connectionState = 'connecting';
    this.isIntentionalDisconnect = false;
    
    try {
      console.log('🔗 Connecting to Polygon.io WebSocket...');
      
      // Create new WebSocket with options
      this.socket = new WebSocket('wss://socket.polygon.io/crypto', {
        handshakeTimeout: 10000,
        perMessageDeflate: false
      });
      
      // Set up ALL event handlers BEFORE connection
      this.setupEventHandlers();
      
      // Wait for connection with timeout
      await this.waitForConnection();
      
    } catch (error) {
      console.error('❌ Failed to connect to Polygon:', error.message);
      this.connectionState = 'disconnected';
      this.scheduleReconnect();
    }
  }

  /**
   * Set up WebSocket event handlers with error boundaries
   */
  setupEventHandlers() {
    if (!this.socket) return;
    
    // Remove any existing listeners
    this.socket.removeAllListeners();
    
    // Connection opened
    this.socket.on('open', () => {
      console.log('✅ Connected to Polygon WebSocket');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.lastHeartbeat = Date.now();
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      // Authenticate
      this.authenticate();
      
      // Emit connected event
      this.emit('connected');
    });
    
    // Handle messages with error protection
    this.socket.on('message', (data) => {
      try {
        this.lastHeartbeat = Date.now();
        this.handleMessage(data.toString());
      } catch (error) {
        console.error('❌ Error processing Polygon message:', error.message);
        // Don't crash - just log and continue
      }
    });
    
    // Handle errors without crashing
    this.socket.on('error', (error) => {
      console.error('❌ Polygon WebSocket error:', error.message);
      this.emit('error', error);
      // Don't crash - will reconnect automatically
    });
    
    // Handle disconnection
    this.socket.on('close', (code, reason) => {
      console.log(`🔌 Polygon disconnected - Code: ${code}, Reason: ${reason || 'Unknown'}`);
      this.connectionState = 'disconnected';
      this.isAuthenticated = false;
      
      // Stop heartbeat
      this.stopHeartbeat();
      
      // Clear socket reference
      this.socket = null;
      
      // Emit disconnected event
      this.emit('disconnected', { code, reason });
      
      // Only reconnect if not intentional
      if (!this.isIntentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });
  }

  /**
   * Wait for connection with timeout
   */
  async waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
      
      const checkConnection = setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          clearTimeout(timeout);
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Authenticate with Polygon
   */
  async authenticate() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot authenticate - socket not ready');
      return;
    }
    
    console.log('🔐 Authenticating with Polygon...');
    
    try {
      this.socket.send(JSON.stringify({ 
        action: 'auth', 
        params: this.apiKey 
      }));
      
      // Wait for auth confirmation with timeout
      await this.waitForAuth();
      
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      this.scheduleReconnect();
    }
  }

  /**
   * Wait for authentication confirmation
   */
  async waitForAuth() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 5000);
      
      const checkAuth = setInterval(() => {
        if (this.isAuthenticated) {
          clearTimeout(timeout);
          clearInterval(checkAuth);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Subscribe to Bitcoin data
   */
  subscribeToBTC() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot subscribe - socket not ready');
      return;
    }
    
    if (!this.isAuthenticated) {
      console.error('Cannot subscribe - not authenticated');
      return;
    }
    
    console.log('📊 Subscribing to BTC-USD...');
    
    try {
      // Subscribe to trades
      this.socket.send(JSON.stringify({ 
        action: 'subscribe', 
        params: 'XT.X:BTC-USD' 
      }));
      
      // Also subscribe to aggregate data for candles
      this.socket.send(JSON.stringify({ 
        action: 'subscribe', 
        params: 'XA.X:BTC-USD' 
      }));
      
      console.log('✅ Subscribed to BTC-USD data feeds');
      
    } catch (error) {
      console.error('❌ Subscribe error:', error.message);
    }
  }

  /**
   * Handle incoming messages with validation
   */
  handleMessage(data) {
    try {
      const messages = JSON.parse(data);
      
      if (!Array.isArray(messages)) {
        this.handleSingleMessage(messages);
        return;
      }
      
      // Process each message
      for (const msg of messages) {
        this.handleSingleMessage(msg);
      }
      
    } catch (error) {
      console.error('❌ Message parsing error:', error.message);
      // Don't crash - just skip this message
    }
  }

  /**
   * Handle single message
   */
  handleSingleMessage(msg) {
    try {
      // Handle different message types
      switch (msg.ev || msg.status) {
        case 'status':
          this.handleStatusMessage(msg);
          break;
          
        case 'XT': // Trade
          this.handleTradeMessage(msg);
          break;
          
        case 'XA': // Aggregate (candle)
          this.handleAggregateMessage(msg);
          break;
          
        default:
          // Unknown message type - ignore
          break;
      }
    } catch (error) {
      console.error('❌ Error handling message type:', msg.ev || msg.status, error.message);
    }
  }

  /**
   * Handle status messages
   */
  handleStatusMessage(msg) {
    if (msg.status === 'auth_success') {
      this.isAuthenticated = true;
      console.log('✅ Polygon authentication successful');
      this.emit('authenticated');
      
      // Subscribe after auth
      setTimeout(() => this.subscribeToBTC(), 500);
    } else if (msg.status === 'auth_failed') {
      console.error('❌ Polygon authentication failed');
      this.disconnect();
    }
  }

  /**
   * Handle trade messages with validation
   */
  handleTradeMessage(msg) {
    if (!msg.p || !msg.t) return;
    
    const price = parseFloat(msg.p);
    const timestamp = msg.t;
    const volume = parseFloat(msg.s || 0);
    
    // Validate price
    if (isNaN(price) || price <= 0) {
      console.error('❌ Invalid price received:', msg.p);
      return;
    }
    
    // Check for extreme price changes (circuit breaker)
    if (this.lastPrice > 0) {
      const changePercent = Math.abs(price - this.lastPrice) / this.lastPrice;
      if (changePercent > this.priceChangeThreshold) {
        console.error(`❌ Extreme price change detected: ${(changePercent * 100).toFixed(2)}% - Rejecting`);
        return;
      }
    }
    
    this.lastPrice = price;
    
    // Send to callback if provided
    if (this.onTick) {
      this.onTick({ 
        price: price,
        timestamp: timestamp,
        volume: volume,
        source: 'polygon'
      });
    }
    
    // Emit trade event
    this.emit('trade', { price, timestamp, volume });
  }

  /**
   * Handle aggregate/candle messages
   */
  handleAggregateMessage(msg) {
    if (!msg.c || !msg.o || !msg.h || !msg.l) return;
    
    const candle = {
      type: 'candle',
      timestamp: msg.s || Date.now(),
      open: parseFloat(msg.o),
      high: parseFloat(msg.h),
      low: parseFloat(msg.l),
      close: parseFloat(msg.c),
      volume: parseFloat(msg.v || 0),
      source: 'polygon'
    };
    
    // Validate candle data
    if (candle.high < candle.low || candle.close <= 0) {
      console.error('❌ Invalid candle data received');
      return;
    }
    
    // Send candle data
    if (this.onTick) {
      this.onTick(candle);
    }
    
    // Emit candle event
    this.emit('candle', candle);
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing
    
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastHeartbeat;
      
      // If no message for 60 seconds, assume dead connection
      if (timeSinceLastMessage > 60000) {
        console.log('💔 Polygon heartbeat failed - reconnecting');
        this.handleDisconnection();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle disconnection and cleanup
   */
  handleDisconnection() {
    this.connectionState = 'disconnected';
    this.isAuthenticated = false;
    
    // Clean up socket
    if (this.socket) {
      try {
        this.socket.close();
      } catch (error) {
        // Ignore close errors
      }
      this.socket = null;
    }
    
    // Schedule reconnect if not intentional
    if (!this.isIntentionalDisconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached - giving up');
      this.emit('max_reconnects_reached');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Disconnect gracefully
   */
  disconnect() {
    console.log('👋 Disconnecting from Polygon...');
    
    this.isIntentionalDisconnect = true;
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Close socket
    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnect');
      } catch (error) {
        // Ignore errors during disconnect
      }
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.isAuthenticated = false;
    
    console.log('✅ Disconnected from Polygon');
  }

  /**
   * Get current market data for quantum trading system
   */
  getCurrentMarketData() {
    if (!this.isAuthenticated || this.connectionState !== 'connected') {
      throw new Error('Polygon WebSocket not connected or authenticated');
    }
    
    if (!this.lastPrice || this.lastPrice <= 0) {
      throw new Error('No valid price data available from Polygon WebSocket');
    }
    
    return {
      symbol: 'BTC-USD',
      price: this.lastPrice,
      timestamp: Date.now(),
      volume: 0,
      source: 'polygon',
      connected: true,
      lastUpdate: this.lastHeartbeat
    };
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connectionState === 'connected',
      authenticated: this.isAuthenticated,
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      lastPrice: this.lastPrice
    };
  }
}

module.exports = PolygonWebSocket;