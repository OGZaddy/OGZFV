// ==========================================
// SUBSCRIPTION & RENEWAL MANAGER
// Handles recurring payments and tier management
// ==========================================

const cron = require('node-cron');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class SubscriptionManager {
  constructor(db) {
    this.db = db;
    this.setupCronJobs();
  }

  // ==========================================
  // SUBSCRIPTION LIFECYCLE
  // ==========================================
  
  async createSubscription(customerId, tier, paymentMethod) {
    const subscription = {
      customerId,
      tier,
      paymentMethod,
      status: 'active',
      startDate: new Date(),
      nextBillingDate: this.getNextBillingDate(),
      amount: this.getTierPrice(tier),
      autoRenew: true,
      paymentHistory: [],
      failedAttempts: 0
    };

    await this.db.run(
      `INSERT INTO subscriptions (customer_id, tier, payment_method, status, next_billing_date, amount, auto_renew)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, tier, paymentMethod, 'active', subscription.nextBillingDate, subscription.amount, 1]
    );

    return subscription;
  }

  // ==========================================
  // AUTOMATIC RENEWAL
  // ==========================================
  
  async processRenewal(subscriptionId) {
    const sub = await this.getSubscription(subscriptionId);
    
    if (!sub || !sub.autoRenew) return;

    console.log(`🔄 Processing renewal for ${sub.customerId} - ${sub.tier}`);

    try {
      let paymentResult;
      
      // Process based on payment method
      switch (sub.paymentMethod) {
        case 'stripe':
          paymentResult = await this.chargeStripe(sub);
          break;
        case 'paypal':
          paymentResult = await this.chargePayPal(sub);
          break;
        default:
          // Send manual renewal reminder for cash/crypto
          paymentResult = await this.sendManualRenewalReminder(sub);
      }

      if (paymentResult.success) {
        // Payment successful
        await this.recordPayment(subscriptionId, paymentResult);
        await this.extendSubscription(subscriptionId);
        await this.sendRenewalConfirmation(sub.customerId);
        
        console.log(`✅ Renewal successful for ${sub.customerId}`);
      } else {
        // Payment failed
        await this.handleFailedPayment(subscriptionId);
      }
    } catch (error) {
      console.error(`❌ Renewal error for ${subscriptionId}:`, error);
      await this.handleFailedPayment(subscriptionId);
    }
  }

  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================
  
  async chargeStripe(subscription) {
    try {
      // Charge the customer's saved card
      const paymentIntent = await stripe.paymentIntents.create({
        amount: subscription.amount * 100, // Convert to cents
        currency: 'usd',
        customer: subscription.stripeCustomerId,
        payment_method: subscription.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: `OGZ Prime ${subscription.tier} - Monthly Subscription`
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        amount: subscription.amount,
        method: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async chargePayPal(subscription) {
    // PayPal subscription billing (when configured)
    // TODO: Implement PayPal recurring payments
    return {
      success: false,
      error: 'PayPal renewal not yet implemented'
    };
  }

  // ==========================================
  // MANUAL RENEWAL REMINDERS
  // ==========================================
  
  async sendManualRenewalReminder(subscription) {
    const customer = await this.db.get(
      'SELECT email FROM customers WHERE id = ?',
      subscription.customerId
    );

    const renewalLink = `https://ogzprime.com/renew/${subscription.id}`;
    
    // Email template
    const emailContent = `
      Hi there!
      
      Your OGZ Prime ${subscription.tier} subscription is due for renewal.
      
      Amount: $${subscription.amount}
      Payment Method: ${subscription.paymentMethod}
      
      Click here to renew: ${renewalLink}
      
      You have 3 days to renew before your bot is paused.
      
      - OGZ Prime Team
    `;

    // TODO: Send actual email
    console.log(`📧 Renewal reminder sent to ${customer.email}`);
    
    return {
      success: false,
      pending: true,
      reminderSent: true
    };
  }

  // ==========================================
  // FAILED PAYMENT HANDLING
  // ==========================================
  
  async handleFailedPayment(subscriptionId) {
    const sub = await this.getSubscription(subscriptionId);
    
    sub.failedAttempts++;
    
    await this.db.run(
      'UPDATE subscriptions SET failed_attempts = ? WHERE id = ?',
      [sub.failedAttempts, subscriptionId]
    );

    if (sub.failedAttempts >= 3) {
      // After 3 failures, suspend the subscription
      await this.suspendSubscription(subscriptionId);
      await this.sendSuspensionNotice(sub.customerId);
    } else {
      // Retry in 24 hours
      const retryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.db.run(
        'UPDATE subscriptions SET next_billing_date = ? WHERE id = ?',
        [retryDate, subscriptionId]
      );
      
      await this.sendPaymentFailedNotice(sub.customerId, 3 - sub.failedAttempts);
    }
  }

  async suspendSubscription(subscriptionId) {
    await this.db.run(
      'UPDATE subscriptions SET status = ? WHERE id = ?',
      ['suspended', subscriptionId]
    );
    
    // Stop the customer's bot
    // TODO: Call bot manager to stop bot
    
    console.log(`⏸️ Subscription ${subscriptionId} suspended`);
  }

  // ==========================================
  // GRACE PERIOD & DOWNGRADE
  // ==========================================
  
  setupGracePeriod(subscriptionId) {
    // 3-day grace period for manual payments
    const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    this.db.run(
      'UPDATE subscriptions SET grace_period_end = ? WHERE id = ?',
      [gracePeriodEnd, subscriptionId]
    );
  }

  async downgradeExpiredSubscriptions() {
    // Find all expired subscriptions past grace period
    const expired = await this.db.all(`
      SELECT * FROM subscriptions 
      WHERE status = 'suspended' 
      AND grace_period_end < ?
    `, new Date());

    for (const sub of expired) {
      // Downgrade to free tier
      await this.db.run(
        'UPDATE customers SET tier = ? WHERE id = ?',
        ['starter', sub.customer_id]
      );
      
      // Update subscription status
      await this.db.run(
        'UPDATE subscriptions SET status = ? WHERE id = ?',
        ['expired', sub.id]
      );
      
      console.log(`⬇️ Customer ${sub.customer_id} downgraded to starter tier`);
    }
  }

  // ==========================================
  // CRON JOBS
  // ==========================================
  
  setupCronJobs() {
    // Check for renewals every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Checking for subscription renewals...');
      
      const due = await this.db.all(`
        SELECT * FROM subscriptions 
        WHERE status = 'active' 
        AND next_billing_date <= ?
        AND auto_renew = 1
      `, new Date());

      for (const subscription of due) {
        await this.processRenewal(subscription.id);
      }
    });

    // Check for expired grace periods daily
    cron.schedule('0 0 * * *', async () => {
      console.log('🔍 Checking for expired grace periods...');
      await this.downgradeExpiredSubscriptions();
    });

    // Send renewal reminders 3 days before
    cron.schedule('0 9 * * *', async () => {
      console.log('📧 Sending renewal reminders...');
      
      const upcoming = await this.db.all(`
        SELECT * FROM subscriptions 
        WHERE status = 'active' 
        AND next_billing_date BETWEEN ? AND ?
      `, 
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      );

      for (const sub of upcoming) {
        await this.sendUpcomingRenewalNotice(sub.customer_id, sub);
      }
    });
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  getTierPrice(tier) {
    const prices = {
      starter: 0,
      core: 97,
      pro: 297,
      odin: 997,
      valhalla: 9997
    };
    return prices[tier] || 0;
  }

  getNextBillingDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  }

  async getSubscription(id) {
    return await this.db.get(
      'SELECT * FROM subscriptions WHERE id = ?',
      id
    );
  }

  async recordPayment(subscriptionId, payment) {
    await this.db.run(
      `INSERT INTO payments (subscription_id, amount, method, transaction_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [subscriptionId, payment.amount, payment.method, payment.transactionId, 'completed', new Date()]
    );
  }

  async extendSubscription(subscriptionId) {
    const nextDate = this.getNextBillingDate();
    await this.db.run(
      'UPDATE subscriptions SET next_billing_date = ?, failed_attempts = 0 WHERE id = ?',
      [nextDate, subscriptionId]
    );
  }

  // ==========================================
  // NOTIFICATIONS (TODO: Implement email service)
  // ==========================================
  
  async sendRenewalConfirmation(customerId) {
    console.log(`✉️ Renewal confirmation sent to customer ${customerId}`);
  }

  async sendPaymentFailedNotice(customerId, retriesLeft) {
    console.log(`⚠️ Payment failed notice sent to customer ${customerId} - ${retriesLeft} retries left`);
  }

  async sendSuspensionNotice(customerId) {
    console.log(`🚫 Suspension notice sent to customer ${customerId}`);
  }

  async sendUpcomingRenewalNotice(customerId, subscription) {
    console.log(`📅 Upcoming renewal notice sent to customer ${customerId}`);
  }
}

module.exports = SubscriptionManager;