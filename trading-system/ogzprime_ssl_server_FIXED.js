// ogzprime_ssl_server_FIXED.js
// STRIPPED DOWN VERSION - NO BROADCASTER BULLSHIT
// This WILL forward prices to your bots

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

console.log('🚀 OGZPrime SSL Server - LEAN AND MEAN VERSION');
console.log('💪 No bullshit, just price forwarding');

// Express setup
const app = express();
const apiPort = parseInt(process.env.SSL_SERVER_PORT || process.env.WS_PORT) || 3010;

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
    res.json({ status: 'running', message: 'Dashboard not found but server is running' });
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

// Create WebSocket server - SIMPLE, NO BROADCASTER
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  perMessageDeflate: false  // Disable compression for speed
});

// Track connections
let connectionId = 0;
const connections = new Map();

// Price tracking
let lastKnownPrice = null;
let tickCount = 0;
let assetPrices = {};
let polygonConnected = false;

// WebSocket connection handler - SIMPLIFIED
wss.on('connection', (ws, req) => {
  const id = ++connectionId;
  const clientIp = req.socket.remoteAddress;
  
  console.log(`✅ Client #${id} connected from ${clientIp}`);
  connections.set(id, { ws, type: 'unknown', tier: null });
  
  // Send immediate confirmation
  ws.send(JSON.stringify({
    type: 'connection_confirmed',
    id: id,
    message: 'Connected to OGZPrime SSL Server'
  }));
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Identify client type
      if (data.type === 'identify') {
        const conn = connections.get(id);
        if (data.source === 'trading_bot') {
          conn.type = 'bot';
          conn.tier = data.botTier;
          console.log(`🤖 Bot identified: ${data.botTier} tier`);
          
          // Send current price immediately if we have it
          if (lastKnownPrice) {
            ws.send(JSON.stringify({
              type: 'price',
              data: {
                asset: 'BTC-USD',
                price: lastKnownPrice,
                timestamp: Date.now(),
                allPrices: assetPrices
              }
            }));
          }
        } else if (data.source === 'dashboard') {
          conn.type = 'dashboard';
          console.log('📊 Dashboard identified');
        }
      }
      
      // Forward trades to all clients
      if (data.type === 'trade') {
        console.log(`💰 Trade: ${data.botTier} ${data.action} @ ${data.price}`);
        broadcast(message.toString(), ws);  // Don't echo back to sender
      }
      
      // Respond to pings
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
      
    } catch (err) {
      console.error(`Error handling message from #${id}:`, err.message);
    }
  });
  
  ws.on('close', () => {
    console.log(`❌ Client #${id} disconnected`);
    connections.delete(id);
  });
  
  ws.on('error', (err) => {
    console.error(`Client #${id} error:`, err.message);
  });
});

// Simple broadcast function
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

// POLYGON CONNECTION - FIXED FORMAT
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
  console.error('❌ POLYGON_API_KEY not set in .env file!');
  console.error('Add: POLYGON_API_KEY=your_key_here');
  process.exit(1);
}

const polygonSocket = new WebSocket('wss://socket.polygon.io/crypto');

polygonSocket.on('open', () => {
  console.log('📡 Connected to Polygon.io');
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
      // Log important messages
      if (msg.status || msg.message) {
        console.log('📨 Polygon:', msg.status || msg.message);
      }
      
      // Handle auth success
      if (msg.status === 'auth_success') {
        polygonConnected = true;
        console.log('✅ Polygon authenticated! Subscribing to crypto feeds...');
        
        // CORRECT SUBSCRIPTION FORMAT FOR CRYPTO
        const symbols = [
          'X:BTCUSD',   // Bitcoin
          'X:ETHUSD',   // Ethereum  
          'X:SOLUSD',   // Solana
          'X:ADAUSD',   // Cardano
          'X:DOGEUSD',  // Dogecoin
        ];
        
        symbols.forEach(symbol => {
          polygonSocket.send(JSON.stringify({
            action: 'subscribe',
            params: symbol
          }));
          console.log(`  📊 Subscribed to ${symbol}`);
        });
      }
      
      // Handle subscription confirmations
      if (msg.status === 'success' && msg.message) {
        console.log(`  ✓ ${msg.message}`);
      }
      
      // HANDLE CRYPTO TRADES - Event type 'X'
      if (msg.ev === 'X' && msg.p && msg.t) {
        tickCount++;
        const price = parseFloat(msg.p);  // p = price
        const symbol = msg.sym || 'UNKNOWN';
        const timestamp = msg.t;  // Unix timestamp in milliseconds
        
        // Normalize symbol (X:BTCUSD -> BTC-USD)
        let asset = symbol.replace('X:', '').replace('USD', '-USD');
        
        // Store price
        assetPrices[asset] = price;
        if (asset.includes('BTC')) {
          lastKnownPrice = price;
        }
        
        // Log every 10th tick or first 5
        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`💰 TICK #${tickCount}: ${asset} = ${price.toFixed(2)}`);
        }
        
        // CREATE PRICE MESSAGE
        const priceMessage = JSON.stringify({
          type: 'price',
          data: {
            asset: asset,
            price: price,
            timestamp: timestamp,
            allPrices: assetPrices,
            tickCount: tickCount
          }
        });
        
        // BROADCAST TO ALL CLIENTS
        const sent = broadcast(priceMessage);
        if (sent > 0 && (tickCount % 10 === 0 || tickCount <= 5)) {
          console.log(`  📤 Sent to ${sent} clients`);
        }
      }
      
      // Also handle XA (aggregate) format if Polygon sends it
      if (msg.ev === 'XA' && msg.c) {
        // XA uses 'c' for close price
        const price = parseFloat(msg.c);
        const symbol = msg.pair || 'BTC-USD';
        
        // Store and broadcast same as above
        assetPrices[symbol] = price;
        if (symbol.includes('BTC')) {
          lastKnownPrice = price;
        }
        
        const priceMessage = JSON.stringify({
          type: 'price',
          data: {
            asset: symbol,
            price: price,
            timestamp: Date.now(),
            allPrices: assetPrices,
            tickCount: ++tickCount
          }
        });
        
        broadcast(priceMessage);
      }
    }
  } catch (err) {
    console.error('Polygon message error:', err.message);
  }
});

polygonSocket.on('error', (err) => {
  console.error('❌ Polygon error:', err.message);
  polygonConnected = false;
});

polygonSocket.on('close', () => {
  console.log('❌ Polygon disconnected, reconnecting in 5s...');
  polygonConnected = false;
  setTimeout(() => {
    console.log('Reconnecting to Polygon...');
    // In production, implement proper reconnection
  }, 5000);
});

// Start server
server.listen(apiPort, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════╗
║   OGZPrime SSL Server RUNNING      ║
║                                    ║
║   HTTP API: http://0.0.0.0:${apiPort}   ║
║   WebSocket: ws://0.0.0.0:${apiPort}/ws ║
║                                    ║
║   Status: READY FOR WAR            ║
╚════════════════════════════════════╝
  `);
});

// Status monitor
setInterval(() => {
  const botCount = [...connections.values()].filter(c => c.type === 'bot').length;
  const dashCount = [...connections.values()].filter(c => c.type === 'dashboard').length;
  
  console.log(`📊 STATUS: Polygon:${polygonConnected ? '✅' : '❌'} | Bots:${botCount} | Dashboards:${dashCount} | Ticks:${tickCount} | BTC:${lastKnownPrice?.toFixed(2) || 'N/A'}`);
}, 30000);

// Clean shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  wss.clients.forEach(client => client.close());
  polygonSocket.close();
  server.close(() => {
    console.log('✅ Server shut down');
    process.exit(0);
  });
});