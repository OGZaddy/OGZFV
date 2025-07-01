// master-batcher.js - Batch backtesting orchestrator for OGZ Prime V10.2
require('dotenv').config();  // Load environment variables (for consistency with main launcher)
const fs = require('fs');
const path = require('path');
const OGZPrimeV10 = require('./OGZPrimeV10.2');
const PerformanceVisualizer = require('./core/PerformanceVisualizer');

// Reuse argument parsing helper from run-trading-bot-v10.2
function getArgValue(args, name, defaultValue) {
  const index = args.indexOf(name);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

// If this module is run directly, parse CLI arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = getArgValue(args, '--file', null) || getArgValue(args, '--backtest', null) || args[0];
  if (!filePath) {
    console.error(`❌ No historical data file specified. Usage: node master-batcher.js --file <path_to_data.json|csv> [--asset ASSET] [--profile NAME] [--balance START] [--disable-mtf] [--disable-fib] [--disable-sr] [--disable-rejection]`);
    process.exit(1);
  }
  // Determine asset, profile, and initial balance (with defaults matching live config)
  const assetName = getArgValue(args, '--asset', 'BTC-USD');
  const profileName = getArgValue(args, '--profile', 'default');
  const initialBalance = parseFloat(getArgValue(args, '--balance', '10000'));

  // Prepare configuration (mirroring run-trading-bot-v10.2 flags)
  const config = {
    mode: 'simulate',  // use simulation mode for backtesting
    assetName: assetName,
    profileName: profileName,
    initialBalance: initialBalance,
    enableMultiTimeframe: !args.includes('--disable-mtf'),
    enableFibonacciLevels: !args.includes('--disable-fib'),
    enableSupportResistance: !args.includes('--disable-sr'),
    enablePatternRejectionTracking: !args.includes('--disable-rejection'),
    // Use custom ports to avoid conflicts with any live instance (no actual clients expected)
    dataWebSocketPort: 3101,
    guiWebSocketPort: 3102,
    controlWebSocketPort: 3103,
    // Directories for logs and profiles
    logDirectory: path.join(process.cwd(), 'backtest_logs'),
    profilesDirectory: path.join(process.cwd(), 'profiles'),
    patternMemoryDirectory: path.join(process.cwd(), 'data', 'patterns')
  };

  // Ensure log directories exist
  if (!fs.existsSync(config.logDirectory)) {
    fs.mkdirSync(config.logDirectory, { recursive: true });
  }
  const tradesLogDir = path.join(config.logDirectory, 'trades');
  const perfLogDir = path.join(config.logDirectory, 'performance');
  if (!fs.existsSync(tradesLogDir)) fs.mkdirSync(tradesLogDir, { recursive: true });
  if (!fs.existsSync(perfLogDir)) fs.mkdirSync(perfLogDir, { recursive: true });

  // Override PerformanceAnalyzer output paths to avoid overwriting live trading logs
  config.tradesDbPath = path.join(tradesLogDir, `${assetName}_${profileName}_backtest.json`);
  config.performanceDbPath = path.join(perfLogDir, `${assetName}_${profileName}_backtest.json`);

  // Load historical market data from file (JSON or CSV)
  let marketData;
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    if (filePath.toLowerCase().endsWith('.json')) {
      // Expect JSON array of candle objects: { timestamp, open, high, low, close, volume }
      marketData = JSON.parse(rawData);
    } else if (filePath.toLowerCase().endsWith('.csv')) {
      // Parse CSV assuming header or columns: timestamp, open, high, low, close, volume
      marketData = [];
      const lines = rawData.split(/\r?\n/);
      let startIndex = 0;
      // If first line contains non-numeric, treat as header
      if (lines[0] && /[A-Za-z]/.test(lines[0])) {
        startIndex = 1;
      }
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(/,|\s+/);  // split on comma or whitespace
        if (parts.length < 5) {
          console.warn(`⚠️ Skipping malformed CSV line ${i}: ${line}`);
          continue;
        }
        let [ts, open, high, low, close, volume] = parts;
        ts = ts.replace(/"/g, '');  // remove quotes if any
        const timestamp = isNaN(ts) ? Date.parse(ts) : Number(ts) * (ts.length <= 10 ? 1000 : 1);
        marketData.push({
          timestamp: timestamp,
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseFloat(volume || "0")
        });
      }
    } else {
      console.error(`❌ Unsupported file format: ${filePath}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Failed to load data file: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(marketData) || marketData.length === 0) {
    console.error('❌ No market data found in the provided file.');
    process.exit(1);
  }
  // Sort market data by timestamp to ensure chronological order
  marketData.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`🔎 Loaded ${marketData.length} data points for ${assetName} (${profileName} profile). Starting backtest...`);

  // Initialize trading bot with config
  const bot = new OGZPrimeV10(config);
  // Prevent WebSocket broadcasts to GUI (no clients in backtest) to avoid console spam
  if (bot.webSocketManager && typeof bot.webSocketManager.broadcast === 'function') {
    bot.webSocketManager.broadcast = () => true;
  }
  bot.isRunning = true;  // Indicate system is running

  // Feed historical data into the bot tick by tick
  for (const candle of marketData) {
    const price = candle.close;
    const volume = candle.volume || 0;
    const timestamp = candle.timestamp || Date.now();
    bot.processTick({ timestamp, price, volume });
  }

  // Shut down the bot to finalize trades and stats
  const finalStatus = bot.shutdown();
  console.log(`✅ Backtest complete. Final Balance: $${finalStatus.balance.toFixed(2)}, Trades: ${finalStatus.trades}, Total PnL: $${finalStatus.pnl.toFixed(2)}`);

  // Use PerformanceVisualizer to generate performance charts and report
  const tradeHistory = bot.tradingBrain.tradeHistory;
  if (tradeHistory && tradeHistory.length > 0) {
    const pvOptions = { /* default options: saveCharts=true, generateHtml=true */ };
    // Set output directory for charts and report
    pvOptions.outputDir = path.join(process.cwd(), 'output', 'charts');
    const visualizer = new PerformanceVisualizer(pvOptions).initialize(initialBalance);
    let runningBalance = initialBalance;
    for (const trade of tradeHistory) {
      runningBalance += trade.pnl;
      visualizer.trackTrade(trade, runningBalance);
    }
    visualizer.generateFinalReport();
  } else {
    console.log('⚠️ No trades executed during backtest – no performance report generated.');
  }
}
