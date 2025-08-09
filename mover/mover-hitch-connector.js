// ==========================================
// FILE: mover-hitch-connector.js
// Connects The Mover to Hitch NLP for news/sentiment
// ==========================================
const { getWebSocketUrl, getHttpUrl } = require('../core/WebSocketConfig');

const WebSocket = require('ws');
const EventEmitter = require('events');

class HitchConnector extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      hitchUrl: config.hitchUrl || getWebSocketUrl('data'),
      reconnectInterval: config.reconnectInterval || 5000,
      ...config
    };
    
    this.newsBuffer = [];
    this.sentimentData = {};
    this.marketEvents = [];
    
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.config.hitchUrl);
      
      this.ws.on('open', () => {
        console.log('[HitchConnector] Connected to Hitch NLP system');
        this.subscribe();
      });

      this.ws.on('message', (data) => {
        const parsed = JSON.parse(data);
        this.processHitchData(parsed);
      });

      this.ws.on('close', () => {
        console.log('[HitchConnector] Disconnected from Hitch, reconnecting...');
        setTimeout(() => this.connect(), this.config.reconnectInterval);
      });

    } catch (error) {
      console.error('[HitchConnector] Connection error:', error);
      setTimeout(() => this.connect(), this.config.reconnectInterval);
    }
  }

  subscribe() {
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      channels: ['news', 'sentiment', 'marketEvents', 'breakingAlerts']
    }));
  }

  processHitchData(data) {
    switch (data.type) {
      case 'news':
        this.newsBuffer.push(data);
        this.emit('news', data);
        
        // Extract trading-relevant info
        if (this.isMarketMovingNews(data)) {
          this.emit('market_moving_news', {
            headline: data.headline,
            impact: this.assessImpact(data),
            assets: this.extractAssets(data),
            timestamp: Date.now()
          });
        }
        break;
        
      case 'sentiment':
        this.sentimentData[data.asset] = data.sentiment;
        this.emit('sentiment_update', data);
        break;
        
      case 'marketEvent':
        this.marketEvents.push(data);
        this.emit('market_event', data);
        break;
    }
  }

  isMarketMovingNews(news) {
    const keywords = ['fed', 'rate', 'war', 'sanctions', 'crash', 'surge', 'breaks', 'announces'];
    return keywords.some(keyword => 
      news.headline.toLowerCase().includes(keyword)
    );
  }

  assessImpact(news) {
    // Assess potential market impact
    if (news.urgency === 'breaking') return 'HIGH';
    if (news.category === 'central_bank') return 'HIGH';
    if (news.sentiment_score < -0.7 || news.sentiment_score > 0.7) return 'MEDIUM';
    return 'LOW';
  }

  extractAssets(news) {
    // Extract mentioned assets
    const assets = [];
    const assetPatterns = [
      /\b(BTC|bitcoin)\b/i,
      /\b(ETH|ethereum)\b/i,
      /\b(USD|dollar)\b/i,
      /\b(gold|GLD)\b/i
    ];
    
    assetPatterns.forEach(pattern => {
      if (pattern.test(news.content)) {
        assets.push(pattern.source.match(/\w+/)[0].toUpperCase());
      }
    });
    
    return assets;
  }

  getCurrentSentiment(asset) {
    return this.sentimentData[asset] || { score: 0, strength: 'neutral' };
  }

  getRecentNews(count = 10) {
    return this.newsBuffer.slice(-count);
  }

  getUpcomingEvents() {
    return this.marketEvents.filter(event => 
      new Date(event.scheduledTime) > new Date()
    );
  }
}