// ==========================================
// CUSTOMER PERSISTENT DATA ARCHITECTURE
// Each customer gets their own isolated storage
// ==========================================

const fs = require('fs').promises;
const path = require('path');

class CustomerDataManager {
  constructor() {
    this.dataRoot = '/home/trey/OGZFV-valhalla/customer-data';
    this.ensureDirectories();
  }

  async ensureDirectories() {
    // Structure:
    // customer-data/
    //   ├── customer-123/
    //   │   ├── patterns.json      (learned patterns)
    //   │   ├── trades.json        (trade history)
    //   │   ├── memory.json        (TRAI memory for this customer)
    //   │   ├── config.json        (bot settings)
    //   │   └── logs/
    //   │       ├── 2025-01-01.log
    //   │       └── 2025-01-02.log
    //   └── customer-456/
    //       └── ...
    
    await fs.mkdir(this.dataRoot, { recursive: true });
  }

  async initCustomer(customerId, tier) {
    const customerDir = path.join(this.dataRoot, `customer-${customerId}`);
    
    // Create customer directories
    await fs.mkdir(customerDir, { recursive: true });
    await fs.mkdir(path.join(customerDir, 'logs'), { recursive: true });
    
    // Initialize persistent files
    const initialData = {
      patterns: {
        // Pattern recognition memory (PRO tier and above)
        learned: [],
        winningPatterns: [],
        losingPatterns: [],
        correlations: {},
        lastUpdated: Date.now()
      },
      memory: {
        // TRAI conversation history for this customer
        conversations: [],
        insights: [],
        preferences: {},
        tradingStyle: null
      },
      stats: {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        bestTrade: null,
        worstTrade: null,
        startDate: Date.now()
      }
    };
    
    // Save initial files
    await this.saveCustomerData(customerId, 'patterns', initialData.patterns);
    await this.saveCustomerData(customerId, 'memory', initialData.memory);
    await this.saveCustomerData(customerId, 'stats', initialData.stats);
    
    return customerDir;
  }

  async saveCustomerData(customerId, dataType, data) {
    const filePath = path.join(
      this.dataRoot, 
      `customer-${customerId}`, 
      `${dataType}.json`
    );
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async loadCustomerData(customerId, dataType) {
    const filePath = path.join(
      this.dataRoot, 
      `customer-${customerId}`, 
      `${dataType}.json`
    );
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null; // File doesn't exist yet
    }
  }

  async appendLog(customerId, message) {
    const today = new Date().toISOString().split('T')[0];
    const logPath = path.join(
      this.dataRoot,
      `customer-${customerId}`,
      'logs',
      `${today}.log`
    );
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    await fs.appendFile(logPath, logEntry);
  }

  // Pattern learning (PRO+ feature)
  async learnPattern(customerId, pattern, outcome) {
    const patterns = await this.loadCustomerData(customerId, 'patterns');
    
    if (!patterns) return;
    
    // Add to learned patterns
    patterns.learned.push({
      pattern,
      outcome,
      timestamp: Date.now(),
      confidence: 0.5 // Initial confidence
    });
    
    // Update winning/losing lists
    if (outcome === 'win') {
      patterns.winningPatterns.push(pattern);
    } else {
      patterns.losingPatterns.push(pattern);
    }
    
    // Keep only last 1000 patterns
    if (patterns.learned.length > 1000) {
      patterns.learned = patterns.learned.slice(-1000);
    }
    
    patterns.lastUpdated = Date.now();
    await this.saveCustomerData(customerId, 'patterns', patterns);
  }

  // TRAI memory per customer
  async updateTraiMemory(customerId, conversation) {
    const memory = await this.loadCustomerData(customerId, 'memory');
    
    if (!memory) return;
    
    memory.conversations.push({
      question: conversation.question,
      answer: conversation.answer,
      context: conversation.context,
      timestamp: Date.now()
    });
    
    // Extract insights from conversation
    if (conversation.answer.includes('pattern') || 
        conversation.answer.includes('strategy')) {
      memory.insights.push({
        insight: conversation.answer,
        timestamp: Date.now()
      });
    }
    
    // Keep only last 100 conversations
    if (memory.conversations.length > 100) {
      memory.conversations = memory.conversations.slice(-100);
    }
    
    await this.saveCustomerData(customerId, 'memory', memory);
  }

  // Get customer's full context for TRAI
  async getCustomerContext(customerId) {
    const patterns = await this.loadCustomerData(customerId, 'patterns');
    const memory = await this.loadCustomerData(customerId, 'memory');
    const stats = await this.loadCustomerData(customerId, 'stats');
    
    return {
      customerId,
      patterns: patterns?.winningPatterns || [],
      recentTrades: stats?.recentTrades || [],
      preferences: memory?.preferences || {},
      tradingStyle: memory?.tradingStyle || 'balanced',
      insights: memory?.insights || []
    };
  }
}

// ==========================================
// USAGE IN BOT
// ==========================================

class CustomerBot {
  constructor(customerId, tier) {
    this.customerId = customerId;
    this.tier = tier;
    this.dataManager = new CustomerDataManager();
  }

  async initialize() {
    // Load customer's saved patterns and memory
    this.patterns = await this.dataManager.loadCustomerData(
      this.customerId, 
      'patterns'
    );
    
    this.memory = await this.dataManager.loadCustomerData(
      this.customerId, 
      'memory'
    );
    
    // Log initialization
    await this.dataManager.appendLog(
      this.customerId,
      `Bot initialized for tier: ${this.tier}`
    );
  }

  async executeTrade(signal) {
    // Log the trade
    await this.dataManager.appendLog(
      this.customerId,
      `Trade executed: ${JSON.stringify(signal)}`
    );
    
    // If PRO+ tier, learn from the pattern
    if (this.tier !== 'starter') {
      await this.dataManager.learnPattern(
        this.customerId,
        signal.pattern,
        signal.outcome
      );
    }
  }

  async askTrai(question) {
    // Get customer's full context
    const context = await this.dataManager.getCustomerContext(this.customerId);
    
    // Send to TRAI with customer context
    const answer = await trai.answer(question, context);
    
    // Save conversation to customer's memory
    await this.dataManager.updateTraiMemory(this.customerId, {
      question,
      answer,
      context
    });
    
    return answer;
  }
}

module.exports = { CustomerDataManager, CustomerBot };