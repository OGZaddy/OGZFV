#!/bin/bash

# Upload MD files and code to Archon Knowledge Base
ARCHON_URL="http://149.28.242.111:8181"

echo "🚀 Uploading Knowledge to Archon..."

# Function to upload a file
upload_file() {
    local file=$1
    local category=$2
    
    echo "📤 Uploading: $file"
    
    # Create form data
    curl -X POST "$ARCHON_URL/api/knowledge/upload" \
        -F "file=@$file" \
        -F "category=$category" \
        -H "Accept: application/json"
    
    echo "✅ Done: $file"
}

# Upload all MD files
echo "📚 Uploading Documentation..."
for file in $(find /root/OGZFV-valhalla -name "*.md" -type f); do
    upload_file "$file" "documentation"
done

# Upload critical JS files
echo "💻 Uploading Core Code..."
for file in $(find /root/OGZFV-valhalla/core -name "*.js" -type f | head -20); do
    upload_file "$file" "core-code"
done

# Upload trading bot files
echo "🤖 Uploading Trading Bots..."
for file in $(find /root/OGZFV-valhalla/trading-system -name "*.js" -type f); do
    upload_file "$file" "trading-bots"
done

echo "🎉 Upload Complete! Check http://149.28.242.111:3737 to see your knowledge base!"