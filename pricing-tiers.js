// ==========================================
// PRICING TIERS - Monthly & Yearly Options
// NO REFUNDS - All Sales Final
// ==========================================

const PRICING = {
  core: {
    name: 'Core',
    monthly: 97,
    yearly: 970,  // 2 months free (save $194)
    savings: '17% OFF',
    stripePriceMonthly: 'price_1Rc2dIGai7JiFhNgZWZKEVnw',
    stripePriceYearly: 'price_YEARLY_CORE', // TODO: Create in Stripe
    features: [
      '✅ 50 trades/day',
      '✅ Basic patterns',
      '✅ $5,000 limit',
      '❌ No TRAI access',
      '❌ No priority support'
    ]
  },
  
  pro: {
    name: 'Pro',
    monthly: 297,
    yearly: 2970,  // 2 months free (save $594)
    savings: '17% OFF',
    stripePriceMonthly: 'price_1Rc2egGai7JiFhNgKgTs25ey',
    stripePriceYearly: 'price_YEARLY_PRO', // TODO: Create in Stripe
    features: [
      '✅ 200 trades/day',
      '✅ Advanced patterns',
      '✅ $25,000 limit',
      '✅ TRAI AI assistant',
      '✅ Email support'
    ],
    popular: true
  },
  
  odin: {
    name: 'Odin',
    monthly: 997,
    yearly: 9970,  // 2 months free (save $1,994)
    savings: '17% OFF',
    stripePriceMonthly: 'price_1Rc2iuGai7JiFhNg1y4Gi6VJ',
    stripePriceYearly: 'price_YEARLY_ODIN', // TODO: Create in Stripe
    features: [
      '✅ 1000 trades/day',
      '✅ All patterns + ML',
      '✅ $100,000 limit',
      '✅ TRAI priority access',
      '✅ Priority support',
      '✅ Custom strategies'
    ]
  },
  
  valhalla: {
    name: 'Valhalla',
    monthly: 9997,
    yearly: 99970,  // 2 months free (save $19,994!)
    savings: '17% OFF - SAVE $19,994',
    stripePriceMonthly: 'price_1Rc2kPGai7JiFhNg80KRIgbS',
    stripePriceYearly: 'price_YEARLY_VALHALLA', // TODO: Create in Stripe
    features: [
      '✅ UNLIMITED everything',
      '✅ Quantum algorithms',
      '✅ Direct TRAI connection',
      '✅ 24/7 phone support',
      '✅ Custom features on request',
      '✅ White-label option',
      '🔥 1-on-1 onboarding call'
    ],
    exclusive: true
  }
};

// Calculate actual savings
function calculateSavings(tier) {
  const monthly = PRICING[tier].monthly;
  const yearly = PRICING[tier].yearly;
  const monthlyTotal = monthly * 12;
  const savings = monthlyTotal - yearly;
  const percent = Math.round((savings / monthlyTotal) * 100);
  
  return {
    dollarSavings: savings,
    percentSavings: percent,
    monthsFree: Math.round(savings / monthly)
  };
}

// Generate checkout buttons
function generateCheckoutButtons(tier) {
  const prices = PRICING[tier];
  
  return `
    <div class="pricing-options">
      <!-- Monthly Option -->
      <div class="price-option monthly">
        <h3>Monthly</h3>
        <div class="price">$${prices.monthly}/mo</div>
        <button onclick="checkout('${tier}', 'monthly')">
          Start Monthly
        </button>
        <small>Cancel anytime</small>
      </div>
      
      <!-- Yearly Option -->
      <div class="price-option yearly recommended">
        <div class="badge">BEST VALUE</div>
        <h3>Yearly</h3>
        <div class="price">
          $${Math.round(prices.yearly/12)}/mo
          <span class="billed-yearly">($${prices.yearly}/year)</span>
        </div>
        <div class="savings">${prices.savings}</div>
        <button onclick="checkout('${tier}', 'yearly')" class="primary">
          Save $${calculateSavings(tier).dollarSavings} - Pay Yearly
        </button>
        <small>Billed annually</small>
      </div>
    </div>
    
    <!-- NO REFUNDS Notice -->
    <div class="no-refunds-notice">
      <strong>⚠️ NO REFUNDS - ALL SALES FINAL</strong>
      <p>This is professional trading software. By purchasing, you agree that all sales are final and non-refundable.</p>
    </div>
  `;
}

// Special offers
const SPECIAL_OFFERS = {
  blackFriday: {
    active: false,
    discount: 0.5, // 50% off
    code: 'BLACKFRIDAY50',
    expires: new Date('2025-11-30')
  },
  earlyBird: {
    active: true,
    discount: 0.2, // 20% off first 100 customers
    code: 'EARLY20',
    limit: 100,
    used: 0
  },
  bundle: {
    // Buy Odin yearly, get Pro free for a friend
    active: true,
    tierRequired: 'odin',
    billingRequired: 'yearly',
    bonus: 'pro_yearly_free'
  }
};

// Validate promo code
function validatePromo(code, tier, billing) {
  for (const [name, offer] of Object.entries(SPECIAL_OFFERS)) {
    if (!offer.active) continue;
    
    if (offer.code === code) {
      if (offer.expires && new Date() > offer.expires) {
        return { valid: false, error: 'Promo code expired' };
      }
      
      if (offer.limit && offer.used >= offer.limit) {
        return { valid: false, error: 'Promo code limit reached' };
      }
      
      const price = PRICING[tier][billing];
      const discountAmount = price * offer.discount;
      const finalPrice = price - discountAmount;
      
      return {
        valid: true,
        originalPrice: price,
        discount: discountAmount,
        finalPrice: finalPrice,
        message: `${offer.discount * 100}% OFF applied!`
      };
    }
  }
  
  return { valid: false, error: 'Invalid promo code' };
}

module.exports = {
  PRICING,
  calculateSavings,
  generateCheckoutButtons,
  validatePromo,
  SPECIAL_OFFERS
};