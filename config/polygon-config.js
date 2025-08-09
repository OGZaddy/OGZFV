// Polygon.io Configuration - SECURE API KEY MANAGEMENT
// This file should be in .gitignore and not committed to version control

class PolygonConfig {
    constructor() {
        // SECURITY FIX: Environment-only API key loading with proper validation
        this.apiKey = this.loadApiKey();
        this.wsEndpoint = 'wss://socket.polygon.io/crypto';
        this.restEndpoint = 'https://api.polygon.io';
        
        // Asset mapping for multi-crypto support
        this.assetMap = {
            'BTC-USD': 'X:BTCUSD',
            'ETH-USD': 'X:ETHUSD', 
            'SOL-USD': 'X:SOLUSD',
            'ADA-USD': 'X:ADAUSD'
        };
    }
    
    loadApiKey() {
        // SECURITY FIX: Only load from environment variables - no localStorage or prompts
        if (!process.env.POLYGON_API_KEY) {
            console.error('CRITICAL SECURITY ERROR: Missing POLYGON_API_KEY environment variable');
            console.error('Set environment variable: export POLYGON_API_KEY=your_key_here');
            process.exit(1);
        }
        
        const apiKey = process.env.POLYGON_API_KEY;
        
        // Validate API key format (Polygon keys are alphanumeric with underscores)
        if (!this.validateApiKeyFormat(apiKey)) {
            console.error('CRITICAL SECURITY ERROR: Invalid Polygon API key format');
            console.error('Polygon API keys should be alphanumeric with underscores, 20+ characters');
            process.exit(1);
        }
        
        return apiKey;
    }
    
    validateApiKeyFormat(key) {
        // SECURITY FIX: Proper format validation for Polygon API keys
        if (!key || typeof key !== 'string') {
            return false;
        }
        
        // Polygon API keys are typically 32+ characters, alphanumeric with underscores
        const polygonKeyPattern = /^[A-Za-z0-9_]{20,}$/;
        return polygonKeyPattern.test(key);
    }
    
    getSymbol(asset) {
        return this.assetMap[asset] || 'X:BTCUSD';
    }
    
    validateApiKey() {
        // SECURITY FIX: Use proper format validation instead of just length check
        return this.validateApiKeyFormat(this.apiKey);
    }
}

// SECURITY FIX: Remove browser window exposure to prevent XSS attacks
module.exports = PolygonConfig;
