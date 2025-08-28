# OGZ Prime Quantum Trading Bot - Site Configuration
# HTTPS + WebSocket proxy for quantum trading operations

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ogzprime.com www.ogzprime.com;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other requests to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ogzprime.com www.ogzprime.com;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    include /etc/nginx/security/headers.conf;
    
    # Rate limiting
    include /etc/nginx/security/rate-limiting.conf;
    
    # Root directory - CHANGE THIS to your actual web root if needed
    root /var/www/ogzprime;
    index index.html;
    
    # Main location block
    location / {
        # First try to serve request as file, then as directory, then proxy to app
        try_files $uri $uri/ @proxy;
    }
    
    # Proxy to Node.js app
    location @proxy {
        include /etc/nginx/snippets/proxy-params.conf;
        proxy_pass http://quantum_backend;
    }
    
    # API endpoints
    location /api {
        include /etc/nginx/snippets/proxy-params.conf;
        proxy_pass http://quantum_backend;
        
        # API rate limiting
        limit_req zone=api_limit burst=50 nodelay;
    }
    
    # WebSocket endpoint - CRITICAL FOR TRADING BOT
    location /ws {
        include /etc/nginx/snippets/websocket.conf;
        proxy_pass http://quantum_backend;
        
        # WebSocket specific settings
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 7d;  # 7 days for long-lived connections
        proxy_send_timeout 7d;
        proxy_connect_timeout 75s;
        
        # Disable buffering for real-time data
        proxy_buffering off;
        
        # WebSocket rate limiting
        limit_req zone=ws_limit burst=20 nodelay;
        limit_conn conn_limit 100;
    }
    
    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|txt)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Error pages
    error_page 403 /403.html;
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /403.html {
        root /usr/share/nginx/html;
        internal;
    }
    
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}

# Include additional server blocks if needed
include /etc/nginx/sites-available/*.conf;
