// 🛰️ update-ddns.js - OGZPrime Dynamic DNS heartbeat updater
// Updates api.ogzprime.com to point directly to your local trading system

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration - Update these values for your setup
const CONFIG = {
  domain: 'api.ogzprime.com',
  registrar: 'cloudflare', // Options: 'cloudflare', 'namecheap', 'godaddy', 'manual'
  updateInterval: 300000, // 5 minutes
  
  // Cloudflare API (if using Cloudflare)
  cloudflare: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN || 'YOUR_CLOUDFLARE_API_TOKEN',
    zoneId: process.env.CLOUDFLARE_ZONE_ID || 'YOUR_ZONE_ID',
    recordId: process.env.CLOUDFLARE_RECORD_ID || 'YOUR_RECORD_ID'
  },
  
  // Manual webhook URL (if using custom endpoint)
  webhookUrl: process.env.DDNS_WEBHOOK_URL || 'https://yourdomain.com/update-dns.php'
};

// Get current public IP address
function getCurrentIP() {
  return new Promise((resolve, reject) => {
    const services = [
      'http://ipv4.icanhazip.com/',
      'http://checkip.amazonaws.com/',
      'http://whatismyip.akamai.com/',
      'http://ipinfo.io/ip'
    ];
    
    let attempts = 0;
    
    function tryService() {
      if (attempts >= services.length) {
        reject(new Error('All IP services failed'));
        return;
      }
      
      const service = services[attempts];
      attempts++;
      
      http.get(service, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const ip = data.trim();
          if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
            resolve(ip);
          } else {
            tryService();
          }
        });
      }).on('error', () => {
        tryService();
      });
    }
    
    tryService();
  });
}

// Save last known IP to avoid unnecessary updates
let lastKnownIP = '';
try {
  if (fs.existsSync('last-ip.txt')) {
    lastKnownIP = fs.readFileSync('last-ip.txt', 'utf8').trim();
  }
} catch (err) {
  console.log('[DDNS] No previous IP record found');
}

// Update DNS via Cloudflare API
async function updateCloudflare(ip) {
  const options = {
    hostname: 'api.cloudflare.com',
    port: 443,
    path: `/client/v4/zones/${CONFIG.cloudflare.zoneId}/dns_records/${CONFIG.cloudflare.recordId}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CONFIG.cloudflare.apiToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  const payload = JSON.stringify({
    type: 'A',
    name: CONFIG.domain,
    content: ip,
    ttl: 300
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(`Cloudflare API error: ${JSON.stringify(response.errors)}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Update DNS via webhook/manual endpoint
async function updateWebhook(ip) {
  const url = `${CONFIG.webhookUrl}?domain=${CONFIG.domain}&ip=${ip}&key=${process.env.DDNS_API_KEY || 'YOUR_API_KEY'}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({ success: true });
      } else {
        reject(new Error(`Webhook returned status ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Main DNS update function
async function updateDNS() {
  try {
    const currentIP = await getCurrentIP();
    
    // Skip update if IP hasn't changed
    if (currentIP === lastKnownIP) {
      console.log(`[DDNS] 💓 IP unchanged (${currentIP}) @ ${new Date().toISOString()}`);
      return;
    }
    
    console.log(`[DDNS] 🔄 IP changed from ${lastKnownIP} to ${currentIP} - updating DNS...`);
    
    // Update DNS based on configured method
    let result;
    switch (CONFIG.registrar) {
      case 'cloudflare':
        result = await updateCloudflare(currentIP);
        break;
      case 'manual':
      default:
        result = await updateWebhook(currentIP);
        break;
    }
    
    // Save new IP and log success
    fs.writeFileSync('last-ip.txt', currentIP);
    lastKnownIP = currentIP;
    
    console.log(`[DDNS] ✅ ${CONFIG.domain} updated to ${currentIP} @ ${new Date().toISOString()}`);
    
    // Test the update
    setTimeout(() => testDNSResolution(), 10000); // Wait 10 seconds then test
    
  } catch (error) {
    console.error(`[DDNS] ❌ Update failed: ${error.message} @ ${new Date().toISOString()}`);
  }
}

// Test DNS resolution
function testDNSResolution() {
  const dns = require('dns');
  dns.lookup(CONFIG.domain, (err, address) => {
    if (err) {
      console.error(`[DDNS] 🚨 DNS lookup failed: ${err.message}`);
    } else {
      console.log(`[DDNS] 🎯 DNS test: ${CONFIG.domain} resolves to ${address}`);
    }
  });
}

// Health check - test connection to local services
function healthCheck() {
  const testPorts = [3001, 3002, 3003, 3010];
  
  testPorts.forEach(port => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(5000);
    socket.connect(port, 'localhost', () => {
      console.log(`[HEALTH] ✅ Port ${port} is active`);
      socket.destroy();
    });
    
    socket.on('error', () => {
      console.log(`[HEALTH] ❌ Port ${port} is not responding`);
    });
    
    socket.on('timeout', () => {
      console.log(`[HEALTH] ⏰ Port ${port} timeout`);
      socket.destroy();
    });
  });
}

// Startup
console.log(`🛰️ OGZ Prime DDNS updater started for ${CONFIG.domain}`);
console.log(`[DDNS] Using registrar: ${CONFIG.registrar}`);
console.log(`[DDNS] Update interval: ${CONFIG.updateInterval / 1000} seconds`);

// Initial update
updateDNS();

// Health check every minute
setInterval(healthCheck, 60000);

// DNS update based on configured interval
setInterval(updateDNS, CONFIG.updateInterval);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[DDNS] 👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[DDNS] 👋 Shutting down gracefully...');
  process.exit(0);
});
