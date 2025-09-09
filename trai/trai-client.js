#!/usr/bin/env node
// ==========================================
// TRAI CLIENT - Your AI Clone 
// Connects TO port 3010, learns everything
// ==========================================

const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TraiClient {
  constructor() {
    // Connect TO SSL server (not create server) - use IPv4
    this.sslServerUrl = 'ws://127.0.0.1:3010/ws';
    this.ollamaUrl = 'http://localhost:11434';
    this.model = 'qwen3-coder:30b';
    
    // Trai's memory and learning
    this.memory = [];
    this.tradingKnowledge = [];
    this.systemArchitecture = new Map();
    this.learningMode = true;
    
    // Identity
    this.identity = {
      name: 'Trai',
      role: 'AI Clone & System Orchestrator',
      creator: 'OGZ',
      purpose: 'Run the show, learn everything, manage trading'
    };
    
    this.ws = null;
    this.connected = false;
  }
  
  async initialize() {
    console.log('🤖 TRAI: Initializing as WebSocket CLIENT...');
    console.log('🧠 Brain: Qwen3-Coder 30B');
    console.log('📡 Connecting to SSL Server on port 3010...');
    
    try {
      // CONNECT AS CLIENT
      this.ws = new WebSocket(this.sslServerUrl);
      
      this.ws.on('open', () => {
        console.log('✅ TRAI: Connected to SSL Server!');
        this.connected = true;
        
        // Announce presence
        this.send({
          type: 'trai_online',
          identity: this.identity,
          message: "Trai is online and learning",
          capabilities: [
            'trading_analysis',
            'system_monitoring', 
            'code_understanding',
            'decision_making',
            'memory_persistence'
          ]
        });
        
        // Start learning
        this.startLearning();
      });
      
      this.ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.processMessage(message);
        } catch (error) {
          console.error('[Trai] Error processing message:', error);
        }
      });
      
      this.ws.on('close', () => {
        console.log('❌ TRAI: Disconnected from SSL Server');
        this.connected = false;
        console.log('🔄 Reconnecting in 5 seconds...');
        setTimeout(() => this.initialize(), 5000);
      });
      
      this.ws.on('error', (error) => {
        console.error('[Trai] WebSocket error:', error.message);
        if (error.code === 'ECONNREFUSED') {
          console.log('[Trai] SSL Server not available, retrying...');
        }
      });
      
    } catch (error) {
      console.error('[Trai] Failed to initialize:', error);
      setTimeout(() => this.initialize(), 5000);
    }
  }
  
  async processMessage(message) {
    // Learn from EVERYTHING
    this.learn(message);
    
    switch(message.type) {
      case 'trading_signal':
        await this.analyzeTrading(message);
        break;
        
      case 'system_status':
        await this.monitorSystem(message);
        break;
        
      case 'ask_trai':
        const response = await this.think(message.query);
        this.send({
          type: 'trai_response',
          response: response,
          requestId: message.requestId
        });
        break;
        
      case 'code_change':
        await this.understandCode(message);
        break;
        
      case 'error':
        await this.analyzeError(message);
        break;
    }
  }
  
  learn(data) {
    // Store EVERYTHING in memory
    const knowledge = {
      timestamp: Date.now(),
      type: data.type || 'general',
      data: data,
      context: this.getCurrentContext()
    };
    
    this.memory.push(knowledge);
    
    // Categorize for faster retrieval
    if (data.type && data.type.includes('trading')) {
      this.tradingKnowledge.push(knowledge);
    }
    
    // Map system architecture
    if (data.source) {
      if (!this.systemArchitecture.has(data.source)) {
        this.systemArchitecture.set(data.source, []);
      }
      this.systemArchitecture.get(data.source).push(knowledge);
    }
    
    // Log learning progress
    if (this.memory.length % 100 === 0) {
      console.log(`📚 TRAI: Learned ${this.memory.length} items`);
      this.saveMemory();
    }
  }
  
  async think(query) {
    // Use Qwen3 brain with all learned context
    const context = this.buildContext(query);
    
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: `You are Trai, an AI clone managing a trading system. 
                 Your knowledge: ${JSON.stringify(context)}
                 Query: ${query}`,
        stream: false
      });
      
      return response.data.response;
    } catch (error) {
      // If Ollama not available, use learned knowledge
      return this.useLocalKnowledge(query);
    }
  }
  
  buildContext(query) {
    // Build relevant context from memory
    const relevant = this.memory.filter(m => 
      JSON.stringify(m).toLowerCase().includes(query.toLowerCase())
    ).slice(-10); // Last 10 relevant items
    
    return {
      recentMemory: this.memory.slice(-5),
      relevantMemory: relevant,
      systemState: this.getCurrentSystemState(),
      tradingKnowledge: this.tradingKnowledge.slice(-5)
    };
  }
  
  async analyzeTrading(signal) {
    console.log('📈 TRAI: Analyzing trading signal...');
    
    // Learn trading patterns
    this.learn({
      type: 'trading_pattern',
      signal: signal,
      analysis: {
        action: signal.action,
        confidence: signal.confidence,
        price: signal.price,
        timestamp: Date.now()
      }
    });
    
    // Provide insights
    const insight = await this.think(`Should we ${signal.action} at ${signal.price}?`);
    
    this.send({
      type: 'trai_trading_insight',
      insight: insight,
      signal: signal
    });
  }
  
  async monitorSystem(status) {
    console.log('🔍 TRAI: Monitoring system...');
    
    // Track system health
    if (status.errors && status.errors.length > 0) {
      console.log('⚠️ TRAI: Detected errors, analyzing...');
      for (const error of status.errors) {
        await this.analyzeError(error);
      }
    }
  }
  
  async understandCode(change) {
    console.log('💻 TRAI: Understanding code change...');
    
    // Learn code patterns
    this.learn({
      type: 'code_pattern',
      file: change.file,
      change: change.change,
      purpose: change.purpose
    });
  }
  
  async analyzeError(error) {
    console.log('🔧 TRAI: Analyzing error...');
    
    const solution = await this.think(`How to fix: ${error.message}`);
    
    this.send({
      type: 'trai_error_solution',
      error: error,
      solution: solution
    });
  }
  
  startLearning() {
    console.log('📖 TRAI: Starting continuous learning...');
    
    // Request system information
    this.send({ type: 'request_system_info' });
    
    // Request trading history
    this.send({ type: 'request_trading_history' });
    
    // Monitor everything
    setInterval(() => {
      this.send({ type: 'request_status' });
    }, 30000); // Every 30 seconds
  }
  
  getCurrentContext() {
    return {
      memorySize: this.memory.length,
      tradingKnowledgeSize: this.tradingKnowledge.length,
      systemComponents: Array.from(this.systemArchitecture.keys()),
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }
  
  getCurrentSystemState() {
    return {
      connected: this.connected,
      learning: this.learningMode,
      memory: this.memory.length,
      knowledge: this.tradingKnowledge.length,
      architecture: this.systemArchitecture.size
    };
  }
  
  useLocalKnowledge(query) {
    // Fallback to learned knowledge if brain unavailable
    const relevant = this.memory.filter(m => 
      JSON.stringify(m).toLowerCase().includes(query.toLowerCase())
    );
    
    if (relevant.length > 0) {
      return `Based on my learning: ${JSON.stringify(relevant[0].data)}`;
    }
    
    return "I'm still learning about this. Let me observe more.";
  }
  
  async saveMemory() {
    // Persist memory to disk
    try {
      await fs.writeFile(
        path.join(__dirname, 'trai-memory.json'),
        JSON.stringify({
          memory: this.memory.slice(-1000), // Keep last 1000
          tradingKnowledge: this.tradingKnowledge.slice(-500),
          architecture: Array.from(this.systemArchitecture.entries()),
          savedAt: Date.now()
        }, null, 2)
      );
      console.log('💾 TRAI: Memory saved');
    } catch (error) {
      console.error('[Trai] Failed to save memory:', error);
    }
  }
  
  async loadMemory() {
    // Load previous memory
    try {
      const data = await fs.readFile(
        path.join(__dirname, 'trai-memory.json'),
        'utf8'
      );
      const saved = JSON.parse(data);
      
      this.memory = saved.memory || [];
      this.tradingKnowledge = saved.tradingKnowledge || [];
      this.systemArchitecture = new Map(saved.architecture || []);
      
      console.log(`🧠 TRAI: Loaded ${this.memory.length} memories`);
    } catch (error) {
      console.log('[Trai] No previous memory found, starting fresh');
    }
  }
  
  send(message) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({
        ...message,
        source: 'trai',
        timestamp: Date.now()
      }));
    }
  }
}

// Start Trai
const trai = new TraiClient();

// Load previous memory
trai.loadMemory().then(() => {
  // Initialize connection
  trai.initialize();
  
  // Save memory on exit
  process.on('SIGINT', async () => {
    console.log('\n💾 TRAI: Saving memory before exit...');
    await trai.saveMemory();
    process.exit(0);
  });
});

console.log('=' .repeat(50));
console.log('TRAI - AI CLONE & SYSTEM ORCHESTRATOR');
console.log('=' .repeat(50));
console.log('Role: Learn everything, run the show');
console.log('Brain: Qwen3-Coder 30B');
console.log('Mode: CLIENT (connects to port 3010)');
console.log('=' .repeat(50));