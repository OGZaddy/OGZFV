const redis = require('redis');
const EventEmitter = require('events');

class DataPipelineOptimizer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            redisUrl: config.redisUrl || 'redis://127.0.0.1:6379',
            cacheExpiry: config.cacheExpiry || 60,
            batchSize: config.batchSize || 100,
            ...config
        };
        
        this.cache = new Map();
        this.messageQueue = [];
        this.batchProcessor = null;
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            messagesProcessed: 0,
            batchesProcessed: 0
        };
    }

    async initialize() {
        try {
            this.client = redis.createClient({
                url: this.config.redisUrl,
                socket: {
                    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
                }
            });

            this.subscriber = redis.createClient({
                url: this.config.redisUrl
            });

            this.publisher = redis.createClient({
                url: this.config.redisUrl
            });

            await Promise.all([
                this.client.connect(),
                this.subscriber.connect(),
                this.publisher.connect()
            ]);

            await this.setupChannels();
            this.startBatchProcessor();
            
            console.log('✅ Data Pipeline Optimizer initialized with Redis');
            return true;
        } catch (error) {
            console.error('❌ Redis initialization failed:', error.message);
            return this.initializeFallback();
        }
    }

    async initializeFallback() {
        console.log('⚡ Using in-memory caching fallback');
        this.client = {
            get: async (key) => this.cache.get(key),
            set: async (key, value, options) => {
                this.cache.set(key, value);
                if (options?.EX) {
                    setTimeout(() => this.cache.delete(key), options.EX * 1000);
                }
            },
            del: async (key) => this.cache.delete(key),
            hSet: async (key, field, value) => {
                const hash = this.cache.get(key) || {};
                hash[field] = value;
                this.cache.set(key, hash);
            },
            hGet: async (key, field) => {
                const hash = this.cache.get(key) || {};
                return hash[field];
            },
            hGetAll: async (key) => this.cache.get(key) || {}
        };

        this.publisher = {
            publish: async (channel, message) => {
                this.emit(channel, JSON.parse(message));
            }
        };

        this.subscriber = {
            subscribe: async (channel) => {
                console.log(`📡 Subscribed to ${channel} (in-memory)`);
            }
        };

        this.startBatchProcessor();
        return true;
    }

    async setupChannels() {
        const channels = [
            'market_data',
            'trading_signals',
            'strategy_updates',
            'risk_alerts',
            'module_sync'
        ];

        for (const channel of channels) {
            await this.subscriber.subscribe(channel);
            
            this.subscriber.on('message', (chan, message) => {
                if (chan === channel) {
                    this.handleChannelMessage(channel, message);
                }
            });
        }
    }

    handleChannelMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            this.emit(`${channel}:data`, data);
            
            if (data.priority === 'high') {
                this.processImmediate(data);
            } else {
                this.queueMessage(data);
            }
        } catch (error) {
            console.error(`Error handling ${channel} message:`, error);
        }
    }

    queueMessage(message) {
        this.messageQueue.push({
            ...message,
            timestamp: Date.now()
        });

        if (this.messageQueue.length >= this.config.batchSize) {
            this.processBatch();
        }
    }

    startBatchProcessor() {
        this.batchProcessor = setInterval(() => {
            if (this.messageQueue.length > 0) {
                this.processBatch();
            }
        }, 1000);
    }

    async processBatch() {
        const batch = this.messageQueue.splice(0, this.config.batchSize);
        if (batch.length === 0) return;

        try {
            const pipeline = this.client.pipeline ? this.client.pipeline() : null;
            
            for (const message of batch) {
                await this.processMessage(message, pipeline);
            }

            if (pipeline) {
                await pipeline.exec();
            }

            this.metrics.batchesProcessed++;
            this.metrics.messagesProcessed += batch.length;
            
            this.emit('batch:processed', {
                size: batch.length,
                metrics: this.metrics
            });
        } catch (error) {
            console.error('Batch processing error:', error);
            this.messageQueue.unshift(...batch);
        }
    }

    async processMessage(message, pipeline) {
        const processor = this.getProcessor(message.type);
        if (processor) {
            await processor(message, pipeline);
        }
    }

    getProcessor(type) {
        const processors = {
            'market_update': this.processMarketUpdate.bind(this),
            'trading_signal': this.processTradingSignal.bind(this),
            'strategy_data': this.processStrategyData.bind(this),
            'risk_metric': this.processRiskMetric.bind(this)
        };
        return processors[type];
    }

    async processMarketUpdate(data, pipeline) {
        const key = `market:${data.symbol}`;
        const cached = await this.getCached(key);
        
        if (!cached || this.shouldUpdate(cached, data)) {
            await this.setCached(key, data, 10);
            await this.publish('market_data', data);
        }
    }

    async processTradingSignal(data, pipeline) {
        const key = `signal:${data.strategy}:${data.symbol}`;
        await this.setCached(key, data, 60);
        await this.publish('trading_signals', data);
    }

    async processStrategyData(data, pipeline) {
        const key = `strategy:${data.name}`;
        await this.client.hSet(key, 'performance', JSON.stringify(data.performance));
        await this.client.hSet(key, 'lastUpdate', Date.now().toString());
    }

    async processRiskMetric(data, pipeline) {
        const key = `risk:${data.metric}`;
        await this.setCached(key, data, 30);
        
        if (data.value > data.threshold) {
            await this.publish('risk_alerts', {
                ...data,
                alert: true,
                timestamp: Date.now()
            });
        }
    }

    async processImmediate(data) {
        if (data.type === 'emergency_stop') {
            await this.publish('trading_signals', {
                action: 'CLOSE_ALL',
                reason: data.reason,
                priority: 'critical'
            });
        }
    }

    shouldUpdate(cached, newData) {
        const timeDiff = Date.now() - (cached.timestamp || 0);
        const priceDiff = Math.abs((newData.price - cached.price) / cached.price);
        
        return timeDiff > 1000 || priceDiff > 0.001;
    }

    async getCached(key) {
        try {
            const data = await this.client.get(key);
            if (data) {
                this.metrics.cacheHits++;
                return JSON.parse(data);
            }
            this.metrics.cacheMisses++;
            return null;
        } catch (error) {
            return null;
        }
    }

    async setCached(key, value, expiry = null) {
        try {
            const options = expiry ? { EX: expiry } : {};
            await this.client.set(key, JSON.stringify(value), options);
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async publish(channel, data) {
        try {
            await this.publisher.publish(channel, JSON.stringify(data));
        } catch (error) {
            console.error(`Publish error on ${channel}:`, error);
        }
    }

    async bulkCache(items, keyPrefix) {
        const pipeline = this.client.pipeline ? this.client.pipeline() : null;
        
        for (const item of items) {
            const key = `${keyPrefix}:${item.id}`;
            if (pipeline) {
                pipeline.set(key, JSON.stringify(item), { EX: this.config.cacheExpiry });
            } else {
                await this.setCached(key, item, this.config.cacheExpiry);
            }
        }
        
        if (pipeline) {
            await pipeline.exec();
        }
    }

    async invalidatePattern(pattern) {
        if (this.client.keys) {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } else {
            for (const [key] of this.cache) {
                if (key.match(pattern)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    getMetrics() {
        const hitRate = this.metrics.cacheHits / 
            (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;
        
        return {
            ...this.metrics,
            cacheHitRate: (hitRate * 100).toFixed(2) + '%',
            queueSize: this.messageQueue.length
        };
    }

    async cleanup() {
        if (this.batchProcessor) {
            clearInterval(this.batchProcessor);
        }
        
        if (this.messageQueue.length > 0) {
            await this.processBatch();
        }
        
        if (this.client?.quit) {
            await Promise.all([
                this.client.quit(),
                this.subscriber?.quit(),
                this.publisher?.quit()
            ]);
        }
    }
}

module.exports = DataPipelineOptimizer;