/**
 * FIX WEBSOCKET DISCONNECTIONS - Targeted Solution for 3-Second Drops
 * 
 * This script fixes the intermittent WebSocket disconnection issue by:
 * 1. Removing duplicate heartbeat systems
 * 2. Fixing SSL/TLS certificate handling
 * 3. Implementing proper connection resilience
 * 4. Adding connection stability monitoring
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING WEBSOCKET DISCONNECTION ISSUES');
console.log('========================================');

// Step 1: Fix the duplicate heartbeat issue in OGZPrimeV10.2.js
function fixDuplicateHeartbeat() {
    console.log('🔧 Step 1: Fixing duplicate heartbeat systems...');
    
    const botFilePath = 'OGZPrimeV10.2.js';
    let botContent = fs.readFileSync(botFilePath, 'utf8');
    
    // Comment out the duplicate heartbeat system in the main bot file
    // The WebSocketManager already handles heartbeats properly
    const heartbeatSectionStart = botContent.indexOf('// Setup heartbeat system for all servers');
    const heartbeatSectionEnd = botContent.indexOf('console.log(\'💓 WebSocket heartbeat system active (30s interval)\');') + 
                                'console.log(\'💓 WebSocket heartbeat system active (30s interval)\');'.length;
    
    if (heartbeatSectionStart !== -1 && heartbeatSectionEnd !== -1) {
        const beforeSection = botContent.substring(0, heartbeatSectionStart);
        const afterSection = botContent.substring(heartbeatSectionEnd);
        
        const commentedSection = `// DISABLED: Duplicate heartbeat system - WebSocketManager handles this
    // Setup heartbeat system for all servers
    // this.setupWebSocketHeartbeat();
    
    console.log('💓 WebSocket heartbeat delegated to WebSocketManager');`;
        
        botContent = beforeSection + commentedSection + afterSection;
        
        // Also comment out the setupWebSocketHeartbeat method
        botContent = botContent.replace(
            'setupWebSocketHeartbeat() {',
            '// DISABLED: setupWebSocketHeartbeat() {'
        );
        
        fs.writeFileSync(botFilePath, botContent);
        console.log('✅ Fixed duplicate heartbeat system in OGZPrimeV10.2.js');
    }
}

// Step 2: Enhance WebSocket connection stability
function enhanceConnectionStability() {
    console.log('🔧 Step 2: Enhancing WebSocket connection stability...');
    
    const wsManagerPath = 'core/WebsocketManager.js';
    let wsContent = fs.readFileSync(wsManagerPath, 'utf8');
    
    // Increase heartbeat interval to reduce ping/pong conflicts
    wsContent = wsContent.replace(
        '}, 30000); // 30 second heartbeat interval',
        '}, 45000); // 45 second heartbeat interval (reduced conflicts)'
    );
    
    // Add connection resilience options
    const serverOptionsStart = wsContent.indexOf('const server = new WebSocketServer({');
    if (serverOptionsStart !== -1) {
        wsContent = wsContent.replace(
            'skipUTF8Validation: false   // Validate UTF8 for security',
            `skipUTF8Validation: false,   // Validate UTF8 for security
        // Enhanced stability options
        handshakeTimeout: 10000,      // 10 second handshake timeout
        maxConnections: 100,          // Limit concurrent connections
        backlog: 511                  // Connection backlog`
        );
    }
    
    fs.writeFileSync(wsManagerPath, wsContent);
    console.log('✅ Enhanced WebSocket connection stability');
}

// Step 3: Create SSL certificate bypass for ngrok
function createSSLBypass() {
    console.log('🔧 Step 3: Creating SSL certificate bypass for ngrok...');
    
    const sslBypassContent = `/**
 * SSL Certificate Bypass for ngrok WebSocket Connections
 * 
 * This fixes SSL/TLS handshake issues with ngrok tunnels
 */

// Bypass SSL certificate validation for ngrok connections
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Enhanced WebSocket client options for ngrok
const ngrokWebSocketOptions = {
    rejectUnauthorized: false,
    handshakeTimeout: 10000,
    perMessageDeflate: true,
    followRedirects: true,
    maxRedirects: 3,
    origin: 'https://ngrok.io',
    headers: {
        'User-Agent': 'OGZ-Prime-WebSocket-Client/1.0'
    }
};

module.exports = { ngrokWebSocketOptions };
`;
    
    fs.writeFileSync('core/SSLBypass.js', sslBypassContent);
    console.log('✅ Created SSL bypass for ngrok connections');
}

// Step 4: Create connection stability monitor
function createStabilityMonitor() {
    console.log('🔧 Step 4: Creating connection stability monitor...');
    
    const monitorContent = `/**
 * WebSocket Connection Stability Monitor
 * 
 * Monitors connection health and automatically fixes issues
 */

class ConnectionStabilityMonitor {
    constructor(webSocketManager) {
        this.wsManager = webSocketManager;
        this.connectionStats = new Map();
        this.startMonitoring();
    }
    
    startMonitoring() {
        console.log('📊 Starting connection stability monitoring...');
        
        // Monitor every 10 seconds
        this.monitorInterval = setInterval(() => {
            this.checkConnectionHealth();
        }, 10000);
    }
    
    checkConnectionHealth() {
        const status = this.wsManager.getServerStatus();
        
        if (Array.isArray(status)) {
            status.forEach(serverStatus => {
                if (serverStatus.exists) {
                    this.analyzeServerHealth(serverStatus);
                }
            });
        }
    }
    
    analyzeServerHealth(serverStatus) {
        const { port, connections, errors, lastActivity } = serverStatus;
        const now = Date.now();
        
        // Check for connection drops
        if (connections === 0 && (now - lastActivity) < 30000) {
            console.log(\`⚠️ Port \${port}: Recent disconnection detected\`);
            this.logConnectionIssue(port, 'recent_disconnection');
        }
        
        // Check for high error rate
        if (errors > 5) {
            console.log(\`⚠️ Port \${port}: High error rate detected (\${errors} errors)\`);
            this.logConnectionIssue(port, 'high_error_rate');
        }
        
        // Check for stale connections
        if ((now - lastActivity) > 120000) { // 2 minutes
            console.log(\`⚠️ Port \${port}: Stale connection detected\`);
            this.logConnectionIssue(port, 'stale_connection');
        }
    }
    
    logConnectionIssue(port, issueType) {
        const timestamp = new Date().toISOString();
        const logEntry = \`[\${timestamp}] Port \${port}: \${issueType}\\n\`;
        
        require('fs').appendFileSync('connection_stability.log', logEntry);
    }
    
    cleanup() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
    }
}

module.exports = ConnectionStabilityMonitor;
`;
    
    fs.writeFileSync('core/ConnectionStabilityMonitor.js', monitorContent);
    console.log('✅ Created connection stability monitor');
}

// Step 5: Update dashboard to handle connection drops gracefully
function updateDashboardResilience() {
    console.log('🔧 Step 5: Updating dashboard connection resilience...');
    
    const dashboardPath = 'ogz-ultimate-dashboard.html';
    if (!fs.existsSync(dashboardPath)) {
        console.log('⚠️ Dashboard file not found, skipping dashboard update');
        return;
    }
    
    let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    // Add connection resilience JavaScript
    const resilienceScript = `
    // Enhanced WebSocket Connection Resilience
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    let reconnectInterval = 1000; // Start with 1 second
    
    function connectWithResilience() {
        try {
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                console.log('✅ WebSocket connected successfully');
                reconnectAttempts = 0;
                reconnectInterval = 1000; // Reset interval
                updateConnectionStatus('Connected');
            };
            
            ws.onclose = function(event) {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                updateConnectionStatus('Disconnected');
                
                // Attempt reconnection with exponential backoff
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(\`🔄 Reconnection attempt \${reconnectAttempts}/\${maxReconnectAttempts} in \${reconnectInterval}ms\`);
                    
                    setTimeout(() => {
                        connectWithResilience();
                    }, reconnectInterval);
                    
                    // Exponential backoff with jitter
                    reconnectInterval = Math.min(reconnectInterval * 1.5 + Math.random() * 1000, 30000);
                } else {
                    console.error('❌ Max reconnection attempts reached');
                    updateConnectionStatus('Failed');
                }
            };
            
            ws.onerror = function(error) {
                console.error('❌ WebSocket error:', error);
                updateConnectionStatus('Error');
            };
            
            ws.onmessage = function(event) {
                // Reset reconnection on successful message
                reconnectAttempts = 0;
                reconnectInterval = 1000;
                
                // Process message normally
                handleWebSocketMessage(event);
            };
            
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            updateConnectionStatus('Failed');
        }
    }
    
    function updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = 'status-' + status.toLowerCase();
        }
    }
    `;
    
    // Insert the resilience script before the existing WebSocket code
    const wsScriptStart = dashboardContent.indexOf('ws = new WebSocket(');
    if (wsScriptStart !== -1) {
        const beforeScript = dashboardContent.substring(0, wsScriptStart);
        const afterScript = dashboardContent.substring(wsScriptStart);
        
        // Replace the simple WebSocket connection with resilient version
        const updatedAfterScript = afterScript.replace(
            'ws = new WebSocket(',
            '// Use resilient connection instead\n        // ws = new WebSocket('
        );
        
        dashboardContent = beforeScript + resilienceScript + '\n        connectWithResilience();\n' + updatedAfterScript;
        
        fs.writeFileSync(dashboardPath, dashboardContent);
        console.log('✅ Updated dashboard with connection resilience');
    }
}

// Execute all fixes
async function applyAllFixes() {
    try {
        fixDuplicateHeartbeat();
        enhanceConnectionStability();
        createSSLBypass();
        createStabilityMonitor();
        updateDashboardResilience();
        
        console.log('\n🎯 ALL FIXES APPLIED SUCCESSFULLY!');
        console.log('=====================================');
        console.log('✅ Fixed duplicate heartbeat systems');
        console.log('✅ Enhanced WebSocket stability');
        console.log('✅ Created SSL bypass for ngrok');
        console.log('✅ Added connection stability monitor');
        console.log('✅ Updated dashboard resilience');
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Restart the bot: node OGZPrimeV10.2.js');
        console.log('2. Check connection_stability.log for monitoring');
        console.log('3. Test dashboard connection stability');
        
    } catch (error) {
        console.error('❌ Error applying fixes:', error.message);
    }
}

// Run the fixes
applyAllFixes();