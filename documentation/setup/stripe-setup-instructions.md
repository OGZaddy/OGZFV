# 🔥 STRIPE SETUP - Exact Steps You Need

## 📋 WHAT TO GET FROM STRIPE:

### **STEP 1: Go to Stripe Dashboard**
1. Sign up/login at: https://dashboard.stripe.com
2. Use the **TEST MODE** toggle first (top right)

### **STEP 2: Get These 3 Keys**

#### **A) Publishable Key (Frontend)**
- Go to: Developers → API Keys
- Copy: `pk_test_...` (starts with pk_test)
- **WHERE TO PUT IT:** Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` in `/public/payment-portal.html` line 476

#### **B) Secret Key (Backend)** 
- Same page: Copy `sk_test_...` (starts with sk_test)
- **WHERE TO PUT IT:** Add to your `.env` file:
```bash
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
```

#### **C) Webhook Secret (For Payment Confirmations)**
- Go to: Developers → Webhooks
- Click "Add endpoint"
- Endpoint URL: `https://your-ngrok-url.ngrok.io/api/webhook`
- Select events: `payment_intent.succeeded`, `subscription.created`, `subscription.updated`
- Copy the webhook signing secret: `whsec_...`
- **WHERE TO PUT IT:** Add to your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### **STEP 3: Bitcoin Wallet (Optional but Recommended)**
- Get a Bitcoin receiving address from your wallet
- **WHERE TO PUT IT:** Replace `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` in `/public/payment-portal.html` line 295

---

## 🚀 QUICK SETUP CHECKLIST:

- [ ] **Stripe Account Created** (use test mode first)
- [ ] **Publishable Key** → payment-portal.html line 476
- [ ] **Secret Key** → .env file as STRIPE_SECRET_KEY  
- [ ] **Webhook Secret** → .env file as STRIPE_WEBHOOK_SECRET
- [ ] **Bitcoin Address** → payment-portal.html line 295 (optional)

---

## 🔧 YOUR UPDATED .env FILE SHOULD LOOK LIKE:

```bash
# Alpha Vantage API Configuration
ALPHA_VANTAGE_API_KEY=WWVN09HR6UXDIH5IN

# Polygon.io API Configuration (for live crypto data)
POLYGON_API_KEY=0gp6oKkWwriN0WInvwu539Ch6iJAOcLK

# Trading Bot Configuration  
TRADING_MODE=SEMI_AGGRESSIVE
STARTING_BALANCE=10000
MAX_DRAWDOWN=18
RISK_PER_TRADE=1.5

# NEW STRIPE CONFIGURATION (ADD THESE)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
JWT_SECRET=your_jwt_secret_here_for_user_auth
LICENSE_PUBLIC_KEY=your_license_public_key
LICENSE_PRIVATE_KEY=your_license_private_key
```

---

## ✅ AFTER YOU GET THE KEYS:

1. **Update the payment portal** with your publishable key
2. **Update your .env** with secret keys  
3. **Test the payment flow** with Stripe test cards
4. **Switch to LIVE MODE** when ready for real customers

**Test Card Numbers:**
- Success: `4242424242424242`
- Declined: `4000000000000002`

---

## 🎯 NO CPANEL NEEDED!

You don't need cPanel - everything runs on your local system with ngrok tunneling. Your existing PaymentProcessor.js backend is already set up perfectly!

**Next Step:** Get those 3 Stripe keys and I'll help you integrate them! 🚀
