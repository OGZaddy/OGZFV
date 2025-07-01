// download-full-year-polygon.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // ✅ FIX HERE

const API_KEY = process.env.POLYGON_API_KEY;

const config = {
  ticker: 'X:BTCUSD',
  multiplier: 1,
  timespan: 'minute',
  year: 2023,
  limit: 5000,
  outputFile: path.join(__dirname, '../data/polygon-btc-1y.json')
};

async function downloadMonthlyRange(start, end) {
  const url = `https://api.polygon.io/v2/aggs/ticker/${config.ticker}/range/${config.multiplier}/${config.timespan}/${start}/${end}?adjusted=true&sort=asc&limit=${config.limit}&apiKey=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.results || [];
}

(async () => {
  console.log(`📥 Downloading 1 year of data for ${config.ticker}...`);
  let allCandles = [];

  for (let month = 1; month <= 12; month++) {
    const mm = month.toString().padStart(2, '0');
    const start = `${config.year}-${mm}-01`;
    const end = `${config.year}-${mm}-28`;

    try {
      console.log(`📅 Fetching ${start} to ${end}`);
      const candles = await downloadMonthlyRange(start, end);
      allCandles.push(...candles);
    } catch (err) {
      console.log(`❌ Error on month ${mm}: ${err.message}`);
    }
  }

  const formatted = allCandles.map(c => ({
    timestamp: c.t,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
    volume: c.v
  }));

  fs.writeFileSync(config.outputFile, JSON.stringify(formatted, null, 2));
  console.log(`✅ Done. Total candles: ${formatted.length}`);
  console.log(`💾 Saved to: ${config.outputFile}`);
})();
