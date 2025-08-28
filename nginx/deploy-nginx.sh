#!/bin/bash
# OGZ Prime Nginx Deployment Script
# Deploy with confidence! 🚀

set -e

echo "🚀 OGZ PRIME NGINX DEPLOYMENT SCRIPT"
echo "===================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)" 
   exit 1
fi

# Function to check if nginx is installed
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        echo "❌ Nginx is not installed!"
        echo "Install with: apt-get install nginx (Debian/Ubuntu)"
        echo "          or: yum install nginx (CentOS/RHEL)"
        exit 1
    fi
}

# Function to backup existing config
backup_config() {
    if [ -d "/etc/nginx" ]; then
        backup_dir="/etc/nginx.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📦 Backing up existing nginx config to $backup_dir"
        cp -r /etc/nginx "$backup_dir"
    fi
}

# Function to copy SSL certificates
copy_ssl_certs() {
    echo "🔒 Setting up SSL certificates..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p /etc/nginx/ssl
    
    # Check if local SSL certs exist
    if [ -f "../ssl/cert.pem" ] && [ -f "../ssl/key.pem" ]; then
        echo "   Copying local SSL certificates..."
        cp ../ssl/cert.pem /etc/nginx/ssl/
        cp ../ssl/key.pem /etc/nginx/ssl/
        chmod 644 /etc/nginx/ssl/cert.pem
        chmod 600 /etc/nginx/ssl/key.pem
    else
        echo "⚠️  No local SSL certificates found!"
        echo "   You'll need to:"
        echo "   1. Copy your certificates to /etc/nginx/ssl/"
        echo "   2. Or use Let's Encrypt: certbot --nginx -d ogzprime.com"
    fi
}

# Function to deploy configuration
deploy_config() {
    echo "🚀 Deploying nginx configuration..."
    
    # Copy main nginx.conf
    cp nginx.conf /etc/nginx/nginx.conf
    
    # Copy modular configurations
    cp -r sites-available /etc/nginx/
    cp -r sites-enabled /etc/nginx/
    cp -r conf.d /etc/nginx/
    cp -r snippets /etc/nginx/
    cp -r security /etc/nginx/
    
    # Create symbolic link for site
    ln -sf /etc/nginx/sites-available/ogzprime.com /etc/nginx/sites-enabled/ogzprime.com
    
    # Remove default site if exists
    rm -f /etc/nginx/sites-enabled/default
}

# Function to create web root
create_webroot() {
    echo "📁 Creating web root directory..."
    mkdir -p /var/www/ogzprime
    
    # Create a simple index.html if none exists
    if [ ! -f "/var/www/ogzprime/index.html" ]; then
        cat > /var/www/ogzprime/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>OGZ Prime - Quantum Trading</title>
    <meta charset="utf-8">
    <style>
        body {
            background: #0a0a0a;
            color: #22c55e;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e; }
            to { text-shadow: 0 0 20px #22c55e, 0 0 30px #22c55e; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚛️ OGZ PRIME QUANTUM</h1>
        <p>Trading Bot Infrastructure Online</p>
        <p>WebSocket: wss://ogzprime.com/ws</p>
    </div>
</body>
</html>
EOF
    fi
    
    # Set proper permissions
    chown -R www-data:www-data /var/www/ogzprime
}

# Function to test configuration
test_config() {
    echo "🧪 Testing nginx configuration..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Configuration test passed!"
    else
        echo "❌ Configuration test failed!"
        exit 1
    fi
}

# Function to restart nginx
restart_nginx() {
    echo "🔄 Restarting nginx..."
    systemctl restart nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx restarted successfully!"
    else
        echo "❌ Failed to restart nginx!"
        exit 1
    fi
}

# Function to show status
show_status() {
    echo ""
    echo "📊 DEPLOYMENT STATUS"
    echo "==================="
    systemctl status nginx --no-pager | head -n 5
    echo ""
    echo "🌐 Your site should now be accessible at:"
    echo "   https://ogzprime.com"
    echo "   wss://ogzprime.com/ws (WebSocket)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Make sure your domain points to this server"
    echo "   2. Ensure your Node.js app is running on port 3010"
    echo "   3. Monitor logs: tail -f /var/log/nginx/error.log"
    echo ""
}

# Main deployment flow
echo "Starting deployment..."
echo ""

check_nginx
backup_config
copy_ssl_certs
deploy_config
create_webroot
test_config
restart_nginx
show_status

echo "🎉 DEPLOYMENT COMPLETE!"
echo "💪 FOR VICTORY! 💪"
