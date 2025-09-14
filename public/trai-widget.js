(function(){
  const STATE = { ws: null, connected: false, open: false };
  let perfSnapshot = null;
  let userInteracted = false;

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    .trai-fab{position:fixed; right:20px; bottom:20px; width:56px; height:56px; border-radius:50%; border:none; cursor:pointer; z-index:9998; background:#dc2626; color:#fff; box-shadow:0 10px 25px rgba(0,0,0,.4); font-size:22px}
    .trai-panel{position:fixed; right:20px; bottom:86px; width:340px; max-width:95vw; height:420px; display:none; flex-direction:column; z-index:9999; background:#0b0b0b; border:1px solid rgba(255,255,255,.1); border-radius:12px; box-shadow:0 25px 70px rgba(0,0,0,.6)}
    .trai-header{display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.08); color:#fff}
    .trai-status{font-size:10px; opacity:.8}
    .trai-body{flex:1; overflow:auto; padding:10px; color:#eee; font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial}
    .trai-msg{margin:6px 0; font-size:13px; line-height:1.35}
    .trai-msg.you{color:#66c2ff}
    .trai-msg.trai{color:#00ff88}
    .trai-input{display:flex; gap:8px; padding:10px; border-top:1px solid rgba(255,255,255,.08)}
    .trai-input input{flex:1; padding:10px; border-radius:8px; border:1px solid #333; background:#111; color:#fff}
    .trai-input button{background:#dc2626; color:#fff; border:none; border-radius:8px; padding:10px 12px; cursor:pointer}
  `;
  document.head.appendChild(style);

  // Elements
  const fab = document.createElement('button');
  fab.className = 'trai-fab';
  fab.title = 'Chat with TRAI';
  fab.textContent = '🧠';

  const panel = document.createElement('div');
  panel.className = 'trai-panel';
  panel.innerHTML = `
    <div class="trai-header">
      <div>TRAI Assistant</div>
      <div class="trai-status" id="traiStatus">Connecting…</div>
    </div>
    <div class="trai-body" id="traiBody"></div>
    <div class="trai-input">
      <input id="traiInputGlobal" placeholder="Ask TRAI…" />
      <button id="traiSendGlobal">Send</button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const bodyEl = panel.querySelector('#traiBody');
  const inputEl = panel.querySelector('#traiInputGlobal');
  const sendBtn = panel.querySelector('#traiSendGlobal');
  const statusEl = panel.querySelector('#traiStatus');

  function appendMsg(sender, text){
    const row = document.createElement('div');
    row.className = 'trai-msg ' + (sender==='TRAI'?'trai':'you');
    row.textContent = `${sender}: ${text}`;
    bodyEl.appendChild(row);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function getUtmParams() {
    try {
      const p = new URLSearchParams(window.location.search);
      const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
      const obj = {}; keys.forEach(k => { if (p.get(k)) obj[k] = p.get(k); });
      return obj;
    } catch { return {}; }
  }

  function sendCTA(reason='proactive', extra={}){
    if (!(STATE.ws && STATE.connected)) return;
    try {
      const key = `trai_cta_${reason}_${location.pathname}`;
      if (sessionStorage.getItem(key)) return; // avoid repeat per page session
      sessionStorage.setItem(key, '1');
    } catch {}
    let bestLine = '';
    if (perfSnapshot && perfSnapshot.best && Number(perfSnapshot.best.usd) > 0) {
      bestLine = `Top performer: ${perfSnapshot.best.tier} +$${Number(perfSnapshot.best.usd).toFixed(2)} today.`;
    }
    const context = {
      page: location.pathname,
      title: document.title,
      utm: getUtmParams(),
      reason,
      extra,
    };
    const prompt = `Generate a very short, personalized CTA for a visitor on ${context.page} titled "${context.title}".
${bestLine}
Only reference the top performer provided above if positive. Do not invent bots or metrics.
Respond in JSON with fields: {"text":"<=20 words", "button":{"label":"...","href":"/pricing.html"}}.
Focus on conversion. No preamble.`;
    STATE.ws.send(JSON.stringify({ type:'question', data: prompt }));
  }

  function connect(){
    try{
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      STATE.ws = new WebSocket(wsUrl);
      STATE.open = true;

      STATE.ws.onopen = () => {
        STATE.connected = true;
        statusEl.textContent = 'Online';
        // identify as web chat
        STATE.ws.send(JSON.stringify({ type:'identify', source:'dashboard' }));
        // Friendly welcome
        appendMsg('TRAI', 'Hey! I can answer questions, discuss strategies, and explain the live dashboard. How can I help?');
      };

      STATE.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'performance_snapshot' && data.data) {
            perfSnapshot = data.data;
          }
          if (data.type === 'answer') {
            const answer = data.answer || (data.data && data.data.answer) || '';
            if (!answer) return;
            let handled = false;
            try {
              const obj = JSON.parse(answer);
              if (obj && obj.text) {
                appendMsg('TRAI', obj.text);
                if (obj.button && obj.button.href) {
                  const btnRow = document.createElement('div');
                  btnRow.className = 'trai-msg trai';
                  const btn = document.createElement('button');
                  btn.textContent = obj.button.label || 'Open';
                  btn.style.cssText = 'margin-top:6px; background:#00ff88; color:#000; border:none; border-radius:6px; padding:8px 10px; cursor:pointer;';
                  btn.onclick = ()=>{ window.location.href = obj.button.href; };
                  btnRow.appendChild(btn); bodyEl.appendChild(btnRow); bodyEl.scrollTop = bodyEl.scrollHeight;
                }
                handled = true;
              }
            } catch(_){}
            if (!handled) appendMsg('TRAI', answer);
          }
          if (data.type === 'trade_analysis' || data.type === 'market_analysis') {
            const analysis = (data.data && data.data.analysis) || '';
            if (analysis) appendMsg('TRAI', analysis);
          }
        } catch(_){}
      };

      STATE.ws.onclose = () => {
        STATE.connected = false; statusEl.textContent = 'Offline';
        // try reconnect later
        if (STATE.open) setTimeout(connect, 5000);
      };
      STATE.ws.onerror = () => {
        STATE.connected = false; statusEl.textContent = 'Error';
      };
    }catch(e){ statusEl.textContent = 'Error'; }
  }

  function send(){
    const q = (inputEl.value || '').trim();
    if (!q) return;
    appendMsg('You', q);
    inputEl.value = '';
    userInteracted = true;
    if (STATE.ws && STATE.connected) {
      STATE.ws.send(JSON.stringify({ type:'question', data:q }));
    } else {
      appendMsg('TRAI', 'Connection not available yet.');
    }
  }

  fab.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  });
  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keypress', (e)=>{ if(e.key==='Enter') send(); });

  window.TRAI_WIDGET = {
    ask: (text)=>{ inputEl.value = text; send(); },
    cta: (reason, extra)=>{ sendCTA(reason||'proactive', extra||{}); }
  };

  connect();

  // Proactive CTA after delay if no interaction
  setTimeout(()=>{ if (!userInteracted) sendCTA('proactive_delay'); }, 45000);

  // Welcome CTA after demo unlock
  try {
    if (localStorage.getItem('ogz_lead_demo_ok') && !sessionStorage.getItem('trai_welcome_done')){
      sessionStorage.setItem('trai_welcome_done','1');
      setTimeout(()=> sendCTA('welcome_demo'), 5000);
    }
  } catch(_){ }
})();
