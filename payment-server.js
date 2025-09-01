// ==========================================
// OGZ PRIME PAYMENT SERVER
// Stripe + PayPal + BTC Cold Wallet Integration
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const path = require('path');
const { applySecurity } = require('./security-hardening');

const app = express();

// Apply comprehensive security hardening first
applySecurity(app);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Additional static file serving
app.use(express.static('public'));
app.use(express.static('.'));

// PayPal Configuration
paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Pricing Configuration
const TIERS = {
    valkyrie: {
        name: 'OGZ Valkyrie',
        price: 99.99,
        setup_fee: 0,
        stripe_price_id: 'price_1S25UkGz7Oz8Ru88oIXd6dnC',
        description: 'Essential AI trading for crypto beginners'
    },
    thor: {
        name: 'OGZ Thor',
        price: 499.99,
        setup_fee: 99.00,
        stripe_price_id: 'price_1S25XwGz7Oz8Ru88Zxi2GmHG',
        description: 'Advanced indicators and multi-timeframe analysis'
    },
    odin: {
        name: 'OGZ Odin',
        price: 1499.99,
        setup_fee: 299.00,
        stripe_price_id: 'price_1S25ZDGz7Oz8Ru88J6eeYHqx',
        description: 'AI logic engine with quantum-enhanced algorithms'
    },
    valhalla: {
        name: 'OGZ Valhalla',
        price: 4999.99,
        setup_fee: 0,
        stripe_price_id: 'price_1S26mkGz7Oz8Ru88ZZkcIGTu',
        description: 'Ultimate monthly access with all features'
    }
};

// BTC Cold Wallet Configuration
const BTC_WALLET_ADDRESS = process.env.BTC_WALLET_ADDRESS || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

// ==========================================
// STRIPE PAYMENT ROUTES
// ==========================================

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { tier, payment_method = 'stripe' } = req.body;
        
        if (!TIERS[tier]) {
            return res.status(400).json({ error: 'Invalid tier specified' });
        }

        const tierData = TIERS[tier];
        const totalAmount = tierData.price + tierData.setup_fee;

        if (payment_method === 'stripe') {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: tierData.name,
                                description: tierData.description,
                                images: ['https://ogzprime.com/assets/ogz-logo.png']
                            },
                            unit_amount: Math.round(totalAmount * 100)
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
                cancel_url: `${req.headers.origin}/pricing.html?canceled=true`,
                metadata: {
                    tier: tier,
                    customer_tier: tier,
                    setup_fee: tierData.setup_fee.toString()
                }
            });

            res.json({ sessionId: session.id, url: session.url });
        } else {
            res.status(400).json({ error: 'Invalid payment method' });
        }
        
    } catch (error) {
        console.error('Stripe session creation error:', error);
        res.status(500).json({ error: 'Payment processing error: ' + error.message });
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

app.get('/paypal-success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const tier = req.query.tier;

    if (!TIERS[tier]) {
        return res.redirect('/pricing.html?error=invalid_tier');
    }

    const tierData = TIERS[tier];
    const totalAmount = (tierData.price + tierData.setup_fee).toFixed(2);

    const execute_payment_json = {
        payer_id: payerId,
        transactions: [{
            amount: {
                currency: 'USD',
                total: totalAmount
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.error('PayPal execution error:', error);
            res.redirect('/pricing.html?error=payment_failed');
        } else {
            console.log('PayPal payment successful:', payment);
            res.redirect(`/success?payment_method=paypal&tier=${tier}&payment_id=${paymentId}`);
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

    // For BTC payments, we'll use a simple payment instruction
    // In production, you'd integrate with a BTC payment processor
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

// ==========================================
// SUCCESS AND WEBHOOK ROUTES
// ==========================================

app.get('/success', (req, res) => {
    const tier = req.query.tier;
    const sessionId = req.query.session_id;
    const paymentMethod = req.query.payment_method || 'stripe';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Successful - OGZ Prime</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #0a0a0a, #1a0a0a); 
                    color: white; 
                    text-align: center; 
                    padding: 50px; 
                }
                .success-card { 
                    background: #111; 
                    border: 2px solid #22c55e; 
                    border-radius: 20px; 
                    padding: 40px; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
                }
                h1 { color: #22c55e; font-size: 2.5rem; margin-bottom: 20px; }
                .tier { color: #ffd700; font-size: 1.8rem; margin: 20px 0; }
                .next-steps { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .dashboard-btn {
                    background: linear-gradient(45deg, #dc2626, #ff3333);
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="success-card">
                <h1>🎉 Payment Successful!</h1>
                <div class="tier">OGZ Prime ${tier.toUpperCase()} Activated</div>
                <p>Welcome to the future of AI trading. Your account has been activated and you now have access to all ${tier} tier features.</p>
                
                <div class="next-steps">
                    <h3>🚀 Next Steps:</h3>
                    <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
                        <li>Check your email for login credentials</li>
                        <li>Join our Discord community</li>
                        <li>Access the live trading dashboard</li>
                        <li>Start with demo mode to learn the system</li>
                    </ol>
                </div>

                <a href="/public/ultdash.html" class="dashboard-btn">
                    🎯 Access Trading Dashboard
                </a>
                
                <p style="margin-top: 30px; color: #888; font-size: 0.9rem;">
                    Session: ${sessionId || 'N/A'} | Method: ${paymentMethod} | Tier: ${tier}
                </p>
            </div>
        </body>
        </html>
    `);
});

// Stripe webhook for payment verification
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Payment completed:', session.metadata);
            
            // Here you would:
            // 1. Create user account
            // 2. Send welcome email
            // 3. Activate tier permissions
            // 4. Send Discord invite
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send('Webhook Error');
    }
});

// ==========================================
// ENHANCED PRICING PAGE WITH PAYMENT OPTIONS
// ==========================================

app.get('/pricing-enhanced', (req, res) => {
    res.sendFile(path.join(__dirname, 'pricing.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        payment_methods: ['stripe', 'paypal', 'bitcoin'],
        available_tiers: Object.keys(TIERS)
    });
});

const PORT = process.env.PAYMENT_PORT || 3001;

app.listen(PORT, () => {
    console.log(`🔥 OGZ Prime Payment Server running on port ${PORT}`);
    console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`💰 PayPal: ${process.env.PAYPAL_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
    console.log(`₿  BTC Wallet: ${BTC_WALLET_ADDRESS}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;