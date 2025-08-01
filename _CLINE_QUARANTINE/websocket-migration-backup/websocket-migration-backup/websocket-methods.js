  connectToSSLServer() {
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:8001');
    
    ws.on('open', () => {
      console.log('✅ Connected to SSL server data feed!');
    });
    
    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'ticker' || parsed.ticker) {
          this.handleMarketData({
            symbol: parsed.ticker || parsed.symbol,
            price: parsed.price,
            timestamp: parsed.timestamp || Date.now()
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
      setTimeout(() => this.connectToSSLServer(), 5000);
    });
    
    this.sslServerConnection = ws;
  }

  handleMarketData(data) {
    this.latestMarketData = {
      price: parseFloat(data.price),
      symbol: data.symbol,
      timestamp: data.timestamp,
      volume: data.volume || 0,
      rsi: 50,
      macd: 0,
      trend: data.price > (this.lastPrice || data.price) ? 'up' : 'down'
    };
    
    this.lastPrice = data.price;
    
    if (this.latestMarketData && this.patternEngine) {
      this.patternEngine.addDataPoint({
        timestamp: Date.now(),
        price: this.latestMarketData.price,
        volume: this.latestMarketData.volume
      });
    }
  }
