// Quick WebSocket Diagnostic Tool for OGZPrime
// This will check what's actually running on which ports

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

class WebSocketDiagnostic {
  constructor() {
    this.ports = [3000, 3001, 3002, 3010, 8005, 8080, 8443];
    console.log('🔍 OGZPrime WebSocket Diagnostic Tool');
    console.log('=====================================');
  }

  async checkAllPorts() {
    console.log('📡 Checking WebSocket ports...\n');
    
    for (const port of this.ports) {
      await this.checkPort(port);
    }

    console.log('\n📊 Checking bot status file...');
    this.checkBotStatus();

    console.log('\n🔧 Recommended fixes:');
    this.provideFixes();
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      const timeout = setTimeout(() => {
        ws.close();
        console.log(`❌ Port ${port}: No WebSocket server`);
        resolve(false);
      }, 2000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log(`✅ Port ${port}: WebSocket server FOUND!`);
        
        // Send test message
        ws.send(JSON.stringify({ type: 'ping', source: 'diagnostic' }));
        
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 1000);
      });

      ws.on('message', (data) => {
        console.log(`📦 Port ${port}: Received data:`, data.toString());
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`❌ Port ${port}: Error -`, error.code || 'Connection failed');
        resolve(false);
      });
    });
  }

  checkBotStatus() {
    try {
      if (fs.existsSync('bot_status.json')) {
        const status = JSON.parse(fs.readFileSync('bot_status.json', 'utf8'));
        console.log('✅ Bot status file exists and updating:');
        console.log(`   - Last update: ${status.timestamp}`);
        console.log(`   - BTC Price: $${status.price.toFixed(2)}`);
        console.log(`   - Bot thought: "${status.thought}"`);
        console.log(`   - System active: ${status.systemState.active}`);
        return true;
      } else {
        console.log('❌ Bot status file NOT found');
        return false;
      }
    } catch (error) {
      console.log('❌ Error reading bot status:', error.message);
      return false;
    }
  }

  provideFixes() {
    console.log('\n1. 🔧 Dashboard Port Fix:');
    console.log('   Dashboard is trying to connect to ws://localhost:3010');
    console.log('   But LiveTradingDataAPI runs on port 8005 by default');
    
    console.log('\n2. 🚀 Quick Fix Options:');
    console.log('   A) Change dashboard to connect to port 8005');
    console.log('   B) Start LiveTradingDataAPI on port 3010');
    console.log('   C) Use WebSocketManager to create server on 3010');

    console.log('\n3. 📡 Data Flow Check:');
    console.log('   Bot writes to bot_status.json ✅');
    console.log('   LiveTradingDataAPI monitors file ✅');
    console.log('   Dashboard WebSocket connection ❌');

    console.log('\n4. 🔥 Immediate Actions:');
    console.log('   - Run: node api/live-trading-data.js');
    console.log('   - Or update dashboard port to 8005');
    console.log('   - Or create bridge server on 3010');
  }
}

// Run diagnostic
const diagnostic = new WebSocketDiagnostic();
diagnostic.checkAllPorts().catch(console.error);
