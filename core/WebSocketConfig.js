/**
 * CENTRALIZED WEBSOCKET CONFIGURATION
 * Never manually change WebSocket URLs again!
 * 
 * This file automatically handles:
 * - Development vs Production URLs
 * - Port configuration
 * - SSL/WSS support
 * - Domain configuration
 */

const CONFIG = {
  // Default ports for each service
  ports: {
    data: 3001,
    gui: 3002,
    control: 3003,
    api: 3010,
    transparency: 8080,
    analytics: 8081,
    monitor: 8082,
    backup: 8083
  },
  
  // Base URLs for different environments
  getBaseUrl: function() {
    // Special override for complex setups
    if (process.env.WEBSOCKET_BASE_URL) {
      return process.env.WEBSOCKET_BASE_URL;
    }
    
    // Production mode
    if (process.env.NODE_ENV === 'production') {
      const domain = process.env.WEBSOCKET_DOMAIN || 'localhost';
      const protocol = process.env.USE_SSL === 'true' ? 'wss' : 'ws';
      return `${protocol}://${domain}`;
    }
    
    // Development mode (default)
    return 'ws://localhost';
  },
  
  // HTTP URL for API endpoints
  getHttpBaseUrl: function() {
    if (process.env.HTTP_BASE_URL) {
      return process.env.HTTP_BASE_URL;
    }
    
    if (process.env.NODE_ENV === 'production') {
      const domain = process.env.WEBSOCKET_DOMAIN || 'localhost';
      const protocol = process.env.USE_SSL === 'true' ? 'https' : 'http';
      return `${protocol}://${domain}`;
    }
    
    return 'http://localhost';
  }
};

/**
 * Get WebSocket URL for a specific service
 * @param {string} service - Service name (data, gui, control, api, etc.)
 * @returns {string} Complete WebSocket URL
 */
function getWebSocketUrl(service) {
  const baseUrl = CONFIG.getBaseUrl();
  const port = process.env[`WEBSOCKET_${service.toUpperCase()}_PORT`] || CONFIG.ports[service] || CONFIG.ports.data;
  return `${baseUrl}:${port}`;
}

/**
 * Get HTTP URL for API endpoints
 * @param {string} service - Service name
 * @returns {string} Complete HTTP URL
 */
function getHttpUrl(service) {
  const baseUrl = CONFIG.getHttpBaseUrl();
  const port = process.env[`HTTP_${service.toUpperCase()}_PORT`] || CONFIG.ports[service] || CONFIG.ports.api;
  return `${baseUrl}:${port}`;
}

/**
 * Get all configured URLs (useful for debugging)
 * @returns {object} All WebSocket and HTTP URLs
 */
function getConfig() {
  const urls = {};
  const httpUrls = {};
  
  Object.keys(CONFIG.ports).forEach(service => {
    urls[service] = getWebSocketUrl(service);
    httpUrls[service] = getHttpUrl(service);
  });
  
  return {
    websocketUrls: urls,
    httpUrls: httpUrls,
    baseUrl: CONFIG.getBaseUrl(),
    httpBaseUrl: CONFIG.getHttpBaseUrl(),
    ports: CONFIG.ports,
    environment: process.env.NODE_ENV || 'development',
    currentUrls: urls // For backward compatibility
  };
}

/**
 * Check if we're in production mode
 * @returns {boolean}
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get the current domain
 * @returns {string}
 */
function getDomain() {
  return process.env.WEBSOCKET_DOMAIN || 'localhost';
}

// Export everything needed
module.exports = {
  getWebSocketUrl,
  getHttpUrl,
  getConfig,
  isProduction,
  getDomain,
  CONFIG
};

// Debug output when this module loads (only in development)
if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_WEBSOCKET_CONFIG) {
  console.log('🔧 WebSocket Configuration Loaded:');
  console.log(JSON.stringify(getConfig(), null, 2));
}
