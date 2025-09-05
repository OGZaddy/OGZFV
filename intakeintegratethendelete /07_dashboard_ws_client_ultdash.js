// Target: public/ultdash.html (script)
// Connect ultdash to unified WS and handle basic message types.

function buildWS() {
  const qs = new URLSearchParams(location.search);
  const explicit = qs.get('ws');
  if (explicit) return explicit;
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host  = location.host.split(':')[0];
  const port  = qs.get('wsPort') || '3010';
  return proto + host + ':' + port + '/ws';
}

const WS_URL = buildWS();
const socket = new WebSocket(WS_URL);

socket.addEventListener('open', () => {
  console.log('✅ ultdash connected:', WS_URL);
  socket.send(JSON.stringify({ type:'identify', source:'dashboard', botTier:'quantum', version:'ultdash-1.0', ts:Date.now() }));
});

socket.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  // TODO: wire up to your UI renderers.
  if (msg.type === 'trade') { /* renderTrade(msg.data); */ }
  if (msg.type === 'price') { /* updatePrice(msg.data); */ }
  if (msg.type === 'market_data') { /* updateCharts(msg.data); */ }
  if (msg.type === 'pattern') { /* showPattern(msg.data); */ }
  if (msg.type === 'status') { /* updateStatus(msg.data); */ }
});

setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type:'ping', ts: Date.now(), client:'ultdash' }));
  }
}, 30000);
