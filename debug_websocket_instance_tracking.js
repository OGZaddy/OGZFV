#!/usr/bin/env node

/**
 * WebSocket Instance Tracking Diagnostic
 * This will help us confirm the exact source of the port binding issue
 */

const WebSocketManager = require('./core/WebsocketManager');

console.log('🔍 WEBSOCKET INSTANCE TRACKING DIAGNOSTIC');
console.log('==========================================');

// Test 1: Check WebSocketManager singleton behavior
console.log('\n📊 TEST 1: WebSocketManager Singleton Verification');
console.log('--------------------------------------------------');

const manager1 = require('./core/WebsocketManager');
const manager2 = require('./core/WebsocketManager');

console.log('Manager 1 === Manager 2:', manager1 === manager2);
console.log('Singleton working:', manager1 === manager2 ? '✅ YES' : '❌ NO');

// Test 2: Simulate multiple OGZPrime instances
console.log('\n🤖 TEST 2: Multiple OGZPrime Instance Simulation');
console.log('------------------------------------------------');

const OGZPrimeV10 = require('./OGZPrimeV10.2');

console.log('Creating first OGZPrime instance...');
try {
  const bot1 = new OGZPrimeV10({
    assetName: 'BTC-USD',
    profileName: 'profile1',
    guiWebSocketPort: 3002
  });
  console.log('✅ First instance created successfully');
  
  console.log('Creating second OGZPrime instance...');
  try {
    const bot2 = new OGZPrimeV10({
      assetName: 'ETH-USD', 
      profileName: 'profile2',
      guiWebSocketPort: 3002  // Same port!
    });
    console.log('✅ Second instance created successfully');
    console.log('🟢 NO PORT CONFLICT - WebSocketManager singleton working!');
    
    // Check server status
    const status = WebSocketManager.getServerStatus(3002);
    console.log('Server status:', status);
    
  } catch (error) {
    console.log('❌ Second instance failed:', error.message);
    if (error.message.includes('EADDRINUSE')) {
      console.log('🔴 CONFIRMED: Port binding issue detected!');
      console.log('🔍 This means WebSocketManager singleton is NOT preventing conflicts');
    }
  }
  
} catch (error) {
  console.log('❌ First instance failed:', error.message);
}

// Test 3: Check current server status
console.log('\n📡 TEST 3: Current WebSocket Server Status');
console.log('------------------------------------------');

const allStatus = WebSocketManager.getServerStatus();
console.log('Active servers:', allStatus.length);
allStatus.forEach(server => {
  console.log(`Port ${server.port}: ${server.connections} connections, ${server.errors} errors`);
});

// Test 4: Check for existing processes
console.log('\n🔄 TEST 4: Process and Port Analysis');
console.log('------------------------------------');

const { execSync } = require('child_process');

try {
  // Check what's using port 3002
  const netstat = execSync('netstat -ano | findstr :3002', { encoding: 'utf8' });
  console.log('Port 3002 usage:');
  console.log(netstat);
} catch (error) {
  console.log('Port 3002: Not in use or command failed');
}

console.log('\n🎯 DIAGNOSTIC COMPLETE');
console.log('======================');
console.log('If you see "CONFIRMED: Port binding issue detected!" above,');
console.log('then the issue is multiple OGZPrime instances trying to bind to the same port.');
console.log('The WebSocketManager singleton should prevent this, but may have a bug.');