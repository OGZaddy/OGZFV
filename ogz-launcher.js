const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 OGZ Prime Combined Launcher');
console.log('==============================\n');

// Start SSL server
console.log('🔒 Starting SSL WebSocket servers...');
const sslProcess = spawn('node', ['start-ssl-server.js'], {
  stdio: 'inherit',
  detached: false
});

// Wait for SSL to initialize
setTimeout(() => {
  console.log('\n🤖 Starting Trading Bot...\n');
  
  // Start trading bot
  const botProcess = spawn('node', ['run-trading-bot-v10.2.js'], {
    stdio: 'inherit',
    detached: false
  });
  
  // Handle bot exit
  botProcess.on('exit', (code) => {
    console.log(`\n🛑 Trading bot exited with code ${code}`);
    // Kill SSL server when bot exits
    sslProcess.kill();
    process.exit(code);
  });
  
}, 3000);

// Handle launcher exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all processes...');
  sslProcess.kill();
  process.exit(0);
});

// Handle SSL server errors
sslProcess.on('error', (error) => {
  console.error('❌ SSL Server Error:', error.message);
});

sslProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ SSL Server exited with code ${code}`);
    process.exit(code);
  }
});

console.log('✅ Combined launcher initialized');
console.log('📝 Use Ctrl+C to stop all processes');
console.log('');
console.log('🔒 SSL Server will use ports 4001-4003');
console.log('🤖 Trading Bot will use ports 3001-3003');
console.log('🚫 NO MORE PORT CONFLICTS!');