// Target: launcher + ExecutionLayer.js
// Ensure ExecutionLayer broadcasts trades to WS used by ultdash.

function onWsOpen(ws) {
  console.log('✅ Connected to unified WS');
  if (this.executionLayer && this.executionLayer.setWebSocketClient) {
    this.executionLayer.setWebSocketClient(ws);
    console.log('🔌 ExecutionLayer -> WS broadcasting connected');
  }
  ws.send(JSON.stringify({ type:'identify', source:'trading_bot', botTier:'quantum', ts:Date.now() }));
}

function setWebSocketClient(ws) { this.wsClient = ws; }
function broadcastTrade(trade) {
  if (!this.wsClient || this.wsClient.readyState !== 1) return;
  this.wsClient.send(JSON.stringify({ type:'trade', botTier:this.botTier || 'quantum', data: trade, ts: Date.now() }));
}
module.exports = { onWsOpen, setWebSocketClient, broadcastTrade };
