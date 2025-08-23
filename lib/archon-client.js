// Archon Client for OGZ Prime Trading Bot
// Connects to Archon Knowledge Management System

const axios = require('axios');

class ArchonClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://149.248.242.111:8181';
    this.apiKey = config.apiKey || process.env.ARCHON_API_KEY;
    this.enabled = false; // DISABLED - external dependencies
  }

  // Log a trade to Archon for pattern analysis
  async logTrade(tradeData) {
    if (!this.enabled) return;
    
    try {
      const knowledge = {
        category: 'trade_pattern',
        subcategory: tradeData.botType,
        title: `${tradeData.action} - ${tradeData.pattern || 'Manual'}`,
        problem: `Market conditions at ${tradeData.price}`,
        solution: `${tradeData.action} executed with ${tradeData.confidence}% confidence`,
        code_snippet: JSON.stringify(tradeData, null, 2),
        tags: [tradeData.botType, tradeData.action, tradeData.pair || 'BTC-USD'],
        severity: tradeData.pnl < 0 ? 'high' : 'low',
        metadata: tradeData
      };

      await this.addKnowledge(knowledge);
    } catch (error) {
      console.error('Failed to log trade to Archon:', error.message);
    }
  }

  // Log an error or bug to learn from
  async logError(errorData) {
    if (!this.enabled) return;
    
    try {
      const knowledge = {
        category: 'bug',
        subcategory: errorData.category || 'unknown',
        title: errorData.error || 'Unknown Error',
        problem: errorData.problem || errorData.error,
        solution: errorData.solution || 'Investigating...',
        code_snippet: errorData.code || errorData.stack,
        tags: ['error', errorData.category, errorData.severity || 'medium'],
        severity: errorData.severity || 'medium',
        time_wasted: errorData.timeWasted,
        never_do_again: errorData.neverDoAgain || false,
        always_do: errorData.alwaysDo || false,
        metadata: errorData
      };

      await this.addKnowledge(knowledge);
    } catch (error) {
      console.error('Failed to log error to Archon:', error.message);
    }
  }

  // Add knowledge to Archon
  async addKnowledge(knowledge) {
    if (!this.enabled) return;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/knowledge/add`,
        knowledge,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to add knowledge to Archon:', error.message);
      throw error;
    }
  }

  // Search knowledge base
  async search(query, limit = 10) {
    if (!this.enabled) return [];
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/knowledge/search`,
        {
          query,
          limit,
          include_code_examples: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );
      
      return response.data.results;
    } catch (error) {
      console.error('Failed to search Archon:', error.message);
      return [];
    }
  }

  // Get similar problems/solutions
  async getSimilar(problem, limit = 5) {
    if (!this.enabled) return [];
    
    try {
      const results = await this.search(problem, limit);
      return results.filter(r => r.category === 'bug' || r.category === 'solution');
    } catch (error) {
      console.error('Failed to get similar from Archon:', error.message);
      return [];
    }
  }

  // Log pattern recognition
  async logPattern(patternData) {
    if (!this.enabled) return;
    
    try {
      const knowledge = {
        category: 'pattern',
        subcategory: patternData.type || 'technical',
        title: patternData.name,
        problem: `Pattern detected: ${patternData.name}`,
        solution: `Confidence: ${patternData.confidence}%, Expected move: ${patternData.expectedMove}%`,
        code_snippet: JSON.stringify(patternData.indicators, null, 2),
        tags: ['pattern', patternData.pair, patternData.timeframe],
        severity: patternData.confidence > 70 ? 'high' : 'medium',
        metadata: patternData
      };

      await this.addKnowledge(knowledge);
    } catch (error) {
      console.error('Failed to log pattern to Archon:', error.message);
    }
  }

  // Log performance metrics
  async logPerformance(metrics) {
    if (!this.enabled) return;
    
    try {
      const knowledge = {
        category: 'performance',
        subcategory: metrics.botType || 'system',
        title: `Performance Report - ${new Date().toISOString().split('T')[0]}`,
        problem: `Daily performance metrics`,
        solution: `Win rate: ${metrics.winRate}%, P&L: $${metrics.totalPnl}`,
        code_snippet: JSON.stringify(metrics, null, 2),
        tags: ['performance', metrics.botType, 'daily'],
        severity: metrics.totalPnl < 0 ? 'high' : 'low',
        metadata: metrics
      };

      await this.addKnowledge(knowledge);
    } catch (error) {
      console.error('Failed to log performance to Archon:', error.message);
    }
  }

  // Check if similar error has occurred before
  async checkKnownIssue(error) {
    if (!this.enabled) return null;
    
    try {
      const similar = await this.getSimilar(error, 1);
      if (similar.length > 0 && similar[0].similarity > 0.8) {
        return {
          known: true,
          solution: similar[0].solution,
          previousOccurrences: similar[0].times_encountered || 1
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to check known issue:', err.message);
      return null;
    }
  }

  // Crawl GitHub repository
  async crawlRepository(repoUrl = 'https://github.com/CGP-ME/OGZFV') {
    if (!this.enabled) return;
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/knowledge/crawl`,
        {
          url: repoUrl,
          max_depth: 3,
          max_pages: 100
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );
      
      console.log(`Crawling ${repoUrl}...`);
      return response.data;
    } catch (error) {
      console.error('Failed to crawl repository:', error.message);
    }
  }
}

// Create singleton instance
const archonClient = new ArchonClient({
  enabled: process.env.ARCHON_ENABLED !== 'false'
});

// Export for use in trading bot
module.exports = archonClient;

// Usage examples:
/*
const archon = require('./lib/archon-client');

// Log a successful trade
await archon.logTrade({
  botType: 'quantum',
  action: 'BUY',
  pair: 'BTC-USD',
  price: 42000,
  quantity: 0.01,
  pattern: 'Neural Convergence',
  confidence: 85,
  pnl: 247.50
});

// Log an error
await archon.logError({
  category: 'websocket',
  error: 'Connection timeout after 30s',
  problem: 'WebSocket connection to Coinbase dropped',
  solution: 'Implemented exponential backoff reconnection',
  severity: 'high',
  neverDoAgain: false,
  alwaysDo: true
});

// Search for solutions
const solutions = await archon.search('websocket connection issues');

// Check if error is known
const known = await archon.checkKnownIssue('WebSocket connection timeout');
if (known) {
  console.log('Known issue! Solution:', known.solution);
}
*/