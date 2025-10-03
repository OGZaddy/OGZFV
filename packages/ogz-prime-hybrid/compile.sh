#!/bin/bash
echo "🔨 Compiling protected core to binary..."

# Option 1: Using pkg (creates real binary)
npx pkg binary/trading-core.js --target node18-alpine-x64 --output binary/trading-core

# Option 2: Using nexe
# npx nexe binary/trading-core.js -o binary/trading-core

# Option 3: Heavy obfuscation (if binary tools unavailable)
npx javascript-obfuscator binary/trading-core.js \
    --output binary/trading-core \
    --compact true \
    --self-defending true \
    --debug-protection true

echo "✅ Core compiled to binary"
