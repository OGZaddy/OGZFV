const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')('sk_test_51Rc2VnGai7JiFhNgxpk4VPgzuLwgymGkGDW4fZCDzfqjDmYCCvKxF9i3g9ebOlPQexaR9qxx7xIv7bqfpDXfkRGu00qy9cjKBS');

// 🔥 Set flag to bypass singleton lock for SSL server
process.env.OGZ_SSL_SERVER = 'true';

// Import the OGZ Prime class
const OGZPrimeV10 = require('./OGZPrimeV10.2');

// Create a minimal instance for SSL server (no WebSocket conflicts)
const ogzPrime = new OGZPrimeV10({
  // Override WebSocket ports to avoid conflicts with main bot
  dataWebSocketPort: 8001,    // Safe ports away from main bot's 3001
  guiWebSocketPort: 8002,     // Safe ports away from main bot's 3002
  controlWebSocketPort: 8003, // Safe ports away from main bot's 3003
  // Disable features that aren't needed for SSL server
  enableMultiTimeframe: false,
  enableFibonacciLevels: false,
  enableSupportResistance: false
});

console.log(`[SSL-${Date.now()}] Server starting...`);
console.log('🚀 OGZPrime SSL Server connected to bot brain.');

// 🌐 Start Express API server with SSL support
const app = express();
const apiPort = 3010;        // Changed to avoid conflicts
const secureApiPort = 3011;  // Changed to avoid conflicts
const wsPort = 3012;         // Changed to avoid conflicts
const secureWsPort = 3013;   // Changed to avoid conflicts

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve main dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

// Also serve dashboard at /dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

// Store the last known price - will be updated with real Polygon.io data only
let lastKnownPrice = null;
let tickCount = 0;

// API endpoints
app.get('/api/live-status', (req, res) => {
  // Get REAL data from your bot
  const realBalance = ogzPrime && ogzPrime.getBalance ? ogzPrime.getBalance() : 10000;
  const realTrades = ogzPrime && ogzPrime.getTotalTrades ? ogzPrime.getTotalTrades() : 0;
  const realDecisions = ogzPrime && ogzPrime.getDecisionsToday ? ogzPrime.getDecisionsToday() : 0;
  
  res.json({
    balance: realBalance,
    timestamp: new Date().toISOString(),
    isRunning: true,
    trades: realTrades,
    decisionsToday: realDecisions,
    currentPrice: lastKnownPrice,
    serverInfo: {
      supportsSSL: true,
      wsPort: wsPort,
      secureWsPort: secureWsPort,
      apiPort: apiPort,
      secureApiPort: secureApiPort
    }
  });
});

app.get('/api/current-price', (req, res) => {
  res.json({
    success: true,
    price: lastKnownPrice,
    timestamp: new Date().toISOString()
  });
});

// Stripe checkout session endpoint (replacing PHP)
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

// Create success and cancel pages endpoints
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

// Check for SSL certificates
const sslKeyPath = path.join(__dirname, 'ssl', 'key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'cert.pem');
const hasSSLCerts = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

let httpsServer = null;
let secureWss = null;

if (hasSSLCerts) {
  try {
    const sslOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    
    // Create HTTPS server
    httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(secureApiPort, () => {
      console.log(`🔒 Secure API Server running on port ${secureApiPort}`);
    });
    
    // Create secure WebSocket server
    secureWss = new WebSocket.Server({ server: httpsServer });
    setupWebSocketHandlers(secureWss, 'Secure');
    
    console.log(`🔒 SSL certificates found - secure connections available`);
    console.log(`🔒 Secure WebSocket: wss://localhost:${secureApiPort}`);
    console.log(`🔒 Secure API: https://localhost:${secureApiPort}/api/live-status`);
  } catch (error) {
    console.warn(`⚠️ SSL setup failed: ${error.message}`);
    console.warn(`⚠️ Falling back to insecure connections only`);
  }
} else {
  console.warn(`⚠️ SSL certificates not found at:`);
  console.warn(`   Key: ${sslKeyPath}`);
  console.warn(`   Cert: ${sslCertPath}`);
  console.warn(`⚠️ To enable HTTPS support, generate SSL certificates`);
  console.warn(`⚠️ For development: npm install -g mkcert && mkcert -install && mkcert localhost`);
}

// Start regular HTTP server - bind to all interfaces for external access
const httpServer = http.createServer(app);
httpServer.listen(apiPort, '0.0.0.0', () => {
  console.log(`🌐 HTTP API Server running on port ${apiPort} (all interfaces)`);
});

// 📡 Regular WebSocket Server - attach to HTTP server instead of separate port
const wss = new WebSocket.Server({ server: httpServer });
setupWebSocketHandlers(wss, 'Regular');

function setupWebSocketHandlers(websocketServer, serverType) {
  // Initialize global clients arrays if not exists
  if (serverType === 'Regular' && !global.regularClients) {
    global.regularClients = [];
  } else if (serverType === 'Secure' && !global.secureClients) {
    global.secureClients = [];
  }
  
  websocketServer.on('connection', (ws) => {
    console.log(`[SSL-${Date.now()}] ${serverType} WebSocket: Frontend connected to AI brain stream`);
    
    // Add to appropriate global array
    if (serverType === 'Regular') {
      global.regularClients.push(ws);
      console.log(`🔍 DIAGNOSTIC: ${serverType} client connected. Total clients: ${global.regularClients.length}`);
    } else {
      global.secureClients.push(ws);
      console.log(`🔍 DIAGNOSTIC: ${serverType} client connected. Total clients: ${global.secureClients.length}`);
    }
    
    // Send initial REAL status to new client
    const realBalance = ogzPrime && ogzPrime.getBalance ? ogzPrime.getBalance() : 10000;
    const realTrades = ogzPrime && ogzPrime.getTotalTrades ? ogzPrime.getTotalTrades() : 0;
    const realDecisions = ogzPrime && ogzPrime.getDecisionsToday ? ogzPrime.getDecisionsToday() : 0;
    
    const statusPayload = JSON.stringify({
      type: 'status',
      data: {
        status: 'online',
        balance: realBalance,
        tradesCount: realTrades,
        decisionsToday: realDecisions,
        currentPrice: lastKnownPrice,
        serverType: serverType,
        connectionSecure: serverType === 'Secure'
      }
    });
    
    console.log(`🔍 DIAGNOSTIC: ${serverType} - Sending initial status to new client`);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(statusPayload);
      console.log(`🔍 DIAGNOSTIC: ${serverType} - Initial status sent successfully`);
    }

    // Handle incoming messages from dashboard
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`🔍 DIAGNOSTIC: ${serverType} - Received message from dashboard:`, data.type);
        
        if (data.type === 'ping') {
          const pongResponse = JSON.stringify({
            type: 'pong',
            timestamp: Date.now(),
            originalTimestamp: data.timestamp,
            serverType: serverType
          });
          ws.send(pongResponse);
          console.log(`🔍 DIAGNOSTIC: ${serverType} - Sent pong response`);
        }
      } catch (err) {
        console.error(`🔍 DIAGNOSTIC: ${serverType} - Error parsing dashboard message:`, err);
      }
    });

    ws.on('close', () => {
      console.log(`[SSL-${Date.now()}] ${serverType} WebSocket: Frontend disconnected from AI brain`);
      
      // Remove from appropriate global array
      if (serverType === 'Regular') {
        global.regularClients = global.regularClients.filter(client => client !== ws);
      } else {
        global.secureClients = global.secureClients.filter(client => client !== ws);
      }
    });

    ws.on('error', (error) => {
      console.error(`🔍 DIAGNOSTIC: ${serverType} WebSocket client error:`, error);
    });
  });
}

// 🔌 Polygon.io WebSocket feed (same as original)
const POLYGON_API_KEY = '0gp6oKkWwriN0WInvwu539Ch6iJAOcLK';
const POLYGON_CRYPTO_SOCKET = 'wss://socket.polygon.io/crypto';

// Store prices for multiple assets - will be populated with real Polygon.io data
let assetPrices = {};
let currentAsset = 'BTC-USD';
let isAuthenticated = false;

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
      if (msg.status === 'auth_success') {
        isAuthenticated = true;
        console.log('✅ Polygon authenticated - subscribing to multiple assets');
        
        // Subscribe to all supported assets
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
        
        // Determine which asset this price is for
        let asset = 'BTC-USD'; // default
        if (msg.pair) {
          asset = msg.pair.replace('USD', '-USD');
        }
        
        // Store price for the asset
        assetPrices[asset] = price;
        
        // Update lastKnownPrice if this is the current asset
        if (asset === currentAsset) {
          lastKnownPrice = price;
        }

        if (tickCount % 10 === 0 || tickCount <= 5) {
          console.log(`🎯 TICK #${tickCount}: ${asset} $${price.toFixed(2)} @ ${new Date(msg.e).toLocaleTimeString()}`);
        }

        // Broadcast to all clients (both regular and secure)
        const pricePayload = JSON.stringify({
          type: 'price',
          data: {
            asset: asset,
            price: price,
            timestamp: Date.now(),
            allPrices: assetPrices
          }
        });

        // Broadcast to regular clients
        if (global.regularClients) {
          global.regularClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(pricePayload);
            }
          });
        }

        // Broadcast to secure clients
        if (global.secureClients) {
          global.secureClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(pricePayload);
            }
          });
        }
        
        // Also send to bot for processing (if needed)
        if (ogzPrime && ogzPrime.processPrice) {
          ogzPrime.processPrice(price, asset);
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to process Polygon data:', err);
  }
});

polygonSocket.on('close', () => {
  console.warn('⚠️ Polygon WebSocket disconnected - will attempt reconnect');
  isAuthenticated = false;
});

polygonSocket.on('error', (err) => {
  console.error('🚨 Polygon WebSocket error:', err.message);
});

// Status logging
setInterval(() => {
  const regularClientCount = global.regularClients ? global.regularClients.length : 0;
  const secureClientCount = global.secureClients ? global.secureClients.length : 0;
  
  console.log(`📊 SYSTEM STATUS:`);
  console.log(`   🔌 Polygon: ${isAuthenticated ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`   📊 Ticks: ${tickCount}`);
  const realBalance = ogzPrime && ogzPrime.getBalance ? ogzPrime.getBalance() : 10000;
  console.log(`   💰 Balance: $${realBalance.toFixed(2)}`);
  console.log(`   📡 Regular Clients: ${regularClientCount}`);
  console.log(`   🔒 Secure Clients: ${secureClientCount}`);
}, 30000);

// Get network interfaces
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

console.log(`✅ OGZ Prime SSL-enabled server running`);
console.log(`🔍 DIAGNOSTIC: Server available on these endpoints:`);
console.log(`   📡 Regular WebSocket: ws://localhost:${wsPort}`);
console.log(`   🌐 Regular API: http://localhost:${apiPort}/api/live-status`);

if (hasSSLCerts && httpsServer) {
  console.log(`   🔒 Secure WebSocket: wss://localhost:${secureApiPort}`);
  console.log(`   🔒 Secure API: https://localhost:${secureApiPort}/api/live-status`);
}

localIPs.forEach(ip => {
  console.log(`   📡 ws://${ip}:${wsPort}`);
  console.log(`   🌐 http://${ip}:${apiPort}/api/live-status`);
  if (hasSSLCerts && httpsServer) {
    console.log(`   🔒 wss://${ip}:${secureApiPort}`);
    console.log(`   🔒 https://${ip}:${secureApiPort}/api/live-status`);
  }
});

console.log(`🌐 Real price data will be streamed to demo website`);
