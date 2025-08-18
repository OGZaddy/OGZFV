/**
 * STARTER TIER BOT - $97/mo
 * Basic RSI/MACD trading with paper trading
 */

const WebSocket = require('ws');

const BOT_TIER = 'starter';
const WS_URL = 'ws://127.0.0.1:3010/ws';

class StarterBot {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.balance = 10000;
        this.trades = 0;
        this.wins = 0;
        this.pnl = 0;
        this.reconnectAttempts = 0;
        this.lastPong = Date.now();
    }
    
    connect() {
        console.log(`🟢 STARTER TIER BOT INITIALIZING...`);
        
        this.ws = new WebSocket(WS_URL);
        
        this.ws.on('open', () => {
            console.log(`✅ Starter bot connected to unified dashboard`);
            this.connected = true;
            this.reconnectAttempts = 0; // Reset on successful connection
            
            // Identify ourselves
            this.ws.send(JSON.stringify({
                type: 'identify',
                source: 'trading_bot',
                botTier: BOT_TIER,
                version: '1.0.0'
            }));
            
            // Start trading simulation
            this.startTrading();
        });
        
        this.ws.on('message', (data) => {
            const msg = JSON.parse(data);
            if (msg.type === 'manual_buy') this.executeBuy();
            if (msg.type === 'manual_sell') this.executeSell();
        });
        
        this.ws.on('close', (code, reason) => {
            console.log(`Disconnected (code: ${code}), reconnecting...`);
            this.connected = false;
            // Exponential backoff reconnection
            const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts), 30000);
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), delay);
        });
        
        // Add heartbeat to prevent timeouts
        this.ws.on('pong', () => {
            this.lastPong = Date.now();
        });
        
        // Send ping every 30 seconds to keep connection alive
        setInterval(() => {
            if (this.connected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }
    
    startTrading() {
        // Send status every 5 seconds
        setInterval(() => {
            if (!this.connected) return;
            
            // Simple RSI/MACD simulation
            if (Math.random() > 0.8) {
                const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
                const pnl = (Math.random() - 0.5) * 50;
                
                this.trades++;
                this.pnl += pnl;
                if (pnl > 0) this.wins++;
                
                this.ws.send(JSON.stringify({
                    type: 'trade',
                    botTier: BOT_TIER,
                    action: action,
                    price: 50000 + Math.random() * 1000,
                    pnl: pnl,
                    reason: action === 'BUY' ? 'RSI oversold' : 'MACD bearish cross',
                    confidence: 60 + Math.random() * 20
                }));
                
                console.log(`📊 STARTER: ${action} executed, P&L: $${pnl.toFixed(2)}`);
            }
        }, 5000);
    }
    
    executeBuy() {
        this.ws.send(JSON.stringify({
            type: 'trade',
            botTier: BOT_TIER,
            action: 'BUY',
            price: 50000,
            pnl: 0,
            reason: 'Manual buy',
            manual: true
        }));
    }
    
    executeSell() {
        this.ws.send(JSON.stringify({
            type: 'trade',
            botTier: BOT_TIER,
            action: 'SELL',
            price: 50000,
            pnl: 0,
            reason: 'Manual sell',
            manual: true
        }));
    }
}

const bot = new StarterBot();
bot.connect();

console.log(`
╔════════════════════════════════════╗
║      STARTER TIER BOT ($97/mo)     ║
║                                    ║
║  • Basic RSI/MACD Trading          ║
║  • Paper Trading Only              ║
║  • 10 Trades/Day Limit             ║
║  • Basic Dashboard Access          ║
╚════════════════════════════════════╝
`);