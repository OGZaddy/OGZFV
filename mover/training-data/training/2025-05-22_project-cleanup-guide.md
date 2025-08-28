---
title: "Project Cleanup Guide"
date: 2025-05-22
tags: [ogzprime, systems, trading]
---

# Project Cleanup Guide

**User** (2025-05-22T14:48:59.914000):
alright i put it inside the head of valhalla based on the file structure in that picture that I showed you what programs can I remove from this project to just get a lean clean and mean project also what else do we need to do or I just open up index.html in a browser and then hit f12


---

**Assistant** (2025-05-22T14:49:02.860341):
You're extremely close to a clean launch version of OGZ Prime. Here's how to **strip it down to a lean, clean, and mean setup**, and what to do from here:

---

## ✅ 1. Programs/Files You Can Remove (for a lean backtest version)

Assuming you're ONLY trying to run simulation or backtesting with GUI:

### **Remove These If Not Needed for Lite Ops**
| File/Module                 | Safe to Remove? | Reason |
|----------------------------|-----------------|--------|
| `MobileMonitor.js`         | ✅ Optional     | Mobile API, notifications, etc. |
| `prime-bootstorm.js`       | ✅ Optional     | Visual boot animation only |
| `PolygonWebSocket.js`      | ✅ Optional     | Real-time Polygon live feed (disable live mode) |
| `backtester.js`            | ✅ Optional*    | Only if you’re not doing timeline replay from JSON |
| `historical-data-loader.js`| ✅ Optional*    | Only if no training or standalone backtest server |
| `style.css`                | ✅ Optional     | Only if using full inline styles or simplified GUI |
| `ControlServer` (commented)| ✅ Already off  | Was disabled anyway in `run-trading-bot-v10.2.js` |

---

## ✅ 2. Files You MUST Keep (Core Logic)

| File | Why It's Required |
|------|-------------------|
| `OGZPrimeV10.2.js` | The main orchestrator |
| `run-trading-bot-v10.2.js` | Entry point |
| `OptimizedIndicators.js`, `EnhancedPatternRecognition.js` | Analysis brain + memory |
| `OptimizedTradingBrain.js` | Core buy/sell execution logic |
| `MaxProfitManager.js`, `RiskManager.js`, `PerformanceAnalyzer.js` | SS-tier risk, profit, performance layers |
| `WebsocketManager.js` | Required if GUI/WebSocket dashboard runs |

---

## ✅ 3. Launching the GUI Locally (Yes, just open it)

> Yes: just open `index.html` in a browser — then press `F12` to check console logs.

Make sure this **matches up to the GUI server port** (default: `3002`) being used by the bot (`guiWebSocketPort: 3002` in config)【21†source】.

---

## ✅ 4. Final Checklist Before F12 Test

- ✅ Run the bot with `node run-trading-bot-v10.2.js` (use `--simulate` flag)
- ✅ Confirm your profile is loading in the logs
- ✅ Make sure your browser is allowed to connect to `ws://localhost:3002`
- ✅ Make sure `index.html` is pointing to correct WebSocket port
- ✅ If `index.html` fails to render or you see no data: check console logs (`F12 → Console`) for WebSocket errors

---

## ⚙️ Optional: Enable Backtesting Stream

If you want to **simulate a full year of 1-minute candles**, enable this:

```bash
node backtester.js
```

Make sure your `backtester.js` file is uncommented to load:
```js
const dataServer = new HistoricalDataServer(3001);
dataServer.loadDataFromFile('./data/btc_usdt_1m_2020_2022.json');
dataServer.startServer();
dataServer.startDataFeed(10); // 10x speed
```

---

Let me know if you want a `.bat` file that launches:
- `run-trading-bot-v10.2.js`
- `backtester.js`
- opens the GUI (`index.html`)
all in one go — and I’ll drop it for you.

**This is it. Prime time. Let’s make it a clean build and capture footage.**


---

**Tool** (2025-05-22T14:49:13.090156):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.090350):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.090514):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.090680):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.090833):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091020):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091195):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091357):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091508):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091662):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091821):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.091953):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.092050):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.092207):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.092365):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.092516):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.092670):
Make sure to include `【message_idx†source】` markers to provide citations based on this file, where [message_idx] is provided at the beginning of this message


---

**Tool** (2025-05-22T14:49:13.092854):
Please remember to search the user's documents if an answer to their question is not contained in the above snippets. You cannot mclick into this file- if needed, you can use msearch to search it for additional information.


---
