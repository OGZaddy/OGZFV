#!/usr/bin/env node

// ==========================================
// MCP TRAI SERVER - VS Code Extension Bridge
// Exposes Trai+CodeLlama 70B to VS Code extensions (Archon, Augment)
// ==========================================

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const WebSocket = require('ws');

class TraiMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'trai-codellama-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.traiConnection = null;
    this.setupMCPHandlers();
    this.connectToTrai();
    
    console.log('🧠 Trai MCP Server initialized for VS Code extensions');
  }

  async connectToTrai() {
    try {
      // Connect to your SSL server WebSocket where Trai lives
      this.traiConnection = new WebSocket('wss://ogzprime.com/ws');
      
      this.traiConnection.on('open', () => {
        console.log('✅ Connected to Trai VPS system');
        
        // Identify as MCP bridge
        this.traiConnection.send(JSON.stringify({
          type: 'client_identification',
          clientType: 'mcp_bridge',
          capabilities: ['tool_calls', 'code_analysis', 'market_analysis'],
          source: 'vs_code_extensions'
        }));
      });

      this.traiConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleTraiMessage(message);
        } catch (error) {
          console.error('Failed to parse Trai message:', error);
        }
      });

      this.traiConnection.on('error', (error) => {
        console.error('Trai connection error:', error);
      });

    } catch (error) {
      console.error('Failed to connect to Trai:', error);
    }
  }

  handleTraiMessage(message) {
    // Handle responses from Trai system
    console.log(`📨 Trai message: ${message.type}`);
  }

  setupMCPHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_code',
            description: 'Analyze code using Trai with CodeLlama 70B reasoning',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The code to analyze'
                },
                language: {
                  type: 'string',
                  description: 'Programming language'
                },
                analysis_type: {
                  type: 'string',
                  description: 'Type of analysis (debug, optimize, explain, review)'
                }
              },
              required: ['code']
            }
          },
          {
            name: 'generate_trading_strategy',
            description: 'Generate trading strategies using live market data and AI',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: 'Trading symbol (e.g., BTC, ETH)'
                },
                timeframe: {
                  type: 'string',
                  description: 'Timeframe for analysis'
                },
                strategy_type: {
                  type: 'string',
                  description: 'Type of strategy (scalping, swing, long-term)'
                }
              },
              required: ['symbol']
            }
          },
          {
            name: 'debug_system',
            description: 'Debug system issues using Trai expert knowledge',
            inputSchema: {
              type: 'object',
              properties: {
                error_log: {
                  type: 'string',
                  description: 'Error log or description'
                },
                system_type: {
                  type: 'string',
                  description: 'Type of system (trading_bot, web_server, database)'
                },
                context: {
                  type: 'string',
                  description: 'Additional context about the issue'
                }
              },
              required: ['error_log']
            }
          },
          {
            name: 'market_analysis',
            description: 'Real-time market analysis with live trading data',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Symbols to analyze'
                },
                analysis_depth: {
                  type: 'string',
                  description: 'Analysis depth (quick, detailed, comprehensive)'
                }
              },
              required: ['symbols']
            }
          },
          {
            name: 'trai_chat',
            description: 'Direct chat with Trai AI for any question',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Your question or request for Trai'
                },
                context: {
                  type: 'string',
                  description: 'Additional context for the conversation'
                }
              },
              required: ['message']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_code':
            return await this.analyzeCode(args);
          case 'generate_trading_strategy':
            return await this.generateTradingStrategy(args);
          case 'debug_system':
            return await this.debugSystem(args);
          case 'market_analysis':
            return await this.marketAnalysis(args);
          case 'trai_chat':
            return await this.traiChat(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async analyzeCode(args) {
    const { code, language = 'javascript', analysis_type = 'explain' } = args;
    
    const response = await this.queryTrai(`Analyze this ${language} code for ${analysis_type}:\n\n${code}`, {
      type: 'code_analysis',
      language,
      analysis_type
    });

    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async generateTradingStrategy(args) {
    const { symbol, timeframe = '1h', strategy_type = 'scalping' } = args;
    
    const response = await this.queryTrai(
      `Generate a ${strategy_type} trading strategy for ${symbol} on ${timeframe} timeframe`,
      {
        type: 'trading_strategy',
        symbol,
        timeframe,
        strategy_type
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async debugSystem(args) {
    const { error_log, system_type, context = '' } = args;
    
    const response = await this.queryTrai(
      `Debug this ${system_type} error:\n${error_log}\n\nContext: ${context}`,
      {
        type: 'system_debug',
        system_type,
        context
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async marketAnalysis(args) {
    const { symbols, analysis_depth = 'detailed' } = args;
    
    const response = await this.queryTrai(
      `Perform ${analysis_depth} market analysis for: ${symbols.join(', ')}`,
      {
        type: 'market_analysis',
        symbols,
        analysis_depth
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async traiChat(args) {
    const { message, context = '' } = args;
    
    const response = await this.queryTrai(message, {
      type: 'general_chat',
      context
    });

    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  async queryTrai(prompt, context) {
    return new Promise((resolve, reject) => {
      if (!this.traiConnection || this.traiConnection.readyState !== WebSocket.OPEN) {
        reject(new Error('Trai connection not available'));
        return;
      }

      const requestId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Set up response handler
      const responseHandler = (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'trai_response' && message.requestId === requestId) {
            this.traiConnection.removeListener('message', responseHandler);
            resolve(message.content || message.message || 'Response received');
          }
        } catch (error) {
          // Ignore parsing errors for non-matching messages
        }
      };

      this.traiConnection.on('message', responseHandler);

      // Send request to Trai
      this.traiConnection.send(JSON.stringify({
        type: 'trai_chat',
        message: prompt,
        context,
        requestId,
        source: 'mcp_bridge'
      }));

      // Timeout after 30 seconds
      setTimeout(() => {
        this.traiConnection.removeListener('message', responseHandler);
        reject(new Error('Trai query timeout'));
      }, 30000);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🚀 Trai MCP Server running for VS Code extensions');
  }
}

// Start the server
if (require.main === module) {
  const server = new TraiMCPServer();
  server.run().catch(console.error);
}

module.exports = TraiMCPServer;