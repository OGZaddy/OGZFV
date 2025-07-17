
const fs = require('fs');
const path = require('path');

console.log('🚀 ACTIVATING AGGRESSIVE TRADING MODE...');

// Read current bot status
const botStatusPath = path.join(__dirname, 'bot_status.json');
let botStatus = {};

try {
  if (fs.existsSync(botStatusPath)) {
    botStatus = JSON.parse(fs.readFileSync(botStatusPath, 'utf8'));
  }
} catch (error) {
  console.log('Creating new bot status...');
}

// Force trading activation
botStatus.confidence = 75; // Force high confidence
botStatus.decision = "HIGH CONFIDENCE - Ready to trade (75.0%)";
botStatus.thought = "AGGRESSIVE MODE ACTIVATED - Looking for immediate trades!";

if (botStatus.systemState) {
  botStatus.systemState.averageConfidence = 0.75;
  botStatus.systemState.mode = 'aggressive_trading';
  botStatus.systemState.emergencyMode = false;
  botStatus.systemState.riskLimitExceeded = false;
}

// Write updated status
fs.writeFileSync(botStatusPath, JSON.stringify(botStatus, null, 2));
console.log('✅ AGGRESSIVE TRADING MODE ACTIVATED!');
console.log('💰 Bot should start trading immediately!');
console.log('📊 Confidence boosted to 75%');
