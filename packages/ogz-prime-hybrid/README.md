# OGZPrime Hybrid Protection System

## 🔐 Architecture

```
┌─────────────────────────┐
│   PROTECTED BINARY      │ ← Trading algorithms (hidden)
│   • Secret weights      │ ← OPTIMIZECEPTION discoveries
│   • Pattern detection   │ ← Proprietary logic
│   • Signal calculation  │ ← Never exposed
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   USER CONFIG (Docker)  │ ← Editable settings
│   • Thresholds         │ ← Adjust confidence
│   • Aggression         │ ← Conservative/Aggressive
│   • Risk settings      │ ← Stop loss/Take profit
│   • Trading profiles   │ ← Multiple strategies
└─────────────────────────┘
```

## ✏️ What You Can Edit

Edit `config/user-config.js` to adjust:
- Trading thresholds (0-1)
- Aggression level (0.5-2.0)
- Risk parameters
- Trading profiles
- Time filters

## 🔒 What's Protected

The binary contains:
- OPTIMIZECEPTION weights
- Pattern recognition algorithms
- Signal calculation formulas
- Proprietary trading logic

## 🚀 Quick Start

1. Set license key:
   ```bash
   export LICENSE_KEY=your-key-here
   ```

2. Run Docker container:
   ```bash
   docker-compose up -d
   ```

3. Open dashboard:
   ```
   http://localhost:3008
   ```

## 📊 Current Settings

Using OPTIMIZECEPTION discovered configuration:
- Risk/Reward: 1:96
- Stop Loss: 0.5%
- Take Profit: 48%
- Win Rate Target: 70%

## ⚠️ Security Notice

- Do NOT attempt to reverse engineer the binary
- Do NOT share your license key
- Do NOT redistribute this software

© 2025 OGZPrime - Hybrid Protection System
