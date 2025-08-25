// Quick test to verify price data flow and trade execution
const WebSocket = require('ws');

console.log('🔍 Testing WebSocket connection and trade flow...');

const ws = new WebSocket('ws://127.0.0.1:3010/ws');

ws.on('open', () => {
    console.log('✅ Connected to WebSocket');
    
    // Identify as test client
    ws.send(JSON.stringify({
        type: 'identify',
        source: 'test_client',
        version: '1.0.0'
    }));
    
    // Test manual buy after 3 seconds
    setTimeout(() => {
        console.log('🔄 Sending manual buy command...');
        ws.send(JSON.stringify({
            type: 'manual_buy'
        }));
    }, 3000);
    
    // Test manual sell after 6 seconds
    setTimeout(() => {
        console.log('🔄 Sending manual sell command...');
        ws.send(JSON.stringify({
            type: 'manual_sell'
        }));
    }, 6000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    // Log price updates
    if (msg.type === 'price' || msg.ev === 'XA') {
        const price = msg.data?.price || msg.c;
        const asset = msg.data?.asset || msg.pair;
        console.log(`📈 PRICE UPDATE: ${asset} = $${price}`);
    }
    
    // Log trades
    if (msg.type === 'trade') {
        console.log(`🟢 TRADE: ${msg.botTier} ${msg.action} @ $${msg.price} | P&L: $${msg.pnl} | ${msg.reason}`);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

// Exit after 10 seconds
setTimeout(() => {
    console.log('✅ Test complete');
    process.exit(0);
}, 10000);