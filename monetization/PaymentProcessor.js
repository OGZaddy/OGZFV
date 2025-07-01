LicenseManager.js
// monetization/paymentProcessor.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentProcessor {
  constructor(config = {}) {
    this.config = {
      currency: 'usd',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      ...config
    };
  }

  async createSubscription(customerId, priceIds) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: priceIds.map(priceId => ({ price: priceId })),
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.del(subscriptionId);
      return { success: true, subscription };
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  async createPaymentIntent(amount, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: this.config.currency,
        metadata
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Payment intent error:', error);
      throw error;
    }
  }

  async handleWebhook(rawBody, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          return { type: 'payment_success', data: event.data.object };
        case 'subscription.created':
        case 'subscription.updated':
          return { type: 'subscription_update', data: event.data.object };
        case 'subscription.deleted':
          return { type: 'subscription_cancelled', data: event.data.object };
        default:
          return { type: event.type, data: event.data.object };
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }
}

module.exports = PaymentProcessor;