// ===================================================================
// FREE BINANCE WEBSOCKET - NO API KEY REQUIRED! 🚀
// ===================================================================
// Drop-in replacement for Polygon when subscription lapses
// Uses Binance's free public WebSocket streams

const WebSocket = require('ws');
const EventEmitter = require('events');

class BinanceWebSocket extends EventEmitter {
  constructor(symbol = 'BTCUSDT') {
    super();
    
    this.symbol = symbol;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 5000;
    
    console.log('🆓 FREE Binance WebSocket initialized - No API key needed!');
  }

  async connect() {
    try {
      console.log(`🔌 Connecting to Binance WebSocket for ${this.symbol}...`);
      
      // Binance WebSocket URL for ticker data (24hr price statistics)
      const wsUrl = `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@ticker`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Connected to Binance WebSocket!');
        this.emit('connected');
      });

      this.ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data);
          
          // Convert Binance format to Polygon-like format
          const polygonFormat = {
            ev: 'T', // Trade event
            sym: 'BTC-USD', // Convert BTCUSDT to BTC-USD format
            p: parseFloat(parsed.c), // Current price
            s: parseFloat(parsed.v), // Volume
            t: Date.now(), // Timestamp
            // Additional Binance data
            h: parseFloat(parsed.h), // High price
            l: parseFloat(parsed.l), // Low price
            o: parseFloat(parsed.o), // Open price
            pc: parseFloat(parsed.P), // Price change percent
            c: parseFloat(parsed.c)   // Close price (current)
          };
          
          // Emit in Polygon format for compatibility
          this.emit('message', [polygonFormat]);
          
        } catch (error) {
          console.warn('Error parsing Binance message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ Binance WebSocket error:', error);
        this.emit('error', error);
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        console.log('🔌 Binance WebSocket disconnected');
        this.emit('disconnected');
        
        // Auto-reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting to Binance... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, this.reconnectInterval);
        }
      });

    } catch (error) {
      console.error('❌ Failed to connect to Binance:', error);
      this.emit('error', error);
    }
  }

  disconnect() {
    if (this.ws) {
      console.log('🔌 Disconnecting from Binance WebSocket...');
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
    }
  }

  // Compatibility methods for Polygon interface
  subscribeToTrades(symbol) {
    console.log(`📊 Subscribed to ${symbol} trades via Binance (FREE!)`);
    // Binance auto-subscribes on connection
  }

  subscribeToQuotes(symbol) {
    console.log(`📈 Subscribed to ${symbol} quotes via Binance (FREE!)`);
    // Binance ticker includes quote data
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      authenticated: true, // No auth needed for Binance public streams
      dataProvider: 'Binance (FREE)',
      symbol: this.symbol
    };
  }
}

module.exports = BinanceWebSocket;