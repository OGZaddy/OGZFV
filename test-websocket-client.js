const WebSocket = require('ws');

console.log('Attempting to connect to SSL server on port 8001...');
const ws = new WebSocket('ws://localhost:8001');

ws.on('open', () => {
  console.log('✅ Connected to SSL server!');
});

ws.on('message', (data) => {
  console.log('📊 Received data:', data.toString());
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', () => {
  console.log('🔌 WebSocket closed');
});

// Keep the script running
setTimeout(() => {
  console.log('Test complete, closing connection...');
  ws.close();
  process.exit(0);
}, 10000);
