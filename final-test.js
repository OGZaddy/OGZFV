// Final definitive test
const WebSocket = require('ws');

console.log('🔥 FINAL TEST: Are trades actually happening?');

const ws = new WebSocket('ws://127.0.0.1:3010/ws');
let tradesCount = 0;
let pricesCount = 0;

ws.on('open', () => {
    console.log('✅ Connected to trading system');
    
    // Send manual trade commands
    setTimeout(() => {
        console.log('📤 MANUAL BUY');
        ws.send(JSON.stringify({ type: 'manual_buy' }));
    }, 1000);
    
    setTimeout(() => {
        console.log('📤 MANUAL SELL'); 
        ws.send(JSON.stringify({ type: 'manual_sell' }));
    }, 3000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    // Count prices
    if (msg.type === 'price' || msg.ev === 'XA') {
        pricesCount++;
        if (pricesCount <= 3) {
            const price = msg.data?.price || msg.c;
            const asset = msg.data?.asset || msg.pair;
            console.log(`📈 PRICE #${pricesCount}: ${asset} = $${price}`);
        }
    }
    
    // Count actual trades
    if (msg.type === 'trade') {
        tradesCount++;
        console.log(`🎯 TRADE #${tradesCount}: ${msg.botTier} ${msg.action} @ $${msg.price} | P&L: $${msg.pnl}`);
    }
});

setTimeout(() => {
    console.log('\n🏁 FINAL RESULTS:');
    console.log(`   📈 Prices received: ${pricesCount}`);
    console.log(`   🎯 Trades executed: ${tradesCount}`);
    console.log(`   🌐 WebSocket: ${ws.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    if (tradesCount > 0) {
        console.log('✅ TRADING IS WORKING');
    } else {
        console.log('❌ NO TRADES EXECUTED');
    }
    
    ws.close();
    process.exit(0);
}, 7000);