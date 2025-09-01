// ==========================================
// FILE: codellama-bridge.js
// Bridge service connecting VPS to local Code Llama 70B
// ==========================================

const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');

class CodeLlamaBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      localOllamaUrl: config.localOllamaUrl || 'http://127.0.0.1:11434',
      modelName: config.modelName || 'codellama:70b-instruct-q4_K_M',
      websocketPort: config.websocketPort || 3010,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      ...config
    };
    
    this.isConnected = false;
    this.wsServer = null;
    this.activeConnections = new Set();
    this.requestQueue = [];
    this.processing = false;
    
    console.log('[CodeLlamaBridge] Initializing bridge to local Code Llama 70B...');
  }

  async initialize() {
    try {
      // Start WebSocket server on port 3010
      this.startWebSocketServer();
      
      // Test connection to local Ollama
      await this.testOllamaConnection();
      
      console.log('[CodeLlamaBridge] Bridge initialized successfully');
      this.emit('ready');
    } catch (error) {
      console.error('[CodeLlamaBridge] Initialization failed:', error);
      this.emit('error', error);
    }
  }

  startWebSocketServer() {
    this.wsServer = new WebSocket.Server({ 
      port: this.config.websocketPort,
      path: '/codellama'
    });

    this.wsServer.on('connection', (ws, req) => {
      console.log('[CodeLlamaBridge] New WebSocket connection from:', req.connection.remoteAddress);
      
      this.activeConnections.add(ws);
      
      ws.on('message', async (data) => {
        try {
          const request = JSON.parse(data);
          await this.handleRequest(ws, request);
        } catch (error) {
          console.error('[CodeLlamaBridge] Message handling error:', error);
          ws.send(JSON.stringify({
            error: 'Invalid request format',
            details: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.activeConnections.delete(ws);
        console.log('[CodeLlamaBridge] WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('[CodeLlamaBridge] WebSocket error:', error);
        this.activeConnections.delete(ws);
      });

      // Send ready signal
      ws.send(JSON.stringify({
        type: 'ready',
        message: 'Connected to Code Llama 70B bridge',
        model: this.config.modelName
      }));
    });

    console.log(`[CodeLlamaBridge] WebSocket server started on port ${this.config.websocketPort}`);
  }

  async testOllamaConnection() {
    try {
      const response = await axios.get(`${this.config.localOllamaUrl}/api/tags`);
      const models = response.data.models || [];
      
      const hasModel = models.some(model => 
        model.name.includes('codellama') && model.name.includes('70b')
      );
      
      if (!hasModel) {
        throw new Error(`Model ${this.config.modelName} not found in local Ollama`);
      }
      
      this.isConnected = true;
      console.log('[CodeLlamaBridge] Successfully connected to local Ollama');
      return true;
    } catch (error) {
      console.error('[CodeLlamaBridge] Failed to connect to local Ollama:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async handleRequest(ws, request) {
    const { id, type, prompt, context, options } = request;
    
    try {
      switch (type) {
        case 'generate':
          await this.generateResponse(ws, id, prompt, context, options);
          break;
        case 'analyze':
          await this.analyzeCode(ws, id, prompt, context);
          break;
        case 'debug':
          await this.debugCode(ws, id, prompt, context);
          break;
        case 'optimize':
          await this.optimizeCode(ws, id, prompt, context);
          break;
        default:
          throw new Error(`Unknown request type: ${type}`);
      }
    } catch (error) {
      ws.send(JSON.stringify({
        id,
        error: error.message,
        timestamp: Date.now()
      }));
    }
  }

  async generateResponse(ws, id, prompt, context = '', options = {}) {
    const fullPrompt = this.buildPrompt(prompt, context, 'generate');
    
    try {
      const response = await this.callOllama(fullPrompt, options);
      
      ws.send(JSON.stringify({
        id,
        type: 'response',
        content: response.response,
        model: this.config.modelName,
        timestamp: Date.now()
      }));
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  async analyzeCode(ws, id, code, context = '') {
    const prompt = this.buildPrompt(
      `Analyze this code and provide insights:\n\n${code}`,
      context,
      'analyze'
    );
    
    try {
      const response = await this.callOllama(prompt);
      
      ws.send(JSON.stringify({
        id,
        type: 'analysis',
        analysis: response.response,
        model: this.config.modelName,
        timestamp: Date.now()
      }));
    } catch (error) {
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  async debugCode(ws, id, code, context = '') {
    const prompt = this.buildPrompt(
      `Debug this code and suggest fixes:\n\n${code}`,
      context,
      'debug'
    );
    
    try {
      const response = await this.callOllama(prompt);
      
      ws.send(JSON.stringify({
        id,
        type: 'debug_result',
        suggestions: response.response,
        model: this.config.modelName,
        timestamp: Date.now()
      }));
    } catch (error) {
      throw new Error(`Code debugging failed: ${error.message}`);
    }
  }

  async optimizeCode(ws, id, code, context = '') {
    const prompt = this.buildPrompt(
      `Optimize this code for better performance:\n\n${code}`,
      context,
      'optimize'
    );
    
    try {
      const response = await this.callOllama(prompt);
      
      ws.send(JSON.stringify({
        id,
        type: 'optimization',
        optimized: response.response,
        model: this.config.modelName,
        timestamp: Date.now()
      }));
    } catch (error) {
      throw new Error(`Code optimization failed: ${error.message}`);
    }
  }

  buildPrompt(userPrompt, context, type) {
    const systemPrompts = {
      generate: 'You are Code Llama, an expert programming assistant. Provide clear, accurate code solutions.',
      analyze: 'You are Code Llama, analyzing code for patterns, issues, and improvements. Be thorough and specific.',
      debug: 'You are Code Llama, debugging code. Identify issues and provide specific fixes.',
      optimize: 'You are Code Llama, optimizing code for performance and efficiency. Suggest concrete improvements.'
    };

    let prompt = systemPrompts[type] || systemPrompts.generate;
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    
    prompt += `\n\nRequest: ${userPrompt}`;
    
    return prompt;
  }

  async callOllama(prompt, options = {}) {
    const payload = {
      model: this.config.modelName,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.1,
        top_p: options.top_p || 0.9,
        top_k: options.top_k || 40,
        num_predict: options.max_tokens || 2048,
        ...options
      }
    };

    try {
      const response = await axios.post(
        `${this.config.localOllamaUrl}/api/generate`,
        payload,
        {
          timeout: 120000, // 2 minute timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to local Ollama. Make sure Ollama is running on your local machine.');
      }
      throw error;
    }
  }

  // Broadcast to all connected clients
  broadcast(message) {
    const data = JSON.stringify(message);
    this.activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  // Get status
  getStatus() {
    return {
      connected: this.isConnected,
      activeConnections: this.activeConnections.size,
      model: this.config.modelName,
      localUrl: this.config.localOllamaUrl,
      websocketPort: this.config.websocketPort
    };
  }

  // Cleanup
  async cleanup() {
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    this.activeConnections.forEach(ws => {
      ws.close();
    });
    
    this.activeConnections.clear();
    console.log('[CodeLlamaBridge] Cleanup completed');
  }
}

module.exports = CodeLlamaBridge;