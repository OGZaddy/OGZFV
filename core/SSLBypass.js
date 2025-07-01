/**
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
