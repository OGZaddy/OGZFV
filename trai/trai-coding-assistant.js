// ==========================================
// TRAI - AI CODING ASSISTANT
// Local LLM + OGZ System Knowledge + Trey's Personality
// ==========================================

const axios = require('axios');
const TraiAI = require('./the-mover-ai-clone.js');

class TraiCodingAssistant {
  constructor() {
    this.trai = new TraiAI();
    this.ollamaUrl = 'http://127.0.0.1:11434';
    this.currentModel = 'codellama:13b-instruct'; // Start with available CodeLlama
    this.systemInitialized = false;
    
    // OGZ System Knowledge Base
    this.systemKnowledge = {
      architecture: {
        frontend: 'HTML/CSS/JS with Chart.js v4, WebSocket connections',
        backend: 'Node.js with Express, WebSocket server on port 3010',
        apis: 'Polygon.io for market data, ElevenLabs voice, D-ID video',
        database: 'File-based JSON storage, Supabase integration',
        deployment: 'PM2 process management, Nginx proxy'
      },
      
      codebase: {
        mainDashboard: '/root/OGZFV-valhalla/public/ultdash.html',
        tradingBot: '/root/OGZFV-valhalla/core/EnsembleVotingSystem.js',
        moverAI: '/root/OGZFV-valhalla/mover/',
        config: '/root/OGZFV-valhalla/.env'
      },
      
      patterns: {
        debugging: 'Step-by-step problem isolation, specific error messages',
        coding: 'Modular functions, clear variable names, comprehensive error handling',
        architecture: 'Separation of concerns, real-time data flow, scalable design'
      },
      
      personality: {
        style: 'Direct, solution-focused, no-nonsense approach',
        language: 'Technical but accessible, motivational undertones',
        priorities: 'System stability, performance, user experience'
      }
    };
    
    console.log('[TraiCoder] AI Coding Assistant initializing...');
  }

  async initialize() {
    try {
      // Initialize Trai personality
      await this.trai.initializeFinalForm();
      console.log('[TraiCoder] Personality loaded - 277 patterns ready');
      
      // Test Ollama connection
      const modelStatus = await this.testOllamaConnection();
      if (modelStatus.success) {
        console.log(`[TraiCoder] Connected to ${this.currentModel}`);
        this.systemInitialized = true;
        return true;
      } else {
        console.error('[TraiCoder] Ollama connection failed:', modelStatus.error);
        return false;
      }
      
    } catch (error) {
      console.error('[TraiCoder] Initialization failed:', error);
      return false;
    }
  }

  async testOllamaConnection() {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.currentModel,
        prompt: "Test connection - respond with 'OK'",
        stream: false
      }, { timeout: 5000 });
      
      return { success: true, response: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processCodeRequest(request) {
    if (!this.systemInitialized) {
      return { success: false, error: 'System not initialized' };
    }

    try {
      // Step 1: Get Trai personality response
      const personalityResponse = this.trai.generateResponse(request);
      
      // Step 2: Build system context
      const systemContext = this.buildSystemContext(request);
      
      // Step 3: Create enhanced prompt for LLM
      const enhancedPrompt = this.buildEnhancedPrompt(request, personalityResponse, systemContext);
      
      // Step 4: Send to local LLM
      const llmResponse = await this.queryLLM(enhancedPrompt);
      
      if (llmResponse.success) {
        return {
          success: true,
          personalityResponse: personalityResponse,
          technicalResponse: llmResponse.response,
          systemContext: systemContext,
          model: this.currentModel,
          timestamp: new Date().toISOString()
        };
      } else {
        return { success: false, error: llmResponse.error };
      }
      
    } catch (error) {
      console.error('[TraiCoder] Processing error:', error);
      return { success: false, error: error.message };
    }
  }

  buildSystemContext(request) {
    const context = {
      relevantFiles: [],
      architecture: this.systemKnowledge.architecture,
      patterns: this.systemKnowledge.patterns
    };
    
    // Determine relevant system components based on request
    const requestLower = request.toLowerCase();
    
    if (requestLower.includes('dashboard') || requestLower.includes('frontend')) {
      context.relevantFiles.push(this.systemKnowledge.codebase.mainDashboard);
      context.focus = 'frontend';
    }
    
    if (requestLower.includes('trading') || requestLower.includes('bot') || requestLower.includes('ensemble')) {
      context.relevantFiles.push(this.systemKnowledge.codebase.tradingBot);
      context.focus = 'trading';
    }
    
    if (requestLower.includes('websocket') || requestLower.includes('connection')) {
      context.focus = 'realtime';
    }
    
    if (requestLower.includes('bug') || requestLower.includes('error') || requestLower.includes('fix')) {
      context.focus = 'debugging';
    }
    
    return context;
  }

  buildEnhancedPrompt(request, personalityResponse, systemContext) {
    return `You are The Mover AI, an expert developer who built the OGZ Prime trading system. 

SYSTEM KNOWLEDGE:
- Architecture: ${JSON.stringify(systemContext.architecture, null, 2)}
- Focus Area: ${systemContext.focus || 'general'}
- Relevant Files: ${systemContext.relevantFiles.join(', ')}

PERSONALITY CONTEXT:
${personalityResponse}

CODING REQUEST:
${request}

INSTRUCTIONS:
1. Maintain The Mover's direct, solution-focused personality
2. Provide specific, actionable code solutions
3. Reference the OGZ Prime system architecture when relevant
4. Include error handling and best practices
5. Explain the "why" behind technical decisions
6. Keep responses practical and implementation-ready

Response format:
- Brief explanation in Mover's style
- Specific code solution
- Implementation notes
- Potential issues to watch for

Generate the technical response:`;
  }

  async queryLLM(prompt) {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.currentModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent code
          top_p: 0.9,
          num_ctx: 8192 // Larger context for complex code
        }
      }, { timeout: 60000 }); // 1 minute timeout for complex requests

      return { 
        success: true, 
        response: response.data.response,
        model: this.currentModel,
        tokens: response.data.eval_count || 0
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async switchModel(modelName) {
    const oldModel = this.currentModel;
    this.currentModel = modelName;
    
    const testResult = await this.testOllamaConnection();
    if (testResult.success) {
      console.log(`[TraiCoder] Switched to ${modelName}`);
      return { success: true, message: `Switched from ${oldModel} to ${modelName}` };
    } else {
      this.currentModel = oldModel; // Revert on failure
      return { success: false, error: `Failed to connect to ${modelName}` };
    }
  }

  getSystemStatus() {
    return {
      initialized: this.systemInitialized,
      currentModel: this.currentModel,
      personalityPatterns: this.trai.learningStats?.totalPatterns || 0,
      systemKnowledge: Object.keys(this.systemKnowledge).length,
      ollamaUrl: this.ollamaUrl
    };
  }
}

module.exports = TraiCodingAssistant;