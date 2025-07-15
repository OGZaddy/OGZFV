# 🔗 STRIPE WEBHOOK SETUP - Visual Guide

## 📋 STEP-BY-STEP INSTRUCTIONS:

### **STEP 1: Sign Into Stripe**
1. Go to: https://dashboard.stripe.com
2. Sign in with your email/password (the account where you got your API keys)

### **STEP 2: Find "Developers" Section**
Once you're logged in, look at the **LEFT SIDEBAR**:

```
🏠 Home
📊 Payments  
🏪 Products
👥 Customers
📈 Analytics
📋 Reports
🛠️ Developers  ← THIS IS WHAT YOU'RE LOOKING FOR!
⚙️ Settings
```

**The "Developers" section is in the left sidebar menu!**

### **STEP 3: Navigate to Webhooks**
1. Click **"Developers"** in the left sidebar
2. You'll see a submenu with options:
   - API keys
   - **Webhooks** ← Click this one
   - Events
   - Logs

### **STEP 4: Add Your Webhook Endpoint**
1. Click **"Add endpoint"** button
2. **Endpoint URL:** `https://premium-wolf-sterling.ngrok-free.app/api/webhook`
3. **Select events to listen to:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed` 
   - `customer.subscription.created`
   - `customer.subscription.updated`

### **STEP 5: Get Your Webhook Secret**
1. After creating the endpoint, click on it
2. Look for **"Signing secret"** 
3. Click **"Reveal"** to show the secret
4. Copy the secret (starts with `whsec_...`)

### **STEP 6: Add Secret to Your .env File**
Replace the placeholder in your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

---

## 🎯 WHAT TO LOOK FOR:

**In Stripe Dashboard:**
- Left sidebar → "Developers" (🛠️ icon)
- Then "Webhooks" submenu
- Then "Add endpoint" button

**The webhook URL to use:**
```
https://premium-wolf-sterling.ngrok-free.app/api/webhook
```

**Events to select:**
- payment_intent.succeeded
- payment_intent.payment_failed
- customer.subscription.created  
- customer.subscription.updated

---

## 📞 IF YOU STILL CAN'T FIND IT:

1. **Make sure you're in the right Stripe account** (the one with your API keys)
2. **Look for the 🛠️ wrench/gear icon** in the left sidebar
3. **Try refreshing the page** if the sidebar isn't loading
4. **Make sure you're not in "restricted view"** - you need full access

The "Developers" section should be very visible in the left sidebar once you're logged in!
