/**
 * TESTING OPTIMIZECEPTION'S BEST CONFIGURATION
 * 1:96 Risk/Reward - 70% Win Rate - 13,566% Monthly
 */

const fs = require('fs');

// Load the best OPTIMIZECEPTION configuration
const bestConfig = JSON.parse(fs.readFileSync('optimizeception-current-best.json'));
const config = bestConfig.bestConfiguration;

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     TESTING OPTIMIZECEPTION BEST CONFIGURATION               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📊 CONFIGURATION:');
console.log(`   Stop Loss: ${(config.stopLoss * 100).toFixed(1)}%`);
console.log(`   Take Profit: ${(config.takeProfit * 100).toFixed(1)}%`);
console.log(`   Risk/Reward: 1:${config.riskRewardRatio}`);
console.log(`   Confidence: ${(config.confidence * 100)}%`);
console.log(`   RSI: ${config.rsiPeriod} period, ${config.rsiOversold}/${config.rsiOverbought}`);
console.log(`   MACD: ${config.macdFast}/${config.macdSlow}/${config.macdSignal}`);
console.log(`   EMAs: ${config.emaShort}/${config.emaMedium}/${config.emaLong}\n`);

// Load historical data
const historicalData = JSON.parse(fs.readFileSync('polygon-btc-1y.json'));

// Backtest function
function runBacktest() {
    let balance = 10000;
    const startBalance = balance;
    let wins = 0;
    let losses = 0;
    let trades = [];
    let inPosition = false;
    let entryPrice = 0;
    
    // Indicators calculation
    const calculateRSI = (prices, period) => {
        if (prices.length < period) return 50;
        
        let gains = 0, losses = 0;
        for (let i = 1; i < period; i++) {
            const change = prices[i] - prices[i-1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    };
    
    const calculateMACD = (prices) => {
        const ema = (prices, period) => {
            const k = 2 / (period + 1);
            let ema = prices[0];
            for (let i = 1; i < prices.length; i++) {
                ema = prices[i] * k + ema * (1 - k);
            }
            return ema;
        };
        
        const fast = ema(prices.slice(-config.macdFast), config.macdFast);
        const slow = ema(prices.slice(-config.macdSlow), config.macdSlow);
        const macd = fast - slow;
        const signal = macd * 0.9; // Simplified signal line
        
        return { macd, signal };
    };
    
    // Process each candle
    for (let i = 100; i < historicalData.results.length - 1; i++) {
        const currentCandle = historicalData.results[i];
        const price = currentCandle.c;
        
        // Get recent prices
        const recentPrices = historicalData.results.slice(i - 100, i).map(c => c.c);
        
        // Calculate indicators
        const rsi = calculateRSI(recentPrices, config.rsiPeriod);
        const { macd, signal } = calculateMACD(recentPrices);
        
        // Check if in position
        if (inPosition) {
            // Check exit conditions
            const priceChange = (price - entryPrice) / entryPrice;
            
            if (priceChange <= -config.stopLoss) {
                // Stop loss hit
                const loss = balance * config.stopLoss;
                balance -= loss;
                losses++;
                trades.push({
                    type: 'LOSS',
                    entry: entryPrice,
                    exit: price,
                    pnl: -loss,
                    balance: balance
                });
                inPosition = false;
            } else if (priceChange >= config.takeProfit) {
                // Take profit hit
                const profit = balance * config.takeProfit;
                balance += profit;
                wins++;
                trades.push({
                    type: 'WIN',
                    entry: entryPrice,
                    exit: price,
                    pnl: profit,
                    balance: balance
                });
                inPosition = false;
            }
        } else {
            // Check entry conditions
            const confidence = Math.random(); // Simulate confidence calculation
            
            if (confidence > config.confidence && 
                rsi < config.rsiOversold && 
                macd > signal &&
                balance > 100) {
                // Enter position
                inPosition = true;
                entryPrice = price;
            }
        }
    }
    
    // Calculate final metrics
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
    const totalReturn = ((balance - startBalance) / startBalance * 100);
    const profitFactor = wins > 0 && losses > 0 ? 
        (wins * config.takeProfit) / (losses * config.stopLoss) : 0;
    
    return {
        finalBalance: balance,
        totalTrades,
        wins,
        losses,
        winRate,
        totalReturn,
        profitFactor,
        trades: trades.slice(-10) // Last 10 trades
    };
}

console.log('🚀 RUNNING BACKTEST...\n');

const results = runBacktest();

console.log('📈 RESULTS:');
console.log(`   Final Balance: $${results.finalBalance.toFixed(2)}`);
console.log(`   Total Return: ${results.totalReturn.toFixed(1)}%`);
console.log(`   Total Trades: ${results.totalTrades}`);
console.log(`   Wins: ${results.wins} | Losses: ${results.losses}`);
console.log(`   Win Rate: ${results.winRate.toFixed(1)}%`);
console.log(`   Profit Factor: ${results.profitFactor.toFixed(2)}`);

console.log('\n🏆 COMPARISON TO OPTIMIZECEPTION PREDICTION:');
console.log(`   Predicted Win Rate: ${bestConfig.performance.winRate.toFixed(1)}%`);
console.log(`   Actual Win Rate: ${results.winRate.toFixed(1)}%`);
console.log(`   Predicted Monthly: ${bestConfig.performance.monthlyReturn.toFixed(0)}%`);
console.log(`   Actual Return: ${results.totalReturn.toFixed(1)}%`);

console.log('\n📊 LAST 10 TRADES:');
results.trades.forEach((trade, i) => {
    console.log(`   ${i+1}. ${trade.type} - PnL: $${trade.pnl.toFixed(2)} - Balance: $${trade.balance.toFixed(2)}`);
});

// Save results
const report = {
    timestamp: new Date().toISOString(),
    configuration: config,
    predicted: bestConfig.performance,
    actual: results,
    verdict: results.winRate > 50 ? 'PROFITABLE' : 'NEEDS ADJUSTMENT'
};

fs.writeFileSync('optimizeception-backtest-results.json', JSON.stringify(report, null, 2));
console.log('\n✅ Full report saved to optimizeception-backtest-results.json');
