#!/bin/bash
cd /home/trey/OGZFV-valhalla
node tools/sweep-profiles.js \
  --base profiles/elite-btc.json \
  --grid "minTradeConfidence=-1,-0.5,0;patternConfidence=0.15,0.2,0.25;fallbackPatternConfidence=0.1,0.15;stopLossPercent=3,4,5;takeProfitPercent=8,10,12" \
  --top 10