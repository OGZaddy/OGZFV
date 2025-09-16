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
const { routeQuestion, pruneMemory } = require('./trai/skills/index.js');

class TraiSingleton extends EventEmitter {
  constructor() {
    super();
    
    // Singleton pattern
    if (TraiSingleton.instance) {
      return TraiSingleton.instance;
    }
    
    // Configuration
    this.config = {
      // Allow overriding the SSL hub URL so local TRAI can connect to a remote VPS
      sslServerUrl: process.env.SSL_SERVER_URL || 'ws://127.0.0.1:3010/ws',
      // Local or remote Ollama endpoint
      ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
      // Gate LLM usage to avoid running models on the VPS unless explicitly enabled
      enableOllama: (process.env.OLLAMA_ENABLED === 'true' || process.env.OLLAMA_ENABLED === '1'),
      // Choose a model that fits your local GPU/RAM; can override via LLM_MODEL env
      model: process.env.LLM_MODEL || 'qwen3-coder:30b',
      // Training data + persistent memory (overridable via env)
      memoryPath: process.env.TRAINING_DATA_PATH || path.resolve(process.cwd(), 'trai', 'conversations.json'),
      persistentMemoryPath: process.env.PERSISTENT_MEMORY_PATH || path.resolve(process.cwd(), 'trai', 'trai-memory.json'),
      // Knowledge base directories to scan when LLM is disabled
      knowledgeDirs: (process.env.KNOWLEDGE_DIRS
        ? process.env.KNOWLEDGE_DIRS.split(',').map(s => path.resolve(process.cwd(), s.trim())).filter(Boolean)
        : ['knowledge','docs','public'].map(d => path.resolve(process.cwd(), d))),
      // Telemetry (opt-in) for aggregated learning
      telemetryEnabled: (process.env.TRAI_TELEMETRY_ENABLED === 'true' || process.env.TRAI_TELEMETRY_ENABLED === '1'),
      telemetryUrl: process.env.TRAI_AGGREGATOR_URL || 'https://ogzprime.com/api/trai/insight',
      telemetryToken: process.env.TRAI_TELEMETRY_TOKEN || '',
      customerId: process.env.CUSTOMER_ID || '',
      deploymentId: process.env.DEPLOYMENT_ID || ''
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
      // Step 1: Test Ollama connection (only if enabled)
      if (this.config.enableOllama) {
        await this.testOllama();
      } else {
        this.ollamaReady = false;
        console.log('🧠 [TRAI] Ollama disabled by config (OLLAMA_ENABLED not true)');
      }
      
      // Step 2: Connect to SSL server as client
      await this.connectToSSL();
      
      // Step 3: Load memory
      await this.loadMemory();
      
      // Step 4: Periodically re-check Ollama/tunnel health
      this._ollamaHealthTimer = setInterval(() => {
        this.testOllama().catch(() => {});
      }, 30000);
      
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
    if (!this.config.enableOllama) {
      this.ollamaReady = false;
      return;
    }
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

      case 'query':
        // Compat: treat as question if present
        if (msg.prompt) await this.answerQuestion(msg.prompt);
        break;
        
      case 'trai_question':
        // Handle questions forwarded from SSL server
        const answer = await this.answerQuestion(msg.question);
        // Send answer back through WebSocket
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'trai_answer',
            to: msg.from,
            answer: answer,
            timestamp: Date.now()
          }));
        }
        break;
        
      case 'market_data':
        await this.analyzeMarket(msg.data);
        break;
        
      default:
        console.log(`[TRAI] Received: ${msg.type}`);
    }
  }
  
  async queryQwen(prompt, context = {}) {
    if (!this.ollamaReady || !this.config.enableOllama) {
      // Do not attempt any local LLM call on this host
      throw new Error('LLM disabled');
    }
    
    try {
      const url = `${this.config.ollamaUrl}/api/generate`;
      const payload = {
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 2048
        }
      };
      console.log(`[TRAI] Calling Ollama at ${url} with model ${payload.model}`);
      const response = await axios.post(url, payload, {
        timeout: 60000
      });
      
      return response.data.response;
    } catch (error) {
      console.error('[TRAI] Qwen query failed:', error.message);
      // Try to reconnect to Ollama next tick, but don't block here
      setTimeout(() => this.testOllama().catch(()=>{}), 0);
      throw error;
    }
  }
  
  async analyzeTrade(tradeData) {
    console.log('📊 [TRAI] Analyzing trade...');
    this.stats.tradesAnalyzed++;
    
    const prompt = `As an elite trading AI, analyze this trade:
${JSON.stringify(tradeData, null, 2)}

Provide: risk assessment, optimization suggestions, and pattern identification.`;
    
    try {
      const analysis = this.ollamaReady
        ? await this.queryQwen(prompt)
        : this.localTradeAnalysis(tradeData);
      
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

      // Upload sanitized telemetry (opt-in) for aggregated learning
      try {
        await this.uploadTelemetry({
          kind: 'trade_analysis',
          timestamp: Date.now(),
          tier: tradeData.tier || tradeData.botTier || undefined,
          direction: tradeData.direction || tradeData.action,
          confidence: tradeData.confidence,
          patterns: Array.isArray(tradeData.patterns) ? tradeData.patterns.slice(0, 10) : undefined,
          pnlEst: tradeData.pnl,
        });
      } catch (_) {}

      return analysis;
    } catch (error) {
      console.error('[TRAI] Trade analysis failed:', error.message);
    }
  }
  
  async answerQuestion(question) {
    console.log('💬 [TRAI] Answering question...');
    this.stats.questionsAnswered++;

    try {
      const llm = (this.ollamaReady && this.config.enableOllama) ? (async (p)=> this.queryQwen(p)) : null;
      // Knowledge base dirs (support/onboarding)
      const knowledgeDirs = this.config.knowledgeDirs || [];
      const answer = await routeQuestion({ question }, {
        llm,
        knowledgeDirs,
        persistentMemory: this.persistentMemory
      });

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

      // Only persist GOOD conversations (not generic/error responses)
      try {
        // Don't save generic/fallback responses
        const isGenericResponse = answer.includes('I\'m here to help') ||
                                 answer.includes('Please rephrase') ||
                                 answer.includes('I appreciate the vision') ||
                                 answer.includes('I don\'t have personal') ||
                                 answer.length < 50; // Too short probably means fallback

        if (!isGenericResponse && answer && question) {
          if (!this.persistentMemory.conversations) this.persistentMemory.conversations = [];
          this.persistentMemory.conversations.push({ question, answer, timestamp: Date.now() });
        pruneMemory(this.persistentMemory);
        await this.saveMemory();
      } catch {}

      return answer;
    } catch (error) {
      console.error('[TRAI] Question answering failed:', error.message);
      // Graceful notice to client that chat is disabled here (no fake content)
      if (this.connected) {
        this.ws.send(JSON.stringify({
          type: 'answer',
          data: {
            question: question,
            answer: 'TRAI chat is not available on this host.',
            timestamp: Date.now()
          }
        }));
      }
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

  async uploadTelemetry(payload) {
    try {
      if (!this.config.telemetryEnabled) return;
      if (!this.config.telemetryUrl || !this.config.telemetryToken) return;
      const body = {
        ...payload,
        customer: this.config.customerId || undefined,
        deploy: this.config.deploymentId || undefined,
        version: 1
      };
      await axios.post(this.config.telemetryUrl, body, {
        headers: { 'Content-Type': 'application/json', 'x-insight-token': this.config.telemetryToken },
        timeout: 3000
      });
    } catch (e) {
      // silent fail (no telemetry is better than blocking)
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
      const analysis = this.ollamaReady
        ? await this.queryQwen(prompt)
        : this.localMarketAnalysis(marketData);
      
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

  // ================================
  // Local fallback analysis (no LLM)
  // ================================
  localTradeAnalysis(trade) {
    try {
      const side = (trade.action || trade.side || '').toUpperCase();
      const price = Number(trade.price || trade.entryPrice || 0);
      const qty = Number(trade.quantity || trade.size || 0);
      const stop = Number(trade.stop || trade.stopLoss || 0);
      const take = Number(trade.take || trade.takeProfit || 0);
      const riskPerUnit = stop && price ? Math.max(0, (side === 'BUY' ? price - stop : stop - price)) : 0;
      const riskNotional = riskPerUnit * qty;
      const rrPerUnit = (take && price) ? Math.max(0, (side === 'BUY' ? take - price : price - take)) : 0;
      const rr = riskPerUnit > 0 ? (rrPerUnit / riskPerUnit).toFixed(2) : 'N/A';
      const ts = new Date().toISOString();

      // Heuristic flags
      const flags = [];
      if (!stop) flags.push('No stop specified');
      if (!take) flags.push('No take-profit specified');
      if (riskNotional > 0 && riskNotional > 0.02 * (trade.balance || 10000)) flags.push('Risk > 2% of balance');

      return [
        `Local Trade Analysis @ ${ts}`,
        `- Side: ${side} Qty: ${qty} Entry: ${price}`,
        `- Stop: ${stop || 'n/a'} Take: ${take || 'n/a'}`,
        `- Risk/unit: ${riskPerUnit.toFixed ? riskPerUnit.toFixed(2) : riskPerUnit}`,
        `- R:R: ${rr}`,
        flags.length ? `- Flags: ${flags.join('; ')}` : '- Flags: none'
      ].join('\n');
    } catch (e) {
      return 'Local trade analysis unavailable (parse error)';
    }
  }

  localMarketAnalysis(market) {
    try {
      const ts = new Date().toISOString();
      const asset = market.asset || market.symbol || 'UNKNOWN';
      const prices = [];
      if (Array.isArray(market.ticks)) {
        market.ticks.slice(-10).forEach(t => {
          if (t && typeof t.price === 'number') prices.push(t.price);
        });
      } else if (typeof market.price === 'number') {
        prices.push(market.price);
      }

      let momentum = 'flat';
      if (prices.length >= 3) {
        const p0 = prices[prices.length - 3];
        const p1 = prices[prices.length - 2];
        const p2 = prices[prices.length - 1];
        momentum = p2 > p1 && p1 > p0 ? 'up' : (p2 < p1 && p1 < p0 ? 'down' : 'mixed');
      }

      return [
        `Local Market Analysis @ ${ts}`,
        `- Asset: ${asset}`,
        `- Momentum (last 3): ${momentum}`,
        prices.length ? `- Last price: ${prices[prices.length - 1]}` : `- Price: n/a`,
        `- Note: Running in offline mode (tunnel down)`
      ].join('\n');
    } catch (e) {
      return 'Local market analysis unavailable (parse error)';
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
