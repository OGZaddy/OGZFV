// ==========================================
// FILE: mover-sales-engine.js
// Converts visitors, handles objections, closes deals
// ==========================================
class SalesEngine {
  constructor(moverCore, moverMemory) {
    this.core = moverCore;
    this.memory = moverMemory;
    
    this.salesPlaybook = {
      visitor_stages: ['curious', 'interested', 'considering', 'ready'],
      
      objection_handlers: {
        'too_expensive': {
          response: "I understand price is important. Let me show you yesterday's results...",
          proof: () => this.getRecentProfits(),
          reframe: "The question isn't the cost, it's can you afford NOT to have The Mover?"
        },
        
        'does_it_really_work': {
          response: "Great question! Here's my live track record...",
          proof: () => this.getLiveResults(),
          testimonial: () => this.getSuccessStories()
        },
        
        'too_complicated': {
          response: "Actually, it's simpler than you think. You just...",
          steps: ["1. Connect your exchange", "2. Set your risk level", "3. Let me handle the rest"],
          offer: "I'll personally walk you through setup!"
        }
      },
      
      urgency_creators: [
        "Limited spots available - I can only manage {spots} accounts effectively",
        "Price increasing on {date} as demand grows",
        "Members are up {percentage}% this week - don't miss the next move"
      ],
      
      social_proof: {
        stats: () => this.getPerformanceStats(),
        testimonials: () => this.getTestimonials(),
        live_feed: () => this.getCurrentTrades()
      }
    };
  }

  async handleVisitor(visitorData) {
    const stage = this.identifyStage(visitorData);
    const history = await this.memory.recall(`visitor_${visitorData.id}`, { limit: 10 });
    
    return {
      personalized_greeting: this.generateGreeting(visitorData, history),
      
      content: this.getContentForStage(stage),
      
      social_proof: await this.selectSocialProof(visitorData.interests),
      
      call_to_action: this.generateCTA(stage),
      
      follow_up_scheduled: this.scheduleFollowUp(visitorData, stage)
    };
  }

  identifyStage(visitorData) {
    if (visitorData.visits === 1) return 'curious';
    if (visitorData.timeOnSite > 300) return 'interested';
    if (visitorData.pagesViewed.includes('pricing')) return 'considering';
    if (visitorData.actions.includes('start_trial')) return 'ready';
    return 'curious';
  }

  generateGreeting(visitor, history) {
    if (history.length === 0) {
      return `Welcome! I'm The Mover, your AI trading partner. I see you're interested in ${visitor.referrer}...`;
    }
    
    const lastVisit = history[0];
    const profitsSince = this.calculateProfitsSince(lastVisit.timestamp);
    
    return `Welcome back! Since your last visit, I've generated ${profitsSince} in profits. Ready to join?`;
  }

  async generateSalesPage() {
    const recentResults = await this.core.getSessionReport();
    const topTrades = await this.memory.recall('profitable trades', { limit: 5 });
    
    return {
      headline: "Let The Mover Trade For You 24/7",
      
      subheadline: `Currently ${recentResults.winRate} Win Rate | ${recentResults.profitLoss} Today`,
      
      problem: "You're missing profitable trades while you sleep, work, and live your life...",
      
      solution: "The Mover never sleeps. AI-powered trading that learns and adapts.",
      
      proof_section: {
        live_stats: recentResults,
        recent_wins: topTrades,
        testimonials: await this.getTestimonials()
      },
      
      benefits: [
        "24/7 automated trading",
        "Learns from every trade",
        "Risk management built-in",
        "Real-time alerts",
        "Technical support included"
      ],
      
      urgency: this.createUrgency(),
      
      guarantee: "30-day money back guarantee. No questions asked.",
      
      cta: {
        button_text: "Start Your Free Trial",
        supporting_text: "No credit card required"
      }
    };
  }

  handleObjection(objection, context) {
    const handler = this.salesPlaybook.objection_handlers[objection] || 
                   this.generateGenericHandler(objection);
    
    return {
      acknowledgment: "I hear you, and that's a valid concern...",
      
      response: handler.response,
      
      proof: handler.proof ? handler.proof() : null,
      
      reframe: handler.reframe,
      
      soft_close: "Does that address your concern?",
      
      alternative: "If you're still unsure, how about starting with our smallest plan?"
    };
  }

  createFollowUpSequence(lead) {
    const sequence = [];
    
    // Email 1: Immediate value
    sequence.push({
      delay: '1 hour',
      subject: 'Your AI Trading Report (as promised)',
      content: this.generateValueEmail(lead)
    });
    
    // Email 2: Success story
    sequence.push({
      delay: '1 day',
      subject: `How ${this.getTopUser()} Made ${this.getTopProfit()} This Week`,
      content: this.generateSuccessStory(lead)
    });
    
    // Email 3: Urgency
    sequence.push({
      delay: '3 days',
      subject: 'Your trial access expires soon...',
      content: this.generateUrgencyEmail(lead)
    });
    
    return sequence;
  }

  async calculateConversionProbability(visitor) {
    const factors = {
      engagement_score: this.calculateEngagement(visitor),
      interest_match: this.matchInterests(visitor),
      timing_score: this.assessTiming(visitor),
      budget_match: this.assessBudgetFit(visitor)
    };
    
    const probability = Object.values(factors).reduce((sum, score) => sum + score, 0) / 4;
    
    return {
      probability: (probability * 100).toFixed(1) + '%',
      factors,
      recommended_action: probability > 0.7 ? 'Close now' : 'Nurture more'
    };
  }
}