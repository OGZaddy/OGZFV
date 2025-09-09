const WebSocket = require('ws');

console.log('Testing WebSocket connections...');

// Test 1: Root path
console.log('🔍 Testing ws://127.0.0.1:3010');
const ws1 = new WebSocket('ws://127.0.0.1:3010');

ws1.on('open', () => {
    console.log('✅ ROOT PATH: Connected to ws://127.0.0.1:3010');
    ws1.send(JSON.stringify({ type: 'test', message: 'Hello from root path' }));
});

ws1.on('error', (err) => {
    console.error('❌ ROOT PATH ERROR:', err.message);
    
    // Test 2: /ws path if root fails
    console.log('🔍 Testing ws://127.0.0.1:3010/ws');
    const ws2 = new WebSocket('ws://127.0.0.1:3010/ws');
    
    ws2.on('open', () => {
        console.log('✅ WS PATH: Connected to ws://127.0.0.1:3010/ws');
        ws2.send(JSON.stringify({ type: 'test', message: 'Hello from /ws path' }));
    });
    
    ws2.on('error', (err) => {
        console.error('❌ WS PATH ERROR:', err.message);
        console.log('❌ Both paths failed - SSL server may not support WebSocket');
    });
    
    ws2.on('message', (data) => {
        console.log('📨 WS PATH received:', data.toString());
        process.exit(0);
    });
    
    setTimeout(() => {
        ws2.close();
        process.exit(1);
    }, 5000);
});

ws1.on('message', (data) => {
    console.log('📨 ROOT PATH received:', data.toString());
    process.exit(0);
});

setTimeout(() => {
    ws1.close();
    process.exit(1);
}, 5000);