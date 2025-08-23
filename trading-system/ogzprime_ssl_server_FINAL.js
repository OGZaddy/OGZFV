// ogzprime_ssl_server_FINAL.js
// This uses the EXACT format that was working before
// NO BROADCASTER, JUST DIRECT FORWARDING

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

console.log('🚀 OGZPrime SSL Server - FINAL WORKING VERSION');
console.log('Using the format that was working before!\n');

// Express setup
const app = express();
const apiPort = 3010;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Serve dashboard
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  const dashboardPath = path.join(__dirname, 'ogz-ultimate-dashboard.html');
  if (require('fs').existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.json({ status: 'running' });
  }
});

// Status endpoint
app.get('/api/live-status', (req, res) => {
  res.json({
    status: 'running',
    polygonConnected: polygonConnected,
    wsClients: wss.clients.size,
    lastPrice: lastKnownPrice,
    tickCount: tickCount,
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  perMessageDeflate: false
});

// Track connections
let connectionId = 0;
const connections = new Map();

// Price tracking
let lastKnownPrice = null;
let tickCount = 0;
let assetPrices = {};
let polygonConnected = false;

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const id = ++connectionId;
  console.log(`✅ Client #${id} connected`);
  connections.set(id, ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'identify') {
        if (data.source === 'trading_bot') {
          console.log(`🤖 Bot identified: ${data.botTier} tier`);
          
          // Send current price if we have it
          if (lastKnownPrice) {
            ws.send(JSON.stringify({
              type: 'price',
              data: {
                asset: 'BTC-USD',
                price: lastKnownPrice,
                timestamp: Date.now()
              }
            }));
          }
        }
      }
      
      // Forward trades to all
      if (data.type === 'trade') {
        console.log(`💰 Trade: ${data.action} @ ${data.price}`);
        broadcast(message.toString(), ws);
      }
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      
    } catch (err) {
      console.error('Parse error:', err.message);
    }
  });
  
  ws.on('close', () => {
    console.log(`❌ Client #${id} disconnected`);
    connections.delete(id);
  });
});

// Broadcast function
function broadcast(message, exclude = null) {
  let sent = 0;
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });
  return sent;
}

// POLYGON CONNECTION - USING THE FORMAT THAT WORKED!
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
  console.error('❌ POLYGON_API_KEY not set!');
  process.exit(1);
}

const polygonSocket = new WebSocket('wss://socket.polygon.io/crypto');

polygonSocket.on('open', () => {
  console.log('📡 Connected to Polygon');
  
  polygonSocket.send(JSON.stringify({
    action: 'auth',
    params: POLYGON_API_KEY
  }));
});

polygonSocket.on('message', (data) => {
  try {
    const messages = JSON.parse(data);
    const msgArray = Array.isArray(messages) ? messages : [messages];
    
    for (const msg of msgArray) {
      // Log status messages
      if (msg.status) {
        console.log('📨 Polygon:', msg.status, msg.message || '');
      }
      
      // Handle auth success - USE THE WORKING FORMAT!
      if (msg.status === 'auth_success') {
        polygonConnected = true;
        console.log('✅ Authenticated! Using the format that worked before...');
        
        // THESE ARE THE FORMATS THAT WERE WORKING:
        const aggregateSymbols = [
          'XA.BTC-USD',
          'XA.ETH-USD',
          'XA.SOL-USD'
        ];
        
        const tradeSymbols = [
          'XT.X:BTC-USD',
          'XT.X:ETH-USD'
        ];
        
        // Subscribe to aggregates
        aggregateSymbols.forEach(symbol => {
          polygonSocket.send(JSON.stringify({
            action: 'subscribe',
            params: symbol
          }));
          console.log(`  📊 Subscribing to ${symbol} (aggregates)`);
        });
        
        // Subscribe to trades
        setTimeout(() => {
          tradeSymbols.forEach(symbol => {
            polygonSocket.send(JSON.stringify({
              action: 'subscribe',
              params: symbol
            }));
            console.log(`  📊 Subscribing to ${symbol} (trades)`);
          });
        }, 1000);
      }
      
      // HANDLE AGGREGATES - THE FORMAT THAT WAS WORKING
      if (msg.ev === 'XA' && msg.c && msg.e) {
        tickCount++;
        const price = parseFloat(msg.c);  // Close price
        const timestamp = msg.e;  // End timestamp
        
        // Get symbol from pair field
        let asset = 'BTC-USD';
        if (msg.pair) {
          asset = msg.pair.includes('-') ? 
            msg.pair : msg.pair.replace('USD', '-USD');
        }
        
        // Store price
        assetPrices[asset] = price;
        if (asset.includes('BTC')) {
          lastKnownPrice = price;
        }
        
        // Log periodically
        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`💰 TICK #${tickCount}: ${asset} = ${price.toFixed(2)} (aggregate)`);
        }
        
        // Broadcast to all clients
        const priceMessage = JSON.stringify({
          type: 'price',
          data: {
            asset: asset,
            price: price,
            timestamp: timestamp,
            tickCount: tickCount
          }
        });
        
        broadcast(priceMessage);
      }
      
      // HANDLE TRADES - ALSO FROM YOUR WORKING CODE
      if (msg.ev === 'XT' && msg.p && msg.t) {
        tickCount++;
        const price = parseFloat(msg.p);  // Trade price
        const timestamp = msg.t;
        const symbol = msg.sym || 'BTC-USD';
        
        // Normalize symbol
        let asset = symbol.replace('X:', '').replace('USD', '-USD');
        if (!asset.includes('-')) {
          asset = asset.replace('USD', '-USD');
        }
        
        // Store price
        assetPrices[asset] = price;
        if (asset.includes('BTC')) {
          lastKnownPrice = price;
        }
        
        // Log periodically
        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`💰 TICK #${tickCount}: ${asset} = ${price.toFixed(2)} (trade)`);
        }
        
        // Broadcast
        const priceMessage = JSON.stringify({
          type: 'price',
          data: {
            asset: asset,
            price: price,
            timestamp: timestamp,
            tickCount: tickCount
          }
        });
        
        broadcast(priceMessage);
      }
    }
  } catch (err) {
    console.error('Message error:', err.message);
  }
});

polygonSocket.on('error', (err) => {
  console.error('❌ Polygon error:', err.message);
  polygonConnected = false;
});

polygonSocket.on('close', () => {
  console.log('❌ Polygon disconnected');
  polygonConnected = false;
});

// Start server
server.listen(apiPort, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════╗
║   OGZPrime Server RUNNING          ║
║                                    ║
║   Port: ${apiPort}                       ║
║   Using WORKING Polygon format     ║
║                                    ║
║   XA.BTC-USD for aggregates       ║
║   XT.X:BTC-USD for trades         ║
╚════════════════════════════════════╝
  `);
});

// Status monitor
setInterval(() => {
  const botCount = [...connections.values()].filter(c => c.botTier).length;
  console.log(`📊 STATUS: Polygon:${polygonConnected ? '✅' : '❌'} | Clients:${wss.clients.size} | Ticks:${tickCount} | BTC:${lastKnownPrice?.toFixed(2) || 'N/A'}`);
}, 30000);