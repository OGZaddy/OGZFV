#!/usr/bin/env node

// ELITE BOT TRADE AUDIT - REAL P&L ANALYSIS
// Analyzing the 2.34% performance over 43 hours

console.log('🔍 ELITE BOT TRADE AUDIT - REAL P&L ANALYSIS');
console.log('============================================');

// ELITE BOT REPORTED PERFORMANCE (from your previous data)
const reportedData = {
    startBalance: 10000,
    currentBalance: 10234, // 2.34% gain
    reportedProfit: 234,
    winRate: 49.8, // 49.8% win rate from previous analysis
    totalTrades: 954, // From previous analysis
    runtime: 43 // hours
};

console.log('\n📊 REPORTED PERFORMANCE:');
console.log('Starting Balance: $' + reportedData.startBalance);
console.log('Current Balance: $' + reportedData.currentBalance);
console.log('Reported Profit: $' + reportedData.reportedProfit);
console.log('Win Rate: ' + reportedData.winRate + '%');
console.log('Total Trades: ' + reportedData.totalTrades);
console.log('Runtime: ' + reportedData.runtime + ' hours');

// REAL TRADE SIMULATION WITH PROPER FEES
console.log('\n🔍 TRADE AUDIT WITH PROPER FEES:');
console.log('=================================');

// Simulate realistic trading with 3.4% total fees (1.7% buy + 1.7% sell)
const FEE_RATE = 0.017; // 1.7% per side
const avgTradeSize = 100; // Average $100 per trade
const avgWinAmount = 3.5; // Average win: 3.5%
const avgLossAmount = -2.8; // Average loss: -2.8%

let currentBalance = reportedData.startBalance;
let totalFeesPaid = 0;
let grossProfit = 0;

console.log('\nSimulating ' + reportedData.totalTrades + ' trades...\n');

// Calculate winning and losing trades
const winningTrades = Math.round(reportedData.totalTrades * (reportedData.winRate / 100));
const losingTrades = reportedData.totalTrades - winningTrades;

console.log('Winning Trades: ' + winningTrades);
console.log('Losing Trades: ' + losingTrades);

// Simulate all trades with proper fee calculation
for (let i = 1; i <= reportedData.totalTrades; i++) {
    const isWin = i <= winningTrades;
    
    // Calculate trade details
    const tradeValue = avgTradeSize;
    const buyFees = tradeValue * FEE_RATE; // Fee on entry
    const balanceAfterBuy = currentBalance - buyFees;
    
    // Calculate exit
    const priceChangePercent = isWin ? avgWinAmount : avgLossAmount;
    const exitValue = tradeValue * (1 + priceChangePercent / 100);
    const sellFees = exitValue * FEE_RATE; // Fee on exit
    
    // Net result
    const grossProfitOnTrade = exitValue - tradeValue;
    const totalFeesOnTrade = buyFees + sellFees;
    const netProfitOnTrade = grossProfitOnTrade - totalFeesOnTrade;
    
    // Update balances
    grossProfit += grossProfitOnTrade;
    totalFeesPaid += totalFeesOnTrade;
    currentBalance += netProfitOnTrade;
    
    // Show details for first few trades and last few
    if (i <= 3 || i >= reportedData.totalTrades - 2) {
        console.log(`\nTrade ${i} (${isWin ? 'WIN' : 'LOSS'}):`);
        console.log('  Trade Value: $' + tradeValue.toFixed(2));
        console.log('  Buy Fees: $' + buyFees.toFixed(2));
        console.log('  Price Change: ' + priceChangePercent + '%');
        console.log('  Exit Value: $' + exitValue.toFixed(2));
        console.log('  Sell Fees: $' + sellFees.toFixed(2));
        console.log('  Gross Profit: $' + grossProfitOnTrade.toFixed(2));
        console.log('  Total Fees: $' + totalFeesOnTrade.toFixed(2));
        console.log('  Net Profit: $' + netProfitOnTrade.toFixed(2));
        console.log('  Balance: $' + currentBalance.toFixed(2));
    } else if (i === 4) {
        console.log('\n... (showing first 3 and last 3 trades) ...\n');
    }
}

console.log('\n🧮 FINAL AUDIT RESULTS:');
console.log('========================');
console.log('Starting Balance: $' + reportedData.startBalance.toFixed(2));
console.log('Gross Profit: $' + grossProfit.toFixed(2));
console.log('Total Fees Paid: $' + totalFeesPaid.toFixed(2));
console.log('Net Profit: $' + (grossProfit - totalFeesPaid).toFixed(2));
console.log('Final Balance: $' + currentBalance.toFixed(2));

console.log('\n📈 PERFORMANCE ANALYSIS:');
console.log('========================');
console.log('Reported Balance: $' + reportedData.currentBalance.toFixed(2));
console.log('Calculated Balance: $' + currentBalance.toFixed(2));
console.log('Difference: $' + (reportedData.currentBalance - currentBalance).toFixed(2));

const actualReturnPct = ((currentBalance - reportedData.startBalance) / reportedData.startBalance) * 100;
const reportedReturnPct = ((reportedData.currentBalance - reportedData.startBalance) / reportedData.startBalance) * 100;

console.log('\nReported Return: ' + reportedReturnPct.toFixed(2) + '%');
console.log('Calculated Return: ' + actualReturnPct.toFixed(2) + '%');
console.log('Fee Impact: $' + totalFeesPaid.toFixed(2) + ' (' + (totalFeesPaid/reportedData.startBalance*100).toFixed(2) + '% of starting balance)');

console.log('\n💡 ANALYSIS:');
console.log('============');
if (Math.abs(reportedData.currentBalance - currentBalance) < 50) {
    console.log('✅ P&L calculation appears ACCURATE - fees properly accounted for');
} else if (reportedData.currentBalance > currentBalance) {
    console.log('⚠️  Reported profit may be INFLATED - fees might not be properly calculated');
    console.log('   Possible issue: Adding gross profit without subtracting fees');
} else {
    console.log('⚠️  Reported profit may be UNDERSTATED - double-counting fees?');
}

console.log('\n🎯 RECOMMENDATIONS:');
console.log('===================');
console.log('1. Verify fee calculation: buyFees + sellFees = ' + (FEE_RATE * 2 * 100).toFixed(1) + '% total');
console.log('2. Check if Elite bot subtracts fees on BOTH buy and sell');
console.log('3. Ensure final balance = startBalance + netProfit (not grossProfit)');
console.log('4. With ' + reportedData.totalTrades + ' trades, fees are significant: $' + totalFeesPaid.toFixed(2));

console.log('\n✅ AUDIT COMPLETE');