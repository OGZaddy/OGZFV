// api/website-reporting.js - Real-time Website Reporting API
// =========================================================
// 🌐 WEBSITE REPORTING API - FOR MONDAY RELEASE
// =========================================================
//
// This API provides real-time trading data to the website
// Features:
// ✅ Live bot status and trades
// ✅ Pattern recognition results
// ✅ Performance metrics
// ✅ Real-time balance updates
//
// Author: Trey (OGZPrime Technologies)
// Version: Release 1.0

const { getWebSocketUrl, getHttpUrl } = require('../../core/WebSocketConfig');

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS for website
app.use(cors({
  origin: [getHttpUrl('data'), 'https://ogzprime.com', 'https://www.ogzprime.com'],
  credentials: true
}));

app.use(express.json());

/**
 * Get current bot status for website display
 */
app.get('/api/bot-status', (req, res) => {
  try {
    // Read current bot status
    const statusPath = path.join(process.cwd(), 'bot_status.json');
    
    if (!fs.existsSync(statusPath)) {
      return res.json({
        status: 'offline',
        message: 'Bot not running',
        timestamp: new Date().toISOString()
      });
    }
    
    const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    
    // Add additional website-specific data
    const websiteStatus = {
      ...statusData,
      status: 'online',
      website_ready: true,
      last_update: new Date().toISOString()
    };
    
    res.json(websiteStatus);
    
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get bot status',
      error: error.message
    });
  }
});

/**
 * Get recent trades for website display
 */
app.get('/api/recent-trades', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tradesPath = path.join(process.cwd(), 'logs', 'trades', `BTC-USD_${today}.json`);
    
    if (!fs.existsSync(tradesPath)) {
      return res.json({
        trades: [],
        message: 'No trades today'
      });
    }
    
    const trades = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
    
    // Get last 10 trades for website
    const recentTrades = trades.slice(-10).map(trade => ({
      timestamp: trade.timestamp || trade.entryTime,
      type: trade.type || 'TRADE',
      direction: trade.direction || trade.type,
      price: trade.price || trade.entryPrice,
      pnl: trade.pnl || 0,
      balance: trade.balance,
      reason: trade.reason || trade.entryReason,
      confidence: trade.confidence || trade.signalStrength
    }));
    
    res.json({
      trades: recentTrades,
      total_trades: trades.length,
      last_update: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting recent trades:', error);
    res.json({
      trades: [],
      message: 'Error loading trades',
      error: error.message
    });
  }
});

/**
 * Get pattern recognition results
 */
app.get('/api/pattern-results', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const patternsPath = path.join(process.cwd(), 'logs', 'patterns', `BTC-USD_${today}.json`);
    
    if (!fs.existsSync(patternsPath)) {
      return res.json({
        patterns: [],
        message: 'No patterns detected today'
      });
    }
    
    const patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
    
    // Get last 5 patterns for website
    const recentPatterns = patterns.slice(-5).map(pattern => ({
      timestamp: pattern.timestamp,
      type: pattern.patternType || 'Unknown',
      confidence: pattern.confidence,
      price: pattern.price,
      result: pattern.result || 'pending'
    }));
    
    res.json({
      patterns: recentPatterns,
      total_patterns: patterns.length,
      last_update: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting pattern results:', error);
    res.json({
      patterns: [],
      message: 'Error loading patterns',
      error: error.message
    });
  }
});

/**
 * Get performance metrics for website
 */
app.get('/api/performance', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tradesPath = path.join(process.cwd(), 'logs', 'trades', `BTC-USD_${today}.json`);
    
    let performance = {
      daily_pnl: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      avg_win: 0,
      avg_loss: 0,
      best_trade: 0,
      worst_trade: 0,
      current_balance: 10000 // Default
    };
    
    if (fs.existsSync(tradesPath)) {
      const trades = JSON.parse(fs.readFileSync(tradesPath, 'utf8'));
      
      const completedTrades = trades.filter(t => t.pnl !== undefined);
      const winningTrades = completedTrades.filter(t => t.pnl > 0);
      const losingTrades = completedTrades.filter(t => t.pnl < 0);
      
      performance = {
        daily_pnl: completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        total_trades: completedTrades.length,
        winning_trades: winningTrades.length,
        losing_trades: losingTrades.length,
        win_rate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
        avg_win: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0,
        avg_loss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0,
        best_trade: completedTrades.length > 0 ? Math.max(...completedTrades.map(t => t.pnl)) : 0,
        worst_trade: completedTrades.length > 0 ? Math.min(...completedTrades.map(t => t.pnl)) : 0,
        current_balance: completedTrades.length > 0 ? completedTrades[completedTrades.length - 1].balance : 10000
      };
    }
    
    // Add current bot status if available
    const statusPath = path.join(process.cwd(), 'bot_status.json');
    if (fs.existsSync(statusPath)) {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      performance.current_balance = status.balance || performance.current_balance;
      performance.current_price = status.price || 0;
    }
    
    res.json({
      ...performance,
      last_update: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting performance:', error);
    res.status(500).json({
      error: 'Failed to get performance data',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OGZ Prime Website Reporting API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Start the reporting API server
 */
function startReportingAPI(port = 3004) {
  app.listen(port, () => {
    console.log(`🌐 Website Reporting API running on port ${port}`);
    console.log(`📊 Bot Status: http://localhost:${port}/api/bot-status`);
    console.log(`💹 Recent Trades: http://localhost:${port}/api/recent-trades`);
    console.log(`🧠 Pattern Results: http://localhost:${port}/api/pattern-results`);
    console.log(`📈 Performance: http://localhost:${port}/api/performance`);
  });
  
  return app;
}

// Export for use in other modules
module.exports = { app, startReportingAPI };

// Start server if run directly
if (require.main === module) {
  startReportingAPI();
}
