// ==========================================
// BOT DASHBOARD - Simple Web Interface
// Access your bot from anywhere via Tailscale
// ==========================================

const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;

class BotDashboard {
  constructor(port = 3333) {
    this.app = express();
    this.port = port;
    this.botStatus = {
      running: false,
      balance: 10000,
      pnl: 0,
      trades: 0,
      uptime: 0
    };
    
    // SSL WebSocket connection for real-time data
    this.sslWs = null;
    this.connectedClients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.connectToSSL();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }
  
  setupRoutes() {
    // Serve dashboard HTML from file
    this.app.get('/', async (req, res) => {
      try {
        const dashboardPath = path.join(__dirname, 'public', 'ultdash.html');
        const html = await fs.readFile(dashboardPath, 'utf8');
        res.send(html);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        // Fallback to embedded HTML if file not found
        res.send(this.getDashboardHTML());
      }
    });
    
    // Serve CSS file
    this.app.get('/valhalla-style.css', async (req, res) => {
      try {
        const cssPath = path.join(__dirname, 'public', 'valhalla-style.css');
        const css = await fs.readFile(cssPath, 'utf8');
        res.type('css').send(css);
      } catch (error) {
        console.error('Failed to load CSS:', error);
        res.status(404).send('/* CSS not found */');
      }
    });
    
    // Serve JS file
    this.app.get('/final-dashboard.js', async (req, res) => {
      try {
        const jsPath = path.join(__dirname, 'public', 'final-dashboard.js');
        const js = await fs.readFile(jsPath, 'utf8');
        res.type('javascript').send(js);
      } catch (error) {
        console.error('Failed to load JS:', error);
        res.status(404).send('// JS not found');
      }
    });
    
    // API endpoints
    this.app.get('/api/status', (req, res) => {
      this.updateBotStatus();
      res.json(this.botStatus);
    });
    
    this.app.post('/api/start', async (req, res) => {
      try {
        exec('pm2 start clean-trading', (error, stdout) => {
          if (error) {
            res.json({ success: false, error: error.message });
          } else {
            res.json({ success: true, message: 'Bot started' });
          }
        });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/stop', async (req, res) => {
      try {
        exec('pm2 stop clean-trading', (error, stdout) => {
          if (error) {
            res.json({ success: false, error: error.message });
          } else {
            res.json({ success: true, message: 'Bot stopped' });
          }
        });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/restart', async (req, res) => {
      try {
        exec('pm2 restart clean-trading', (error, stdout) => {
          if (error) {
            res.json({ success: false, error: error.message });
          } else {
            res.json({ success: true, message: 'Bot restarted' });
          }
        });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    // TRAI chat endpoint
    this.app.post('/api/trai/ask', async (req, res) => {
      const { question } = req.body;
      
      if (this.sslWs && this.sslWs.readyState === WebSocket.OPEN) {
        this.sslWs.send(JSON.stringify({
          type: 'question',
          data: question,
          source: 'dashboard'
        }));
        
        // Wait for response (simplified - in production use proper async handling)
        setTimeout(() => {
          res.json({ answer: 'TRAI is processing your question...' });
        }, 1000);
      } else {
        res.json({ answer: 'TRAI is not connected' });
      }
    });
    
    // Get logs
    this.app.get('/api/logs/:type', async (req, res) => {
      const logType = req.params.type; // 'bot' or 'trai'
      exec(`pm2 logs ${logType === 'trai' ? 'TRAI-SINGLETON' : 'clean-trading'} --lines 50 --nostream`, 
        (error, stdout, stderr) => {
          if (error) {
            res.json({ logs: 'Error fetching logs' });
          } else {
            res.json({ logs: stdout + stderr });
          }
        });
    });
  }
  
  connectToSSL() {
    console.log('📡 Connecting to SSL server for live data...');
    
    this.sslWs = new WebSocket('ws://127.0.0.1:3010/ws', {
      headers: {
        'X-Client-Type': 'Dashboard',
        'User-Agent': 'Bot-Dashboard'
      }
    });
    
    this.sslWs.on('open', () => {
      console.log('✅ Connected to SSL server');
      this.sslWs.send(JSON.stringify({
        type: 'identify',
        source: 'dashboard',
        purpose: 'monitoring'
      }));
    });
    
    this.sslWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleSSLMessage(msg);
      } catch (error) {
        console.error('Failed to parse SSL message');
      }
    });
    
    this.sslWs.on('close', () => {
      console.log('SSL connection closed, reconnecting...');
      setTimeout(() => this.connectToSSL(), 5000);
    });
  }
  
  handleSSLMessage(msg) {
    // Update dashboard with live data
    switch (msg.type) {
      case 'trade':
        this.botStatus.trades++;
        break;
      case 'balance_update':
        this.botStatus.balance = msg.data.balance;
        this.botStatus.pnl = msg.data.pnl;
        break;
    }
    
    // Broadcast to connected dashboard clients
    this.broadcast(msg);
  }
  
  updateBotStatus() {
    exec('pm2 show clean-trading --json', (error, stdout) => {
      if (!error) {
        try {
          const info = JSON.parse(stdout);
          this.botStatus.running = info[0]?.pm2_env?.status === 'online';
          this.botStatus.uptime = info[0]?.pm2_env?.pm_uptime || 0;
        } catch (e) {
          console.error('Failed to parse PM2 status');
        }
      }
    });
  }
  
  broadcast(data) {
    // Would implement WebSocket for real-time updates to browser
    // For now, clients will poll /api/status
  }
  
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OGZ Trading Bot Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    h1 {
      font-size: 3em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .status-bar {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
    }
    .stat {
      text-align: center;
      padding: 10px;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      opacity: 0.8;
      font-size: 0.9em;
    }
    .controls {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
    }
    button {
      background: linear-gradient(135deg, #48c774 0%, #3ec46d 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 1.1em;
      border-radius: 50px;
      cursor: pointer;
      margin: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    button:active {
      transform: translateY(0);
    }
    button.stop {
      background: linear-gradient(135deg, #f14668 0%, #ee5a6f 100%);
    }
    button.restart {
      background: linear-gradient(135deg, #ffd89b 0%, #ffaa45 100%);
    }
    .chat-box {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .chat-input {
      width: 100%;
      padding: 15px;
      border-radius: 10px;
      border: none;
      background: rgba(255,255,255,0.2);
      color: white;
      font-size: 1em;
      margin-bottom: 10px;
    }
    .chat-input::placeholder {
      color: rgba(255,255,255,0.5);
    }
    .logs {
      background: rgba(0,0,0,0.3);
      border-radius: 10px;
      padding: 20px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 10px;
      animation: pulse 2s infinite;
    }
    .status-indicator.online {
      background: #48c774;
    }
    .status-indicator.offline {
      background: #f14668;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    @media (max-width: 768px) {
      h1 { font-size: 2em; }
      .stat-value { font-size: 1.5em; }
      button { padding: 12px 30px; font-size: 1em; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 OGZ Trading Bot</h1>
      <p>Control your bot from anywhere</p>
    </div>
    
    <div class="status-bar">
      <div class="stat">
        <div class="stat-value">
          <span class="status-indicator" id="status-dot"></span>
          <span id="status">Loading...</span>
        </div>
        <div class="stat-label">Status</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="balance">$0</div>
        <div class="stat-label">Balance</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="pnl">$0</div>
        <div class="stat-label">P&L</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="trades">0</div>
        <div class="stat-label">Trades</div>
      </div>
    </div>
    
    <div class="controls">
      <h2>Bot Controls</h2>
      <button onclick="startBot()" class="start">▶️ START</button>
      <button onclick="stopBot()" class="stop">⏹️ STOP</button>
      <button onclick="restartBot()" class="restart">🔄 RESTART</button>
    </div>
    
    <div class="chat-box">
      <h2>Ask TRAI</h2>
      <input type="text" class="chat-input" id="trai-input" 
             placeholder="Ask TRAI about trading strategies..." 
             onkeypress="if(event.key==='Enter') askTRAI()">
      <button onclick="askTRAI()">Ask</button>
      <div id="trai-response" style="margin-top: 15px; opacity: 0.9;"></div>
    </div>
    
    <div class="logs">
      <h3>Recent Logs</h3>
      <pre id="logs">Loading logs...</pre>
    </div>
  </div>
  
  <script>
    // Update status every 5 seconds
    setInterval(updateStatus, 5000);
    updateStatus();
    
    async function updateStatus() {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        document.getElementById('status').textContent = data.running ? 'ONLINE' : 'OFFLINE';
        document.getElementById('status-dot').className = 'status-indicator ' + (data.running ? 'online' : 'offline');
        document.getElementById('balance').textContent = '$' + data.balance.toFixed(2);
        document.getElementById('pnl').textContent = '$' + data.pnl.toFixed(2);
        document.getElementById('trades').textContent = data.trades;
        
        // Update logs
        const logsResponse = await fetch('/api/logs/bot');
        const logsData = await logsResponse.json();
        document.getElementById('logs').textContent = logsData.logs;
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }
    
    async function startBot() {
      const response = await fetch('/api/start', { method: 'POST' });
      const data = await response.json();
      alert(data.message || data.error);
      updateStatus();
    }
    
    async function stopBot() {
      const response = await fetch('/api/stop', { method: 'POST' });
      const data = await response.json();
      alert(data.message || data.error);
      updateStatus();
    }
    
    async function restartBot() {
      const response = await fetch('/api/restart', { method: 'POST' });
      const data = await response.json();
      alert(data.message || data.error);
      updateStatus();
    }
    
    async function askTRAI() {
      const input = document.getElementById('trai-input');
      const question = input.value;
      if (!question) return;
      
      const response = await fetch('/api/trai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      document.getElementById('trai-response').innerHTML = 
        '<strong>TRAI:</strong> ' + data.answer;
      input.value = '';
    }
  </script>
</body>
</html>
    `;
  }
  
  start() {
    const server = this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`
════════════════════════════════════════════════════════════
🎮 BOT DASHBOARD RUNNING
════════════════════════════════════════════════════════════
📱 Access from anywhere via Tailscale:
   http://<your-tailscale-ip>:${this.port}
   
💻 Local access:
   http://localhost:${this.port}
   
🔒 Secure, private, and mobile-friendly!
════════════════════════════════════════════════════════════
      `);
    });
    
    // WebSocket for real-time updates
    const wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
      console.log('📱 Dashboard client connected');
      this.connectedClients.add(ws);
      
      ws.on('close', () => {
        this.connectedClients.delete(ws);
      });
    });
  }
}

// Start dashboard
if (require.main === module) {
  const dashboard = new BotDashboard();
  dashboard.start();
}

module.exports = BotDashboard;