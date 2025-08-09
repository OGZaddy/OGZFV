#!/bin/bash

# clean-nginx-setup.sh
# Clean NGINX setup for OGZ Prime public access
# VPS: 149.28.242.111

echo "====================================="
echo "   OGZ PRIME CLEAN NGINX SETUP"
echo "====================================="

# Step 1: Check current status
echo "🔍 Checking current setup..."
echo "NGINX version:"
nginx -v 2>&1 || echo "NGINX not installed"

echo -e "\nCurrent sites enabled:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory"

echo -e "\nPorts currently listening:"
netstat -tlnp | grep -E ':80|:443|:8001|:3008'

echo -e "\nNode processes:"
ps aux | grep node | grep -v grep

# Step 2: Install NGINX if needed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing NGINX..."
    apt update
    apt install -y nginx
fi

# Step 3: Backup existing config
echo "💾 Backing up existing NGINX config..."
cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No existing config to backup"

# Step 4: Clean slate
echo "🧹 Cleaning existing configs..."
rm -f /etc/nginx/sites-enabled/*

# Step 5: Create fresh OGZ Prime config
echo "⚙️ Creating fresh NGINX config..."
cat > /etc/nginx/sites-available/ogzprime << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    # Your VPS IP and domains
    server_name 149.28.242.111 ogzprime.com www.ogzprime.com _;
    
    # Dashboard location
    root /root/OGZFV-valhalla;
    index ogz-ultimate-dashboard.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main dashboard
    location / {
        try_files $uri $uri/ /ogz-ultimate-dashboard.html;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires -1;
    }
    
    # WebSocket proxy (bot on port 8001)
    location /ws {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        
        # CORS for WebSocket
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, Upgrade, Connection";
    }
    
    # API proxy (bot HTTP on port 3008)
    location /api/ {
        proxy_pass http://127.0.0.1:3008/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "OGZ Prime - Healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }
    
    # Logging
    access_log /var/log/nginx/ogzprime_access.log;
    error_log /var/log/nginx/ogzprime_error.log;
}
EOF

# Step 6: Enable the site
echo "🔗 Enabling OGZ Prime site..."
ln -sf /etc/nginx/sites-available/ogzprime /etc/nginx/sites-enabled/ogzprime

# Step 7: Fix permissions
echo "🔐 Setting proper permissions..."
chmod 755 /root
chmod -R 755 /root/OGZFV-valhalla
chown -R www-data:www-data /var/log/nginx/

# Step 8: Test and reload NGINX
echo "🧪 Testing NGINX configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX config is valid - reloading..."
    systemctl reload nginx
    systemctl enable nginx
    echo "✅ NGINX reloaded successfully"
else
    echo "❌ NGINX configuration error - check the config"
    exit 1
fi

# Step 9: Configure firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8001/tcp
    ufw allow 3008/tcp
    echo "✅ Firewall rules added"
fi

# Step 10: Test the setup
echo -e "\n🧪 Testing the setup..."
sleep 2

# Test HTTP
echo "Testing HTTP access..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP server responding"
else
    echo "❌ HTTP server not responding (status: $HTTP_STATUS)"
fi

# Test dashboard
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Dashboard accessible"
else
    echo "⚠️ Dashboard may not be accessible (status: $DASHBOARD_STATUS)"
fi

# Step 11: Display results
echo ""
echo "====================================="
echo "   🎉 NGINX SETUP COMPLETE!"
echo "====================================="
echo ""
echo "📊 Your dashboard should be accessible at:"
echo "   http://149.28.242.111"
echo "   http://ogzprime.com (if DNS is set up)"
echo ""
echo "🔧 WebSocket endpoint:"
echo "   ws://149.28.242.111/ws"
echo ""
echo "📡 API endpoint:"
echo "   http://149.28.242.111/api/"
echo ""
echo "🔍 Useful commands:"
echo "   systemctl status nginx    - Check NGINX status"
echo "   nginx -t                  - Test config"
echo "   tail -f /var/log/nginx/ogzprime_error.log - View errors"
echo "   curl http://149.28.242.111/health - Test health"
echo ""
echo "⚠️ NEXT STEPS:"
echo "1. Make sure your bot is running and listening on 0.0.0.0:8001"
echo "2. Update dashboard WebSocket URL if needed"
echo "3. Test from external browser"
echo ""
echo "====================================="
