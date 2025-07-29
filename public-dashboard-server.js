/**
 * PUBLIC DASHBOARD SERVER
 * Serves the OGZ Ultimate Dashboard publicly with real-time data
 * 
 * This server:
 * - Serves the dashboard HTML
 * - Proxies WebSocket connections
 * - Handles API endpoints
 * - Manages SSL for production
 */

const { getWebSocketUrl, getHttpUrl, isProduction, getConfig } = require('./core/WebSocketConfig');
const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.DASHBOARD_PORT || 8080;
const SSL_PORT = process.env.DASHBOARD_SSL_PORT || 8443;

// Express app
const app = express();
app.use(express.json());

// CORS for public access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ogz-ultimate-dashboard.html'));
});

// Serve static files (if any)
app.use('/assets', express.static(path.join(__dirname, 'public')));

// API status endpoint
app.get('/api/status', (req, res) => {
    const config = getConfig();
    res.json({
        status: 'online',
        environment: config.environment,
        websocketUrls: config.websocketUrls,
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket proxy server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    console.log('🔌 New dashboard connection from:', req.socket.remoteAddress);
    
    // Connect to the actual trading bot WebSocket
    const botUrl = getWebSocketUrl('api'); // Connect to the bot on port 3010
    console.log(`🔗 Proxying to bot at: ${botUrl}`);
    
    let botWs = null;
    try {
        botWs = new WebSocket(botUrl);
        
        // Forward messages from dashboard to bot
        ws.on('message', (message) => {
            if (botWs && botWs.readyState === WebSocket.OPEN) {
                botWs.send(message);
            }
        });
        
        // Forward messages from bot to dashboard
        botWs.on('message', (message) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
        
        // Handle bot connection events
        botWs.on('open', () => {
            console.log('✅ Connected to bot WebSocket');
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'system',
                    message: 'Connected to trading engine'
                }));
            }
        });
        
        botWs.on('close', () => {
            console.log('❌ Bot WebSocket closed');
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'system',
                    message: 'Disconnected from trading engine'
                }));
                ws.close();
            }
        });
        
        botWs.on('error', (error) => {
            console.error('Bot WebSocket error:', error);
        });
        
    } catch (error) {
        console.error('Failed to connect to bot:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to connect to trading engine'
        }));
    }
    
    // Clean up on dashboard disconnect
    ws.on('close', () => {
        console.log('📤 Dashboard disconnected');
        if (botWs) {
            botWs.close();
        }
    });
    
    ws.on('error', (error) => {
        console.error('Dashboard WebSocket error:', error);
    });
});

// Start server
if (isProduction() && process.env.USE_SSL === 'true') {
    // Production with SSL
    try {
        const sslOptions = {
            key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
            cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
        };
        
        const httpsServer = https.createServer(sslOptions, app);
        const wssSecure = new WebSocket.Server({ server: httpsServer });
        
        // Copy WebSocket handling to secure server
        wssSecure.on('connection', wss.listeners('connection')[0]);
        
        httpsServer.listen(SSL_PORT, () => {
            console.log(`🔒 Public Dashboard Server (HTTPS) running on port ${SSL_PORT}`);
            console.log(`🌐 Access at: https://${process.env.WEBSOCKET_DOMAIN}:${SSL_PORT}`);
        });
        
        // Also start HTTP server for redirect
        const redirectApp = express();
        redirectApp.all('*', (req, res) => {
            res.redirect(`https://${req.hostname}:${SSL_PORT}${req.url}`);
        });
        http.createServer(redirectApp).listen(PORT, () => {
            console.log(`↪️  HTTP redirect server running on port ${PORT}`);
        });
        
    } catch (error) {
        console.error('SSL setup failed, falling back to HTTP:', error.message);
        startHttpServer();
    }
} else {
    // Development or production without SSL
    startHttpServer();
}

function startHttpServer() {
    server.listen(PORT, () => {
        console.log(`🚀 Public Dashboard Server running on port ${PORT}`);
        console.log(`🌐 Access at: http://localhost:${PORT}`);
        console.log('\n📊 WebSocket Configuration:');
        console.log(JSON.stringify(getConfig(), null, 2));
        console.log('\n✨ Dashboard is ready for public access!');
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    wss.clients.forEach((ws) => {
        ws.close(1000, 'Server shutting down');
    });
    server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});
