// run-trading-bot-v10.2.js - Enhanced launcher for OGZ Prime V10.2

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const PolygonWebSocket = require('./data/PolygonWebSocket.js');
const OGZPrimeV10 = require('./OGZPrimeV10.2');
// const ControlServer = require('./control-server');
const { sendDiscordMessage } = require('./utils/discordNotifier');
// const TransparencyIntegration = require('./transparency_integration');

const args = process.argv.slice(2);

const config = {
  mode: 'live',
  assetName: getArgValue(args, '--asset', 'BTC-USD'),
  profileName: getArgValue(args, '--profile', 'default'),
  initialBalance: parseFloat(getArgValue(args, '--balance', '10000')),

  enableMultiTimeframe: !args.includes('--disable-mtf'),
  enableFibonacciLevels: !args.includes('--disable-fib'),
  enableSupportResistance: !args.includes('--disable-sr'),
  enablePatternRejectionTracking: !args.includes('--disable-rejection'),

  dataWebSocketPort: parseInt(getArgValue(args, '--data-port', '3001')),
  guiWebSocketPort: parseInt(getArgValue(args, '--gui-port', '3002')),
  controlWebSocketPort: parseInt(getArgValue(args, '--control-port', '3003')),

  logDirectory: getArgValue(args, '--logs', path.join(process.cwd(), 'logs')),
  profilesDirectory: getArgValue(args, '--profiles', path.join(process.cwd(), 'profiles')),
  patternMemoryDirectory: getArgValue(args, '--patterns', path.join(process.cwd(), 'data', 'patterns'))
};

console.log(`🔧 Configuration: Asset=${config.assetName}, Profile=${config.profileName}`);

// Instantiate bot
const bot = new OGZPrimeV10(config);

/* Start transparency system
console.log('🧠 Starting AI Transparency System...');
const transparency = new TransparencyIntegration({
  websocketPort: 3009,
  apiPort: 3008,
  botWebSocketUrl: `ws://localhost:${config.guiWebSocketPort}`,
  enableLogging: true
});
console.log(`✅ Transparency Dashboard: http://localhost:3008`);
console.log(`🔌 Transparency WebSocket: ws://localhost:3009`);
*/
// Display banner
displayBanner();

// Launch bot in live mode
console.log(`🟢 Launching OGZ Prime in LIVE mode (Polygon.io)`);
if (!process.env.POLYGON_API_KEY) {
  console.error('❌ Error: POLYGON_API_KEY not found in .env file');
  console.error('❌ Please add POLYGON_API_KEY to your .env file');
  process.exit(1);
} else {
  startLiveMode();
}

// --- LIVE MODE ---
function startLiveMode() {
  try {
    bot.start();

    if (bot.config.enablePatternRejectionTracking) {
      console.log('🧠 Pattern rejection tracking enabled');
    }

    sendDiscordMessage(`🚀 OGZ Prime V${bot.config.version} started in LIVE mode\n📈 Trading ${config.assetName} with ${config.profileName} profile\n💰 Initial balance: $${config.initialBalance.toFixed(2)}`);
  } catch (error) {
    console.error('❌ Failed to start live mode:', error);
    process.exit(1);
  }
}


// --- CLEAN SHUTDOWN ---
function handleShutdown() {
  console.log('\n🛑 Shutdown signal received.');
  if (typeof bot.shutdown === 'function') {
    try {
      bot.shutdown();
    } catch (err) {
      console.error('⚠️ Error during shutdown:', err.message);
    }
  }
  setTimeout(() => process.exit(0), 2000);
}

// --- BANNER ---
function displayBanner() {
  console.log(`
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃                              OGZ PRIME v10.2                                ┃
  ┃                       Advanced Crypto Trading Launcher                      ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

  🔧 Mode: ${config.mode.toUpperCase()} | 🧠 Profile: ${config.profileName} | 📊 Asset: ${config.assetName}
  💻 Ports: Data ${config.dataWebSocketPort}, GUI ${config.guiWebSocketPort}, CTRL ${config.controlWebSocketPort}
  `);
}

// --- ARG PARSER ---
function getArgValue(args, name, defaultValue) {
  const index = args.indexOf(name);
  return (index !== -1 && index + 1 < args.length) ? args[index + 1] : defaultValue;
}

// Bind shutdown
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
