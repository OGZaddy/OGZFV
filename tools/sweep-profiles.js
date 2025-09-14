#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const V13BacktestWithTRAI = require('../backtest-v13-with-trai.js');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--base') out.base = args[++i];
    else if (a === '--grid') out.grid = args[++i];
    else if (a === '--outdir') out.outdir = args[++i];
    else if (a === '--top') out.top = parseInt(args[++i]) || 5;
    else if (a === '--label') out.label = args[++i];
  }
  return out;
}

function parseGrid(gridStr) {
  // format: key=v1,v2;key2=v3,v4
  const grid = {};
  if (!gridStr) return grid;
  gridStr.split(';').map(s => s.trim()).filter(Boolean).forEach(pair => {
    const [k, vals] = pair.split('=');
    if (!k || !vals) return;
    grid[k.trim()] = vals.split(',').map(v => v.trim()).map(v => {
      const n = Number(v);
      return isNaN(n) ? v : n;
    });
  });
  return grid;
}

function product(grid) {
  const keys = Object.keys(grid);
  if (!keys.length) return [{}];
  const recur = (i, acc, out) => {
    if (i === keys.length) return out.push({ ...acc });
    const k = keys[i];
    for (const v of grid[k]) {
      acc[k] = v;
      recur(i + 1, acc, out);
    }
  };
  const out = [];
  recur(0, {}, out);
  return out;
}

async function runOne(baseCfg, combo, data) {
  const cfg = { ...baseCfg, ...combo };
  // Build a readable name suffix from combo
  const suffix = Object.entries(combo).map(([k, v]) => `${k}-${String(v).replace(/\W+/g, '')}`).join('_');
  const name = `${baseCfg.name || 'profile'}_${suffix}`;

  const bt = new V13BacktestWithTRAI({
    tier: cfg.tier || 'elite',
    initialBalance: cfg.initialBalance || 10000,
    maxPositionSize: cfg.maxPositionSize ?? 0.05,
    stopLossPercent: cfg.stopLossPercent ?? 5.0,
    takeProfitPercent: cfg.takeProfitPercent ?? 12.0,
    minTradeConfidence: cfg.minTradeConfidence ?? 0,
    patternConfidence: cfg.patternConfidence ?? 0.35
  });

  await bt.initialize();
  const results = await bt.runBacktest(data);
  return { name, cfg, results, bt };
}

function pickMetrics(r) {
  const s = r.summary || {};
  return {
    totalReturn: Number(s.totalReturn || 0),
    totalTrades: Number(s.totalTrades || 0),
    winRate: Number(s.winRate || 0),
    profitFactor: Number(s.profitFactor || 0),
    maxDrawdown: Number(s.maxDrawdown || 0)
  };
}

async function main() {
  const { base, grid: gridStr, outdir, top = 5, label } = parseArgs();
  if (!base) {
    console.error('Usage: node tools/sweep-profiles.js --base profiles/elite-btc.json --grid "minTradeConfidence=0,0.1,0.2;patternConfidence=0.25,0.3;stopLossPercent=4,5;takeProfitPercent=10,12" [--outdir reports/sweeps] [--top 5] [--label myrun]');
    process.exit(1);
  }
  const basePath = path.resolve(process.cwd(), base);
  const baseCfg = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const dataPath = path.resolve(process.cwd(), baseCfg.dataPath);
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    process.exit(1);
  }
  const allData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const lookback = baseCfg.lookback || 5000;
  const historicalData = allData.slice(-lookback);

  const grid = parseGrid(gridStr || 'minTradeConfidence=0,0.1,0.2;patternConfidence=0.25,0.3,0.35;stopLossPercent=4,5;takeProfitPercent=10,12');
  const combos = product(grid);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const labelName = label || (baseCfg.name || 'profile');
  const outBase = path.resolve(process.cwd(), outdir || 'reports/sweeps', `${labelName}-${ts}`);
  fs.mkdirSync(outBase, { recursive: true });

  console.log(`\n🚀 Starting sweep for ${combos.length} combos`);
  const resultsArr = [];
  for (let i = 0; i < combos.length; i++) {
    const combo = combos[i];
    console.log(`\n[${i + 1}/${combos.length}] Running`, combo);
    const run = await runOne(baseCfg, combo, historicalData);
    const metrics = pickMetrics(run.results);
    const runDir = path.join(outBase, run.name);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'profile.json'), JSON.stringify({ ...baseCfg, ...combo }, null, 2));
    fs.writeFileSync(path.join(runDir, 'results.json'), JSON.stringify(run.results, null, 2));
    try {
      const arr = [];
      if (run.bt.traiAnalysis && run.bt.traiAnalysis.forEach) {
        run.bt.traiAnalysis.forEach((v, k) => arr.push({ id: k, analysis: v }));
      }
      fs.writeFileSync(path.join(runDir, 'trai-analysis.json'), JSON.stringify(arr, null, 2));
    } catch {}
    resultsArr.push({ name: run.name, combo, metrics, dir: runDir });
  }

  // Rank by profit factor, then totalReturn, with a minimum trades filter
  const minTrades = 5;
  const ranked = resultsArr
    .filter(r => r.metrics.totalTrades >= minTrades)
    .sort((a, b) => (b.metrics.profitFactor - a.metrics.profitFactor) || (b.metrics.totalReturn - a.metrics.totalReturn));

  // Write summary
  fs.writeFileSync(path.join(outBase, 'summary.json'), JSON.stringify({ base: baseCfg, grid, ranked }, null, 2));
  const csvHeader = 'name,totalTrades,profitFactor,totalReturn,winRate,maxDrawdown,dir\n';
  const csvBody = resultsArr.map(r => `${r.name},${r.metrics.totalTrades},${r.metrics.profitFactor.toFixed(2)},${r.metrics.totalReturn.toFixed(2)},${r.metrics.winRate.toFixed(1)},${r.metrics.maxDrawdown.toFixed(2)},${r.dir}`).join('\n');
  fs.writeFileSync(path.join(outBase, 'summary.csv'), csvHeader + csvBody);

  // Copy top K profiles to best-profiles
  const bestDir = path.join(outBase, 'best-profiles');
  fs.mkdirSync(bestDir, { recursive: true });
  ranked.slice(0, top).forEach((r, idx) => {
    const outProf = path.join(bestDir, `${String(idx + 1).padStart(2, '0')}-${r.name}.json`);
    fs.writeFileSync(outProf, JSON.stringify({ ...baseCfg, ...r.combo, name: r.name }, null, 2));
  });

  console.log(`\n🏁 Sweep complete. Summary: ${path.join(outBase, 'summary.csv')}`);
  console.log(`Top profiles written to: ${bestDir}`);
}

main().catch(e => { console.error('Sweep failed:', e); process.exit(1); });

