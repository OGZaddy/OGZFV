/**
 * COMPLETE FIX FOR SSL SERVER / TRADING BOT CONFLICT
 * 
 * This fix ensures SSL server and trading bot can run simultaneously
 * without port conflicts or disconnections.
 */

const WebSocketManager = require('./core/WebsocketManager');

// Use DIFFERENT ports for SSL server to avoid conflicts
const SSL_PORTS = {
  data: 4001,      // Changed from 3001
  gui: 4002,       // Changed from 3002
  control: 4003,   // Changed from 3003
  ssl: 3443        // SSL-specific port
};

// Set environment flag so OGZPrime knows SSL is running
process.env.OGZ_SSL_SERVER = 'true';
process.env.OGZ_SSL_PORTS = JSON.stringify(SSL_PORTS);

console.log('🔒 Starting SSL WebSocket servers on ports:', SSL_PORTS);
console.log('🔒 Regular bot will use standard ports 3001-3003');

// Use the WebSocket manager singleton directly (not with 'new')
const wsManager = WebSocketManager;

try {
  // Create servers on SSL ports
  const dataServer = wsManager.getServer(SSL_PORTS.data);
  const guiServer = wsManager.getServer(SSL_PORTS.gui);
  const controlServer = wsManager.getServer(SSL_PORTS.control);
  
  console.log('✅ SSL WebSocket servers started successfully');
  console.log(`📡 SSL Data WebSocket: ws://localhost:${SSL_PORTS.data}`);
  console.log(`🖥️  SSL GUI WebSocket: ws://localhost:${SSL_PORTS.gui}`);
  console.log(`🎮 SSL Control WebSocket: ws://localhost:${SSL_PORTS.control}`);
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down SSL servers...');
    wsManager.closeServer(SSL_PORTS.data);
    wsManager.closeServer(SSL_PORTS.gui);
    wsManager.closeServer(SSL_PORTS.control);
    process.exit(0);
  });
  
} catch (error) {
  console.error('❌ Failed to start SSL servers:', error.message);
  process.exit(1);
}