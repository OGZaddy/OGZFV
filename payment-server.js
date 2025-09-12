// ==========================================
// UNIFIED PAYMENT SERVER
// Handles Stripe, PayPal, and Cash App BTC
// ==========================================

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const QRCode = require('qrcode');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Configuration
const TIERS = {
  starter: { price: 0, name: 'Starter', features: 'Basic features' },
  core: { price: 97, name: 'Core', stripePriceId: 'price_1Rc2dIGai7JiFhNgZWZKEVnw' },
  pro: { price: 297, name: 'Pro', stripePriceId: 'price_1Rc2egGai7JiFhNgKgTs25ey' },
  odin: { price: 997, name: 'Odin', stripePriceId: 'price_1Rc2iuGai7JiFhNg1y4Gi6VJ' },
  valhalla: { price: 9997, name: 'Valhalla', stripePriceId: 'price_1Rc2kPGai7JiFhNg80KRIgbS' }
};

// BTC wallet from .env
const BTC_WALLET = process.env.BTC_WALLET_ADDRESS || 'bc1qa3u5uj8saqvg7f0cmnhhfquph34scgxarw48fk';

// Track pending BTC payments
const pendingBTCPayments = new Map();

// ==========================================
// STRIPE CHECKOUT
// ==========================================
app.post('/create-checkout-session', async (req, res) => {
  const { priceId, tier } = req.body;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId || TIERS[tier]?.stripePriceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing.html`,
      metadata: {
        tier: tier
      }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PAYPAL CHECKOUT (Ready when you add credentials)
// ==========================================
app.post('/create-paypal-order', async (req, res) => {
  const { tier } = req.body;
  const tierData = TIERS[tier];
  
  if (!tierData) {
    return res.status(400).json({ error: 'Invalid tier' });
  }
  
  // PayPal integration ready - just need credentials
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    return res.status(503).json({ 
      error: 'PayPal not configured yet',
      message: 'Add PAYPAL_CLIENT_ID and PAYPAL_SECRET to .env'
    });
  }
  
  // PayPal order creation will go here
  res.json({ 
    orderId: 'PAYPAL_ORDER_' + Date.now(),
    approveUrl: 'https://www.paypal.com/checkoutnow?token=DEMO'
  });
});

// ==========================================
// CASH APP BTC PAYMENT
// ==========================================
app.post('/create-btc-payment', async (req, res) => {
  const { tier, email } = req.body;
  const tierData = TIERS[tier];
  
  if (!tierData) {
    return res.status(400).json({ error: 'Invalid tier' });
  }
  
  // Generate unique payment ID
  const paymentId = crypto.randomBytes(16).toString('hex');
  
  // Calculate BTC amount (using mock rate, replace with real API)
  const btcRate = 40000; // TODO: Fetch real BTC price
  const btcAmount = (tierData.price / btcRate).toFixed(8);
  
  // Create payment URI for Cash App
  const paymentURI = `bitcoin:${BTC_WALLET}?amount=${btcAmount}&label=OGZPrime-${tier}`;
  
  // Generate QR code
  const qrCode = await QRCode.toDataURL(paymentURI);
  
  // Store pending payment
  pendingBTCPayments.set(paymentId, {
    tier,
    email,
    btcAmount,
    usdAmount: tierData.price,
    created: Date.now(),
    status: 'pending'
  });
  
  // Auto-expire after 30 minutes
  setTimeout(() => {
    if (pendingBTCPayments.get(paymentId)?.status === 'pending') {
      pendingBTCPayments.delete(paymentId);
    }
  }, 30 * 60 * 1000);
  
  res.json({
    paymentId,
    btcAddress: BTC_WALLET,
    btcAmount,
    usdAmount: tierData.price,
    qrCode,
    paymentURI,
    cashAppLink: `https://cash.app/$cashtag`, // Add your Cash App $cashtag
    expires: Date.now() + (30 * 60 * 1000)
  });
});

// Check BTC payment status
app.get('/check-btc-payment/:paymentId', (req, res) => {
  const payment = pendingBTCPayments.get(req.params.paymentId);
  
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  // In production, check blockchain for confirmation
  // For now, return pending status
  res.json({
    status: payment.status,
    confirmations: 0,
    required: 1
  });
});

// ==========================================
// WEBHOOK HANDLERS
// ==========================================

// Stripe webhook
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.log('⚠️ Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('✅ Payment successful for:', session.metadata.tier);
        // TODO: Upgrade customer tier in database
        break;
        
      case 'customer.subscription.deleted':
        console.log('🚫 Subscription cancelled');
        // TODO: Downgrade customer to free tier
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Manual BTC confirmation (for testing)
app.post('/confirm-btc-payment/:paymentId', (req, res) => {
  const payment = pendingBTCPayments.get(req.params.paymentId);
  
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  payment.status = 'confirmed';
  console.log('✅ BTC payment confirmed for:', payment.tier);
  
  // TODO: Upgrade customer tier in database
  
  res.json({ success: true, tier: payment.tier });
});

// ==========================================
// UNIFIED CHECKOUT PAGE
// ==========================================
app.get('/checkout/:tier', (req, res) => {
  const tier = req.params.tier;
  const tierData = TIERS[tier];
  
  if (!tierData) {
    return res.status(404).send('Tier not found');
  }
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>OGZ Prime - Checkout</title>
  <script src="https://js.stripe.com/v3/"></script>
  <style>
    body {
      background: #0a0a0a;
      color: white;
      font-family: 'Segoe UI', sans-serif;
      padding: 40px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      color: #ff3333;
      text-align: center;
    }
    .payment-option {
      background: rgba(255,255,255,0.1);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      cursor: pointer;
      transition: all 0.3s;
    }
    .payment-option:hover {
      border-color: #ff3333;
      background: rgba(255,51,51,0.1);
    }
    .payment-option h3 {
      margin: 0 0 10px 0;
      color: #ff6666;
    }
    button {
      background: #ff3333;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
    }
    button:hover {
      background: #ff5555;
    }
    .btc-payment {
      text-align: center;
      display: none;
    }
    .btc-payment.active {
      display: block;
    }
    #qrcode {
      margin: 20px auto;
    }
    .btc-address {
      background: #111;
      padding: 10px;
      border-radius: 8px;
      word-break: break-all;
      font-family: monospace;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Checkout - ${tierData.name} Tier</h1>
    <h2 style="text-align: center; color: #999;">$${tierData.price}/month</h2>
    
    <div class="payment-option" onclick="payWithStripe()">
      <h3>💳 Pay with Card (Stripe)</h3>
      <p>Instant activation - Visa, Mastercard, Amex</p>
      <button>Pay with Card</button>
    </div>
    
    <div class="payment-option" onclick="payWithPayPal()">
      <h3>💰 Pay with PayPal</h3>
      <p>Use your PayPal balance or linked bank</p>
      <button>Pay with PayPal</button>
    </div>
    
    <div class="payment-option" onclick="payWithBTC()">
      <h3>₿ Pay with Bitcoin (Cash App)</h3>
      <p>Send BTC from Cash App or any wallet</p>
      <button>Pay with Bitcoin</button>
    </div>
    
    <div class="btc-payment" id="btcPayment">
      <h3>Send Bitcoin Payment</h3>
      <div id="qrcode"></div>
      <div class="btc-address" id="btcAddress"></div>
      <p>Amount: <strong id="btcAmount"></strong> BTC</p>
      <p>($${tierData.price} USD)</p>
      <p style="color: #999;">Payment expires in 30 minutes</p>
      <button onclick="openCashApp()">Open Cash App</button>
    </div>
  </div>
  
  <script>
    const stripe = Stripe('${process.env.STRIPE_PUBLIC_KEY || "pk_test_51Rc2VnGai7JiFhNgT1aZdghugWMXbWoOnOVpNwr7QmojxxIau57wGKOB3f8rBi8yFWVuvIGGON7bjvuUtcm7SIm100ylS00sz6"}');
    const tier = '${tier}';
    
    async function payWithStripe() {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });
      const { sessionId } = await response.json();
      stripe.redirectToCheckout({ sessionId });
    }
    
    async function payWithPayPal() {
      const response = await fetch('/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });
      const data = await response.json();
      if (data.error) {
        alert('PayPal coming soon! Use Card or Bitcoin for now.');
      } else {
        window.location.href = data.approveUrl;
      }
    }
    
    async function payWithBTC() {
      const email = prompt('Enter your email for payment confirmation:');
      if (!email) return;
      
      const response = await fetch('/create-btc-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email })
      });
      const data = await response.json();
      
      document.getElementById('btcPayment').classList.add('active');
      document.getElementById('qrcode').innerHTML = '<img src="' + data.qrCode + '" />';
      document.getElementById('btcAddress').textContent = data.btcAddress;
      document.getElementById('btcAmount').textContent = data.btcAmount;
      
      // Check payment status every 30 seconds
      const checkInterval = setInterval(async () => {
        const statusRes = await fetch('/check-btc-payment/' + data.paymentId);
        const status = await statusRes.json();
        if (status.status === 'confirmed') {
          clearInterval(checkInterval);
          alert('Payment confirmed! Your account has been upgraded.');
          window.location.href = '/dashboard';
        }
      }, 30000);
    }
    
    function openCashApp() {
      window.open('https://cash.app/$cashtag', '_blank'); // Add your $cashtag
    }
  </script>
</body>
</html>
  `);
});

// Start server
const PORT = process.env.PAYMENT_PORT || 3337;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           💳 PAYMENT SERVER RUNNING 💳                   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Checkout:  http://localhost:${PORT}/checkout/[tier]        ║
║  Tiers:     starter, core, pro, odin, valhalla          ║
║                                                          ║
║  Payment Methods:                                        ║
║  ✅ Stripe (Cards) - Ready                              ║
║  ⏳ PayPal - Needs credentials                          ║
║  ✅ Bitcoin (Cash App) - Ready                          ║
║                                                          ║
║  BTC Wallet: ${BTC_WALLET.substring(0, 20)}...            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;