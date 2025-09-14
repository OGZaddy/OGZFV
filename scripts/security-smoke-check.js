#!/usr/bin/env node
const http = require('http');
const https = require('https');

function get(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, body: String(e.message || e) }));
    req.setTimeout(3000, () => { try { req.destroy(); } catch {} resolve({ status: 0, body: 'timeout' }); });
  });
}

(async () => {
  const base = process.env.BASE_URL || 'http://127.0.0.1:3010';
  let pass = true;

  // 1) WebSocket/health
  const live = await get(base + '/api/live-status');
  if (live.status === 200) console.log('✅ live-status OK'); else { console.log('❌ live-status', live.status); pass = false; }

  // 2) Lead gate markup present
  const idx = await get(base + '/index.html');
  if (idx.status === 200 && /leadModal|openDemoGate/.test(idx.body)) console.log('✅ lead gate markup OK'); else console.log('⚠️ lead gate not detected on /index.html');

  // 3) Widget injected on dashboard
  const dash = await get(base + '/unified-dashboard.html');
  if (dash.status === 200 && /trai-widget\.js/.test(dash.body)) console.log('✅ widget injected on dashboard'); else console.log('⚠️ widget not found on dashboard');

  // 4) LLM off on this host
  const llm = await get('http://127.0.0.1:11434/api/tags');
  if (llm.status !== 200) console.log('✅ LLM appears disabled locally'); else { console.log('⚠️ LLM responding locally'); }

  process.exit(pass ? 0 : 1);
})();

