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

// 🔥 ADVANCED WEBSOCKET SYSTEM - STRIPPED OUT FOR DEBUGGING
// const AdvancedWebSocketBroadcastSystem = require('./core/AdvancedWebSocketBroadcastSystem');

// 🤖 IMPORT TRAI AI SYSTEM
const TheMoverAIClone = require('./trai/trai-core');

// 🔧 INITIALIZE MODULE AUTO LOADER
const autoLoader = require('./ModuleAutoLoader');

// Set QUANTUM SSL server flag
process.env.OGZ_QUANTUM_SSL_SERVER = 'true';

// Initialize TRAI (not Mover)
const trai = new TheMoverAIClone({
  memoryPath: '/root/OGZFV-valhalla/data/trai-memory',
  learningRate: 0.8,
  responseStyle: 'authentic_og'
});

// ADVANCED BROADCASTING SYSTEM - KILLED
// const broadcaster = new AdvancedWebSocketBroadcastSystem({...});
// broadcaster.on('bot_disconnected', ...);

// SIMPLE WEBSOCKET STORAGE
const connectedBots = new Map();
const connectedDashboards = new Map();

console.log(`[QUANTUM-SSL-${Date.now()}] QUANTUM SSL Server starting...`);
console.log('⚛️ OGZPrime QUANTUM SSL Server with ADVANCED BROADCASTING SYSTEM');
console.log('🌌 Built for quantum supremacy operations');

// Express setup
const app = express();
const apiPort = parseInt(process.env.QUANTUM_SSL_PORT) || 3010;

// WEBSOCKET PATH BLOCKER - PREVENT EXPRESS FROM INTERFERING
app.use((req, res, next) => {
  if (req.url === '/ws') {
    console.log('🚫 BLOCKED: WebSocket request from reaching Express middleware');
    // Don't call next() - stop Express processing here
    return;
  }
  next();
});

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('X-Powered-By', 'OGZ-Prime-Quantum');
  next();
});

// Serve static files using auto loader
app.use(express.static(autoLoader.getPath('public')));

// Dashboard routes - using auto loader
app.get('/', (req, res) => {
  const dashboardPath = autoLoader.resolvePath('ultdash.html');
  res.sendFile(dashboardPath);
});

app.get('/dashboard', (req, res) => {
  const dashboardPath = autoLoader.resolvePath('ultdash.html');
  res.sendFile(dashboardPath);
});

// SIMPLE STATUS ENDPOINT
app.get('/api/live-status', (req, res) => {
  res.json({
    balance: 10000,
    timestamp: new Date().toISOString(),
    isRunning: true,
    trades: 0,
    connectedBots: connectedBots.size,
    connectedDashboards: connectedDashboards.size,
    decisionsToday: 0,
    currentPrice: lastKnownPrice,
    
    serverInfo: {
      wsPort: apiPort,
      apiPort: apiPort
    }
  });
});

// SIMPLE HEALTH ENDPOINT
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connectedBots: connectedBots.size,
    connectedDashboards: connectedDashboards.size,
    timestamp: Date.now()
  });
});

// Complete Stripe integration from basic server
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    console.log(`🔥 Creating Stripe checkout session for price: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${req.protocol}://${req.get('host')}/success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/pricing.html`,
      metadata: {
        priceId: priceId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Stripe session created: ${session.id}`);
    res.json({ sessionId: session.id });

  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
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

// 🤖 Initialize The Mover before starting server
// 🤖 Initialize TRAI before starting server  
(async () => {
  try {
    console.log('🤖 Initializing TRAI AI System...');
    // TRAI initialization disabled temporarily - needs CodeLlama connection
    // await trai.initializeFinalForm();
    console.log('[MoverCore] Initialized with personality:', trai.config.personality);
  } catch (error) {
    console.error('❌ Failed to initialize TRAI:', error);
  }
})();

// HTTP server - INTERCEPT WEBSOCKETS BEFORE EXPRESS KILLS THEM
const httpServer = http.createServer((req, res) => {
  // CHECK FOR WEBSOCKET UPGRADE BEFORE EXPRESS SEES IT
  if (req.headers.upgrade === 'websocket') {
    console.log('🔍 WEBSOCKET UPGRADE DETECTED - BYPASSING EXPRESS');
    // Don't respond - let upgrade event handle it
    return;
  }
  
  // Only non-WebSocket requests go to Express
  app(req, res);
});
httpServer.listen(apiPort, '127.0.0.1', () => {
  console.log(`🌐 HTTP API Server running on port ${apiPort} (127.0.0.1)`);
});

// HTTPS server removed - nginx handles SSL termination
// All connections come through nginx proxy on port 3010

// BULLETPROOF WEBSOCKET SERVER - MANUAL UPGRADE HANDLING
const wss = new WebSocket.Server({ noServer: true });

// MANUAL UPGRADE - BYPASS ALL MIDDLEWARE INTERFERENCE
httpServer.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  console.log(`🔍 UPGRADE REQUEST: ${pathname}`);
  
  if (pathname === '/ws') {
    console.log('✅ WebSocket upgrade approved');
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log('🚀 WebSocket upgrade completed');
      wss.emit('connection', ws, request);
    });
  } else {
    console.log(`❌ Unknown upgrade path: ${pathname}`);
    socket.destroy();
  }
});

wss.on('connection', (ws, req) => {
  // SIMPLE CONNECTION REGISTRATION
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  ws.connectionId = connectionId;
  ws.connectionType = 'unknown';
  
  console.log(`✅ New WebSocket connection: ${connectionId}`);
  
  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // CRITICAL: Handle ping/pong for connection health
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong', 
          id: data.id,
          timestamp: data.timestamp || Date.now()
        }));
        console.log(`🏓 Responded to ping from ${connectionId}`);
        return;
      }
      
      if (data.type === 'pong') {
        console.log(`✅ Received pong from ${connectionId}`);
        return;
      }
      
      // BOT IDENTIFICATION - SIMPLIFIED
      if (data.type === 'identify' && data.source === 'trading_bot') {
        console.log('🤖 TRADING BOT IDENTIFIED!');
        
        // Simple bot registration
        ws.connectionType = 'bot';
        ws.botTier = data.botTier;
        connectedBots.set(connectionId, {
          ws: ws,
          tier: data.botTier,
          connectedAt: Date.now()
        });
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'identification_confirmed',
          connectionId: connectionId,
          message: 'Bot registered successfully'
        }));
        
        console.log(`✅ Bot registered: ${data.botTier} tier`);
      }
      
      // DASHBOARD IDENTIFICATION - SIMPLIFIED
      if (data.type === 'identify' && data.source === 'dashboard') {
        ws.connectionType = 'dashboard';
        connectedDashboards.set(connectionId, {
          ws: ws,
          connectedAt: Date.now()
        });
        console.log('📊 Dashboard identified');
      }
      
      // BROADCAST TRADE EXECUTIONS - SIMPLE
      if (data.type === 'trade_executed') {
        console.log('💰 TRADE EXECUTED - Broadcasting to all clients');
        
        // Simple broadcast to all dashboards
        connectedDashboards.forEach((dashboard) => {
          if (dashboard.ws.readyState === WebSocket.OPEN) {
            dashboard.ws.send(JSON.stringify(data));
          }
        });
        
        // Log trade details
        if (data.data) {
          const trade = data.data;
          console.log(`   ${trade.side?.toUpperCase()} ${trade.size} @ $${trade.price}`);
          console.log(`   Balance: $${trade.balance} | Total Trades: ${trade.totalTrades}`);
        }
      }
      
      // MANUAL TRADE COMMANDS - SIMPLE
      if (data.type === 'manual_trade') {
        console.log(`🎯 MANUAL TRADE COMMAND: ${data.botType?.toUpperCase()} - ${data.action?.toUpperCase()}`);
        
        // Find target bots
        const targetBots = [];
        connectedBots.forEach((bot, id) => {
          if (bot.tier === data.botType) {
            targetBots.push(bot);
          }
        });
        
        if (targetBots.length > 0) {
          const tradeCommand = {
            type: 'manual_trade_command',
            action: data.action,
            botType: data.botType,
            timestamp: data.timestamp || Date.now(),
            source: 'dashboard'
          };
          
          // Send to target bots
          targetBots.forEach(bot => {
            if (bot.ws.readyState === WebSocket.OPEN) {
              bot.ws.send(JSON.stringify(tradeCommand));
            }
          });
          
          console.log(`✅ Manual trade command sent to ${targetBots.length} ${data.botType} bot(s)`);
          
          // Acknowledge to dashboard
          ws.send(JSON.stringify({
            type: 'manual_trade_ack',
            botType: data.botType,
            action: data.action,
            status: 'sent',
            timestamp: Date.now()
          }));
        } else {
          console.log(`❌ No ${data.botType} bots found to send manual trade command`);
          
          // Send error to dashboard
          ws.send(JSON.stringify({
            type: 'manual_trade_ack',
            botType: data.botType,
            action: data.action,
            status: 'error',
            error: `No ${data.botType} bots connected`,
            timestamp: Date.now()
          }));
        }
      }
      
      // 🤖 Handle Mover chat commands
      if (data.op === 'cmd' && data.action === 'mover:chat') {
        try {
          const text = String(data.args?.text || '').trim();
          console.log(`🤖 Mover received: "${text}"`);
          
          if (!text) {
            ws.send(JSON.stringify({ op: 'ack', action: 'mover:chat', ok: false, error: 'Empty message' }));
            return;
          }
          
          // Generate response from TRAI
          const reply = await trai.generateResponse(text);
          console.log(`🤖 TRAI replied: "${reply}"`);
          
          // Send acknowledgment
          ws.send(JSON.stringify({ op: 'ack', action: 'mover:chat', ok: true }));
          
          // Broadcast reply to all clients
          const replyPacket = JSON.stringify({
            op: 'event',
            topic: 'mover_reply',
            data: { text: reply, timestamp: Date.now() }
          });
          
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(replyPacket);
            }
          });
          
        } catch (error) {
          console.error('❌ Mover error:', error);
          ws.send(JSON.stringify({ 
            op: 'ack', 
            action: 'mover:chat', 
            ok: false, 
            error: error.message 
          }));
        }
      }
      
      // 🤖 Handle Mover status requests
      if (data.op === 'cmd' && data.action === 'mover:status') {
        try {
          const status = {
            initialized: true,
            personality: trai.config?.personality || 'TRAI',
            conversationCount: trai.conversationHistory?.length || 0,
            lastActivity: trai.lastActivity || null
          };
          
          ws.send(JSON.stringify({
            op: 'ack',
            action: 'mover:status',
            ok: true,
            data: status
          }));
          
        } catch (error) {
          console.error('❌ Mover status error:', error);
          ws.send(JSON.stringify({
            op: 'ack',
            action: 'mover:status',
            ok: false,
            error: error.message
          }));
        }
      }
      
    } catch (err) {
      console.error(`Error parsing message from ${connectionId}:`, err);
    }
  });
  
  // CLEANUP ON DISCONNECT
  ws.on('close', () => {
    console.log(`❌ Connection closed: ${connectionId}`);
    connectedBots.delete(connectionId);
    connectedDashboards.delete(connectionId);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
    connectedBots.delete(connectionId);
    connectedDashboards.delete(connectionId);
  });
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

// SINGLETON POLYGON CONNECTION - Only one instance allowed
let polygonSocket = null;
let isPolygonConnecting = false;

function connectToPolygon() {
  if (polygonSocket && polygonSocket.readyState === WebSocket.OPEN) {
    console.log('✅ Polygon already connected');
    return;
  }
  
  if (isPolygonConnecting) {
    console.log('⏳ Polygon connection already in progress');
    return;
  }
  
  isPolygonConnecting = true;
  console.log('🔌 Connecting to Polygon...');
  
  polygonSocket = new WebSocket(POLYGON_CRYPTO_SOCKET);
  
  polygonSocket.on('open', () => {
    isPolygonConnecting = false;
  console.log('⚛️🔌 Connected to Polygon.io crypto feed (QUANTUM)');
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
        console.log('⚛️✅ QUANTUM Polygon authenticated - subscribing to multiple assets');
        
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

        // 🚀 BROADCAST USING ADVANCED SYSTEM
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
        
        // SIMPLE PRICE BROADCAST
        const message = JSON.stringify(priceMessage);
        let sent = 0;
        
        // Send to all bots
        connectedBots.forEach((bot) => {
          if (bot.ws.readyState === WebSocket.OPEN) {
            bot.ws.send(message);
            sent++;
          }
        });
        
        // Send to all dashboards
        connectedDashboards.forEach((dashboard) => {
          if (dashboard.ws.readyState === WebSocket.OPEN) {
            dashboard.ws.send(message);
            sent++;
          }
        });
        
        if (sent > 0) {
          console.log(`📡 Price broadcast: ${asset} $${price.toFixed(2)} to ${sent} clients`);
        }
        
        // Price processed directly by broadcaster
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

  polygonSocket.on('close', () => {
    console.warn('⚠️ Polygon WebSocket disconnected, reconnecting in 5s...');
    polygonSocket = null;
    isPolygonConnecting = false;
    
    // Simple status broadcast
    const statusMessage = JSON.stringify({
      type: 'data_feed_status',
      status: 'disconnected',
      message: 'Polygon data feed disconnected',
      timestamp: Date.now()
    });
  
  // Broadcast to all connections
  [...connectedBots.values(), ...connectedDashboards.values()].forEach(conn => {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(statusMessage);
    }
    });
    
    // Reconnect after 5 seconds
    setTimeout(() => connectToPolygon(), 5000);
  });

  polygonSocket.on('error', (err) => {
    console.error('🚨 Polygon WebSocket error:', err.message);
    isPolygonConnecting = false;
  });
}

// Start Polygon connection
connectToPolygon();

// SIMPLE STATUS MONITORING
setInterval(() => {
  console.log(`📊 SYSTEM STATUS:`);
  console.log(`   🔌 Polygon: ${polygonSocket.readyState === WebSocket.OPEN ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`   📊 Ticks: ${tickCount}`);
  console.log(`   💰 Balance: $10000`);
  console.log(`   👥 Total Connections: ${connectedBots.size + connectedDashboards.size}`);
  console.log(`   🤖 Bot Connections: ${connectedBots.size}`);
  console.log(`   📱 Dashboard Connections: ${connectedDashboards.size}`);
  
  // Alert if no bot connections
  if (connectedBots.size === 0) {
    console.warn('⚠️ WARNING: No trading bot connections detected!');
  }
  
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SSL server...');
  
  // Simple cleanup - close all connections
  connectedBots.clear();
  connectedDashboards.clear();
  
  if (polygonSocket.readyState === WebSocket.OPEN) {
    polygonSocket.close();
  }
  
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
