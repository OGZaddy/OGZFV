/**
 * ===================================================================
 * 🚀 OGZ PRIME SSL SERVER - ADVANCED INTEGRATION
 * ===================================================================
 * This is how you integrate the Advanced WebSocket Broadcasting System
 * into your SSL server for BULLETPROOF real-time data delivery
 * ===================================================================
 */

const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk_test_51Rc2VnGai7JiFhNgxpk4VPgzuLwgymGkGDW4fZCDzfqjDmYCCvKxF9i3g9ebOlPQexaR9qxx7xIv7bqfpDXfkRGu00qy9cjKBS');

// 🔥 IMPORT THE ADVANCED WEBSOCKET SYSTEM
const AdvancedWebSocketBroadcastSystem = require('./core/AdvancedWebSocketBroadcastSystem');
const { CONFIG } = require('./core/WebSocketConfig');

// Set SSL server flag
process.env.OGZ_SSL_SERVER = 'true';

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

console.log(`[SSL-${Date.now()}] Advanced SSL Server starting...`);
console.log('🚀 OGZPrime SSL Server with ADVANCED BROADCASTING SYSTEM');
console.log('💪 Built for warriors who don\'t take shortcuts');

// Express setup
const app = express();
const apiPort = 3010;

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
      secureApiPort: 443,
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

// Stripe endpoints
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'OGZ Prime Trading Bot',
            description: 'Advanced automated trading system'
          },
          unit_amount: 29900, // $299.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SSL Configuration - NGINX HANDLES THIS NOW
// Nginx reverse proxy handles SSL termination
console.log('🔄 SSL handled by nginx reverse proxy');
console.log('   WebSocket: wss://ogzprime.com/ws → nginx → ws://localhost:3010/ws');

// Regular HTTP server
const httpServer = http.createServer(app);
httpServer.listen(apiPort, '0.0.0.0', () => {
  console.log(`🌐 HTTP API Server running on port ${apiPort} (all interfaces)`);
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
  const connectionId = broadcaster.registerConnection(ws, {
    type: 'unknown',
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  console.log(`✅ New connection registered: ${connectionId}`);
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Special handling for bot identification
      if (data.type === 'identify' && data.source === 'trading_bot') {
        console.log('🤖 TRADING BOT IDENTIFIED!');
        
        // Update connection metadata
        const connection = broadcaster.connections.get(connectionId);
        if (connection) {
          connection.metadata.type = 'bot';
          connection.state.priority = 'critical';
          
          // Send confirmation
          broadcaster.sendDirect(connection, {
            type: 'identification_confirmed',
            connectionId: connectionId,
            priority: 'critical',
            message: 'You are now registered as a critical trading bot connection'
          });
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
const POLYGON_API_KEY = '0gp6oKkWwriN0WInvwu539Ch6iJAOcLK';
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

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
        
        const assets = ['XA.BTC-USD', 'XA.ETH-USD', 'XA.SOL-USD', 'XA.ADA-USD'];
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
console.log(`   🔒 Secure WebSocket: wss://ogzprime.com/ws (via nginx))`);
console.log(`   🔒 Secure API: https://ogzprime.com/api/live-status (via nginx)`);
console.log(`   📡 Local WebSocket: ws://localhost:${apiPort}/ws`);
console.log(`   🌐 Local API: http://localhost:${apiPort}/api/live-status`);

localIPs.forEach(ip => {
  console.log(`\n   Direct IP access:`);
  console.log(`   📡 ws://${ip}:${apiPort}/ws`);
  console.log(`   🌐 http://${ip}:${apiPort}/api/live-status`);
});

console.log('\n💪 FOR HOUSTON! FOR FINANCIAL FREEDOM! FOR VICTORY! 💪\n');
