// 📁 FILE: control-server.js
const WebSocket = require('ws');

class ControlServer {
  constructor(ogzPrime, config = {}) {
    this.ogzPrime = ogzPrime;
    this.config = {
      port: 3023,                // FIXED: Changed from 3003 to avoid conflict with main bot
      logCommands: true,
      ...config
    };
    this.server = null;
    this.clients = new Set();
  }

  start() {
    this.server = new WebSocket.Server({ port: this.config.port });
    
    this.server.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`🎮 Control client connected (Total: ${this.clients.size})`);
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'connected',
        status: this.ogzPrime.getStatus()
      }));
      
      ws.on('message', (message) => {
        try {
          const command = JSON.parse(message);
          if (this.config.logCommands) {
            console.log(`🎮 Command received: ${command.action}`);
          }
          
          const result = this.handleCommand(command);
          ws.send(JSON.stringify(result));
        } catch (err) {
          ws.send(JSON.stringify({
            success: false,
            error: err.message
          }));
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
    
    console.log(`🎮 Control server started on port ${this.config.port}`);
  }
  
  handleCommand(command) {
    switch(command.action) {
      case 'buy':
        return { success: true, result: this.ogzPrime.executeManualBuy() };
      case 'sell':
        return { success: true, result: this.ogzPrime.executeManualSell() };
      case 'kill':
        this.ogzPrime.shutdown();
        return { success: true, message: 'Shutdown initiated' };
      case 'pause':
        this.ogzPrime.isRunning = false;
        return { success: true, message: 'Bot paused' };
      case 'resume':
        this.ogzPrime.isRunning = true;
        return { success: true, message: 'Bot resumed' };
      case 'status':
        return { success: true, status: this.ogzPrime.getStatus() };
      default:
        return { success: false, error: 'Unknown command' };
    }
  }
  
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  stop() {
    if (this.server) {
      this.server.close();
      console.log('🎮 Control server stopped');
    }
  }
}

module.exports = ControlServer;
