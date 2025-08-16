/**
 * OGZPrime Master Integration Module
 * Where GAN meets GANN in JavaScript
 * Plug this directly into your existing bot infrastructure
 */

const { TimeGANMarketPredictor, MarketDataAugmenter } = require('./ogz_timegan_js');
const { GANNMasterStrategy } = require('./ogz_gann_js');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class OGZPrimeMasterBot extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxPositionSize: 0.1,
            maxDailyLoss: 0.02,
            confidenceThreshold: 0.7,
            useGAN: true,
            useGANN: true,
            paperTrading: true,
            riskPerTrade: 0.02,
            ...config
        };
        
        // Initialize subsystems
        this.timeGAN = null;
        this.gannMaster = null;
        this.dataAugmenter = null;
        
        // Trading state
        this.positions = new Map();
        this.tradeHistory = [];
        this.performanceMetrics = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            maxDrawdown: 0,
            sharpeRatio: 0
        };
        
        // Risk management
        this.currentDailyPnL = 0;
        this.dailyTradeCount = 0;
        this.maxDailyTrades = config.maxDailyTrades || 10;
        
        // Signal cache for performance
        this.signalCache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
        
        console.log('OGZPrime Master Bot initialized - Ready to dominate');
    }
    
    /**
     * Initialize all subsystems
     */
    async initialize(historicalData = null) {
        try {
            // Initialize GANN system
            if (this.config.useGANN) {
                this.gannMaster = new GANNMasterStrategy();
                console.log('✔ GANN system initialized');
            }
            
            // Initialize GAN system
            if (this.config.useGAN && historicalData) {
                this.timeGAN = new TimeGANMarketPredictor({
                    seqLength: this.config.ganSeqLength || 24,
                    nFeatures: this.config.ganFeatures || 5
                });
                
                this.dataAugmenter = new MarketDataAugmenter(this.timeGAN);
                
                // Optionally train on historical data
                if (this.config.trainGAN) {
                    console.log('Training TimeGAN on historical data...');
                    await this.timeGAN.train(historicalData, this.config.ganEpochs || 500);
                }
                
                console.log('✔ GAN system initialized');
            }
            
            this.emit('initialized', { gan: this.config.useGAN, gann: this.config.useGANN });
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.emit('error', error);
        }
    }
    
    /**
     * Extract features from market data for GAN input
     */
    extractMarketFeatures(marketData) {
        const features = [];
        const data = Array.isArray(marketData) ? marketData : marketData.data;
        
        if (data.length < 50) {
            console.warn('Insufficient data for feature extraction');
            return null;
        }
        
        const latest = data[data.length - 1];
        const prices = data.map(d => d.close || d);
        const volumes = data.map(d => d.volume || 0);
        
        // Price features
        features.push(latest.close);
        features.push(latest.volume || 0);
        
        // Returns
        const returns = this.calculateReturns(prices);
        features.push(returns[returns.length - 1]);
        
        // Volatility (20-period)
        const volatility = this.calculateVolatility(returns.slice(-20));
        features.push(volatility);
        
        // Moving averages
        features.push(this.sma(prices, 20));
        features.push(this.sma(prices, 50));
        features.push(this.sma(prices, 200));
        
        // RSI
        features.push(this.calculateRSI(prices, 14));
        
        // MACD
        const macd = this.calculateMACD(prices);
        features.push(macd.macd);
        features.push(macd.signal);
        features.push(macd.histogram);
        
        // Bollinger Bands position
        const bb = this.calculateBollingerBands(prices, 20);
        features.push((latest.close - bb.lower) / (bb.upper - bb.lower));
        
        // Volume features
        features.push(this.sma(volumes, 20));
        features.push(volumes[volumes.length - 1] / this.sma(volumes, 20));
        
        // Market microstructure
        features.push(latest.high - latest.low); // Range
        features.push((latest.close - latest.low) / (latest.high - latest.low)); // Close position in range
        
        // Pad or trim to required size
        while (features.length < 20) features.push(0);
        
        return features.slice(0, 20);
    }
    
    /**
     * Generate GAN-based signals
     */
    async generateGANSignals(marketData) {
        if (!this.config.useGAN || !this.timeGAN) {
            return null;
        }
        
        // Check cache
        const cacheKey = `gan_${marketData[marketData.length - 1].timestamp}`;
        if (this.signalCache.has(cacheKey)) {
            return this.signalCache.get(cacheKey);
        }
        
        try {
            const features = this.extractMarketFeatures(marketData);
            if (!features) return null;
            
            // Prepare sequence data
            const sequenceData = marketData.slice(-this.timeGAN.config.seqLength)
                .map(d => [d.open, d.high, d.low, d.close, d.volume]);
            
            // Generate future scenarios
            const scenarios = await this.timeGAN.generateFutureScenarios(sequenceData, 100);
            
            // Analyze scenarios
            const predictions = scenarios.map(s => s[s.length - 1][3]); // Last close price
            const meanPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
            const stdPrediction = Math.sqrt(
                predictions.reduce((sum, p) => sum + Math.pow(p - meanPrediction, 2), 0) / predictions.length
            );
            
            // Predict market regime
            const regime = await this.timeGAN.predictMarketRegime(sequenceData);
            
            const currentPrice = marketData[marketData.length - 1].close;
            const signal = {
                meanPrediction,
                stdPrediction,
                regime,
                confidence: 1 - (stdPrediction / meanPrediction),
                direction: meanPrediction > currentPrice * 1.001 ? 'BUY' : 
                          meanPrediction < currentPrice * 0.999 ? 'SELL' : 'HOLD',
                scenarios: {
                    bullish: predictions.filter(p => p > currentPrice * 1.01).length / 100,
                    bearish: predictions.filter(p => p < currentPrice * 0.99).length / 100,
                    neutral: predictions.filter(p => p >= currentPrice * 0.99 && p <= currentPrice * 1.01).length / 100
                }
            };
            
            // Cache result
            this.signalCache.set(cacheKey, signal);
            setTimeout(() => this.signalCache.delete(cacheKey), this.cacheTimeout);
            
            return signal;
            
        } catch (error) {
            console.error('GAN signal generation error:', error);
            return null;
        }
    }
    
    /**
     * Generate GANN-based signals
     */
    generateGANNSignals(marketData) {
        if (!this.config.useGANN || !this.gannMaster) {
            return null;
        }
        
        // Check cache
        const cacheKey = `gann_${marketData[marketData.length - 1].timestamp}`;
        if (this.signalCache.has(cacheKey)) {
            return this.signalCache.get(cacheKey);
        }
        
        try {
            const currentPrice = marketData[marketData.length - 1].close;
            const analysis = this.gannMaster.analyzeMarket(marketData, currentPrice);
            
            // Cache result
            this.signalCache.set(cacheKey, analysis);
            setTimeout(() => this.signalCache.delete(cacheKey), this.cacheTimeout);
            
            return analysis;
            
        } catch (error) {
            console.error('GANN signal generation error:', error);
            return null;
        }
    }
    
    /**
     * Combine GAN and GANN signals
     */
    async combineSignals(marketData) {
        const [ganSignals, gannSignals] = await Promise.all([
            this.generateGANSignals(marketData),
            this.generateGANNSignals(marketData)
        ]);
        
        const finalSignal = {
            action: 'HOLD',
            confidence: 0,
            entry: null,
            targets: [],
            stop: null,
            size: 0,
            reasoning: [],
            metadata: {
                gan: ganSignals,
                gann: gannSignals
            }
        };
        
        const signals = [];
        const confidences = [];
        
        // Process GAN signals
        if (ganSignals) {
            if (ganSignals.direction !== 'HOLD') {
                signals.push(ganSignals.direction);
                confidences.push(ganSignals.confidence);
                
                finalSignal.reasoning.push(
                    `TimeGAN predicts ${ganSignals.direction} in ${ganSignals.regime} regime ` +
                    `(${(ganSignals.confidence * 100).toFixed(1)}% confidence)`
                );
                
                // Add scenario breakdown
                if (ganSignals.scenarios.bullish > 0.6) {
                    finalSignal.reasoning.push(
                        `${(ganSignals.scenarios.bullish * 100).toFixed(0)}% of scenarios are bullish`
                    );
                }
            }
        }
        
        // Process GANN signals
        if (gannSignals && gannSignals.signal) {
            const gannSig = gannSignals.signal;
            
            if (gannSig.action !== 'HOLD') {
                signals.push(gannSig.action);
                confidences.push(gannSig.confidence);
                
                if (!finalSignal.entry) {
                    finalSignal.entry = gannSig.entry;
                    finalSignal.targets = gannSig.targets;
                    finalSignal.stop = gannSig.stop;
                }
                
                gannSig.reasoning.forEach(reason => finalSignal.reasoning.push(reason));
            }
            
            // Add market health assessment
            if (gannSignals.marketHealth > 70) {
                finalSignal.reasoning.push(
                    `Market health: ${gannSignals.marketHealth}/100 - Strong conditions`
                );
            }
        }
        
        // Combine signals
        if (signals.length > 0) {
            // Count signal consensus
            const buyCount = signals.filter(s => s === 'BUY').length;
            const sellCount = signals.filter(s => s === 'SELL').length;
            
            if (buyCount > sellCount) {
                finalSignal.action = 'BUY';
            } else if (sellCount > buyCount) {
                finalSignal.action = 'SELL';
            }
            
            // Average confidence
            finalSignal.confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
            
            // Position sizing based on confidence and Kelly Criterion
            if (finalSignal.confidence >= this.config.confidenceThreshold) {
                finalSignal.size = this.calculatePositionSize(finalSignal);
            }
        }
        
        this.emit('signal', finalSignal);
        return finalSignal;
    }
    
    /**
     * Calculate position size using Kelly Criterion
     */
    calculatePositionSize(signal) {
        if (!signal.entry || !signal.stop || !signal.targets || signal.targets.length === 0) {
            return 0;
        }
        
        const winProb = signal.confidence;
        const lossProb = 1 - winProb;
        
        const avgWin = Math.abs(signal.targets[0] - signal.entry) / signal.entry;
        const avgLoss = Math.abs(signal.entry - signal.stop) / signal.entry;
        
        // Kelly formula
        const kelly = (winProb * avgWin - lossProb * avgLoss) / avgWin;
        
        // Apply safety factor (25% of Kelly)
        const safeKelly = kelly * 0.25;
        
        // Cap at maximum position size
        const positionSize = Math.min(
            Math.max(safeKelly, 0),
            this.config.maxPositionSize
        );
        
        return parseFloat(positionSize.toFixed(4));
    }
    
    /**
     * Execute trade based on signal
     */
    async executeTrade(signal, marketData) {
        // Check if we should trade
        if (signal.action === 'HOLD' || signal.confidence < this.config.confidenceThreshold) {
            return { status: 'NO_ACTION', reason: 'Signal conditions not met' };
        }
        
        // Risk checks
        if (this.currentDailyPnL <= -this.config.maxDailyLoss) {
            return { status: 'REJECTED', reason: 'Daily loss limit reached' };
        }
        
        if (this.dailyTradeCount >= this.maxDailyTrades) {
            return { status: 'REJECTED', reason: 'Daily trade limit reached' };
        }
        
        const trade = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: signal.action,
            entry: signal.entry || marketData[marketData.length - 1].close,
            size: signal.size,
            targets: signal.targets,
            stop: signal.stop,
            confidence: signal.confidence,
            reasoning: signal.reasoning,
            status: 'PENDING'
        };
        
        // Paper trading execution
        if (this.config.paperTrading) {
            trade.status = 'EXECUTED';
            this.tradeHistory.push(trade);
            this.dailyTradeCount++;
            
            // Update positions
            const symbol = marketData.symbol || 'UNKNOWN';
            if (!this.positions.has(symbol)) {
                this.positions.set(symbol, {
                    size: 0,
                    avgPrice: 0,
                    unrealizedPnL: 0
                });
            }
            
            const position = this.positions.get(symbol);
            
            if (signal.action === 'BUY') {
                const newSize = position.size + trade.size;
                position.avgPrice = ((position.avgPrice * position.size) + (trade.entry * trade.size)) / newSize;
                position.size = newSize;
            } else if (signal.action === 'SELL') {
                position.size -= trade.size;
                
                // Calculate realized P&L
                const pnl = (trade.entry - position.avgPrice) * trade.size;
                this.currentDailyPnL += pnl;
                this.performanceMetrics.totalPnL += pnl;
                
                if (pnl > 0) {
                    this.performanceMetrics.winningTrades++;
                } else {
                    this.performanceMetrics.losingTrades++;
                }
            }
            
            this.performanceMetrics.totalTrades++;
            
            console.log(`Trade executed: ${trade.action} ${trade.size} @ ${trade.entry}`);
            this.emit('trade', trade);
        }
        
        return trade;
    }
    
    /**
     * Run live trading loop
     */
    async runLive(dataFeed) {
        console.log('Starting live trading...');
        this.emit('start');
        
        // Reset daily counters at midnight
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                this.currentDailyPnL = 0;
                this.dailyTradeCount = 0;
                console.log('Daily counters reset');
            }
        }, 60000); // Check every minute
        
        // Main trading loop
        dataFeed.on('data', async (marketData) => {
            try {
                // Generate combined signal
                const signal = await this.combineSignals(marketData);
                
                // Execute if conditions are met
                if (signal.confidence >= this.config.confidenceThreshold) {
                    await this.executeTrade(signal, marketData);
                }
                
                // Emit status update
                this.emit('update', {
                    positions: Array.from(this.positions.entries()),
                    dailyPnL: this.currentDailyPnL,
                    metrics: this.performanceMetrics
                });
                
            } catch (error) {
                console.error('Trading loop error:', error);
                this.emit('error', error);
            }
        });
    }
    
    // Technical indicator calculations
    sma(data, period) {
        if (data.length < period) return null;
        const slice = data.slice(-period);
        return slice.reduce((a, b) => a + b, 0) / period;
    }
    
    calculateReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        return returns;
    }
    
    calculateVolatility(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);
    }
    
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }
        
        const gains = changes.map(c => c > 0 ? c : 0);
        const losses = changes.map(c => c < 0 ? -c : 0);
        
        const avgGain = this.sma(gains, period);
        const avgLoss = this.sma(losses, period);
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
        if (prices.length < slow) {
            return { macd: 0, signal: 0, histogram: 0 };
        }
        
        const emaFast = this.ema(prices, fast);
        const emaSlow = this.ema(prices, slow);
        const macdLine = emaFast - emaSlow;
        
        const macdValues = [];
        for (let i = slow; i < prices.length; i++) {
            const f = this.ema(prices.slice(0, i + 1), fast);
            const s = this.ema(prices.slice(0, i + 1), slow);
            macdValues.push(f - s);
        }
        
        const signalLine = this.ema(macdValues, signal);
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: macdLine - signalLine
        };
    }
    
    ema(data, period) {
        if (data.length < period) return this.sma(data, data.length);
        
        const multiplier = 2 / (period + 1);
        let ema = this.sma(data.slice(0, period), period);
        
        for (let i = period; i < data.length; i++) {
            ema = (data[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }
    
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.sma(prices, period);
        const slice = prices.slice(-period);
        const variance = slice.reduce((sum, price) => {
            return sum + Math.pow(price - sma, 2);
        }, 0) / period;
        const std = Math.sqrt(variance);
        
        return {
            upper: sma + (std * stdDev),
            middle: sma,
            lower: sma - (std * stdDev)
        };
    }
    
    /**
     * Save bot state
     */
    async saveState(filepath) {
        const state = {
            config: this.config,
            positions: Array.from(this.positions.entries()),
            tradeHistory: this.tradeHistory,
            performanceMetrics: this.performanceMetrics,
            timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(filepath, JSON.stringify(state, null, 2));
        console.log(`State saved to ${filepath}`);
    }
    
    /**
     * Load bot state
     */
    async loadState(filepath) {
        try {
            const data = await fs.readFile(filepath, 'utf8');
            const state = JSON.parse(data);
            
            this.config = { ...this.config, ...state.config };
            this.positions = new Map(state.positions);
            this.tradeHistory = state.tradeHistory;
            this.performanceMetrics = state.performanceMetrics;
            
            console.log(`State loaded from ${filepath}`);
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }
}

/**
 * Quick launch function
 */
async function launchOGZPrime(config = {}) {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                  OGZPrime Trading Bot                 ║
    ║          Where GAN meets GANN in JavaScript          ║
    ║                    Houston, we're coming.            ║
    ╚═══════════════════════════════════════════════════════╝
    `);
    
    const bot = new OGZPrimeMasterBot(config);
    
    // Set up event listeners
    bot.on('signal', (signal) => {
        console.log('Signal generated:', signal.action, signal.confidence.toFixed(2));
    });
    
    bot.on('trade', (trade) => {
        console.log('Trade executed:', trade);
    });
    
    bot.on('error', (error) => {
        console.error('Bot error:', error);
    });
    
    return bot;
}

module.exports = { OGZPrimeMasterBot, launchOGZPrime };