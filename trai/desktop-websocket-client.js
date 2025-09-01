// ==========================================
// DESKTOP WEBSOCKET CLIENT - CodeLlama 70B Bridge
// Connects desktop CodeLlama to VPS via unified WebSocket 3010
// ==========================================

const WebSocket = require('ws');
const axios = require('axios');

class DesktopWebSocketClient {
  constructor(config = {}) {
    this.config = {
      vpsUrl: config.vpsUrl || 'ws://149.248.242.111:3010',
      localOllamaUrl: config.localOllamaUrl || 'http://127.0.0.1:11434',
      modelName: config.modelName || 'codellama:70b-instruct-q4_K_M',
      reconnectDelay: config.reconnectDelay || 5000,
      ...config
    };
    
    this.ws = null;
    this.isConnected = false;
    this.pendingRequests = new Map();
    
    console.log('[DesktopClient] Initializing CodeLlama 70B WebSocket bridge...');
  }

  async initialize() {
    try {
      // Test local CodeLlama first
      await this.testLocalCodeLlama();
      
      // Connect to VPS WebSocket
      await this.connectToVPS();
      
      console.log('[DesktopClient] 🚀 Desktop CodeLlama 70B bridge ready!');
      return true;
    } catch (error) {
      console.error('[DesktopClient] Initialization failed:', error.message);
      return false;
    }
  }

  async testLocalCodeLlama() {
    try {
      const response = await axios.get(`${this.config.localOllamaUrl}/api/tags`, {
        timeout: 5000
      });
      
      const models = response.data.models || [];
      const hasCodeLlama70B = models.some(model => 
        model.name.includes('codellama') && model.name.includes('70b')
      );
      
      if (!hasCodeLlama70B) {
        throw new Error('CodeLlama 70B not found locally');
      }
      
      console.log('[DesktopClient] ✅ CodeLlama 70B verified locally');
      return true;
    } catch (error) {
      throw new Error(`Local CodeLlama test failed: ${error.message}`);
    }
  }

  async connectToVPS() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.vpsUrl);
        
        this.ws.on('open', () => {
          console.log('[DesktopClient] 🌐 Connected to VPS WebSocket');
          this.isConnected = true;
          
          // Identify as CodeLlama bridge client
          this.ws.send(JSON.stringify({
            type: 'client_identification',
            clientType: 'codellama_bridge',
            capabilities: ['inference', 'code_analysis', 'reasoning'],
            model: this.config.modelName
          }));
          
          resolve();
        });
        
        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleVPSMessage(message);
          } catch (error) {
            console.error('[DesktopClient] Failed to parse VPS message:', error);
          }
        });
        
        this.ws.on('close', () => {
          console.log('[DesktopClient] Disconnected from VPS');
          this.isConnected = false;
          // Auto-reconnect
          setTimeout(() => this.connectToVPS(), this.config.reconnectDelay);
        });
        
        this.ws.on('error', (error) => {
          console.error('[DesktopClient] WebSocket error:', error);
          reject(error);
        });
        
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('VPS connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async handleVPSMessage(message) {
    const { type, id, prompt, context, options } = message;
    
    switch (type) {
      case 'codellama_request':
        await this.processCodeLlamaRequest(id, prompt, context, options);
        break;
        
      case 'ping':
        this.ws.send(JSON.stringify({ type: 'pong', id }));
        break;
        
      default:
        console.log(`[DesktopClient] Unknown message type: ${type}`);
    }
  }

  async processCodeLlamaRequest(id, prompt, context = '', options = {}) {
    try {
      console.log(`[DesktopClient] Processing CodeLlama request ${id}...`);
      
      const enhancedPrompt = this.enhancePrompt(prompt, context);
      const response = await this.queryLocalCodeLlama(enhancedPrompt, options);
      
      // Send response back to VPS
      this.ws.send(JSON.stringify({
        type: 'codellama_response',
        id,
        content: response.response,
        model: this.config.modelName,
        timestamp: Date.now()
      }));
      
      console.log(`[DesktopClient] ✅ Request ${id} completed`);
    } catch (error) {
      console.error(`[DesktopClient] Request ${id} failed:`, error.message);
      
      this.ws.send(JSON.stringify({
        type: 'codellama_error',
        id,
        error: error.message,
        timestamp: Date.now()
      }));
    }
  }

  enhancePrompt(prompt, context) {
    return `You are an expert AI assistant integrated with Trai, an elite trading AI system.

Context: ${context}

Query: ${prompt}

Provide a clear, technical, and actionable response. Focus on practical solutions and expert-level insights.`;
  }

  async queryLocalCodeLlama(prompt, options = {}) {
    const payload = {
      model: this.config.modelName,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.1,
        top_p: options.top_p || 0.9,
        top_k: options.top_k || 40,
        num_predict: options.max_tokens || 2048,
      }
    };

    try {
      const response = await axios.post(
        `${this.config.localOllamaUrl}/api/generate`,
        payload,
        {
          timeout: 120000, // 2 minute timeout for 70B model
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Local Ollama not running');
      }
      throw error;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      model: this.config.modelName,
      vpsUrl: this.config.vpsUrl,
      localUrl: this.config.localOllamaUrl
    };
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    console.log('[DesktopClient] Cleanup completed');
  }
}

module.exports = DesktopWebSocketClient;

// If running directly, start the client
if (require.main === module) {
  const client = new DesktopWebSocketClient();
  
  client.initialize().then(success => {
    if (success) {
      console.log('🚀 Desktop CodeLlama 70B bridge is running!');
      console.log('Keep this terminal open to maintain connection to VPS.');
    } else {
      console.log('❌ Failed to initialize desktop bridge');
      process.exit(1);
    }
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down desktop bridge...');
    client.cleanup();
    process.exit(0);
  });
}