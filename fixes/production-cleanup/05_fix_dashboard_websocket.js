// Target: unified-dashboard.html
// Auto-detect production vs development WebSocket

// REPLACE the connectWebSocket function with:
function connectWebSocket() {
  // Auto-detect based on protocol
  let wsUrl;
  if (location.protocol === 'https:') {
    // Production - use wss through NGINX
    wsUrl = 'wss://' + location.host + '/ws';
  } else {
    // Development - direct to 127.0.0.1:3010
    wsUrl = 'ws://127.0.0.1:3010/ws';
  }
  
  // Allow override via query param for testing
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.get('ws')) {
    wsUrl = urlParams.get('ws');
  }
  
  console.log('🔌 Connecting to WebSocket:', wsUrl);
  ws = new WebSocket(wsUrl);
  
  // Keep your existing onopen, onmessage, etc handlers
  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    ws.send(JSON.stringify({
      type: 'identify',
      source: 'dashboard',
      version: 'unified-1.0'
    }));
  };
  
  // ... rest of your handlers ...
}