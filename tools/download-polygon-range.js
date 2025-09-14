// tools/download-polygon-range.js
// Generic Polygon.io downloader for aggregates over a date range
// Usage examples:
//  node tools/download-polygon-range.js --symbol=X:BTCUSD --span=minute --mult=1 --from=2023-01-01 --to=2023-12-31 --out=data/polygon-btc-2023-1m.json
//  node tools/download-polygon-range.js --symbol=X:BTCUSD --span=day --mult=1 --from=2015-01-01 --to=2024-12-31 --out=data/polygon-btc-2015-2024-1d.json

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.POLYGON_API_KEY;
if (!API_KEY) {
  console.error('❌ POLYGON_API_KEY is not set. Export it and try again.');
  process.exit(1);
}

function getArg(name, def = undefined) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
}

const symbol = getArg('symbol', 'X:BTCUSD');
const span = getArg('span', 'minute'); // minute|hour|day|week|month
const mult = parseInt(getArg('mult', '1')) || 1;
const from = getArg('from', '2023-01-01');
const to = getArg('to', '2023-12-31');
const out = getArg('out', path.join(__dirname, '../data/polygon-download.json'));
const limit = parseInt(getArg('limit', '50000'));

async function downloadRange(start, end) {
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${mult}/${span}/${start}/${end}?adjusted=true&sort=asc&limit=${limit}&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

function* monthRanges(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  let d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (d <= end) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const monthStart = `${y}-${m}-01`;
    // Use 28th of month to avoid month length complications
    const monthEnd = `${y}-${m}-28`;
    yield [monthStart, monthEnd];
    d = new Date(Date.UTC(y, d.getUTCMonth() + 1, 1));
  }
}

(async () => {
  console.log(`📥 Downloading ${symbol} ${mult}${span} from ${from} to ${to}`);
  const all = [];
  for (const [s, e] of monthRanges(from, to)) {
    try {
      process.stdout.write(`  ↳ ${s} → ${e} ... `);
      const chunk = await downloadRange(s, e);
      all.push(...chunk);
      console.log(`ok (${chunk.length})`);
    } catch (err) {
      console.log(`error: ${err.message}`);
    }
  }

  const formatted = all.map(c => ({
    timestamp: c.t,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
    volume: c.v
  })).sort((a, b) => a.timestamp - b.timestamp);

  const outPath = path.resolve(out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(formatted, null, 2));
  console.log(`✅ Saved ${formatted.length} candles to ${outPath}`);
})();

