#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const V13BacktestWithTRAI = require('../backtest-v13-with-trai.js');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--profile') out.profile = args[++i];
    else if (a === '--outdir') out.outdir = args[++i];
  }
  return out;
}

async function main() {
  const { profile, outdir } = parseArgs();
  if (!profile) {
    console.error('Usage: node tools/run-profile-backtest.js --profile profiles/elite-btc.json [--outdir reports]');
    process.exit(1);
  }
  const pPath = path.resolve(process.cwd(), profile);
  const cfg = JSON.parse(fs.readFileSync(pPath, 'utf8'));
  const dataPath = path.resolve(process.cwd(), cfg.dataPath);
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    process.exit(1);
  }
  const allData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const lookback = cfg.lookback || 5000;
  const historicalData = allData.slice(-lookback);

  const bt = new V13BacktestWithTRAI({
    tier: cfg.tier || 'elite',
    initialBalance: cfg.initialBalance || 10000,
    maxPositionSize: cfg.maxPositionSize || 0.05,
    stopLossPercent: cfg.stopLossPercent || 5.0,
    takeProfitPercent: cfg.takeProfitPercent || 12.0
  });

  await bt.initialize();
  console.log(`\n🚀 Backtest starting: ${cfg.name} (${cfg.asset}) on ${lookback} candles\n`);
  const results = await bt.runBacktest(historicalData);

  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const baseOut = path.resolve(process.cwd(), outdir || 'reports', `${cfg.name}-${ts}`);
  fs.mkdirSync(baseOut, { recursive: true });

  fs.writeFileSync(path.join(baseOut, 'profile.json'), JSON.stringify(cfg, null, 2));
  fs.writeFileSync(path.join(baseOut, 'results.json'), JSON.stringify(results, null, 2));

  // Extract TRAI analysis if available
  try {
    const arr = [];
    if (bt.traiAnalysis && bt.traiAnalysis.forEach) {
      bt.traiAnalysis.forEach((v, k) => { arr.push({ id: k, analysis: v }); });
    }
    fs.writeFileSync(path.join(baseOut, 'trai-analysis.json'), JSON.stringify(arr, null, 2));
  } catch {}

  console.log(`\n🏁 Done. Wrote report to ${baseOut}\n`);
}

main().catch(e => { console.error('Backtest failed:', e); process.exit(1); });

