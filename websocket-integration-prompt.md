# OGZPrime Trading Bot - WebSocket Integration Issue

## Critical Context: Recent Fixes Made

### IMPORTANT: Port Conflict Resolution
The trading bot was creating its own WebSocket server on port 8080/8002, which was conflicting with the SSL server. We've already:
1. Removed the bot's own WebSocket server creation
2. Fixed the port conflicts between components
3. The SSL server is the ONLY WebSocket server running on port 8001

### Current Working Architecture:
1. **SSL Server** (`ogzprime_ssl_server.js`) - Running on port 8001
   - Successfully receiving live market data from Polygon.io
   - Broadcasting ticker data via WebSocket to connected clients
   - Logs show real data like "SOL--USD $186.41"
   - Currently shows "Regular Clients: 0" (no bot connected)

2. **Trading Bot** (`run-trading-bot-v13-simplified.js`)
   - NO LONGER creates its own WebSocket server (this was removed)
   - HTTP API still runs on port 3008
   - Currently tries to fetch data directly from Polygon API
   - Getting "No ticker data received from Polygon" errors
   - Needs to connect as a WebSocket CLIENT to the SSL server

## The Core Problem:
The trading bot is NOT connecting as a WebSocket client to the SSL server on port 8001. Instead, it's trying to make direct Polygon API calls which are failing.

## What Needs to Be Implemented:

### 1. Add WebSocket Client Properties
Add to the constructor after existing properties:
```javascript
// Add WebSocket properties
this.ws = null;
this.wsReconnectInterval = null;
this.wsReconnectDelay = 5000; // 5 seconds
this.cachedMarketData = {
  price: null,
  volume: 0,
  timestamp: null,
  symbol: null
};
this.wsConnected = false;
this.lastDataReceived = null;
```

### 2. Create WebSocket Connection Method
Add this new method to connect to the SSL server:
```javascript
connectWebSocket() {
  console.log('🔌 Connecting to SSL server WebSocket...');
  
  try {
    this.ws = new WebSocket('ws://localhost:8001');
    
    this.ws.on('open', () => {
      console.log('✅ WebSocket connected to SSL server');
      this.wsConnected = true;
      // Clear reconnection interval if exists
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle ticker messages from SSL server
        if (message.type === 'ticker' || message.ticker) {
          // Update cached market data
          this.cachedMarketData = {
            price: parseFloat(message.ticker || message.price),
            volume: message.volume || 1000,
            timestamp: message.timestamp || Date.now(),
            symbol: message.symbol || 'BTC-USD'
          };
          this.lastDataReceived = Date.now();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    this.ws.on('close', () => {
      console.log('WebSocket disconnected');
      this.wsConnected = false;
      this.scheduleReconnect();
    });
    
    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
    this.scheduleReconnect();
  }
}
```

### 3. Modify initialize() Method
Add WebSocket connection BEFORE other initializations:
```javascript
async initialize() {
  console.log('\n🚀 INITIALIZING OGZ PRIME V13 SIMPLIFIED...');
  
  try {
    // Connect to WebSocket FIRST
    this.connectWebSocket();
    
    // Wait a moment for initial data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ... rest of existing initialization code ...
```

### 4. Replace getMarketData() Method
The current method tries to call Polygon API directly. Replace it entirely with:
```javascript
async getMarketData() {
  // Check if we have recent cached data from WebSocket
  if (this.cachedMarketData.price && this.lastDataReceived) {
    const dataAge = Date.now() - this.lastDataReceived;
    
    // If data is less than 5 seconds old, use it
    if (dataAge < 5000) {
      return {
        success: true,
        data: {
          symbol: this.cachedMarketData.symbol,
          price: this.cachedMarketData.price,
          volume: this.cachedMarketData.volume,
          timestamp: this.cachedMarketData.timestamp,
          // Add calculated indicators
          rsi: 50, // Default, should be calculated from price history
          macd: 0,
          volatility: 0.02,
          trend: 'sideways'
        }
      };
    }
  }
  
  // If no recent data, return null
  console.warn('⚠️ No recent market data available from WebSocket');
  return null;
}
```

### 5. Add Graceful Shutdown
Add WebSocket cleanup to the shutdown method:
```javascript
async shutdown() {
  console.log('\n🛑 SHUTTING DOWN OGZ PRIME V13 SIMPLIFIED...');
  
  // Close WebSocket connection
  if (this.ws) {
    this.ws.close();
  }
  
  // Clear reconnection interval
  if (this.wsReconnectInterval) {
    clearInterval(this.wsReconnectInterval);
  }
  
  // ... rest of shutdown code ...
}
```

## Critical Notes:

1. **DO NOT** create a new WebSocket server in the bot - it should only be a CLIENT
2. The SSL server broadcasts messages in this format: `{type: 'ticker', ticker: price, symbol: 'BTC-USD', timestamp: ...}`
3. The bot's own WebSocket server code has been removed - don't add it back
4. Port 8001 is for the SSL server, port 3008 is for the bot's HTTP API
5. The `ws` package is already imported as `WebSocket`

## Expected Result After Implementation:
- Bot connects to SSL server on startup
- SSL server logs show "Regular Clients: 1"
- Bot receives real-time ticker data via WebSocket
- No more "No ticker data received from Polygon" errors
- Trading decisions based on live WebSocket data

## Testing Steps:
1. Start SSL server: `pm2 start ogz-ssl-server`
2. Check SSL server logs: `pm2 logs ogz-ssl-server`
3. Start trading bot: `pm2 start ogz-trading-bot`
4. Check bot logs for "✅ WebSocket connected to SSL server"
5. SSL server should show "Regular Clients: 1"
