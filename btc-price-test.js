// Check for BTC price data specifically
const WebSocket = require('ws');

console.log('🔍 Checking for BTC-USD price data...');

const ws = new WebSocket('ws://0.0.0.0:3010/ws');

ws.on('open', () => {
    console.log('✅ Connected, listening for BTC-USD prices...');
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    if (msg.type === 'price' || msg.ev === 'XA') {
        const asset = msg.data?.asset || msg.pair;
        const price = msg.data?.price || msg.c;
        
        if (asset && asset.includes('BTC')) {
            console.log(`📈 BTC PRICE: ${asset} = $${price}`);
        }
    }
});

setTimeout(() => {
    console.log('✅ Test complete');
    process.exit(0);
}, 8000);