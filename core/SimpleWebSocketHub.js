const EventEmitter = require('events');

class SimpleWebSocketHub extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // id -> { id, ws, metadata, state }
    this._idCounter = 0;
  }

  registerClient(ws, metadata = {}) {
    const id = `c_${Date.now()}_${++this._idCounter}`;
    const conn = { id, ws, metadata: { ...metadata }, state: {} };
    this.connections.set(id, conn);

    ws.on('close', () => {
      const wasBot = conn.metadata && conn.metadata.type === 'bot';
      this.connections.delete(id);
      if (wasBot) this.emit('bot_disconnected', conn);
    });

    ws.on('error', () => {
      // swallow to keep hub stable
    });

    return id;
  }

  sendDirect(connection, message) {
    try { connection.ws.send(JSON.stringify(message)); } catch (_) {}
  }

  broadcast(message, options = {}) {
    const filter = options.filter || (() => true);
    let sent = 0;
    for (const conn of this.connections.values()) {
      if (!filter(conn)) continue;
      try {
        conn.ws.send(JSON.stringify(message));
        sent++;
      } catch (_) {}
    }
    return { sent };
  }

  getStatistics() {
    const byType = {};
    for (const conn of this.connections.values()) {
      const t = conn.metadata?.type || 'unknown';
      byType[t] = (byType[t] || 0) + 1;
    }
    return {
      connections: { total: this.connections.size, byType },
      performance: { messagesPerSecond: 0, averageLatency: 0, successRate: 1 },
      queues: { totalQueued: 0 },
      circuitBreaker: { open: false }
    };
  }

  shutdown() {
    try {
      for (const conn of this.connections.values()) {
        try { conn.ws.close(); } catch (_) {}
      }
    } finally {
      this.connections.clear();
    }
  }
}

module.exports = SimpleWebSocketHub;
