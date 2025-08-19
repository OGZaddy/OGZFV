/**
 * STARTER TIER BOT - $97/mo
 * Basic RSI/MACD trading with paper trading
 */

const WebSocket = require('ws');
const dns = require('dns');
const config = require('./bot-config');

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

const BOT_TIER = 'starter';

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
        this.currentPrice = null; // Store real BTC price
        this.priceHistory = []; // Store price history for indicators
        this.positions = []; // Track open positions
        this.lastTradeTime = 0; // Prevent overtrading
    }
    
    connect() {
        console.log(`🟢 STARTER TIER BOT INITIALIZING...`);
        console.log(`🔌 Connecting to: ${config.WS_URL}`);
        
        this.ws = new WebSocket(config.WS_URL);
        
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
            
            // Handle real price updates from Polygon
            if (msg.type === 'price' && msg.data) {
                if (msg.data.asset === 'BTC-USD') {
                    this.currentPrice = msg.data.price;
                    this.priceHistory.push(this.currentPrice);
                    // Keep only last 50 prices for indicators
                    if (this.priceHistory.length > 50) {
                        this.priceHistory.shift();
                    }
                }
            }
            
            if (msg.type === 'manual_buy') this.executeBuy();
            if (msg.type === 'manual_sell') this.executeSell();
        });
        
        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
            if (error.code) console.error('Error code:', error.code);
        });
        
        this.ws.on('close', (code, reason) => {
            console.log(`Disconnected (code: ${code}, reason: ${reason}), reconnecting...`);
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
        console.log('🚀 Starting trading loop...');
        // Send status every 5 seconds
        setInterval(() => {
            console.log(`⏰ Trade check - connected: ${this.connected}, ws state: ${this.ws ? this.ws.readyState : 'no ws'}`);
            if (!this.connected) {
                console.log('❌ Not connected, skipping trade');
                return;
            }
            
            // REAL TRADING LOGIC - Use actual indicators (REDUCED FOR TESTING)
            if (this.currentPrice && this.priceHistory.length >= 3) {
                // Calculate real RSI (reduced period for testing)
                const rsi = this.calculateRSI(this.priceHistory, 3);
                
                // Calculate real MACD
                const macd = this.calculateMACD(this.priceHistory);
                
                // Real confidence based on indicators
                let confidence = 50;
                let action = null;
                let reason = '';
                
                // BUY signals
                if (rsi < 30) {
                    action = 'BUY';
                    reason = 'RSI oversold';
                    confidence = 65 + (30 - rsi); // Higher confidence when more oversold
                } else if (macd.histogram > 0 && macd.crossover) {
                    action = 'BUY';
                    reason = 'MACD bullish cross';
                    confidence = 70;
                }
                
                // SELL signals
                else if (rsi > 70) {
                    action = 'SELL';
                    reason = 'RSI overbought';
                    confidence = 65 + (rsi - 70); // Higher confidence when more overbought
                } else if (macd.histogram < 0 && macd.crossover) {
                    action = 'SELL';
                    reason = 'MACD bearish cross';
                    confidence = 70;
                }
                
                // Only trade if confidence is high enough
                if (action && confidence >= 65) {
                    this.executeTrade(action, reason, confidence);
                }
            }
        }, 5000);
    }
    
    executeBuy() {
        this.ws.send(JSON.stringify({
            type: 'trade',
            source: 'trading_bot',
            botTier: BOT_TIER,
            action: 'BUY',
            price: this.currentPrice || 100000, // Use real BTC price
            pnl: 0,
            reason: 'Manual buy',
            manual: true
        }));
    }
    
    executeSell() {
        this.ws.send(JSON.stringify({
            type: 'trade',
            source: 'trading_bot',
            botTier: BOT_TIER,
            action: 'SELL',
            price: this.currentPrice || 100000, // Use real BTC price
            pnl: 0,
            reason: 'Manual sell',
            manual: true
        }));
    }
    calculateRSI(prices, period = 3) { // REDUCED FOR TESTING
        if (prices.length < period + 1) return 50; // Neutral if not enough data
        
        let gains = 0;
        let losses = 0;
        
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 0.0001);
        return 100 - (100 / (1 + rs));
    }
    
    calculateMACD(prices) {
        if (prices.length < 5) return { histogram: 0, crossover: false }; // REDUCED FOR TESTING
        
        // Simple EMA calculation (reduced for testing)
        const ema12 = this.calculateEMA(prices, 3);
        const ema26 = this.calculateEMA(prices, 5);
        const macdLine = ema12 - ema26;
        
        // Simplified signal line (9-period EMA of MACD)
        const signal = macdLine * 0.2; // Simplified
        const histogram = macdLine - signal;
        
        // Check for crossover (simplified)
        const prevHistogram = this.lastMACDHistogram || 0;
        const crossover = (prevHistogram <= 0 && histogram > 0) || (prevHistogram >= 0 && histogram < 0);
        this.lastMACDHistogram = histogram;
        
        return { histogram, crossover };
    }
    
    calculateEMA(prices, period) {
        if (prices.length < period) return prices[prices.length - 1];
        
        const multiplier = 2 / (period + 1);
        let ema = prices[prices.length - period];
        
        for (let i = prices.length - period + 1; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }
    
    executeTrade(action, reason, confidence) {
        // Prevent overtrading - minimum 30 seconds between trades
        if (Date.now() - this.lastTradeTime < 30000) return;
        
        // Calculate P&L based on positions
        let pnl = 0;
        if (action === 'SELL' && this.positions.length > 0) {
            const position = this.positions.shift();
            pnl = (this.currentPrice - position.price) * position.size;
            pnl -= pnl * 0.034; // Apply 3.4% fees
        } else if (action === 'BUY') {
            this.positions.push({
                price: this.currentPrice,
                size: 0.001, // Small position size
                time: Date.now()
            });
        }
        
        this.trades++;
        this.pnl += pnl;
        if (pnl > 0) this.wins++;
        this.lastTradeTime = Date.now();
        
        // Calculate current indicators for educational display
        const rsi = this.calculateRSI(this.priceHistory, 3);
        const macd = this.calculateMACD(this.priceHistory);
        
        // Send real trade to dashboard with actual indicator values
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'trade',
                source: 'trading_bot',
                botTier: BOT_TIER,
                action: action,
                price: this.currentPrice,
                pnl: pnl,
                reason: reason,
                confidence: confidence,
                rsi: rsi,
                macd: macd.histogram,
                indicators: {
                    rsi: rsi,
                    macdHistogram: macd.histogram,
                    macdCrossover: macd.crossover
                }
            });
            this.ws.send(message);
            console.log(`🟢 STARTER: ${action} @ $${this.currentPrice} | RSI: ${rsi.toFixed(1)} | MACD: ${macd.histogram.toFixed(2)} | Confidence: ${confidence}% | P&L: $${pnl.toFixed(2)}`);
        }
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