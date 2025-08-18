/**
 * SELF-CONSUMING LOG MODULE
 * 
 * This module allows bots to automatically consume their own logs,
 * learn from patterns, and evolve without human intervention.
 * 
 * The bot literally EATS its own experience and gets SMARTER!
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SelfConsumingLogModule extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            botTier: config.botTier || 'unknown',
            logPath: config.logPath || './logs',
            consumptionInterval: config.consumptionInterval || 60000, // Eat logs every minute
            maxMemorySize: config.maxMemorySize || 10000, // Max patterns to remember
            learningRate: config.learningRate || 0.1,
            evolutionThreshold: config.evolutionThreshold || 0.7,
            ...config
        };
        
        // Pattern memory - the bot's learned experience
        this.patternMemory = new Map();
        this.tradeOutcomes = new Map();
        this.evolutionGeneration = 0;
        this.performance = {
            before: { winRate: 0, avgProfit: 0 },
            after: { winRate: 0, avgProfit: 0 }
        };
        
        // Start self-consumption cycle
        this.startConsumption();
        
        console.log(`🧠 SELF-CONSUMING LOG MODULE INITIALIZED FOR ${this.config.botTier}`);
        console.log(`   The bot will now EAT its own logs and EVOLVE!`);
    }
    
    /**
     * Start the automatic log consumption cycle
     */
    startConsumption() {
        // Initial consumption
        this.consumeLogs();
        
        // Set up automatic consumption interval
        this.consumptionTimer = setInterval(() => {
            this.consumeLogs();
        }, this.config.consumptionInterval);
        
        // Consume logs after every trade
        this.on('trade', (trade) => {
            this.logTrade(trade);
            this.consumeRecentTrade(trade);
        });
    }
    
    /**
     * CONSUME LOGS - The bot EATS its own experience
     */
    async consumeLogs() {
        try {
            console.log(`🍽️ ${this.config.botTier} bot is CONSUMING its logs...`);
            
            // Read all log files
            const logFiles = await this.getLogFiles();
            let totalPatterns = 0;
            let newPatterns = 0;
            
            for (const logFile of logFiles) {
                const logs = await this.readLogFile(logFile);
                
                for (const entry of logs) {
                    if (entry.type === 'trade') {
                        // Extract pattern from trade
                        const pattern = this.extractPattern(entry);
                        
                        // Store pattern with outcome
                        if (pattern) {
                            this.digestPattern(pattern, entry.outcome);
                            totalPatterns++;
                            
                            if (!this.patternMemory.has(pattern.id)) {
                                newPatterns++;
                            }
                        }
                    }
                }
            }
            
            // Evolve based on consumed patterns
            if (totalPatterns > 0) {
                this.evolve();
                console.log(`✨ Digested ${totalPatterns} patterns (${newPatterns} new)`);
                console.log(`🧬 Evolution Generation: ${this.evolutionGeneration}`);
            }
            
            // Clean up old logs after consumption
            await this.archiveConsumedLogs();
            
        } catch (error) {
            console.error('Error consuming logs:', error);
        }
    }
    
    /**
     * Consume a recent trade immediately for fast learning
     */
    async consumeRecentTrade(trade) {
        const pattern = this.extractPattern(trade);
        if (pattern) {
            this.digestPattern(pattern, trade.outcome);
            
            // Quick evolution check
            if (this.shouldEvolve()) {
                this.evolve();
            }
        }
    }
    
    /**
     * Extract learnable pattern from trade
     */
    extractPattern(trade) {
        if (!trade || !trade.data) return null;
        
        return {
            id: `${trade.indicators?.rsi}_${trade.indicators?.macd}_${trade.action}`,
            action: trade.action,
            confidence: trade.confidence || 0,
            indicators: {
                rsi: trade.indicators?.rsi || 0,
                macd: trade.indicators?.macd || 0,
                volume: trade.indicators?.volume || 0,
                trend: trade.indicators?.trend || 'unknown'
            },
            context: {
                timeframe: trade.timeframe || '5m',
                volatility: trade.volatility || 'normal',
                marketCondition: trade.marketCondition || 'unknown'
            },
            timestamp: trade.timestamp || Date.now()
        };
    }
    
    /**
     * DIGEST PATTERN - Store and learn from pattern
     */
    digestPattern(pattern, outcome) {
        const patternKey = pattern.id;
        
        if (!this.patternMemory.has(patternKey)) {
            this.patternMemory.set(patternKey, {
                pattern: pattern,
                occurrences: 0,
                wins: 0,
                losses: 0,
                totalProfit: 0,
                confidence: pattern.confidence,
                evolution: []
            });
        }
        
        const memory = this.patternMemory.get(patternKey);
        memory.occurrences++;
        
        if (outcome > 0) {
            memory.wins++;
            memory.totalProfit += outcome;
        } else {
            memory.losses++;
            memory.totalProfit += outcome;
        }
        
        // Update confidence based on success rate
        memory.confidence = this.calculateConfidence(memory);
        
        // Track evolution
        memory.evolution.push({
            generation: this.evolutionGeneration,
            confidence: memory.confidence,
            winRate: memory.wins / memory.occurrences,
            timestamp: Date.now()
        });
        
        // Limit memory size
        if (this.patternMemory.size > this.config.maxMemorySize) {
            this.pruneWeakPatterns();
        }
    }
    
    /**
     * EVOLVE - The bot evolves based on consumed patterns
     */
    evolve() {
        console.log(`🧬 EVOLUTION TRIGGERED for ${this.config.botTier} bot!`);
        
        this.evolutionGeneration++;
        
        // Calculate current performance
        const currentStats = this.calculatePerformanceStats();
        
        // Find best and worst patterns
        const patterns = Array.from(this.patternMemory.values());
        patterns.sort((a, b) => b.confidence - a.confidence);
        
        const bestPatterns = patterns.slice(0, 10);
        const worstPatterns = patterns.slice(-10);
        
        // Emit evolution insights
        this.emit('evolution', {
            generation: this.evolutionGeneration,
            stats: currentStats,
            bestPatterns: bestPatterns.map(p => ({
                id: p.pattern.id,
                confidence: p.confidence,
                winRate: p.wins / p.occurrences,
                profit: p.totalProfit
            })),
            improvements: this.generateImprovements(bestPatterns, worstPatterns)
        });
        
        // Update performance tracking
        this.performance.before = this.performance.after;
        this.performance.after = currentStats;
        
        // Self-optimize
        this.selfOptimize(bestPatterns);
    }
    
    /**
     * Self-optimize based on best patterns
     */
    selfOptimize(bestPatterns) {
        // Create optimized strategy rules
        const rules = {
            minConfidence: Math.max(...bestPatterns.map(p => p.confidence)) * 0.8,
            preferredIndicators: this.extractCommonIndicators(bestPatterns),
            avoidPatterns: this.getWeakPatternIds(),
            timestamp: Date.now()
        };
        
        // Save optimization rules
        this.saveOptimizationRules(rules);
        
        console.log(`🎯 Self-optimization complete!`);
        console.log(`   New min confidence: ${rules.minConfidence.toFixed(2)}`);
        console.log(`   Preferred indicators: ${rules.preferredIndicators.join(', ')}`);
    }
    
    /**
     * Should the bot evolve?
     */
    shouldEvolve() {
        const recentTrades = Array.from(this.patternMemory.values())
            .filter(p => p.evolution.length > 0)
            .slice(-100);
        
        if (recentTrades.length < 20) return false;
        
        const avgConfidence = recentTrades.reduce((sum, p) => sum + p.confidence, 0) / recentTrades.length;
        
        return avgConfidence > this.config.evolutionThreshold || 
               this.patternMemory.size % 100 === 0;
    }
    
    /**
     * Calculate pattern confidence
     */
    calculateConfidence(memory) {
        const winRate = memory.occurrences > 0 ? memory.wins / memory.occurrences : 0;
        const profitFactor = memory.totalProfit > 0 ? 1 : 0.5;
        const occurrenceFactor = Math.min(memory.occurrences / 10, 1); // More occurrences = more confidence
        
        return (winRate * 0.6 + profitFactor * 0.3 + occurrenceFactor * 0.1);
    }
    
    /**
     * Calculate performance statistics
     */
    calculatePerformanceStats() {
        const patterns = Array.from(this.patternMemory.values());
        
        const totalTrades = patterns.reduce((sum, p) => sum + p.occurrences, 0);
        const totalWins = patterns.reduce((sum, p) => sum + p.wins, 0);
        const totalProfit = patterns.reduce((sum, p) => sum + p.totalProfit, 0);
        
        return {
            winRate: totalTrades > 0 ? totalWins / totalTrades : 0,
            avgProfit: totalTrades > 0 ? totalProfit / totalTrades : 0,
            totalProfit: totalProfit,
            patternsLearned: patterns.length,
            generation: this.evolutionGeneration
        };
    }
    
    /**
     * Prune weak patterns from memory
     */
    pruneWeakPatterns() {
        const patterns = Array.from(this.patternMemory.entries());
        patterns.sort((a, b) => a[1].confidence - b[1].confidence);
        
        // Remove bottom 10%
        const pruneCount = Math.floor(patterns.length * 0.1);
        for (let i = 0; i < pruneCount; i++) {
            this.patternMemory.delete(patterns[i][0]);
        }
        
        console.log(`🧹 Pruned ${pruneCount} weak patterns from memory`);
    }
    
    /**
     * Generate improvement suggestions
     */
    generateImprovements(bestPatterns, worstPatterns) {
        const improvements = [];
        
        // Analyze best patterns
        const bestIndicators = this.extractCommonIndicators(bestPatterns);
        const worstIndicators = this.extractCommonIndicators(worstPatterns);
        
        if (bestIndicators.length > 0) {
            improvements.push(`Focus on ${bestIndicators.join(', ')} indicators`);
        }
        
        if (worstIndicators.length > 0) {
            improvements.push(`Avoid relying on ${worstIndicators.join(', ')}`);
        }
        
        // Confidence improvements
        const avgBestConfidence = bestPatterns.reduce((sum, p) => sum + p.confidence, 0) / bestPatterns.length;
        if (avgBestConfidence > 0.8) {
            improvements.push(`Increase minimum confidence to ${(avgBestConfidence * 0.9).toFixed(2)}`);
        }
        
        return improvements;
    }
    
    /**
     * Extract common indicators from patterns
     */
    extractCommonIndicators(patterns) {
        const indicatorCounts = {};
        
        patterns.forEach(p => {
            Object.keys(p.pattern.indicators).forEach(indicator => {
                indicatorCounts[indicator] = (indicatorCounts[indicator] || 0) + 1;
            });
        });
        
        return Object.entries(indicatorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([indicator]) => indicator);
    }
    
    /**
     * Get weak pattern IDs to avoid
     */
    getWeakPatternIds() {
        return Array.from(this.patternMemory.entries())
            .filter(([_, memory]) => memory.confidence < 0.3)
            .map(([id]) => id);
    }
    
    /**
     * Save optimization rules
     */
    async saveOptimizationRules(rules) {
        const rulesPath = path.join(this.config.logPath, `${this.config.botTier}_optimization_rules.json`);
        await fs.writeFile(rulesPath, JSON.stringify(rules, null, 2));
    }
    
    /**
     * Log a trade
     */
    async logTrade(trade) {
        const logEntry = {
            timestamp: Date.now(),
            type: 'trade',
            ...trade
        };
        
        const logPath = path.join(this.config.logPath, `${this.config.botTier}_trades_${new Date().toISOString().split('T')[0]}.json`);
        
        try {
            let logs = [];
            try {
                const existing = await fs.readFile(logPath, 'utf8');
                logs = JSON.parse(existing);
            } catch (e) {
                // File doesn't exist yet
            }
            
            logs.push(logEntry);
            await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Error logging trade:', error);
        }
    }
    
    /**
     * Get log files
     */
    async getLogFiles() {
        try {
            const files = await fs.readdir(this.config.logPath);
            return files
                .filter(f => f.includes(this.config.botTier) && f.endsWith('.json'))
                .map(f => path.join(this.config.logPath, f));
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Read log file
     */
    async readLogFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Archive consumed logs
     */
    async archiveConsumedLogs() {
        // Move old logs to archive after consumption
        const archivePath = path.join(this.config.logPath, 'archive');
        
        try {
            await fs.mkdir(archivePath, { recursive: true });
            
            const files = await this.getLogFiles();
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            
            for (const file of files) {
                const stats = await fs.stat(file);
                if (stats.mtimeMs < oneDayAgo) {
                    const basename = path.basename(file);
                    await fs.rename(file, path.join(archivePath, basename));
                }
            }
        } catch (error) {
            console.error('Error archiving logs:', error);
        }
    }
    
    /**
     * Get current optimization for trading decisions
     */
    getOptimization() {
        const stats = this.calculatePerformanceStats();
        const bestPatterns = Array.from(this.patternMemory.values())
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
        
        return {
            generation: this.evolutionGeneration,
            minConfidence: Math.max(...bestPatterns.map(p => p.confidence)) * 0.8,
            preferredPatterns: bestPatterns.map(p => p.pattern.id),
            stats: stats,
            ready: this.patternMemory.size > 10
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.consumptionTimer) {
            clearInterval(this.consumptionTimer);
        }
    }
}

module.exports = SelfConsumingLogModule;