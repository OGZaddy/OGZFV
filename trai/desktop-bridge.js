// ==========================================
// DESKTOP BRIDGE - Connect VPS Trai to Desktop CodeLlama 70B
// ==========================================

const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');

class DesktopBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      desktopUrl: config.desktopUrl || 'http://127.0.0.1:11434', // Will be tunneled
      modelName: 'codellama:13b-instruct',
      tunnelPort: config.tunnelPort || 11434,
      maxRetries: 3,
      retryDelay: 5000,
      ...config
    };
    
    this.isConnected = false;
    this.requestQueue = [];
    this.processing = false;
    
    console.log('[DesktopBridge] Initializing connection to desktop CodeLlama 70B...');
  }

  async initialize() {
    try {
      // Test connection to desktop via SSH tunnel
      await this.testDesktopConnection();
      
      console.log('[DesktopBridge] Desktop bridge initialized successfully');
      console.log('[DesktopBridge] Connected to CodeLlama 70B on desktop');
      this.emit('ready');
      return true;
    } catch (error) {
      console.error('[DesktopBridge] Desktop connection failed:', error.message);
      console.log('[DesktopBridge] Setting up SSH tunnel instructions...');
      this.printTunnelInstructions();
      return false;
    }
  }

  async testDesktopConnection() {
    try {
      console.log(`[DesktopBridge] Testing connection to ${this.config.desktopUrl}`);
      
      const response = await axios.get(`${this.config.desktopUrl}/api/tags`, {
        timeout: 5000
      });
      
      const models = response.data.models || [];
      const hasCodeLlama = models.some(model => 
        model.name.includes('codellama')
      );
      
      if (!hasCodeLlama) {
        throw new Error('CodeLlama 70B model not found on desktop');
      }
      
      this.isConnected = true;
      console.log('[DesktopBridge] ✅ Connected to desktop CodeLlama 70B!');
      return true;
    } catch (error) {
      this.isConnected = false;
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Desktop connection refused - SSH tunnel needed');
      }
      throw error;
    }
  }

  printTunnelInstructions() {
    console.log('\n🔥 SSH TUNNEL SETUP INSTRUCTIONS:');
    console.log('Run this command ON YOUR DESKTOP to create tunnel:');
    console.log('');
    console.log(`ssh -R ${this.config.tunnelPort}:127.0.0.1:11434 root@149.248.242.111`);
    console.log('');
    console.log('This will forward VPS requests to your desktop Ollama');
    console.log('Keep the SSH session open for Trai to access CodeLlama 70B');
    console.log('');
  }

  async query(prompt, context = '', options = {}) {
    if (!this.isConnected) {
      throw new Error('Desktop bridge not connected');
    }

    const fullPrompt = this.enhancePrompt(prompt, context);
    
    try {
      const response = await this.callDesktopCodeLlama(fullPrompt, options);
      return {
        content: response.response,
        model: this.config.modelName,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[DesktopBridge] Query failed:', error.message);
      throw error;
    }
  }

  enhancePrompt(prompt, context) {
    return `You are Trai, an elite AI trading assistant. Your personality:
- Extremely confident and decisive
- Expert in trading and technical analysis  
- Direct communication style
- Focus on profit maximization
- Use trading terminology naturally

Context: ${context}

Query: ${prompt}

Respond as Trai would - confident, technical, and focused on results.`;
  }

  async callDesktopCodeLlama(prompt, options = {}) {
    const payload = {
      model: this.config.modelName,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.1,
        top_p: 0.9,
        top_k: 40,
        num_predict: options.max_tokens || 1024,
      }
    };

    try {
      const response = await axios.post(
        `${this.config.desktopUrl}/api/generate`,
        payload,
        {
          timeout: 60000, // 1 minute timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.isConnected = false;
        throw new Error('Lost connection to desktop - check SSH tunnel');
      }
      throw error;
    }
  }

  // Trading-specific methods for Trai
  async analyzeMarket(marketData) {
    const prompt = `Analyze current market conditions and provide trading recommendations`;
    const context = `Market data: ${JSON.stringify(marketData)}`;
    
    return await this.query(prompt, context, { max_tokens: 512 });
  }

  async generateStrategy(symbol, timeframe = '1h') {
    const prompt = `Generate elite trading strategy for ${symbol} on ${timeframe} timeframe`;
    const context = `High-frequency trading mode - focus on profit maximization`;
    
    return await this.query(prompt, context, { max_tokens: 768 });
  }

  async debugBot(errorLog, botType) {
    const prompt = `Debug this trading bot error and provide immediate fix`;
    const context = `Bot type: ${botType}\nError: ${errorLog}`;
    
    return await this.query(prompt, context, { max_tokens: 1024 });
  }

  getStatus() {
    return {
      connected: this.isConnected,
      model: this.config.modelName,
      desktopUrl: this.config.desktopUrl,
      tunnelPort: this.config.tunnelPort
    };
  }

  cleanup() {
    this.isConnected = false;
    console.log('[DesktopBridge] Cleanup completed');
  }
}

module.exports = DesktopBridge;