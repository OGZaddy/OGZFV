# OGZ Prime Nginx Configuration 🚀

This is a production-ready, modular nginx configuration for the OGZ Prime Quantum Trading Bot. It handles SSL termination, WebSocket proxying, and provides enterprise-grade security for your trading infrastructure.

## Quick Start (Fix Your 403 Error!)

1. **Upload to your VPS:**
   ```bash
   # From your local machine
   scp -r nginx root@149.248.242.111:~/
   ```

2. **SSH into your VPS and deploy:**
   ```bash
   ssh root@149.248.242.111
   cd ~/nginx
   chmod +x deploy-nginx.sh
   sudo ./deploy-nginx.sh
   ```

3. **That's it!** Your 403 error should be gone.

## What This Configuration Does

- ✅ **Fixes 403 Forbidden Error** - Properly configured site root and permissions
- ✅ **SSL/HTTPS Support** - Handles SSL termination for secure connections
- ✅ **WebSocket Proxy** - Routes `wss://ogzprime.com/ws` to your Node.js app on port 3010
- ✅ **Load Balancing Ready** - Prepared for scaling to multiple backend servers
- ✅ **Security Headers** - Protects against XSS, clickjacking, and other attacks
- ✅ **Rate Limiting** - DDoS protection built-in
- ✅ **Performance Optimized** - Handles 10,000+ concurrent connections

## Directory Structure

```
nginx/
├── nginx.conf              # Main nginx configuration
├── deploy-nginx.sh         # One-click deployment script
├── sites-available/        
│   └── ogzprime.com       # Your site configuration
├── sites-enabled/          # Symlinks to active sites
├── conf.d/
│   └── upstream.conf      # Backend server pool configuration
├── snippets/
│   ├── proxy-params.conf  # Standard proxy headers
│   └── websocket.conf     # WebSocket-specific settings
├── security/
│   ├── headers.conf       # Security headers
│   └── rate-limiting.conf # Rate limit configuration
└── README.md              # This file
```

## Manual Installation (If Deploy Script Fails)

1. **Backup existing nginx config:**
   ```bash
   sudo cp -r /etc/nginx /etc/nginx.backup
   ```

2. **Copy new configuration:**
   ```bash
   sudo cp nginx.conf /etc/nginx/
   sudo cp -r sites-available /etc/nginx/
   sudo cp -r conf.d /etc/nginx/
   sudo cp -r snippets /etc/nginx/
   sudo cp -r security /etc/nginx/
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ogzprime.com /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default site
   ```

4. **Copy SSL certificates:**
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   sudo cp /path/to/your/cert.pem /etc/nginx/ssl/
   sudo cp /path/to/your/key.pem /etc/nginx/ssl/
   sudo chmod 600 /etc/nginx/ssl/key.pem
   ```

5. **Test and reload:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## SSL Certificate Options

### Option 1: Use Your Existing Certificates
The configuration expects certificates at:
- `/etc/nginx/ssl/cert.pem`
- `/etc/nginx/ssl/key.pem`

### Option 2: Use Let's Encrypt (Free SSL)
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d ogzprime.com -d www.ogzprime.com

# Auto-renewal is set up automatically
```

## Troubleshooting

### Still Getting 403 Error?
1. Check web root exists:
   ```bash
   sudo mkdir -p /var/www/ogzprime
   sudo chown -R www-data:www-data /var/www/ogzprime
   ```

2. Check nginx error log:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### WebSocket Connection Issues?
1. Ensure your Node.js app is running:
   ```bash
   ps aux | grep node
   ```

2. Check if port 3010 is listening:
   ```bash
   sudo netstat -tlpn | grep 3010
   ```

3. Test WebSocket directly:
   ```bash
   curl http://localhost:3010/api/live-status
   ```

### SSL Certificate Issues?
1. Verify certificate paths in `/etc/nginx/sites-available/ogzprime.com`
2. Check certificate validity:
   ```bash
   openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout
   ```

## Performance Tuning

The configuration is optimized for high-frequency trading with:
- 10,000 worker connections
- 7-day WebSocket timeout
- Optimized buffer sizes
- HTTP/2 enabled
- Gzip compression

For even higher performance, adjust in `nginx.conf`:
```nginx
worker_connections 20000;  # Increase connections
worker_rlimit_nofile 100000;  # Increase file descriptors
```

## Security Features

- **Rate Limiting**: 30 req/s for API, 10 req/s for WebSocket
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **SSL Configuration**: Modern ciphers, TLS 1.2+
- **Hidden Server Tokens**: Nginx version hidden

## Monitoring

Check nginx status:
```bash
sudo systemctl status nginx
```

Monitor connections:
```bash
sudo nginx -T | grep worker_connections
```

Watch access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

## Support

If you run into issues:
1. Check the error logs first
2. Ensure your Node.js app is running on port 3010
3. Verify your domain DNS points to your server IP (149.248.242.111)

Remember: This configuration assumes your Node.js quantum trading bot is running on `localhost:3010`.

## Next Steps

1. Deploy this nginx configuration
2. Ensure your Node.js app is running
3. Test WebSocket connection: `wss://ogzprime.com/ws`
4. Monitor your trading bot performance
5. Scale by adding more backend servers in `upstream.conf`

---

**Built for VICTORY! Your financial freedom awaits! 🚀**
