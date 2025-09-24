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
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 🚀 MODULE AUTO-LOADER - The Path Master
const moduleLoader = require('./ModuleAutoLoader');

// 📊 POLYGON WEBSOCKET - Real price data
const PolygonWebSocket = require('./core/PolygonWebSocket');

// 🔥 SIMPLE WEBSOCKET HUB (no advanced broadcaster)
const SimpleWebSocketHub = require('./core/SimpleWebSocketHub');

// Set SSL server flag
process.env.OGZ_SSL_SERVER = 'true';

// Initialize the SIMPLE hub
const broadcaster = new SimpleWebSocketHub();

// ==========================================
// Brain (Ollama/Qwen) availability broadcasting
// ==========================================
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_ENABLED = (process.env.OLLAMA_ENABLED === 'true' || process.env.OLLAMA_ENABLED === '1');
const ENABLE_PRICE_BROADCAST = true; // Always enable real price data, fuck the fake shit
let brainAvailable = false;
let lastBrainLog = 0;

async function checkOllamaAvailability() {
  try {
    const res = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 2000 });
    const ok = res && res.status === 200;
    if (ok !== brainAvailable) {
      brainAvailable = ok;
      const now = Date.now();
      if (now - lastBrainLog > 1500) {
        console.log(`🧠 Brain (Ollama/Qwen): ${brainAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} @ ${new Date().toLocaleTimeString()}`);
        lastBrainLog = now;
      }
      broadcaster.broadcast({
        type: 'brain_status',
        status: brainAvailable ? 'available' : 'unavailable',
        timestamp: now
      }, { priority: 'high', requiresAck: false });
    }
  } catch (_) {
    if (brainAvailable) {
      brainAvailable = false;
      const now = Date.now();
      if (now - lastBrainLog > 1500) {
        console.log(`🧠 Brain (Ollama/Qwen): UNAVAILABLE @ ${new Date().toLocaleTimeString()}`);
        lastBrainLog = now;
      }
      broadcaster.broadcast({
        type: 'brain_status',
        status: 'unavailable',
        timestamp: now
      }, { priority: 'high', requiresAck: false });
    }
  }
}

// Initial check + periodic monitoring (disabled unless explicitly enabled)
if (OLLAMA_ENABLED) {
  checkOllamaAvailability().catch(() => {});
  setInterval(checkOllamaAvailability, 15000);
}

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

// Serve static files (with HTML injection of TRAI widget)
const PUBLIC_DIR = path.join(__dirname, 'public');

function injectTraiWidget(html) {
  if (!html || typeof html !== 'string') return html;
  if (html.includes('trai-widget.js')) return html; // already present
  return html.replace('</head>', '  <script defer src="trai-widget.js"></script>\n</head>');
}

app.use(async (req, res, next) => {
  try {
    if (req.method !== 'GET') return next();
    if (!req.path.endsWith('.html')) return next();
    const filePath = path.join(PUBLIC_DIR, req.path.replace(/^\/+/, ''));
    // Only intercept if file exists in public
    if (!fs.existsSync(filePath)) return next();
    const html = await fs.promises.readFile(filePath, 'utf8');
    const injected = injectTraiWidget(html);
    res.set('Content-Type', 'text/html');
    return res.send(injected);
  } catch (e) {
    return next();
  }
});

app.use(express.static(PUBLIC_DIR));

// Dashboard routes
async function sendInjectedFile(res, filePath) {
  try {
    const html = await fs.promises.readFile(filePath, 'utf8');
    res.set('Content-Type', 'text/html');
    res.send(injectTraiWidget(html));
  } catch (e) {
    res.status(404).send('Not Found');
  }
}

app.get('/', async (req, res) => {
  const filePath = path.join(__dirname, 'OGZFV-valhalla', 'ogz-ultimate-dashboard.html');
  await sendInjectedFile(res, filePath);
});

app.get('/dashboard', async (req, res) => {
  const filePath = path.join(__dirname, 'OGZFV-valhalla', 'ogz-ultimate-dashboard.html');
  await sendInjectedFile(res, filePath);
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
    brain: {
      available: typeof brainAvailable !== 'undefined' ? brainAvailable : false,
      url: OLLAMA_URL
    },
    
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

// ==========================================
// Aggregated TRAI Insight Ingest (opt-in from customer instances)
// ==========================================
const INSIGHT_API_TOKEN = process.env.INSIGHT_API_TOKEN || '';
app.post('/api/trai/insight', express.json(), async (req, res) => {
  try {
    if (!INSIGHT_API_TOKEN) return res.status(503).json({ error: 'Ingest disabled' });
    const token = req.headers['x-insight-token'];
    if (!token || token !== INSIGHT_API_TOKEN) return res.status(403).json({ error: 'Forbidden' });
    const payload = req.body || {};
    // Minimal validation
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Bad payload' });
    const day = new Date().toISOString().slice(0, 10);
    const file = path.join(__dirname, 'logs', `aggregated-insights-${day}.jsonl`);
    const line = JSON.stringify({ ts: Date.now(), ip: req.ip, ...payload }) + '\n';
    await fs.promises.mkdir(path.join(__dirname, 'logs'), { recursive: true }).catch(()=>{});
    await fs.promises.appendFile(file, line).catch(()=>{});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
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
  const connectionId = broadcaster.registerClient(ws, {
    type: 'unknown',
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  console.log(`✅ New connection registered: ${connectionId}`);
  
  // Handle incoming messages
  ws.on('message', (message) => {
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
      if (data.type === 'identify' && (data.source === 'bot' || data.source === 'trading_bot')) {
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
      
      // Identify backtest clients (for routing TRAI analysis back)
      if (data.type === 'identify' && (data.source === 'backtest' || data.source === 'backtest_with_trai')) {
        const connection = broadcaster.connections.get(connectionId);
        if (connection) {
          connection.metadata.type = 'backtest';
          console.log('🧪 Backtest client identified');
        }
      }
      
      // Handle TRAI questions from dashboard/backtest/voice
      if ((data.type === 'question' && (data.question || data.data)) || (data.type === 'query' && data.prompt)) {
        console.log(`🤖 TRAI Question received: ${data.question || data.data || data.prompt}`);
        
        // Forward to TRAI singleton via internal messaging
        broadcaster.broadcast({
          type: 'trai_question',
          question: data.question || data.data || data.prompt,
          from: connectionId,
          timestamp: Date.now()
        }, { filter: (conn) => conn.metadata.type === 'trai' });
      }
      
      // Special handling for TRAI identification (singleton or generic)
      if (data.type === 'identify' && (data.source === 'trai' || data.source === 'trai_singleton')) {
        const connection = broadcaster.connections.get(connectionId);
        if (connection) {
          connection.metadata.type = 'trai';
          console.log('🧠 TRAI connected to SSL server');
          
          // Notify dashboards that TRAI is online
          broadcaster.broadcast({
            type: 'trai_status',
            connected: true,
            timestamp: Date.now()
          }, { filter: (conn) => conn.metadata.type === 'dashboard' });
        }
      }
      
      // Handle TRAI answers
      if (data.type === 'trai_answer' && data.to) {
        const targetConnection = broadcaster.connections.get(data.to);
        if (targetConnection) {
          broadcaster.sendDirect(targetConnection, {
            type: 'answer',
            answer: data.answer,
            timestamp: Date.now()
          });
        }
      }

      // Forward trade events to TRAI for analysis
      if (data.type === 'trade' || data.type === 'trade_result') {
        broadcaster.broadcast(data, { filter: (conn) => conn.metadata.type === 'trai' });
        // Aggregate performance on trade_result
        if (data.type === 'trade_result') {
          const t = data.data || data;
          const tier = t.tier || t.botTier || t.sourceTier || 'unknown';
          const deltaUsd = Number(t.pnlAmount || 0);
          const deltaPct = Number(t.pnl || 0);
          updatePerformance(tier, deltaUsd, deltaPct);
          broadcastPerformanceSnapshot();
        }
      }

      // Forward TRAI analysis back to backtest and dashboards
      if (data.type === 'trade_analysis' || data.type === 'market_analysis') {
        const payload = { type: data.type, data: data.data };
        broadcaster.broadcast(payload, { filter: (conn) => conn.metadata.type === 'backtest' });
        broadcaster.broadcast(payload, { filter: (conn) => conn.metadata.type === 'dashboard' });
      }

      // Forward and cache bot_status messages (live performance from bots)
      if (data.type === 'bot_status') {
        const t = data;
        const tier = t.tier || t.botTier || 'unknown';
        const usd = Number(t.pnlUsd || t.pnl_amount || 0);
        const pct = Number(t.pnlPct || t.pnl || 0);
        updatePerformance(tier, usd, pct);
        broadcaster.broadcast({ type: 'bot_status', ...data }, { requiresAck: false });
        broadcastPerformanceSnapshot();
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

// 🔌 Polygon.io WebSocket connection (optional; default disabled)
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'RlsCgSaDNVNtGipX05xmcAHou_h7yhqZ';
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

// Always connect to real price data - NO FAKE SHIT
console.log('🚀 Connecting to Polygon for REAL price data...');
console.log('   API Key:', POLYGON_API_KEY ? `${POLYGON_API_KEY.slice(0,10)}...` : 'NOT SET');
console.log('   WebSocket URL:', POLYGON_CRYPTO_SOCKET);

let polygonSocket = new WebSocket(POLYGON_CRYPTO_SOCKET);

polygonSocket.on('open', () => {
  console.log('🔌 Connected to Polygon.io crypto feed');
  polygonSocket.send(JSON.stringify({
    action: 'auth',
    params: POLYGON_API_KEY
  }));
});

polygonSocket.on('error', (err) => {
  console.error('❌ Polygon WebSocket error:', err.message);
});

polygonSocket.on('close', (code, reason) => {
  console.log(`❌ Polygon WebSocket closed: ${code} - ${reason}`);
});

polygonSocket.on('message', (data) => {
  console.log('📨 Polygon message received, length:', data.length);
  try {
    const messages = JSON.parse(data);
    const msgArray = Array.isArray(messages) ? messages : [messages];

    for (const msg of msgArray) {
      // Debug logging - Log EVERYTHING to see what's coming
      console.log(`🔍 POLYGON MSG:`, JSON.stringify(msg).substring(0, 300));
      
      if (msg.status === 'auth_success') {
        console.log('✅ Polygon authenticated - subscribing to multiple assets');

        const assets = [
          // Try XQ (quotes) for crypto - this should give continuous price updates
          'XQ.X:BTC-USD', 'XQ.X:ETH-USD', 'XQ.X:SOL-USD', 'XQ.X:ADA-USD'
        ];
        assets.forEach(asset => {
          polygonSocket.send(JSON.stringify({
            action: 'subscribe',
            params: asset
          }));
          console.log(`📡 Subscribed to ${asset}`);
        });
      }
      
      // Handle quote events (XQ) for real-time crypto prices
      if ((msg.ev === 'XQ' || msg.ev === 'XT') && (msg.bp || msg.ap || msg.p)) {
        tickCount++;
        // For quotes use midpoint of bid/ask, for trades use price
        const price = msg.p ? parseFloat(msg.p) : (parseFloat(msg.bp) + parseFloat(msg.ap)) / 2;
        const timestamp = msg.t ? new Date(msg.t).toISOString() : new Date().toISOString();
        
        // Determine asset
        let asset = 'BTC-USD';
        if (typeof msg.pair === 'string') {
          asset = msg.pair.replace('X:', '').replace('USD', '-USD');
        }
        
        // Store price
        assetPrices[asset] = price;
        if (asset === currentAsset) {
          lastKnownPrice = price;
        }

        // Log periodically
        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`🎯 TICK #${tickCount}: ${asset} $${price.toFixed(2)} @ ${new Date(msg.t || Date.now()).toLocaleTimeString()}`);
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
        
        // Broadcast to dashboards only (avoid flooding TRAI/backtests)
        const result = broadcaster.broadcast(priceMessage, {
          priority: 'high',
          requiresAck: false,
          filter: (conn) => conn.metadata.type === 'dashboard'
        });

        // Broadcast specifically to bots with critical priority (no backtests/TRAI)
        broadcaster.broadcast(priceMessage, {
          priority: 'critical',
          requiresAck: true,
          filter: (conn) => conn.metadata.type === 'bot'
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

if (polygonSocket) polygonSocket.on('close', () => {
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

if (polygonSocket) polygonSocket.on('error', (err) => {
  console.error('🚨 Polygon WebSocket error:', err.message);
});

// 📊 Enhanced status monitoring
setInterval(() => {
  const stats = broadcaster.getStatistics();
  
  console.log(`📊 SYSTEM STATUS:`);
  const polyStatus = (!ENABLE_PRICE_BROADCAST || !polygonSocket) ? 'Disabled' : (polygonSocket.readyState === WebSocket.OPEN ? 'Connected ✅' : 'Disconnected ❌');
  console.log(`   🔌 Polygon: ${polyStatus}`);
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

// ==========================================
// Bot performance aggregation (real messages only)
// ==========================================
const perfByTier = Object.create(null); // { tier: { usd: number, pct: number, last: number } }

function updatePerformance(tier, deltaUsd = 0, deltaPct = 0) {
  if (!tier) return;
  if (!perfByTier[tier]) perfByTier[tier] = { usd: 0, pct: 0, last: Date.now() };
  if (Number.isFinite(deltaUsd)) perfByTier[tier].usd += deltaUsd;
  if (Number.isFinite(deltaPct)) perfByTier[tier].pct += deltaPct;
  perfByTier[tier].last = Date.now();
}

function broadcastPerformanceSnapshot() {
  const byTier = {};
  Object.keys(perfByTier).forEach(t => {
    byTier[t] = { usd: Number(perfByTier[t].usd || 0), pct: Number(perfByTier[t].pct || 0) };
  });
  let bestTier = null, bestUsd = -Infinity, bestPct = -Infinity;
  Object.keys(byTier).forEach(t => {
    const u = byTier[t].usd;
    if (u > bestUsd) { bestUsd = u; bestTier = t; bestPct = byTier[t].pct; }
  });
  const snapshot = {
    type: 'performance_snapshot',
    data: { byTier, best: bestTier ? { tier: bestTier, usd: bestUsd, pct: bestPct } : null, timestamp: Date.now() }
  };
  broadcaster.broadcast(snapshot, { requiresAck: false });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SSL server...');
  
  if (polygonSocket && polygonSocket.readyState === WebSocket.OPEN) {
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

console.log('\n✅ OGZ Prime WebSocket Hub Running (Nginx SSL Proxy)');
console.log('🚀 Simple WebSocket Hub (no advanced broadcaster)');
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
