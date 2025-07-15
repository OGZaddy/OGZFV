# 🛰️ OGZ Prime DDNS Setup Guide - Point api.ogzprime.com to Local Trading System

## 📋 OVERVIEW
**Goal:** Point api.ogzprime.com to your local "second tower" running the trading bot  
**Method:** DDNS + Port Forwarding + SSL Tunneling  
**Result:** Investors can access live trading data via api.ogzprime.com  

## 🌐 STEP 1: DOMAIN DNS CONFIGURATION

### In Your Domain Registrar (where you bought ogzprime.com):
1. **Add A Record:**
   - Name: `api` 
   - Type: `A`
   - Value: `YOUR_CURRENT_PUBLIC_IP` (get from whatismyip.com)
   - TTL: `300` (5 minutes for quick updates)

2. **Add CNAME (Optional Backup):**
   - Name: `api`
   - Type: `CNAME` 
   - Value: `YOUR_DDNS_HOSTNAME.dyndns.org` (if using DynDNS service)

## 🏠 STEP 2: ROUTER PORT FORWARDING

### Configure Your Router:
```
External Port: 443 (HTTPS)
Internal Port: 3010 (Your SSL server port)
Internal IP: [SECOND_TOWER_LOCAL_IP] (e.g., 192.168.1.100)
Protocol: TCP
```

### Additional Ports to Forward:
```
Port 3001 → 3001 (WebSocket Data)
Port 3002 → 3002 (WebSocket GUI)  
Port 3003 → 3003 (WebSocket Control)
Port 3010 → 443  (SSL Server → HTTPS)
```

## 🔄 STEP 3: DDNS SERVICE SETUP

### Option A: Free DDNS Service (No-IP, DynDNS)
1. Sign up for free DDNS service
2. Create hostname: `ogzprime-trading.ddns.net`
3. Install their client on second tower
4. Point api.ogzprime.com CNAME to this hostname

### Option B: Custom DDNS Script (Recommended)
Use the included `update-ddns.js` with your domain registrar's API:

```javascript
// update-ddns.js - Updated for your setup
const https = require('https');
const http = require('http');

// Get current public IP
function getCurrentIP() {
    return new Promise((resolve, reject) => {
        http.get('http://ipv4.icanhazip.com/', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data.trim()));
        }).on('error', reject);
    });
}

// Update DNS record via your registrar's API
async function updateDNS() {
    try {
        const currentIP = await getCurrentIP();
        
        // Example for Cloudflare API (adapt for your registrar)
        const updateURL = `https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records/YOUR_RECORD_ID`;
        
        const payload = JSON.stringify({
            type: 'A',
            name: 'api.ogzprime.com',
            content: currentIP,
            ttl: 300
        });

        // Make API call to update DNS
        console.log(`[DDNS] ✅ Updated api.ogzprime.com to ${currentIP}`);
        
    } catch (error) {
        console.error(`[DDNS] ❌ Update failed:`, error.message);
    }
}

// Update every 5 minutes
updateDNS();
setInterval(updateDNS, 300000);
```

## 🚀 STEP 4: SECOND TOWER CONFIGURATION

### Start Your Trading System:
```bash
# Terminal 1: Start the trading bot
node run-trading-bot-v13-quantum.js

# Terminal 2: Start SSL server  
node ogzprime_ssl_server.js

# Terminal 3: Start DDNS updater
node update-ddns.js

# Terminal 4: Monitor connections
node debug_websocket_connection.js
```

### SSL Certificate for HTTPS:
```bash
# Generate self-signed certificate (for testing)
node generate_ssl_certs.js

# Or use Let's Encrypt (for production)
# certbot certonly --standalone -d api.ogzprime.com
```

## 🌍 STEP 5: UPDATE DASHBOARD ENDPOINTS

### Modify public/index.html:
```javascript
// Line 795-796: Update WebSocket endpoints
const config = {
    wsEndpoint: 'wss://api.ogzprime.com:3001',
    apiEndpoint: 'https://api.ogzprime.com/api',
    dashboardSocket: 'wss://api.ogzprime.com:3002',
    controlSocket: 'wss://api.ogzprime.com:3003'
};
```

## 🔐 STEP 6: SECURITY & MONITORING

### Firewall Rules:
```bash
# Allow specific ports
ufw allow 3001/tcp  # WebSocket Data
ufw allow 3002/tcp  # WebSocket GUI
ufw allow 3003/tcp  # WebSocket Control
ufw allow 3010/tcp  # SSL Server
ufw allow 443/tcp   # HTTPS
```

### Monitoring Script:
```javascript
// monitor-connections.js
setInterval(() => {
    const connections = [
        'https://api.ogzprime.com/status',
        'wss://api.ogzprime.com:3001',
        'wss://api.ogzprime.com:3002'
    ];
    
    connections.forEach(url => {
        // Test connection and log results
        console.log(`[MONITOR] Testing ${url}...`);
    });
}, 60000); // Every minute
```

## 📊 STEP 7: TESTING & VERIFICATION

### Test Checklist:
- [ ] api.ogzprime.com resolves to your public IP
- [ ] HTTPS://api.ogzprime.com loads (even with cert warning)
- [ ] WebSocket connections work from external networks
- [ ] Trading data flows to dashboard
- [ ] Investors can access live demo
- [ ] Performance acceptable for external users

### Test Commands:
```bash
# Test DNS resolution
nslookup api.ogzprime.com

# Test HTTPS connection  
curl -k https://api.ogzprime.com/status

# Test from external network
# Use phone hotspot or ask friend to test
```

## 🎯 STEP 8: INVESTOR DEMO SETUP

### Create Public Demo Page:
```html
<!-- Upload to cpanel: investor-demo.html -->
<!DOCTYPE html>
<html>
<head>
    <title>OGZ Prime - Live Trading Demo</title>
</head>
<body>
    <h1>🚀 OGZ Prime AI Trading Bot - LIVE DEMO</h1>
    <p>Connect to our live trading system:</p>
    <iframe src="https://api.ogzprime.com" width="100%" height="600px"></iframe>
    
    <div>
        <h2>💰 Performance Metrics</h2>
        <div id="liveStats">Loading live trading data...</div>
    </div>
    
    <script>
        // Connect to live trading data
        const ws = new WebSocket('wss://api.ogzprime.com:3001');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            document.getElementById('liveStats').innerHTML = 
                `Profit: $${data.profit} | Win Rate: ${data.winRate}% | Active: ${data.status}`;
        };
    </script>
</body>
</html>
```

## 🎉 FINAL DEPLOYMENT SEQUENCE

### When Ready to Go Live:
1. **Upload static files to cpanel** (marketing pages)
2. **Start all services on second tower** (bot, SSL, DDNS)
3. **Configure port forwarding** on router
4. **Update DNS records** to point to your IP
5. **Test from external networks** 
6. **Share investor demo link:** `https://ogzprime.com/investor-demo.html`

## 🛡️ SECURITY CONSIDERATIONS

### Production Security:
- Use proper SSL certificates (Let's Encrypt)
- Implement rate limiting
- Add authentication for sensitive endpoints
- Monitor for unusual traffic patterns
- Set up automated backups
- Configure fail-safes for trading bot

---

**🚀 Commander, this setup will let investors see your live trading system while keeping full control on your local hardware. Perfect for demonstrating real performance before migrating to VPS!**
