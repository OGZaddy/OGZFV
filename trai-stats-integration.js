// ========================================================================
// TRAI STATS INTEGRATION - Wire trading stats into WebSocket streamer
// As suggested by Claude for real-time stats monitoring
// ========================================================================

const fs = require('fs').promises;
const path = require('path');

// Stats file location
const STATS_FILE = path.resolve(process.cwd(), 'TRADING_BOT_STATS.md');
const STATS_HISTORY = path.resolve(process.cwd(), 'stats-history.jsonl');

/**
 * Read current stats from markdown file
 */
async function readStats() {
  try {
    const txt = await fs.readFile(STATS_FILE, 'utf8');
    const stat = await fs.stat(STATS_FILE);
    return { 
      ok: true, 
      content: txt, 
      mtime: stat.mtimeMs,
      timestamp: Date.now()
    };
  } catch (e) {
    return { 
      ok: false, 
      error: e.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Verify Trading Brain connection programmatically
 */
async function verifyBrainConnection() {
  try {
    const file = path.resolve(process.cwd(), 'run-trading-bot-v13-simplified.js');
    const src = await fs.readFile(file, 'utf8');
    
    // Check for all critical components
    const checks = {
      brainInstantiation: src.includes("new OptimizedTradingBrain(this.balance"),
      mlEnabled: src.includes("enableML: true") || src.includes("enableTrailingStop: true"),
      patternsEnabled: src.includes("enablePatterns: true") || src.includes("PatternRecognition"),
      indicatorsEnabled: src.includes("enableIndicators: true") || src.includes("OptimizedIndicators"),
      riskManagementEnabled: src.includes("enableRiskManagement: true") || src.includes("RiskManager"),
      line268Check: src.split('\n')[267]?.includes('tradingBrain') || false
    };
    
    const allChecks = Object.values(checks).every(v => v === true);
    
    return { 
      ok: allChecks,
      checks,
      line268: src.split('\n')[267]?.substring(0, 100) || 'Line not found',
      timestamp: Date.now()
    };
  } catch (e) {
    return { 
      ok: false, 
      error: e.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Append stats to history file (JSONL format)
 */
async function appendStatsHistory(backtest) {
  const hist = {
    ts: Date.now(),
    pair: backtest.pair || "BTC/USD",
    candles: backtest.candles || 2000,
    init: backtest.initialBalance || 10000,
    final: backtest.finalBalance || 0,
    ret: backtest.returnPercent || 0,
    trades: backtest.totalTrades || 0,
    wins: backtest.wins || 0,
    losses: backtest.losses || 0,
    avgWin: backtest.avgWin || 0,
    avgLoss: backtest.avgLoss || 0,
    pf: backtest.profitFactor || 0,
    commit: process.env.GIT_COMMIT || "unknown",
    mode: backtest.mode || "backtest"
  };
  
  await fs.appendFile(STATS_HISTORY, JSON.stringify(hist) + "\n");
  return hist;
}

/**
 * Integration for WebSocket message handler
 * Add this to your trai-qwen-streaming.js handleClientMessage switch
 */
class StatsIntegration {
  constructor(wsServer) {
    this.wsServer = wsServer;
    this.lastStats = null;
    this.watchStats();
  }
  
  /**
   * Watch stats file for changes and broadcast updates
   */
  async watchStats() {
    try {
      const fsWatch = require('fs');
      fsWatch.watch(STATS_FILE, { persistent: true }, async () => {
        const stats = await readStats();
        if (stats.ok && this.lastStats !== stats.content) {
          this.lastStats = stats.content;
          this.broadcast({ 
            type: 'stats_update', 
            ...stats 
          });
          console.log('📊 Stats updated and broadcast to all clients');
        }
      });
      console.log('👁️ Watching TRADING_BOT_STATS.md for changes...');
    } catch (error) {
      console.error('Failed to watch stats file:', error);
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(clientId, message) {
    switch (message.type) {
      case 'stats':
        const stats = await readStats();
        this.sendToClient(clientId, { type: 'stats', ...stats });
        break;
        
      case 'verify_brain':
        const verification = await verifyBrainConnection();
        this.sendToClient(clientId, { type: 'verify_brain', ...verification });
        break;
        
      case 'stats_history':
        try {
          const history = await fs.readFile(STATS_HISTORY, 'utf8');
          const lines = history.trim().split('\n').map(line => JSON.parse(line));
          this.sendToClient(clientId, { 
            type: 'stats_history', 
            history: lines,
            count: lines.length 
          });
        } catch (error) {
          this.sendToClient(clientId, { 
            type: 'stats_history', 
            error: error.message,
            history: [] 
          });
        }
        break;
    }
  }
  
  sendToClient(clientId, data) {
    // Override with your actual WebSocket send method
    if (this.wsServer && this.wsServer.clients) {
      this.wsServer.clients.forEach(client => {
        if (client.id === clientId && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }
  
  broadcast(data) {
    // Override with your actual WebSocket broadcast method
    if (this.wsServer && this.wsServer.clients) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }
}

module.exports = {
  StatsIntegration,
  readStats,
  verifyBrainConnection,
  appendStatsHistory
};