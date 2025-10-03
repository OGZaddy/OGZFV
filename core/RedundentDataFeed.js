// RedundantDataFeed.js - Multiple data source management with automatic failover
// Never lose a trade due to data feed issues!
// 🔧 FIXES APPLIED: Exponential backoff, crypto-aware price validation, connection storm prevention

const EventEmitter = require('events');

/**
 * Redundant Data Feed Manager
 * Manages multiple data sources for maximum reliability
 * 
 * CRITICAL FIXES:
 * - Added exponential backoff to prevent reconnection storms
 * - Made price validation crypto-aware with configurable thresholds
 * - Added connection rate limiting to prevent API abuse
 * - Enhanced error handling for volatile market conditions
 */
class RedundantDataFeed extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Feed priority (higher = more preferred)
      feeds: [
        {
          name: 'polygon',
          type: 'websocket',
          priority: 100,
          healthCheckInterval: 30000,
          maxLatency: 1000,
          reconnectDelay: 5000,
          maxReconnectDelay: 60000,    // FIXED: Cap reconnect delay
          backoffMultiplier: 1.5       // FIXED: Exponential backoff multiplier
        },
        {
          name: 'alpaca',
          type: 'websocket', 
          priority: 90,
          healthCheckInterval: 30000,
          maxLatency: 1500,
          reconnectDelay: 5000,
          maxReconnectDelay: 60000,    // FIXED: Cap reconnect delay
          backoffMultiplier: 1.5       // FIXED: Exponential backoff multiplier
        },
        {
          name: 'backup_rest',
          type: 'rest',
          priority: 50,
          healthCheckInterval: 60000,
          maxLatency: 3000,
          pollInterval: 1000,
          maxReconnectDelay: 120000,   // FIXED: Longer delay for REST
          backoffMultiplier: 2.0       // FIXED: More aggressive backoff for REST
        }
      ],
      
      // FIXED: Crypto-aware validation settings
      priceValidation: {
        enabled: true,
        maxDeviation: 0.02,          // FIXED: 2% max deviation (was 1%) for crypto volatility
        cryptoMaxDeviation: 0.05,    // FIXED: 5% max deviation during high volatility
        minSources: 2,               // Require 2 sources to agree
        volatilityThreshold: 0.03,   // FIXED: 3% volatility threshold to use crypto settings
        validationWindow: 10000,     // FIXED: 10s window for price comparison
        enableVolatilityAdaptation: true  // FIXED: Adapt validation to market volatility
      },
      
      // FIXED: Connection management settings
      connectionLimits: {
        maxReconnectsPerMinute: 6,   // FIXED: Limit reconnection attempts
        connectionTimeoutMs: 15000,  // FIXED: 15s connection timeout
        rateLimitWindowMs: 60000,    // FIXED: 1 minute rate limit window
        enableConnectionThrottling: true  // FIXED: Enable connection throttling
      },
      
      // Failover settings
      failoverDelay: 3000,         // Wait 3s before failover
      reconciliationWindow: 5000,  // 5s to reconcile data
      
      ...config
    };
    
    this.state = {
      activeFeed: null,
      feedStatus: new Map(),
      lastPrices: new Map(),
      dataBuffer: [],
      isReconciling: false,
      
      // FIXED: Connection tracking for rate limiting
      connectionAttempts: new Map(),  // Track reconnection attempts per feed
      lastConnectionTimes: new Map(), // Track last connection attempt times
      currentVolatility: 0,           // Track current market volatility
      lastVolatilityUpdate: 0         // Track when volatility was last calculated
    };
    
    this.connections = new Map();
    this.healthTimers = new Map();
    
    // FIXED: Setup volatility monitoring for adaptive price validation
    this.setupVolatilityMonitoring();
    
    console.log('🔄 RedundantDataFeed initialized with crypto-aware validation and connection throttling');
  }
  
  /**
   * FIXED: Setup volatility monitoring for adaptive price validation
   */
  setupVolatilityMonitoring() {
    // Check volatility every 30 seconds
    setInterval(() => {
      this.updateMarketVolatility();
    }, 30000);
  }
  
  /**
   * FIXED: Update market volatility for adaptive price validation
   */
  updateMarketVolatility() {
    const now = Date.now();
    
    // Only update if we have recent price data
    if (this.state.lastPrices.size === 0) {
      return;
    }
    
    // Get recent prices from all feeds
    const recentPrices = [];
    for (const [feed, priceData] of this.state.lastPrices) {
      if (now - priceData.timestamp < 60000) { // Last minute
        recentPrices.push(priceData.price);
      }
    }
    
    if (recentPrices.length < 2) {
      return;
    }
    
    // Calculate volatility as coefficient of variation
    const mean = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / recentPrices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / mean;
    
    this.state.currentVolatility = volatility;
    this.state.lastVolatilityUpdate = now;
    
    console.log(`📊 Market volatility updated: ${(volatility * 100).toFixed(2)}%`);
  }
  
  /**
   * Initialize all data feeds
   */
  async initialize() {
    console.log('🔄 Initializing redundant data feeds...');
    
    // Sort feeds by priority
    this.config.feeds.sort((a, b) => b.priority - a.priority);
    
    // Initialize connection tracking for each feed
    for (const feedConfig of this.config.feeds) {
      this.state.connectionAttempts.set(feedConfig.name, 0);
      this.state.lastConnectionTimes.set(feedConfig.name, []);
    }
    
    // Initialize each feed
    for (const feedConfig of this.config.feeds) {
      await this.initializeFeed(feedConfig);
    }
    
    // Select primary feed
    this.selectPrimaryFeed();
    
    console.log('✅ Redundant feeds initialized');
  }
  
  /**
   * FIXED: Check if feed can reconnect (rate limiting)
   * @param {string} feedName - Name of the feed
   * @returns {boolean} Whether reconnection is allowed
   */
  canReconnect(feedName) {
    if (!this.config.connectionLimits.enableConnectionThrottling) {
      return true;
    }
    
    const now = Date.now();
    const windowMs = this.config.connectionLimits.rateLimitWindowMs;
    const maxAttempts = this.config.connectionLimits.maxReconnectsPerMinute;
    
    // Get recent connection attempts
    const recentAttempts = this.state.lastConnectionTimes.get(feedName) || [];
    
    // Filter to attempts within the window
    const recentAttemptsInWindow = recentAttempts.filter(time => now - time < windowMs);
    
    // Update the list
    this.state.lastConnectionTimes.set(feedName, recentAttemptsInWindow);
    
    if (recentAttemptsInWindow.length >= maxAttempts) {
      console.log(`⛔ Connection rate limit reached for ${feedName} (${recentAttemptsInWindow.length}/${maxAttempts} in last ${windowMs/1000}s)`);
      return false;
    }
    
    return true;
  }
  
  /**
   * FIXED: Record connection attempt for rate limiting
   * @param {string} feedName - Name of the feed
   */
  recordConnectionAttempt(feedName) {
    const now = Date.now();
    const attempts = this.state.lastConnectionTimes.get(feedName) || [];
    attempts.push(now);
    this.state.lastConnectionTimes.set(feedName, attempts);
    
    // Increment total attempts counter
    const totalAttempts = this.state.connectionAttempts.get(feedName) || 0;
    this.state.connectionAttempts.set(feedName, totalAttempts + 1);
  }
  
  /**
   * FIXED: Calculate exponential backoff delay
   * @param {Object} feedConfig - Feed configuration
   * @returns {number} Delay in milliseconds
   */
  calculateBackoffDelay(feedConfig) {
    const attempts = this.state.connectionAttempts.get(feedConfig.name) || 0;
    const baseDelay = feedConfig.reconnectDelay;
    const multiplier = feedConfig.backoffMultiplier || 1.5;
    const maxDelay = feedConfig.maxReconnectDelay || 60000;
    
    // Calculate exponential backoff: baseDelay * (multiplier ^ attempts)
    const delay = Math.min(baseDelay * Math.pow(multiplier, attempts), maxDelay);
    
    console.log(`⏱️ Calculated backoff delay for ${feedConfig.name}: ${delay}ms (attempt ${attempts + 1})`);
    
    return delay;
  }
  
  /**
   * Initialize a single feed
   * @param {Object} feedConfig - Feed configuration
   */
  async initializeFeed(feedConfig) {
    try {
      let connection;
      
      switch (feedConfig.type) {
        case 'websocket':
          connection = await this.createWebSocketFeed(feedConfig);
          break;
        case 'rest':
          connection = await this.createRestFeed(feedConfig);
          break;
        default:
          throw new Error(`Unknown feed type: ${feedConfig.type}`);
      }
      
      // Store connection
      this.connections.set(feedConfig.name, connection);
      
      // Initialize status
      this.state.feedStatus.set(feedConfig.name, {
        connected: false,
        latency: 0,
        lastData: 0,
        errors: 0,
        quality: 100,
        reconnectAttempts: 0,    // FIXED: Track reconnect attempts
        lastReconnectTime: 0     // FIXED: Track last reconnect time
      });
      
      // Start health monitoring
      this.startHealthMonitoring(feedConfig);
      
      console.log(`📡 Initialized feed: ${feedConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${feedConfig.name}:`, error.message);
    }
  }
  
  /**
   * Create WebSocket data feed
   * @param {Object} config - Feed configuration
   * @returns {Object} WebSocket connection
   */
  async createWebSocketFeed(config) {
    const WebSocket = require('ws');
    let ws;
    let reconnectTimer;
    let isManualClose = false;
    
    const connect = () => {
      // FIXED: Check rate limiting before attempting connection
      if (!this.canReconnect(config.name)) {
        const backoffDelay = this.calculateBackoffDelay(config);
        console.log(`⏸️ Delaying reconnection for ${config.name} due to rate limits: ${backoffDelay}ms`);
        
        reconnectTimer = setTimeout(() => {
          if (!isManualClose) {
            connect();
          }
        }, backoffDelay);
        return;
      }
      
      // Record connection attempt
      this.recordConnectionAttempt(config.name);
      
      // Feed-specific connection logic
      switch (config.name) {
        case 'polygon':
          ws = new WebSocket('wss://socket.polygon.io/crypto', {
            timeout: this.config.connectionLimits.connectionTimeoutMs  // FIXED: Add timeout
          });
          
          ws.on('open', () => {
            // Reset connection attempts on successful connection
            this.state.connectionAttempts.set(config.name, 0);
            
            // Authenticate
            ws.send(JSON.stringify({
              action: 'auth',
              params: process.env.POLYGON_API_KEY
            }));
            
            // Subscribe
            setTimeout(() => {
              ws.send(JSON.stringify({
                action: 'subscribe',
                params: 'XT.X:BTC-USD'
              }));
            }, 1000);
            
            this.updateFeedStatus(config.name, { 
              connected: true,
              reconnectAttempts: this.state.connectionAttempts.get(config.name)
            });
            
            console.log(`✅ ${config.name} connected successfully`);
          });
          
          ws.on('message', (data) => {
            const messages = JSON.parse(data);
            for (const msg of messages) {
              if (msg.ev === 'XT') {
                this.handleData(config.name, {
                  price: parseFloat(msg.p),
                  timestamp: msg.t,
                  volume: msg.v
                });
              }
            }
          });
          break;
          
        case 'alpaca':
          // Alpaca implementation with same fixes
          ws = new WebSocket('wss://stream.data.alpaca.markets/v1beta1/crypto', {
            timeout: this.config.connectionLimits.connectionTimeoutMs  // FIXED: Add timeout
          });
          
          ws.on('open', () => {
            // Reset connection attempts on successful connection
            this.state.connectionAttempts.set(config.name, 0);
            
            this.updateFeedStatus(config.name, { 
              connected: true,
              reconnectAttempts: this.state.connectionAttempts.get(config.name)
            });
            
            console.log(`✅ ${config.name} connected successfully`);
          });
          
          // Add message handling for Alpaca...
          break;
      }
      
      // Common handlers
      ws.on('error', (error) => {
        console.error(`❌ ${config.name} error:`, error.message);
        this.updateFeedStatus(config.name, { 
          connected: false,
          errors: (this.state.feedStatus.get(config.name)?.errors || 0) + 1
        });
      });
      
      ws.on('close', (code, reason) => {
        this.updateFeedStatus(config.name, { connected: false });
        
        if (!isManualClose) {
          // FIXED: Use exponential backoff for reconnection
          const backoffDelay = this.calculateBackoffDelay(config);
          
          console.log(`🔄 Reconnecting ${config.name} in ${backoffDelay}ms... (code: ${code})`);
          
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            connect();
          }, backoffDelay);
        }
      });
      
      // FIXED: Add connection timeout handling
      ws.on('timeout', () => {
        console.error(`⏰ ${config.name} connection timeout`);
        ws.terminate();
      });
    };
    
    connect();
    
    return {
      type: 'websocket',
      send: (data) => ws?.send(JSON.stringify(data)),
      close: () => {
        isManualClose = true;
        clearTimeout(reconnectTimer);
        ws?.close();
      }
    };
  }
  
  /**
   * Create REST API feed
   * @param {Object} config - Feed configuration
   * @returns {Object} REST connection
   */
  async createRestFeed(config) {
    let pollTimer;
    let isPolling = true;
    let errorCount = 0;
    
    const poll = async () => {
      if (!isPolling) return;
      
      // FIXED: Check rate limiting before polling
      if (!this.canReconnect(config.name)) {
        const backoffDelay = this.calculateBackoffDelay(config);
        console.log(`⏸️ Delaying poll for ${config.name} due to rate limits: ${backoffDelay}ms`);
        
        pollTimer = setTimeout(poll, backoffDelay);
        return;
      }
      
      try {
        // Record connection attempt
        this.recordConnectionAttempt(config.name);
        
        // Example REST endpoint (implement based on your backup API)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.connectionLimits.connectionTimeoutMs);
        
        const response = await fetch(`https://api.backup.com/price/BTC-USD`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        this.handleData(config.name, {
          price: data.price,
          timestamp: Date.now(),
          volume: data.volume || 0
        });
        
        this.updateFeedStatus(config.name, { connected: true });
        
        // Reset error count and connection attempts on success
        errorCount = 0;
        this.state.connectionAttempts.set(config.name, 0);
        
      } catch (error) {
        console.error(`❌ ${config.name} REST error:`, error.message);
        this.updateFeedStatus(config.name, { connected: false });
        
        errorCount++;
        
        // FIXED: Use exponential backoff for REST polling on errors
        if (errorCount > 3) {
          const backoffDelay = this.calculateBackoffDelay(config);
          console.log(`⏸️ Multiple errors on ${config.name}, backing off: ${backoffDelay}ms`);
          
          pollTimer = setTimeout(poll, backoffDelay);
          return;
        }
      }
      
      // Schedule next poll
      pollTimer = setTimeout(poll, config.pollInterval);
    };
    
    // Start polling
    poll();
    
    return {
      type: 'rest',
      close: () => {
        isPolling = false;
        clearTimeout(pollTimer);
      }
    };
  }
  
  /**
   * Handle incoming data from any feed
   * @param {string} feedName - Source feed name
   * @param {Object} data - Price data
   */
  handleData(feedName, data) {
    const now = Date.now();
    
    // Update latency
    const latency = now - (data.timestamp || now);
    
    // Update feed status
    this.updateFeedStatus(feedName, {
      latency,
      lastData: now,
      quality: this.calculateFeedQuality(feedName, latency)
    });
    
    // Store last price for validation
    this.state.lastPrices.set(feedName, {
      price: data.price,
      timestamp: now
    });
    
    // Buffer data during reconciliation
    if (this.state.isReconciling) {
      this.state.dataBuffer.push({ feedName, data, received: now });
      return;
    }
    
    // If this is the active feed, validate and emit
    if (feedName === this.state.activeFeed) {
      if (this.validatePrice(data.price)) {
        this.emit('data', data);
      } else {
        console.warn(`⚠️ Price validation failed for ${data.price} from ${feedName}`);
        this.handleValidationFailure(feedName);
      }
    }
  }
  
  /**
   * FIXED: Validate price across multiple feeds with crypto-aware thresholds
   * @param {number} price - Price to validate
   * @returns {boolean} Is valid
   */
  validatePrice(price) {
    if (!this.config.priceValidation.enabled) return true;
    
    const recentPrices = [];
    const now = Date.now();
    const validationWindow = this.config.priceValidation.validationWindow || 5000;
    
    // Collect recent prices from all feeds within validation window
    for (const [feed, lastPrice] of this.state.lastPrices) {
      if (now - lastPrice.timestamp < validationWindow) {
        recentPrices.push(lastPrice.price);
      }
    }
    
    // Need minimum sources
    if (recentPrices.length < this.config.priceValidation.minSources) {
      return true; // Not enough data to validate
    }
    
    // Calculate average price
    const avgPrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const deviation = Math.abs(price - avgPrice) / avgPrice;
    
    // FIXED: Use adaptive thresholds based on market volatility
    let maxDeviation = this.config.priceValidation.maxDeviation;
    
    if (this.config.priceValidation.enableVolatilityAdaptation) {
      const volatility = this.state.currentVolatility;
      const volatilityThreshold = this.config.priceValidation.volatilityThreshold;
      
      // If market is highly volatile, use more lenient validation
      if (volatility > volatilityThreshold) {
        maxDeviation = this.config.priceValidation.cryptoMaxDeviation;
        console.log(`📊 Using crypto volatility validation (${(volatility * 100).toFixed(2)}% volatility, ${(maxDeviation * 100).toFixed(2)}% threshold)`);
      }
    }
    
    const isValid = deviation <= maxDeviation;
    
    if (!isValid) {
      console.warn(`❌ Price validation failed: ${price} deviates ${(deviation * 100).toFixed(2)}% from average ${avgPrice.toFixed(2)} (threshold: ${(maxDeviation * 100).toFixed(2)}%)`);
    }
    
    return isValid;
  }
  
  /**
   * Handle validation failure
   * @param {string} feedName - Failed feed name
   */
  handleValidationFailure(feedName) {
    console.error(`❌ Validation failure on ${feedName}`);
    
    // Reduce feed quality
    const status = this.state.feedStatus.get(feedName);
    if (status) {
      status.quality = Math.max(0, status.quality - 10);
      status.errors++;
    }
    
    // Consider failover if quality too low
    if (status?.quality < 50) {
      console.warn(`⚠️ Feed ${feedName} quality degraded (${status.quality}%), considering failover`);
      this.considerFailover();
    }
  }
  
  /**
   * Update feed status
   * @param {string} feedName - Feed name
   * @param {Object} updates - Status updates
   */
  updateFeedStatus(feedName, updates) {
    const status = this.state.feedStatus.get(feedName) || {};
    Object.assign(status, updates);
    this.state.feedStatus.set(feedName, status);
    
    // Emit status update
    this.emit('feedStatus', { feedName, status });
  }
  
  /**
   * Calculate feed quality score
   * @param {string} feedName - Feed name
   * @param {number} latency - Current latency
   * @returns {number} Quality score (0-100)
   */
  calculateFeedQuality(feedName, latency) {
    const config = this.config.feeds.find(f => f.name === feedName);
    const status = this.state.feedStatus.get(feedName);
    
    if (!config || !status) return 0;
    
    let quality = 100;
    
    // Penalize for latency
    if (latency > config.maxLatency) {
      quality -= Math.min(50, (latency - config.maxLatency) / 100);
    }
    
    // FIXED: Consider reconnection attempts in quality calculation
    const reconnectPenalty = Math.min(30, status.reconnectAttempts * 5);
    quality -= reconnectPenalty;
    
    // Penalize for errors
    quality -= Math.min(30, status.errors * 5);
    
    // Penalize for disconnections
    if (!status.connected) {
      quality -= 50;
    }
    
    return Math.max(0, quality);
  }
  
  /**
   * Select primary feed based on quality
   */
  selectPrimaryFeed() {
    let bestFeed = null;
    let bestScore = -1;
    
    for (const config of this.config.feeds) {
      const status = this.state.feedStatus.get(config.name);
      
      if (status?.connected) {
        const score = status.quality * (config.priority / 100);
        
        if (score > bestScore) {
          bestScore = score;
          bestFeed = config.name;
        }
      }
    }
    
    if (bestFeed && bestFeed !== this.state.activeFeed) {
      const previousFeed = this.state.activeFeed;
      this.state.activeFeed = bestFeed;
      
      console.log(`📡 Feed switch: ${previousFeed || 'none'} → ${bestFeed} (score: ${bestScore.toFixed(2)})`);
      this.emit('feedSwitch', { feed: bestFeed, previousFeed, score: bestScore });
    }
  }
  
  /**
   * Consider failover to backup feed
   */
  considerFailover() {
    // Don't failover too quickly
    if (this.failoverTimer) return;
    
    this.failoverTimer = setTimeout(() => {
      console.log('🔄 Evaluating feed failover...');
      this.selectPrimaryFeed();
      this.failoverTimer = null;
    }, this.config.failoverDelay);
  }
  
  /**
   * Start health monitoring for a feed
   * @param {Object} config - Feed configuration
   */
  startHealthMonitoring(config) {
    const timer = setInterval(() => {
      const status = this.state.feedStatus.get(config.name);
      if (!status) return;
      
      const now = Date.now();
      const timeSinceData = now - status.lastData;
      
      // Check if feed is stale
      if (timeSinceData > config.healthCheckInterval) {
        console.warn(`⚠️ ${config.name} is stale (${timeSinceData}ms since last data)`);
        status.quality = Math.max(0, status.quality - 20);
        
        // Consider failover
        if (config.name === this.state.activeFeed) {
          this.considerFailover();
        }
      }
      
      // Slowly recover quality over time
      if (status.connected && status.quality < 100) {
        status.quality = Math.min(100, status.quality + 1);
      }
    }, config.healthCheckInterval);
    
    this.healthTimers.set(config.name, timer);
  }
  
  /**
   * Get aggregated data from multiple feeds
   * @returns {Object} Aggregated market data
   */
  getAggregatedData() {
    const prices = [];
    const now = Date.now();
    const validationWindow = this.config.priceValidation.validationWindow || 5000;
    
    // Collect recent prices
    for (const [feed, data] of this.state.lastPrices) {
      if (now - data.timestamp < validationWindow) {
        prices.push(data.price);
      }
    }
    
    if (prices.length === 0) return null;
    
    // Calculate aggregated values
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const spread = maxPrice - minPrice;
    const spreadPercent = (spread / avgPrice) * 100;
    
    // FIXED: Adaptive confidence based on volatility
    let confidence = 'medium';
    if (prices.length >= 2) {
      const maxDeviation = this.state.currentVolatility > this.config.priceValidation.volatilityThreshold ? 
        this.config.priceValidation.cryptoMaxDeviation : 
        this.config.priceValidation.maxDeviation;
      
      if (spreadPercent < (maxDeviation * 100 * 0.5)) {
        confidence = 'high';
      } else if (spreadPercent > (maxDeviation * 100)) {
        confidence = 'low';
      }
    }
    
    return {
      price: avgPrice,
      spread: spreadPercent,
      sources: prices.length,
      confidence: confidence,
      volatility: this.state.currentVolatility,
      timestamp: now
    };
  }
  
  /**
   * Get feed statistics
   * @returns {Object} Feed statistics
   */
  getStats() {
    const stats = {
      activeFeed: this.state.activeFeed,
      marketVolatility: this.state.currentVolatility,
      validationThreshold: this.state.currentVolatility > this.config.priceValidation.volatilityThreshold ? 
        this.config.priceValidation.cryptoMaxDeviation : 
        this.config.priceValidation.maxDeviation,
      feeds: {}
    };
    
    for (const [name, status] of this.state.feedStatus) {
      const connectionAttempts = this.state.connectionAttempts.get(name) || 0;
      const recentAttempts = this.state.lastConnectionTimes.get(name) || [];
      
      stats.feeds[name] = {
        connected: status.connected,
        quality: status.quality,
        latency: status.latency,
        errors: status.errors,
        reconnectAttempts: status.reconnectAttempts || 0,
        totalConnectionAttempts: connectionAttempts,
        recentConnectionAttempts: recentAttempts.length,
        lastData: status.lastData ? new Date(status.lastData).toISOString() : 'never'
      };
    }
    
    return stats;
  }
  
  /**
   * Shutdown all feeds
   */
  async shutdown() {
    console.log('🛑 Shutting down redundant feeds...');
    
    // Clear health timers
    for (const timer of this.healthTimers.values()) {
      clearInterval(timer);
    }
    
    // Close all connections
    for (const [name, connection] of this.connections) {
      try {
        await connection.close();
        console.log(`✅ Closed ${name}`);
      } catch (error) {
        console.error(`❌ Error closing ${name}:`, error.message);
      }
    }
    
    // Clear state
    this.connections.clear();
    this.healthTimers.clear();
    this.state.feedStatus.clear();
    this.state.connectionAttempts.clear();
    this.state.lastConnectionTimes.clear();
    
    console.log('✅ RedundantDataFeed shutdown complete');
  }
}

module.exports = RedundantDataFeed;