
const WebSocket = require('ws');

// Replace Binance WebSocket with Polygon.io crypto WebSocket
const POLYGON_API_KEY = '0gp6oKkWwriN0WInvwu539Ch6iJAOcLK';
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

// Connect to Polygon.io Crypto WebSocket
const polygonSocket = new WebSocket(POLYGON_CRYPTO_SOCKET);

polygonSocket.on('open', () => {
  console.log('🔌 Connected to Polygon.io crypto feed');
  // Authenticate with Polygon.io
  polygonSocket.send(JSON.stringify({
    action: 'auth',
    params: POLYGON_API_KEY
  }));

  // Subscribe to BTC-USD trades
  polygonSocket.send(JSON.stringify({
    action: 'subscribe',
    params: 'T.BTC-USD'
  }));
});

polygonSocket.on('message', (data) => {
  try {
    const messages = JSON.parse(data);
    for (const msg of messages) {
      if (msg.ev === 'T' && msg.p && msg.t) {
        const price = parseFloat(msg.p);
        const timestamp = new Date(msg.t).toISOString();
        ogzPrime.processTick({ price, timestamp, isLive: true });
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

polygonSocket.on('close', () => {
  console.warn('⚠️ Polygon WebSocket disconnected.');
});

polygonSocket.on('error', (err) => {
  console.error('🚨 Polygon WebSocket error:', err);
});
