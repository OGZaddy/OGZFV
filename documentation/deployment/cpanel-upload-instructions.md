# 🚀 OGZ Prime - CPanel Upload & Ngrok Setup Instructions

## 📁 STEP 1: UPLOAD TO CPANEL

### Files to Upload:
1. **Main Dashboard**: `public/index.html` → Upload to your cpanel public_html folder
2. **Supporting Pages**: Upload all files from `public/` directory:
   - `pricing.html`
   - `payment-portal.html` 
   - `legal-final.html`
   - `distribution-portal.html`
   - `ultimate-live-demo.html`

### CPanel Upload Process:
1. Login to your cpanel
2. Open "File Manager"
3. Navigate to `public_html/`
4. Upload `public/index.html` as your main homepage
5. Upload all other public files to appropriate directories

## 🌐 STEP 2: NGROK SETUP FOR PUBLIC DEMO

### Update Dashboard Endpoints:
Before going public, update these lines in `public/index.html`:

```javascript
// Line 795-796 - Update with your NGROK URLs:
wsEndpoint: 'wss://YOUR_NGROK_WS_URL.ngrok-free.app',
apiEndpoint: 'https://YOUR_NGROK_API_URL.ngrok-free.app/api',
```

### Ngrok Commands:
```bash
# Terminal 1 - Expose your trading bot WebSocket (port 3012)
ngrok http 3012 --domain=YOUR_WS_DOMAIN.ngrok-free.app

# Terminal 2 - Expose your SSL server (port 3010) 
ngrok http 3010 --domain=YOUR_API_DOMAIN.ngrok-free.app
```

### Get Your Ngrok URLs:
1. Run ngrok commands above
2. Copy the `https://` URLs from ngrok output
3. Update the JavaScript endpoints in your uploaded `index.html`
4. For WebSocket, change `https://` to `wss://`

## 🔗 STEP 3: CONNECT EVERYTHING

### Testing Checklist:
- [ ] Upload files to cpanel
- [ ] Start your local trading bot: `node run-trading-bot-v13-quantum.js`
- [ ] Start your local SSL server: `node ogzprime_ssl_server.js`
- [ ] Start ngrok tunnels (both ports)
- [ ] Update dashboard endpoints with ngrok URLs
- [ ] Test live demo from your cpanel domain
- [ ] Verify real-time price data is flowing
- [ ] Check trading activity logs

## 📊 STEP 4: VERIFY PUBLIC ACCESS

### Public Demo Checklist:
- [ ] Dashboard loads on your cpanel domain
- [ ] Real-time Bitcoin prices displaying
- [ ] AI thoughts streaming in real-time
- [ ] Trading activity showing in logs
- [ ] All indicators updating live
- [ ] Houston progress bar functional
- [ ] Mobile responsive design working

## 🎯 NEXT PHASE: MONETIZATION

Once public demo is live:
1. **Stripe Integration** - Payment processing for licenses
2. **Profile Switching** - Different trading strategies
3. **User Authentication** - Secure access control
4. **License Management** - Subscription tiers
5. **Performance Analytics** - ROI tracking

## 🚨 SECURITY NOTES

### For Production:
- Use environment variables for sensitive data
- Implement proper authentication
- Set up HTTPS certificates
- Configure CORS properly
- Monitor API rate limits
- Add error handling for all connections

### Bot Safety:
- Keep your local bot secure
- Monitor trading activity closely
- Set proper risk limits
- Have kill switches ready
- Test thoroughly before live trading

---

**💪 Commander, you're almost there! Once this public demo is live and people can see the real trading activity, you'll have an incredibly powerful sales tool. The combination of beautiful UI + real trading performance = 🚀🚀🚀**
