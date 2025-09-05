// Target: WS server creation point
// Use the WebSocketManager singleton to avoid duplicate servers on the same port.

// Example:
// const wsManager = require('./WebsocketManager');
// const wss = wsManager.getServer(3010);
// wss.on('connection', (client, req) => { /* ... */ });
