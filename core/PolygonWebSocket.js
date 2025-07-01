require('dotenv').config();
const WebSocket = require('ws');

class PolygonWebSocket {
  constructor(onTick) {
    this.apiKey = process.env.POLYGON_API_KEY;
    this.url = 'wss://socket.polygon.io/crypto';
    this.socket = null;
    this.onTick = onTick;
    this.isAuthenticated = false;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.on('open', () => {
      console.log('🔌 Connected to Polygon.io WebSocket');
      this.authenticate();
    });

    this.socket.on('message', (data) => {
      this.handleMessage(data);
    });

    this.socket.on('error', (err) => {
      console.error('❌ Polygon WebSocket error:', err.message);
    });

    this.socket.on('close', () => {
      console.warn('⚠️ Polygon WebSocket closed — attempting reconnect in 5s');
      setTimeout(() => this.connect(), 5000);
    });
  }

  authenticate() {
    this.socket.send(JSON.stringify({
      action: 'auth',
      params: this.apiKey
    }));
  }

  subscribeToAggregates() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot subscribe: WebSocket not ready');
      return;
    }

    this.socket.send(JSON.stringify({
      action: 'subscribe',
      params: 'XA.BTC-USD'
    }));

    console.log('📡 Subscribed to XA.BTC-USD');
  }

  handleMessage(data) {
    try {
      const messages = JSON.parse(data);

      if (!Array.isArray(messages)) return;

      for (const msg of messages) {
        if (msg.status === 'auth_success') {
          this.isAuthenticated = true;
          console.log('✅ Polygon authentication successful');
          this.subscribeToAggregates();
        }

        if (msg.ev === 'XA' && this.onTick) {
          this.onTick({
            type: 'candle',
            pair: msg.pair,
            open: msg.o,
            high: msg.h,
            low: msg.l,
            close: msg.c,
            volume: msg.v,
            timestamp: msg.e
          });
        }
      }
    } catch (err) {
      console.error('❌ Error parsing Polygon message:', err);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

module.exports = PolygonWebSocket;