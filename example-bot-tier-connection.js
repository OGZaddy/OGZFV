/**
 * EXAMPLE BOT CONNECTION WITH TIER IDENTIFICATION
 * 
 * This shows how EACH bot in its own directory should connect to the 
 * SINGLE unified dashboard/SSL server
 * 
 * Just change BOT_TIER to match your bot:
 * - 'starter' for valhalla-v1-starter
 * - 'pro' for valhalla-v2-pro  
 * - 'elite' for valhalla-v3-elite
 * - 'quantum' for quantum-ultimate
 */

const WebSocket = require('ws');

// ⚡ CHANGE THIS FOR EACH BOT
const BOT_TIER = 'starter';  // 'starter', 'pro', 'elite', or 'quantum'

// 🔌 ALWAYS CONNECT TO THE SAME SERVER
const WS_URL = 'ws://localhost:3010/ws';

class UnifiedBotConnection {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 3000;
        
        console.log(`🤖 Initializing ${BOT_TIER.toUpperCase()} tier bot`);
        console.log(`🔌 Connecting to unified server at ${WS_URL}`);
    }
    
    connect() {
        try {
            this.ws = new WebSocket(WS_URL);
            
            this.ws.on('open', () => {
                console.log(`✅ ${BOT_TIER} bot connected to unified dashboard`);
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // IMMEDIATELY IDENTIFY WHICH BOT THIS IS
                this.identify();
                
                // Start sending updates
                this.startTradingSimulation();
            });
            
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleDashboardMessage(message);
                } catch (err) {
                    console.error('Error parsing message:', err);
                }
            });
            
            this.ws.on('close', () => {
                console.log(`⚠️ ${BOT_TIER} bot disconnected from dashboard`);
                this.connected = false;
                this.handleReconnect();
            });
            
            this.ws.on('error', (error) => {
                console.error(`❌ ${BOT_TIER} bot WebSocket error:`, error.message);
            });
            
        } catch (error) {
            console.error(`Failed to connect ${BOT_TIER} bot:`, error);
            this.handleReconnect();
        }
    }
    
    /**
     * CRITICAL: Identify which bot tier this is
     */
    identify() {
        this.sendMessage({
            type: 'identify',
            source: 'trading_bot',
            botTier: BOT_TIER,  // THIS IS THE KEY FIELD
            version: '1.0.0',
            timestamp: Date.now()
        });
    }
    
    /**
     * Send any message to dashboard - ALWAYS include botTier
     */
    sendMessage(data) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            // ALWAYS include botTier so dashboard knows which bot sent this
            const message = {
                ...data,
                botTier: BOT_TIER,
                timestamp: data.timestamp || Date.now()
            };
            
            this.ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * Handle messages from dashboard (manual controls, etc)
     */
    handleDashboardMessage(message) {
        // Check if message is for this specific bot tier or all bots
        if (message.targetBot && message.targetBot !== BOT_TIER && message.targetBot !== 'all') {
            return; // Message not for us
        }
        
        switch (message.type) {
            case 'manual_buy':
                console.log(`📈 ${BOT_TIER} bot received manual BUY command`);
                this.executeBuy();
                break;
                
            case 'manual_sell':
                console.log(`📉 ${BOT_TIER} bot received manual SELL command`);
                this.executeSell();
                break;
                
            case 'kill':
                console.log(`🛑 ${BOT_TIER} bot received KILL command`);
                this.shutdown();
                break;
                
            case 'ping':
                this.sendMessage({ type: 'pong' });
                break;
        }
    }
    
    /**
     * Simulate trading activity (replace with your actual trading logic)
     */
    startTradingSimulation() {
        // Send initial status
        this.sendMessage({
            type: 'status',
            data: {
                active: true,
                balance: 10000,
                positions: 0,
                mode: 'PAPER'
            }
        });
        
        // Simulate trades periodically
        setInterval(() => {
            if (!this.connected) return;
            
            // Random decision
            const decision = Math.random();
            
            if (decision > 0.7) {
                // Simulate a trade
                const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
                const price = 50000 + Math.random() * 1000;
                const pnl = (Math.random() - 0.5) * 100;
                
                this.sendMessage({
                    type: 'trade',
                    action: action,
                    asset: 'BTC-USD',
                    price: price,
                    amount: 0.001,
                    pnl: pnl,
                    reason: this.getRandomReason(),
                    confidence: Math.random() * 100
                });
                
                console.log(`💰 ${BOT_TIER} bot executed ${action} at $${price.toFixed(2)}`);
            }
            
            // Send heartbeat
            this.sendMessage({
                type: 'heartbeat',
                data: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage().heapUsed / 1024 / 1024,
                    cpu: process.cpuUsage()
                }
            });
            
        }, 10000); // Every 10 seconds
    }
    
    getRandomReason() {
        const reasons = {
            starter: [
                'RSI oversold signal',
                'MACD crossover detected',
                'Support level bounce',
                'Resistance breakout'
            ],
            pro: [
                'Advanced pattern recognition',
                'Multi-timeframe confluence',
                'Volume profile analysis',
                'Fibonacci retracement'
            ],
            elite: [
                'AI pattern matched',
                'Quantum analysis positive',
                'Neural network prediction',
                'Machine learning signal'
            ],
            quantum: [
                'Quantum entanglement detected',
                'Divine module consensus',
                'TimeGAN future prediction',
                'GANN sacred geometry aligned'
            ]
        };
        
        const tierReasons = reasons[BOT_TIER] || reasons.starter;
        return tierReasons[Math.floor(Math.random() * tierReasons.length)];
    }
    
    executeBuy() {
        // Your actual buy logic here
        console.log(`Executing BUY for ${BOT_TIER} bot...`);
        
        this.sendMessage({
            type: 'trade',
            action: 'BUY',
            asset: 'BTC-USD',
            price: 50000,
            amount: 0.001,
            pnl: 0,
            reason: 'Manual buy command',
            manual: true
        });
    }
    
    executeSell() {
        // Your actual sell logic here
        console.log(`Executing SELL for ${BOT_TIER} bot...`);
        
        this.sendMessage({
            type: 'trade',
            action: 'SELL',
            asset: 'BTC-USD',
            price: 50000,
            amount: 0.001,
            pnl: 0,
            reason: 'Manual sell command',
            manual: true
        });
    }
    
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for ${BOT_TIER} bot`);
            process.exit(1);
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
        
        console.log(`🔄 Reconnecting ${BOT_TIER} bot in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    shutdown() {
        console.log(`👋 Shutting down ${BOT_TIER} bot...`);
        
        this.sendMessage({
            type: 'status',
            data: {
                active: false,
                shutting_down: true
            }
        });
        
        if (this.ws) {
            this.ws.close();
        }
        
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
}

// 🚀 LAUNCH THE BOT
const bot = new UnifiedBotConnection();
bot.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    bot.shutdown();
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    bot.shutdown();
});

console.log(`
╔════════════════════════════════════════════╗
║     ${BOT_TIER.toUpperCase()} TIER BOT INITIALIZED          ║
║                                            ║
║  Connecting to unified dashboard...        ║
║  WebSocket: ${WS_URL}         ║
║  Bot Tier: ${BOT_TIER}                         ║
║                                            ║
╚════════════════════════════════════════════╝
`);

module.exports = { UnifiedBotConnection };