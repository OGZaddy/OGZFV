// Load markdown memory for TRAI
const fs = require('fs/promises');
const path = require('path');

const MEM_DIR = process.env.TRAI_MEMORY_DIR || '/srv/trai/markdown';

async function loadMemory() {
  const files = await fs.readdir(MEM_DIR).catch(()=>[]);
  const md = [];
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const p = path.join(MEM_DIR, f);
    const text = await fs.readFile(p, 'utf8').catch(()=>'');
    md.push({ name: f, text });
  }
  console.log(`🧠 TRAI memory: loaded ${md.length} markdown docs`);
  return md;
}
module.exports = { loadMemory };
