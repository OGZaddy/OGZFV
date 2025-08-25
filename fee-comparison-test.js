#!/usr/bin/env node

// FEE STRUCTURE COMPARISON TEST
console.log('🔍 FEE STRUCTURE COMPARISON - Elite Bot Reality Check');
console.log('====================================================\n');

// Test same trade scenario with different fee structures
const testTrades = [
    { action: 'BUY', price: 50000 },
    { action: 'SELL', price: 51200 }, // +2.4% move
    { action: 'BUY', price: 51200 },
    { action: 'SELL', price: 52429 }, // +2.4% move
    { action: 'BUY', price: 52429 },
    { action: 'SELL', price: 53688 }  // +2.4% move
];

console.log('📊 Test Scenario: 3 round trips with +2.4% price moves\n');

// 1. BROKEN ORIGINAL (what Elite bot was doing)
console.log('❌ ORIGINAL BROKEN METHOD:');
let brokenBalance = 10000;
let brokenTrades = 0;
let positions = [];

testTrades.forEach(trade => {
    if (trade.action === 'BUY') {
        positions.push({ price: trade.price, size: 0.003 });
        console.log(`   BUY @ $${trade.price} - Balance: $${brokenBalance.toFixed(2)}`);
    } else {
        const position = positions.shift();
        const pnl = (trade.price - position.price) * position.size;
        const pnlAfterFees = pnl - (pnl * 0.034); // Wrong fee calculation!
        brokenBalance += pnlAfterFees;
        console.log(`   SELL @ $${trade.price} - P&L: $${pnlAfterFees.toFixed(2)} - Balance: $${brokenBalance.toFixed(2)}`);
    }
});

console.log(`BROKEN RESULT: $${brokenBalance.toFixed(2)} (+${(brokenBalance - 10000).toFixed(2)})\n`);

// 2. OVERLY PESSIMISTIC (3.4% total fees)
console.log('😰 OVERLY PESSIMISTIC (3.4% total fees):');
class PessimisticMath {
    constructor(balance) {
        this.balance = balance;
        this.positions = [];
        this.feeRate = 0.017; // 1.7% per side
    }
    
    executeBuy(price) {
        const usdToSpend = this.balance * 0.95;
        const fee = usdToSpend * this.feeRate;
        const totalCost = usdToSpend + fee;
        const btcAmount = usdToSpend / price;
        this.balance -= totalCost;
        this.positions.push({ entryPrice: price, btcAmount, totalCost });
        return { totalCost, btcAmount };
    }
    
    executeSell(price) {
        if (this.positions.length === 0) return null;
        const position = this.positions.shift();
        const grossProceeds = position.btcAmount * price;
        const fee = grossProceeds * this.feeRate;
        const netProceeds = grossProceeds - fee;
        const pnl = netProceeds - position.totalCost;
        this.balance += netProceeds;
        return { pnl, netProceeds };
    }
}

const pessimistic = new PessimisticMath(10000);
testTrades.forEach(trade => {
    if (trade.action === 'BUY') {
        const result = pessimistic.executeBuy(trade.price);
        console.log(`   BUY @ $${trade.price} - Cost: $${result.totalCost.toFixed(2)} - Balance: $${pessimistic.balance.toFixed(2)}`);
    } else {
        const result = pessimistic.executeSell(trade.price);
        console.log(`   SELL @ $${trade.price} - P&L: $${result.pnl.toFixed(2)} - Balance: $${pessimistic.balance.toFixed(2)}`);
    }
});

console.log(`PESSIMISTIC RESULT: $${pessimistic.balance.toFixed(2)} (${(pessimistic.balance - 10000).toFixed(2)})\n`);

// 3. REALISTIC PESSIMISTIC (1.2% total fees)
console.log('✅ REALISTIC PESSIMISTIC (1.2% total fees):');
class RealisticMath {
    constructor(balance) {
        this.balance = balance;
        this.positions = [];
        this.feeRate = 0.006; // 0.6% per side = 1.2% total
    }
    
    executeBuy(price) {
        const usdToSpend = this.balance * 0.95;
        const fee = usdToSpend * this.feeRate;
        const totalCost = usdToSpend + fee;
        const btcAmount = usdToSpend / price;
        this.balance -= totalCost;
        this.positions.push({ entryPrice: price, btcAmount, totalCost });
        return { totalCost, btcAmount };
    }
    
    executeSell(price) {
        if (this.positions.length === 0) return null;
        const position = this.positions.shift();
        const grossProceeds = position.btcAmount * price;
        const fee = grossProceeds * this.feeRate;
        const netProceeds = grossProceeds - fee;
        const pnl = netProceeds - position.totalCost;
        this.balance += netProceeds;
        return { pnl, netProceeds };
    }
}

const realistic = new RealisticMath(10000);
testTrades.forEach(trade => {
    if (trade.action === 'BUY') {
        const result = realistic.executeBuy(trade.price);
        console.log(`   BUY @ $${trade.price} - Cost: $${result.totalCost.toFixed(2)} - Balance: $${realistic.balance.toFixed(2)}`);
    } else {
        const result = realistic.executeSell(trade.price);
        console.log(`   SELL @ $${trade.price} - P&L: $${result.pnl.toFixed(2)} - Balance: $${realistic.balance.toFixed(2)}`);
    }
});

console.log(`REALISTIC RESULT: $${realistic.balance.toFixed(2)} (+${(realistic.balance - 10000).toFixed(2)})\n`);

// 4. COMPARISON SUMMARY
console.log('📊 COMPARISON SUMMARY:');
console.log('=====================');
console.log(`❌ Broken Original:     $${brokenBalance.toFixed(2)} (+${(brokenBalance - 10000).toFixed(2)})`);
console.log(`😰 Overly Pessimistic:  $${pessimistic.balance.toFixed(2)} (${(pessimistic.balance - 10000).toFixed(2)})`);
console.log(`✅ Realistic Pessimistic: $${realistic.balance.toFixed(2)} (+${(realistic.balance - 10000).toFixed(2)})`);

console.log('\n💡 ANALYSIS:');
console.log('============');
console.log('• Broken method showed fake profits by ignoring proper fees');
console.log('• 3.4% fees were unrealistically high (retail worst case)');  
console.log('• 1.2% total fees are realistic for algorithmic trading:');
console.log('  - Exchange fees: ~0.1-0.5% per side');
console.log('  - Slippage: ~0.05-0.1% per trade');
console.log('  - Total realistic range: 0.3-1.2% per round trip');

console.log('\n🎯 CONCLUSION:');
console.log('==============');
console.log('Elite bot now uses 1.2% total fees = realistic but conservative');
console.log('This accounts for real trading costs without being absurdly pessimistic');
console.log('Perfect for paper trading that translates to live results!');