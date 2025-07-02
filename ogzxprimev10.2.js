require('dotenv').config();
const WebSocket = require('ws');
const PolygonWebSocket = require('./core/PolygonWebSocket');
const WebSocketManager = require('./core/WebsocketManager');

let polygonWS = null;
let wsManager = null;

function startBot() {
  if (!polygonWS) {
    polygonWS = new PolygonWebSocket(onTick);
    polygonWS.connect();
    console.log('PolygonWebSocket instance created and connected.');
  }
  if (!wsManager) {
    wsManager = new WebSocketManager();
    wsManager.getServer(3001);
    wsManager.getServer(3002);
    console.log('WebSocketManager instance created and servers started.');
  }
}

function onTick(tick) {
  // ...existing code...
}

startBot();

class PolygonWebSocket {
  constructor(onTick) {
    this.apiKey = process.env.POLYGON_API_KEY;
    this.url = 'wss://socket.polygon.io/crypto';
    this.socket = null;
    this.onTick = onTick;
    this.isAuthenticated = false;
    this.reconnectTimeout = null; // Track reconnect timeout
    this.isConnecting = false;    // Prevent multiple simultaneous connects
    this.reconnectAttempts = 0;   // For exponential backoff
  }

  connect() {
    if (this.isConnecting) return; // Prevent overlapping connects
    this.isConnecting = true;

    this.socket = new WebSocket(this.url);

    this.socket.on('open', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0; // Reset on success
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
      this.isConnecting = false;
      console.warn('⚠️ Polygon WebSocket closed — attempting reconnect');
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      // Exponential backoff up to 60s
      const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts), 60000);
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => this.connect(), delay);
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
            price: msg.c, // Add price field using close price
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.terminate(); // Force close
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

module.exports = PolygonWebSocket;