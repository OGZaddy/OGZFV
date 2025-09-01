// ==========================================
// TRAI ENHANCED - Full AI Clone with Desktop CodeLlama 70B
// ==========================================

const TraiAI = require('./trai-ai-clone');
const DesktopBridge = require('./desktop-bridge');
const TraiMemory = require('./trai-memory');
const EventEmitter = require('events');

class TraiEnhanced extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      memoryPath: config.memoryPath || '/root/OGZFV-valhalla/data/trai-memory',
      learningRate: config.learningRate || 0.8,
      responseStyle: 'elite_trader',
      ...config
    };

    // Initialize core components
    this.trai = new TraiAI(this.config);
    this.desktopBridge = null; // Disabled - using WebSocket instead
    this.memory = new TraiMemory(this.config);
    
    this.isReady = false;
    this.capabilities = new Set();
    this.codeLlamaConnection = null;
    this.pendingRequests = new Map();
    
    console.log('[TraiEnhanced] Initializing enhanced AI clone...');
  }

  async initialize() {
    try {
      console.log('[TraiEnhanced] Starting initialization sequence...');
      
      // 1. Initialize Trai personality core
      console.log('[TraiEnhanced] Loading personality matrix...');
      await this.trai.initializeFinalForm();
      
      // 2. Initialize memory system
      console.log('[TraiEnhanced] Initializing persistent memory...');
      await this.memory.initializeMemorySystem();
      
      // 3. Skip desktop bridge connection - using WebSocket instead
      console.log('[TraiEnhanced] Desktop CodeLlama will connect via WebSocket...');
      const desktopConnected = false; // Skip old bridge method
      
      // Desktop bridge disabled - using WebSocket method instead
      console.log('[TraiEnhanced] ⚠️ Desktop bridge disabled - awaiting WebSocket CodeLlama connection');
      
      // 4. Load training data
      console.log('[TraiEnhanced] Loading training dataset...');
      await this.loadTrainingData();
      
      // 5. Setup event handlers
      this.setupEventHandlers();
      
      this.isReady = true;
      console.log('[TraiEnhanced] 🚀 Enhanced AI clone ready for operation');
      this.emit('ready', {
        capabilities: Array.from(this.capabilities),
        memoryLoaded: this.memory.getMemoryStats(),
        desktopConnected: desktopConnected
      });
      
      return true;
    } catch (error) {
      console.error('[TraiEnhanced] Initialization failed:', error);
      this.emit('error', error);
      return false;
    }
  }

  async loadTrainingData() {
    const trainingPath = '/root/OGZFV-valhalla/trai/training-data';
    const categories = ['emotions', 'training', 'architecture', 'rants', 'development'];
    
    for (const category of categories) {
      try {
        console.log(`[TraiEnhanced] Loading ${category} training data...`);
        await this.memory.ingestCategory(`${trainingPath}/${category}`, category);
        console.log(`[TraiEnhanced] ✅ ${category} data loaded`);
      } catch (error) {
        console.warn(`[TraiEnhanced] Failed to load ${category}:`, error.message);
      }
    }
  }

  setupEventHandlers() {
    // Desktop bridge disabled - no event handlers needed

    // Handle memory events
    this.memory.on('memory_updated', (data) => {
      console.log(`[TraiEnhanced] Memory updated: ${data.type}`);
    });
  }

  // Main AI query method - combines all capabilities
  async query(prompt, context = {}) {
    if (!this.isReady) {
      throw new Error('Trai not ready - call initialize() first');
    }

    try {
      // Get relevant memories
      const memories = this.memory.recall(prompt, { limit: 3 });
      
      // Enhanced context with memories
      const enhancedContext = {
        ...context,
        recentMemories: memories.shortTerm.slice(0, 2),
        relevantPatterns: memories.longTerm.slice(0, 3),
        traiPersonality: 'elite_trader_confident',
        timestamp: Date.now()
      };

      // Use CodeLlama if available, otherwise fallback to Trai core
      let response;
      if (this.capabilities.has('codellama_inference')) {
        response = await this.desktopBridge.query(prompt, JSON.stringify(enhancedContext));
      } else {
        // Fallback to Trai's built-in responses
        response = await this.trai.generateResponse(prompt, enhancedContext);
      }

      // Record the interaction
      this.memory.recordEvent('query_response', {
        prompt,
        response: response.content || response,
        context: enhancedContext,
        method: this.capabilities.has('codellama_inference') ? 'codellama' : 'builtin'
      });

      return response;
    } catch (error) {
      console.error('[TraiEnhanced] Query failed:', error);
      throw error;
    }
  }

  // Trading-specific methods
  async analyzeMarketData(marketData) {
    const analysis = await this.query(
      'Analyze this market data and provide trading recommendations',
      { 
        type: 'market_analysis',
        data: marketData,
        tradingMode: 'elite_scalping'
      }
    );

    return analysis;
  }

  async generateTradingStrategy(symbol, timeframe, parameters = {}) {
    const strategy = await this.query(
      `Generate elite trading strategy for ${symbol} on ${timeframe}`,
      {
        type: 'strategy_generation',
        symbol,
        timeframe,
        parameters,
        focus: 'profit_maximization'
      }
    );

    return strategy;
  }

  async debugTradingBot(botType, errorData) {
    const debug = await this.query(
      `Debug and fix this trading bot error immediately`,
      {
        type: 'bot_debugging',
        botType,
        error: errorData,
        priority: 'critical'
      }
    );

    return debug;
  }

  async handleCustomerSupport(query, customerData = {}) {
    const response = await this.query(
      query,
      {
        type: 'customer_support',
        customer: customerData,
        role: 'tech_support_expert'
      }
    );

    return response;
  }

  async generateContent(topic, contentType = 'educational') {
    const content = await this.query(
      `Create ${contentType} content about ${topic}`,
      {
        type: 'content_creation',
        contentType,
        topic,
        voice: 'trai_authentic'
      }
    );

    return content;
  }

  // Status and diagnostics
  getStatus() {
    return {
      ready: this.isReady,
      capabilities: Array.from(this.capabilities),
      memory: this.memory.getMemoryStats(),
      desktop: this.desktopBridge.getStatus(),
      personality: this.config.responseStyle,
      uptime: Date.now()
    };
  }

  // Learning method - feed new experiences
  async learn(experience) {
    this.memory.recordEvent('learning', experience);
    console.log(`[TraiEnhanced] Learning from: ${experience.type}`);
  }

  // WebSocket-based CodeLlama methods
  setCodeLlamaConnection(connection) {
    this.codeLlamaConnection = connection;
    this.capabilities.add('websocket_codellama');
    console.log('[TraiEnhanced] CodeLlama WebSocket connection registered');
  }

  async queryCodeLlama(prompt, context = {}) {
    if (!this.codeLlamaConnection) {
      throw new Error('CodeLlama connection not available');
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject, timestamp: Date.now() });

      // Send request through WebSocket
      const requestData = {
        type: 'codellama_request',
        id: requestId,
        prompt,
        context: JSON.stringify(context),
        options: {
          temperature: context.temperature || 0.1,
          max_tokens: context.max_tokens || 2048
        }
      };

      this.codeLlamaConnection.ws.send(JSON.stringify(requestData));

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('CodeLlama request timeout'));
        }
      }, 120000); // 2 minute timeout
    });
  }

  handleCodeLlamaResponse(responseData) {
    const { id, type, content, error } = responseData;

    if (this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id);
      this.pendingRequests.delete(id);

      if (type === 'codellama_error' || error) {
        reject(new Error(error || 'CodeLlama processing failed'));
      } else {
        resolve({
          content,
          model: responseData.model || 'codellama:70b',
          timestamp: responseData.timestamp
        });
      }
    }
  }

  // Override query method to use WebSocket CodeLlama when available
  async query(prompt, context = {}) {
    if (!this.isReady) {
      throw new Error('Trai not ready - call initialize() first');
    }

    try {
      // Get relevant memories
      const memories = this.memory.recall(prompt, { limit: 3 });
      
      // Enhanced context with memories
      const enhancedContext = {
        ...context,
        recentMemories: memories.shortTerm.slice(0, 2),
        relevantPatterns: memories.longTerm.slice(0, 3),
        traiPersonality: 'elite_trader_confident',
        timestamp: Date.now()
      };

      let response;
      
      // Try WebSocket CodeLlama first, then fallback to desktop bridge, then Trai core
      if (this.capabilities.has('websocket_codellama')) {
        console.log('[TraiEnhanced] Using WebSocket CodeLlama 70B');
        response = await this.queryCodeLlama(prompt, enhancedContext);
      } else if (this.capabilities.has('codellama_inference')) {
        console.log('[TraiEnhanced] Using desktop bridge CodeLlama');
        response = await this.desktopBridge.query(prompt, JSON.stringify(enhancedContext));
      } else {
        console.log('[TraiEnhanced] Using built-in Trai responses');
        response = await this.trai.generateResponse(prompt, enhancedContext);
      }

      // Record the interaction
      this.memory.recordEvent('query_response', {
        prompt,
        response: response.content || response,
        context: enhancedContext,
        method: this.getActiveMethod()
      });

      return response;
    } catch (error) {
      console.error('[TraiEnhanced] Query failed:', error);
      throw error;
    }
  }

  getActiveMethod() {
    if (this.capabilities.has('websocket_codellama')) return 'websocket_codellama';
    if (this.capabilities.has('codellama_inference')) return 'desktop_bridge';
    return 'builtin_trai';
  }

  // Cleanup
  async cleanup() {
    if (this.memory) {
      await this.memory.cleanup();
    }
    
    // Clear pending requests
    this.pendingRequests.clear();
    this.codeLlamaConnection = null;
    
    console.log('[TraiEnhanced] Cleanup completed');
  }
}

module.exports = TraiEnhanced;