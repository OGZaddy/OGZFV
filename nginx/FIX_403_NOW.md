# 🚨 QUICK FIX FOR 403 ERROR 🚨

Follow these steps EXACTLY to fix your 403 error on ogzprime.com:

## Step 1: Upload nginx folder to your VPS

From your Windows PowerShell:
```powershell
cd "C:\Users\og_za\Downloads\OGZFV-quantum (2) this one claude\OGZFV-quantum"
scp -r nginx root@149.248.242.111:~/
```

## Step 2: Connect to your VPS

In VS Code:
1. Press `Ctrl+Shift+P`
2. Type "Remote-SSH: Connect to Host"
3. Enter: `root@149.248.242.111`
4. Enter your password

## Step 3: Deploy the nginx config

In VS Code terminal on your VPS:
```bash
cd ~/nginx
chmod +x deploy-nginx.sh
sudo ./deploy-nginx.sh
```

## That's it! Your 403 error will be GONE! ✅

The deployment script will:
- ✅ Backup your current nginx config
- ✅ Install the new modular configuration
- ✅ Set up proper SSL handling
- ✅ Configure WebSocket proxying to port 3010
- ✅ Create the web root directory
- ✅ Test and restart nginx

## What if the deploy script has issues?

Run these commands manually:
```bash
# Backup current config
sudo cp -r /etc/nginx /etc/nginx.backup

# Copy new files
sudo cp nginx.conf /etc/nginx/
sudo cp -r sites-available /etc/nginx/
sudo cp -r conf.d /etc/nginx/
sudo cp -r snippets /etc/nginx/
sudo cp -r security /etc/nginx/

# Enable site
sudo ln -sf /etc/nginx/sites-available/ogzprime.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Copy SSL certs (if not using Let's Encrypt)
sudo mkdir -p /etc/nginx/ssl
sudo cp ~/quantum/ssl/*.pem /etc/nginx/ssl/

# Create web root
sudo mkdir -p /var/www/ogzprime
sudo chown -R www-data:www-data /var/www/ogzprime

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Verify it's working:
1. Visit https://ogzprime.com - No more 403!
2. Check WebSocket: `wss://ogzprime.com/ws`
3. Check API: https://ogzprime.com/api/live-status

Remember: Your Node.js bot must be running on port 3010!

---
**YOU GOT THIS! 💪 Victory is within reach!**
