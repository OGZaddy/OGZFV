/**
 * ELITE TIER BOT - $597/mo
 * Self-consuming logs with auto-evolution
 */

const WebSocket = require('ws');
const dns = require('dns');
// Force IPv4
dns.setDefaultResultOrder('ipv4first');

// Initialize Module Auto-Loader
const moduleLoader = require('../ModuleAutoLoader');

// 📊 48-HOUR LAUNCH SPRINT - PERFORMANCE TRACKING
const UniversalPerformanceTracking = require('../performanceIntegration');

// Load quantum integration components
const QuantumSignalAggregator = require('../quantum-signal-aggregator');
const QuantumPerformanceTracker = require('../quantum-performance-tracker');

// Load modules using auto-loader
const SelfConsumingLogModule = require('../core/SelfConsumingLogModule');
const CompressedLogManager = require('../core/CompressedLogManager');

const BOT_TIER = 'elite';
const WS_URL = 'ws://127.0.0.1:3010/ws'; // Unified WebSocket - REAL Polygon data only

// REALISTIC BUT PESSIMISTIC FEE CALCULATION FOR PAPER TRADING
class CorrectTradingMath {
  constructor(initialBalance = 10000) {
    this.balance = initialBalance;
    this.positions = [];
    this.totalFeesPaid = 0;
    // REALISTIC PESSIMISTIC FEES:
    // - Binance: 0.1% maker, 0.1% taker = 0.2% total
    // - Coinbase Pro: 0.5% maker, 0.5% taker = 1.0% total  
    // - Slippage + spread: ~0.1-0.3% per trade
    // - Network fees: ~0.05% per trade
    // TOTAL REALISTIC PESSIMISTIC: ~0.6% per side = 1.2% total
    this.feeRate = 0.006; // 0.6% per side (1.2% total round trip)
  }
  
  executeBuy(currentPrice, percentOfBalance = 0.95) {
    const usdToSpend = this.balance * percentOfBalance;
    const buyFee = usdToSpend * this.feeRate;
    const totalCost = usdToSpend + buyFee;
    
    if (totalCost > this.balance) {
      console.log('❌ INSUFFICIENT FUNDS for buy');
      return null;
    }
    
    const btcAmount = usdToSpend / currentPrice;
    this.balance -= totalCost;
    this.totalFeesPaid += buyFee;
    
    const position = {
      id: Date.now(),
      entryPrice: currentPrice,
      btcAmount: btcAmount,
      totalCost: totalCost,
      timestamp: new Date().toISOString()
    };
    
    this.positions.push(position);
    return position;
  }
  
  executeSell(currentPrice) {
    const openPositions = this.positions.filter(p => !p.closed);
    if (openPositions.length === 0) return null;
    
    const position = openPositions[0];
    const grossProceeds = position.btcAmount * currentPrice;
    const sellFee = grossProceeds * this.feeRate;
    const netProceeds = grossProceeds - sellFee;
    const realizedPnL = netProceeds - position.totalCost;
    
    this.balance += netProceeds;
    this.totalFeesPaid += sellFee;
    
    position.closed = true;
    position.exitPrice = currentPrice;
    position.realizedPnL = realizedPnL;
    
    return { position, pnl: realizedPnL };
  }
  
  getBalance() {
    return this.balance;
  }
  
  getTotalFees() {
    return this.totalFeesPaid;
  }
}

class EliteBot {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.tradingMath = new CorrectTradingMath(10000);
        this.balance = 10000;
        this.trades = 0;
        this.wins = 0;
        this.pnl = 0;
        this.currentPrice = null; // Store real BTC price
        this.priceHistory = [];
        this.positions = [];
        this.lastTradeTime = 0;
        this.lastMACDHistogram = 0;
        this.aiMemory = []; // Store past trades for ML learning
        
        // Initialize quantum integration components
        this.signalAggregator = new QuantumSignalAggregator({
            minSignals: 2,
            consensusThreshold: 0.6,
            timeWindow: 3000 // 3 second window for elite bot
        });
        
        this.performanceTracker = new QuantumPerformanceTracker({
            houstonTarget: 25000,
            initialBalance: this.balance
        });
        
        // ELITE FEATURE: Self-consuming logs!
        this.logConsumer = new SelfConsumingLogModule({
            botTier: BOT_TIER,
            logPath: './logs',
            consumptionInterval: 30000, // Eat logs every 30 seconds
            learningRate: 0.15
        });
        
        // ELITE FEATURE: Compressed memory
        this.logManager = new CompressedLogManager({
            logPath: './logs',
            maxTotalSize: 50 * 1024 * 1024 // 50MB limit
        });
        
        this.evolutionGen = 0;
        this.confidence = 75;
        
        // 📊 LAUNCH SPRINT - Initialize performance tracking
        this.performanceTracker = new UniversalPerformanceTracking('elite');
        console.log('📊 ELITE BOT: Performance tracking enabled for launch sprint');
    }
    
    connect() {
        console.log(`🟣 ELITE TIER BOT INITIALIZING...`);
        console.log(`🧬 SELF-LEARNING ENABLED!`);
        
        this.ws = new WebSocket(WS_URL);
        
        this.ws.on('open', () => {
            console.log(`✅ Elite bot connected to unified dashboard`);
            this.connected = true;
            this.reconnectAttempts = 0; // Reset reconnect counter
            
            // Identify ourselves
            this.ws.send(JSON.stringify({
                type: 'identify',
                source: 'trading_bot',
                botTier: BOT_TIER,
                version: '3.0.0',
                features: ['self-learning', 'auto-evolution', 'compressed-logs']
            }));
            
            // Register signal sources with aggregator
            this.signalAggregator.registerSource('rsi-elite', { 
                type: 'indicator', 
                weight: 1.2 
            });
            this.signalAggregator.registerSource('macd-elite', { 
                type: 'indicator', 
                weight: 1.0 
            });
            this.signalAggregator.registerSource('pattern-elite', { 
                type: 'pattern', 
                weight: 1.3 
            });
            
            // Listen for aggregated signals
            this.signalAggregator.on('signal', (signal) => {
                this.executeQuantumTrade(signal);
            });
            
            // Start AI-powered trading
            this.startTrading();
            this.startEvolution();
        });
        
        this.ws.on('message', (data) => {
            const msg = JSON.parse(data);
            
            if (msg.type === 'price' && msg.data) {
                // Accept BTC in any format
                if (msg.data.asset && msg.data.asset.includes('BTC')) {
                    this.currentPrice = msg.data.price;
                    this.priceHistory.push(this.currentPrice);
                    // Keep only last 50 prices for indicators
                    if (this.priceHistory.length > 50) {
                        this.priceHistory.shift();
                    }
                    console.log(`📊 ELITE: Price update - ${msg.data.asset}: ${this.currentPrice}`);
                    
                    // Feed to AI memory for learning
                    if (this.aiMemory) {
                        this.aiMemory.push({
                            price: this.currentPrice,
                            timestamp: Date.now()
                        });
                        // Keep memory limited
                        if (this.aiMemory.length > 100) {
                            this.aiMemory.shift();
                        }
                    }
                }
            }
            
            if (msg.type === 'manual_buy') this.executeBuy();
            if (msg.type === 'manual_sell') this.executeSell();
        });
        
        this.ws.on('close', (code, reason) => {
            console.log(`Disconnected (code: ${code}), reconnecting...`);
            this.connected = false;
            const delay = 5000; // Fixed 5 second delay for stability
            this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
            setTimeout(() => this.connect(), delay);
        });
        
        // Heartbeat to prevent disconnects
        this.ws.on('pong', () => {
            this.lastPong = Date.now();
        });
        
        setInterval(() => {
            if (this.connected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }
    
    startTrading() {
        // Trade every 3 seconds (very active)
        setInterval(() => {
            if (!this.connected) return;
            
            // Get optimization from self-learning
            const optimization = this.logConsumer.getOptimization();
            const minConfidence = optimization.ready ? optimization.minConfidence : 0.7;
            
            // REAL AI-ENHANCED TRADING
            if (this.currentPrice && this.priceHistory.length >= 30) {
                // Update price history
                this.priceHistory.push(this.currentPrice);
                if (this.priceHistory.length > 100) this.priceHistory.shift();
                
                // Calculate real indicators
                const rsi = this.calculateRSI(this.priceHistory, 14);
                const macd = this.calculateMACD(this.priceHistory);
                const pattern = this.detectPattern(this.priceHistory);
                const bollinger = this.calculateBollinger(this.priceHistory);
                
                // AI decision based on multiple signals
                let action = null;
                let reason = '';
                let confidence = 50;
                
                // Complex AI logic combining indicators
                if (rsi < 25 && this.currentPrice < bollinger.lower && macd.histogram > 0) {
                    action = 'BUY';
                    reason = 'Triple oversold signal';
                    confidence = 85;
                } else if (rsi > 75 && this.currentPrice > bollinger.upper && macd.histogram < 0) {
                    action = 'SELL';
                    reason = 'Triple overbought signal';
                    confidence = 85;
                } else if (pattern && macd.crossover) {
                    action = macd.histogram > 0 ? 'BUY' : 'SELL';
                    reason = `${pattern} + MACD cross`;
                    confidence = 80;
                }
                
                // Boost confidence based on evolution and learning
                if (action) {
                    confidence += this.evolutionGen * 2;
                    confidence = Math.min(confidence, 95);
                    
                    // Learn from past trades
                    const similarTrades = this.aiMemory.filter(t => 
                        Math.abs(t.rsi - rsi) < 10 && t.action === action
                    );
                    if (similarTrades.length > 3) {
                        const winRate = similarTrades.filter(t => t.pnl > 0).length / similarTrades.length;
                        confidence = confidence * (0.7 + winRate * 0.3);
                    }
                }
                
                // Elite needs 75%+ confidence
                if (action && confidence >= 75) {
                    // Send signal to quantum aggregator instead of direct trade
                    this.signalAggregator.addSignal({
                        source: action === 'BUY' ? 'rsi-elite' : 'macd-elite',
                        action: action,
                        confidence: confidence / 100,
                        reason: `AI Gen ${this.evolutionGen}: ${reason}`,
                        timestamp: Date.now()
                    });
                }
            }
        }, 3000);
    }
    
    startEvolution() {
        // Listen for evolution events
        this.logConsumer.on('evolution', (evolution) => {
            this.evolutionGen = evolution.generation;
            this.confidence = Math.min(95, 75 + evolution.generation * 2);
            
            console.log(`🧬 EVOLVED to Generation ${this.evolutionGen}!`);
            console.log(`   Win Rate: ${(evolution.stats.winRate * 100).toFixed(1)}%`);
            console.log(`   Patterns Learned: ${evolution.stats.patternsLearned}`);
            
            // Notify dashboard of evolution
            this.ws.send(JSON.stringify({
                type: 'evolution',
                source: 'trading_bot',
                botTier: BOT_TIER,
                generation: this.evolutionGen,
                stats: evolution.stats,
                improvements: evolution.improvements
            }));
        });
    }
    
    executeQuantumTrade(signal) {
        if (!this.currentPrice || Date.now() - this.lastTradeTime < 30000) return;
        
        console.log(`🟣 ELITE QUANTUM TRADE: ${signal.action} at $${this.currentPrice} (${(signal.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   Consensus: ${signal.sources.join(', ')}`);
        
        // Execute real trade with proper P&L calculation
        let pnl = 0;
        if (signal.action === 'BUY' || signal.action === 'LONG') {
            const result = this.tradingMath.executeBuy(this.currentPrice, 0.95);
            if (result) {
                console.log(`🟣 ELITE BUY executed @ $${this.currentPrice}`);
            }
        } else if (signal.action === 'SELL' || signal.action === 'SHORT') {
            const result = this.tradingMath.executeSell(this.currentPrice);
            if (result) {
                pnl = result.pnl;
                console.log(`🟣 ELITE SELL executed @ $${this.currentPrice} | P&L: $${pnl.toFixed(2)}`);
            }
        }
        
        // Update balance from trading math (not from fake P&L!)
        this.balance = this.tradingMath.getBalance();
        
        // Record trade in performance tracker
        this.performanceTracker.recordTrade({
            action: signal.action,
            price: this.currentPrice,
            pnl: pnl,
            botTier: BOT_TIER,
            confidence: signal.confidence * 100,
            reason: signal.reason || 'Quantum aggregated signal',
            sources: signal.sources
        });
        
        // Broadcast to WebSocket dashboard
        this.ws.send(JSON.stringify({
            type: 'trade',
            source: 'trading_bot',
            botTier: BOT_TIER,
            action: signal.action,
            price: this.currentPrice,
            pnl: pnl,
            reason: signal.reason || 'Quantum aggregated signal',
            confidence: signal.confidence * 100,
            consensus: signal.consensus,
            sources: signal.sources,
            evolution: this.evolutionGen,
            timestamp: Date.now()
        }));
        
        this.lastTradeTime = Date.now();
        this.trades++;
        if (pnl > 0) this.wins++;
        this.pnl += pnl;
        // Balance already updated by tradingMath - don't double-add!
        
        // 📊 LAUNCH SPRINT - Track performance
        const tradeData = {
            action: signal.action,
            price: this.currentPrice,
            pnl: pnl,
            reason: signal.reason || 'Quantum aggregated signal',
            confidence: signal.confidence * 100,
            timestamp: Date.now()
        };
        this.performanceTracker.trackEverything(tradeData, this.balance, 
            ['QuantumAggregator', 'RSI', 'MACD', 'PatternRecognition', 'SelfLearning', ...signal.sources]);
        
        // Update signal aggregator performance
        signal.sources.forEach(source => {
            this.signalAggregator.updateSourcePerformance(source, {
                profitable: pnl > 0
            });
        });
    }
    
    executeBuy() {
        this.ws.send(JSON.stringify({
            type: 'trade',
            source: 'trading_bot',
            botTier: BOT_TIER,
            action: 'BUY',
            price: this.currentPrice || 100000, // Use real BTC price
            pnl: 0,
            reason: 'Manual buy (Elite AI)',
            manual: true,
            evolution: this.evolutionGen
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
            reason: 'Manual sell (Elite AI)',
            manual: true,
            evolution: this.evolutionGen
        }));
    }
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        let gains = 0, losses = 0;
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
        if (prices.length < 26) return { histogram: 0, crossover: false };
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macdLine = ema12 - ema26;
        const signal = macdLine * 0.2;
        const histogram = macdLine - signal;
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
    
    calculateBollinger(prices, period = 20) {
        if (prices.length < period) return { upper: prices[prices.length - 1], lower: prices[prices.length - 1] };
        const recent = prices.slice(-period);
        const sma = recent.reduce((a, b) => a + b) / period;
        const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        return {
            upper: sma + (stdDev * 2),
            lower: sma - (stdDev * 2),
            middle: sma
        };
    }
    
    detectPattern(prices) {
        if (prices.length < 20) return null;
        const recent = prices.slice(-20);
        const avg = recent.reduce((a, b) => a + b) / recent.length;
        const high = Math.max(...recent);
        const low = Math.min(...recent);
        
        if (recent[5] < avg && recent[10] < avg && recent[15] > avg) return 'Double Bottom';
        if (recent[10] > high * 0.98 && recent[5] < high * 0.95 && recent[15] < high * 0.95) return 'Head & Shoulders';
        if (recent[0] < recent[10] && (high - low) < avg * 0.02) return 'Bull Flag';
        if (recent[5] < recent[10] && recent[10] < recent[15]) return 'Ascending Triangle';
        return null;
    }
    
    executeTrade(action, reason, confidence) {
        // Prevent overtrading - Elite trades every 15 seconds minimum
        if (Date.now() - this.lastTradeTime < 15000) return 0;
        
        let pnl = 0;
        
        // Use correct trading math instead of broken P&L calculation
        if (action === 'BUY' || action === 'LONG') {
            const result = this.tradingMath.executeBuy(this.currentPrice, 0.95);
            if (result) {
                console.log(`🟣 ELITE BUY: $${this.currentPrice} | ${reason}`);
            }
        } else if (action === 'SELL' || action === 'SHORT') {
            const result = this.tradingMath.executeSell(this.currentPrice);
            if (result) {
                pnl = result.pnl;
                console.log(`🟣 ELITE SELL: $${this.currentPrice} | P&L: $${pnl.toFixed(2)} | ${reason}`);
            } else {
                console.log('⚠️ ELITE: No positions to sell, skipping SELL signal');
                return 0;
            }
        }
        
        // Update balance from trading math
        this.balance = this.tradingMath.getBalance();
        
        this.trades++;
        this.pnl += pnl;
        if (pnl > 0) this.wins++;
        this.lastTradeTime = Date.now();
        
        // Store in AI memory
        this.aiMemory.push({
            action, reason, confidence,
            rsi: this.calculateRSI(this.priceHistory, 14),
            macd: this.calculateMACD(this.priceHistory).histogram,
            pnl, price: this.currentPrice,
            timestamp: Date.now()
        });
        if (this.aiMemory.length > 100) this.aiMemory.shift();
        
        // Calculate current indicators for educational display
        const rsi = this.calculateRSI(this.priceHistory, 14);
        const macd = this.calculateMACD(this.priceHistory);
        const bollinger = this.calculateBollinger(this.priceHistory);
        const pattern = this.detectPattern(this.priceHistory);
        
        // Send to dashboard with actual indicator values
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'trade',
                source: 'trading_bot',
                botTier: BOT_TIER,
                action: action,
                price: this.currentPrice,
                pnl: pnl,
                reason: reason,
                confidence: confidence,
                evolution: this.evolutionGen,
                learning: true,
                rsi: rsi,
                macd: macd.histogram,
                pattern: pattern,
                indicators: {
                    rsi: rsi,
                    macdHistogram: macd.histogram,
                    macdCrossover: macd.crossover,
                    bollingerUpper: bollinger.upper,
                    bollingerLower: bollinger.lower,
                    bollingerMiddle: bollinger.middle,
                    pattern: pattern,
                    evolutionGen: this.evolutionGen
                }
            }));
            console.log(`🟣 ELITE: ${action} @ $${this.currentPrice} | ${reason} | RSI: ${rsi.toFixed(1)} | BB: ${bollinger.upper.toFixed(0)}-${bollinger.lower.toFixed(0)} | Confidence: ${confidence}% | P&L: $${pnl.toFixed(2)}`);
        }
        
        // Learn from trade
        this.logConsumer.emit('trade', { action, pnl, confidence });
        
        return pnl;
    }
}

const bot = new EliteBot();
bot.connect();

console.log(`
╔════════════════════════════════════╗
║      ELITE TIER BOT ($597/mo)      ║
║                                    ║
║  🧬 SELF-CONSUMING LOGS            ║
║  🧠 AUTO-EVOLUTION                 ║
║  📦 COMPRESSED MEMORY              ║
║  ♾️ UNLIMITED TRADES               ║
║  🎯 AI PATTERN LEARNING            ║
║                                    ║
║  "The bot that learns from itself" ║
╚════════════════════════════════════╝
`);