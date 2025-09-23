// ISOLATION TEST - Find where the bot breaks
const fs = require('fs');

console.log('\n=== ISOLATION TEST STARTING ===\n');

// TEST 1: Can we load the bot class?
console.log('TEST 1: Loading bot class...');
try {
  const { OGZPrimeV13Simplified } = require('./run-trading-bot-v13-simplified');
  console.log('✅ TEST 1 PASSED: Bot class loaded');
} catch (error) {
  console.log('❌ TEST 1 FAILED: Cannot load bot class');
  console.log('Error:', error.message);
}

// TEST 2: Can we create a bot instance?
console.log('\nTEST 2: Creating bot instance...');
try {
  const OGZPrimeV13Simplified = require('./run-trading-bot-v13-simplified').OGZPrimeV13Simplified;
  if (!OGZPrimeV13Simplified) {
    // Try direct export
    const wholeFile = require('./run-trading-bot-v13-simplified');
    console.log('Module exports:', Object.keys(wholeFile));
  }
  const bot = new OGZPrimeV13Simplified();
  console.log('✅ TEST 2 PASSED: Bot instance created');
} catch (error) {
  console.log('❌ TEST 2 FAILED: Cannot create bot instance');
  console.log('Error:', error.message);
}

// TEST 3: Can we check WebSocket connection?
console.log('\nTEST 3: Checking WebSocket connection...');
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3010/ws');
ws.on('open', () => {
  console.log('✅ TEST 3 PASSED: WebSocket connected to 3010');
  ws.close();
});
ws.on('error', (error) => {
  console.log('❌ TEST 3 FAILED: WebSocket connection error');
  console.log('Error:', error.message);
});

// TEST 4: Check if singleton lock exists
console.log('\nTEST 4: Checking singleton lock...');
const lockFile = './.v13-simplified-bot.lock';
if (fs.existsSync(lockFile)) {
  const lock = JSON.parse(fs.readFileSync(lockFile));
  console.log('⚠️  Lock file exists for PID:', lock.pid);

  // Check if that process is running
  try {
    process.kill(lock.pid, 0);
    console.log('❌ TEST 4 FAILED: Another bot instance is running');
  } catch (e) {
    console.log('✅ TEST 4 PASSED: Lock file is stale (process not running)');
  }
} else {
  console.log('✅ TEST 4 PASSED: No lock file');
}

// TEST 5: Can we read market data?
console.log('\nTEST 5: Testing market data flow...');
setTimeout(() => {
  // Check if we have price data in cache
  const testWs = new WebSocket('ws://localhost:3010/ws');
  testWs.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'price') {
      console.log('✅ TEST 5 PASSED: Receiving price data:', msg.data.asset, msg.data.price);
      testWs.close();
    }
  });
  testWs.on('error', () => {
    console.log('❌ TEST 5 FAILED: Cannot get market data');
  });
}, 1000);

// TEST 6: Can we call trading methods directly?
console.log('\nTEST 6: Testing trading methods...');
setTimeout(() => {
  try {
    // Mock market data
    const mockData = {
      price: 100000,
      rsi: 30,
      macd: 1,
      trend: 'up',
      volume: 1000
    };

    console.log('Testing with mock data:', mockData);
    // We'll test actual method calls if bot loads
    console.log('✅ TEST 6: Ready to test trading methods');
  } catch (error) {
    console.log('❌ TEST 6 FAILED:', error.message);
  }
}, 2000);

// Keep script running for async tests
setTimeout(() => {
  console.log('\n=== ISOLATION TEST COMPLETE ===\n');
  process.exit(0);
}, 5000);