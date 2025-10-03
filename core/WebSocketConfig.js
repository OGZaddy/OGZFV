// core/WebSocketConfig.js
const CONFIG = {
  ports: {
    unified: 3010,    // NEW - Single unified port for everything
    data: 3010,       // Legacy compatibility
    gui: 3010,        // Legacy compatibility
    control: 3010,    // Legacy compatibility
    api: 3010         // API connections
  },
  environment: process.env.NODE_ENV || 'development',
  domain: process.env.WEBSOCKET_DOMAIN || '127.0.0.1'  // Force IPv4 instead of localhost
};

module.exports = {
  CONFIG,
  getWebSocketUrl: (service) => {
    const port = CONFIG.ports[service] || CONFIG.ports.unified;
    const protocol = process.env.USE_SSL === 'true' ? 'wss' : 'ws';
    
    // Force IPv4 in development to prevent IPv6 issues
    if (CONFIG.environment === 'development') {
      return `${protocol}://127.0.0.1:${port}/ws`;
    }
    
    return `${protocol}://${CONFIG.domain}:${port}/ws`;
  }
};
