/**
 * ARCHITECTURE FIX: Neuromorphic Processor Module
 * 
 * Extracted from monolithic QuantumNeuromorphicCore.js
 * Handles spiking neural networks with proper memory management and async safety
 */

const EventEmitter = require('events');

class NeuromorphicProcessor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      neuromorphicBackend: config.neuromorphicBackend || 'loihi2',
      spikeThreshold: config.spikeThreshold || 0.7,
      synapticPlasticity: config.synapticPlasticity !== false,
      refractoryPeriod: config.refractoryPeriod || 0.001,
      leakageRate: config.leakageRate || 0.95,
      maxSpikeRate: config.maxSpikeRate || 1000,
      maxLatencyNs: config.maxLatencyNs || 100,
      maxNeurons: config.maxNeurons || 10000, // MEMORY LEAK FIX
      maxSynapses: config.maxSynapses || 50000, // MEMORY LEAK FIX
      enableNeuromorphicPlasticity: config.enableNeuromorphicPlasticity !== false,
      ...config
    };
    
    // ARCHITECTURE FIX: Bounded neuromorphic state with LRU management
    this.neuromorphicState = {
      neurons: new Map(),
      synapses: new Map(),
      spikeTrain: [],
      plasticityHistory: [],
      membraneVoltages: new Map(),
      synapticWeights: new Map(),
      inhibitoryNeurons: new Set(),
      excitatoryNeurons: new Set(),
      maxSpikeHistory: config.maxSpikeHistory || 1000, // MEMORY LEAK FIX
      maxPlasticityHistory: config.maxPlasticityHistory || 500 // MEMORY LEAK FIX
    };
    
    // ARCHITECTURE FIX: Performance metrics with bounded storage
    this.metrics = {
      totalSpikes: 0,
      spikeRates: [],
      maxSpikeRateHistory: config.maxSpikeRateHistory || 100, // MEMORY LEAK FIX
      averageEfficiency: 0.85,
      plasticityUpdates: 0,
      energyConsumption: 0,
      lastCleanup: Date.now()
    };
    
    // ARCHITECTURE FIX: Async operation locks to prevent race conditions
    this.operationLocks = {
      spikeProcessing: false,
      plasticityUpdate: false,
      cleanup: false
    };
    
    // ARCHITECTURE FIX: Cleanup interval to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.performNeuromorphicCleanup();
    }, 45000); // Every 45 seconds
    
    console.log('🧠 Neuromorphic Processor initialized with bounded memory management');
  }
  
  /**
   * ARCHITECTURE FIX: Async initialization with proper error handling
   */
  async initialize() {
    try {
      console.log('🧠 Initializing Neuromorphic Processor...');
      
      // Initialize neural networks with timeout
      await Promise.race([
        this.initializeNeuromorphicNetworks(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Neuromorphic initialization timeout')), 8000)
        )
      ]);
      
      // Initialize synaptic connections
      await this.initializeSynapticConnections();
      
      console.log('✅ Neuromorphic Processor initialized successfully');
      this.emit('neuromorphicProcessorReady', this.getNeuromorphicStatus());
      
      return true;
    } catch (error) {
      console.error('❌ Neuromorphic Processor initialization failed:', error);
      this.emit('neuromorphicProcessorError', error);
      throw error;
    }
  }
  
  /**
   * ARCHITECTURE FIX: Enhanced neuromorphic processing with async safety
   */
  async neuromorphicSpikingProcess(marketEvent, priceStream = []) {
    const startTime = process.hrtime.bigint();
    
    // ARCHITECTURE FIX: Prevent concurrent spike processing
    if (this.operationLocks.spikeProcessing) {
      console.warn('⚠️ Spike processing already in progress, queuing...');
      return new Promise((resolve) => {
        const checkLock = () => {
          if (!this.operationLocks.spikeProcessing) {
            resolve(this.neuromorphicSpikingProcess(marketEvent, priceStream));
          } else {
            setTimeout(checkLock, 10);
          }
        };
        checkLock();
      });
    }
    
    this.operationLocks.spikeProcessing = true;
    
    try {
      // ARCHITECTURE FIX: Input validation
      if (!marketEvent || typeof marketEvent !== 'object') {
        throw new Error('Invalid market event data');
      }
      
      console.log('🧠⚡ Neuromorphic spike processing initiated...');
      
      // 1. Convert market event to spike trains with bounds checking
      const spikeTrain = this.marketEventToSpikeTrains(marketEvent, priceStream.slice(-20)); // Limit history
      
      // 2. Process through SNN with timeout
      const neuronResponses = await Promise.race([
        this.processThroughSNN(spikeTrain),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SNN processing timeout')), 3000)
        )
      ]);
      
      // 3. Apply synaptic plasticity if enabled
      if (this.config.enableNeuromorphicPlasticity && !this.operationLocks.plasticityUpdate) {
        await this.updateSynapticWeights(neuronResponses, marketEvent);
      }
      
      // 4. Decode spike patterns to trading decision
      const spikeDecision = this.decodeSpikePatterns(neuronResponses);
      
      // 5. Calculate neuromorphic metrics
      const spikeEfficiency = this.calculateSpikeEfficiency(neuronResponses);
      const inhibitoryBalance = this.calculateInhibitoryBalance(neuronResponses);
      const energyConsumption = this.calculateNeuromorphicEnergy(neuronResponses);
      
      const latencyNs = Number(process.hrtime.bigint() - startTime);
      this.recordNeuromorphicMetrics(spikeTrain.length, spikeEfficiency, energyConsumption);
      
      // ARCHITECTURE FIX: Latency validation
      if (latencyNs > this.config.maxLatencyNs * 1000) {
        console.warn(`⚠️ Neuromorphic latency exceeded: ${(latencyNs / 1000).toFixed(1)} ns`);
        this.emit('neuromorphicLatencyWarning', { latencyNs, threshold: this.config.maxLatencyNs * 1000 });
      }
      
      console.log(`🧠 Neuromorphic decision: ${spikeDecision.action} (${(spikeDecision.confidence * 100).toFixed(1)}%)`);
      console.log(`⚡ Processing latency: ${(latencyNs / 1000).toFixed(1)} ns`);
      
      return {
        decision: spikeDecision,
        latencyNs: latencyNs,
        spikeCount: neuronResponses.length,
        efficiency: spikeEfficiency,
        inhibitoryBalance: inhibitoryBalance,
        plasticityUpdates: this.neuromorphicState.plasticityHistory.length,
        energyConsumption: energyConsumption,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('❌ Neuromorphic processing error:', error);
      
      // ARCHITECTURE FIX: Safe fallback
      return {
        decision: { action: 'HOLD', confidence: 0.1 },
        latencyNs: 1000,
        mode: 'NEUROMORPHIC_FAILSAFE',
        error: error.message,
        timestamp: Date.now()
      };
      
    } finally {
      this.operationLocks.spikeProcessing = false;
    }
  }
  
  /**
   * ARCHITECTURE FIX: Enhanced synaptic plasticity with async safety
   */
  async updateSynapticWeights(neuronResponses, marketEvent) {
    // ARCHITECTURE FIX: Prevent concurrent plasticity updates
    if (this.operationLocks.plasticityUpdate) {
      console.log('⚠️ Plasticity update already in progress, skipping...');
      return;
    }
    
    this.operationLocks.plasticityUpdate = true;
    
    try {
      console.log('🧠🔄 Updating synaptic weights...');
      
      // ARCHITECTURE FIX: Bounded plasticity updates
      const maxUpdates = Math.min(neuronResponses.length, 100); // Limit updates per cycle
      
      for (let i = 0; i < maxUpdates; i++) {
        const response = neuronResponses[i];
        
        if (response.fired) {
          // Update synaptic weights for fired neurons
          const weightKey = `synapse_${response.neuronId}`;
          const currentWeight = this.neuromorphicState.synapticWeights.get(weightKey) || 0.5;
          
          // Apply STDP (Spike-Timing Dependent Plasticity)
          const newWeight = this.applySTDP(currentWeight, response, marketEvent);
          
          // ARCHITECTURE FIX: Bounded weight values
          const boundedWeight = Math.max(0.1, Math.min(1.0, newWeight));
          this.neuromorphicState.synapticWeights.set(weightKey, boundedWeight);
        }
      }
      
      // ARCHITECTURE FIX: Record plasticity with bounded history
      this.neuromorphicState.plasticityHistory.push({
        timestamp: Date.now(),
        updatesCount: maxUpdates,
        avgWeightChange: 0.1 // Simplified
      });
      
      // Limit plasticity history size
      if (this.neuromorphicState.plasticityHistory.length > this.neuromorphicState.maxPlasticityHistory) {
        this.neuromorphicState.plasticityHistory.shift();
      }
      
      this.metrics.plasticityUpdates++;
      console.log(`🧠✅ Synaptic weights updated: ${maxUpdates} neurons`);
      
    } catch (error) {
      console.error('❌ Plasticity update error:', error);
    } finally {
      this.operationLocks.plasticityUpdate = false;
    }
  }
  
  /**
   * ARCHITECTURE FIX: Memory cleanup to prevent leaks
   */
  async performNeuromorphicCleanup() {
    // ARCHITECTURE FIX: Prevent concurrent cleanup
    if (this.operationLocks.cleanup) {
      return;
    }
    
    this.operationLocks.cleanup = true;
    
    try {
      console.log('🧹 Performing neuromorphic memory cleanup...');
      
      // Clean up neurons (keep only active ones)
      if (this.neuromorphicState.neurons.size > this.config.maxNeurons) {
        const neuronEntries = Array.from(this.neuromorphicState.neurons.entries());
        const activeNeurons = neuronEntries
          .sort((a, b) => (b[1].lastActive || 0) - (a[1].lastActive || 0))
          .slice(0, this.config.maxNeurons);
        
        this.neuromorphicState.neurons.clear();
        activeNeurons.forEach(([key, value]) => {
          this.neuromorphicState.neurons.set(key, value);
        });
        
        console.log(`🧹 Cleaned neurons: ${neuronEntries.length} → ${this.neuromorphicState.neurons.size}`);
      }
      
      // Clean up synapses (keep only recent ones)
      if (this.neuromorphicState.synapses.size > this.config.maxSynapses) {
        const synapseEntries = Array.from(this.neuromorphicState.synapses.entries());
        const recentSynapses = synapseEntries
          .sort((a, b) => (b[1].lastUsed || 0) - (a[1].lastUsed || 0))
          .slice(0, this.config.maxSynapses);
        
        this.neuromorphicState.synapses.clear();
        recentSynapses.forEach(([key, value]) => {
          this.neuromorphicState.synapses.set(key, value);
        });
        
        console.log(`🧹 Cleaned synapses: ${synapseEntries.length} → ${this.neuromorphicState.synapses.size}`);
      }
      
      // Clean up spike train history
      if (this.neuromorphicState.spikeTrain.length > this.neuromorphicState.maxSpikeHistory) {
        this.neuromorphicState.spikeTrain = this.neuromorphicState.spikeTrain.slice(-this.neuromorphicState.maxSpikeHistory);
      }
      
      // Clean up metrics history
      if (this.metrics.spikeRates.length > this.metrics.maxSpikeRateHistory) {
        this.metrics.spikeRates = this.metrics.spikeRates.slice(-this.metrics.maxSpikeRateHistory);
      }
      
      this.metrics.lastCleanup = Date.now();
      console.log('✅ Neuromorphic cleanup completed');
      
    } catch (error) {
      console.error('❌ Neuromorphic cleanup error:', error);
    } finally {
      this.operationLocks.cleanup = false;
    }
  }
  
  /**
   * ARCHITECTURE FIX: Graceful shutdown with resource cleanup
   */
  async shutdown() {
    try {
      console.log('🧠 Shutting down Neuromorphic Processor...');
      
      // Wait for any ongoing operations to complete
      let waitCount = 0;
      while ((this.operationLocks.spikeProcessing || this.operationLocks.plasticityUpdate) && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      
      // Clear neuromorphic state
      this.neuromorphicState.neurons.clear();
      this.neuromorphicState.synapses.clear();
      this.neuromorphicState.spikeTrain = [];
      this.neuromorphicState.plasticityHistory = [];
      this.neuromorphicState.membraneVoltages.clear();
      this.neuromorphicState.synapticWeights.clear();
      this.neuromorphicState.inhibitoryNeurons.clear();
      this.neuromorphicState.excitatoryNeurons.clear();
      
      // Clear metrics
      this.metrics.spikeRates = [];
      
      // Remove all listeners
      this.removeAllListeners();
      
      console.log('✅ Neuromorphic Processor shutdown complete');
      
    } catch (error) {
      console.error('❌ Neuromorphic shutdown error:', error);
    }
  }
  
  /**
   * ARCHITECTURE FIX: Get neuromorphic status with bounded data
   */
  getNeuromorphicStatus() {
    const avgSpikeRate = this.metrics.spikeRates.length > 0 
      ? this.metrics.spikeRates.reduce((a, b) => a + b, 0) / this.metrics.spikeRates.length
      : 0;
    
    return {
      backend: this.config.neuromorphicBackend,
      totalSpikes: this.metrics.totalSpikes,
      activeNeurons: this.neuromorphicState.neurons.size,
      synapses: this.neuromorphicState.synapses.size,
      plasticityEnabled: this.config.enableNeuromorphicPlasticity,
      averageEfficiency: this.metrics.averageEfficiency,
      averageSpikeRate: avgSpikeRate,
      energyConsumption: this.metrics.energyConsumption,
      plasticityUpdates: this.metrics.plasticityUpdates,
      lastCleanup: this.metrics.lastCleanup,
      memoryUsage: {
        neurons: this.neuromorphicState.neurons.size,
        maxNeurons: this.config.maxNeurons,
        synapses: this.neuromorphicState.synapses.size,
        maxSynapses: this.config.maxSynapses,
        spikeHistory: this.neuromorphicState.spikeTrain.length,
        plasticityHistory: this.neuromorphicState.plasticityHistory.length
      },
      operationLocks: {
        spikeProcessing: this.operationLocks.spikeProcessing,
        plasticityUpdate: this.operationLocks.plasticityUpdate,
        cleanup: this.operationLocks.cleanup
      }
    };
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  recordNeuromorphicMetrics(spikes, efficiency, energy) {
    this.metrics.totalSpikes += spikes;
    this.metrics.spikeRates.push(spikes);
    this.metrics.averageEfficiency = (this.metrics.averageEfficiency * 0.9) + (efficiency * 0.1); // Exponential moving average
    this.metrics.energyConsumption += energy;
    
    // ARCHITECTURE FIX: Prevent unbounded growth
    if (this.metrics.spikeRates.length > this.metrics.maxSpikeRateHistory) {
      this.metrics.spikeRates.shift();
    }
  }
  
  applySTDP(currentWeight, response, marketEvent) {
    // Simplified STDP implementation
    const learningRate = 0.01;
    const timeDelta = Date.now() - (response.timestamp || Date.now());
    const stdpWindow = 20; // 20ms window
    
    if (Math.abs(timeDelta) < stdpWindow) {
      // Potentiation if spikes are correlated
      if (response.fired && marketEvent.price > 0) {
        return currentWeight + learningRate;
      } else {
        // Depression if not correlated
        return currentWeight - learningRate * 0.5;
      }
    }
    
    return currentWeight; // No change outside STDP window
  }
  
  // Neuromorphic operation implementations
  async initializeNeuromorphicNetworks() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize basic neural network structure
    for (let i = 0; i < 100; i++) { // Small initial network
      this.neuromorphicState.neurons.set(`neuron_${i}`, {
        id: i,
        threshold: this.config.spikeThreshold,
        membrane: 0,
        lastActive: Date.now(),
        type: i < 80 ? 'excitatory' : 'inhibitory'
      });
      
      if (i < 80) {
        this.neuromorphicState.excitatoryNeurons.add(`neuron_${i}`);
      } else {
        this.neuromorphicState.inhibitoryNeurons.add(`neuron_${i}`);
      }
    }
    
    console.log('🧠 Neuromorphic networks initialized');
  }
  
  async initializeSynapticConnections() {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Create basic synaptic connections
    const neurons = Array.from(this.neuromorphicState.neurons.keys());
    for (let i = 0; i < Math.min(200, neurons.length * 2); i++) {
      const preNeuron = neurons[Math.floor(Math.random() * neurons.length)];
      const postNeuron = neurons[Math.floor(Math.random() * neurons.length)];
      
      if (preNeuron !== postNeuron) {
        this.neuromorphicState.synapses.set(`synapse_${i}`, {
          pre: preNeuron,
          post: postNeuron,
          weight: 0.5,
          lastUsed: Date.now()
        });
        
        this.neuromorphicState.synapticWeights.set(`synapse_${i}`, 0.5);
      }
    }
    
    console.log('🧠 Synaptic connections initialized');
  }
  
  marketEventToSpikeTrains(marketEvent, priceStream) {
    const spikes = [];
    const baseRate = 100; // Base spike rate Hz
    
    // Convert price change to spike rate
    const lastPrice = priceStream.length > 0 ? priceStream[priceStream.length - 1] : marketEvent.price;
    const priceChange = marketEvent.price - lastPrice;
    const changePercent = Math.abs(priceChange / marketEvent.price);
    
    const spikeRate = baseRate * (1 + changePercent * 10);
    const spikeCount = Math.min(Math.floor(spikeRate * 0.001), 50); // Cap at 50 spikes
    
    for (let i = 0; i < spikeCount; i++) {
      spikes.push({
        neuronId: Math.floor(Math.random() * this.neuromorphicState.neurons.size),
        timestamp: Date.now() + i * 0.1,
        amplitude: Math.random() * 0.5 + 0.5
      });
    }
    
    // Add to spike train history with bounds
    this.neuromorphicState.spikeTrain.push(...spikes);
    if (this.neuromorphicState.spikeTrain.length > this.neuromorphicState.maxSpikeHistory) {
      this.neuromorphicState.spikeTrain = this.neuromorphicState.spikeTrain.slice(-this.neuromorphicState.maxSpikeHistory);
    }
    
    return spikes;
  }
  
  async processThroughSNN(spikeTrain) {
    const responses = [];
    
    for (const spike of spikeTrain) {
      // Update neuron if it exists
      const neuronKey = `neuron_${spike.neuronId}`;
      const neuron = this.neuromorphicState.neurons.get(neuronKey);
      
      if (neuron) {
        // Simple leaky integrate-and-fire
        neuron.membrane += spike.amplitude;
        neuron.membrane *= this.config.leakageRate; // Leakage
        neuron.lastActive = Date.now();
        
        const fired = neuron.membrane > neuron.threshold;
        
        if (fired) {
          neuron.membrane = 0; // Reset after firing
        }
        
        responses.push({
          neuronId: spike.neuronId,
          fired: fired,
          voltage: neuron.membrane,
          timestamp: spike.timestamp
        });
        
        // Update neuron in map
        this.neuromorphicState.neurons.set(neuronKey, neuron);
      }
    }
    
    return responses;
  }
  
  decodeSpikePatterns(neuronResponses) {
    if (neuronResponses.length === 0) {
      return { action: 'HOLD', confidence: 0.1 };
    }
    
    const firingRate = neuronResponses.filter(r => r.fired).length / neuronResponses.length;
    
    if (firingRate > 0.7) {
      return { action: 'BUY', confidence: firingRate };
    } else if (firingRate < 0.3) {
      return { action: 'SELL', confidence: 1 - firingRate };
    } else {
      return { action: 'HOLD', confidence: 0.5 };
    }
  }
  
  calculateSpikeEfficiency(neuronResponses) {
    if (neuronResponses.length === 0) return 0;
    
    const totalSpikes = neuronResponses.length;
    const effectiveSpikes = neuronResponses.filter(r => r.fired && r.voltage > 0.8).length;
    return effectiveSpikes / totalSpikes;
  }
  
  calculateInhibitoryBalance(neuronResponses) {
    const inhibitorySpikes = neuronResponses.filter(r => 
      this.neuromorphicState.inhibitoryNeurons.has(`neuron_${r.neuronId}`) && r.fired
    ).length;
    
    const totalFired = neuronResponses.filter(r => r.fired).length;
    return totalFired > 0 ? inhibitorySpikes / totalFired : 0.2;
  }
  
  calculateNeuromorphicEnergy(neuronResponses) {
    // Simple energy model: firing costs more than non-firing
    const firingCost = 0.001; // Energy per spike
    const baseCost = 0.0001; // Base metabolic cost per neuron
    
    const firedCount = neuronResponses.filter(r => r.fired).length;
    return (firedCount * firingCost) + (neuronResponses.length * baseCost);
  }
}

module.exports = NeuromorphicProcessor;
