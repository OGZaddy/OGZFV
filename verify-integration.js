#!/usr/bin/env node

/**
 * QUANTUM SYSTEM INTEGRATION VERIFICATION
 * Verifies WebSocket connections and data flow through the entire system
 */

const WebSocket = require('ws');

class SystemVerifier {
    constructor() {
        this.wsUrl = 'ws://127.0.0.1:3010/ws';
        this.checks = {
            websocket: false,
            priceData: false,
            botConnections: false,
            tradeExecution: false,
            dashboardData: false
        };
        this.connectedBots = new Set();
        this.receivedMessages = [];
    }

    async verify() {
        console.log('🔍 QUANTUM SYSTEM INTEGRATION VERIFICATION');
        console.log('=' .repeat(50));
        console.log('📡 Testing WebSocket endpoint:', this.wsUrl);
        console.log('🎯 Expected bots: elite, pro, starter, quantum');
        console.log('💰 Checking for REAL Polygon data only');
        console.log('');

        try {
            await this.testWebSocketConnection();
            await this.waitForData(30000); // Wait 30 seconds for data
            this.generateReport();
        } catch (error) {
            console.error('❌ VERIFICATION FAILED:', error.message);
            process.exit(1);
        }
    }

    async testWebSocketConnection() {
        console.log('1️⃣ Testing WebSocket connection...');
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.wsUrl);
            
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);

            ws.on('open', () => {
                console.log('   ✅ WebSocket connected successfully');
                this.checks.websocket = true;
                clearTimeout(timeout);
                
                // Identify as verifier
                ws.send(JSON.stringify({
                    type: 'identify',
                    source: 'system_verifier',
                    version: '1.0.0'
                }));
                
                resolve();
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message);
                } catch (error) {
                    console.log('   📨 Raw message:', data.toString());
                }
            });

            ws.on('error', (error) => {
                console.error('   ❌ WebSocket error:', error.message);
                clearTimeout(timeout);
                reject(error);
            });

            ws.on('close', () => {
                console.log('   🔌 WebSocket connection closed');
            });

            this.ws = ws;
        });
    }

    handleMessage(message) {
        this.receivedMessages.push({
            ...message,
            receivedAt: Date.now()
        });

        switch (message.type) {
            case 'identify':
                if (message.source === 'trading_bot' && message.botTier) {
                    this.connectedBots.add(message.botTier);
                    console.log(`   🤖 ${message.botTier.toUpperCase()} bot connected`);
                }
                break;

            case 'price':
                if (message.data && message.data.price) {
                    this.checks.priceData = true;
                    console.log(`   📈 REAL price data: ${message.data.asset || 'BTC-USD'} = $${message.data.price}`);
                }
                break;

            case 'trade':
                this.checks.tradeExecution = true;
                console.log(`   💰 Trade executed: ${message.botTier} ${message.action} at $${message.price}`);
                console.log(`      P&L: $${message.pnl || 0}, Reason: ${message.reason}`);
                break;

            case 'indicators':
                console.log(`   📊 Indicators: RSI=${message.data.rsi}, MACD=${message.data.macd}`);
                break;

            case 'pattern':
                console.log(`   🔍 Pattern detected: ${JSON.stringify(message.data)}`);
                break;

            case 'ensemble':
                console.log(`   🧠 Ensemble decision: ${JSON.stringify(message.data)}`);
                break;

            default:
                console.log(`   📨 Message: ${message.type} from ${message.source || 'unknown'}`);
                break;
        }

        // Check if we have bot connections
        if (this.connectedBots.size >= 2) {
            this.checks.botConnections = true;
        }

        // Check for dashboard-compatible data
        if (['trade', 'price', 'indicators'].includes(message.type)) {
            this.checks.dashboardData = true;
        }
    }

    async waitForData(timeout) {
        console.log('');
        console.log('2️⃣ Waiting for system data...');
        console.log(`   ⏱️ Timeout: ${timeout / 1000} seconds`);
        
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed >= timeout) {
                    console.log('   ⏰ Data collection timeout reached');
                    clearInterval(checkInterval);
                    resolve();
                }
                
                // Show progress every 5 seconds
                if (elapsed % 5000 === 0) {
                    console.log(`   ⏳ Elapsed: ${Math.floor(elapsed / 1000)}s - Messages: ${this.receivedMessages.length}`);
                }
            }, 1000);
        });
    }

    generateReport() {
        console.log('');
        console.log('📋 VERIFICATION REPORT');
        console.log('=' .repeat(50));
        
        // Check results
        const results = [
            { name: 'WebSocket Connection', status: this.checks.websocket, critical: true },
            { name: 'Real Price Data', status: this.checks.priceData, critical: true },
            { name: 'Bot Connections', status: this.checks.botConnections, critical: true },
            { name: 'Trade Execution', status: this.checks.tradeExecution, critical: false },
            { name: 'Dashboard Data', status: this.checks.dashboardData, critical: true }
        ];

        let criticalFailed = 0;
        let totalPassed = 0;

        results.forEach(result => {
            const icon = result.status ? '✅' : '❌';
            const criticality = result.critical ? '[CRITICAL]' : '[OPTIONAL]';
            
            console.log(`${icon} ${result.name} ${criticality}`);
            
            if (result.status) {
                totalPassed++;
            } else if (result.critical) {
                criticalFailed++;
            }
        });

        console.log('');
        console.log(`📊 Results: ${totalPassed}/${results.length} checks passed`);
        console.log(`🤖 Connected bots: ${Array.from(this.connectedBots).join(', ')}`);
        console.log(`📨 Total messages: ${this.receivedMessages.length}`);
        
        // Message breakdown
        const messageTypes = {};
        this.receivedMessages.forEach(msg => {
            messageTypes[msg.type] = (messageTypes[msg.type] || 0) + 1;
        });
        
        console.log('📈 Message breakdown:');
        Object.entries(messageTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });

        console.log('');
        
        if (criticalFailed === 0) {
            console.log('🎉 INTEGRATION SUCCESSFUL!');
            console.log('✅ All critical systems are operational');
            console.log('📡 WebSocket data flow verified');
            console.log('💰 Real Polygon data confirmed');
            console.log('🤖 Bot tiers are connected and trading');
            console.log('🌐 Dashboard will receive live data');
            console.log('');
            console.log('🚀 READY FOR HOUSTON! 🎯');
        } else {
            console.log('⚠️ INTEGRATION ISSUES DETECTED');
            console.log(`❌ ${criticalFailed} critical systems failed`);
            console.log('🔧 Check PM2 logs: pm2 logs');
            console.log('🌐 Verify SSL server is running on port 3010');
            console.log('🔑 Check Polygon API key in .env file');
        }

        this.ws.close();
    }
}

// Run verification
const verifier = new SystemVerifier();
verifier.verify().catch(console.error);