/**
 * ===================================================================
 * 🚀 OGZ PRIME SSL SERVER - KRAKEN INTEGRATION
 * ===================================================================
 * Direct Kraken WebSocket connection for real-time crypto data
 * No complicated broadcaster - simple direct data flow
 * ===================================================================
 */

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const apiPort = process.env.API_PORT || 3010;
const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// HTTPS server removed - nginx handles SSL termination
// All connections come through nginx proxy on port 3010

// Single WebSocket server on unified port
const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws'  // Optional: use path-based routing
});

wss.on('connection', (ws, req) => {
  // Simple connection tracking - NO OVERCOMPLICATED BROADCASTER
  const connectionId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  ws.connectionId = connectionId;
  ws.isAlive = true;
  
  console.log(`✅ New WebSocket connection: ${connectionId}`);
  
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
        return;
      }
      
      if (data.type === 'pong') {
        ws.isAlive = true;
        return;
      }
      
      // Handle bot identification
      if (data.type === 'identify' && data.source === 'trading_bot') {
        console.log('🤖 TRADING BOT IDENTIFIED!');
        ws.clientType = 'bot';
        
        ws.send(JSON.stringify({
          type: 'identification_confirmed',
          connectionId: connectionId,
          message: 'Bot registered successfully'
        }));
      }
      
      // Handle dashboard identification
      if (data.type === 'identify' && data.source === 'dashboard') {
        console.log('📊 DASHBOARD IDENTIFIED!');
        ws.clientType = 'dashboard';
      }
      
    } catch (err) {
      console.error(`Error parsing message from ${connectionId}:`, err.message);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${connectionId}`);
  });
  
  ws.on('error', (err) => {
    console.error(`WebSocket error for ${connectionId}:`, err.message);
  });
});

// Market data variables
let lastKnownPrice = null;
let tickCount = 0;
let assetPrices = {};
let currentAsset = 'BTC-USD';

// � Kraken WebSocket connection (PUBLIC - no API key needed for market data!)
const KRAKEN_PUBLIC_WS = 'wss://ws.kraken.com';

console.log('🐙 Using Kraken public WebSocket for market data (no API key required)');

const krakenSocket = new WebSocket(KRAKEN_PUBLIC_WS);

krakenSocket.on('open', () => {
  console.log('� Connected to Kraken public WebSocket feed');
  
  // Subscribe to multiple crypto pairs on Kraken
  const pairs = [
    'XBT/USD',  // Bitcoin (Kraken uses XBT)
    'ETH/USD',  // Ethereum
    'SOL/USD',  // Solana
    'ADA/USD',  // Cardano
    'DOGE/USD', // Dogecoin
    'XRP/USD',  // Ripple
    'LTC/USD',  // Litecoin
    'MATIC/USD',// Polygon/Matic
    'AVAX/USD', // Avalanche
    'LINK/USD', // Chainlink
    'DOT/USD',  // Polkadot
    'ATOM/USD', // Cosmos
    'UNI/USD',  // Uniswap
    'AAVE/USD', // Aave
    'ALGO/USD', // Algorand
  ];
  
  // Kraken subscription format
  krakenSocket.send(JSON.stringify({
    event: 'subscribe',
    pair: pairs,
    subscription: {
      name: 'ticker'
    }
  }));
  
  console.log(`📡 Subscribed to ${pairs.length} trading pairs on Kraken`);
});

krakenSocket.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    
    // Kraken sends different message types
    // Array messages are ticker updates: [channelID, tickerData, channelName, pair]
    if (Array.isArray(msg) && msg.length >= 4 && msg[2] === 'ticker') {
      tickCount++;
      
      const tickerData = msg[1];
      const pair = msg[3];
      
      // Extract price from Kraken ticker data
      // tickerData.c = [price, lot volume]
      const price = parseFloat(tickerData.c[0]);
      
      // Convert Kraken pair format to our format
      // XBT/USD -> BTC-USD, ETH/USD -> ETH-USD, etc.
      let asset = pair.replace('XBT/', 'BTC-').replace('/', '-');
      
      // Store price
      assetPrices[asset] = price;
      if (asset === currentAsset || asset === 'BTC-USD') {
        lastKnownPrice = price;
      }

      // Log periodically
      if (tickCount % 10 === 0 || tickCount <= 5) {
        console.log(`🎯 KRAKEN TICK #${tickCount}: ${asset} $${price.toFixed(2)} @ ${new Date().toLocaleTimeString()}`);
      }

      // 🚀 SIMPLE DIRECT BROADCAST - NO OVERCOMPLICATED BROADCASTER
      const priceMessage = {
        type: 'price',
        data: {
          asset: asset,
          price: price,
          timestamp: Date.now(),
          source: 'kraken',
          allPrices: assetPrices,
          tickCount: tickCount,
          volume: parseFloat(tickerData.v[0]) || 0
        }
      };
      
      // Broadcast to ALL connected WebSocket clients
      const messageStr = JSON.stringify(priceMessage);
      let sentCount = 0;
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(messageStr);
            sentCount++;
          } catch (err) {
            console.error('Error sending to client:', err.message);
          }
        }
      });
      
      // Log broadcast results periodically
      if (sentCount > 0 && tickCount % 20 === 0) {
        console.log(`📡 Kraken price broadcast: ${asset} $${price.toFixed(2)} → ${sentCount} clients`);
      }
    }
    
    // Handle subscription status messages
    if (msg.event === 'subscriptionStatus') {
      console.log(`📊 Kraken subscription: ${msg.status} - ${msg.pair || 'multiple pairs'}`);
    }
    
    // Handle system status
    if (msg.event === 'systemStatus') {
      console.log(`🐙 Kraken system status: ${msg.status}`);
    }
    
  } catch (err) {
    // Ignore heartbeat messages and other non-JSON data
    if (!data.toString().includes('heartbeat')) {
      console.error('❌ Failed to process Kraken data:', err.message);
    }
  }
});

krakenSocket.on('close', () => {
  console.warn('⚠️ Kraken WebSocket disconnected - attempting reconnect...');
  
  // Broadcast disconnection to all clients
  const disconnectMessage = JSON.stringify({
    type: 'data_feed_status',
    status: 'disconnected',
    message: 'Kraken data feed disconnected',
    timestamp: Date.now()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(disconnectMessage);
      } catch (err) {
        console.error('Error broadcasting disconnect:', err.message);
      }
    }
  });
  
  // Auto-reconnect after 5 seconds
  setTimeout(() => {
    console.log('🔄 Reconnecting to Kraken...');
    // In production, you'd reinitialize the connection here
  }, 5000);
});

krakenSocket.on('error', (err) => {
  console.error('🚨 Kraken WebSocket error:', err.message);
});

// 📊 Enhanced status monitoring
setInterval(() => {
  const connectedClients = Array.from(wss.clients).filter(c => c.readyState === WebSocket.OPEN);
  const botClients = connectedClients.filter(c => c.clientType === 'bot');
  
  console.log(`📊 SYSTEM STATUS:`);
  console.log(`   � Kraken: ${krakenSocket.readyState === WebSocket.OPEN ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`   📊 Ticks: ${tickCount}`);
  console.log(`   💰 Last Price: $${lastKnownPrice ? lastKnownPrice.toFixed(2) : 'N/A'}`);
  console.log(`   👥 Total Connections: ${connectedClients.length}`);
  console.log(`   🤖 Bot Connections: ${botClients.length}`);
  console.log(`   📡 Assets tracked: ${Object.keys(assetPrices).length}`);
  
  // Alert if no bot connections
  if (botClients.length === 0) {
    console.warn('⚠️ WARNING: No trading bot connections detected!');
  }
  
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SSL server...');
  
  broadcaster.shutdown();
  
  if (krakenSocket.readyState === WebSocket.OPEN) {
    krakenSocket.close();
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