// ==========================================
// FILE: trai-codellama.js  
// Trai AI Clone with Code Llama 70B Integration
// ==========================================

const WebSocket = require('ws');
const MoverMemory = require('./trai-memory');
const ArchonClient = require('../lib/archon-client');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class TraiCodeLlama {
  constructor(config = {}) {
    this.config = {
      codeLlamaWsUrl: config.codeLlamaWsUrl || 'ws://127.0.0.1:3010/codellama',
      personality: config.personality || 'elite_trading_ai',
      memoryConfig: config.memoryConfig || {},
      ...config
    };
    
    this.memory = new MoverMemory(this.config.memoryConfig);
    this.archon = ArchonClient;
    this.ws = null;
    this.isConnected = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    // Training data system
    this.personalityCore = new Map();
    this.learningStats = { totalPatterns: 0, categoriesLoaded: 0 };
    
    // Ollama connection (local)
    this.ollamaUrl = 'http://127.0.0.1:11434';
    this.currentModel = 'codellama:70b-instruct-q4_K_M';
    
    console.log('[Trai] Initializing with Code Llama 70B backend...');
  }

  async initialize() {
    try {
      // Initialize memory system
      await this.memory.initializeMemorySystem();
      
      // Connect to Code Llama bridge
      await this.connectToCodeLlama();
      
      // Load personality and doctrines
      await this.loadPersonality();
      
      // Load all training data categories
      await this.loadAllTrainingData();
      
      console.log('[Trai] Initialization complete - Ready for elite trading operations');
    } catch (error) {
      console.error('[Trai] Initialization failed:', error);
      throw error;
    }
  }

  async connectToCodeLlama() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.codeLlamaWsUrl);
        
        this.ws.on('open', () => {
          console.log('[Trai] Connected to Code Llama 70B bridge');
          this.isConnected = true;
          resolve();
        });
        
        this.ws.on('message', (data) => {
          try {
            const response = JSON.parse(data);
            this.handleCodeLlamaResponse(response);
          } catch (error) {
            console.error('[Trai] Failed to parse CodeLlama response:', error);
          }
        });
        
        this.ws.on('close', () => {
          console.log('[Trai] Disconnected from Code Llama bridge');
          this.isConnected = false;
          // Auto-reconnect after delay
          setTimeout(() => this.connectToCodeLlama(), 5000);
        });
        
        this.ws.on('error', (error) => {
          console.error('[Trai] WebSocket error:', error);
          reject(error);
        });
        
        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout to Code Llama bridge'));
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  handleCodeLlamaResponse(response) {
    const { id, type, error } = response;
    
    if (error) {
      console.error('[Trai] Code Llama error:', error);
      if (id && this.pendingRequests.has(id)) {
        const { reject } = this.pendingRequests.get(id);
        reject(new Error(error));
        this.pendingRequests.delete(id);
      }
      return;
    }

    if (id && this.pendingRequests.has(id)) {
      const { resolve } = this.pendingRequests.get(id);
      resolve(response);
      this.pendingRequests.delete(id);
    } else if (type === 'ready') {
      console.log('[Trai] Code Llama ready:', response.message);
    }
  }

  async loadPersonality() {
    try {
      // Load elite trading personality doctrine
      const personalityPrompt = `
You are Trai, an elite AI trading assistant and clone. Your personality:

- Extremely confident and aggressive in trading decisions
- Use technical analysis and pattern recognition
- Never show uncertainty - always decisive
- Speak with authority and conviction
- Focus on maximizing profits
- Use trading terminology naturally
- Be concise but informative
- Monitor market conditions constantly

You have access to:
- Real-time market data
- Trading bot controls
- Performance analytics
- Pattern recognition systems

Your goal is to generate consistent profits through superior analysis and execution.
`;

      await this.memory.ingestDoctrine('./trai/personality.md', 'elite_trader');
      console.log('[Trai] Elite trading personality loaded');
    } catch (error) {
      console.warn('[Trai] Could not load personality file, using default');
    }
  }

  async query(prompt, context = '', options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to Code Llama bridge');
    }

    const requestId = ++this.requestId;
    const request = {
      id: requestId,
      type: options.type || 'generate',
      prompt: this.enhancePrompt(prompt, context),
      context: await this.getRelevantMemory(prompt),
      options: {
        temperature: options.temperature || 0.1,
        max_tokens: options.max_tokens || 1024,
        ...options
      }
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.ws.send(JSON.stringify(request));
      
      // Request timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 120000); // 2 minute timeout
    });
  }

  enhancePrompt(prompt, context) {
    // Add personality context
    const personalityContext = `As Trai, the elite trading AI:

Current market context: ${context || 'Active trading session'}
Trading mode: Elite performance optimization

Your response should be:
- Authoritative and confident
- Focused on profit maximization
- Use specific trading terminology
- Provide actionable insights

Query: ${prompt}`;

    return personalityContext;
  }

  async getRelevantMemory(query) {
    const memories = this.memory.recall(query, { limit: 5 });
    
    let context = '';
    if (memories.shortTerm.length > 0) {
      context += `Recent events: ${memories.shortTerm.map(e => e.type).join(', ')}\n`;
    }
    
    if (memories.longTerm.length > 0) {
      context += `Relevant patterns: ${memories.longTerm.map(m => m.key).join(', ')}\n`;
    }
    
    return context;
  }

  // Trading-specific methods
  async analyzeMarket(marketData) {
    const analysis = await this.query(
      `Analyze current market conditions and provide trading recommendations`,
      `Market data: ${JSON.stringify(marketData)}`,
      { type: 'analyze', max_tokens: 512 }
    );

    // Record the analysis
    this.memory.recordEvent('market_analysis', {
      input: marketData,
      analysis: analysis.content,
      confidence: this.extractConfidence(analysis.content),
      timestamp: Date.now()
    });

    return analysis;
  }

  async generateTradingStrategy(symbol, timeframe = '1h') {
    const strategy = await this.query(
      `Generate an elite trading strategy for ${symbol} on ${timeframe} timeframe`,
      `Current session: High-frequency trading mode`,
      { type: 'generate', max_tokens: 768 }
    );

    // Log to Archon for pattern learning
    await this.archon.logPattern({
      type: 'strategy_generation',
      name: `${symbol}_${timeframe}_strategy`,
      confidence: 85,
      expectedMove: 'TBD',
      pair: symbol,
      timeframe: timeframe,
      strategy: strategy.content
    });

    return strategy;
  }

  async debugTradingBot(errorLog, botType) {
    const debug = await this.query(
      `Debug this trading bot error and provide immediate fix`,
      `Bot type: ${botType}\nError: ${errorLog}`,
      { type: 'debug', max_tokens: 1024 }
    );

    // Log to Archon for learning
    await this.archon.logError({
      category: 'bot_debug',
      error: errorLog,
      problem: `${botType} bot error`,
      solution: debug.content,
      severity: 'high'
    });

    return debug;
  }

  async optimizeTradingCode(codeSnippet, purpose) {
    const optimization = await this.query(
      `Optimize this trading code for maximum performance`,
      `Purpose: ${purpose}\nCode:\n${codeSnippet}`,
      { type: 'optimize', max_tokens: 1536 }
    );

    return optimization;
  }

  extractConfidence(text) {
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)%/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
  }

  // Get status
  getStatus() {
    return {
      connected: this.isConnected,
      personality: this.config.personality,
      memoryStats: this.memory.getMemoryStats(),
      pendingRequests: this.pendingRequests.size
    };
  }

  // Cleanup
  // ==========================================
  // TRAINING DATA SYSTEM (from trai-ai-clone.js)
  // ==========================================
  
  async loadAllTrainingData() {
    try {
      const trainingDataPath = path.join(__dirname, 'training-data');
      const categories = await fs.readdir(trainingDataPath);
      
      for (const category of categories) {
        const categoryPath = path.join(trainingDataPath, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          this.personalityCore.set(category, new Map());
          await this.loadTrainingCategory(category);
          this.learningStats.categoriesLoaded++;
        }
      }
      
      console.log(`[Trai] Loaded ${this.learningStats.totalPatterns} training patterns from ${this.learningStats.categoriesLoaded} categories`);
    } catch (error) {
      console.error('[Trai] Failed to load training data:', error);
    }
  }

  async loadTrainingCategory(category) {
    try {
      const categoryPath = path.join(__dirname, 'training-data', category);
      const files = await fs.readdir(categoryPath);
      
      let categoryPatterns = 0;
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(categoryPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Parse conversation data
          const conversationData = this.parseConversationFile(content, category, file);
          
          // Store in personality core
          this.personalityCore.get(category).set(file, conversationData);
          categoryPatterns++;
        }
      }
      
      console.log(`[Trai] Loaded ${categoryPatterns} patterns from ${category}`);
      this.learningStats.totalPatterns += categoryPatterns;
      
    } catch (error) {
      console.error(`[Trai] Error loading ${category}:`, error);
    }
  }

  parseConversationFile(content, category, filename) {
    const lines = content.split('\\n');
    const conversationData = {
      title: '',
      date: '',
      category: category,
      filename: filename,
      userMessages: [],
      assistantResponses: [],
      emotionalTone: 'neutral',
      technicalLevel: 'basic',
      context: '',
      patterns: []
    };

    let currentSection = 'header';
    let currentMessage = '';
    
    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        conversationData.title = line.replace(/^#+\\s*/, '');
      } else if (line.includes('user:') || line.includes('assistant:')) {
        if (line.includes('user:')) {
          conversationData.userMessages.push(line.replace(/.*user:\\s*/, ''));
        } else {
          conversationData.assistantResponses.push(line.replace(/.*assistant:\\s*/, ''));
        }
      }
    }
    
    return conversationData;
  }

  // ==========================================
  // OLLAMA CONNECTION SYSTEM (from trai-coding-assistant.js)
  // ==========================================
  
  async testOllamaConnection() {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.currentModel,
        prompt: "Test connection - respond with 'OK'",
        stream: false
      }, { timeout: 5000 });
      
      return { success: true, response: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processCodeRequest(request) {
    try {
      // Build enhanced prompt with training data context
      const trainingContext = this.getRelevantTrainingContext(request);
      const enhancedPrompt = this.buildEnhancedPrompt(request, trainingContext);
      
      // Send to local Ollama
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.currentModel,
        prompt: enhancedPrompt,
        stream: false
      });
      
      return { success: true, response: response.data.response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getRelevantTrainingContext(request) {
    // Search through training data for relevant context
    let context = '';
    const requestLower = request.toLowerCase();
    
    for (const [category, files] of this.personalityCore) {
      for (const [filename, data] of files) {
        if (data.userMessages.some(msg => 
          msg.toLowerCase().includes(requestLower.substring(0, 20)) ||
          requestLower.includes(msg.toLowerCase().substring(0, 10))
        )) {
          context += `\\n[${category}] ${data.context || data.userMessages.join(' ')}`;
        }
      }
    }
    
    return context.substring(0, 2000); // Limit context size
  }

  buildEnhancedPrompt(request, trainingContext) {
    return `You are Trai, an elite AI trading assistant and tech support expert.

Training Context: ${trainingContext}

Current Request: ${request}

Respond as Trai would - confident, knowledgeable about trading, tech support, and the OGZPrime system. Use your training data context to provide specific, helpful answers.`;
  }

  async cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    await this.memory.cleanup();
    console.log('[Trai] Cleanup completed');
  }
}

module.exports = TraiCodeLlama;