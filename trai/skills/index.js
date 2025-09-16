const fs = require('fs');
const path = require('path');

// Simple keyword matcher and snippet extractor for support/onboarding
function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

function loadIndexFromDisk(indexPath) {
  try {
    const raw = fs.readFileSync(indexPath, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map(x => ({ path: x.path, content: x.content }));
  } catch {}
  return null;
}

function scanKnowledge(dirs) {
  const files = [];
  const exts = /\.(md|markdown|txt|html|htm)$/i;
  dirs.forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach((ent) => {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          // one level deep
          try {
            const inner = fs.readdirSync(p, { withFileTypes: true });
            inner.forEach((i) => {
              const ip = path.join(p, i.name);
              if (i.isFile() && exts.test(i.name)) {
                try {
                  let content = fs.readFileSync(ip, 'utf8');
                  if (/\.html?$/i.test(ip)) content = stripHtml(content);
                  files.push({ path: ip, content });
                } catch {}
              }
            });
          } catch {}
        } else if (ent.isFile() && exts.test(ent.name)) {
          try {
            let content = fs.readFileSync(p, 'utf8');
            if (/\.html?$/i.test(p)) content = stripHtml(content);
            files.push({ path: p, content });
          } catch {}
        }
      });
    } catch {}
  });
  return files;
}

function loadFilesOnce(dirs) {
  // Prefer prebuilt index if available
  const indexPath = path.resolve(process.cwd(), 'trai', 'knowledge-index.json');
  const idx = loadIndexFromDisk(indexPath);
  if (idx) return idx;
  return scanKnowledge(dirs);
}

function scoreDoc(q, doc) {
  const terms = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const lc = doc.toLowerCase();
  let score = 0;
  terms.forEach((t) => { if (lc.includes(t)) score += 1; });
  return score;
}

function bestSnippet(q, doc) {
  const idx = doc.toLowerCase().indexOf(q.toLowerCase().split(/\s+/)[0]);
  if (idx < 0) {
    // fallback: first 300 chars
    return doc.slice(0, 300);
  }
  const start = Math.max(0, idx - 120);
  return doc.slice(start, start + 400);
}

async function routeQuestion(question, ctx = {}) {
  const { llm, knowledgeDirs = [], persistentMemory } = ctx;
  // Basic intent routing by keywords (safe without LLM)
  const q = (question && question.question) ? question.question : (typeof question === 'string' ? question : '');
  const lower = q.toLowerCase();

  // 1) Memory FIRST: search previous conversations/insights for personality and context
  // This preserves TRAI's personality and memory of past interactions
  try {
    if (persistentMemory) {
      let best = null; let bestScore = 0; let bestAnswer = '';
      const terms = lower.split(/[^a-z0-9]+/).filter(Boolean);
      const scoreStr = (s) => {
        const l = String(s || '').toLowerCase();
        return terms.reduce((n, t) => n + (l.includes(t) ? 1 : 0), 0);
      };
      if (Array.isArray(persistentMemory.conversations)) {
        persistentMemory.conversations.slice(-500).forEach((c) => {
          const s = scoreStr(c.question) + scoreStr(c.answer);
          if (s > bestScore) { bestScore = s; best = c; bestAnswer = c.answer; }
        });
      }
      if (Array.isArray(persistentMemory.insights)) {
        persistentMemory.insights.slice(-300).forEach((i) => {
          const s = scoreStr(i.text || i.insight || i);
          if (s > bestScore) { bestScore = s; best = i; bestAnswer = (i.text || i.insight || i); }
        });
      }
      // Only return memory answer if it's a VERY strong match (like exact questions about past conversations)
      // This prevents random matches from old conversations
      if (best && bestScore > 4 && bestAnswer && bestAnswer.length > 100) {  // Much higher threshold + quality check
        console.log(`[TRAI] Using memory response (score: ${bestScore})`);
        return bestAnswer;
      }
    }
  } catch {}

  // 2) LLM SECOND - Use AI if memory doesn't have a strong match
  if (llm) {
    try {
      const a = await llm(q);
      if (a) return a;
    } catch (error) {
      console.error('[TRAI] LLM failed, falling back to knowledge base:', error.message);
    }
  }

  // 3) Knowledge base LAST: scan knowledge dirs / public docs as final fallback

  const files = loadFilesOnce(knowledgeDirs);
  let best = null;
  let bestScore = 0;
  files.forEach((f) => {
    const s = scoreDoc(q, f.content);
    if (s > bestScore) { bestScore = s; best = f; }
  });
  if (best && bestScore > 0) {
    const snippet = bestSnippet(q, best.content);
    return `Here\'s what I found related to your question (source: ${path.basename(best.path)}):\n\n${snippet}\n\nIf you need more, say: \"expand\".`;
  }

  // 3) Fallback note when LLM disabled and no docs match
  return 'I\'m here to help. Please rephrase or ask about setup, pricing, onboarding, or trade analysis.';
}

function pruneMemory(persistentMemory, limits = { trades: 200, conversations: 500, insights: 300 }) {
  try {
    if (persistentMemory.trades && persistentMemory.trades.length > limits.trades) {
      persistentMemory.trades = persistentMemory.trades.slice(-limits.trades);
    }
    if (persistentMemory.conversations && persistentMemory.conversations.length > limits.conversations) {
      persistentMemory.conversations = persistentMemory.conversations.slice(-limits.conversations);
    }
    if (persistentMemory.insights && persistentMemory.insights.length > limits.insights) {
      // Deduplicate simple
      const seen = new Set();
      const dedup = [];
      for (const item of persistentMemory.insights.slice(-limits.insights * 2)) {
        const key = (item && item.text) ? item.text.slice(0, 120) : JSON.stringify(item).slice(0, 120);
        if (!seen.has(key)) { seen.add(key); dedup.push(item); }
      }
      persistentMemory.insights = dedup.slice(-limits.insights);
    }
    persistentMemory.lastSave = Date.now();
  } catch {}
}

module.exports = {
  routeQuestion,
  pruneMemory
};
