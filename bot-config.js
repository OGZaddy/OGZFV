// bot-config.js - SINGLE SOURCE OF TRUTH for all bot connections
module.exports = {
    // Use explicit IPv4 address to avoid IPv6 issues
    WS_URL: process.env.WS_URL || 'ws://127.0.0.1:3010',
    RECONNECT_DELAY: 3000,
    HEARTBEAT_INTERVAL: 5000,
    MAX_RECONNECT_ATTEMPTS: 10
};