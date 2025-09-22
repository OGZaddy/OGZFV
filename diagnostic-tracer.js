#!/usr/bin/env node

/**
 * DIAGNOSTIC TRACER - The Machine Spirit's Interrogator
 * Traces the flow of data through the trading bot to find where it's failing
 */

const fs = require('fs');
const path = require('path');

class DiagnosticTracer {
  constructor() {
    this.traceLog = [];
    this.startTime = Date.now();
  }

  trace(component, message, data = null) {
    const entry = {
      timestamp: Date.now() - this.startTime,
      component,
      message,
      data: data ? JSON.stringify(data).substring(0, 100) : null
    };

    this.traceLog.push(entry);

    // Console output with color coding
    const colors = {
      'INIT': '\x1b[36m',      // Cyan
      'WEBSOCKET': '\x1b[35m',  // Magenta
      'PRICE': '\x1b[32m',      // Green
      'TRADE': '\x1b[33m',      // Yellow
      'ERROR': '\x1b[31m',      // Red
      'DECISION': '\x1b[34m'    // Blue
    };

    const color = colors[component] || '\x1b[37m';
    console.log(`${color}[${entry.timestamp}ms] [${component}] ${message}\x1b[0m`);

    if (data && process.env.DEBUG === 'true') {
      console.log(`  └─ Data: ${entry.data}`);
    }
  }

  checkpoint(name) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CHECKPOINT: ${name}`);
    console.log(`Time elapsed: ${Date.now() - this.startTime}ms`);
    console.log(`${'='.repeat(60)}\n`);
  }

  dumpTrace() {
    const filename = `trace_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.traceLog, null, 2));
    console.log(`\n📊 Trace dumped to ${filename}`);
    return filename;
  }
}

// Create global tracer instance
global.TRACER = new DiagnosticTracer();

// Inject into the bot
console.log('🔍 DIAGNOSTIC TRACER ACTIVATED');
console.log('📡 Monitoring all bot operations...\n');

// Now load the actual bot with our tracer injected
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Intercept specific messages
  const message = args.join(' ');

  if (message.includes('performTradingCycle')) {
    global.TRACER.trace('TRADE', 'Trading cycle triggered');
  } else if (message.includes('Price:')) {
    global.TRACER.trace('PRICE', 'Price update received');
  } else if (message.includes('WebSocket')) {
    global.TRACER.trace('WEBSOCKET', message);
  } else if (message.includes('PHASE')) {
    global.TRACER.trace('INIT', message);
  } else if (message.includes('ERROR') || message.includes('❌')) {
    global.TRACER.trace('ERROR', message);
  } else if (message.includes('confidence')) {
    global.TRACER.trace('DECISION', message);
  }

  // Still log normally
  originalConsoleLog.apply(console, args);
};

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Diagnostic trace complete');
  global.TRACER.checkpoint('SHUTDOWN');
  const filename = global.TRACER.dumpTrace();

  // Analyze the trace
  console.log('\n📊 ANALYSIS:');
  const trace = global.TRACER.traceLog;

  const components = {};
  trace.forEach(entry => {
    components[entry.component] = (components[entry.component] || 0) + 1;
  });

  console.log('Component activity:');
  Object.entries(components).forEach(([comp, count]) => {
    console.log(`  ${comp}: ${count} events`);
  });

  // Find gaps
  console.log('\nTime gaps (>5000ms):');
  for (let i = 1; i < trace.length; i++) {
    const gap = trace[i].timestamp - trace[i-1].timestamp;
    if (gap > 5000) {
      console.log(`  ${trace[i-1].component} → ${trace[i].component}: ${gap}ms gap`);
    }
  }

  process.exit(0);
});

// Load the bot
require('./run-trading-bot-v13-simplified.js');