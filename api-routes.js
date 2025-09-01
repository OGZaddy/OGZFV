// ==========================================
// OGZPRIME API ROUTES - Monetize Your Trading Signals
// ==========================================

const express = require('express');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

const router = express.Router();

// Load customer database
let customerDB = {};
const dbPath = path.join(__dirname, 'customer-database.json');

async function loadCustomerDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    customerDB = JSON.parse(data);
    console.log('📊 Customer database loaded:', Object.keys(customerDB.customers || {}).length, 'customers');
  } catch (error) {
    console.error('Failed to load customer database:', error);
    customerDB = { customers: {} };
  }
}

// Initialize customer DB
loadCustomerDB();

// Rate limiting by subscription tier
const createRateLimit = (windowMs, maxRequests, tier) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Rate limit exceeded',
      tier: tier,
      message: `Too many requests. Upgrade to premium for higher limits.`
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Rate limits by tier
const basicRateLimit = createRateLimit(15 * 60 * 1000, 100, 'basic');     // 100 requests per 15 minutes
const premiumRateLimit = createRateLimit(15 * 60 * 1000, 500, 'premium'); // 500 requests per 15 minutes  
const eliteRateLimit = createRateLimit(15 * 60 * 1000, 2000, 'elite');    // 2000 requests per 15 minutes

// Authentication middleware
async function authenticateAPI(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      message: 'Include: Authorization: Bearer YOUR_API_KEY'
    });
  }
  
  const apiKey = authHeader.substring(7);
  const customer = customerDB.customers[apiKey];
  
  if (!customer) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'API key not found or inactive'
    });
  }
  
  if (!customer.active) {
    return res.status(403).json({
      error: 'Account inactive',
      message: 'Your subscription may have expired. Please contact support.'
    });
  }
  
  // Attach customer info to request
  req.customer = customer;
  req.apiKey = apiKey;
  
  // Apply rate limiting based on tier
  if (customer.tier === 'basic') {
    basicRateLimit(req, res, next);
  } else if (customer.tier === 'premium') {
    premiumRateLimit(req, res, next);
  } else if (customer.tier === 'elite') {
    eliteRateLimit(req, res, next);
  } else {
    next();
  }
}

// Store for real-time signals
let latestSignals = [];
let connectedWebSockets = new Set();

// ==========================================
// PUBLIC ENDPOINTS (No authentication required)
// ==========================================

// API Status - Public endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: Date.now(),
    endpoints: {
      public: ['/api/status'],
      authenticated: [
        '/api/signals/latest',
        '/api/signals/history', 
        '/api/performance',
        '/api/account',
        '/api/ws' 
      ]
    },
    tiers: {
      basic: {
        price: '$97/month',
        features: ['REST API', 'Historical signals', '100 requests/15min'],
        limits: { requests_per_15min: 100 }
      },
      premium: {
        price: '$297/month', 
        features: ['REST API', 'WebSocket real-time', 'Advanced analytics', '500 requests/15min'],
        limits: { requests_per_15min: 500 }
      },
      elite: {
        price: '$997/month',
        features: ['Full API access', 'Priority support', 'Custom integrations', '2000 requests/15min'],
        limits: { requests_per_15min: 2000 }
      }
    }
  });
});

// ==========================================
// AUTHENTICATED ENDPOINTS
// ==========================================

// Get latest trading signals
router.get('/signals/latest', authenticateAPI, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 signals
  
  const signals = latestSignals.slice(-limit).map(signal => ({
    ...signal,
    // Remove internal fields for API response
    source: undefined,
    internal_id: undefined
  }));
  
  res.json({
    signals,
    count: signals.length,
    customer_tier: req.customer.tier,
    timestamp: Date.now()
  });
});

// Get signal history (premium+ only)
router.get('/signals/history', authenticateAPI, (req, res) => {
  if (req.customer.tier === 'basic') {
    return res.status(403).json({
      error: 'Feature unavailable',
      message: 'Historical signals require Premium or Elite subscription',
      upgrade_url: 'https://ogzprime.com/pricing'
    });
  }
  
  const days = Math.min(parseInt(req.query.days) || 7, 30); // Max 30 days
  const symbol = req.query.symbol;
  
  // Filter signals by date and optionally by symbol
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  let filteredSignals = latestSignals.filter(signal => signal.timestamp >= cutoffTime);
  
  if (symbol) {
    filteredSignals = filteredSignals.filter(signal => 
      signal.symbol && signal.symbol.toUpperCase() === symbol.toUpperCase()
    );
  }
  
  res.json({
    signals: filteredSignals,
    count: filteredSignals.length,
    filters: { days, symbol },
    customer_tier: req.customer.tier,
    timestamp: Date.now()
  });
});

// Get performance metrics (premium+ only)
router.get('/performance', authenticateAPI, (req, res) => {
  if (req.customer.tier === 'basic') {
    return res.status(403).json({
      error: 'Feature unavailable', 
      message: 'Performance metrics require Premium or Elite subscription',
      upgrade_url: 'https://ogzprime.com/pricing'
    });
  }
  
  // Calculate basic performance metrics
  const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentSignals = latestSignals.filter(signal => signal.timestamp >= last30Days);
  
  const totalSignals = recentSignals.length;
  const buySignals = recentSignals.filter(s => s.action === 'BUY').length;
  const sellSignals = recentSignals.filter(s => s.action === 'SELL').length;
  const avgConfidence = recentSignals.length > 0 
    ? recentSignals.reduce((sum, s) => sum + (s.confidence || 0), 0) / recentSignals.length
    : 0;
  
  res.json({
    period: '30_days',
    metrics: {
      total_signals: totalSignals,
      buy_signals: buySignals,
      sell_signals: sellSignals,
      average_confidence: Math.round(avgConfidence * 100) / 100,
      signals_per_day: Math.round((totalSignals / 30) * 100) / 100
    },
    customer_tier: req.customer.tier,
    timestamp: Date.now()
  });
});

// Get customer account info
router.get('/account', authenticateAPI, (req, res) => {
  res.json({
    customer: {
      id: req.customer.id,
      name: req.customer.name,
      tier: req.customer.tier,
      created: req.customer.created,
      active: req.customer.active
    },
    api_usage: {
      requests_today: 0, // TODO: Implement usage tracking
      rate_limit: req.customer.tier === 'basic' ? 100 : 
                  req.customer.tier === 'premium' ? 500 : 2000
    },
    timestamp: Date.now()
  });
});

// ==========================================
// WEBSOCKET ENDPOINT (Premium+ only) 
// ==========================================

router.get('/ws', authenticateAPI, (req, res) => {
  if (req.customer.tier === 'basic') {
    return res.status(403).json({
      error: 'Feature unavailable',
      message: 'WebSocket access requires Premium or Elite subscription',
      upgrade_url: 'https://ogzprime.com/pricing'
    });
  }
  
  res.json({
    websocket_url: 'wss://ogzprime.com/api/realtime',
    instructions: {
      connection: 'Connect to WebSocket URL with Authorization header',
      authentication: `Authorization: Bearer ${req.apiKey}`,
      example_code: `
const ws = new WebSocket('wss://ogzprime.com/api/realtime', {
  headers: { 'Authorization': 'Bearer ${req.apiKey}' }
});

ws.on('message', (data) => {
  const signal = JSON.parse(data);
  console.log('New signal:', signal);
});`
    }
  });
});

// ==========================================
// SIGNAL BROADCASTING FUNCTIONS
// ==========================================

// Function to broadcast new signal to all connected clients
function broadcastSignalToCustomers(signal) {
  // Add to latest signals array
  latestSignals.push({
    ...signal,
    id: signal.id || `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: signal.timestamp || Date.now()
  });
  
  // Keep only last 1000 signals in memory
  if (latestSignals.length > 1000) {
    latestSignals = latestSignals.slice(-1000);
  }
  
  // Broadcast to WebSocket connections
  const message = JSON.stringify(signal);
  connectedWebSockets.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        console.error('Failed to send signal to WebSocket client:', error);
        connectedWebSockets.delete(ws);
      }
    }
  });
  
  console.log(`📡 Signal broadcasted to ${connectedWebSockets.size} API customers`);
}

// ==========================================
// WEBSOCKET HANDLER SETUP
// ==========================================

function setupWebSocketHandler(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/api/realtime',
    verifyClient: async (info) => {
      // Verify API key from query params or headers
      const url = new URL(info.req.url, 'http://localhost');
      const apiKey = url.searchParams.get('key') || 
                    info.req.headers.authorization?.substring(7);
      
      if (!apiKey) return false;
      
      const customer = customerDB.customers[apiKey];
      return customer && customer.active && customer.tier !== 'basic';
    }
  });
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const apiKey = url.searchParams.get('key') || 
                  req.headers.authorization?.substring(7);
    const customer = customerDB.customers[apiKey];
    
    console.log(`🔗 WebSocket connected: ${customer.name} (${customer.tier})`);
    connectedWebSockets.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to OGZPrime real-time signals',
      customer_tier: customer.tier,
      timestamp: Date.now()
    }));
    
    ws.on('close', () => {
      connectedWebSockets.delete(ws);
      console.log(`🔗 WebSocket disconnected: ${customer.name}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedWebSockets.delete(ws);
    });
  });
  
  console.log('🚀 WebSocket server ready for real-time API customers');
}

// Export everything
module.exports = router;
module.exports.broadcastSignalToCustomers = broadcastSignalToCustomers;
module.exports.setupWebSocketHandler = setupWebSocketHandler;
module.exports.loadCustomerDB = loadCustomerDB;