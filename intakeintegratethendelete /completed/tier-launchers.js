// trading-system/bot-starter-tier.js
// STARTER TIER LAUNCHER - Replaces the old 500+ line file with 10 lines!
const UnifiedTradingBot = require('./unified-bot');

const bot = new UnifiedTradingBot('starter');
bot.connect();

// Graceful shutdown
process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════

// trading-system/bot-pro-tier.js
// PRO TIER LAUNCHER
const UnifiedTradingBot = require('./unified-bot');

const bot = new UnifiedTradingBot('pro');
bot.connect();

process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════

// trading-system/bot-elite-tier.js
// ELITE TIER LAUNCHER
const UnifiedTradingBot = require('./unified-bot');

const bot = new UnifiedTradingBot('elite');
bot.connect();

process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════

// trading-system/bot-quantum-tier.js (or run-trading-bot-v13-quantum.js)
// QUANTUM TIER LAUNCHER
const UnifiedTradingBot = require('./unified-bot');

const bot = new UnifiedTradingBot('quantum');
bot.connect();

process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════

// trading-system/launch-all-tiers.js
// DEVELOPMENT TESTING - Launch all tiers simultaneously
const UnifiedTradingBot = require('./unified-bot');

const tiers = ['starter', 'pro', 'elite', 'quantum'];
const bots = [];

console.log('🚀 Launching all tier bots for testing...\n');

for (const tier of tiers) {
  const bot = new UnifiedTradingBot(tier);
  bot.connect();
  bots.push(bot);
  
  // Stagger launches to avoid connection storms
  setTimeout(() => {}, 1000);
}

// Graceful shutdown for all bots
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down all bots...');
  
  await Promise.all(bots.map(bot => bot.shutdown()));
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════

// package.json scripts update
// Add these to your package.json scripts section:
{
  "scripts": {
    "bot:starter": "node trading-system/bot-starter-tier.js",
    "bot:pro": "node trading-system/bot-pro-tier.js",
    "bot:elite": "node trading-system/bot-elite-tier.js",
    "bot:quantum": "node trading-system/bot-quantum-tier.js",
    "bot:all": "node trading-system/launch-all-tiers.js",
    "bot:test": "node trading-system/test-unified-bot.js"
  }
}