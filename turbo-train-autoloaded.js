// turbo-train-autoloader.js - OGZ Prime Turbo Trainer 💥

const fs = require('fs');
const path = require('path');
const os = require('os');
const { trainOnHistoricalData } = require('./historical-data-loader.js');
const WebSocketManager = require('./core/WebsocketManager.js');

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

(async () => {
  const candlesPath = path.resolve(__dirname, 'polygon-btc-1y.json'); // Point this to your 1M candle file
  const candlesRaw = fs.readFileSync(candlesPath, 'utf8');
  const candles = JSON.parse(candlesRaw);

  const cpuCount = os.cpus().length;
  console.log(`${colors.cyan}[OGZ Turbo Auto]${colors.reset} Loaded ${colors.yellow}${candles.length.toLocaleString()}${colors.reset} candles.`);
  console.log(`${colors.magenta}🧠 Training initiated across ${colors.bold}${cpuCount}${colors.reset}${colors.magenta} threads...${colors.reset}`);

  console.time(`${colors.green}✅ Training complete in`);

  const performance = await trainOnHistoricalData(candles);

  console.timeEnd(`${colors.green}✅ Training complete in`);
  console.log(`${colors.bold}${colors.green}📦 Output dumped to: /data/samples/performance.json${colors.reset}`);
})();
