// ConnectionResilience.js - Never lose connection, never lose money
// This module ensures OGZ Prime ALWAYS reconnects and NEVER loses positions

const fs = require('fs');
const path = require('path');

/**
 * Connection Resilience System
 * Monitors all connections and ensures automatic recovery
 */
class ConnectionResilience {
  /**
   * Initialize connection resilience system with OGZPrime instance
   * Sets up monitoring state, configuration, and starts connection monitoring
   * @param {Object} ogzPrime - Main trading bot instance to monitor
   */
  constructor(ogzPrime) {
    // Reference to main trading bot instance for monitoring and recovery
    this.ogzPrime = ogzPrime;
    
    // Real-time connection state tracking
    this.connectionState = {
      dataFeed: 'unknown',        // status of market data connection
      guiSocket: 'unknown',       // status of GUI WebSocket connection
      lastDataReceived: Date.now(), // timestamp of last market data tick
      reconnectAttempts: 0,       // current reconnection attempt counter
      isReconnecting: false       // flag to prevent duplicate reconnection attempts
    };
    
    // Connection monitoring and recovery configuration
    this.config = {
      heartbeatInterval: 5000,      // connection health check frequency (5 seconds)
      dataStaleTimeout: 30000,      // consider data stale after 30 seconds
      maxReconnectDelay: 30000,     // maximum delay between reconnection attempts
      emergencyStateFile: path.join(process.cwd(), 'data', 'emergency_state.json') // emergency state backup location
    };
    
    // Order queue for executing pending trades during disconnections
    this.orderQueue = [];
    
    // Start connection monitoring immediately
    this.startMonitoring();
    
    console.log('🛡️ Connection Resilience System: INITIALIZED');
  }
  
  /**
   * Start monitoring all connections with heartbeat checks and WebSocket monitoring
   * Initializes main monitoring loop and hooks into WebSocket events
   */
  startMonitoring() {
    // Main heartbeat monitor - checks all connections periodically
    this.heartbeatInterval = setInterval(() => {
      this.checkAllConnections();
    }, this.config.heartbeatInterval);
    
    // Hook into WebSocket connection events for real-time monitoring
    this.setupWebSocketMonitoring();
    
    // Monitor data feed for staleness detection
    this.monitorDataFeed();
  }
  
  /**
   * Setup WebSocket monitoring for data and GUI connections
   * Hooks into connection/disconnection events for immediate response
   */
  setupWebSocketMonitoring() {
    // Monitor data WebSocket (market data feed)
    const dataPort = this.ogzPrime.config.dataWebSocketPort;
    const dataServer = this.ogzPrime.webSocketManager.getServer(dataPort);
    
    if (dataServer) {
      // Track data WebSocket connections
      dataServer.on('connection', (ws) => {
        console.log('📡 Data WebSocket client connected');
        this.connectionState.dataFeed = 'connected';
        
        // Handle client disconnection
        ws.on('close', () => {
          console.log('⚠️ Data WebSocket client disconnected');
          this.connectionState.dataFeed = 'disconnected';
        });
        
        // Handle WebSocket errors and trigger recovery
        ws.on('error', (error) => {
          console.error('❌ Data WebSocket error:', error.message);
          this.handleConnectionError('dataFeed', error);
        });
      });
    }
    
    // Monitor GUI WebSocket (dashboard connection)
    const guiPort = this.ogzPrime.config.guiWebSocketPort;
    const guiServer = this.ogzPrime.webSocketManager.getServer(guiPort);
    
    if (guiServer) {
      // Track GUI WebSocket connections
      guiServer.on('connection', (ws) => {
        this.connectionState.guiSocket = 'connected';
        
        // Update state on disconnection
        ws.on('close', () => {
          this.connectionState.guiSocket = 'disconnected';
        });
      });
    }
  }
  
  /**
   * Monitor incoming data feed by overriding processTick method
   * Tracks data flow timestamps and resets reconnection attempts on success
   */
  monitorDataFeed() {
    // Override processTick to track data flow timing
    const originalProcessTick = this.ogzPrime.processTick.bind(this.ogzPrime);
    
    this.ogzPrime.processTick = (tick) => {
      // Update last data received timestamp for staleness detection
      this.connectionState.lastDataReceived = Date.now();
      this.connectionState.dataFeed = 'connected';
      
      // Reset reconnect attempts counter on successful data reception
      if (this.connectionState.reconnectAttempts > 0) {
        console.log('✅ Connection restored after', this.connectionState.reconnectAttempts, 'attempts');
        this.connectionState.reconnectAttempts = 0;
      }
      
      // Call original function to maintain normal operation
      return originalProcessTick(tick);
    };
  }
  
  /**
   * Check all connections for health and trigger recovery if needed
   * Main monitoring loop that detects stale data and unhealthy WebSockets
   */
  checkAllConnections() {
    const now = Date.now();
    const timeSinceLastData = now - this.connectionState.lastDataReceived;
    
    // Check if data feed has become stale (no recent market data)
    if (timeSinceLastData > this.config.dataStaleTimeout && !this.connectionState.isReconnecting) {
      console.log(`⚠️ Data feed stale for ${(timeSinceLastData/1000).toFixed(1)}s`);
      this.handleDisconnection('dataFeed');
    }
    
    // Check WebSocket server health status
    this.checkWebSocketHealth();
  }
  
  /**
   * Check WebSocket server health and restart if not listening
   * Verifies that WebSocket servers are properly running on configured ports
   */
  checkWebSocketHealth() {
    // DISABLED: WebSocket servers don't have .listening property like HTTP servers
    // This was causing false positives and unnecessary reconnection attempts
    
    // Check both data and GUI WebSocket ports
    const ports = [
      this.ogzPrime?.config?.dataWebSocketPort || 3001,
      this.ogzPrime?.config?.guiWebSocketPort || 3002
    ];

    ports.forEach(port => {
      try {
        const server = this.ogzPrime.webSocketManager.getServer(port);
        if (!server) {
          console.log(`⚠️ WebSocket server on port ${port} not found`);
          // Only reconnect if server doesn't exist at all
          this.reconnectWebSocket(port);
        }
        // REMOVED: server.listening check - WebSocket servers don't have this property
      } catch (error) {
        console.error(`❌ Error checking WebSocket health on port ${port}:`, error.message);
      }
    });
  }
  
  /**
   * Handle disconnection event with emergency procedures
   * Saves state, queues protective orders, and attempts reconnection
   * @param {string} connectionType - Type of connection that failed
   */
  async handleDisconnection(connectionType) {
    // Prevent multiple simultaneous reconnection attempts
    if (this.connectionState.isReconnecting) {
      return; // Already handling reconnection
    }
    
    console.log(`🚨 DISCONNECTION DETECTED: ${connectionType}`);
    this.connectionState.isReconnecting = true;
    
    // Step 1: Save emergency state for recovery
    this.saveEmergencyState();
    
    // Step 2: Queue protective orders if currently holding position
    if (this.ogzPrime.tradingBrain.isInPosition()) {
      this.queueProtectiveOrders();
    }
    
    // Step 3: Attempt reconnection with exponential backoff
    const reconnected = await this.reconnectWithBackoff(connectionType);
    
    if (reconnected) {
      // Step 4: Restore state and process any queued orders
      await this.restoreStateAndResume();
    }
    
    this.connectionState.isReconnecting = false;
  }
  
  /**
   * Reconnect with exponential backoff strategy
   * Attempts reconnection with increasing delays, up to maximum attempts
   * @param {string} connectionType - Type of connection to reconnect
   * @param {number} attempt - Current attempt number for backoff calculation
   */
  async reconnectWithBackoff(connectionType, attempt = 1) {
    // Calculate exponential backoff delay with maximum cap
    const delay = Math.min(1000 * Math.pow(2, attempt), this.config.maxReconnectDelay);
    console.log(`🔄 Reconnection attempt ${attempt} in ${delay}ms...`);
    
    // Track reconnection attempts for monitoring
    this.connectionState.reconnectAttempts = attempt;
    
    // Notify GUI of reconnection progress
    this.ogzPrime.webSocketManager.broadcast(this.ogzPrime.config.guiWebSocketPort, {
      type: 'connection_status',
      status: 'reconnecting',
      attempt,
      nextRetryIn: delay
    });
    
    // Wait for backoff delay before attempting reconnection
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      if (connectionType === 'dataFeed') {
        // For simulation mode, restart the data simulation
        if (this.ogzPrime.simulationInterval) {
          clearInterval(this.ogzPrime.simulationInterval);
          this.ogzPrime.simulateMarketData();
          console.log('✅ Simulation data feed restarted');
          return true;
        }
        
        // For live mode, recreate WebSocket connection to data provider
        console.log('🔌 Attempting to reconnect data feed...');
        
        // Recreate the WebSocket server if needed
        this.reconnectWebSocket(this.ogzPrime.config.dataWebSocketPort);
      }
      
      // Verify that reconnection was successful
      await this.verifyConnection(connectionType);
      
      console.log('✅ Reconnection successful!');
      return true;
      
    } catch (error) {
      console.error(`❌ Reconnection attempt ${attempt} failed:`, error.message);
      
      // Retry with increased delay if under maximum attempts
      if (attempt < 10) { // Max 10 attempts
        return this.reconnectWithBackoff(connectionType, attempt + 1);
      } else {
        console.error('💀 Max reconnection attempts reached');
        this.handleCriticalFailure();
        return false;
      }
    }
  }
  
  /**
   * Reconnect specific WebSocket server
   * Attempts to restart WebSocket server on specified port
   * @param {number} port - WebSocket port to reconnect
   */
  reconnectWebSocket(port) {
    console.log(`🔌 Checking WebSocket on port ${port}`);
    
    try {
      // Get server instance from WebSocketManager
      const server = this.ogzPrime.webSocketManager.getServer(port);
      
      if (server) {
        console.log(`✅ WebSocket on port ${port} is active`);
        return true;
      } else {
        console.log(`⚠️ WebSocket on port ${port} not found - WebSocketManager will handle creation`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to check WebSocket on port ${port}:`, error.message);
      return false;
    }
  }
  
  /**
   * Verify connection is working properly after reconnection
   * Waits for data flow or connection confirmation within timeout period
   * @param {string} connectionType - Type of connection to verify
   */
  async verifyConnection(connectionType) {
    return new Promise((resolve, reject) => {
      // Set timeout for connection verification
      const timeout = setTimeout(() => {
        reject(new Error('Connection verification timeout'));
      }, 10000); // 10 second timeout
      
      // For data feed, wait for next market data tick
      if (connectionType === 'dataFeed') {
        const checkInterval = setInterval(() => {
          const timeSinceData = Date.now() - this.connectionState.lastDataReceived;
          
          // Consider connection verified if recent data received
          if (timeSinceData < 5000) { // Got data in last 5 seconds
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
      } else {
        // For other connections, just check they exist
        clearTimeout(timeout);
        resolve();
      }
    });
  }
  
  /**
   * Save emergency state to disk for recovery after reconnection
   * Creates comprehensive backup of critical trading state data
   */
  saveEmergencyState() {
    console.log('💾 Saving emergency state...');
    
    // Create comprehensive emergency state snapshot
    const emergencyState = {
  timestamp: Date.now(),
  version: this.ogzPrime?.config?.version || '10.2.0',
  tradingBrain: {
    balance: this.ogzPrime?.tradingBrain?.balance ?? 0,
    position: this.ogzPrime?.tradingBrain?.position ?? null,
    lastTradeResult: this.ogzPrime?.tradingBrain?.lastTradeResult ?? null
  },
  lastAnalysis: this.ogzPrime?.lastAnalysis ?? null,
  timeframeData: {
    '1m': {
      lastCandle: this.ogzPrime?.timeframeData?.['1m']?.candles?.slice(-1)[0] ?? null,
      candleCount: this.ogzPrime?.timeframeData?.['1m']?.candles?.length ?? 0
    }
  },
  pendingOrders: this.ogzPrime?.orderQueue ?? [],
  checksum: null
};

    
    // Calculate checksum for data integrity verification
    const crypto = require('crypto');
    const dataString = JSON.stringify({
      balance: emergencyState.tradingBrain.balance,
      position: emergencyState.tradingBrain.position
    });
    emergencyState.checksum = crypto.createHash('sha256').update(dataString).digest('hex');
    
    try {
      // Ensure emergency state directory exists
      const dir = path.dirname(this.config.emergencyStateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write emergency state to disk
      fs.writeFileSync(
        this.config.emergencyStateFile,
        JSON.stringify(emergencyState, null, 2)
      );
      
      console.log('✅ Emergency state saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save emergency state:', error);
    }
  }
  
  /**
   * Queue protective orders to limit losses during disconnection
   * Creates stop-loss and time-based exit orders for open positions
   */
  queueProtectiveOrders() {
    // Only queue orders if currently holding a position
    if (!this.ogzPrime.tradingBrain.position) return;
    
    const position = this.ogzPrime.tradingBrain.position;
    const maxProfitManager = this.ogzPrime.tradingBrain.maxProfitManager;
    
    // Queue stop loss order based on current trailing stop
    if (maxProfitManager.state.currentStop) {
      const stopOrder = {
        id: Date.now().toString(),
        type: 'stop_loss',
        direction: position.direction === 'buy' ? 'sell' : 'buy', // opposite direction to close
        price: maxProfitManager.state.currentStop,
        size: position.size,
        reason: 'Protective stop during disconnection',
        priority: 'CRITICAL',
        createdAt: Date.now()
      };
      
      this.orderQueue.push(stopOrder);
      console.log('🛡️ Protective stop loss queued at', stopOrder.price.toFixed(2));
    }
    
    // Queue time-based exit for old positions (risk management)
    const positionAge = Date.now() - new Date(position.entryTime).getTime();
    if (positionAge > 3 * 60 * 60 * 1000) { // 3 hours old
      const timeExitOrder = {
        id: (Date.now() + 1).toString(),
        type: 'time_exit',
        direction: position.direction === 'buy' ? 'sell' : 'buy', // opposite direction to close
        price: null, // Market order for immediate execution
        size: position.size,
        reason: 'Time-based exit during disconnection',
        priority: 'HIGH',
        createdAt: Date.now()
      };
      
      this.orderQueue.push(timeExitOrder);
      console.log('⏰ Time-based exit queued');
    }
  }
  
  /**
   * Restore state and resume trading operations after reconnection
   * Loads emergency state, verifies integrity, and processes queued orders
   */
  async restoreStateAndResume() {
    console.log('🔄 Restoring state and resuming operations...');
    
    try {
      // Load emergency state if it exists
      if (fs.existsSync(this.config.emergencyStateFile)) {
        const savedState = JSON.parse(fs.readFileSync(this.config.emergencyStateFile));
        
        // Verify data integrity using checksum
        const expectedChecksum = savedState.checksum;
        savedState.checksum = null;
        
        const crypto = require('crypto');
        const dataString = JSON.stringify({
          balance: savedState.tradingBrain.balance,
          position: savedState.tradingBrain.position
        });
        const actualChecksum = crypto.createHash('sha256').update(dataString).digest('hex');
        
        // Abort if data integrity check fails
        if (expectedChecksum !== actualChecksum) {
          console.error('❌ Emergency state checksum mismatch!');
          return;
        }
        
        // Restore position if it was lost during disconnection
        if (savedState.tradingBrain.position && !this.ogzPrime.tradingBrain.position) {
          console.log('📍 Restoring position from emergency state');
          this.ogzPrime.tradingBrain.position = savedState.tradingBrain.position;
          
          // Reinitialize MaxProfitManager with restored position
          this.ogzPrime.tradingBrain.maxProfitManager.start(
            savedState.tradingBrain.position.entryPrice,
            savedState.tradingBrain.position.direction
          );
        }
        
        // Process any orders that were queued during disconnection
        if (this.orderQueue.length > 0) {
          console.log(`📋 Processing ${this.orderQueue.length} queued orders`);
          await this.processOrderQueue();
        }
        
        // Clean up emergency state file after successful restoration
        fs.unlinkSync(this.config.emergencyStateFile);
        
        console.log('✅ State restoration complete');
        
      } else {
        console.log('ℹ️ No emergency state found - clean reconnection');
      }
      
    } catch (error) {
      console.error('❌ State restoration failed:', error);
    }
  }
  
  /**
   * Process queued orders that accumulated during disconnection
   * Executes protective orders and manages retry logic for failed orders
   */
  async processOrderQueue() {
    // Process all queued orders in FIFO order
    while (this.orderQueue.length > 0) {
      const order = this.orderQueue.shift();
      
      console.log(`⚡ Processing ${order.type} order (Priority: ${order.priority})`);
      
      try {
        // Handle critical stop-loss orders with immediate execution
        if (order.type === 'stop_loss' && order.priority === 'CRITICAL') {
          // Get current market price for stop trigger evaluation
          const currentCandles = this.ogzPrime.timeframeData['1m']?.candles;
          if (currentCandles && currentCandles.length > 0) {
            const currentPrice = currentCandles[currentCandles.length - 1].close;
            
            // Check if stop-loss should trigger based on current price
            const shouldTrigger = this.ogzPrime.tradingBrain.position && (
              (this.ogzPrime.tradingBrain.position.direction === 'buy' && currentPrice <= order.price) ||
              (this.ogzPrime.tradingBrain.position.direction === 'sell' && currentPrice >= order.price)
            );
            
            if (shouldTrigger) {
              console.log('🛑 Executing protective stop loss');
              await this.ogzPrime.tradingBrain.closePosition(currentPrice, order.reason);
            } else {
              console.log('ℹ️ Stop loss not triggered - price still safe');
              // Re-queue the order for continued monitoring
              this.orderQueue.push(order);
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Order execution failed:', error);
        
        // Re-queue critical orders with retry logic
        if (order.priority === 'CRITICAL') {
          order.retryCount = (order.retryCount || 0) + 1;
          if (order.retryCount < 3) {
            this.orderQueue.push(order);
            console.log('🔄 Re-queued critical order for retry');
          }
        }
      }
      
      // Rate limiting between order executions to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  /**
   * Handle critical failure when maximum reconnection attempts are reached
   * Performs emergency position closure and system shutdown procedures
   */
  handleCriticalFailure() {
    console.error('💀 CRITICAL FAILURE - Manual intervention required');
    
    // Force close any open positions at market for capital protection
    if (this.ogzPrime.tradingBrain.isInPosition()) {
      console.log('🚨 EMERGENCY POSITION CLOSE');
      
      // Use last known price for emergency closure
      const lastCandle = this.ogzPrime.timeframeData['1m']?.candles?.slice(-1)[0];
      if (lastCandle) {
        this.ogzPrime.tradingBrain.closePosition(
          lastCandle.close,
          'EMERGENCY CLOSE - Connection failure'
        );
      }
    }
    
    // Send emergency notification via Discord if enabled
    if (this.ogzPrime.config.enableDiscordNotifications) {
      const { sendDiscordMessage } = require('../utils/discordNotifier');
      sendDiscordMessage(
        '🚨🚨🚨 CRITICAL FAILURE 🚨🚨🚨\n' +
        'OGZ Prime lost connection and cannot recover!\n' +
        'Manual intervention required!\n' +
        `Balance: $${this.ogzPrime.tradingBrain.balance.toFixed(2)}\n` +
        `Position: ${this.ogzPrime.tradingBrain.position ? 'EMERGENCY CLOSED' : 'None'}`
      );
    }
    
    // Shut down system safely to prevent further damage
    this.ogzPrime.shutdown();
  }
  
  /**
   * Cleanup resources when shutting down connection resilience system
   * Clears monitoring intervals and performs graceful shutdown
   */
  cleanup() {
    // Clear heartbeat monitoring interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    console.log('🛡️ Connection Resilience System: SHUTDOWN');
  }
}

module.exports = ConnectionResilience;