// ==========================================
// ACCEPT ALL PAYMENTS - Maximum conversion
// ==========================================

const PAYMENT_METHODS = {
  // Automated (instant)
  stripe: {
    name: 'Credit/Debit Card',
    icon: '💳',
    auto: true,
    includes: ['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay']
  },
  paypal: {
    name: 'PayPal',
    icon: '💰',
    auto: true,
    includes: ['PayPal Balance', 'Bank Transfer']
  },
  venmo: {
    name: 'Venmo', 
    icon: '📱',
    auto: false, // Manual for now
    username: '@YourVenmo' // ADD YOUR USERNAME
  },
  cashapp: {
    name: 'Cash App',
    icon: '💵',
    auto: false,
    cashtag: '$YourCashTag' // ADD YOUR CASHTAG
  },
  zelle: {
    name: 'Zelle',
    icon: '🏦',
    auto: false,
    email: 'your@email.com' // ADD YOUR ZELLE EMAIL
  },
  bitcoin: {
    name: 'Bitcoin',
    icon: '₿',
    auto: false,
    wallet: process.env.BTC_WALLET_ADDRESS
  },
  ethereum: {
    name: 'Ethereum',
    icon: '💎',
    auto: false,
    wallet: '0x...' // ADD ETH WALLET IF YOU HAVE ONE
  },
  skrill: {
    name: 'Skrill',
    icon: '💸',
    auto: false,
    email: 'your@skrill.com' // ADD SKRILL EMAIL
  },
  wise: {
    name: 'Wise (TransferWise)',
    icon: '🌍',
    auto: false
  },
  revolut: {
    name: 'Revolut',
    icon: '🔄',
    auto: false
  },
  applepay: {
    name: 'Apple Pay',
    icon: '🍎',
    auto: true, // Through Stripe
    via: 'stripe'
  },
  googlepay: {
    name: 'Google Pay', 
    icon: '🔷',
    auto: true, // Through Stripe
    via: 'stripe'
  },
  amazonpay: {
    name: 'Amazon Pay',
    icon: '📦',
    auto: false
  },
  klarna: {
    name: 'Klarna (Buy Now Pay Later)',
    icon: '🛍️',
    auto: true, // Through Stripe
    via: 'stripe'
  },
  afterpay: {
    name: 'Afterpay',
    icon: '⏰',
    auto: true, // Through Stripe
    via: 'stripe'
  }
};

// Manual payment instructions generator
function generateManualInstructions(method, amount, tier, orderId) {
  const instructions = {
    venmo: `
      1. Open Venmo app
      2. Send $${amount} to ${PAYMENT_METHODS.venmo.username}
      3. Add note: "OGZ-${tier}-${orderId}"
      4. Screenshot the payment
      5. Email to: payments@ogzprime.com
    `,
    cashapp: `
      1. Open Cash App
      2. Send $${amount} to ${PAYMENT_METHODS.cashapp.cashtag}
      3. Add note: "OGZ-${tier}-${orderId}"
      4. Screenshot the payment
      5. Email to: payments@ogzprime.com
    `,
    zelle: `
      1. Open your banking app
      2. Go to Zelle
      3. Send $${amount} to ${PAYMENT_METHODS.zelle.email}
      4. Add memo: "OGZ-${tier}-${orderId}"
      5. Screenshot confirmation
      6. Email to: payments@ogzprime.com
    `,
    bitcoin: `
      1. Send ${(amount/40000).toFixed(8)} BTC to:
      ${PAYMENT_METHODS.bitcoin.wallet}
      2. Include order ID in memo: ${orderId}
      3. Email TX hash to: payments@ogzprime.com
    `,
    skrill: `
      1. Log into Skrill
      2. Send $${amount} to ${PAYMENT_METHODS.skrill.email}
      3. Reference: "OGZ-${tier}-${orderId}"
      4. Email confirmation to: payments@ogzprime.com
    `
  };
  
  return instructions[method] || 'Contact support for payment instructions';
}

// Database to track manual payments
const manualPayments = new Map();

// Create manual payment order
function createManualPayment(method, tier, email, amount) {
  const orderId = `${method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const payment = {
    orderId,
    method,
    tier,
    email,
    amount,
    status: 'pending',
    instructions: generateManualInstructions(method, amount, tier, orderId),
    created: new Date(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };
  
  manualPayments.set(orderId, payment);
  
  // Send email with instructions (TODO: implement email service)
  console.log(`📧 Manual payment created: ${orderId}`);
  
  return payment;
}

// Admin panel to verify manual payments
function verifyManualPayment(orderId) {
  const payment = manualPayments.get(orderId);
  if (!payment) return false;
  
  payment.status = 'verified';
  payment.verifiedAt = new Date();
  
  // TODO: Upgrade customer tier in database
  console.log(`✅ Payment verified: ${orderId} - Upgrading to ${payment.tier}`);
  
  return true;
}

module.exports = {
  PAYMENT_METHODS,
  createManualPayment,
  verifyManualPayment,
  generateManualInstructions
};