// test-connection.js - RUN THIS TO TEST
const WebSocket = require('ws');
const dns = require('dns');

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

const ws = new WebSocket('ws://127.0.0.1:3010/ws');

ws.on('open', () => {
    console.log('✅ Connected to server');
    
    // Identify as test bot
    ws.send(JSON.stringify({
        type: 'identify',
        source: 'trading_bot',
        botTier: 'test'
    }));
    
    // Send test trade every 2 seconds
    setInterval(() => {
        const trade = {
            type: 'trade',
            botTier: 'test',
            action: Math.random() > 0.5 ? 'BUY' : 'SELL',
            price: 50000 + Math.random() * 1000,
            pnl: (Math.random() - 0.5) * 100,
            reason: 'Test trade',
            timestamp: Date.now()
        };
        
        ws.send(JSON.stringify(trade));
        console.log('📤 Sent test trade:', trade);
    }, 2000);
});

ws.on('message', (data) => {
    console.log('📨 Received:', data.toString());
});

ws.on('error', (err) => {
    console.error('❌ Error:', err.message);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Disconnected - code: ${code}, reason: ${reason}`);
});

console.log('🚀 Test bot starting...');