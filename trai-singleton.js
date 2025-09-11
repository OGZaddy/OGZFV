#!/usr/bin/env node
// ==========================================
// TRAI SINGLETON - The ONE instance that manages everything
// Connects as CLIENT to SSL server, uses Qwen brain, loads full memory
// ==========================================

const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class TraiSingleton extends EventEmitter {
  constructor() {
    super();
    
    // Singleton pattern
    if (TraiSingleton.instance) {
      return TraiSingleton.instance;
    }
    
    // Configuration
    this.config = {
      sslServerUrl: 'ws://127.0.0.1:3010/ws',
      ollamaUrl: process.env.OLLAMA_URL || 'https://0f17f3bb3aaa1e.lhr.life',
      model: 'qwen3-coder:30b',
      memoryPath: '/home/trey/OGZFV-valhalla/trai/conversations.json',
      persistentMemoryPath: '/home/trey/OGZFV-valhalla/trai/trai-memory.json'
    };
    
    // Core components
    this.ws = null;
    this.connected = false;
    this.ollamaReady = false;
    this.memoryLoaded = false;
    
    // Memory systems
    this.conversations = null; // 190MB training data
    this.persistentMemory = {};
    this.shortTermMemory = [];
    
    // Stats
    this.stats = {
      startTime: Date.now(),
      questionsAnswered: 0,
      tradesAnalyzed: 0,
      connectAttempts: 0
    };
    
    TraiSingleton.instance = this;
    console.log('🤖 [TRAI] Singleton instance created');
  }
  
  async initialize() {
    console.log('🚀 [TRAI] Starting initialization...');
    
    try {
      // Step 1: Test Ollama connection
      await this.testOllama();
      
      // Step 2: Connect to SSL server as client
      await this.connectToSSL();
      
      // Step 3: Load memory
      await this.loadMemory();
      
      console.log('✅ [TRAI] Initialization complete!');
      console.log(`   📡 Connected to SSL: ${this.connected}`);
      console.log(`   🧠 Ollama/Qwen ready: ${this.ollamaReady}`);
      console.log(`   💾 Memory loaded: ${this.memoryLoaded}`);
      
      return true;
    } catch (error) {
      console.error('❌ [TRAI] Initialization failed:', error.message);
      return false;
    }
  }
  
  async testOllama() {
    try {
      console.log(`🧠 [TRAI] Testing Ollama at ${this.config.ollamaUrl}...`);
      
      const response = await axios.get(`${this.config.ollamaUrl}/api/tags`, {
        timeout: 10000
      });
      
      const models = response.data.models || [];
      const hasQwen = models.some(m => m.name.includes('qwen3-coder'));
      
      if (hasQwen) {
        this.ollamaReady = true;
        console.log('✅ [TRAI] Ollama connected, Qwen3-coder:30b available');
      } else {
        throw new Error('Qwen3-coder model not found');
      }
    } catch (error) {
      console.warn(`⚠️ [TRAI] Ollama connection failed (tunnel may be down): ${error.message}`);
      console.log('🔄 [TRAI] Will operate without Qwen inference until tunnel is restored');
      this.ollamaReady = false;
      // Don't throw - continue without Ollama
    }
  }
  
  async connectToSSL() {
    return new Promise((resolve, reject) => {
      console.log('📡 [TRAI] Connecting to SSL server as client...');
      this.stats.connectAttempts++;
      
      this.ws = new WebSocket(this.config.sslServerUrl, {
        headers: {
          'X-Client-Type': 'TRAI',
          'User-Agent': 'TRAI-Singleton'
        }
      });
      
      this.ws.on('open', () => {
        console.log('✅ [TRAI] Connected to SSL server');
        this.connected = true;
        
        // Identify ourselves
        this.ws.send(JSON.stringify({
          type: 'identify',
          source: 'trai_singleton',
          capabilities: ['analysis', 'learning', 'qwen_inference'],
          model: this.config.model
        }));
        
        resolve();
      });
      
      this.ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data);
          await this.handleMessage(msg);
        } catch (error) {
          console.error('[TRAI] Message handling error:', error.message);
        }
      });
      
      this.ws.on('close', () => {
        console.log('❌ [TRAI] Disconnected from SSL server');
        this.connected = false;
        // Reconnect after 5 seconds
        setTimeout(() => this.connectToSSL(), 5000);
      });
      
      this.ws.on('error', (error) => {
        console.error('[TRAI] WebSocket error:', error.message);
        reject(error);
      });
      
      // Timeout connection attempt
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }
  
  async handleMessage(msg) {
    switch (msg.type) {
      case 'trade':
        await this.analyzeTrade(msg.data);
        break;
      
      case 'question':
        await this.answerQuestion(msg.data);
        break;
        
      case 'market_data':
        await this.analyzeMarket(msg.data);
        break;
        
      default:
        console.log(`[TRAI] Received: ${msg.type}`);
    }
  }
  
  async queryQwen(prompt, context = {}) {
    if (!this.ollamaReady) {
      // Return a fallback response when Ollama is down
      return "I'm currently unable to process this with my full capabilities (tunnel is down), but I'm still monitoring and recording everything for analysis once connection is restored.";
    }
    
    try {
      const response = await axios.post(`${this.config.ollamaUrl}/api/generate`, {
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 2048
        }
      }, {
        timeout: 60000
      });
      
      return response.data.response;
    } catch (error) {
      console.error('[TRAI] Qwen query failed:', error.message);
      // Try to reconnect to Ollama
      await this.testOllama();
      // Return fallback response instead of throwing
      return "Analysis temporarily unavailable - tunnel connection lost. Recording data for later analysis.";
    }
  }
  
  async analyzeTrade(tradeData) {
    console.log('📊 [TRAI] Analyzing trade...');
    this.stats.tradesAnalyzed++;
    
    const prompt = `As an elite trading AI, analyze this trade:
${JSON.stringify(tradeData, null, 2)}

Provide: risk assessment, optimization suggestions, and pattern identification.`;
    
    try {
      const analysis = await this.queryQwen(prompt);
      
      // LEARN from this trade
      if (!this.persistentMemory.trades) {
        this.persistentMemory.trades = [];
      }
      
      const tradeInsight = {
        trade: tradeData,
        analysis: analysis,
        timestamp: Date.now()
      };
      
      this.persistentMemory.trades.push(tradeInsight);
      
      // Keep only last 100 trades in memory
      if (this.persistentMemory.trades.length > 100) {
        this.persistentMemory.trades.shift();
      }
      
      // Save every 10 trades
      if (this.stats.tradesAnalyzed % 10 === 0) {
        await this.saveMemory();
        console.log(`💾 [TRAI] Saved insights from ${this.stats.tradesAnalyzed} trades`);
      }
      
      // Send analysis back through WebSocket
      if (this.connected) {
        this.ws.send(JSON.stringify({
          type: 'trade_analysis',
          data: {
            trade: tradeData,
            analysis: analysis,
            timestamp: Date.now()
          }
        }));
      }
      
      return analysis;
    } catch (error) {
      console.error('[TRAI] Trade analysis failed:', error.message);
    }
  }
  
  async answerQuestion(question) {
    console.log('💬 [TRAI] Answering question...');
    this.stats.questionsAnswered++;
    
    try {
      const answer = await this.queryQwen(question);
      
      if (this.connected) {
        this.ws.send(JSON.stringify({
          type: 'answer',
          data: {
            question: question,
            answer: answer,
            timestamp: Date.now()
          }
        }));
      }
      
      return answer;
    } catch (error) {
      console.error('[TRAI] Question answering failed:', error.message);
    }
  }
  
  async loadMemory() {
    console.log('💾 [TRAI] Loading memory systems...');
    
    try {
      // Load the 190MB conversations.json
      console.log('📚 [TRAI] Loading conversations.json (190MB)...');
      const conversationsPath = this.config.memoryPath;
      
      // Check if file exists
      try {
        await fs.access(conversationsPath);
        const data = await fs.readFile(conversationsPath, 'utf8');
        this.conversations = JSON.parse(data);
        console.log(`✅ [TRAI] Loaded ${Object.keys(this.conversations).length} conversations`);
      } catch (error) {
        console.warn('[TRAI] conversations.json not found, will operate without historical context');
      }
      
      // Load persistent memory if it exists
      try {
        const persistentData = await fs.readFile(this.config.persistentMemoryPath, 'utf8');
        this.persistentMemory = JSON.parse(persistentData);
        console.log(`✅ [TRAI] Loaded persistent memory with ${Object.keys(this.persistentMemory).length} entries`);
      } catch (error) {
        console.log('[TRAI] No persistent memory found, starting fresh');
        this.persistentMemory = {
          trades: [],
          insights: [],
          patterns: [],
          lastSave: Date.now()
        };
      }
      
      this.memoryLoaded = true;
      console.log('✅ [TRAI] Memory systems loaded successfully');
      
    } catch (error) {
      console.error('[TRAI] Memory loading error:', error.message);
      // Don't fail initialization, just operate without memory
      this.memoryLoaded = false;
    }
  }
  
  async saveMemory() {
    try {
      await fs.writeFile(
        this.config.persistentMemoryPath,
        JSON.stringify(this.persistentMemory, null, 2)
      );
      console.log('[TRAI] Memory saved');
    } catch (error) {
      console.error('[TRAI] Failed to save memory:', error.message);
    }
  }
  
  async analyzeMarket(marketData) {
    console.log('📈 [TRAI] Analyzing market conditions...');
    
    const prompt = `Analyze current market conditions and provide trading recommendations:
${JSON.stringify(marketData, null, 2)}`;
    
    try {
      const analysis = await this.queryQwen(prompt);
      
      if (this.connected) {
        this.ws.send(JSON.stringify({
          type: 'market_analysis',
          data: {
            market: marketData,
            analysis: analysis,
            timestamp: Date.now()
          }
        }));
      }
      
      return analysis;
    } catch (error) {
      console.error('[TRAI] Market analysis failed:', error.message);
    }
  }
  
  getStatus() {
    return {
      connected: this.connected,
      ollamaReady: this.ollamaReady,
      memoryLoaded: this.memoryLoaded,
      uptime: Date.now() - this.stats.startTime,
      stats: this.stats
    };
  }
}

// Start TRAI if run directly
if (require.main === module) {
  const trai = new TraiSingleton();
  
  trai.initialize().then(success => {
    if (success) {
      console.log('🚀 [TRAI] System operational');
      
      // Status report every minute
      setInterval(() => {
        const status = trai.getStatus();
        console.log(`📊 [TRAI] Status: Connected=${status.connected}, Questions=${status.stats.questionsAnswered}, Trades=${status.stats.tradesAnalyzed}`);
      }, 60000);
      
      // Auto-save memory every 5 minutes
      setInterval(async () => {
        if (trai.memoryLoaded) {
          await trai.saveMemory();
          console.log('💾 [TRAI] Auto-saved memory');
        }
      }, 300000);
    } else {
      console.error('❌ [TRAI] Failed to start');
      process.exit(1);
    }
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n💾 [TRAI] Shutting down...');
    
    // Save memory before shutdown
    if (trai.memoryLoaded) {
      await trai.saveMemory();
      console.log('💾 [TRAI] Memory saved before shutdown');
    }
    
    if (trai.ws) {
      trai.ws.close();
    }
    process.exit(0);
  });
}

module.exports = TraiSingleton;