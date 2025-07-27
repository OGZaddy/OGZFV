// Add this to the trading bot class

  // Store latest market data from SSL server
  latestMarketData = null;

  // Handle incoming market data from SSL server
  handleMarketData(data) {
    // console.log(`📊 Received market data: ${data.symbol} @ $${data.price}`);
    
    // Store the latest data
    this.latestMarketData = {
      price: parseFloat(data.price),
      symbol: data.symbol,
      timestamp: data.timestamp,
      volume: data.volume || 0,
      // Calculate simple indicators
      rsi: 50, // Default, should be calculated properly
      macd: 0,  // Default, should be calculated properly
      trend: data.price > (this.lastPrice || data.price) ? 'up' : 'down'
    };
    
    this.lastPrice = data.price;
    
    // If we have ticker data, trigger pattern analysis
    if (this.latestMarketData && this.patternEngine) {
      this.patternEngine.addDataPoint({
        timestamp: Date.now(),
        price: this.latestMarketData.price,
        volume: this.latestMarketData.volume
      });
    }
  }

  // Modified getMarketData to use cached data
  async getMarketDataCached() {
    if (!this.latestMarketData) {
      console.error('❌ No ticker data received from Polygon');
      return null;
    }
    
    // Return cached data with age check
    const dataAge = Date.now() - this.latestMarketData.timestamp;
    if (dataAge > 60000) { // Data older than 1 minute
      console.warn('⚠️ Market data is stale (>1 minute old)');
    }
    
    return this.latestMarketData;
  }
