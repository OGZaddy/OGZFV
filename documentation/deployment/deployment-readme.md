# OGZ Prime Vultr Ubuntu Deployment Guide

## 🚀 DEPLOYMENT STEPS:

### 1. UPLOAD FILES TO VULTR SERVER:
```bash
# From your local machine, upload files:
scp -r ogz-ultimate-dashboard.html deployment/vultr-deploy.sh root@YOUR_VULTR_IP:/root/
scp -r ui/ public/ root@YOUR_VULTR_IP:/root/ 2>/dev/null || echo "Optional folders"
```

### 2. SSH INTO VULTR SERVER:
```bash
ssh root@YOUR_VULTR_IP
```

### 3. RUN DEPLOYMENT SCRIPT:
```bash
chmod +x vultr-deploy.sh
./vultr-deploy.sh
```

### 4. ACCESS YOUR DASHBOARD:
```
http://YOUR_VULTR_IP
```

## 🔐 SECURITY FEATURES ENABLED:

✅ **Firewall (UFW)** - Only SSH, HTTP, HTTPS allowed  
✅ **Fail2Ban** - Auto-ban suspicious SSH attempts  
✅ **Nginx Security Headers** - XSS protection, frame options  
✅ **Rate Limiting** - Max 10 requests/minute per IP  
✅ **File Access Protection** - .conf, .log files blocked  

## ⚠️ IMPORTANT NOTES:

1. **API Keys**: Dashboard will prompt for your 4 memory-stored keys
2. **Bot Connection**: Update WebSocket endpoint to your Tower 2 IP
3. **Domain**: Point your domain to Vultr IP for professional access
4. **SSL**: Run `sudo certbot --nginx -d yourdomain.com` for HTTPS

## 🛡️ YOUR SECURITY SETUP:

```
[Trading Bot Tower 2] --VPN--> [Main Computer] --SSH--> [Vultr Server] --Internet--> [Public Dashboard]
```

**ASSETS SWITCHING STATUS:**
- Bitcoin: ✅ Working (from your bot)
- ETH/SOL/ADA: ⚠️ Needs Polygon API or alternative data source

## 🔧 NEXT STEPS:

1. Deploy dashboard to Vultr
2. Test public access  
3. Fix multi-asset switching (requires your Polygon key input)
4. Add domain + SSL certificate
