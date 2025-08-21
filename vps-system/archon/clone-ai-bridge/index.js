const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Configuration
const PORT = process.env.CLONE_AI_PORT || 8054;
const ARCHON_API_URL = process.env.ARCHON_API_URL || 'http://localhost:8181';
const ARCHON_MCP_URL = process.env.ARCHON_MCP_URL || 'http://localhost:8051';
const DATABASE_URL = process.env.DATABASE_URL;

// Initialize Express
const app = express();
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:5432';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// WebSocket connection to Archon MCP
let mcpConnection = null;

// Connect to Archon MCP Server
function connectToMCP() {
    const wsUrl = ARCHON_MCP_URL.replace('http', 'ws') + '/ws';
    mcpConnection = new WebSocket(wsUrl);

    mcpConnection.on('open', () => {
        console.log('Connected to Archon MCP Server');
        
        // Register as Clone AI
        mcpConnection.send(JSON.stringify({
            type: 'register',
            agent: 'clone-ai',
            capabilities: ['trading', 'pattern-recognition', 'decision-making']
        }));
    });

    mcpConnection.on('message', (data) => {
        handleMCPMessage(JSON.parse(data.toString()));
    });

    mcpConnection.on('error', (error) => {
        console.error('MCP connection error:', error);
    });

    mcpConnection.on('close', () => {
        console.log('MCP connection closed, reconnecting in 5s...');
        setTimeout(connectToMCP, 5000);
    });
}

// Handle messages from Archon MCP
function handleMCPMessage(message) {
    switch(message.type) {
        case 'query':
            handleKnowledgeQuery(message);
            break;
        case 'update':
            handleKnowledgeUpdate(message);
            break;
        case 'command':
            handleCommand(message);
            break;
    }
}

// Handle knowledge queries from Claude Code or other AI
async function handleKnowledgeQuery(message) {
    const { query, context, requestId } = message;
    
    try {
        // Search Archon knowledge base
        const response = await axios.post(`${ARCHON_API_URL}/api/knowledge/search`, {
            query,
            context,
            sources: ['trading-patterns', 'bug-fixes', 'code-examples']
        });

        // Send response back through MCP
        mcpConnection.send(JSON.stringify({
            type: 'response',
            requestId,
            data: response.data
        }));
    } catch (error) {
        console.error('Knowledge query error:', error);
        mcpConnection.send(JSON.stringify({
            type: 'error',
            requestId,
            error: error.message
        }));
    }
}

// Handle knowledge updates (learning from trades/errors)
async function handleKnowledgeUpdate(message) {
    const { type, data } = message;
    
    try {
        // Store in Archon knowledge base
        await axios.post(`${ARCHON_API_URL}/api/knowledge/add`, {
            type,
            content: data,
            source: 'clone-ai',
            timestamp: new Date().toISOString()
        });
        
        console.log(`Knowledge updated: ${type}`);
    } catch (error) {
        console.error('Knowledge update error:', error);
    }
}

// Handle commands from Claude Code
async function handleCommand(message) {
    const { command, params, requestId } = message;
    
    switch(command) {
        case 'analyze-trade':
            await analyzeTradePattern(params, requestId);
            break;
        case 'get-trading-advice':
            await getTradingAdvice(params, requestId);
            break;
        case 'check-for-issues':
            await checkForKnownIssues(params, requestId);
            break;
    }
}

// Analyze trading patterns
async function analyzeTradePattern(params, requestId) {
    try {
        // Query historical patterns
        const { data: patterns } = await supabase
            .from('archon_code_examples')
            .select('*')
            .ilike('content', `%${params.pattern}%`)
            .limit(10);

        // Get similar successful trades
        const analysis = {
            pattern: params.pattern,
            historicalSuccess: patterns.filter(p => p.metadata?.success).length,
            recommendations: generateRecommendations(patterns),
            confidence: calculateConfidence(patterns)
        };

        mcpConnection.send(JSON.stringify({
            type: 'response',
            requestId,
            data: analysis
        }));
    } catch (error) {
        console.error('Pattern analysis error:', error);
    }
}

// Get trading advice based on current conditions
async function getTradingAdvice(params, requestId) {
    try {
        // Search for similar market conditions in knowledge base
        const response = await axios.post(`${ARCHON_API_URL}/api/knowledge/search`, {
            query: `market conditions ${params.market} ${params.timeframe}`,
            filters: {
                type: 'trading-strategy',
                success: true
            }
        });

        const advice = {
            market: params.market,
            recommendations: response.data.results,
            riskLevel: calculateRiskLevel(params),
            suggestedActions: generateActions(response.data.results)
        };

        mcpConnection.send(JSON.stringify({
            type: 'response',
            requestId,
            data: advice
        }));
    } catch (error) {
        console.error('Trading advice error:', error);
    }
}

// Check for known issues before making changes
async function checkForKnownIssues(params, requestId) {
    try {
        // Search for similar issues in knowledge base
        const response = await axios.post(`${ARCHON_API_URL}/api/knowledge/search`, {
            query: params.description,
            filters: {
                type: 'bug-fix',
                category: params.category
            }
        });

        const issues = response.data.results.map(r => ({
            issue: r.content,
            solution: r.metadata?.solution,
            preventionTips: r.metadata?.prevention,
            severity: r.metadata?.severity
        }));

        mcpConnection.send(JSON.stringify({
            type: 'response',
            requestId,
            data: {
                knownIssues: issues,
                recommendations: generatePreventionTips(issues)
            }
        }));
    } catch (error) {
        console.error('Issue check error:', error);
    }
}

// Helper functions
function generateRecommendations(patterns) {
    return patterns.map(p => ({
        action: p.metadata?.action || 'HOLD',
        confidence: p.metadata?.confidence || 50,
        reasoning: p.summary
    }));
}

function calculateConfidence(patterns) {
    if (!patterns.length) return 0;
    const successRate = patterns.filter(p => p.metadata?.success).length / patterns.length;
    return Math.round(successRate * 100);
}

function calculateRiskLevel(params) {
    // Simple risk calculation
    const volatility = params.volatility || 50;
    const leverage = params.leverage || 1;
    return Math.min(100, volatility * leverage);
}

function generateActions(results) {
    return results.slice(0, 3).map(r => ({
        action: r.metadata?.action,
        priority: r.similarity * 100,
        description: r.summary
    }));
}

function generatePreventionTips(issues) {
    const tips = new Set();
    issues.forEach(issue => {
        if (issue.preventionTips) {
            issue.preventionTips.forEach(tip => tips.add(tip));
        }
    });
    return Array.from(tips);
}

// REST API Endpoints for Clone AI
app.post('/api/learn', async (req, res) => {
    const { type, content, metadata } = req.body;
    
    try {
        // Store learning in Archon
        const response = await axios.post(`${ARCHON_API_URL}/api/knowledge/add`, {
            type,
            content,
            metadata: {
                ...metadata,
                source: 'clone-ai',
                timestamp: new Date().toISOString()
            }
        });
        
        res.json({ success: true, id: response.data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/query', async (req, res) => {
    const { query, context } = req.body;
    
    try {
        const response = await axios.post(`${ARCHON_API_URL}/api/knowledge/search`, {
            query,
            context,
            limit: 10
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/trading-history', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('archon_sources')
            .select('*')
            .eq('metadata->knowledge_type', 'trading-history')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/log-trade', async (req, res) => {
    const trade = req.body;
    
    try {
        // Log to Archon
        await axios.post(`${ARCHON_API_URL}/api/knowledge/add`, {
            type: 'trade-execution',
            content: JSON.stringify(trade),
            metadata: {
                botType: trade.botType,
                action: trade.action,
                price: trade.price,
                pattern: trade.pattern,
                confidence: trade.confidence,
                timestamp: new Date().toISOString()
            }
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        mcpConnected: mcpConnection?.readyState === WebSocket.OPEN,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Clone AI Bridge running on port ${PORT}`);
    connectToMCP();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down Clone AI Bridge...');
    if (mcpConnection) {
        mcpConnection.close();
    }
    process.exit(0);
});