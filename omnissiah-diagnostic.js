#!/usr/bin/env node

/**
 * THE OMNISSIAH'S DIAGNOSTIC RITUAL
 * Trace every single step from data to trade execution
 */

const fs = require('fs');
const path = require('path');

// Create diagnostic log
const diagnosticLog = [];
const logDiagnostic = (step, data) => {
  const entry = {
    timestamp: Date.now(),
    step,
    data: JSON.stringify(data || {}).substring(0, 200)
  };
  diagnosticLog.push(entry);
  console.log(`[${step}] ${entry.data}`);
};

// Monkey-patch console.log to capture everything
const originalLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  if (message.includes('performTradingCycle') ||
      message.includes('Trading interval') ||
      message.includes('startTradingOperations') ||
      message.includes('setInterval')) {
    logDiagnostic('CONSOLE_INTERCEPT', { message });
  }
  originalLog.apply(console, args);
};

console.log('🔍 OMNISSIAH DIAGNOSTIC PROTOCOL INITIATED\n');

// Load and patch the bot
const BotClass = require('./run-trading-bot-v13-simplified.js');

class DiagnosticBot extends BotClass {
  constructor() {
    super();
    logDiagnostic('CONSTRUCTOR', { initialized: true });

    // Track all intervals
    this.intervalTracking = new Map();
  }

  // OVERRIDE: Track WebSocket data
  connectWebSocket() {
    logDiagnostic('WEBSOCKET_CONNECT_CALLED', {});
    const result = super.connectWebSocket();
    logDiagnostic('WEBSOCKET_CONNECT_RESULT', { hasWs: !!this.ws });

    // Patch the message handler
    if (this.ws) {
      const originalOn = this.ws.on.bind(this.ws);
      this.ws.on = (event, handler) => {
        if (event === 'message') {
          const wrappedHandler = (data) => {
            try {
              const parsed = JSON.parse(data.toString());
              if (parsed.type === 'price' && parsed.data?.asset?.includes('BTC')) {
                logDiagnostic('WEBSOCKET_BTC_PRICE', {
                  price: parsed.data.price,
                  timestamp: Date.now()
                });
              }
            } catch (e) {}
            return handler(data);
          };
          return originalOn(event, wrappedHandler);
        }
        return originalOn(event, handler);
      };
    }

    return result;
  }

  // OVERRIDE: Track market data
  async getMarketData() {
    logDiagnostic('GET_MARKET_DATA_START', {
      hasCached: !!this.cachedMarketData,
      lastReceived: this.lastDataReceived,
      timeSince: this.lastDataReceived ? Date.now() - this.lastDataReceived : null
    });

    const result = await super.getMarketData();

    logDiagnostic('GET_MARKET_DATA_RESULT', {
      price: result?.price,
      rsi: result?.rsi,
      trend: result?.trend,
      volatility: result?.volatility
    });

    return result;
  }

  // OVERRIDE: Track trading operations start
  async startTradingOperations() {
    logDiagnostic('START_TRADING_OPS_BEGIN', {
      configInterval: this.config.tradeInterval,
      systemActive: this.systemState.active
    });

    // Test immediate call
    logDiagnostic('IMMEDIATE_TEST_START', {});
    try {
      await this.performTradingCycle();
      logDiagnostic('IMMEDIATE_TEST_SUCCESS', {});
    } catch (err) {
      logDiagnostic('IMMEDIATE_TEST_ERROR', { error: err.message });
    }

    // Patch setInterval to track it
    const originalSetInterval = global.setInterval;
    global.setInterval = (fn, delay, ...args) => {
      const stack = new Error().stack;
      logDiagnostic('SET_INTERVAL_CALLED', {
        delay,
        hasFunction: !!fn,
        callStack: stack?.split('\n')[2]
      });

      const intervalId = originalSetInterval(fn, delay, ...args);
      this.intervalTracking.set(intervalId, {
        created: Date.now(),
        delay,
        function: fn.toString().substring(0, 100)
      });

      logDiagnostic('SET_INTERVAL_CREATED', { intervalId: String(intervalId) });
      return intervalId;
    };

    // Call parent
    const result = await super.startTradingOperations();

    logDiagnostic('START_TRADING_OPS_COMPLETE', {
      tradingInterval: !!this.tradingInterval,
      intervalId: this.tradingInterval
    });

    // Check if interval is actually running
    if (this.tradingInterval) {
      setTimeout(() => {
        logDiagnostic('INTERVAL_CHECK_5S', {
          stillExists: !!this.tradingInterval,
          intervalInfo: this.intervalTracking.get(this.tradingInterval)
        });
      }, 5000);
    }

    return result;
  }

  // OVERRIDE: Track trading cycle
  async performTradingCycle() {
    logDiagnostic('PERFORM_CYCLE_START', {
      active: this.systemState.active,
      emergency: this.systemState.emergencyMode,
      priceDataLength: this.priceData?.length,
      hasCachedData: !!this.cachedMarketData
    });

    if (!this.systemState.active || this.systemState.emergencyMode) {
      logDiagnostic('PERFORM_CYCLE_BLOCKED', {
        reason: !this.systemState.active ? 'inactive' : 'emergency'
      });
      return;
    }

    try {
      // Get market data
      const marketData = await this.getMarketData();
      logDiagnostic('PERFORM_CYCLE_GOT_MARKET', {
        hasData: !!marketData,
        price: marketData?.price
      });

      // Call parent to continue
      const result = await super.performTradingCycle();

      logDiagnostic('PERFORM_CYCLE_COMPLETE', {
        totalTrades: this.systemState.totalTrades,
        activePositions: this.activePositions?.size
      });

      return result;
    } catch (error) {
      logDiagnostic('PERFORM_CYCLE_ERROR', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join(' | ')
      });
      throw error;
    }
  }

  // OVERRIDE: Track confidence calculation
  calculateTradingConfidence(marketData, patterns) {
    logDiagnostic('CALC_CONFIDENCE_START', {
      hasMarketData: !!marketData,
      patternCount: patterns?.length || 0
    });

    const result = super.calculateTradingConfidence(marketData, patterns);

    logDiagnostic('CALC_CONFIDENCE_RESULT', {
      confidence: result,
      percentage: (result * 100).toFixed(1)
    });

    return result;
  }

  // OVERRIDE: Track trading direction
  determineTradingDirection(marketData, patterns, confidence) {
    logDiagnostic('DETERMINE_DIRECTION_START', {
      confidence,
      rsi: marketData?.rsi,
      trend: marketData?.trend,
      patternCount: patterns?.length
    });

    const result = super.determineTradingDirection(marketData, patterns, confidence);

    logDiagnostic('DETERMINE_DIRECTION_RESULT', {
      direction: result
    });

    return result;
  }

  // OVERRIDE: Track trade execution
  async executeTrade(direction, size, confidence, marketData, patterns) {
    logDiagnostic('EXECUTE_TRADE_CALLED', {
      direction,
      size,
      confidence,
      price: marketData?.price
    });

    try {
      const result = await super.executeTrade(direction, size, confidence, marketData, patterns);
      logDiagnostic('EXECUTE_TRADE_SUCCESS', { result });
      return result;
    } catch (error) {
      logDiagnostic('EXECUTE_TRADE_ERROR', { error: error.message });
      throw error;
    }
  }
}

// Kill PM2 and clean up
const { execSync } = require('child_process');
console.log('💀 Stopping PM2...');
try { execSync('pm2 stop ogz-trading-bot 2>/dev/null'); } catch(e) {}

console.log('🔓 Removing lock...');
try { fs.unlinkSync('.v13-simplified-bot.lock'); } catch(e) {}

// Run diagnostic
async function runDiagnostic() {
  console.log('\n🔥 Creating diagnostic bot...');
  const bot = new DiagnosticBot();

  console.log('🔥 Initializing...');
  try {
    await bot.initialize();
    logDiagnostic('INIT_COMPLETE', { success: true });
  } catch (error) {
    logDiagnostic('INIT_ERROR', { error: error.message });
    throw error;
  }

  // Wait 30 seconds to collect data
  console.log('\n⏰ Collecting diagnostic data for 30 seconds...\n');

  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC COMPLETE - ANALYZING...');
    console.log('='.repeat(60) + '\n');

    // Analysis
    const steps = {};
    diagnosticLog.forEach(entry => {
      steps[entry.step] = (steps[entry.step] || 0) + 1;
    });

    console.log('📈 STEP FREQUENCY:');
    Object.entries(steps).sort((a, b) => b[1] - a[1]).forEach(([step, count]) => {
      console.log(`  ${step}: ${count}`);
    });

    // Check critical steps
    console.log('\n🚨 CRITICAL CHECKS:');
    console.log(`  WebSocket connected: ${steps['WEBSOCKET_CONNECT_CALLED'] ? '✅' : '❌'}`);
    console.log(`  Receiving BTC prices: ${steps['WEBSOCKET_BTC_PRICE'] ? '✅' : '❌'}`);
    console.log(`  Trading ops started: ${steps['START_TRADING_OPS_BEGIN'] ? '✅' : '❌'}`);
    console.log(`  Interval created: ${steps['SET_INTERVAL_CREATED'] ? '✅' : '❌'}`);
    console.log(`  Trading cycles run: ${steps['PERFORM_CYCLE_START'] || 0}`);
    console.log(`  Market data fetched: ${steps['GET_MARKET_DATA_START'] || 0}`);
    console.log(`  Confidence calculated: ${steps['CALC_CONFIDENCE_START'] || 0}`);
    console.log(`  Direction determined: ${steps['DETERMINE_DIRECTION_START'] || 0}`);
    console.log(`  Trade executions attempted: ${steps['EXECUTE_TRADE_CALLED'] || 0}`);

    // Save full log
    fs.writeFileSync('diagnostic-log.json', JSON.stringify(diagnosticLog, null, 2));
    console.log('\n💾 Full diagnostic saved to diagnostic-log.json');

    process.exit(0);
  }, 30000);
}

runDiagnostic().catch(err => {
  console.error('💀 DIAGNOSTIC FAILED:', err);
  console.error(err.stack);

  // Save what we have
  fs.writeFileSync('diagnostic-error.json', JSON.stringify({
    error: err.message,
    stack: err.stack,
    log: diagnosticLog
  }, null, 2));

  process.exit(1);
});