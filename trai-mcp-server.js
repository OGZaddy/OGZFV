#!/usr/bin/env node
// ==========================================
// TRAI MCP Server - Brings TRAI into your IDE
// Model Context Protocol server for Claude Code integration
// ==========================================

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} = require('@modelcontextprotocol/sdk/types.js');
const WebSocket = require('ws');

class TraiMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'trai-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.ws = null;
    this.connected = false;
    this.pendingRequests = new Map();
    
    this.setupHandlers();
    this.connectToTRAI();
  }
  
  connectToTRAI() {
    this.ws = new WebSocket('ws://127.0.0.1:3010/ws', {
      headers: {
        'X-Client-Type': 'MCP-Bridge',
        'User-Agent': 'TRAI-MCP-Server'
      }
    });
    
    this.ws.on('open', () => {
      console.error('[MCP] Connected to TRAI via SSL server');
      this.connected = true;
      
      // Identify as MCP bridge
      this.ws.send(JSON.stringify({
        type: 'identify',
        source: 'mcp_bridge',
        purpose: 'ide_integration'
      }));
    });
    
    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleTRAIMessage(msg);
      } catch (error) {
        console.error('[MCP] Failed to parse TRAI message:', error);
      }
    });
    
    this.ws.on('close', () => {
      this.connected = false;
      console.error('[MCP] Disconnected from TRAI, reconnecting...');
      setTimeout(() => this.connectToTRAI(), 5000);
    });
    
    this.ws.on('error', (error) => {
      console.error('[MCP] WebSocket error:', error.message);
    });
  }
  
  handleTRAIMessage(msg) {
    // Handle responses from TRAI
    if (msg.type === 'mcp_response' && msg.requestId) {
      const pending = this.pendingRequests.get(msg.requestId);
      if (pending) {
        pending.resolve(msg.data);
        this.pendingRequests.delete(msg.requestId);
      }
    }
  }
  
  async queryTRAI(query, context = {}) {
    if (!this.connected) {
      throw new Error('TRAI not connected');
    }
    
    const requestId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.ws.send(JSON.stringify({
        type: 'question',
        data: query,
        context: context,
        requestId: requestId
      }));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('TRAI query timeout'));
        }
      }, 30000);
    });
  }
  
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ask_trai',
            description: 'Ask TRAI anything about the OGZ Prime project, trading strategies, or system architecture',
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: 'Your question for TRAI'
                },
                context: {
                  type: 'string',
                  description: 'Optional context for the question',
                  optional: true
                }
              },
              required: ['question']
            }
          },
          {
            name: 'trai_analyze_code',
            description: 'Have TRAI analyze code with knowledge of the entire project history',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to analyze'
                },
                question: {
                  type: 'string',
                  description: 'What you want to know about this code'
                }
              },
              required: ['code', 'question']
            }
          },
          {
            name: 'trai_trading_insight',
            description: 'Get TRAI\'s insights on trading strategies and market analysis',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Trading topic or strategy to discuss'
                },
                data: {
                  type: 'string',
                  description: 'Optional market data or context',
                  optional: true
                }
              },
              required: ['topic']
            }
          },
          {
            name: 'trai_system_status',
            description: 'Get current status of TRAI and all connected systems',
            inputSchema: {
              type: 'object',
              properties: {}
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
          case 'ask_trai': {
            const response = await this.queryTRAI(args.question, { 
              context: args.context || '',
              source: 'ide'
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
          
          case 'trai_analyze_code': {
            const query = `Analyze this code:\n\n\`\`\`\n${args.code}\n\`\`\`\n\nQuestion: ${args.question}`;
            const response = await this.queryTRAI(query, {
              type: 'code_analysis',
              source: 'ide'
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
          
          case 'trai_trading_insight': {
            const query = `Trading insight requested: ${args.topic}`;
            const response = await this.queryTRAI(query, {
              type: 'trading_analysis',
              data: args.data || '',
              source: 'ide'
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
          
          case 'trai_system_status': {
            // Request status from TRAI
            const response = await this.queryTRAI('System status report', {
              type: 'status_request',
              source: 'ide'
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
  
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP] TRAI MCP Server running');
  }
}

// Start the server
if (require.main === module) {
  const server = new TraiMCPServer();
  server.run().catch(console.error);
}

module.exports = TraiMCPServer;