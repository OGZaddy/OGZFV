// ===================================================================
// OGZ PRIME V11 - FULL ML LEARNING INTEGRATION LAUNCHER
// ===================================================================
// Now with REAL-TIME LEARNING AND ADAPTATION!

const OGZPrimeV10_2 = require('./OGZPrimeV10.2');
const LogLearningSystem = require('./core/LogLearningSystem');
const express = require('express');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('-live');
const isLogging = args.includes('-log');
const isLearning = args.includes('-learn');
const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1] || 3000;

console.log('\n🚀 OGZ PRIME V11 - LEARNING EDITION STARTING...');
console.log('====================================================');
console.log(`📊 Mode: ${isLive ? 'LIVE TRADING' : 'SIMULATION'}`);
console.log(`📝 Logging: ${isLogging ? 'ENABLED' : 'DISABLED'}`);
console.log(`🧠 Learning: ${isLearning ? 'ENABLED - BOT WILL EVOLVE!' : 'DISABLED'}`);
console.log(`🌐 Port: ${port}`);
console.log('====================================================\n');

// Initialize Express app for API endpoints
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Serve main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize bot with flags
const bot = new OGZPrimeV10_2({
  mode: isLive ? 'live' : 'simulation',
  enableLogging: isLogging,
  enableLearning: isLearning
});

// Add learning system if enabled
if (isLearning) {
  console.log('🧠 INITIALIZING LEARNING SYSTEM...');
  
  bot.learningSystem = new LogLearningSystem(bot);
  
  // Store original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Override console.log to feed learning system
  console.log = (...args) => {
    originalLog(...args);
    
    const logEntry = {
      level: 'info',
      message: args.join(' '),
      timestamp: Date.now(),
      data: {}
    };
    
    // Extract data if present
    if (args.length > 1 && typeof args[args.length - 1] === 'object') {
      logEntry.data = args[args.length - 1];
    }
    
    // Send to learning system (async, don't block)
    bot.learningSystem.processLogWithLearning(logEntry).catch(err => {
      originalLog('❌ Learning system error:', err.message);
    });
  };
  
  // Override console.warn
  console.warn = (...args) => {
    originalWarn(...args);
    
    const logEntry = {
      level: 'warn',
      message: args.join(' '),
      timestamp: Date.now(),
      data: {}
    };
    
    if (args.length > 1 && typeof args[args.length - 1] === 'object') {
      logEntry.data = args[args.length - 1];
    }
    
    bot.learningSystem.processLogWithLearning(logEntry).catch(err => {
      originalLog('❌ Learning system error:', err.message);
    });
  };
  
  // Override console.error
  console.error = (...args) => {
    originalError(...args);
    
    const logEntry = {
      level: 'error',
      message: args.join(' '),
      timestamp: Date.now(),
      data: {}
    };
    
    if (args.length > 1 && typeof args[args.length - 1] === 'object') {
      logEntry.data = args[args.length - 1];
    }
    
    bot.learningSystem.processLogWithLearning(logEntry).catch(err => {
      originalLog('❌ Learning system error:', err.message);
    });
  };
  
  console.log('🧠 LEARNING MODE ACTIVATED - Bot will evolve in real-time!');
  console.log('📊 All logs are now being analyzed for patterns and insights');
  console.log('🔄 Real-time feedback will automatically optimize trading behavior');
}

// ===================================================================
// API ENDPOINTS FOR LEARNING SYSTEM
// ===================================================================

// Get learning statistics
app.get('/api/learning/stats', (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  res.json({
    learningState: bot.learningSystem.getLearningState(),
    processorStats: bot.learningSystem.getProcessorStats(),
    status: 'active'
  });
});

// Get learning insights
app.get('/api/learning/insights', (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  res.json(bot.learningSystem.getLearningState());
});

// Force learning analysis
app.post('/api/learning/analyze', async (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  try {
    const analysis = await bot.learningSystem.forceLearningAnalysis();
    res.json({
      success: true,
      analysis: analysis,
      message: 'Learning analysis completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export learning data
app.get('/api/learning/export', (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  const data = bot.learningSystem.exportLearningData();
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ogz-learning-data-${Date.now()}.json"`);
  
  res.json(data);
});

// Import learning data
app.post('/api/learning/import', (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  try {
    bot.learningSystem.importLearningData(req.body);
    res.json({
      success: true,
      message: 'Learning data imported successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get log processor stats
app.get('/api/logs/stats', (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  res.json(bot.learningSystem.getProcessorStats());
});

// Query logs
app.get('/api/logs/query', async (req, res) => {
  if (!bot.learningSystem) {
    return res.status(404).json({ error: 'Learning system not enabled' });
  }
  
  try {
    const results = await bot.learningSystem.processor.queryLogs(req.query);
    res.json({
      success: true,
      logs: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================================================
// BOT STATUS AND CONTROL ENDPOINTS
// ===================================================================

// Get bot status
app.get('/api/status', (req, res) => {
  res.json({
    status: bot.isRunning ? 'running' : 'stopped',
    mode: isLive ? 'live' : 'simulation',
    learning: isLearning,
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: '11.0'
  });
});

// Get current trades
app.get('/api/trades', (req, res) => {
  res.json({
    activeTrades: bot.activeTrades || [],
    tradeHistory: bot.tradeHistory?.slice(-50) || []
  });
});

// Get current metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    portfolio: bot.portfolio || {},
    performance: bot.performanceMetrics || {},
    risk: bot.riskMetrics || {}
  });
});

// Send Hitch command
app.post('/api/hitch/command', async (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command required' });
  }
  
  try {
    if (bot.hitch) {
      const result = await bot.hitch.processCommand(command);
      res.json({
        success: true,
        result: result,
        message: `Command executed: ${command}`
      });
    } else {
      res.status(404).json({ error: 'Hitch system not available' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================================================
// ERROR HANDLING AND GRACEFUL SHUTDOWN
// ===================================================================

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  
  if (bot.learningSystem) {
    // Log this as a critical error for learning
    bot.learningSystem.processLogWithLearning({
      level: 'error',
      message: `Uncaught Exception: ${error.message}`,
      timestamp: Date.now(),
      data: { stack: error.stack }
    }).catch(() => {});
  }
  
  gracefulShutdown(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  
  if (bot.learningSystem) {
    bot.learningSystem.processLogWithLearning({
      level: 'error',
      message: `Unhandled Rejection: ${reason}`,
      timestamp: Date.now(),
      data: { promise: promise.toString() }
    }).catch(() => {});
  }
});

// Graceful shutdown
function gracefulShutdown(exitCode = 0) {
  console.log('\n🛑 INITIATING GRACEFUL SHUTDOWN...');
  
  if (bot.learningSystem) {
    console.log('💾 Saving learning data...');
    const learningData = bot.learningSystem.exportLearningData();
    require('fs').writeFileSync(
      `learning-backup-${Date.now()}.json`, 
      JSON.stringify(learningData, null, 2)
    );
    bot.learningSystem.stop();
  }
  
  if (bot.stop) {
    console.log('🤖 Stopping trading bot...');
    bot.stop();
  }
  
  console.log('✅ Shutdown complete');
  process.exit(exitCode);
}

// Handle shutdown signals
process.on('SIGINT', () => {
  console.log('\n📡 Received SIGINT (Ctrl+C)');
  gracefulShutdown(0);
});

process.on('SIGTERM', () => {
  console.log('\n📡 Received SIGTERM');
  gracefulShutdown(0);
});

// ===================================================================
// START THE SYSTEM
// ===================================================================

async function startSystem() {
  try {
    console.log('🚀 Starting OGZ Prime V11...');
    
    // Start the bot
    await bot.start();
    
    // Start Express server
    const server = app.listen(port, () => {
      console.log(`\n🌐 API Server running on http://localhost:${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}`);
      if (isLearning) {
        console.log(`🧠 Learning API: http://localhost:${port}/api/learning/stats`);
        console.log(`📈 Log Stats: http://localhost:${port}/api/logs/stats`);
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is busy, try: node run-trading-bot-v11.js --port=3001`);
      }
      gracefulShutdown(1);
    });
    
    console.log('\n✅ OGZ PRIME V11 SYSTEM FULLY OPERATIONAL!');
    
    if (isLearning) {
      console.log('\n🎯 LEARNING FEATURES ACTIVE:');
      console.log('   • Real-time pattern recognition');
      console.log('   • Automatic strategy optimization');
      console.log('   • Profit/loss pattern analysis');
      console.log('   • Time-based performance tracking');
      console.log('   • Intelligent log compression');
      console.log('   • Continuous adaptation');
      
      // Generate first learning report after 5 minutes
      setTimeout(() => {
        if (bot.learningSystem) {
          bot.learningSystem.generateLearningReport();
        }
      }, 5 * 60 * 1000);
    }
    
    console.log('\n🎉 Ready for Houston! This bot will now learn and adapt!');
    
  } catch (error) {
    console.error('❌ Failed to start system:', error);
    gracefulShutdown(1);
  }
}

// Start the system
startSystem();

// Export for testing
module.exports = { bot, app };