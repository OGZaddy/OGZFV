  async getMarketData() {
    // Use cached data from SSL server instead of direct API call
    if (!this.latestMarketData) {
      console.error('❌ No ticker data received from Polygon');
      return null;
    }
    
    const dataAge = Date.now() - this.latestMarketData.timestamp;
    if (dataAge > 60000) {
      console.warn('⚠️ Market data is stale (>1 minute old)');
    }
    
    return this.latestMarketData;
  }
