const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

console.log('🔍 DETAILED WEBSOCKET DIAGNOSTIC TOOL');
console.log('=====================================');
console.log('Testing actual WebSocket communication and data flow...\n');

// Test configuration
const LOCAL_WS_URL = 'ws://localhost:3002';
const NGROK_WS_URL = 'wss://34b7-24-155-106-20.ngrok-free.app';
const TEST_DURATION = 10000; // 10 seconds

let testResults = {
    localConnection: false,
    ngrokConnection: false,
    dataReceived: false,
    messageCount: 0,
    errors: [],
    connectionStability: 'unknown'
};

// Test 1: Local WebSocket Connection with Message Monitoring
console.log('📡 TEST 1: Local WebSocket Message Flow');
console.log('---------------------------------------');

function testLocalWebSocket() {
    return new Promise((resolve) => {
        try {
            const localWs = new WebSocket(LOCAL_WS_URL);
            let messageCount = 0;
            let connectionStable = true;
            
            localWs.on('open', () => {
                console.log('✅ LOCAL CONNECTION: Established');
                testResults.localConnection = true;
                
                // Send test message
                localWs.send(JSON.stringify({
                    type: 'test',
                    timestamp: new Date().toISOString()
                }));
            });
            
            localWs.on('message', (data) => {
                messageCount++;
                testResults.messageCount = messageCount;
                testResults.dataReceived = true;
                
                try {
                    const message = JSON.parse(data);
                    console.log(`📨 MESSAGE ${messageCount}:`, {
                        type: message.type || 'unknown',
                        timestamp: message.timestamp || 'no timestamp',
                        dataSize: data.length + ' bytes'
                    });
                } catch (e) {
                    console.log(`📨 RAW MESSAGE ${messageCount}:`, data.toString().substring(0, 100) + '...');
                }
            });
            
            localWs.on('error', (error) => {
                console.log('❌ LOCAL ERROR:', error.message);
                testResults.errors.push(`Local: ${error.message}`);
                connectionStable = false;
            });
            
            localWs.on('close', (code, reason) => {
                console.log(`🔌 LOCAL CLOSED: Code ${code}, Reason: ${reason || 'No reason'}`);
                if (code !== 1000) connectionStable = false;
            });
            
            // Test for stability
            setTimeout(() => {
                testResults.connectionStability = connectionStable ? 'stable' : 'unstable';
                localWs.close();
                resolve();
            }, TEST_DURATION);
            
        } catch (error) {
            console.log('❌ LOCAL CONNECTION FAILED:', error.message);
            testResults.errors.push(`Local setup: ${error.message}`);
            resolve();
        }
    });
}

// Test 2: ngrok WebSocket Connection with SSL Verification
console.log('\n🌐 TEST 2: ngrok WebSocket SSL Connection');
console.log('------------------------------------------');

function testNgrokWebSocket() {
    return new Promise((resolve) => {
        try {
            const ngrokWs = new WebSocket(NGROK_WS_URL, {
                rejectUnauthorized: false // Allow self-signed certificates
            });
            let ngrokMessageCount = 0;
            
            ngrokWs.on('open', () => {
                console.log('✅ NGROK CONNECTION: Established');
                testResults.ngrokConnection = true;
                
                // Send test message
                ngrokWs.send(JSON.stringify({
                    type: 'dashboard_test',
                    timestamp: new Date().toISOString()
                }));
            });
            
            ngrokWs.on('message', (data) => {
                ngrokMessageCount++;
                console.log(`📨 NGROK MESSAGE ${ngrokMessageCount}:`, data.toString().substring(0, 100) + '...');
            });
            
            ngrokWs.on('error', (error) => {
                console.log('❌ NGROK ERROR:', error.message);
                testResults.errors.push(`ngrok: ${error.message}`);
            });
            
            ngrokWs.on('close', (code, reason) => {
                console.log(`🔌 NGROK CLOSED: Code ${code}, Reason: ${reason || 'No reason'}`);
            });
            
            setTimeout(() => {
                ngrokWs.close();
                resolve();
            }, TEST_DURATION);
            
        } catch (error) {
            console.log('❌ NGROK CONNECTION FAILED:', error.message);
            testResults.errors.push(`ngrok setup: ${error.message}`);
            resolve();
        }
    });
}

// Test 3: Check Bot WebSocket Server Status
console.log('\n🤖 TEST 3: Bot WebSocket Server Analysis');
console.log('----------------------------------------');

function checkBotStatus() {
    return new Promise((resolve) => {
        try {
            // Check if bot status file exists and is recent
            if (fs.existsSync('bot_status.json')) {
                const status = JSON.parse(fs.readFileSync('bot_status.json', 'utf8'));
                const lastUpdate = new Date(status.timestamp);
                const now = new Date();
                const timeDiff = now - lastUpdate;
                
                console.log('📊 BOT STATUS:');
                console.log(`   Last Update: ${timeDiff < 60000 ? 'Recent' : 'Stale'} (${Math.round(timeDiff/1000)}s ago)`);
                console.log(`   Decision: ${status.decision}`);
                console.log(`   Balance: $${status.balance}`);
                
                if (timeDiff > 120000) { // 2 minutes
                    console.log('⚠️  WARNING: Bot status is stale - bot may not be actively running');
                    testResults.errors.push('Bot status is stale');
                }
            } else {
                console.log('❌ NO BOT STATUS FILE: Bot may not be running');
                testResults.errors.push('No bot status file found');
            }
        } catch (error) {
            console.log('❌ BOT STATUS ERROR:', error.message);
            testResults.errors.push(`Bot status: ${error.message}`);
        }
        resolve();
    });
}

// Test 4: Dashboard Configuration Analysis
console.log('\n🖥️ TEST 4: Dashboard Configuration Check');
console.log('----------------------------------------');

function checkDashboardConfig() {
    return new Promise((resolve) => {
        try {
            if (fs.existsSync('ogz-ultimate-dashboard.html')) {
                const dashboardContent = fs.readFileSync('ogz-ultimate-dashboard.html', 'utf8');
                
                // Extract WebSocket URL
                const wsUrlMatch = dashboardContent.match(/wss?:\/\/[^'"]+/);
                if (wsUrlMatch) {
                    console.log('📱 DASHBOARD CONFIG:');
                    console.log(`   WebSocket URL: ${wsUrlMatch[0]}`);
                    
                    // Check if URL matches our test URL
                    if (wsUrlMatch[0] === NGROK_WS_URL) {
                        console.log('✅ URL MATCH: Dashboard URL matches diagnostic URL');
                    } else {
                        console.log('⚠️  URL MISMATCH: Dashboard URL differs from diagnostic URL');
                        testResults.errors.push('Dashboard URL mismatch');
                    }
                } else {
                    console.log('❌ NO WEBSOCKET URL FOUND in dashboard');
                    testResults.errors.push('No WebSocket URL in dashboard');
                }
            } else {
                console.log('❌ DASHBOARD FILE NOT FOUND');
                testResults.errors.push('Dashboard file not found');
            }
        } catch (error) {
            console.log('❌ DASHBOARD CONFIG ERROR:', error.message);
            testResults.errors.push(`Dashboard config: ${error.message}`);
        }
        resolve();
    });
}

// Run all tests
async function runDiagnostics() {
    await checkBotStatus();
    await checkDashboardConfig();
    await testLocalWebSocket();
    await testNgrokWebSocket();
    
    // Final analysis
    console.log('\n🎯 DETAILED DIAGNOSTIC RESULTS');
    console.log('==============================');
    
    console.log('\n📊 CONNECTION STATUS:');
    console.log(`   Local WebSocket: ${testResults.localConnection ? '✅ Working' : '❌ Failed'}`);
    console.log(`   ngrok WebSocket: ${testResults.ngrokConnection ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Data Flow: ${testResults.dataReceived ? '✅ Active' : '❌ No Data'}`);
    console.log(`   Messages Received: ${testResults.messageCount}`);
    console.log(`   Connection Stability: ${testResults.connectionStability}`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS DETECTED:');
        testResults.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });
    }
    
    console.log('\n💡 DIAGNOSIS:');
    if (!testResults.localConnection && !testResults.ngrokConnection) {
        console.log('🔴 CRITICAL: Both local and ngrok connections failed');
        console.log('   → Bot WebSocket server is not running or not accessible');
        console.log('   → Restart bot: node OGZPrimeV10.2.js');
    } else if (testResults.localConnection && !testResults.ngrokConnection) {
        console.log('🟡 PARTIAL: Local works but ngrok fails');
        console.log('   → ngrok tunnel issue or SSL/TLS problem');
        console.log('   → Check ngrok status and SSL certificates');
    } else if (!testResults.localConnection && testResults.ngrokConnection) {
        console.log('🟡 PARTIAL: ngrok works but local fails');
        console.log('   → Local port conflict or firewall issue');
        console.log('   → Check port 3002 availability');
    } else if (!testResults.dataReceived) {
        console.log('🟡 CONNECTED BUT NO DATA: Connections work but no messages');
        console.log('   → Bot may not be sending trading data');
        console.log('   → Check bot trading logic and data sources');
    } else {
        console.log('🟢 CONNECTIONS WORKING: Issue may be in dashboard JavaScript');
        console.log('   → Check browser console for JavaScript errors');
        console.log('   → Verify dashboard WebSocket event handlers');
    }
}

runDiagnostics().catch(console.error);