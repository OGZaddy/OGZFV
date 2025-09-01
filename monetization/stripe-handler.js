/**
 * ENHANCED OGZ PRIME PAYMENT SYSTEM
 * Stripe + PayPal + BTC Integration
 * Runs separately from main server to handle payments
 * Won't crash or interfere with trading bots
 */

require('dotenv').config();
const express = require('express');
const paypal = require('paypal-rest-sdk');
const { applySecurity } = require('../security-hardening');
// IMPORTANT: Your test key is EXPIRED! Get a new one from https://dashboard.stripe.com/test/apikeys
// SECURITY: API key must be set in environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Updated Price IDs - Replace with new Stripe account IDs
// PayPal Configuration
paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Tier Pricing Configuration
const TIERS = {
  core: {
    name: 'OGZ Prime Core',
    price: 99.00,
    setup_fee: 0,
    stripe_price_id: 'price_1Rc2dIGai7JiFhNgZWZKEVnw',
    description: 'Essential AI trading for crypto beginners'
  },
  pro: {
    name: 'OGZ Prime Pro',
    price: 499.00,
    setup_fee: 99.00,
    stripe_price_id: 'price_1Rc2egGai7JiFhNgKgTs25ey',
    description: 'Advanced indicators and multi-timeframe analysis'
  },
  odin: {
    name: 'OGZ Prime Odin',
    price: 1499.00,
    setup_fee: 299.00,
    stripe_price_id: 'price_1Rc2iuGai7JiFhNg1y4Gi6VJ',
    description: 'AI logic engine with quantum-enhanced algorithms'
  },
  valhalla: {
    name: 'OGZ Prime Valhalla',
    price: 14999.00,
    setup_fee: 0,
    stripe_price_id: 'price_1Rc2kPGai7JiFhNg80KRIgbS',
    description: 'Ultimate lifetime access with all features'
  }
};

// BTC Cold Wallet Configuration
const BTC_WALLET_ADDRESS = process.env.BTC_WALLET_ADDRESS || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const cors = require('cors');

const app = express();
const PORT = process.env.STRIPE_PORT || 3011; // Auto-assigned port from environment

// Apply comprehensive security hardening
applySecurity(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Stripe handler running', mode: 'test' });
});

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    console.log(`💳 Creating checkout session for price: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: 'https://www.ogzprime.com/success.html',
      cancel_url: 'https://www.ogzprime.com/cancel.html',
      metadata: {
        priceId: priceId,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Session created: ${session.id}`);
    res.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('❌ Stripe error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// List prices (for testing)
app.get('/prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 10
    });
    res.json(prices.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PAYPAL PAYMENT ROUTES
// ==========================================

app.post('/create-paypal-payment', (req, res) => {
    const { tier } = req.body;
    
    if (!TIERS[tier]) {
        return res.status(400).json({ error: 'Invalid tier specified' });
    }

    const tierData = TIERS[tier];
    const totalAmount = (tierData.price + tierData.setup_fee).toFixed(2);

    const create_payment_json = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: `${req.headers.origin}/paypal-success?tier=${tier}`,
            cancel_url: `${req.headers.origin}/pricing.html?canceled=true`
        },
        transactions: [{
            item_list: {
                items: [{
                    name: tierData.name,
                    sku: tier.toUpperCase(),
                    price: totalAmount,
                    currency: 'USD',
                    quantity: 1
                }]
            },
            amount: {
                currency: 'USD',
                total: totalAmount
            },
            description: tierData.description
        }]
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            console.error('PayPal payment creation error:', error);
            res.status(500).json({ error: 'PayPal payment creation failed' });
        } else {
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
            res.json({ 
                paymentId: payment.id, 
                approvalUrl: approvalUrl.href 
            });
        }
    });
});

// ==========================================
// BTC PAYMENT ROUTES
// ==========================================

app.post('/create-btc-payment', (req, res) => {
    const { tier } = req.body;
    
    if (!TIERS[tier]) {
        return res.status(400).json({ error: 'Invalid tier specified' });
    }

    const tierData = TIERS[tier];
    const totalAmount = tierData.price + tierData.setup_fee;

    res.json({
        success: true,
        payment_method: 'bitcoin',
        tier: tier,
        amount_usd: totalAmount,
        wallet_address: BTC_WALLET_ADDRESS,
        instructions: `Send the equivalent of $${totalAmount} USD in Bitcoin to the address above. Include your email in the transaction memo or contact support@ogzprime.com with the transaction hash for manual verification.`,
        estimated_btc: 'Contact support for current BTC amount',
        support_email: 'support@ogzprime.com',
        verification_note: 'Bitcoin payments are manually verified within 24 hours'
    });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Enhanced OGZ Prime Payment System running on port ${PORT}`);
  console.log(`💳 Stripe: ${STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`💰 PayPal: ${process.env.PAYPAL_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`₿  BTC Wallet: ${BTC_WALLET_ADDRESS}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Stripe: http://localhost:${PORT}/create-checkout-session`);
  console.log(`   PayPal: http://localhost:${PORT}/create-paypal-payment`);
  console.log(`   Bitcoin: http://localhost:${PORT}/create-btc-payment`);
});