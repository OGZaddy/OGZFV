#!/usr/bin/env node

// ==========================================
// DESKTOP CODELLAMA 70B CLIENT
// Run this on your desktop to connect CodeLlama 70B to Trai
// ==========================================

const DesktopWebSocketClient = require('./trai/desktop-websocket-client');

console.log('🦙 CODELLAMA 70B DESKTOP CLIENT');
console.log('================================');
console.log('This will connect your desktop CodeLlama 70B to Trai on VPS');
console.log('Make sure Ollama is running with CodeLlama 70B model loaded');
console.log('');

// Initialize the client
const client = new DesktopWebSocketClient({
  vpsUrl: 'ws://149.248.242.111:3010',
  localOllamaUrl: 'http://127.0.0.1:11434',
  modelName: 'codellama:70b-instruct-q4_K_M',
  reconnectDelay: 5000
});

// Start the client
client.initialize().then(success => {
  if (success) {
    console.log('🚀 SUCCESS: CodeLlama 70B is now connected to Trai!');
    console.log('');
    console.log('✅ Your desktop CodeLlama 70B is now available to Trai for:');
    console.log('   • Advanced market analysis');
    console.log('   • Complex trading strategy generation'); 
    console.log('   • Code debugging and optimization');
    console.log('   • Technical support queries');
    console.log('');
    console.log('🔥 Keep this terminal open to maintain the connection');
    console.log('   Press Ctrl+C to disconnect');
  } else {
    console.log('❌ FAILED: Could not connect to Trai');
    console.log('');
    console.log('Check:');
    console.log('1. Ollama is running: ollama serve');
    console.log('2. CodeLlama 70B is available: ollama list');
    console.log('3. VPS connection: ping 149.248.242.111');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 CONNECTION ERROR:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Disconnecting CodeLlama 70B from Trai...');
  client.cleanup();
  console.log('✅ Disconnected successfully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating CodeLlama bridge...');
  client.cleanup();
  process.exit(0);
});