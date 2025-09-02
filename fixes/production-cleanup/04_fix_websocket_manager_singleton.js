// Target: WebsocketManager.js
// Fix the singleton bug that creates duplicate servers

// REPLACE the getServer method with:
getServer(port, options = {}) {
  const serverKey = `ws-${port}`;
  
  // FIX: Check and store using same key
  if (this.servers[serverKey]) {
    console.log(`♻️ Reusing existing WebSocket server on port ${port}`);
    return this.servers[serverKey];
  }
  
  console.log(`🔧 Creating new WebSocket server on port ${port}`);
  return this.#createServer(serverKey, port, options);
}

// In #createServer, ensure it stores with the key:
#createServer(key, port, options) {
  // ... your server creation logic ...
  this.servers[key] = server; // NOT this.servers[port]
  return server;
}