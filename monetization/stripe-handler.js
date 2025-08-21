/**
 * STANDALONE STRIPE HANDLER
 * Runs separately from main server to handle payments
 * Won't crash or interfere with trading bots
 */

require('dotenv').config();
const express = require('express');
// IMPORTANT: Your test key is EXPIRED! Get a new one from https://dashboard.stripe.com/test/apikeys
// For now using the expired key - REPLACE THIS!
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51Rc2VnGai7JiFhNgxpk4VPgzuLwgymGkGDW4fZCDzfqjDmYCCvKxF9i3g9ebOlPQexaR9qxx7xIv7bqfpDXfkRGu00qy9cjKBS';
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Your actual Price IDs from Stripe
const PRICE_IDS = {
  core: 'price_1Rc2dIGai7JiFhNgZWZKEVnw',      // $99/month
  pro: 'price_1Rc2egGai7JiFhNgKgTs25ey',       // $499/month  
  odin: 'price_1Rc2iuGai7JiFhNg1y4Gi6VJ',      // $1,499/month
  valhalla: 'price_1Rc2kPGai7JiFhNg80KRIgbS'   // $14,999 lifetime
};
const cors = require('cors');

const app = express();
const PORT = 3011; // Different port from main server

app.use(cors());
app.use(express.json());

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`💳 Stripe handler running on port ${PORT}`);
  console.log(`   Test endpoint: http://localhost:${PORT}/health`);
  console.log(`   Checkout endpoint: http://localhost:${PORT}/create-checkout-session`);
  console.log(`   Mode: ${process.env.STRIPE_SECRET_KEY ? 'LIVE' : 'TEST'}`);
});