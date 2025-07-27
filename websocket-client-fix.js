// Add this to the trading bot to connect to SSL server
const WebSocket = require('ws');

function connectToSSLServer(bot) {
  const ws = new WebSocket('ws://localhost:8001');
  
  ws.on('open', () => {
    console.log('✅ Connected to SSL server data feed!');
  });
  
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'ticker') {
        // Forward ticker data to the bot
        bot.handleMarketData({
          symbol: parsed.data.symbol,
          price: parsed.data.price,
          timestamp: parsed.data.timestamp
        });
      }
    } catch (e) {
      console.error('Error parsing WebSocket data:', e);
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
  
  ws.on('close', () => {
    console.log('WebSocket disconnected, reconnecting in 5s...');
    setTimeout(() => connectToSSLServer(bot), 5000);
  });
  
  return ws;
}

module.exports = connectToSSLServer;
