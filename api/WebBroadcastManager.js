class WebSocketManager {
    constructor() {
        this.clients = new Set();
    }

    addClient(client) {
        this.clients.add(client);
    }

    broadcastUpdate(type, data) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type, data }));
            }
        });
    }
}

const webSocketManager = new WebSocketManager();

async function updateTrade(userId, tradeData) {
    await saveTrade(userId, tradeData);
    webSocketManager.broadcastUpdate('tradeUpdate', { userId, tradeData });
}