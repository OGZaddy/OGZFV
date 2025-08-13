/**
 * OGZ PRIME DASHBOARD - DUAL BOT DISPLAY
 * Real-time WebSocket connection for v13-stable and valhalla bots
 */

class DashboardConnection {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.heartbeatInterval = null;
    this.botData = {
      'v13-stable': {
        decision: 'WAITING',
        confidence: 0,
        indicators: {},
        position: 'NO_POSITION',
        unrealizedPL: 0,
        lastUpdate: null
      },
      'valhalla': {
        decision: 'WAITING',
        confidence: 0,
        indicators: {},
        position: 'NO_POSITION',
        unrealizedPL: 0,
        lastUpdate: null
      }
    };
    this.priceData = [];
    this.currentPrice = 0;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected!');
        this.reconnectAttempts = 0;
        
        // Send identification
        this.ws.send(JSON.stringify({
          type: 'identify',
          source: 'dashboard',
          timestamp: Date.now()
        }));
        
        // Update connection status
        this.updateConnectionStatus('connected');
        
        // Start heartbeat
        this.startHeartbeat();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.updateConnectionStatus('error');
      };
      
      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        this.updateConnectionStatus('disconnected');
        this.stopHeartbeat();
        this.attemptReconnect();
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.updateConnectionStatus('error');
      this.attemptReconnect();
    }
  }
  
  handleMessage(message) {
    console.log('📨 Received message:', message.type);
    
    switch (message.type) {
      case 'price':
        this.handlePriceUpdate(message.data);
        break;
        
      case 'bot_analysis':
        this.handleBotAnalysis(message);
        break;
        
      case 'trade_execution':
        this.handleTradeExecution(message);
        break;
        
      case 'status_update':
        this.handleStatusUpdate(message);
        break;
        
      case 'bot_status':
        this.handleBotStatus(message);
        break;
        
      case 'pattern_update':
        this.handlePatternUpdate(message);
        break;
        
      case 'pong':
        console.log('🏓 Pong received');
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  handlePriceUpdate(data) {
    if (data.asset === 'BTC-USD') {
      this.currentPrice = data.price;
      
      // Update price display
      document.querySelectorAll('.price-display').forEach(el => {
        el.textContent = `$${this.currentPrice.toLocaleString()}`;
      });
      
      // Add to price history for chart
      this.priceData.push({
        time: new Date(data.timestamp),
        price: data.price
      });
      
      // Keep only last 500 points
      if (this.priceData.length > 500) {
        this.priceData.shift();
      }
      
      // Update chart
      this.updatePriceChart();
    }
  }
  
  handleBotAnalysis(message) {
    const botName = message.bot;
    const data = message.data;
    
    if (!this.botData[botName]) {
      console.warn(`Unknown bot: ${botName}`);
      return;
    }
    
    // Update bot data
    this.botData[botName] = {
      ...data,
      lastUpdate: Date.now()
    };
    
    // Update bot display
    this.updateBotDisplay(botName);
  }
  
  updateBotDisplay(botName) {
    const data = this.botData[botName];
    const botSection = document.getElementById(`bot-${botName}`);
    
    if (!botSection) {
      console.warn(`Bot section not found: bot-${botName}`);
      return;
    }
    
    // Update decision
    const decisionEl = botSection.querySelector('.bot-decision');
    if (decisionEl) {
      decisionEl.textContent = data.decision || 'WAITING';
      decisionEl.className = `bot-decision ${data.decision === 'BUY' ? 'buy' : data.decision === 'SELL' ? 'sell' : 'hold'}`;
    }
    
    // Update confidence
    const confidenceEl = botSection.querySelector('.bot-confidence');
    if (confidenceEl) {
      confidenceEl.textContent = `${(data.confidence * 100).toFixed(1)}%`;
      confidenceEl.style.color = data.confidence > 0.7 ? '#22c55e' : data.confidence > 0.5 ? '#eab308' : '#ef4444';
    }
    
    // Update indicators
    const indicatorsEl = botSection.querySelector('.bot-indicators');
    if (indicatorsEl && data.indicators) {
      indicatorsEl.innerHTML = `
        <div>RSI: ${data.indicators.rsi?.toFixed(1) || 'N/A'}</div>
        <div>MACD: ${data.indicators.macd?.toFixed(2) || 'N/A'}</div>
        <div>Trend: ${data.indicators.trend || 'N/A'}</div>
        <div>Vol: ${data.indicators.volatility?.toFixed(1) || 'N/A'}%</div>
      `;
    }
    
    // Update position
    const positionEl = botSection.querySelector('.bot-position');
    if (positionEl) {
      positionEl.textContent = data.position || 'NO_POSITION';
      positionEl.className = `bot-position ${data.position === 'IN_POSITION' ? 'in-position' : 'no-position'}`;
    }
    
    // Update P/L
    const plEl = botSection.querySelector('.bot-pl');
    if (plEl) {
      const pl = data.unrealizedPL || 0;
      plEl.textContent = `$${pl.toFixed(2)}`;
      plEl.style.color = pl > 0 ? '#22c55e' : pl < 0 ? '#ef4444' : '#666';
    }
    
    // Update status indicator
    const statusEl = botSection.querySelector('.bot-status');
    if (statusEl) {
      const isActive = Date.now() - data.lastUpdate < 10000; // Active if updated in last 10 seconds
      statusEl.className = `bot-status ${isActive ? 'active' : 'inactive'}`;
      statusEl.textContent = isActive ? '🟢 Active' : '🔴 Inactive';
    }
  }
  
  handleTradeExecution(message) {
    console.log(`💰 Trade executed by ${message.bot}: ${message.action} at $${message.price}`);
    
    // Add to trade history
    const tradeHistory = document.getElementById('trade-history');
    if (tradeHistory) {
      const tradeEl = document.createElement('div');
      tradeEl.className = `trade-item ${message.action.toLowerCase()}`;
      tradeEl.innerHTML = `
        <span class="trade-time">${new Date().toLocaleTimeString()}</span>
        <span class="trade-bot">${message.bot}</span>
        <span class="trade-action">${message.action}</span>
        <span class="trade-price">$${message.price.toFixed(2)}</span>
      `;
      tradeHistory.insertBefore(tradeEl, tradeHistory.firstChild);
      
      // Keep only last 20 trades
      while (tradeHistory.children.length > 20) {
        tradeHistory.removeChild(tradeHistory.lastChild);
      }
    }
  }
  
  handleBotStatus(message) {
    const botName = message.bot;
    const status = message.status;
    const data = message.data;
    
    if (this.botData[botName]) {
      // Update bot as active
      this.botData[botName].lastUpdate = Date.now();
      
      if (data) {
        this.botData[botName] = {
          ...this.botData[botName],
          decision: data.decision || 'WAITING',
          confidence: (data.confidence / 100) || 0,
          balance: data.balance || 10000,
          winRate: data.winRate || 0,
          totalTrades: data.totalTrades || 0,
          dailyPnL: data.dailyPnL || 0
        };
      }
      
      // Update bot display
      this.updateBotDisplay(botName);
      console.log(`🤖 Bot status: ${botName} is ${status}`);
    }
  }
  
  handleStatusUpdate(message) {
    // Determine which bot sent the status
    const botName = message.bot || 'valhalla'; // Default to valhalla if not specified
    
    // Update bot data with status info
    if (this.botData[botName]) {
      this.botData[botName] = {
        decision: message.decision || 'WAITING',
        confidence: message.confidence / 100 || 0, // Convert from percentage
        indicators: {
          rsi: message.systemState?.rsi || 50,
          macd: message.systemState?.macd || 0,
          trend: message.systemState?.trend || 'sideways',
          volatility: message.systemState?.volatility || 0
        },
        position: message.systemState?.position || 'NO_POSITION',
        unrealizedPL: message.systemState?.unrealizedPL || 0,
        balance: message.balance || 10000,
        winRate: message.winRate || 0,
        totalTrades: message.totalTrades || 0,
        dailyPnL: message.dailyPnL || 0,
        lastUpdate: Date.now()
      };
      
      // Update bot display
      this.updateBotDisplay(botName);
      
      console.log(`📊 Status update received for ${botName}`);
    }
  }
  
  handlePatternUpdate(message) {
    const patterns = message.patterns || [];
    const patternDisplay = document.getElementById('pattern-display');
    
    if (patternDisplay && patterns.length > 0) {
      patternDisplay.innerHTML = patterns.map(p => `
        <div class="pattern-item">
          <span class="pattern-name">${p.name}</span>
          <span class="pattern-confidence">${(p.confidence * 100).toFixed(1)}%</span>
        </div>
      `).join('');
    }
  }
  
  updatePriceChart() {
    // Update chart if it exists
    if (window.priceChart && this.priceData.length > 0) {
      window.priceChart.updateData(this.priceData);
    }
  }
  
  updateConnectionStatus(status) {
    const statusElements = document.querySelectorAll('.connection-status');
    statusElements.forEach(el => {
      el.className = `connection-status ${status}`;
      el.textContent = status === 'connected' ? '🟢 Connected' : 
                       status === 'disconnected' ? '🔴 Disconnected' : 
                       '🟡 Connecting...';
    });
    
    // Update data feed status
    const dataFeedEl = document.getElementById('data-feed-status');
    if (dataFeedEl) {
      dataFeedEl.className = `status-indicator ${status === 'connected' ? 'connected' : 'disconnected'}`;
      dataFeedEl.textContent = status === 'connected' ? 'Live' : 'Offline';
    }
  }
  
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Every 30 seconds
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      // Increase delay for next attempt
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    } else {
      console.error('Max reconnect attempts reached');
      this.updateConnectionStatus('error');
    }
  }
  
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Initialize dashboard connection when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing OGZ Prime Dashboard');
  
  // Create global dashboard connection
  window.dashboardConnection = new DashboardConnection();
  window.dashboardConnection.connect();
  
  // Add manual refresh button handler
  const refreshBtn = document.getElementById('refresh-dashboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  // Add reconnect button handler
  const reconnectBtn = document.getElementById('reconnect-ws');
  if (reconnectBtn) {
    reconnectBtn.addEventListener('click', () => {
      window.dashboardConnection.disconnect();
      window.dashboardConnection.connect();
    });
  }
});

console.log('✅ Dashboard script loaded');