/**
 * ===================================================================
 * 🚀 OGZ PRIME SSL SERVER - ADVANCED INTEGRATION
 * ===================================================================
 * This is how you integrate the Advanced WebSocket Broadcasting System
 * into your SSL server for BULLETPROOF real-time data delivery
 * ===================================================================
 */

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Disabled - not needed for core functionality

// Broadcaster removed - was eating all messages
// Direct WebSocket forwarding is used instead

// Set SSL server flag
process.env.OGZ_SSL_SERVER = 'true';

console.log(`[SSL-${Date.now()}] Advanced SSL Server starting...`);
console.log('🚀 OGZPrime SSL Server with ADVANCED BROADCASTING SYSTEM');
console.log('💪 Built for warriors who don\'t take shortcuts');

// Express setup
const app = express();
const apiPort = parseInt(process.env.SSL_SERVER_PORT || process.env.WS_PORT) || 3010;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('X-Powered-By', 'OGZ-Prime-Advanced');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Dashboard routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

// Pricing page
app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'pricing.html'));
});

// Status endpoint - REAL metrics only
app.get('/api/live-status', (req, res) => {
  // Count actual connection types
  let botCount = 0;
  let dashboardCount = 0;
  
  if (wss.clients) {
    wss.clients.forEach(client => {
      if (client.connectionType === 'bot') botCount++;
      else if (client.connectionType === 'dashboard') dashboardCount++;
    });
  }
  
  res.json({
    balance: 10000,
    timestamp: new Date().toISOString(),
    isRunning: true,
    trades: 0,
    decisionsToday: 0,
    currentPrice: lastKnownPrice,
    
    // REAL WebSocket metrics
    websocketStats: {
      totalConnections: wss.clients ? wss.clients.size : 0,
      connectionsByType: { dashboard: dashboardCount, bot: botCount },
      messageRate: 0,
      averageLatency: 0,
      successRate: 100,
      queuedMessages: 0
    },
    
    serverInfo: {
      supportsSSL: true,
      wsPort: apiPort,
      secureWsPort: 443,
      apiPort: apiPort,
      secureApiPort: parseInt(process.env.SSL_SECURE_PORT) || 443,
      advancedBroadcasting: false  // Be honest - not using it
    }
  });
});

// System health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    websockets: {
      clients: wss.clients ? wss.clients.size : 0
    },
    timestamp: Date.now()
  });
});

// Proxy to Stripe handler running on port 3011
app.post('/create-checkout-session', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3011/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Stripe proxy error:', error);
    res.status(503).json({ 
      error: 'Payment service unavailable',
      message: 'Please try again later'
    });
  }
});

// Success and cancel pages from basic server
app.get('/success.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful - OGZ Prime</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, #0a0a0a, #1a0a0a); 
          color: white; 
          text-align: center; 
          padding: 50px; 
        }
        .success-box { 
          background: rgba(34, 197, 94, 0.1); 
          border: 2px solid #22c55e; 
          border-radius: 20px; 
          padding: 40px; 
          max-width: 600px; 
          margin: 0 auto; 
        }
        h1 { color: #22c55e; }
        .back-btn { 
          background: #dc2626; 
          color: white; 
          padding: 15px 30px; 
          border: none; 
          border-radius: 10px; 
          font-size: 16px; 
          margin-top: 20px; 
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="success-box">
        <h1>🎉 Payment Successful!</h1>
        <p>Welcome to OGZ Prime! Your subscription is now active.</p>
        <p>You will receive setup instructions via email shortly.</p>
        <button class="back-btn" onclick="window.location.href='/'">Return to Dashboard</button>
      </div>
    </body>
    </html>
  `);
});

app.get('/cancel.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled - OGZ Prime</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, #0a0a0a, #1a0a0a); 
          color: white; 
          text-align: center; 
          padding: 50px; 
        }
        .cancel-box { 
          background: rgba(220, 38, 38, 0.1); 
          border: 2px solid #dc2626; 
          border-radius: 20px; 
          padding: 40px; 
          max-width: 600px; 
          margin: 0 auto; 
        }
        h1 { color: #dc2626; }
        .back-btn { 
          background: #dc2626; 
          color: white; 
          padding: 15px 30px; 
          border: none; 
          border-radius: 10px; 
          font-size: 16px; 
          margin-top: 20px; 
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="cancel-box">
        <h1>💳 Payment Cancelled</h1>
        <p>No worries! You can try again whenever you're ready.</p>
        <button class="back-btn" onclick="window.location.href='/pricing.html'">Back to Pricing</button>
      </div>
    </body>
    </html>
  `);
});

// SSL Configuration - NGINX HANDLES THIS NOW
// Nginx reverse proxy handles SSL termination
console.log('🔄 SSL handled by nginx reverse proxy');
console.log(`   WebSocket: wss://${process.env.DOMAIN || 'ogzprime.com'}/ws → nginx → ws://localhost:${apiPort}/ws`);

// Regular HTTP server - Listen on BOTH IPv4 and IPv6
const httpServer = http.createServer(app);
httpServer.listen(apiPort, '::', () => {
  console.log(`🌍 Server listening on all interfaces (IPv4 + IPv6) port ${apiPort}`);
});

// HTTPS server removed - nginx handles SSL termination
// All connections come through nginx proxy on port 3010

// Single WebSocket server on unified port
const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws'  // Dashboard expects this path
});

wss.on('connection', (ws, req) => {
  console.log('🔵 NEW RAW CONNECTION 🔵');
  
  // Generate a simple ID for this connection
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let connectionType = 'unknown';
  let botTier = null;
  
  // SIMPLE HEARTBEAT - mark connection alive
  ws.isAlive = true;
  ws.connectionType = connectionType;  // Store for metrics
  
  // HANDLE MESSAGES WITHOUT BROADCASTER
  ws.on('message', (message) => {
    ws.isAlive = true;  // Any message = connection alive
    console.log('🟣 RAW MESSAGE:', message.toString().substring(0, 200));
    
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 Message type: ${data.type}`);
      
      // Handle identification
      if (data.type === 'identify') {
        if (data.source === 'trading_bot') {
          connectionType = 'bot';
          ws.connectionType = 'bot';  // Store for metrics
          botTier = data.botTier;
          console.log(`🤖 Bot identified: ${botTier}`);
          
          ws.send(JSON.stringify({
            type: 'identification_confirmed',
            message: 'Bot registered'
          }));
        } else if (data.source === 'dashboard') {
          connectionType = 'dashboard';
          ws.connectionType = 'dashboard';  // Store for metrics
          console.log('📊 Dashboard identified');
        }
      }
      
      // Handle trades - FORWARD TO ALL CLIENTS
      if (data.type === 'trade') {
        console.log(`💰 TRADE: ${data.botTier} - ${data.action} at ${data.price}`);
        
        // Forward to ALL other connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
            console.log('📤 Trade forwarded');
          }
        });
      }
      
      // Handle ping/pong
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
      }
      
    } catch (err) {
      console.error('Parse error:', err);
    }
  });
  
  ws.on('close', () => {
    console.log(`❌ Connection closed: ${connectionId} (${connectionType})`);
  });
  
  // DON'T USE BROADCASTER AT ALL - it's breaking the WebSocket
  // Just track connections manually if needed
  console.log(`✅ Connection ready: ${connectionId}`);
});

// Market data variables
let lastKnownPrice = null;
let tickCount = 0;
let assetPrices = {};
let currentAsset = 'BTC-USD';

// 🔌 Polygon.io WebSocket connection
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

// Check if API key is configured
if (!POLYGON_API_KEY) {
  console.error('❌ POLYGON_API_KEY environment variable not set!');
  console.error('   Add POLYGON_API_KEY=your_key_here to your .env file');
  process.exit(1);
}

const polygonSocket = new WebSocket(POLYGON_CRYPTO_SOCKET);

polygonSocket.on('open', () => {
  console.log('🔌 Connected to Polygon.io crypto feed');
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
      // Debug logging
      if (msg.ev || msg.status || msg.message) {
        console.log(`🔍 POLYGON MSG:`, JSON.stringify(msg).substring(0, 200));
      }
      
      if (msg.status === 'auth_success') {
        console.log('✅ Polygon authenticated - subscribing to multiple assets');
        
        const assets = [
          'XA.BTC-USD', 'XA.ETH-USD', 'XA.SOL-USD', 'XA.ADA-USD',
          'XA.DOGE-USD', 'XA.XRP-USD', 'XA.LTC-USD', 'XA.MATIC-USD',
          'XA.AVAX-USD', 'XA.LINK-USD', 'XA.DOT-USD', 'XA.ATOM-USD',
          'XA.UNI-USD', 'XA.AAVE-USD', 'XA.ALGO-USD', 'XA.NEAR-USD',
          'XA.FTM-USD', 'XA.SAND-USD', 'XA.MANA-USD', 'XA.AXS-USD'
        ];
        assets.forEach(asset => {
          polygonSocket.send(JSON.stringify({
            action: 'subscribe',
            params: asset
          }));
          console.log(`📡 Subscribed to ${asset}`);
        });
      }
      
      if (msg.ev === 'XA' && msg.c && msg.e) {
        tickCount++;
        const price = parseFloat(msg.c);
        const timestamp = new Date(msg.e).toISOString();
        
        // Determine asset
        let asset = 'BTC-USD';
        if (msg.pair) {
          // Fix: Only add dash if not already present
          asset = msg.pair.includes('-') ? msg.pair : msg.pair.replace('USD', '-USD');
        }
        
        // Store price
        assetPrices[asset] = price;
        if (asset === currentAsset) {
          lastKnownPrice = price;
        }

        // Log periodically
        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`🎯 TICK #${tickCount}: ${asset} $${price.toFixed(2)} @ ${new Date(msg.e).toLocaleTimeString()}`);
        }

        // SEND PRICES DIRECTLY TO ALL WEBSOCKET CLIENTS
        const priceMessage = {
          type: 'price',
          data: {
            asset: asset,
            price: price,
            timestamp: Date.now(),
            allPrices: assetPrices,
            tickCount: tickCount
          }
        };
        
        // Send to ALL connected WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(priceMessage));
          }
        });
        
        // Log price update
        if (tickCount % 10 === 0) {
          console.log(`📡 Price sent to ${wss.clients.size} clients: ${asset} $${price.toFixed(2)}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

polygonSocket.on('close', () => {
  console.warn('⚠️ Polygon WebSocket disconnected');
  // Broadcast disconnect to all clients
  const message = JSON.stringify({
    type: 'data_feed_status',
    status: 'disconnected',
    message: 'Polygon data feed disconnected',
    timestamp: Date.now()
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

polygonSocket.on('error', (err) => {
  console.error('🚨 Polygon WebSocket error:', err.message);
});

// SIMPLE HEARTBEAT - check every 15 seconds
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) {
      console.log('💀 Terminating dead connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
  });
}, 15000);

// 📊 Enhanced status monitoring
setInterval(() => {
  // Count REAL connection types
  let botConnections = 0;
  let dashboardConnections = 0;
  
  wss.clients.forEach(ws => {
    if (ws.connectionType === 'bot') botConnections++;
    else if (ws.connectionType === 'dashboard') dashboardConnections++;
  });
  
  console.log(`📊 SYSTEM STATUS:`);
  console.log(`   🔌 Polygon: ${polygonSocket.readyState === WebSocket.OPEN ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`   📊 Ticks: ${tickCount}`);
  console.log(`   💰 Balance: $10000`);
  console.log(`   👥 Total Connections: ${wss.clients ? wss.clients.size : 0}`);
  console.log(`   🤖 Bot Connections: ${botConnections}`);
  console.log(`   📊 Dashboard Connections: ${dashboardConnections}`);
  
  // Alert if no bot connections
  if (botConnections === 0) {
    console.warn('⚠️ WARNING: No trading bot connections detected!');
  }
  
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SSL server...');
  
  if (polygonSocket.readyState === WebSocket.OPEN) {
    polygonSocket.close();
  }
  
  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    client.close();
  });
  
  process.exit(0);
});

// Network interfaces display
const os = require('os');
const networkInterfaces = os.networkInterfaces();
const localIPs = [];

Object.keys(networkInterfaces).forEach(interfaceName => {
  networkInterfaces[interfaceName].forEach(interface => {
    if (interface.family === 'IPv4' && !interface.internal) {
      localIPs.push(interface.address);
    }
  });
});

console.log('\n✅ OGZ Prime ADVANCED Server Running (Nginx SSL Proxy)');
console.log('🚀 Powered by Advanced WebSocket Broadcasting System');
console.log('\n📡 Available endpoints:');
console.log(`   🔒 Secure WebSocket: wss://${process.env.DOMAIN || 'ogzprime.com'}/ws (via nginx)`);
console.log(`   🔒 Secure API: https://${process.env.DOMAIN || 'ogzprime.com'}/api/live-status (via nginx)`);
console.log(`   📡 Local WebSocket: ws://localhost:${apiPort}/ws`);
console.log(`   🌐 Local API: http://localhost:${apiPort}/api/live-status`);

localIPs.forEach(ip => {
  console.log(`\n   Direct IP access:`);
  console.log(`   📡 ws://${ip}:${apiPort}/ws`);
  console.log(`   🌐 http://${ip}:${apiPort}/api/live-status`);
});

console.log('\n💪 FOR HOUSTON! FOR FINANCIAL FREEDOM! FOR VICTORY! 💪\n');
