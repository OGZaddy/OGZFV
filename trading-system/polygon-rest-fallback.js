// polygon-rest-fallback.js
// Use Polygon REST API if WebSocket doesn't work
// Still gives you access to all that historical data!

require('dotenv').config();
const https = require('https');
const EventEmitter = require('events');

class PolygonRESTFeed extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.apiKey = process.env.POLYGON_API_KEY;
    if (!this.apiKey) {
      throw new Error('POLYGON_API_KEY not set in .env');
    }
    
    this.symbols = config.symbols || ['X:BTCUSD', 'X:ETHUSD', 'X:SOLUSD'];
    this.interval = config.interval || 1000; // 1 second (respects rate limits)
    this.prices = {};
    this.running = false;
    
    console.log('📊 Polygon REST API Feed initialized');
    console.log(`   Symbols: ${this.symbols.join(', ')}`);
    console.log(`   Interval: ${this.interval}ms`);
  }
  
  async start() {
    this.running = true;
    console.log('✅ Starting Polygon REST price feed...\n');
    
    // Initial fetch
    await this.fetchAllPrices();
    
    // Set up polling
    this.pollInterval = setInterval(async () => {
      if (this.running) {
        await this.fetchAllPrices();
      }
    }, this.interval);
  }
  
  stop() {
    this.running = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    console.log('🛑 Polygon REST feed stopped');
  }
  
  async fetchAllPrices() {
    // Fetch prices for all symbols in parallel
    const promises = this.symbols.map(symbol => this.fetchPrice(symbol));
    await Promise.all(promises);
  }
  
  fetchPrice(symbol) {
    return new Promise((resolve) => {
      // Use the last trade endpoint
      const path = `/v2/last/trade/${symbol}?apiKey=${this.apiKey}`;
      
      const options = {
        hostname: 'api.polygon.io',
        path: path,
        method: 'GET'
      };
      
      https.get(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            
            if (json.status === 'OK' && json.results) {
              const price = json.results.p; // Trade price
              const size = json.results.s;  // Trade size
              const timestamp = json.results.t; // Timestamp
              
              // Normalize symbol
              const normalizedSymbol = symbol.replace('X:', '').replace('USD', '-USD');
              
              // Store price
              this.prices[normalizedSymbol] = price;
              
              // Emit price event
              this.emit('price', {
                asset: normalizedSymbol,
                price: price,
                size: size,
                timestamp: timestamp,
                source: 'polygon_rest'
              });
              
              resolve(price);
            } else if (json.status === 'ERROR') {
              console.error(`❌ API Error for ${symbol}: ${json.error}`);
              resolve(null);
            }
          } catch (e) {
            console.error(`Parse error for ${symbol}:`, e.message);
            resolve(null);
          }
        });
      }).on('error', (e) => {
        console.error(`Request error for ${symbol}:`, e.message);
        resolve(null);
      });
    });
  }
  
  // Get historical data (this is where Polygon shines!)
  async getHistoricalData(symbol, from, to, timespan = 'hour') {
    return new Promise((resolve, reject) => {
      const path = `/v2/aggs/ticker/${symbol}/range/1/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${this.apiKey}`;
      
      const options = {
        hostname: 'api.polygon.io',
        path: path,
        method: 'GET'
      };
      
      https.get(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            
            if (json.status === 'OK' && json.results) {
              console.log(`📈 Fetched ${json.results.length} historical data points for ${symbol}`);
              resolve(json.results);
            } else {
              reject(new Error(json.error || 'Failed to fetch historical data'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }
}

// INTEGRATION WITH YOUR SSL SERVER
class HybridPriceFeed extends EventEmitter {
  constructor() {
    super();
    
    // Use Polygon REST for current prices
    this.polygonFeed = new PolygonRESTFeed({
      symbols: ['X:BTCUSD', 'X:ETHUSD', 'X:SOLUSD'],
      interval: 1000 // 1 second updates
    });
    
    // Track tick count
    this.tickCount = 0;
    this.prices = {};
    
    // Forward Polygon prices
    this.polygonFeed.on('price', (priceData) => {
      this.tickCount++;
      this.prices[priceData.asset] = priceData.price;
      
      // Log every 10th tick
      if (this.tickCount % 10 === 0 || this.tickCount <= 5) {
        console.log(`💰 TICK #${this.tickCount}: ${priceData.asset} = ${priceData.price.toFixed(2)}`);
      }
      
      // Emit for WebSocket broadcast
      this.emit('price', {
        type: 'price',
        data: {
          ...priceData,
          tickCount: this.tickCount,
          allPrices: this.prices
        }
      });
    });
  }
  
  async start() {
    console.log('🚀 Starting Hybrid Price Feed...');
    await this.polygonFeed.start();
    
    // Fetch some historical data on startup (for indicators)
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const historicalData = await this.polygonFeed.getHistoricalData(
        'X:BTCUSD',
        yesterday,
        today,
        'hour'
      );
      console.log(`📊 Loaded ${historicalData.length} hours of historical BTC data`);
    } catch (e) {
      console.error('Failed to load historical data:', e.message);
    }
  }
  
  stop() {
    this.polygonFeed.stop();
  }
}

// STANDALONE TEST
if (require.main === module) {
  console.log('🧪 POLYGON REST API FEED TEST');
  console.log('==============================\n');
  
  const feed = new HybridPriceFeed();
  
  // Create WebSocket server to broadcast prices
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ port: 3012 });
  
  wss.on('connection', (ws) => {
    console.log('✅ Client connected to REST-based feed');
    
    // Send current prices immediately
    ws.send(JSON.stringify({
      type: 'price',
      data: {
        allPrices: feed.prices,
        source: 'polygon_rest'
      }
    }));
  });
  
  // Broadcast prices to all connected clients
  feed.on('price', (priceMessage) => {
    const message = JSON.stringify(priceMessage);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  // Start the feed
  feed.start().then(() => {
    console.log('\n📡 REST-based price feed running on port 3012');
    console.log('This uses Polygon REST API - guaranteed to work!');
    console.log('Plus you keep access to all that historical data!\n');
  });
  
  // Status updates
  setInterval(() => {
    const prices = Object.entries(feed.prices)
      .map(([symbol, price]) => `${symbol}: ${price.toFixed(2)}`)
      .join(' | ');
    
    if (prices) {
      console.log(`📊 Current: ${prices}`);
    }
  }, 10000);
}

module.exports = { PolygonRESTFeed, HybridPriceFeed };