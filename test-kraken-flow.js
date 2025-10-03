#!/usr/bin/env node
/**
 * Test Kraken Data Flow - Verifies data flows from Kraken → Bot → Dashboard
 * Run: node test-kraken-flow.js
 */

const WebSocket = require('ws');

console.log('🧪 KRAKEN DATA FLOW TEST');
console.log('========================\n');

// Test 1: Connect to SSL server
console.log('Test 1: Connecting to SSL Server (localhost:3010)...');
const ws = new WebSocket('ws://127.0.0.1:3010/ws');

let receivedPrice = false;
let receivedCount = 0;

ws.on('open', () => {
  console.log('✅ Connected to SSL Server\n');
  
  // Identify as test client
  ws.send(JSON.stringify({
    type: 'identify',
    source: 'test_client',
    timestamp: Date.now()
  }));
  
  console.log('Test 2: Listening for price updates...');
  console.log('(Waiting for Kraken data - this may take 5-10 seconds)\n');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    // Count all messages
    receivedCount++;
    
    if (msg.type === 'price' && msg.data) {
      receivedPrice = true;
      console.log(`✅ PRICE UPDATE RECEIVED!`);
      console.log(`   Asset: ${msg.data.asset}`);
      console.log(`   Price: $${msg.data.price.toFixed(2)}`);
      console.log(`   Source: ${msg.data.source}`);
      console.log(`   Timestamp: ${new Date(msg.data.timestamp).toLocaleTimeString()}`);
      console.log(`   Total messages received: ${receivedCount}\n`);
      
      if (msg.data.source === 'kraken') {
        console.log('🎉 SUCCESS! Kraken data is flowing correctly!');
        console.log('\n📊 Data Flow Verified:');
        console.log('   Kraken → SSL Server → Test Client ✅\n');
        
        // Give it a moment then exit
        setTimeout(() => {
          ws.close();
          process.exit(0);
        }, 2000);
      }
    }
  } catch (err) {
    console.error('❌ Error parsing message:', err.message);
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
  console.log('\n⚠️  Make sure ogzprime_ssl_server_advanced.js is running!');
  console.log('   Run: pm2 status');
  console.log('   Or: node ogzprime_ssl_server_advanced.js\n');
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Disconnected from SSL Server');
  
  if (!receivedPrice) {
    console.log('\n⚠️  No price data received!');
    console.log('   This could mean:');
    console.log('   1. SSL server is not running');
    console.log('   2. Kraken WebSocket not connected');
    console.log('   3. No data broadcast yet (wait longer)\n');
  }
  
  process.exit(receivedPrice ? 0 : 1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout (30s)');
  console.log(`   Received ${receivedCount} total messages`);
  
  if (!receivedPrice) {
    console.log('   ❌ No price updates received');
    console.log('\n   Troubleshooting:');
    console.log('   1. Check if SSL server is running: pm2 list');
    console.log('   2. Check SSL server logs: pm2 logs ssl-server');
    console.log('   3. Verify Kraken connection in logs\n');
  }
  
  ws.close();
  process.exit(receivedPrice ? 0 : 1);
}, 30000);
