// Test trade flow and price data
const WebSocket = require('ws');

console.log('🔍 Testing complete trade pipeline...');

const ws = new WebSocket('ws://0.0.0.0:3010/ws');
let priceReceived = false;
let tradesReceived = 0;

ws.on('open', () => {
    console.log('✅ Connected to WebSocket port 3010');
    
    // Identify as test client  
    ws.send(JSON.stringify({
        type: 'identify',
        source: 'trade_test',
        version: '1.0.0'
    }));
    
    console.log('🔍 Listening for price updates and trades...');
    
    // Send manual commands to trigger trades
    setTimeout(() => {
        console.log('📤 Triggering manual BUY...');
        ws.send(JSON.stringify({ type: 'manual_buy' }));
    }, 2000);
    
    setTimeout(() => {
        console.log('📤 Triggering manual SELL...');  
        ws.send(JSON.stringify({ type: 'manual_sell' }));
    }, 4000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    
    // Track price updates from Polygon
    if (msg.type === 'price' || msg.ev === 'XA') {
        const price = msg.data?.price || msg.c;
        const asset = msg.data?.asset || msg.pair;
        if (!priceReceived) {
            console.log(`📈 FIRST PRICE: ${asset} = $${price} (Polygon data flowing!)`);
            priceReceived = true;
        }
    }
    
    // Track actual trades from bots
    if (msg.type === 'trade' && msg.source === 'trading_bot') {
        tradesReceived++;
        console.log(`🎯 TRADE #${tradesReceived}: ${msg.botTier} ${msg.action} @ $${msg.price} | P&L: $${msg.pnl} | ${msg.reason}`);
        
        if (msg.indicators) {
            console.log(`   📊 RSI: ${msg.indicators.rsi?.toFixed(1)}, MACD: ${msg.indicators.macdHistogram?.toFixed(2)}`);
        }
    }
    
    // Track system status
    if (msg.type === 'system_status') {
        console.log(`📊 System Status: ${msg.activeModules} modules, Balance: $${msg.balance}`);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
});

// Summary after 8 seconds
setTimeout(() => {
    console.log('\n📋 PIPELINE TEST RESULTS:');
    console.log(`   📈 Price data flowing: ${priceReceived ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   🎯 Trades executed: ${tradesReceived}`);
    console.log(`   🔄 WebSocket connected: ${ws.readyState === 1 ? 'YES ✅' : 'NO ❌'}`);
    
    if (priceReceived && tradesReceived > 0) {
        console.log('🎉 COMPLETE PIPELINE WORKING!');
    } else if (priceReceived) {
        console.log('⚠️ Price data OK, but no trades executed');
    } else {
        console.log('❌ No price data or trades');
    }
    
    process.exit(0);
}, 8000);