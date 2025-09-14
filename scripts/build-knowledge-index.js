#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectFiles(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (d) => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && exts.test(ent.name)) out.push(p);
    }
  };
  walk(dir);
  return out;
}

function main() {
  const root = process.cwd();
  const envDirs = process.env.KNOWLEDGE_DIRS ? process.env.KNOWLEDGE_DIRS.split(',').map(s => s.trim()).filter(Boolean) : [];
  const dirs = (envDirs.length ? envDirs : ['knowledge','docs','public']).map(d => path.resolve(root, d));
  const exts = /\.(md|markdown|txt|html|htm)$/i;
  const files = [];
  for (const d of dirs) {
    files.push(...collectFiles(d, exts));
  }
  const items = files.map(fp => {
    try {
      let content = fs.readFileSync(fp, 'utf8');
      if (/\.html?$/i.test(fp)) content = stripHtml(content);
      return { path: fp, content };
    } catch { return null; }
  }).filter(Boolean);
  const outPath = path.resolve(root, 'trai', 'knowledge-index.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(items), 'utf8');
  console.log(`Wrote ${items.length} docs to ${outPath}`);
}

main();

