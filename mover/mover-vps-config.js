// ==========================================
// FILE: mover-vps-config.js
// VPS-optimized configuration for production deployment
// ==========================================

const VPS_CONFIG = {
  // Memory optimization for VPS environment
  memory: {
    maxMemorySize: 50000,       // Large capacity for full AI capabilities
    persistInterval: 300000,    // 5 minutes instead of 1 minute
    compressionRatio: 10,       // Less aggressive compression for better recall
    maxShortTermEvents: 10000,  // Full capacity for trading, tech support, sales, etc.
    cleanupInterval: 1800000,   // 30 minute cleanup for better performance
    
    // VPS-specific memory limits (increased for full functionality)
    maxLongTermCategories: 100, // Support all categories: trading, tech, sales, conversation
    maxDoctrineSize: 500,       // MB limit for massive training data
    enableSwapToDisk: true,     // Use disk for overflow
    enableAdvancedPatternRecognition: true, // Full pattern recognition
    enableFullMemoryCapabilities: true      // All memory features enabled
  },

  // Server optimization
  server: {
    httpPort: process.env.MOVER_HTTP_PORT || 4000,
    wsPort: process.env.MOVER_WS_PORT || 4001,
    maxConnections: 100,        // Limit concurrent connections
    requestTimeout: 30000,      // 30 second timeout
    enableGzip: true,          // Compress responses
    rateLimitPerMinute: 60     // Rate limiting
  },

  // Storage optimization for VPS
  storage: {
    memoryDir: process.env.VPS_MEMORY_DIR || '/tmp/mover-memory',
    logDir: process.env.VPS_LOG_DIR || '/var/log/mover',
    maxLogFileSize: '10MB',
    maxLogFiles: 5,
    enableLogRotation: true,
    useAsyncWrites: true
  },

  // VPS resource monitoring
  monitoring: {
    enableCpuMonitoring: true,
    enableMemoryMonitoring: true,
    enableDiskMonitoring: true,
    alertThresholds: {
      cpu: 80,      // Alert if CPU > 80%
      memory: 75,   // Alert if memory > 75%
      disk: 85      // Alert if disk > 85%
    }
  },

  // Features to disable on VPS to save resources
  features: {
    voiceEnabled: false,           // Disable by default to save bandwidth
    contentGeneration: 'minimal',  // Reduce content generation
    debugLogging: false,          // Disable verbose logging
    enableAnalytics: false,       // Disable analytics to save storage
    enableVideoGeneration: false  // Disable heavy video features
  },

  // Network optimization for VPS
  network: {
    keepAliveTimeout: 60000,
    headerTimeout: 60000,
    maxHeaderSize: 8192,
    enableCompression: true
  }
};

module.exports = VPS_CONFIG;
