// Mover-Archon Integration
// Connects your AI Clone (Mover) to Archon Knowledge Base

const axios = require('axios');
const WebSocket = require('ws');

class MoverArchonBridge {
  constructor(config = {}) {
    // Archon connection
    this.archonUrl = config.archonUrl || 'http://149.248.242.111:8181';
    this.archonMcpUrl = config.archonMcpUrl || 'http://149.248.242.111:8051';
    
    // Mover connection
    this.moverPort = config.moverPort || process.env.MOVER_HTTP_PORT || 4000;
    this.moverWsPort = config.moverWsPort || process.env.MOVER_WS_PORT || 4001;
    
    // Voice settings from Mover
    this.voiceEnabled = process.env.VOICE_ENABLED === 'true';
    this.moverPersonality = process.env.MOVER_PERSONALITY || 'houston_focused';
    
    // Memory and learning
    this.memoryDir = process.env.MEMORY_DIR || './memory';
    this.houstonTarget = parseInt(process.env.HOUSTON_TARGET) || 25000;
    
    this.ws = null;
    this.knowledgeCache = new Map();
  }

  // Initialize connection between Mover and Archon
  async initialize() {
    console.log('🤖 Initializing Mover-Archon Bridge...');
    
    // Connect to Archon WebSocket for real-time updates
    this.connectToArchon();
    
    // Load initial knowledge
    await this.syncKnowledge();
    
    // Set up Mover endpoints
    this.setupMoverEndpoints();
    
    console.log('✅ Mover-Archon Bridge initialized!');
  }

  // Connect to Archon for real-time knowledge updates
  connectToArchon() {
    const wsUrl = `ws://${this.archonUrl.replace('http://', '')}/ws`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      console.log('📡 Connected to Archon Knowledge Stream');
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleArchonUpdate(message);
    });
    
    this.ws.on('error', (error) => {
      console.error('Archon WebSocket error:', error);
    });
    
    this.ws.on('close', () => {
      console.log('Archon connection closed, reconnecting...');
      setTimeout(() => this.connectToArchon(), 5000);
    });
  }

  // Handle real-time updates from Archon
  handleArchonUpdate(message) {
    if (message.type === 'knowledge_update') {
      // Update Mover's knowledge cache
      this.knowledgeCache.set(message.id, message.data);
      
      // If it's a critical lesson, update Mover's personality
      if (message.data.never_do_again || message.data.always_do) {
        this.updateMoverBehavior(message.data);
      }
    }
    
    if (message.type === 'trade_pattern') {
      // Learn from successful trade patterns
      this.learnTradePattern(message.data);
    }
  }

  // Sync knowledge from Archon to Mover
  async syncKnowledge() {
    try {
      // Get all critical knowledge
      const response = await axios.get(`${this.archonUrl}/api/knowledge/items`, {
        params: {
          categories: ['bug', 'solution', 'pattern', 'trade_pattern'],
          limit: 1000
        }
      });
      
      const knowledge = response.data.items;
      
      // Cache knowledge for quick access
      knowledge.forEach(item => {
        this.knowledgeCache.set(item.id, item);
      });
      
      console.log(`📚 Synced ${knowledge.length} knowledge items from Archon`);
      
      // Update Mover's memory
      await this.updateMoverMemory(knowledge);
      
    } catch (error) {
      console.error('Failed to sync knowledge:', error);
    }
  }

  // Update Mover's behavior based on lessons learned
  updateMoverBehavior(lesson) {
    const behaviorUpdate = {
      timestamp: new Date().toISOString(),
      lesson: lesson.title,
      type: lesson.never_do_again ? 'avoid' : 'prefer',
      context: lesson.problem,
      solution: lesson.solution
    };
    
    // Send to Mover's learning system
    this.sendToMover('/learn', behaviorUpdate);
    
    // If voice is enabled, Mover can announce important lessons
    if (this.voiceEnabled && lesson.severity === 'critical') {
      this.moverSpeak(`Important lesson learned: ${lesson.title}. ${lesson.solution}`);
    }
  }

  // Learn from trade patterns
  async learnTradePattern(pattern) {
    const learning = {
      pattern: pattern.name,
      confidence: pattern.confidence,
      outcome: pattern.pnl > 0 ? 'success' : 'failure',
      conditions: pattern.indicators,
      timestamp: pattern.executed_at
    };
    
    // Store in Mover's pattern memory
    await this.sendToMover('/learn/pattern', learning);
    
    // Update trading confidence based on patterns
    if (pattern.confidence > 80 && pattern.pnl > 0) {
      console.log(`🎯 Mover learned successful pattern: ${pattern.name}`);
    }
  }

  // Update Mover's memory with Archon knowledge
  async updateMoverMemory(knowledge) {
    const memoryUpdate = {
      source: 'archon',
      timestamp: new Date().toISOString(),
      knowledge: knowledge.map(k => ({
        id: k.id,
        category: k.category,
        title: k.title,
        solution: k.solution,
        tags: k.tags,
        importance: k.severity === 'critical' ? 10 : 5
      }))
    };
    
    // Send to Mover's memory system
    await this.sendToMover('/memory/update', memoryUpdate);
  }

  // Send data to Mover
  async sendToMover(endpoint, data) {
    try {
      const response = await axios.post(
        `http://localhost:${this.moverPort}${endpoint}`,
        data,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to send to Mover ${endpoint}:`, error.message);
    }
  }

  // Make Mover speak (if voice enabled)
  async moverSpeak(text) {
    if (!this.voiceEnabled) return;
    
    try {
      await this.sendToMover('/speak', {
        text,
        personality: this.moverPersonality,
        emotion: 'confident'
      });
    } catch (error) {
      console.error('Mover speak failed:', error);
    }
  }

  // Set up Mover API endpoints that query Archon
  setupMoverEndpoints() {
    const express = require('express');
    const app = express();
    app.use(express.json());
    
    // Mover asks Archon for help
    app.post('/mover/ask', async (req, res) => {
      const { question, context } = req.body;
      
      try {
        // Query Archon's knowledge base
        const response = await axios.post(
          `${this.archonUrl}/api/knowledge/search`,
          {
            query: question,
            context,
            limit: 5
          }
        );
        
        const answers = response.data.results;
        
        // Format response in Mover's personality
        const moverResponse = this.formatMoverResponse(answers, question);
        
        res.json({
          success: true,
          response: moverResponse,
          sources: answers.map(a => a.title)
        });
        
      } catch (error) {
        res.json({
          success: false,
          response: "I'm having trouble accessing my knowledge base right now.",
          error: error.message
        });
      }
    });
    
    // Mover reports new learnings to Archon
    app.post('/mover/report', async (req, res) => {
      const { learning, category, importance } = req.body;
      
      try {
        // Add Mover's learning to Archon
        const response = await axios.post(
          `${this.archonUrl}/api/knowledge/add`,
          {
            category: category || 'mover_learning',
            title: `Mover Discovery: ${learning.title}`,
            problem: learning.problem,
            solution: learning.solution,
            tags: ['mover', 'ai-discovered', ...learning.tags || []],
            severity: importance || 'medium',
            metadata: {
              discoveredBy: 'mover',
              personality: this.moverPersonality,
              timestamp: new Date().toISOString()
            }
          }
        );
        
        res.json({
          success: true,
          message: 'Learning recorded in Archon',
          id: response.data.id
        });
        
      } catch (error) {
        res.json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Mover's trading insights
    app.post('/mover/trading-insight', async (req, res) => {
      const { market_conditions, suggested_action } = req.body;
      
      // Check Archon for similar market conditions
      const similar = await this.findSimilarConditions(market_conditions);
      
      // Combine Mover's insight with Archon's knowledge
      const combinedInsight = this.combineInsights(suggested_action, similar);
      
      res.json({
        success: true,
        insight: combinedInsight,
        confidence: this.calculateConfidence(similar),
        historical_performance: similar.map(s => ({
          pattern: s.title,
          outcome: s.metadata?.pnl || 'unknown'
        }))
      });
    });
    
    // Houston progress tracker integration
    app.get('/mover/houston-status', async (req, res) => {
      const currentBalance = parseInt(process.env.ACCOUNT_BALANCE) || 10000;
      const target = this.houstonTarget;
      const progress = ((currentBalance / target) * 100).toFixed(2);
      
      // Get relevant knowledge for reaching Houston
      const houstonKnowledge = await this.searchArchon('profitable trading patterns high confidence');
      
      res.json({
        current_balance: currentBalance,
        houston_target: target,
        progress_percent: progress,
        mover_personality: this.moverPersonality,
        top_strategies: houstonKnowledge.slice(0, 3).map(k => k.title),
        message: this.generateHoustonMessage(progress)
      });
    });
    
    const PORT = this.moverPort + 100; // Run on separate port
    app.listen(PORT, () => {
      console.log(`🤖 Mover-Archon Bridge API running on port ${PORT}`);
    });
  }

  // Search Archon knowledge base
  async searchArchon(query) {
    try {
      const response = await axios.post(
        `${this.archonUrl}/api/knowledge/search`,
        { query, limit: 10 }
      );
      return response.data.results;
    } catch (error) {
      console.error('Archon search failed:', error);
      return [];
    }
  }

  // Find similar market conditions in history
  async findSimilarConditions(conditions) {
    const query = `market conditions ${conditions.trend} volatility ${conditions.volatility} volume ${conditions.volume}`;
    return await this.searchArchon(query);
  }

  // Combine Mover's insights with Archon's knowledge
  combineInsights(moverSuggestion, archonKnowledge) {
    if (archonKnowledge.length === 0) {
      return moverSuggestion;
    }
    
    // Find consensus between Mover and historical data
    const historicalSuccess = archonKnowledge.filter(k => 
      k.metadata?.pnl > 0 && k.metadata?.confidence > 70
    );
    
    if (historicalSuccess.length > 0) {
      return {
        primary: moverSuggestion,
        historical_validation: true,
        similar_successful_patterns: historicalSuccess.length,
        recommended_confidence: Math.min(95, moverSuggestion.confidence + 10)
      };
    }
    
    return {
      primary: moverSuggestion,
      historical_validation: false,
      caution: 'No strong historical precedent',
      recommended_confidence: Math.max(50, moverSuggestion.confidence - 10)
    };
  }

  // Calculate confidence based on historical data
  calculateConfidence(historicalData) {
    if (historicalData.length === 0) return 50;
    
    const successRate = historicalData.filter(d => 
      d.metadata?.pnl > 0
    ).length / historicalData.length;
    
    return Math.round(50 + (successRate * 45)); // 50-95% range
  }

  // Format response in Mover's personality
  formatMoverResponse(answers, question) {
    if (answers.length === 0) {
      return `I don't have specific knowledge about "${question}" yet, but I'm learning. Let me observe and report back.`;
    }
    
    const topAnswer = answers[0];
    
    if (this.moverPersonality === 'houston_focused') {
      return `Based on my analysis, ${topAnswer.solution}. This approach has shown ${topAnswer.metadata?.confidence || 'good'} confidence. Remember, we're ${((parseInt(process.env.ACCOUNT_BALANCE) / this.houstonTarget) * 100).toFixed(1)}% to Houston!`;
    }
    
    return `${topAnswer.solution} [Source: ${topAnswer.title}]`;
  }

  // Generate Houston progress message
  generateHoustonMessage(progress) {
    if (progress >= 100) {
      return "🚀 HOUSTON, WE HAVE ARRIVED! Target achieved!";
    } else if (progress >= 75) {
      return "📡 Houston is in sight! Final approach initiated.";
    } else if (progress >= 50) {
      return "🛸 Halfway to Houston! Systems performing nominally.";
    } else if (progress >= 25) {
      return "🚀 Launch successful! Trajectory to Houston confirmed.";
    } else {
      return "🔧 Preparing for Houston mission. Systems check in progress.";
    }
  }

  // Connect to MCP for advanced AI operations
  async connectToMcp() {
    try {
      const response = await axios.get(`${this.archonMcpUrl}/health`);
      if (response.data.status === 'healthy') {
        console.log('✅ Connected to Archon MCP Server');
        
        // Register Mover as an MCP client
        await axios.post(`${this.archonMcpUrl}/register`, {
          client_name: 'mover_ai_clone',
          client_type: 'ai_assistant',
          capabilities: ['voice', 'learning', 'trading_insights']
        });
      }
    } catch (error) {
      console.error('Failed to connect to MCP:', error);
    }
  }
}

// Initialize the bridge
const bridge = new MoverArchonBridge();

// Start the integration
bridge.initialize().then(() => {
  console.log('🎯 Mover-Archon Integration Active!');
  
  // Connect to MCP for advanced features
  bridge.connectToMcp();
  
  // Example: Mover learns from a trade
  setTimeout(async () => {
    await bridge.learnTradePattern({
      name: 'Neural Convergence',
      confidence: 85,
      pnl: 247.50,
      indicators: { rsi: 45, macd: 'bullish' },
      executed_at: new Date().toISOString()
    });
  }, 5000);
});

module.exports = bridge;