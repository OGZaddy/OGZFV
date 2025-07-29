// UNIFIED WEBSOCKET FIX FOR OGZ PRIME
// This fix ensures the bot properly receives price messages from SSL server

// Add this to run-trading-bot-v13-simplified.js in the WebSocket message handler
// Replace the existing ws.on('message') handler with this:

ws.on('message', (data) => {
  try {
    console.log(`📨 RAW MESSAGE RECEIVED:`, data.toString().substring(0, 100));
    
    const message = JSON.parse(data.toString());
    console.log(`📊 Parsed message type: ${message.type}`);
    
    // Handle different message types
    switch (message.type) {
      case 'price':
        if (message.data) {
          // Update cached market data with price message
          this.cachedMarketData = {
            price: parseFloat(message.data.price),
            volume: 1000,
            timestamp: message.data.timestamp || Date.now(),
            symbol: message.data.asset || 'BTC-USD'
          };
          this.lastDataReceived = Date.now();
          console.log(`💰 Price update: ${this.cachedMarketData.symbol} $${this.cachedMarketData.price.toFixed(2)}`);
          
          // Also update latestMarketData if you have it
          if (this.latestMarketData !== undefined) {
            this.latestMarketData = {
              price: parseFloat(message.data.price),
              symbol: message.data.asset || 'BTC-USD',
              timestamp: message.data.timestamp || Date.now(),
              volume: 1000,
              rsi: 50,
              macd: 0,
              trend: message.data.price > (this.lastPrice || message.data.price) ? 'up' : 'down'
            };
            this.lastPrice = message.data.price;
          }
        }
        break;
        
      case 'ticker':
        // Handle ticker format (legacy support)
        if (message.data) {
          this.cachedMarketData = {
            price: parseFloat(message.data.price),
            volume: message.data.volume || 1000,
            timestamp: message.data.timestamp || Date.now(),
            symbol: message.data.symbol || 'BTC-USD'
          };
          this.lastDataReceived = Date.now();
          console.log(`📈 Ticker update: ${this.cachedMarketData.symbol} $${this.cachedMarketData.price.toFixed(2)}`);
        }
        break;
        
      case 'status':
        console.log(`📋 Status message received:`, message.data);
        break;
        
      case 'heartbeat':
        console.log(`💓 Heartbeat received at ${new Date().toLocaleTimeString()}`);
        // Heartbeats may also contain price data
        if (message.price) {
          console.log(`   💵 Heartbeat price: $${message.price}`);
        }
        break;
        
      default:
        console.log(`❓ Unknown message type: ${message.type}`);
        // Try to extract price data from any message format
        if (message.price) {
          this.cachedMarketData = {
            price: parseFloat(message.price),
            volume: 1000,
            timestamp: message.timestamp || Date.now(),
            symbol: message.symbol || 'BTC-USD'
          };
          this.lastDataReceived = Date.now();
          console.log(`💸 Price extracted: $${this.cachedMarketData.price.toFixed(2)}`);
        }
    }
  } catch (error) {
    console.error('❌ Error parsing WebSocket message:', error);
    console.error('Raw data was:', data.toString());
  }
});

// ALSO ADD THIS METHOD to handle market data properly:
handleMarketData(data) {
  console.log(`📊 Handling market data: ${data.symbol} @ $${data.price}`);
  
  // Store the latest data
  this.latestMarketData = {
    price: parseFloat(data.price),
