/**
 * @fileoverview ConnectionResilience - Smart Connection Recovery System
 * @description Handles disconnections without causing cascades or panic closes
 * @version 2.0.0 - NO-CASCADE EDITION
 * @author OGZ Prime Development Team
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class ConnectionResilience extends EventEmitter {
  constructor(ogzPrime) {
    super();
    
    this.ogzPrime = ogzPrime;
    
    // Configuration with sane defaults
    this.config = {
      checkInterval: 10000,           // Check every 10 seconds
      dataStaleTimeout: 60000,        // 1 minute before considering stale
      maxReconnectAttempts: 5,        // Per connection type
      reconnectDelay: 2000,           // Initial delay
      maxReconnectDelay: 30000,       // Max backoff
      emergencyCloseTimeout: 300000,  // 5 minutes before emergency close
      enableAutoClose: false          // DISABLED by default - no panic!
    };
    
    // Connection tracking
    this.connectionState = {
      dataFeed: { 
        status: 'unknown', 
        lastData: Date.now(),
        reconnectAttempts: 0,
        isReconnecting: false
      },
      guiWebSocket: { 
        status: 'unknown', 
        lastPing: Date.now(),
        reconnectAttempts: 0,
        isReconnecting: false
      },
      controlWebSocket: { 
        status: 'unknown', 
        lastPing: Date.now(),
        reconnectAttempts: 0,
        isReconnecting: false
      }
    };
    
    // Recovery state
    this.emergencyState = null;
    this.ordersQueue = [];
    this.checkInterval = null;
    
    console.log('🛡️ ConnectionResilience initialized - NO-CASCADE VERSION');
  }

  /**
   * Start monitoring connections
   */
  startMonitoring() {
    if (this.checkInterval) {
      console.log('⚠️ Connection monitoring already active');
      return;
    }
    
    console.log('🔍 Starting connection monitoring...');
    
    // Initial check
    this.checkAllConnections();
    
    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllConnections();
    }, this.config.checkInterval);
    
    // Listen to Polygon events if available
    if (this.ogzPrime.polygonSocket) {
      this.setupPolygonListeners();
    }
    
    this.emit('monitoring_started');
  }

  /**
   * Stop monitoring connections
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('🛑 Connection monitoring stopped');
    this.emit('monitoring_stopped');
  }

  /**
   * Setup Polygon WebSocket listeners
   */
  setupPolygonListeners() {
    const polygon = this.ogzPrime.polygonSocket;
    
    polygon.on('connected', () => {
      console.log('✅ Polygon connected - updating resilience state');
      this.updateConnectionState('dataFeed', 'connected');
    });
    
    polygon.on('disconnected', ({ code, reason }) => {
      console.log(`⚠️ Polygon disconnected - Code: ${code}, Reason: ${reason}`);
      this.updateConnectionState('dataFeed', 'disconnected');
      // Don't panic - Polygon will handle its own reconnection
    });
    
    polygon.on('trade', (data) => {
      this.updateDataTimestamp();
    });
    
    polygon.on('candle', (data) => {
      this.updateDataTimestamp();
    });
  }

  /**
   * Update connection state
   */
  updateConnectionState(connection, status) {
    const state = this.connectionState[connection];
    if (state) {
      state.status = status;
      state.lastUpdate = Date.now();
      
      if (status === 'connected') {
        state.reconnectAttempts = 0;
        state.isReconnecting = false;
      }
    }
  }

  /**
   * Update last data timestamp
   */
  updateDataTimestamp() {
    this.connectionState.dataFeed.lastData = Date.now();
  }

  /**
   * Check all connections health
   */
  checkAllConnections() {
    const now = Date.now();
    
    // Check data feed staleness
    const dataState = this.connectionState.dataFeed;
    const timeSinceData = now - dataState.lastData;
    
    if (timeSinceData > this.config.dataStaleTimeout && !dataState.isReconnecting) {
      console.log(`⚠️ Data feed stale for ${(timeSinceData/1000).toFixed(1)}s`);
      this.handleStaleData('dataFeed');
    } else if (timeSinceData < this.config.dataStaleTimeout && dataState.status !== 'connected') {
      // Data is flowing again
      this.updateConnectionState('dataFeed', 'connected');
    }
    
    // Check WebSocket health (non-critical)
    this.checkWebSocketHealth();
    
    // Emit status for monitoring
    this.emit('health_check', this.getHealthStatus());
  }

  /**
   * Check WebSocket server health
   */
  checkWebSocketHealth() {
    const wsManager = this.ogzPrime.webSocketManager;
    if (!wsManager) return;
    
    // Check GUI WebSocket
    const guiHealth = wsManager.getHealth(this.ogzPrime.config.guiWebSocketPort);
    if (guiHealth) {
      this.connectionState.guiWebSocket.status = guiHealth.connections > 0 ? 'connected' : 'no_clients';
      this.connectionState.guiWebSocket.lastPing = guiHealth.lastActivity || Date.now();
    }
    
    // Check Control WebSocket
    const controlHealth = wsManager.getHealth(this.ogzPrime.config.controlWebSocketPort);
    if (controlHealth) {
      this.connectionState.controlWebSocket.status = controlHealth.connections > 0 ? 'connected' : 'no_clients';
      this.connectionState.controlWebSocket.lastPing = controlHealth.lastActivity || Date.now();
    }
  }

  /**
   * Handle stale data situation
   */
  handleStaleData(connection) {
    const state = this.connectionState[connection];
    
    if (state.isReconnecting) {
      return; // Already handling
    }
    
    console.log(`🔄 Handling stale ${connection} connection`);
    
    // Save current state (non-critical)
    this.saveCurrentState();
    
    // For data feed, check if we need emergency measures
    if (connection === 'dataFeed' && this.ogzPrime.tradingBrain.isInPosition()) {
      const timeSinceData = Date.now() - state.lastData;
      
      if (timeSinceData > this.config.emergencyCloseTimeout && this.config.enableAutoClose) {
        console.log('🚨 EMERGENCY: Data lost for too long - considering position closure');
        this.considerEmergencyClose('Extended data feed loss');
      } else {
        console.log(`⏰ Position open with stale data (${(timeSinceData/1000).toFixed(0)}s) - monitoring...`);
        
        // Queue protective order but don't execute yet
        this.queueProtectiveOrder();
      }
    }
    
    // Attempt reconnection for data feed
    if (connection === 'dataFeed') {
      this.attemptDataReconnection();
    }
  }

  /**
   * Attempt to reconnect data feed
   */
  async attemptDataReconnection() {
    const state = this.connectionState.dataFeed;
    
    if (state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for data feed');
      this.emit('data_feed_failed');
      return;
    }
    
    state.isReconnecting = true;
    state.reconnectAttempts++;
    
    console.log(`🔄 Data reconnection attempt ${state.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
    
    try {
      // If Polygon socket exists, let it handle reconnection
      if (this.ogzPrime.polygonSocket) {
        // Polygon has its own reconnection logic
        console.log('📡 Polygon handling its own reconnection...');
      }
      
      // Just wait and monitor
      setTimeout(() => {
        if (Date.now() - state.lastData > this.config.dataStaleTimeout) {
          // Still no data
          this.attemptDataReconnection();
        } else {
          // Data is flowing again!
          console.log('✅ Data feed recovered!');
          state.isReconnecting = false;
          state.reconnectAttempts = 0;
          this.updateConnectionState('dataFeed', 'connected');
        }
      }, this.calculateBackoffDelay(state.reconnectAttempts));
      
    } catch (error) {
      console.error('❌ Reconnection error:', error.message);
      state.isReconnecting = false;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(attempt) {
    return Math.min(
      this.config.reconnectDelay * Math.pow(2, attempt - 1),
      this.config.maxReconnectDelay
    );
  }

  /**
   * Consider emergency position closure
   */
  considerEmergencyClose(reason) {
    if (!this.config.enableAutoClose) {
      console.log('🛡️ Auto-close disabled - position remains open');
      return;
    }
    
    if (!this.ogzPrime.tradingBrain.isInPosition()) {
      console.log('✅ No position to close');
      return;
    }
    
    console.log(`🚨 EMERGENCY CLOSE CONSIDERATION: ${reason}`);
    
    // Queue emergency close order
    this.queueOrder({
      type: 'emergency_close',
      reason: reason,
      timestamp: Date.now(),
      priority: 'CRITICAL'
    });
    
    // Emit event for monitoring
    this.emit('emergency_close_queued', { reason });
  }

  /**
   * Queue protective order (stop loss)
   */
  queueProtectiveOrder() {
    if (!this.ogzPrime.tradingBrain.isInPosition()) return;
    
    const position = this.ogzPrime.tradingBrain.position;
    const currentPrice = position.entryPrice; // Use entry as fallback
    
    // Calculate protective stop (2% below entry)
    const stopPrice = position.direction === 'buy' 
      ? currentPrice * 0.98 
      : currentPrice * 1.02;
    
    this.queueOrder({
      type: 'protective_stop',
      price: stopPrice,
      timestamp: Date.now(),
      priority: 'HIGH'
    });
    
    console.log(`🛡️ Protective stop queued at $${stopPrice.toFixed(2)}`);
  }

  /**
   * Queue order for later execution
   */
  queueOrder(order) {
    // Remove duplicates
    this.ordersQueue = this.ordersQueue.filter(o => o.type !== order.type);
    
    // Add new order
    this.ordersQueue.push(order);
    
    // Sort by priority
    this.ordersQueue.sort((a, b) => {
      const priority = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  /**
   * Save current state for recovery
   */
  saveCurrentState() {
    try {
      this.emergencyState = {
        timestamp: Date.now(),
        position: this.ogzPrime.tradingBrain.position,
        balance: this.ogzPrime.tradingBrain.balance,
        candles: this.ogzPrime.timeframeData[this.ogzPrime.config.primaryTimeframe]?.candles?.slice(-100),
        connectionStates: { ...this.connectionState }
      };
      
      // Save to file
      const statePath = path.join(
        this.ogzPrime.config.logDirectory,
        `emergency_state_${Date.now()}.json`
      );
      
      fs.writeFileSync(statePath, JSON.stringify(this.emergencyState, null, 2));
      console.log(`💾 Emergency state saved to ${statePath}`);
      
    } catch (error) {
      console.error('❌ Failed to save emergency state:', error.message);
    }
  }

  /**
   * Process queued orders when connection restored
   */
  processQueuedOrders() {
    if (this.ordersQueue.length === 0) return;
    
    console.log(`📋 Processing ${this.ordersQueue.length} queued orders...`);
    
    while (this.ordersQueue.length > 0) {
      const order = this.ordersQueue.shift();
      
      try {
        switch (order.type) {
          case 'emergency_close':
            if (this.ogzPrime.tradingBrain.isInPosition()) {
              console.log('🚨 Executing queued emergency close');
              this.ogzPrime.executeManualSell();
            }
            break;
            
          case 'protective_stop':
            console.log('🛡️ Protective stop order - monitoring implementation needed');
            // TODO: Implement stop order logic
            break;
            
          default:
            console.log(`❓ Unknown order type: ${order.type}`);
        }
      } catch (error) {
        console.error(`❌ Failed to process order: ${error.message}`);
      }
    }
  }

  /**
   * Get health status summary
   */
  getHealthStatus() {
    const now = Date.now();
    
    return {
      dataFeed: {
        ...this.connectionState.dataFeed,
        staleTime: now - this.connectionState.dataFeed.lastData,
        isStale: now - this.connectionState.dataFeed.lastData > this.config.dataStaleTimeout
      },
      guiWebSocket: this.connectionState.guiWebSocket,
      controlWebSocket: this.connectionState.controlWebSocket,
      hasPosition: this.ogzPrime.tradingBrain.isInPosition(),
      queuedOrders: this.ordersQueue.length,
      emergencyCloseEnabled: this.config.enableAutoClose
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  cleanup() {
    this.stopMonitoring();
    this.ordersQueue = [];
    this.emergencyState = null;
    console.log('🧹 ConnectionResilience cleaned up');
  }
}

module.exports = ConnectionResilience;