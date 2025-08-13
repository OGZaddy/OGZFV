// create-synthetic-data.js
const fs = require('fs');
const path = require('path');

// Generate 1000 synthetic candles
const candles = [];
let currentTimestamp = Date.now() - (1000 * 60 * 60 * 24); // Start 24 hours ago

for (let i = 0; i < 1000; i++) {
  const basePrice = 30000 + (Math.random() * 3000);
  candles.push({
    timestamp: currentTimestamp,
    open: basePrice,
    high: basePrice * (1 + (Math.random() * 0.01)),
    low: basePrice * (1 - (Math.random() * 0.01)),
    close: basePrice * (1 + (Math.random() * 0.02 - 0.01)),
    volume: Math.random() * 100
  });
  
  // Move forward 1 minute
  currentTimestamp += 60 * 1000;
}

// Make sure data directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write the file
fs.writeFileSync(
  path.join(dataDir, '1m-btcusdt-synthetic.json'),
  JSON.stringify(candles),
  'utf8'
);

console.log('Created synthetic data file with 1000 candles');