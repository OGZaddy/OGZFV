/**
 * OGZPrime GANN Geometric Trading Module - JavaScript
 * W.D. Gann's mathematical principles for the modern trader
 * Time and price unified through geometry
 */

class GANNSquareOf9Calculator {
    constructor() {
        // GANN angle increments (in degrees -> radians)
        this.angleIncrements = {
            '45': 0.125,    // 45 degrees
            '90': 0.25,     // 90 degrees  
            '120': 0.333,   // 120 degrees
            '135': 0.375,   // 135 degrees
            '180': 0.5,     // 180 degrees
            '225': 0.625,   // 225 degrees
            '270': 0.75,    // 270 degrees
            '315': 0.875,   // 315 degrees
            '360': 1.0      // 360 degrees
        };
    }
    
    /**
     * Calculate GANN Square of 9 levels
     */
    calculateLevels(basePrice, direction = 'both') {
        const sqrtBase = Math.sqrt(basePrice);
        const levels = { support: [], resistance: [] };
        
        Object.entries(this.angleIncrements).forEach(([angle, increment]) => {
            // Calculate resistance levels (above price)
            if (direction === 'up' || direction === 'both') {
                for (let i = 1; i <= 4; i++) {
                    const newSqrt = sqrtBase + (increment * i);
                    const resistance = Math.pow(newSqrt, 2);
                    
                    levels.resistance.push({
                        price: resistance,
                        angle: angle,
                        strength: this.calculateStrength(i),
                        distance: ((resistance - basePrice) / basePrice * 100).toFixed(2) + '%'
                    });
                }
            }
            
            // Calculate support levels (below price)
            if (direction === 'down' || direction === 'both') {
                for (let i = 1; i <= 4; i++) {
                    const newSqrt = sqrtBase - (increment * i);
                    if (newSqrt > 0) {
                        const support = Math.pow(newSqrt, 2);
                        
                        levels.support.push({
                            price: support,
                            angle: angle,
                            strength: this.calculateStrength(i),
                            distance: ((basePrice - support) / basePrice * 100).toFixed(2) + '%'
                        });
                    }
                }
            }
        });
        
        // Sort levels
        levels.resistance.sort((a, b) => a.price - b.price);
        levels.support.sort((a, b) => b.price - a.price);
        
        return levels;
    }
    
    calculateStrength(level) {
        if (level === 1) return 'STRONG';
        if (level === 2) return 'MODERATE';
        return 'WEAK';
    }
    
    /**
     * Calculate time targets based on Square of 9
     */
    calculateTimeTargets(startDate, basePrice) {
        const sqrtBase = Math.sqrt(basePrice);
        const timeTargets = [];
        
        Object.entries(this.angleIncrements).forEach(([angle, increment]) => {
            const days = Math.floor(sqrtBase + increment * 360);
            const targetDate = new Date(startDate);
            targetDate.setDate(targetDate.getDate() + days);
            
            timeTargets.push({
                date: targetDate.toISOString(),
                angle: angle,
                daysFromStart: days,
                cycleType: this.getCycleType(parseInt(angle))
            });
        });
        
        return timeTargets.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    getCycleType(angle) {
        if ([90, 180, 270, 360].includes(angle)) return 'MAJOR';
        if ([45, 135, 225, 315].includes(angle)) return 'INTERMEDIATE';
        return 'MINOR';
    }
    
    /**
     * Generate complete trading levels with entries, targets, and stops
     */
    generateTradingLevels(currentPrice, volatility = 0.02) {
        const levels = this.calculateLevels(currentPrice);
        
        // Find nearest support and resistance
        const nearestSupport = levels.support.find(s => s.price < currentPrice);
        const nearestResistance = levels.resistance.find(r => r.price > currentPrice);
        
        // Calculate Fibonacci-adjusted targets
        const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.618];
        
        return {
            currentPrice,
            buySetup: {
                entry: nearestSupport ? nearestSupport.price : currentPrice * 0.98,
                targets: fibLevels.slice(0, 3).map(fib => 
                    currentPrice + (nearestResistance ? 
                        (nearestResistance.price - currentPrice) * fib : 
                        currentPrice * volatility * fib)
                ),
                stop: nearestSupport ? nearestSupport.price * 0.99 : currentPrice * 0.97,
                riskReward: this.calculateRiskReward(
                    nearestSupport ? nearestSupport.price : currentPrice * 0.98,
                    currentPrice * 1.02,
                    nearestSupport ? nearestSupport.price * 0.99 : currentPrice * 0.97
                )
            },
            sellSetup: {
                entry: nearestResistance ? nearestResistance.price : currentPrice * 1.02,
                targets: fibLevels.slice(0, 3).map(fib =>
                    currentPrice - (nearestSupport ?
                        (currentPrice - nearestSupport.price) * fib :
                        currentPrice * volatility * fib)
                ),
                stop: nearestResistance ? nearestResistance.price * 1.01 : currentPrice * 1.03,
                riskReward: this.calculateRiskReward(
                    nearestResistance ? nearestResistance.price : currentPrice * 1.02,
                    currentPrice * 0.98,
                    nearestResistance ? nearestResistance.price * 1.01 : currentPrice * 1.03
                )
            },
            keyLevels: {
                immediateSupport: nearestSupport,
                immediateResistance: nearestResistance,
                majorSupports: levels.support.filter(s => s.strength === 'STRONG').slice(0, 3),
                majorResistances: levels.resistance.filter(r => r.strength === 'STRONG').slice(0, 3)
            }
        };
    }
    
    calculateRiskReward(entry, target, stop) {
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        return (reward / risk).toFixed(2);
    }
}

class GANNAngleAnalyzer {
    constructor() {
        // GANN angles (price/time ratios)
        this.gannAngles = {
            '1x8': { degrees: 82.5, ratio: 0.125 },
            '1x4': { degrees: 75.0, ratio: 0.25 },
            '1x3': { degrees: 71.25, ratio: 0.333 },
            '1x2': { degrees: 63.75, ratio: 0.5 },
            '2x3': { degrees: 56.25, ratio: 0.667 },
            '1x1': { degrees: 45.0, ratio: 1.0 },  // Most important
            '3x2': { degrees: 33.75, ratio: 1.5 },
            '2x1': { degrees: 26.25, ratio: 2.0 },
            '3x1': { degrees: 18.75, ratio: 3.0 },
            '4x1': { degrees: 15.0, ratio: 4.0 },
            '8x1': { degrees: 7.5, ratio: 8.0 }
        };
    }
    
    /**
     * Calculate GANN angle from price and time
     */
    calculateAngle(priceChange, timeUnits) {
        if (timeUnits === 0) return 90.0;
        
        const ratio = priceChange / timeUnits;
        const angleRadians = Math.atan(ratio);
        const angleDegrees = angleRadians * (180 / Math.PI);
        
        return angleDegrees;
    }
    
    /**
     * Identify trend using GANN angles
     */
    identifyTrendAngle(prices, timestamps) {
        if (prices.length < 2) {
            return { trend: 'UNDEFINED', angle: 0, strength: 'NONE' };
        }
        
        // Calculate price and time change
        const priceChange = prices[prices.length - 1] - prices[0];
        const timeUnits = prices.length;
        
        // Calculate angle
        const angle = this.calculateAngle(priceChange, timeUnits);
        
        // Determine trend and strength
        const trendInfo = this.classifyTrend(angle);
        const nearestGann = this.findNearestGannAngle(Math.abs(angle));
        
        return {
            trend: trendInfo.trend,
            angle: angle,
            strength: trendInfo.strength,
            nearestGannAngle: nearestGann,
            priceChange: priceChange,
            timeUnits: timeUnits,
            momentum: this.calculateMomentum(prices)
        };
    }
    
    classifyTrend(angle) {
        const absAngle = Math.abs(angle);
        
        let trend = 'SIDEWAYS';
        if (angle > 0) trend = 'UPTREND';
        else if (angle < 0) trend = 'DOWNTREND';
        
        let strength = 'VERY_WEAK';
        if (absAngle >= 75) strength = 'VERY_STRONG';
        else if (absAngle >= 45) strength = 'STRONG';
        else if (absAngle >= 26.25) strength = 'MODERATE';
        else if (absAngle >= 7.5) strength = 'WEAK';
        
        return { trend, strength };
    }
    
    findNearestGannAngle(angle) {
        let minDiff = Infinity;
        let nearest = null;
        
        Object.entries(this.gannAngles).forEach(([name, info]) => {
            const diff = Math.abs(angle - info.degrees);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = { name, ...info, difference: diff };
            }
        });
        
        return nearest;
    }
    
    calculateMomentum(prices) {
        if (prices.length < 2) return 0;
        
        const recentChange = prices[prices.length - 1] - prices[prices.length - 2];
        const avgChange = (prices[prices.length - 1] - prices[0]) / prices.length;
        
        return recentChange / avgChange;
    }
    
    /**
     * Project future price targets using GANN angles
     */
    projectPriceTargets(currentPrice, currentTime, angleName = '1x1', periods = 10) {
        const angleInfo = this.gannAngles[angleName] || this.gannAngles['1x1'];
        const projections = [];
        
        for (let period = 1; period <= periods; period++) {
            // Calculate price change based on angle ratio
            const priceChangePercent = angleInfo.ratio * period * 0.01;
            
            // Upward and downward projections
            const upTarget = currentPrice * (1 + priceChangePercent);
            const downTarget = currentPrice * (1 - priceChangePercent);
            
            // Time projection
            const projectedTime = new Date(currentTime);
            projectedTime.setDate(projectedTime.getDate() + period);
            
            projections.push({
                period,
                date: projectedTime.toISOString(),
                upTarget: parseFloat(upTarget.toFixed(2)),
                downTarget: parseFloat(downTarget.toFixed(2)),
                angle: angleName,
                confidence: this.calculateConfidence(period),
                pivotPoint: (upTarget + downTarget) / 2
            });
        }
        
        return projections;
    }
    
    calculateConfidence(period) {
        const baseConfidence = 0.95;
        const decayRate = 0.05;
        return Math.max(baseConfidence - (decayRate * period), 0.5);
    }
}

class GANNTimeCycleAnalyzer {
    constructor() {
        // GANN important numbers
        this.gannNumbers = [
            7, 9, 12, 18, 21, 28, 30, 36, 42, 45, 49, 52, 56, 60,
            72, 84, 90, 108, 120, 144, 180, 216, 240, 270, 360
        ];
        
        // Natural cycles
        this.naturalCycles = {
            daily: 1,
            weekly: 7,
            lunar: 28,
            monthly: 30,
            seasonal: 90,
            semiAnnual: 180,
            annual: 365
        };
    }
    
    /**
     * Identify market cycles in price data
     */
    identifyCycles(priceData, minCycleLength = 5) {
        const cycles = [];
        const prices = priceData.map(d => d.close || d);
        
        // Find peaks and troughs
        const peaks = this.findPeaks(prices);
        const troughs = this.findTroughs(prices);
        
        // Calculate cycle lengths between peaks
        for (let i = 1; i < peaks.length; i++) {
            const cycleLength = peaks[i] - peaks[i - 1];
            if (cycleLength >= minCycleLength) {
                const gannCheck = this.isNearGannNumber(cycleLength);
                
                cycles.push({
                    type: 'peak_to_peak',
                    length: cycleLength,
                    startIdx: peaks[i - 1],
                    endIdx: peaks[i],
                    isGannCycle: gannCheck.isGann,
                    nearestGann: gannCheck.nearest,
                    strength: this.calculateCycleStrength(prices, peaks[i - 1], peaks[i])
                });
            }
        }
        
        // Calculate cycle lengths between troughs
        for (let i = 1; i < troughs.length; i++) {
            const cycleLength = troughs[i] - troughs[i - 1];
            if (cycleLength >= minCycleLength) {
                const gannCheck = this.isNearGannNumber(cycleLength);
                
                cycles.push({
                    type: 'trough_to_trough',
                    length: cycleLength,
                    startIdx: troughs[i - 1],
                    endIdx: troughs[i],
                    isGannCycle: gannCheck.isGann,
                    nearestGann: gannCheck.nearest,
                    strength: this.calculateCycleStrength(prices, troughs[i - 1], troughs[i])
                });
            }
        }
        
        return cycles.sort((a, b) => b.strength - a.strength);
    }
    
    findPeaks(prices) {
        const peaks = [];
        for (let i = 1; i < prices.length - 1; i++) {
            if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
                peaks.push(i);
            }
        }
        return peaks;
    }
    
    findTroughs(prices) {
        const troughs = [];
        for (let i = 1; i < prices.length - 1; i++) {
            if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
                troughs.push(i);
            }
        }
        return troughs;
    }
    
    isNearGannNumber(number, tolerance = 2) {
        for (const gannNum of this.gannNumbers) {
            if (Math.abs(number - gannNum) <= tolerance) {
                return { isGann: true, nearest: gannNum };
            }
        }
        return { isGann: false, nearest: null };
    }
    
    calculateCycleStrength(prices, startIdx, endIdx) {
        const amplitude = Math.abs(prices[endIdx] - prices[startIdx]);
        const avgPrice = (prices[startIdx] + prices[endIdx]) / 2;
        return (amplitude / avgPrice) * 100; // Percentage move
    }
    
    /**
     * Predict next market reversal dates
     */
    predictNextReversal(lastReversalDate, identifiedCycles) {
        const predictions = [];
        const uniqueDates = new Set();
        
        // Use identified GANN cycles
        identifiedCycles
            .filter(cycle => cycle.isGannCycle)
            .forEach(cycle => {
                const nextDate = new Date(lastReversalDate);
                nextDate.setDate(nextDate.getDate() + cycle.nearestGann);
                
                const dateStr = nextDate.toISOString().split('T')[0];
                if (!uniqueDates.has(dateStr)) {
                    uniqueDates.add(dateStr);
                    predictions.push({
                        date: nextDate.toISOString(),
                        cycleLength: cycle.nearestGann,
                        confidence: 0.8,
                        type: 'GANN_CYCLE',
                        strength: cycle.strength
                    });
                }
            });
        
        // Add natural cycle predictions
        Object.entries(this.naturalCycles).forEach(([cycleName, days]) => {
            const nextDate = new Date(lastReversalDate);
            nextDate.setDate(nextDate.getDate() + days);
            
            const dateStr = nextDate.toISOString().split('T')[0];
            if (!uniqueDates.has(dateStr)) {
                uniqueDates.add(dateStr);
                predictions.push({
                    date: nextDate.toISOString(),
                    cycleLength: days,
                    confidence: 0.6,
                    type: `NATURAL_${cycleName.toUpperCase()}`,
                    strength: 50 // Default strength for natural cycles
                });
            }
        });
        
        return predictions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
}

/**
 * Master GANN Strategy combining all techniques
 */
class GANNMasterStrategy {
    constructor() {
        this.squareOf9 = new GANNSquareOf9Calculator();
        this.angleAnalyzer = new GANNAngleAnalyzer();
        this.timeCycle = new GANNTimeCycleAnalyzer();
    }
    
    /**
     * Perform complete GANN analysis
     */
    analyzeMarket(priceData, currentPrice) {
        // Extract price array
        const prices = Array.isArray(priceData) ? 
            priceData : priceData.map(d => d.close || d);
        
        // Square of 9 analysis
        const sq9Levels = this.squareOf9.calculateLevels(currentPrice);
        const tradingLevels = this.squareOf9.generateTradingLevels(currentPrice);
        
        // Angle analysis
        const trendAnalysis = this.angleAnalyzer.identifyTrendAngle(
            prices.slice(-50), // Last 50 periods
            Array.from({length: 50}, (_, i) => i)
        );
        
        // Time cycle analysis
        const cycles = this.timeCycle.identifyCycles(prices);
        
        // Generate combined signal
        const signal = this.generateSignal(
            tradingLevels,
            trendAnalysis,
            cycles,
            currentPrice
        );
        
        return {
            squareOf9: sq9Levels,
            tradingLevels,
            trendAnalysis,
            cycles,
            signal,
            timestamp: new Date().toISOString(),
            marketHealth: this.assessMarketHealth(trendAnalysis, cycles)
        };
    }
    
    generateSignal(tradingLevels, trendAnalysis, cycles, currentPrice) {
        const signal = {
            action: 'HOLD',
            confidence: 0.5,
            entry: null,
            targets: [],
            stop: null,
            reasoning: []
        };
        
        // Strong trend signal
        if (trendAnalysis.strength === 'STRONG' || trendAnalysis.strength === 'VERY_STRONG') {
            if (trendAnalysis.trend === 'UPTREND') {
                signal.action = 'BUY';
                signal.entry = tradingLevels.buySetup.entry;
                signal.targets = tradingLevels.buySetup.targets;
                signal.stop = tradingLevels.buySetup.stop;
                signal.confidence = 0.8;
                signal.reasoning.push(`Strong uptrend at ${trendAnalysis.angle.toFixed(1)}° angle`);
            } else if (trendAnalysis.trend === 'DOWNTREND') {
                signal.action = 'SELL';
                signal.entry = tradingLevels.sellSetup.entry;
                signal.targets = tradingLevels.sellSetup.targets;
                signal.stop = tradingLevels.sellSetup.stop;
                signal.confidence = 0.8;
                signal.reasoning.push(`Strong downtrend at ${trendAnalysis.angle.toFixed(1)}° angle`);
            }
        }
        
        // Adjust confidence based on GANN cycles
        if (cycles.length > 0 && cycles[0].isGannCycle) {
            signal.confidence = Math.min(signal.confidence + 0.1, 1.0);
            signal.reasoning.push(`GANN cycle detected (${cycles[0].nearestGann} periods)`);
        }
        
        // Check if near key GANN angle
        if (trendAnalysis.nearestGannAngle && trendAnalysis.nearestGannAngle.difference < 5) {
            signal.confidence = Math.min(signal.confidence + 0.05, 1.0);
            signal.reasoning.push(`Price respecting ${trendAnalysis.nearestGannAngle.name} GANN angle`);
        }
        
        return signal;
    }
    
    assessMarketHealth(trendAnalysis, cycles) {
        let health = 50; // Base health
        
        // Trend consistency
        if (trendAnalysis.strength === 'STRONG' || trendAnalysis.strength === 'VERY_STRONG') {
            health += 20;
        } else if (trendAnalysis.strength === 'MODERATE') {
            health += 10;
        }
        
        // Cycle regularity
        const gannCycles = cycles.filter(c => c.isGannCycle);
        if (gannCycles.length > 0) {
            health += Math.min(gannCycles.length * 5, 20);
        }
        
        // Momentum
        if (trendAnalysis.momentum > 1.5) {
            health += 10;
        } else if (trendAnalysis.momentum < 0.5) {
            health -= 10;
        }
        
        return Math.min(Math.max(health, 0), 100);
    }
}

module.exports = { 
    GANNSquareOf9Calculator,
    GANNAngleAnalyzer,
    GANNTimeCycleAnalyzer,
    GANNMasterStrategy
};