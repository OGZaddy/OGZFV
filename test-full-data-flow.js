/**
 * 🧪 COMPREHENSIVE DATA FLOW TEST
 * Tests the complete data pipeline from Kraken → SSL Server → Dashboard
 */

const WebSocket = require('ws');

console.log('🧪 Starting comprehensive data flow test...\n');

// Test configuration
const SSL_SERVER_URL = 'ws://127.0.0.1:3010/ws';
let testsPassed = 0;
let testsFailed = 0;

// Test 1: Connect to SSL Server
console.log('📝 Test 1: Connecting to SSL Server...');
const ws = new WebSocket(SSL_SERVER_URL);

ws.on('open', () => {
  console.log('✅ Test 1 PASSED: Connected to SSL server\n');
  testsPassed++;
  
  // Test 2: Identify as dashboard
  console.log('📝 Test 2: Identifying as dashboard...');
  ws.send(JSON.stringify({
    type: 'identify',
    source: 'dashboard',
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    // Test 3: Receive price data
    if (message.type === 'price') {
      console.log('✅ Test 3 PASSED: Received price data from Kraken');
      console.log(`   Asset: ${message.data.asset}`);
      console.log(`   Price: $${message.data.price}`);
      console.log(`   Source: ${message.data.source}`);
      console.log(`   Timestamp: ${new Date(message.data.timestamp).toLocaleTimeString()}`);
      
      // Test 4: Validate data structure
      console.log('\n📝 Test 4: Validating data structure...');
      const requiredFields = ['asset', 'price', 'timestamp', 'source'];
      const hasAllFields = requiredFields.every(field => message.data.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('✅ Test 4 PASSED: Data structure is valid');
        testsPassed += 3; // Tests 2, 3, and 4
      } else {
        console.log('❌ Test 4 FAILED: Missing required fields');
        testsFailed++;
      }
      
      // Test 5: Validate data types
      console.log('\n📝 Test 5: Validating data types...');
      const validTypes = 
        typeof message.data.asset === 'string' &&
        typeof message.data.price === 'number' &&
        typeof message.data.timestamp === 'number' &&
        typeof message.data.source === 'string';
        
      if (validTypes) {
        console.log('✅ Test 5 PASSED: All data types are correct');
        testsPassed++;
      } else {
        console.log('❌ Test 5 FAILED: Invalid data types');
        testsFailed++;
      }
      
      // Test 6: Validate Kraken source
      console.log('\n📝 Test 6: Validating Kraken as data source...');
      if (message.data.source === 'kraken') {
        console.log('✅ Test 6 PASSED: Data source is Kraken');
        testsPassed++;
      } else {
        console.log(`❌ Test 6 FAILED: Expected Kraken, got ${message.data.source}`);
        testsFailed++;
      }
      
      // Print final results
      console.log('\n' + '='.repeat(50));
      console.log('📊 TEST RESULTS:');
      console.log('='.repeat(50));
      console.log(`✅ Tests Passed: ${testsPassed}/6`);
      console.log(`❌ Tests Failed: ${testsFailed}/6`);
      console.log(`📈 Success Rate: ${((testsPassed/6) * 100).toFixed(1)}%`);
      console.log('='.repeat(50));
      
      if (testsPassed === 6) {
        console.log('\n🎉 ALL TESTS PASSED! Data flow is working perfectly!');
        console.log('✅ Kraken → SSL Server → Dashboard pipeline is operational\n');
      } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.\n');
      }
      
      // Close connection and exit
      setTimeout(() => {
        ws.close();
        process.exit(testsPassed === 6 ? 0 : 1);
      }, 2000);
    }
    
    // Log other message types
    if (message.type !== 'price' && message.type !== 'pong') {
      console.log(`📨 Received message type: ${message.type}`);
    }
    
  } catch (err) {
    console.error('❌ Error parsing message:', err.message);
    testsFailed++;
  }
});

ws.on('error', (error) => {
  console.error('❌ Test 1 FAILED: WebSocket error:', error.message);
  testsFailed++;
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 Connection closed');
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout - no price data received within 30 seconds');
  console.log('❌ This might indicate:');
  console.log('   1. SSL server is not running');
  console.log('   2. Kraken connection is not established');
  console.log('   3. Data is not being broadcast\n');
  ws.close();
  process.exit(1);
}, 30000);
