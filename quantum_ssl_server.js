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

// 🔥 IMPORT THE ADVANCED WEBSOCKET SYSTEM
const AdvancedWebSocketBroadcastSystem = require('./core/AdvancedWebSocketBroadcastSystem');

// 🤖 IMPORT THE MOVER AI CLONE
const TheMoverAIClone = require('./mover/the-mover-ai-clone');

// 🔧 INITIALIZE MODULE AUTO LOADER
const autoLoader = require('./ModuleAutoLoader');

// Set QUANTUM SSL server flag
process.env.OGZ_QUANTUM_SSL_SERVER = 'true';

// Initialize THE MOVER with persistent memory
const mover = new TheMoverAIClone({
  memoryPath: '/root/OGZFV-valhalla/data/mover-memory',
  learningRate: 0.8,
  responseStyle: 'authentic_og'
});

// Initialize the ADVANCED broadcasting system
const broadcaster = new AdvancedWebSocketBroadcastSystem({
  // Connection health
  heartbeatInterval: 5000,
  connectionTimeout: 30000,
  
  // Message delivery
  messageTimeout: 3000,
  maxRetries: 3,
  ackTimeout: 2000,
  
  // Performance optimization
  maxQueueSize: 10000,
  batchSize: 50,
  throttleMs: 10,
  compressionThreshold: 1024,
  
  // Circuit breaker for resilience
  circuitBreakerThreshold: 10,
  circuitBreakerResetTime: 60000,
  
  // Monitoring
  metricsInterval: 30000,
  performanceAlertThreshold: 100
});

// Special handling for bot connections
broadcaster.on('bot_disconnected', (connection) => {
  console.error('🚨 CRITICAL: Trading bot disconnected!');
  console.error(`   Connection ID: ${connection.id}`);
  console.error(`   Connected for: ${((Date.now() - connection.metadata.connectedAt) / 1000).toFixed(2)}s`);
  console.error(`   Last activity: ${new Date(connection.metadata.lastActivity).toLocaleTimeString()}`);
  
  // Alert system - in production, this would send notifications
  console.error('🔔 ALERT: Attempting automatic recovery...');
});

console.log(`[QUANTUM-SSL-${Date.now()}] QUANTUM SSL Server starting...`);
console.log('⚛️ OGZPrime QUANTUM SSL Server with ADVANCED BROADCASTING SYSTEM');
console.log('🌌 Built for quantum supremacy operations');

// Express setup
const app = express();
const apiPort = parseInt(process.env.QUANTUM_SSL_PORT) || 3010;

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

// Enhanced status endpoint with broadcaster stats
app.get('/api/live-status', (req, res) => {
  const broadcasterStats = broadcaster.getStatistics();
  
  res.json({
    balance: 10000,
    timestamp: new Date().toISOString(),
    isRunning: true,
    trades: 0,
    decisionsToday: 0,
    currentPrice: lastKnownPrice,
    
    // ADVANCED METRICS
    websocketStats: {
      totalConnections: broadcasterStats.connections.total,
      connectionsByType: broadcasterStats.connections.byType,
      messageRate: broadcasterStats.performance.messagesPerSecond,
      averageLatency: broadcasterStats.performance.averageLatency,
      successRate: broadcasterStats.performance.successRate,
      queuedMessages: broadcasterStats.queues.totalQueued
    },
    
    serverInfo: {
      supportsSSL: true,
      wsPort: apiPort,
      secureWsPort: 443,
      apiPort: apiPort,
      secureApiPort: parseInt(process.env.SSL_SECURE_PORT) || 443,
      advancedBroadcasting: true
    }
  });
});

// System health endpoint
app.get('/api/health', (req, res) => {
  const stats = broadcaster.getStatistics();
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    websockets: stats,
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
(async () => {
  try {
    console.log('🤖 Initializing The Mover AI Clone...');
    await mover.initializeFinalForm();
    console.log('✅ The Mover initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize The Mover:', error);
  }
})();

// Regular HTTP server
const httpServer = http.createServer(app);
httpServer.listen(apiPort, '127.0.0.1', () => {
  console.log(`🌐 HTTP API Server running on port ${apiPort} (127.0.0.1)`);
});

// HTTPS server removed - nginx handles SSL termination
// All connections come through nginx proxy on port 3010

// Single WebSocket server on unified port
const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws'  // Optional: use path-based routing
});

wss.on('connection', (ws, req) => {
  // Register ALL connections with broadcaster
  const connectionId = broadcaster.registerClient(ws, {
    type: 'unknown',
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  console.log(`✅ New connection registered: ${connectionId}`);
  
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
      
      // Special handling for bot identification
      if (data.type === 'identify' && data.source === 'trading_bot') {
        console.log('🤖 TRADING BOT IDENTIFIED!');
        
        // Update connection metadata with safety check
        const connection = broadcaster.connections?.get(connectionId);
        if (connection && connection.metadata) {
          connection.metadata.type = 'bot';
          connection.metadata.tier = data.botTier; // Store bot tier for manual trade routing
          connection.state.priority = 'critical';
          
          // Send confirmation
          broadcaster.sendDirect(connection, {
            type: 'identification_confirmed',
            connectionId: connectionId,
            priority: 'critical',
            message: 'You are now registered as a critical trading bot connection'
          });
          
          console.log('✅ Trading bot successfully registered with enterprise security');
        } else {
          console.log('⚠️ Connection not found during bot identification');
        }
      }
      
      // Special handling for dashboard identification
      if (data.type === 'identify' && data.source === 'dashboard') {
        const connection = broadcaster.connections.get(connectionId);
        if (connection) {
          connection.metadata.type = 'dashboard';
          console.log('📊 Dashboard identified');
        }
      }
      
      // Broadcast trade executions from bot to all clients
      if (data.type === 'trade_executed') {
        console.log('💰 TRADE EXECUTED - Broadcasting to all clients');
        broadcaster.broadcast(data);
        
        // Also log the trade details
        if (data.data) {
          const trade = data.data;
          console.log(`   ${trade.side?.toUpperCase()} ${trade.size} @ $${trade.price}`);
          console.log(`   Balance: $${trade.balance} | Total Trades: ${trade.totalTrades}`);
        }
      }
      
      // Handle manual trade commands from dashboard
      if (data.type === 'manual_trade') {
        console.log(`🎯 MANUAL TRADE COMMAND: ${data.botType?.toUpperCase()} - ${data.action?.toUpperCase()}`);
        
        // Find target bot connections
        const targetBots = [];
        broadcaster.connections.forEach((connection, id) => {
          if (connection.metadata?.type === 'bot' && 
              connection.metadata?.tier === data.botType) {
            targetBots.push(connection);
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
          
          // Send command to target bots
          targetBots.forEach(botConnection => {
            broadcaster.sendDirect(botConnection, tradeCommand);
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
          
          // Generate response from The Mover
          const reply = await mover.generateResponse(text);
          console.log(`🤖 Mover replied: "${reply}"`);
          
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
            personality: mover.config.personality,
            conversationCount: mover.conversationHistory?.length || 0,
            lastActivity: mover.lastActivity || null
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
        
        // Broadcast to ALL connections with high priority
        const result = broadcaster.broadcast(priceMessage, {
          priority: 'high',
          requiresAck: false // Don't require ACK for price updates
        });
        
        // Broadcast specifically to bots with critical priority
        broadcaster.broadcast(priceMessage, {
          type: 'bot',
          priority: 'critical',
          requiresAck: true // Require ACK from bots
        });
        
        // Log broadcast results
        if (result.sent > 0) {
          console.log(`📡 Price broadcast: ${asset} $${price.toFixed(2)} to ${result.sent} clients`);
        }
        
        // Price processed directly by broadcaster
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

polygonSocket.on('close', () => {
  console.warn('⚠️ Polygon WebSocket disconnected');
  broadcaster.broadcast({
    type: 'data_feed_status',
    status: 'disconnected',
    message: 'Polygon data feed disconnected',
    timestamp: Date.now()
  }, {
    priority: 'critical'
  });
});

polygonSocket.on('error', (err) => {
  console.error('🚨 Polygon WebSocket error:', err.message);
});

// 📊 Enhanced status monitoring
setInterval(() => {
  const stats = broadcaster.getStatistics();
  
  console.log(`📊 SYSTEM STATUS:`);
  console.log(`   🔌 Polygon: ${polygonSocket.readyState === WebSocket.OPEN ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`   📊 Ticks: ${tickCount}`);
  console.log(`   💰 Balance: $10000`);
  console.log(`   👥 Total Connections: ${stats.connections.total}`);
  console.log(`   🤖 Bot Connections: ${stats.connections.byType.bot || 0}`);
  console.log(`   📈 Messages/sec: ${stats.performance.messagesPerSecond.toFixed(2)}`);
  console.log(`   ⚡ Avg Latency: ${stats.performance.averageLatency.toFixed(2)}ms`);
  console.log(`   ✅ Success Rate: ${stats.performance.successRate}`);
  
  // Alert if no bot connections
  if (!stats.connections.byType.bot || stats.connections.byType.bot === 0) {
    console.warn('⚠️ WARNING: No trading bot connections detected!');
  }
  
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SSL server...');
  
  broadcaster.shutdown();
  
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
