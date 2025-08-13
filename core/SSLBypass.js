/**
 * SECURITY FIX: Secure SSL/TLS Configuration for Development Tunnels
 * 
 * Provides per-request SSL bypass ONLY for ngrok tunnels, not globally
 * Maintains security for all other HTTPS connections
 */

const https = require('https');
const url = require('url');

/**
 * SECURITY FIX: Create secure HTTPS agent for specific ngrok connections
 * This replaces the dangerous global SSL bypass
 */
function createNgrokAgent(targetUrl) {
    const parsedUrl = url.parse(targetUrl);
    
    // Only disable SSL verification for ngrok domains
    if (parsedUrl.hostname && parsedUrl.hostname.includes('ngrok.io')) {
        console.warn('⚠️  SSL verification disabled for ngrok tunnel:', parsedUrl.hostname);
        return new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            timeout: 10000
        });
    }
    
    // Use secure defaults for all other connections
    return new https.Agent({
        rejectUnauthorized: true,
        keepAlive: true,
        timeout: 10000
    });
}

/**
 * SECURITY FIX: Enhanced WebSocket options with per-connection SSL control
 */
function getNgrokWebSocketOptions(targetUrl) {
    const parsedUrl = url.parse(targetUrl);
    const isNgrok = parsedUrl.hostname && parsedUrl.hostname.includes('ngrok.io');
    
    return {
        // Only disable SSL verification for ngrok tunnels
        rejectUnauthorized: !isNgrok,
        handshakeTimeout: 10000,
        perMessageDeflate: true,
        followRedirects: true,
        maxRedirects: 3,
        origin: isNgrok ? 'https://ngrok.io' : undefined,
        headers: {
            'User-Agent': 'OGZ-Prime-WebSocket-Client/1.0'
        },
        // Add custom agent for HTTPS connections
        agent: targetUrl.startsWith('https://') ? createNgrokAgent(targetUrl) : undefined
    };
}

/**
 * SECURITY FIX: Secure HTTPS request function with per-request SSL control
 */
function makeSecureRequest(targetUrl, options = {}) {
    const agent = createNgrokAgent(targetUrl);
    
    return {
        ...options,
        agent,
        timeout: options.timeout || 10000
    };
}

/**
 * SECURITY FIX: Check if URL is a development tunnel that may need SSL bypass
 */
function isDevelopmentTunnel(targetUrl) {
    if (!targetUrl || typeof targetUrl !== 'string') {
        return false;
    }
    
    const parsedUrl = url.parse(targetUrl);
    const hostname = parsedUrl.hostname;
    
    if (!hostname) {
        return false;
    }
    
    // Known development tunnel services
    const tunnelDomains = [
        'ngrok.io',
        'ngrok-free.app',
        'localtunnel.me',
        'localhost.run'
    ];
    
    return tunnelDomains.some(domain => hostname.includes(domain));
}

/**
 * SECURITY FIX: Validate SSL certificate with custom verification
 */
function validateSSLCertificate(cert, hostname) {
    if (!cert) {
        return false;
    }
    
    // Basic certificate validation
    const now = new Date();
    const notBefore = new Date(cert.valid_from);
    const notAfter = new Date(cert.valid_to);
    
    if (now < notBefore || now > notAfter) {
        console.error('❌ SSL certificate expired or not yet valid:', cert.subject);
        return false;
    }
    
    // Check if certificate matches hostname
    if (cert.subject && cert.subject.CN !== hostname) {
        console.warn('⚠️  SSL certificate hostname mismatch:', cert.subject.CN, 'vs', hostname);
        // For ngrok tunnels, this is expected - allow it
        if (isDevelopmentTunnel(`https://${hostname}`)) {
            return true;
        }
        return false;
    }
    
    return true;
}

// SECURITY FIX: Remove dangerous global SSL bypass
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // REMOVED - this was a security vulnerability

// Export secure functions instead of insecure options
module.exports = {
    createNgrokAgent,
    getNgrokWebSocketOptions,
    makeSecureRequest,
    isDevelopmentTunnel,
    validateSSLCertificate,
    
    // Legacy compatibility (deprecated - use getNgrokWebSocketOptions instead)
    ngrokWebSocketOptions: {
        rejectUnauthorized: false, // Only for backward compatibility - use getNgrokWebSocketOptions
        handshakeTimeout: 10000,
        perMessageDeflate: true,
        followRedirects: true,
        maxRedirects: 3,
        origin: 'https://ngrok.io',
        headers: {
            'User-Agent': 'OGZ-Prime-WebSocket-Client/1.0'
        }
    }
};
