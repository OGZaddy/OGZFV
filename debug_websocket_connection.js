#!/usr/bin/env node

/**
 * WebSocket Connection Diagnostic Tool
 * Validates the exact connection flow between dashboard and bot
 */

const WebSocket = require('ws');
const fs = require('fs');

console.log('🔍 WEBSOCKET CONNECTION DIAGNOSTIC TOOL');
console.log('=====================================');

// Test 1: Check if OGZ Prime bot is running locally
async function testLocalBotConnection() {
    console.log('\n📡 TEST 1: Local Bot Connection (port 3002)');
    console.log('-------------------------------------------');
    
    try {
        const ws = new WebSocket('ws://localhost:3002');
        
        ws.on('open', () => {
            console.log('✅ LOCAL BOT RUNNING: WebSocket server active on port 3002');
            ws.close();
        });
        
        ws.on('error', (error) => {
            console.log('❌ LOCAL BOT NOT RUNNING: No WebSocket server on port 3002');
            console.log(`   Error: ${error.message}`);
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                console.log('⏰ LOCAL BOT TIMEOUT: No response from port 3002');
                ws.terminate();
            }
        }, 3000);
        
    } catch (error) {
        console.log('❌ LOCAL CONNECTION ERROR:', error.message);
    }
}

// Test 2: Check ngrok tunnel
async function testNgrokTunnel() {
    console.log('\n🌐 TEST 2: ngrok Tunnel Connection');
    console.log('----------------------------------');
    
    const ngrokUrl = 'wss://34b7-24-155-106-20.ngrok-free.app';
    
    try {
        const ws = new WebSocket(ngrokUrl);
        
        ws.on('open', () => {
            console.log('✅ NGROK TUNNEL ACTIVE: External connection successful');
            console.log(`   URL: ${ngrokUrl}`);
            ws.close();
        });
        
        ws.on('error', (error) => {
            console.log('❌ NGROK TUNNEL FAILED: External connection failed');
            console.log(`   URL: ${ngrokUrl}`);
            console.log(`   Error: ${error.message}`);
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                console.log('⏰ NGROK TIMEOUT: No response from external URL');
                ws.terminate();
            }
        }, 5000);
        
    } catch (error) {
        console.log('❌ NGROK CONNECTION ERROR:', error.message);
    }
}

// Test 3: Check if OGZ Prime process is running
function testProcessRunning() {
    console.log('\n🔄 TEST 3: Process Status Check');
    console.log('-------------------------------');
    
    // Check for bot_status.json (created by running bot)
    if (fs.existsSync('bot_status.json')) {
        try {
            const status = JSON.parse(fs.readFileSync('bot_status.json', 'utf8'));
            console.log('✅ BOT STATUS FILE EXISTS: Bot appears to be running');
            console.log(`   Last Update: ${status.timestamp}`);
            console.log(`   Decision: ${status.decision}`);
            console.log(`   Balance: $${status.balance}`);
        } catch (error) {
            console.log('⚠️ BOT STATUS FILE CORRUPTED:', error.message);
        }
    } else {
        console.log('❌ BOT STATUS FILE MISSING: Bot likely not running');
        console.log('   File: bot_status.json not found');
    }
}

// Test 4: Check environment configuration
function testEnvironmentConfig() {
    console.log('\n⚙️ TEST 4: Environment Configuration');
    console.log('------------------------------------');
    
    if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8').trim();
        if (envContent.length === 0) {
            console.log('⚠️ EMPTY .env FILE: No environment variables configured');
        } else {
            console.log('✅ .env FILE EXISTS: Environment variables configured');
            const lines = envContent.split('\n').filter(line => line.trim());
            console.log(`   Variables: ${lines.length} configured`);
        }
    } else {
        console.log('❌ NO .env FILE: Environment not configured');
    }
}

// Test 5: Check dashboard configuration
function testDashboardConfig() {
    console.log('\n🖥️ TEST 5: Dashboard Configuration');
    console.log('----------------------------------');
    
    if (fs.existsSync('ogz-ultimate-dashboard.html')) {
        const dashboardContent = fs.readFileSync('ogz-ultimate-dashboard.html', 'utf8');
        
        // Extract WebSocket endpoint
        const wsMatch = dashboardContent.match(/wsEndpoint:\s*['"`]([^'"`]+)['"`]/);
        if (wsMatch) {
            console.log('✅ DASHBOARD CONFIG FOUND:');
            console.log(`   WebSocket Endpoint: ${wsMatch[1]}`);
            
            // Check if it's pointing to localhost or external
            if (wsMatch[1].includes('localhost') || wsMatch[1].includes('127.0.0.1')) {
                console.log('   Type: Local connection');
            } else {
                console.log('   Type: External connection (ngrok)');
            }
        } else {
            console.log('⚠️ DASHBOARD CONFIG UNCLEAR: Could not find WebSocket endpoint');
        }
    } else {
        console.log('❌ DASHBOARD NOT FOUND: ogz-ultimate-dashboard.html missing');
    }
}

// Main diagnostic function
async function runDiagnostics() {
    console.log('Starting comprehensive WebSocket diagnostics...\n');
    
    // Run all tests
    testProcessRunning();
    testEnvironmentConfig();
    testDashboardConfig();
    await testLocalBotConnection();
    await testNgrokTunnel();
    
    // Wait for async operations to complete
    setTimeout(() => {
        console.log('\n🎯 DIAGNOSTIC SUMMARY');
        console.log('====================');
        console.log('1. Check if OGZ Prime bot is running: node OGZPrimeV10.2.js');
        console.log('2. Verify ngrok tunnel is active and pointing to port 3002');
        console.log('3. Ensure dashboard WebSocket URL matches bot configuration');
        console.log('4. Configure .env file with required API keys');
        console.log('\n💡 NEXT STEPS:');
        console.log('- If bot not running: Start with "node OGZPrimeV10.2.js"');
        console.log('- If ngrok failed: Check ngrok tunnel status');
        console.log('- If config mismatch: Update dashboard WebSocket URL');
        
        process.exit(0);
    }, 8000);
}

// Run diagnostics
runDiagnostics();