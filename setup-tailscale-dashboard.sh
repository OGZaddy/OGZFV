#!/bin/bash
# ==========================================
# TAILSCALE DASHBOARD SETUP SCRIPT
# Run this with: sudo bash setup-tailscale-dashboard.sh
# ==========================================

echo "🚀 Setting up Tailscale for remote bot control..."

# Step 1: Install Tailscale
echo "📦 Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

# Step 2: Start Tailscale
echo "🔗 Starting Tailscale..."
sudo tailscale up

# Step 3: Get Tailscale IP
echo "📍 Your Tailscale IP:"
tailscale ip -4

# Step 4: Start the dashboard
echo "🎮 Starting bot dashboard on port 3333..."
cd /home/trey/OGZFV-valhalla

# Check if dashboard is already running in PM2
pm2 show bot-dashboard > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Dashboard already in PM2, restarting..."
    pm2 restart bot-dashboard
else
    echo "Adding dashboard to PM2..."
    pm2 start bot-dashboard.js --name "bot-dashboard"
fi

# Step 5: Save PM2 config
pm2 save

echo "
════════════════════════════════════════════════════════════
✅ SETUP COMPLETE!
════════════════════════════════════════════════════════════

📱 ACCESS YOUR BOT FROM ANYWHERE:

1. On your phone/laptop, install Tailscale:
   - iOS: App Store
   - Android: Google Play
   - Desktop: https://tailscale.com/download

2. Connect to your Tailscale network

3. Open browser and go to:
   http://$(tailscale ip -4):3333

🔒 Secure, private, no port forwarding needed!

💡 FEATURES:
   - Start/Stop/Restart bot
   - Live profit tracking
   - Chat with TRAI
   - View real-time logs
   - Mobile-friendly interface

════════════════════════════════════════════════════════════
"

# Optional: Show QR code for mobile access
which qrencode > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "📱 Scan this QR code on your phone:"
    echo "http://$(tailscale ip -4):3333" | qrencode -t UTF8
else
    echo "💡 TIP: Install qrencode to generate QR code for easy mobile access"
    echo "   sudo apt-get install qrencode"
fi