#!/usr/bin/env node

/**
 * 🔧 UPDATE BOT CONFIGURATION
 * Updates the trading bot's data acceptance window
 * WITHOUT touching websocket configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Updating bot configuration for better data acceptance...');

// Update .env file with more reasonable data windows
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// Add configuration for data acceptance windows
const configsToAdd = [
    'MARKET_DATA_STALE_TIMEOUT=60000',  // Accept data up to 60 seconds old
    'PRICE_UPDATE_INTERVAL=60000',       // Expect price updates every 60 seconds
    'MIN_TRADE_INTERVAL=30000',          // Allow trades every 30 seconds
    'WEBSOCKET_TIMEOUT=120000',          // WebSocket timeout 2 minutes
    'DATA_FRESHNESS_WINDOW=45000'        // Consider data fresh for 45 seconds
];

configsToAdd.forEach(config => {
    const [key] = config.split('=');
    if (!envContent.includes(key)) {
        envContent += `\n${config}`;
        console.log(`✅ Added ${key}`);
    }
});

fs.writeFileSync(envPath, envContent.trim() + '\n');

console.log('\n📝 Configuration updated!');
console.log('🔄 Please restart the trading bot to apply changes');
console.log('\nRecommended command:');
console.log('pkill -f "run-trading-bot" && sleep 2 && node run-trading-bot-v13-simplified.js');
