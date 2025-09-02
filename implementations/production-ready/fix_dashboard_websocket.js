// 05_fix_dashboard_websocket.js - FIX DASHBOARD WEBSOCKET CONNECTION
// TARGET: unified-dashboard.html and all dashboard files
// FIXES: Hardcoded ws://127.0.0.1:3010/ws, production detection

const fs = require('fs');
const path = require('path');

// Find all dashboard HTML files
function findDashboardFiles() {
  const dashboardFiles = [];
  const directories = [
    __dirname,
    path.join(__dirname, 'ui'),
    path.join(__dirname, 'public'),
    path.join(__dirname, 'trading-system')
  ];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.includes('dashboard') && file.endsWith('.html')) {
          dashboardFiles.push(path.join(dir, file));
        }
      });
    }
  }
  
  return dashboardFiles;
}

// Dashboard WebSocket connection fix
const DASHBOARD_WS_FIX = `
<script>
// FIXED DASHBOARD WEBSOCKET CONNECTION
(function() {
  'use strict';
  
  // WebSocket configuration - PRODUCTION READY
  const WS_CONFIG = {
    // ALWAYS use 127.0.0.1:3010 in production
    host: '127.0.0.1',
    port: 3010,
    path: '/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 100,
    heartbeatInterval: 30000
  };
  
  // Build WebSocket URL
  function getWebSocketURL() {
    // Check if we're in production (HTTPS or specific domain)
    const isProduction = window.location.protocol === 'https:' || 
                        window.location.hostname !== 'localhost';
    
    // In production, always use the configured host/port
    if (isProduction) {
      return 'ws://' + WS_CONFIG.host + ':' + WS_CONFIG.port + WS_CONFIG.path;
    }
    
    // In development, allow dynamic host but keep port 3010
    const devHost = window.location.hostname || '127.0.0.1';
    return 'ws://' + devHost + ':' + WS_CONFIG.port + WS_CONFIG.path;
  }
  
  // WebSocket connection manager
  class DashboardWebSocket {
    constructor() {
      this.ws = null;
      this.reconnectAttempts = 0;
      this.reconnectTimer = null;
      this.heartbeatTimer = null;
      this.messageQueue = [];
      this.isConnected = false;
      this.listeners = new Map();
      
      // Auto-connect on creation
      this.connect();
    }
    
    connect() {
      const url = getWebSocketURL();
      console.log('🔌 Connecting to WebSocket:', url);
      
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected to', url);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send identification
          this.send({
            type: 'identify',
            source: 'dashboard',
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          });
          
          // Process queued messages
          this.processQueue();
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Emit connected event
          this.emit('connected', { url });
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('❌ WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.ws = null;
          
          // Stop heartbeat
          this.stopHeartbeat();
          
          // Emit disconnected event
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          // Schedule reconnection
          this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.scheduleReconnect();
      }
    }
    
    handleMessage(data) {
      // Emit message event
      this.emit('message', data);
      
      // Handle specific message types
      switch (data.type) {
        case 'market_data':
          this.emit('market_data', data.data);
          this.updateMarketDisplay(data.data);
          break;
          
        case 'trade_executed':
          this.emit('trade', data.data);
          this.updateTradeDisplay(data.data);
          break;
          
        case 'status_update':
          this.emit('status', data.data);
          this.updateStatusDisplay(data.data);
          break;
          
        case 'error':
          this.emit('error', data.error);
          this.showError(data.error);
          break;
          
        default:
          // Custom event handling
          this.emit(data.type, data);
      }
    }
    
    send(message) {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        this.ws.send(data);
        return true;
      }
      
      // Queue message if not connected
      this.messageQueue.push(message);
      return false;
    }
    
    processQueue() {
      while (this.messageQueue.length > 0 && this.isConnected) {
        const message = this.messageQueue.shift();
        this.send(message);
      }
    }
    
    scheduleReconnect() {
      if (this.reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.showError('Unable to connect to trading server');
        return;
      }
      
      this.reconnectAttempts++;
      const delay = Math.min(WS_CONFIG.reconnectInterval * this.reconnectAttempts, 30000);
      
      console.log('🔄 Reconnecting in', delay, 'ms (attempt', this.reconnectAttempts, ')');
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
    
    startHeartbeat() {
      this.heartbeatTimer = setInterval(() => {
        if (this.isConnected) {
          this.send({ type: 'ping', timestamp: Date.now() });
        }
      }, WS_CONFIG.heartbeatInterval);
    }
    
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }
    
    // Event emitter functionality
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    }
    
    emit(event, data) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        });
      }
    }
    
    // UI update methods
    updateMarketDisplay(data) {
      // Update price displays
      const priceElements = document.querySelectorAll('[data-price]');
      priceElements.forEach(el => {
        if (el.dataset.price === data.asset) {
          el.textContent = '$' + data.price.toFixed(2);
          
          // Add price change animation
          el.classList.remove('price-up', 'price-down');
          if (data.change > 0) {
            el.classList.add('price-up');
          } else if (data.change < 0) {
            el.classList.add('price-down');
          }
        }
      });
    }
    
    updateTradeDisplay(trade) {
      // Update trade log
      const tradeLog = document.getElementById('trade-log');
      if (tradeLog) {
        const tradeElement = document.createElement('div');
        tradeElement.className = 'trade-item ' + trade.action.toLowerCase();
        tradeElement.innerHTML = \`
          <span class="trade-time">\${new Date(trade.timestamp).toLocaleTimeString()}</span>
          <span class="trade-action \${trade.action.toLowerCase()}">\${trade.action}</span>
          <span class="trade-price">$\${trade.price.toFixed(2)}</span>
          <span class="trade-size">\${trade.positionSize.toFixed(2)}</span>
          <span class="trade-pnl \${trade.pnl > 0 ? 'profit' : 'loss'}">
            \${trade.pnl ? (trade.pnl > 0 ? '+' : '') + trade.pnl.toFixed(2) : ''}
          </span>
        \`;
        
        tradeLog.insertBefore(tradeElement, tradeLog.firstChild);
        
        // Limit trade log to 100 items
        while (tradeLog.children.length > 100) {
          tradeLog.removeChild(tradeLog.lastChild);
        }
      }
      
      // Update statistics
      this.updateStatistics(trade);
    }
    
    updateStatusDisplay(status) {
      // Update connection status
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        statusElement.className = 'status ' + (status.connected ? 'connected' : 'disconnected');
        statusElement.textContent = status.connected ? 'Connected' : 'Disconnected';
      }
      
      // Update bot status
      const botStatus = document.getElementById('bot-status');
      if (botStatus) {
        botStatus.innerHTML = \`
          <div>Mode: \${status.mode || 'Unknown'}</div>
          <div>Balance: $\${(status.balance || 0).toFixed(2)}</div>
          <div>Positions: \${status.openPositions || 0}</div>
          <div>Trades: \${status.totalTrades || 0}</div>
        \`;
      }
    }
    
    updateStatistics(trade) {
      // Update win rate, P&L, etc.
      const stats = document.getElementById('statistics');
      if (stats && trade.balance) {
        const winRate = document.querySelector('[data-stat="win-rate"]');
        const totalPnl = document.querySelector('[data-stat="total-pnl"]');
        const balance = document.querySelector('[data-stat="balance"]');
        
        if (winRate && trade.winRate) {
          winRate.textContent = trade.winRate;
        }
        
        if (totalPnl && trade.totalPnl !== undefined) {
          totalPnl.textContent = '$' + trade.totalPnl.toFixed(2);
          totalPnl.className = trade.totalPnl >= 0 ? 'profit' : 'loss';
        }
        
        if (balance) {
          balance.textContent = '$' + trade.balance.toFixed(2);
        }
      }
    }
    
    showError(error) {
      const errorContainer = document.getElementById('error-container');
      if (errorContainer) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = error;
        
        errorContainer.appendChild(errorElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          errorContainer.removeChild(errorElement);
        }, 5000);
      }
    }
    
    // Cleanup
    destroy() {
      this.stopHeartbeat();
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      if (this.ws) {
        this.ws.close();
      }
      
      this.listeners.clear();
      this.messageQueue = [];
    }
  }
  
  // Create global dashboard WebSocket instance
  window.dashboardWS = new DashboardWebSocket();
  
  // Expose for console debugging
  window.getDashboardWSStatus = function() {
    return {
      connected: window.dashboardWS.isConnected,
      url: getWebSocketURL(),
      reconnectAttempts: window.dashboardWS.reconnectAttempts,
      queuedMessages: window.dashboardWS.messageQueue.length
    };
  };
  
  console.log('✅ Dashboard WebSocket initialized');
  console.log('📊 Status:', window.getDashboardWSStatus());
  
})();
</script>
`;

function fixDashboardWebSocket() {
  console.log('🔧 FIXING DASHBOARD WEBSOCKET CONNECTIONS');
  console.log('=========================================');
  
  const dashboardFiles = findDashboardFiles();
  console.log('  Found', dashboardFiles.length, 'dashboard files');
  
  let fixedCount = 0;
  
  for (const filePath of dashboardFiles) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove old WebSocket code
      content = content.replace(/\/\/ WebSocket connection[\s\S]*?<\/script>/g, '');
      content = content.replace(/const ws = new WebSocket[\s\S]*?};/g, '');
      
      // Find where to insert new code (before </body> or at end)
      if (content.includes('</body>')) {
        content = content.replace('</body>', DASHBOARD_WS_FIX + '\\n</body>');
      } else {
        content += DASHBOARD_WS_FIX;
      }
      
      // Fix any hardcoded WebSocket URLs
      content = content.replace(/ws:\/\/localhost:\d+/g, 'ws://127.0.0.1:3010');
      content = content.replace(/wss:\/\/localhost:\d+/g, 'ws://127.0.0.1:3010');
      
      // Write fixed file
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log('  ✅ Fixed:', path.basename(filePath));
      fixedCount++;
      
    } catch (error) {
      console.error('  ❌ Failed to fix', filePath + ':', error.message);
    }
  }
  
  return fixedCount;
}

// Create a standalone dashboard WebSocket module
function createDashboardWSModule() {
  const moduleContent = `
// dashboard-websocket.js - Standalone WebSocket module for dashboards
const WS_CONFIG = {
  host: '127.0.0.1',
  port: 3010,
  path: '/ws'
};

class DashboardWebSocket {
  constructor() {
    this.url = 'ws://' + WS_CONFIG.host + ':' + WS_CONFIG.port + WS_CONFIG.path;
    this.ws = null;
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => console.log('✅ Dashboard connected to', this.url);
    this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
    this.ws.onclose = () => setTimeout(() => this.connect(), 5000);
    this.ws.onerror = (e) => console.error('WebSocket error:', e);
  }
  
  handleMessage(data) {
    // Emit custom event for dashboard components
    window.dispatchEvent(new CustomEvent('ws-message', { detail: data }));
  }
  
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.dashboardWS = new DashboardWebSocket();
}

module.exports = DashboardWebSocket;
`;
  
  const modulePath = path.join(__dirname, 'dashboard-websocket.js');
  fs.writeFileSync(modulePath, moduleContent, 'utf8');
  console.log('  ✅ Created dashboard-websocket.js module');
}

// Execute if run directly
if (require.main === module) {
  console.log('\\n🚀 EXECUTING DASHBOARD WEBSOCKET FIX');
  console.log('====================================\\n');
  
  const fixedCount = fixDashboardWebSocket();
  createDashboardWSModule();
  
  console.log('\\n✅ DASHBOARD WEBSOCKET FIX COMPLETE!');
  console.log('📊 Fixed', fixedCount, 'dashboard files');
  console.log('🌐 All dashboards now use ws://127.0.0.1:3010/ws');
  console.log('🔄 Auto-reconnection enabled');
  console.log('💓 Heartbeat keepalive active\\n');
}

module.exports = { fixDashboardWebSocket, createDashboardWSModule };