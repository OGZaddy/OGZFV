#!/bin/bash
# Sync all fixes from current working files to valhalla branch
# This ensures we don't have to redo all these fixes

echo "🔄 Syncing fixes to valhalla branch..."

# Core fixes that we made today
FILES_TO_SYNC=(
    "run-trading-bot-v13-simplified.js"
    "core/SingletonLock.js"
    "core/EnhancedPatternRecognition.js"
    "core/PerformanceAnalyzer.js"
    "public/final-dashboard.js"
    "bot_status.json"
)

# Backup current valhalla branch first
echo "📦 Creating backup..."
cp -r /root/OGZFV-valhalla /root/OGZFV-valhalla-backup-$(date +%Y%m%d-%H%M%S)

# Sync each file
for file in "${FILES_TO_SYNC[@]}"; do
    if [ -f "/root/OGZFV-valhalla/$file" ]; then
        echo "✅ Syncing $file"
        # If destination directory doesn't exist, create it
        dest_dir=$(dirname "/root/valhalla-branch/$file")
        mkdir -p "$dest_dir"
        cp "/root/OGZFV-valhalla/$file" "/root/valhalla-branch/$file"
    else
        echo "⚠️ File not found: $file"
    fi
done

# Also copy the main v13-stable with singleton lock
if [ -f "/root/run-trading-bot-v13-stable.js" ]; then
    echo "✅ Syncing v13-stable with singleton lock"
    cp "/root/run-trading-bot-v13-stable.js" "/root/valhalla-branch/"
fi

echo "✨ Sync complete! All fixes transferred to valhalla branch"
echo "📝 Files synced:"
echo "  - Singleton lock system"
echo "  - Pattern recognition fixes"
echo "  - Dashboard updates"
echo "  - Bot status broadcasting"
echo "  - All error fixes from today"