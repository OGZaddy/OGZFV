# 📡 WEBSOCKET CONFIGURATION FILES INVENTORY

## 🎯 Core WebSocket Configuration Files

1. **core/WebSocketConfig.js** ⭐
   - Central configuration for all WebSocketaURLs and ports
   - Environment-aware (development/production)
   - Provides `getWebSocketUrl()` and `getHttpUrl()` functions

2. **core/AdvancedWebSocketBroadcastSystem.js** ⭐
   - Advanced broadcasting system with priority queuing
   - Message batching and compression
   - Connection health monitoring
   - Circuit breaker pattern

3. **core/WebsocketManager.js** ⭐
   - Singleton WebSocket server manager
   - Handles multiple WebSocket servers on different ports
   - Prevents port conflicts

4. **core/PolygonWebSocket.js**
   - Handles Polygon.io real-time data feed
   - Auto-reconnection logic
   - Data validation

5. **core/ConnectionResilience.js** ⭐
   - Monitors WebSocket connection health
   - Auto-recovery from disconnects
   - Data timestamp tracking
   - Stale data detection

## 🚀 Main Server Files

6. **ogzprime_ssl_server_advanced.js** ⭐
   - Main SSL server with advanced broadcasting
   - Integrates AdvancedWebSocketBroadcastSystem
   - Handles Polygon data and broadcasts to clients
   - Port: 3010

7. **public-dashboard-server.js**
   - Public dashboard server
   - WebSocket proxy to main server
   - Port: 8080

8. **ogzprime_live_stream.js**
   - Live streaming server
   - WebSocket server on port 3005
   - API on port 3006

## 🤖 Trading Bot Integration

9. **trading-bot-websocket-integration.js** ⭐
   - Enhanced WebSocket client for trading bot
   - CRITICAL priority connection
   - Bot identification and status updates
   - Market data caching

10. **run-trading-bot-v13-simplified.js**
    - Main trading bot file
    - Integrates EnhancedWebSocketClient
    - WebSocket server on port 8001

## 🛠️ Utility and Migration Files

11. **migrate-websockets.js**
    - Migration script to replace hardcoded URLs
    - Converts to centralized configuration
    - Creates backups

12. **test-websocket-client.js**
    - WebSocket testing client
    - Tests connection to data feed

13. **WEBSOCKET_IMPLEMENTATION_GUIDE.md**
    - Comprehensive implementation guide
    - Migration instructions
    - Best practices

## 📊 API and Dashboard Files

14. **api/WebBroadcastManager.js**
    - Web broadcast manager
    - Client management
    - Message broadcasting

15. **api/live-trading-data.js**
    - Live trading data API
    - WebSocket server for real-time updates

16. **api/transparency_api.js**
    - Transparency API
    - WebSocket status endpoint
    - Port: 3009

17. **api/website-reporting.js**
    - Website reporting functionality
    - Uses WebSocketConfig

## 🔍 Testing and Debugging

18. **test-dashboard-bugs.js**
    - Dashboard bug detector
    - Tests WebSocket connections
    - Port conflict detection

19. **test-trading-logic-bugs.js**
    - Trading logic bug detector
    - Disconnect recovery testing
    - Pattern decay analysis

## 📦 Additional Files with WebSocket Code

20. **OGZPrimeV10.2.js**
    - Main OGZ Prime class
    - WebSocket initialization
    - Ports: 3001 (data), 3002 (GUI), 3003 (control)

21. **historical-data-loader.js**
    - Historical data server
    - WebSocket streaming for backtesting

22. **turbo-train-autoloaded.js**
    - Auto-loading system
    - WebSocket manager integration

## 🔧 Configuration and Patches

23. **websocket-price-reception-fix.patch**
    - Price reception fix patch

24. **websocket-unified-fix.js**
    - Unified WebSocket fixes

25. **update-bot-config.js**
    - Bot configuration updater
    - WebSocket timeout settings

## 📁 Key Directories

- **core/** - Core WebSocket modules
- **api/** - API-related WebSocket implementations
- **websocket-migration-backup/** - Backup directory for migrations

## 🎯 Port Assignments

- **3001**: Data WebSocket (legacy)
- **3002**: GUI WebSocket (legacy)
- **3003**: Control WebSocket (legacy)
- **3005**: Live stream WebSocket
- **3006**: Live stream API
- **3008**: Trading bot API
- **3009**: Transparency WebSocket
- **3010**: SSL server (main)
- **8001**: Trading bot WebSocket
- **8080**: Public dashboard
- **8443**: SSL dashboard (if SSL enabled)

## 📝 Summary

Total WebSocket-related files: **25+ files**

The system has evolved from simple hardcoded WebSocket URLs to a sophisticated centralized configuration system with:
- Environment-aware configuration
- Advanced broadcasting capabilities
- Connection resilience
- Priority queuing
- Automatic failover
- Health monitoring
