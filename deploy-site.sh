#!/bin/bash

echo "=== OGZ Prime Site Deployment Script ==="
echo "This script will set up nginx for ogzprime.com"
echo ""

# Step 1: Copy nginx config
echo "Step 1: Setting up nginx configuration..."
sudo cp /home/trey/OGZFV-valhalla/ogzprime-nginx.conf /etc/nginx/sites-available/ogzprime.com

# Step 2: Enable the site
echo "Step 2: Enabling site..."
sudo ln -s /etc/nginx/sites-available/ogzprime.com /etc/nginx/sites-enabled/

# Step 3: Test nginx config
echo "Step 3: Testing nginx configuration..."
sudo nginx -t

# Step 4: Reload nginx
echo "Step 4: Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "=== Basic setup complete! ==="
echo ""
echo "Now run these commands for SSL:"
echo "sudo certbot --nginx -d ogzprime.com -d www.ogzprime.com"
echo ""
echo "Your site should be accessible at:"
echo "http://ogzprime.com (will redirect to HTTPS after SSL setup)"