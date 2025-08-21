// FixPaperTrading.js - Make the accounting ACTUALLY WORK
const fs = require('fs');

// Read the ExecutionLayer.js file
let code = fs.readFileSync('/root/OGZFV-valhalla/ExecutionLayer.js', 'utf8');

// Fix the constructor to track paper balance properly
code = code.replace(
  'this.balance = 0;',
  'this.balance = config.initialBalance || 10000; // Start with $10k for paper trading'
);

// Fix the paperTrade function to actually manage money
const newPaperTrade = `
  paperTrade(decision) {
    const tradeId = Date.now().toString();
    const currentPrice = decision.price || 50000;
    
    // Calculate how much we can actually afford
    const availableBalance = this.balance * 0.95; // Keep 5% reserve
    const tradeValue = Math.min(
      availableBalance * 0.1, // Max 10% per trade
      this.config.minTradeSize * 2 // At least 2x minimum
    );
    
    const btcAmount = tradeValue / currentPrice;
    
    // ACTUALLY DEDUCT THE MONEY WHEN BUYING
    if (decision.action === 'LONG' || decision.action === 'BUY') {
      if (this.balance < tradeValue) {
        console.log('❌ INSUFFICIENT FUNDS! Balance: $' + this.balance.toFixed(2));
        return null;
      }
      
      this.balance -= tradeValue; // SUBTRACT THE MONEY!
      
      const trade = {
        id: tradeId,
        side: 'buy',
        size: btcAmount,
        price: currentPrice,
        value: tradeValue,
        time: new Date().toISOString(),
        paper: true,
        entryBalance: this.balance + tradeValue,
        currentBalance: this.balance
      };
      
      this.positions.set(tradeId, trade);
      
      console.log('📝 PAPER TRADE EXECUTED (BUY):');
      console.log('   ID: ' + trade.id);
      console.log('   Price: $' + currentPrice.toFixed(2));
      console.log('   Size: ' + btcAmount.toFixed(6) + ' BTC');
      console.log('   Cost: $' + tradeValue.toFixed(2));
      console.log('   Balance Before: $' + trade.entryBalance.toFixed(2));
      console.log('   Balance After: $' + this.balance.toFixed(2));
      console.log('   📊 Remaining Cash: $' + this.balance.toFixed(2));
      
      return trade;
      
    } else if (decision.action === 'SHORT' || decision.action === 'SELL') {
      // For SELL, check if we have positions to sell
      const openPositions = Array.from(this.positions.values()).filter(p => !p.closed);
      
      if (openPositions.length === 0) {
        console.log('⚠️ No positions to sell!');
        return null;
      }
      
      // Sell the oldest position
      const positionToSell = openPositions[0];
      const sellPrice = currentPrice;
      const sellValue = positionToSell.size * sellPrice;
      
      // Calculate P&L
      const buyValue = positionToSell.size * positionToSell.price;
      const pnl = sellValue - buyValue;
      const pnlPercent = (pnl / buyValue) * 100;
      
      // ADD THE MONEY BACK (with profit/loss)
      this.balance += sellValue;
      
      // Mark position as closed
      positionToSell.closed = true;
      positionToSell.exitPrice = sellPrice;
      positionToSell.exitTime = new Date().toISOString();
      positionToSell.pnl = pnl;
      positionToSell.pnlPercent = pnlPercent;
      
      console.log('📝 PAPER TRADE EXECUTED (SELL):');
      console.log('   Position ID: ' + positionToSell.id);
      console.log('   Entry: $' + positionToSell.price.toFixed(2));
      console.log('   Exit: $' + sellPrice.toFixed(2));
      console.log('   Size: ' + positionToSell.size.toFixed(6) + ' BTC');
      console.log('   P&L: $' + pnl.toFixed(2) + ' (' + pnlPercent.toFixed(2) + '%)');
      console.log('   💰 New Balance: $' + this.balance.toFixed(2));
      
      return {
        id: Date.now().toString(),
        side: 'sell',
        size: positionToSell.size,
        price: sellPrice,
        value: sellValue,
        pnl: pnl,
        pnlPercent: pnlPercent,
        time: new Date().toISOString(),
        paper: true,
        newBalance: this.balance
      };
    }
    
    return null;
  }`;

// Find and replace the paperTrade function
const startIdx = code.indexOf('paperTrade(decision) {');
const endIdx = code.indexOf('\n  }', startIdx) + 4;

if (startIdx !== -1) {
  code = code.substring(0, startIdx) + newPaperTrade + code.substring(endIdx);
}

// Add a getStatus function to track everything
const statusFunction = `

  // Get current trading status
  getStatus() {
    const openPositions = Array.from(this.positions.values()).filter(p => !p.closed);
    const closedPositions = Array.from(this.positions.values()).filter(p => p.closed);
    
    const totalPnL = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const winningTrades = closedPositions.filter(p => p.pnl > 0).length;
    const losingTrades = closedPositions.filter(p => p.pnl < 0).length;
    const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0;
    
    console.log('\\n💼 TRADING STATUS:');
    console.log('   💵 Current Balance: $' + this.balance.toFixed(2));
    console.log('   📊 Open Positions: ' + openPositions.length);
    console.log('   ✅ Closed Trades: ' + closedPositions.length);
    console.log('   💰 Total P&L: $' + totalPnL.toFixed(2));
    console.log('   📈 Win Rate: ' + winRate.toFixed(1) + '%');
    console.log('   🏆 Wins: ' + winningTrades + ' | 💔 Losses: ' + losingTrades);
    
    return {
      balance: this.balance,
      openPositions: openPositions.length,
      closedTrades: closedPositions.length,
      totalPnL: totalPnL,
      winRate: winRate
    };
  }
`;

// Add before the final closing brace
code = code.substring(0, code.lastIndexOf('}')) + statusFunction + '\n}\n\nmodule.exports = ExecutionLayer;';

// Write the fixed file
fs.writeFileSync('/root/OGZFV-valhalla/ExecutionLayer.js', code);

console.log('✅ Paper trading logic FIXED!');
console.log('Now it will:');
console.log('  - SUBTRACT money when buying');
console.log('  - ADD money when selling');
console.log('  - Track actual P&L');
console.log('  - Show real balances');