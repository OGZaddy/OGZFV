#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readLines(file) {
  try { return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean); } catch { return []; }
}

function main() {
  const logsDir = path.resolve(process.cwd(), 'logs');
  const files = (fs.existsSync(logsDir) ? fs.readdirSync(logsDir) : [])
    .filter(f => f.startsWith('aggregated-insights-') && f.endsWith('.jsonl'))
    .map(f => path.join(logsDir, f));
  const stats = { total: 0, byTier: {}, patterns: {} };
  for (const f of files) {
    for (const line of readLines(f)) {
      try {
        const j = JSON.parse(line);
        stats.total++;
        const tier = j.tier || 'unknown';
        if (!stats.byTier[tier]) stats.byTier[tier] = { count: 0, avgConf: 0, sumConf: 0 };
        stats.byTier[tier].count++;
        if (typeof j.confidence === 'number') stats.byTier[tier].sumConf += j.confidence;
        if (Array.isArray(j.patterns)) j.patterns.forEach(p => { stats.patterns[p] = (stats.patterns[p] || 0) + 1; });
      } catch {}
    }
  }
  Object.keys(stats.byTier).forEach(t => {
    const o = stats.byTier[t];
    o.avgConf = o.count ? (o.sumConf / o.count) : 0;
    delete o.sumConf;
  });
  const out = { generatedAt: new Date().toISOString(), stats };
  const outPath = path.resolve(process.cwd(), 'trai', 'advise.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();

