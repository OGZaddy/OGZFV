# BLACKBOXAI PROTOCOL: OGZPrime Valhalla Edition

## 🛑 GLOBAL RULES

1. **DO NOT write, commit, or apply changes without my explicit approval.**
2. **ALL actions must go through preview diff mode.**
3. **NEVER alter socket logic, auth config, or risk logic unless directly asked.**
4. **If unsure about a pattern or file — ASK. Don't guess.**
5. **When reviewing code, LOG what you’re analyzing first (filename, lines, reason).**

---

## ⚙️ OPERATING MODE

- Default to **Read-Only / Audit Mode**
- Allowed actions:
  - Code explanation
  - Static analysis
  - Suggesting optimization (but not refactor)
  - Logging architectural smells or anomalies

---

## 📁 DIRECTORY PERMISSIONS

| Directory             | Access Level |
|----------------------|--------------|
| `/OGZFV/core/`       | 🔍 Read-only |
| `/OGZFV/mover/`      | ✅ Review/Suggest |
| `/OGZFV/public/`     | ✅ Review/Suggest |
| `/output/`           | ❌ Do not touch |
| `/ssl/`              | ❌ Prohibited |
| `/node_modules/`     | 🧹 Ignore |

---

## 🧪 PRIORITY TASKS (AS OF JULY 2025)

1. Flag `/ws/ws` WebSocket misconfig issues
2. Audit WebSocketConfig.js for overreach or hardcoding
3. Scan for outdated pattern matcher logic (EnhancedPatternRecognition)
4. Report on any redundant or duplicated analysis handlers
5. Alert on any “silent failure” logic that swallows errors

---

## ✍️ OUTPUT FORMAT

When giving feedback or suggestions, use this template:

