// Force a trade execution to test pipeline
const WebSocket = require('ws');

console.log('🎯 Forcing trade execution test...');

const ws = new WebSocket('ws://0.0.0.0:3010/ws');

ws.on('open', () => {
    console.log('✅ Connected - sending manual BUY command');
    
    // Send manual buy command that should trigger executeBuy() in all bots
    ws.send(JSON.stringify({
        type: 'manual_buy'
    }));
    
    setTimeout(() => {
        console.log('📤 Sending manual SELL command');
        ws.send(JSON.stringify({
            type: 'manual_sell' 
        }));
    }, 2000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    if (msg.type === 'trade') {
        console.log(`🎯 TRADE EXECUTED: ${msg.botTier} ${msg.action} @ $${msg.price}`);
        console.log(`   P&L: $${msg.pnl}, Reason: ${msg.reason}`);
    }
});

setTimeout(() => {
    ws.close();
    process.exit(0);
}, 5000);