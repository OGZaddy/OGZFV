#!/bin/bash

echo "Starting trading parameter optimization..."

# Backup original file
cp /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js.backup

# Update minTradeConfidence from 0 to 0.55
sed -i 's/minTradeConfidence: 0/minTradeConfidence: 0.55/g' /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js

# Update patternConfidence from 0.35 to 0.65
sed -i 's/patternConfidence: 0.35/patternConfidence: 0.65/g' /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js

# Update stopLossPercent from 5 to 4
sed -i 's/stopLossPercent: 5/stopLossPercent: 4/g' /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js

# Update takeProfitPercent from 15 to 10
sed -i 's/takeProfitPercent: 15/takeProfitPercent: 10/g' /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js

# Update maxPositionSize from 0.05 to 0.02
sed -i 's/maxPositionSize: 0.05/maxPositionSize: 0.02/g' /root/OGZFV-valhalla/run-trading-bot-v13-simplified.js

echo "Parameter optimization complete!"
echo ""
echo "Updated values:"
echo "- minTradeConfidence: 0 -> 0.55"
echo "- patternConfidence: 0.35 -> 0.65"
echo "- stopLossPercent: 5 -> 4"
echo "- takeProfitPercent: 15 -> 10"
echo "- maxPositionSize: 0.05 -> 0.02"