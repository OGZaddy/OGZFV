// OGZ Prime Transparency Client - Real-time AI Brain Visualization
// Connects to transparency WebSocket and API for live bot intelligence display

class TransparencyClient {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10; // Increased from 5
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.lastHeartbeat = null;
        this.neuralCanvas = null;
        this.neuralCtx = null;
        this.neurons = [];
        this.connections = [];
        this.animationId = null;
        
        // Configuration with protocol detection
        this.config = {
            websocketUrl: this.detectWebSocketUrl(),
            apiUrl: this.detectApiUrl(),
            reconnectDelay: 2000, // Reduced from 5000
            maxLogEntries: 100,
            heartbeatInterval: 30000, // 30 seconds
            connectionTimeout: 10000 // 10 seconds
        };
        
        this.init();
    }
    
    // Auto-detect appropriate WebSocket URL based on page protocol
    detectWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const port = window.location.protocol === 'https:' ? '3007' : '3009'; // SSL vs regular port
        return `${protocol}//${host}:${port}`;
    }
    
    // Auto-detect appropriate API URL based on page protocol
    detectApiUrl() {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
        const port = window.location.protocol === 'https:' ? (new URLSearchParams(window.location.search).get('httpsPort') || '3007') : (new URLSearchParams(window.location.search).get('httpPort') || '3008'); // SSL vs regular port
        return `${protocol}//${host}:${port}/api`;
    }
    
    init() {
        console.log('🧠 Initializing OGZ Prime Transparency Client...');
        this.setupNeuralVisualization();
        this.connectToTransparencyServer();
        this.startPeriodicUpdates();
        
        // Add event listeners
        window.addEventListener('beforeunload', () => this.disconnect());
        window.addEventListener('resize', () => this.resizeNeuralCanvas());
    }
    
    // Neural Network Visualization Setup
    setupNeuralVisualization() {
        this.neuralCanvas = document.getElementById('neural-visualization');
        if (!this.neuralCanvas) return;
        
        this.neuralCtx = this.neuralCanvas.getContext('2d');
        this.resizeNeuralCanvas();
        this.initializeNeurons();
        this.startNeuralAnimation();
    }
    
    resizeNeuralCanvas() {
        if (!this.neuralCanvas) return;
        
        const container = this.neuralCanvas.parentElement;
        this.neuralCanvas.width = container.clientWidth;
        this.neuralCanvas.height = container.clientHeight;
    }
    
    initializeNeurons() {
        this.neurons = [];
        this.connections = [];
        
        const layers = [4, 6, 8, 6, 3]; // Input -> Hidden -> Output layers
        const layerSpacing = this.neuralCanvas.width / (layers.length + 1);
        
        layers.forEach((nodeCount, layerIndex) => {
            const nodeSpacing = this.neuralCanvas.height / (nodeCount + 1);
            
            for (let i = 0; i < nodeCount; i++) {
                this.neurons.push({
                    x: layerSpacing * (layerIndex + 1),
                    y: nodeSpacing * (i + 1),
                    layer: layerIndex,
                    activation: Math.random(),
                    targetActivation: Math.random(),
                    radius: 8,
                    type: layerIndex === 0 ? 'input' : layerIndex === layers.length - 1 ? 'output' : 'hidden'
                });
            }
        });
        
        // Create connections between adjacent layers
        this.neurons.forEach((neuron, index) => {
            this.neurons.forEach((targetNeuron, targetIndex) => {
                if (targetNeuron.layer === neuron.layer + 1) {
                    this.connections.push({
                        from: index,
                        to: targetIndex,
                        weight: (Math.random() - 0.5) * 2,
                        activity: 0
                    });
                }
            });
        });
    }
    
    startNeuralAnimation() {
        const animate = () => {
            this.updateNeuralNetwork();
            this.drawNeuralNetwork();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateNeuralNetwork() {
        // Simulate neural activity
        this.neurons.forEach(neuron => {
            neuron.activation += (neuron.targetActivation - neuron.activation) * 0.1;
            
            // Occasionally change target activation
            if (Math.random() < 0.01) {
                neuron.targetActivation = Math.random();
            }
        });
        
        // Update connection activities
        this.connections.forEach(connection => {
            const fromNeuron = this.neurons[connection.from];
            const toNeuron = this.neurons[connection.to];
            connection.activity = fromNeuron.activation * Math.abs(connection.weight);
        });
    }
    
    drawNeuralNetwork() {
        if (!this.neuralCtx) return;
        
        const ctx = this.neuralCtx;
        ctx.clearRect(0, 0, this.neuralCanvas.width, this.neuralCanvas.height);
        
        // Draw connections
        this.connections.forEach(connection => {
            const fromNeuron = this.neurons[connection.from];
            const toNeuron = this.neurons[connection.to];
            
            ctx.beginPath();
            ctx.moveTo(fromNeuron.x, fromNeuron.y);
            ctx.lineTo(toNeuron.x, toNeuron.y);
            
            const opacity = connection.activity * 0.8 + 0.2;
            const color = connection.weight > 0 ? `rgba(34, 197, 94, ${opacity})` : `rgba(220, 38, 38, ${opacity})`;
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.abs(connection.weight) * 2 + 0.5;
            ctx.stroke();
        });
        
        // Draw neurons
        this.neurons.forEach(neuron => {
            ctx.beginPath();
            ctx.arc(neuron.x, neuron.y, neuron.radius, 0, 2 * Math.PI);
            
            const intensity = neuron.activation;
            let color;
            switch (neuron.type) {
                case 'input':
                    color = `rgba(255, 170, 0, ${intensity * 0.8 + 0.2})`;
                    break;
                case 'output':
                    color = `rgba(220, 38, 38, ${intensity * 0.8 + 0.2})`;
                    break;
                default:
                    color = `rgba(34, 197, 94, ${intensity * 0.8 + 0.2})`;
            }
            
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    // WebSocket Connection Management
    connectToTransparencyServer() {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting || this.isConnected) {
            console.log('⚠️ Connection already in progress or established');
            return;
        }
        
        this.isConnecting = true;
        this.clearReconnectTimer();
        
        try {
            console.log('🔌 Connecting to transparency server:', this.config.websocketUrl);
            this.websocket = new WebSocket(this.config.websocketUrl);
            
            // Connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
                    console.log('⏰ Connection timeout - closing websocket');
                    this.websocket.close();
                }
            }, this.config.connectionTimeout);
            
            this.websocket.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ Connected to transparency server');
                this.isConnected = true;
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.lastHeartbeat = Date.now();
                this.updateConnectionStatus('connected');
                
                // Start heartbeat monitoring
                this.startHeartbeat();
                
                // Subscribe to all transparency channels
                this.subscribe(['real-time-analysis', 'decision-updates', 'pattern-matches', 'risk-alerts', 'performance-updates', 'neural-mapping', 'confidence-changes', 'market-context']);
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.lastHeartbeat = Date.now();
                    this.handleTransparencyData(data);
                } catch (error) {
                    console.error('❌ Error parsing transparency data:', error);
                }
            };
            
            this.websocket.onclose = (event) => {
                clearTimeout(connectionTimeout);
                const wasConnected = this.isConnected;
                this.isConnected = false;
                this.isConnecting = false;
                this.stopHeartbeat();
                
                console.log(`❌ Transparency server connection closed (Code: ${event.code}, Reason: ${event.reason || 'Unknown'})`);
                
                if (wasConnected) {
                    this.updateConnectionStatus('disconnected');
                    this.addThoughtEntry({
                        type: 'analysis',
                        message: `🔌 CONNECTION: Lost connection to transparency server (Code: ${event.code})`
                    });
                }
                
                // Only auto-reconnect if it wasn't a manual close
                if (event.code !== 1000) {
                    this.scheduleReconnect();
                }
            };
            
            this.websocket.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('🚫 Transparency server error:', error);
                this.isConnecting = false;
                this.updateConnectionStatus('error');
                
                this.addThoughtEntry({
                    type: 'analysis',
                    message: `❌ CONNECTION: WebSocket error occurred`
                });
            };
            
        } catch (error) {
            this.isConnecting = false;
            console.error('🚫 Failed to create transparency connection:', error);
            this.updateConnectionStatus('error');
            this.scheduleReconnect();
        }
    }
    
    // Heartbeat monitoring to detect dead connections
    startHeartbeat() {
        this.stopHeartbeat(); // Clear any existing heartbeat
        
        this.heartbeatTimer = setInterval(() => {
            if (!this.isConnected || !this.websocket) {
                this.stopHeartbeat();
                return;
            }
            
            // Check if we've received any message recently
            const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
            if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
                console.log('💔 Heartbeat timeout - connection appears dead');
                this.websocket.close();
                return;
            }
            
            // Send ping to server
            try {
                this.websocket.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error('❌ Error sending heartbeat ping:', error);
                this.websocket.close();
            }
        }, this.config.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    
    subscribe(channels) {
        if (!this.isConnected || !this.websocket) {
            console.log('⚠️ Cannot subscribe - not connected');
            return;
        }
        
        // Subscribe to each channel individually (server expects individual subscriptions)
        channels.forEach(channel => {
            try {
                const subscribeMessage = {
                    type: 'subscribe',
                    channel: channel,
                    timestamp: Date.now()
                };
                
                this.websocket.send(JSON.stringify(subscribeMessage));
                console.log(`📡 Subscribed to transparency channel: ${channel}`);
            } catch (error) {
                console.error(`❌ Error subscribing to channel ${channel}:`, error);
            }
        });
    }
    
    // Handle incoming transparency data
    handleTransparencyData(data) {
        console.log('📊 Received transparency data:', data.type);
        
        switch (data.type) {
            case 'analysis_update':
                this.updateAnalysisDisplay(data.data);
                break;
            case 'decision_made':
                this.updateDecisionDisplay(data.data);
                break;
            case 'pattern_detected':
                this.updatePatternDisplay(data.data);
                break;
            case 'risk_assessment':
                this.updateRiskDisplay(data.data);
                break;
            case 'performance_update':
                this.updatePerformanceDisplay(data.data);
                break;
            case 'neural_activity':
                this.updateNeuralActivity(data.data);
                break;
            case 'thought_process':
                this.addThoughtEntry(data.data);
                break;
            default:
                console.log('⚠️ Unknown transparency data type:', data.type);
        }
    }
    
    // Update Analysis Display
    updateAnalysisDisplay(analysisData) {
        // Update market analysis node
        if (analysisData.marketScore !== undefined) {
            document.getElementById('market-score').textContent = analysisData.marketScore.toFixed(1);
            document.getElementById('market-confidence').textContent = `${(analysisData.marketConfidence * 100).toFixed(1)}% confidence`;
            
            const marketNode = document.getElementById('market-analysis');
            marketNode.className = analysisData.marketScore > 7 ? 'decision-node active' : 'decision-node';
        }
        
        // Update pattern recognition node
        if (analysisData.patternScore !== undefined) {
            document.getElementById('pattern-score').textContent = analysisData.patternScore.toFixed(1);
            document.getElementById('pattern-confidence').textContent = `${(analysisData.patternConfidence * 100).toFixed(1)}% confidence`;
            
            const patternNode = document.getElementById('pattern-recognition');
            patternNode.className = analysisData.patternScore > 7 ? 'decision-node active' : 'decision-node';
        }
        
        // Update risk assessment node
        if (analysisData.riskScore !== undefined) {
            document.getElementById('risk-score').textContent = analysisData.riskScore.toFixed(1);
            document.getElementById('risk-confidence').textContent = `${(analysisData.riskConfidence * 100).toFixed(1)}% confidence`;
            
            const riskNode = document.getElementById('risk-assessment');
            riskNode.className = analysisData.riskScore < 3 ? 'decision-node active' : 'decision-node';
        }
        
        // Add thought entry
        this.addThoughtEntry({
            type: 'analysis',
            message: `📊 ANALYSIS: Market: ${analysisData.marketScore?.toFixed(1) || '--'} | Pattern: ${analysisData.patternScore?.toFixed(1) || '--'} | Risk: ${analysisData.riskScore?.toFixed(1) || '--'}`
        });
    }
    
    // Update Decision Display
    updateDecisionDisplay(decisionData) {
        document.getElementById('decision-value').textContent = decisionData.decision.toUpperCase();
        document.getElementById('decision-confidence').textContent = `${(decisionData.confidence * 100).toFixed(1)}% confidence`;
        
        const decisionNode = document.getElementById('final-decision');
        decisionNode.className = decisionData.decision !== 'HOLD' ? 'decision-node active' : 'decision-node';
        
        // Update neural activity based on decision
        this.triggerNeuralActivity(decisionData.confidence);
        
        // Add thought entry
        this.addThoughtEntry({
            type: 'decision',
            message: `🎯 DECISION: ${decisionData.decision.toUpperCase()} (${(decisionData.confidence * 100).toFixed(1)}% confidence) - ${decisionData.reasoning}`
        });
    }
    
    // Update Pattern Display
    updatePatternDisplay(patternData) {
        patternData.patterns.forEach((pattern, index) => {
            const patternCard = document.getElementById(`pattern-${index + 1}`);
            const confSpan = document.getElementById(`pattern-${index + 1}-conf`);
            
            if (patternCard && confSpan) {
                confSpan.textContent = (pattern.confidence * 100).toFixed(1);
                patternCard.className = pattern.confidence > 0.7 ? 'pattern-card detected' : 'pattern-card';
            }
        });
        
        document.getElementById('pattern-matches').textContent = patternData.totalMatches;
        
        // Add thought entry
        this.addThoughtEntry({
            type: 'pattern',
            message: `🔍 PATTERNS: ${patternData.totalMatches} matches detected | Strongest: ${patternData.strongest?.name || 'None'} (${(patternData.strongest?.confidence * 100).toFixed(1)}%)`
        });
    }
    
    // Update Risk Display
    updateRiskDisplay(riskData) {
        // Update risk metrics
        if (riskData.positionSize) {
            document.getElementById('position-size-value').textContent = `${riskData.positionSize.toFixed(2)}%`;
            this.updateRiskItemClass('position-size', riskData.positionSize, [2, 5]); // Safe < 2%, Warning < 5%
        }
        
        if (riskData.stopLoss) {
            document.getElementById('stop-loss-value').textContent = `${riskData.stopLoss.toFixed(1)}%`;
            this.updateRiskItemClass('stop-loss', riskData.stopLoss, [2, 5]);
        }
        
        if (riskData.maxDrawdown) {
            document.getElementById('drawdown-value').textContent = `${riskData.maxDrawdown.toFixed(1)}%`;
            this.updateRiskItemClass('drawdown', riskData.maxDrawdown, [5, 10]);
        }
        
        if (riskData.riskReward) {
            document.getElementById('risk-reward-value').textContent = `1:${riskData.riskReward.toFixed(1)}`;
            this.updateRiskItemClass('risk-reward', riskData.riskReward, [2, 1.5]); // Good > 2, Warning < 1.5
        }
        
        document.getElementById('risk-level').textContent = riskData.overallRisk.toUpperCase();
        
        // Add thought entry
        this.addThoughtEntry({
            type: 'risk',
            message: `🛡️ RISK: ${riskData.overallRisk.toUpperCase()} | Position: ${riskData.positionSize?.toFixed(1)}% | Drawdown: ${riskData.maxDrawdown?.toFixed(1)}%`
        });
    }
    
    updateRiskItemClass(itemId, value, thresholds) {
        const item = document.getElementById(itemId);
        if (!item) return;
        
        let className = 'risk-item ';
        if (itemId === 'risk-reward') {
            // For risk-reward, higher is better
            if (value >= thresholds[0]) className += 'safe';
            else if (value >= thresholds[1]) className += 'warning';
            else className += 'danger';
        } else {
            // For other metrics, lower is better
            if (value <= thresholds[0]) className += 'safe';
            else if (value <= thresholds[1]) className += 'warning';
            else className += 'danger';
        }
        
        item.className = className;
    }
    
    // Update Performance Display
    updatePerformanceDisplay(performanceData) {
        if (performanceData.aiConfidence !== undefined) {
            document.getElementById('ai-confidence').textContent = `${(performanceData.aiConfidence * 100).toFixed(1)}%`;
        }
        
        if (performanceData.decisionSpeed !== undefined) {
            document.getElementById('decision-speed').textContent = `${performanceData.decisionSpeed}ms`;
        }
        
        if (performanceData.accuracyRate !== undefined) {
            document.getElementById('accuracy-rate').textContent = `${(performanceData.accuracyRate * 100).toFixed(1)}%`;
        }
    }
    
    // Update Neural Activity
    updateNeuralActivity(neuralData) {
        // Update neural network visualization based on AI activity
        if (neuralData.inputActivations) {
            neuralData.inputActivations.forEach((activation, index) => {
                if (this.neurons[index]) {
                    this.neurons[index].targetActivation = activation;
                }
            });
        }
        
        if (neuralData.outputActivations) {
            const outputStartIndex = this.neurons.length - neuralData.outputActivations.length;
            neuralData.outputActivations.forEach((activation, index) => {
                if (this.neurons[outputStartIndex + index]) {
                    this.neurons[outputStartIndex + index].targetActivation = activation;
                }
            });
        }
    }
    
    triggerNeuralActivity(intensity) {
        // Trigger a wave of activity through the neural network
        this.neurons.forEach((neuron, index) => {
            setTimeout(() => {
                neuron.targetActivation = intensity * (0.5 + Math.random() * 0.5);
            }, index * 50);
        });
    }
    
    // Add Thought Entry
    addThoughtEntry(thoughtData) {
        const thoughtStream = document.getElementById('thought-stream');
        if (!thoughtStream) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `thought-entry ${thoughtData.type}`;
        entry.innerHTML = `<span class="thought-time">[${timestamp}]</span> ${thoughtData.message}`;
        
        thoughtStream.insertBefore(entry, thoughtStream.firstChild);
        
        // Keep only last 50 entries
        while (thoughtStream.children.length > 50) {
            thoughtStream.removeChild(thoughtStream.lastChild);
        }
        
        // Auto-scroll to top for new entries
        thoughtStream.scrollTop = 0;
    }
    
    // Connection Status Management
    updateConnectionStatus(status) {
        const badge = document.getElementById('transparency-badge');
        const alert = document.getElementById('connection-alert');
        const title = document.getElementById('connection-title');
        const message = document.getElementById('connection-message');
        
        switch (status) {
            case 'connected':
                badge.textContent = '🧠 AI BRAIN CONNECTED';
                alert.className = 'connection-alert connected';
                title.className = 'connection-title connected';
                title.textContent = '✅ AI Transparency System Online';
                message.textContent = 'Live connection established. Receiving real-time AI brain data.';
                
                // Update all status dots
                this.updateStatusDots('online');
                break;
                
            case 'disconnected':
                badge.textContent = '🔴 AI BRAIN DISCONNECTED';
                alert.className = 'connection-alert';
                title.className = 'connection-title';
                title.textContent = '⚠️ Connection Lost';
                message.textContent = 'Lost connection to AI transparency system. Attempting to reconnect...';
                
                this.updateStatusDots('offline');
                break;
                
            case 'error':
                badge.textContent = '❌ CONNECTION ERROR';
                alert.className = 'connection-alert';
                title.className = 'connection-title';
                title.textContent = '❌ Connection Error';
                message.textContent = 'Cannot connect to transparency system. Please check if the server is running.';
                
                this.updateStatusDots('offline');
                break;
        }
    }
    
    updateStatusDots(status) {
        const dots = ['neural-dot', 'thought-dot', 'risk-dot'];
        const statusTexts = ['neural-status', 'thought-status', 'risk-status'];
        
        dots.forEach((dotId, index) => {
            const dot = document.getElementById(dotId);
            const statusText = document.getElementById(statusTexts[index]);
            
            if (dot) {
                dot.className = `status-dot ${status}`;
            }
            
            if (statusText) {
                statusText.textContent = status === 'online' ? 'Active' : 'Offline';
            }
        });
    }
    
    // Reconnection Logic
    scheduleReconnect() {
        // Clear any existing reconnect timer
        this.clearReconnectTimer();
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            this.addThoughtEntry({
                type: 'analysis',
                message: `❌ SYSTEM: Max reconnection attempts (${this.maxReconnectAttempts}) reached. Manual reconnect required.`
            });
            this.updateConnectionStatus('error');
            return;
        }
        
        this.reconnectAttempts++;
        
        // Exponential backoff with jitter
        const baseDelay = Math.min(this.config.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const delay = baseDelay + jitter;
        
        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay/1000)}s`);
        
        this.addThoughtEntry({
            type: 'analysis',
            message: `🔄 SYSTEM: Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay/1000)}s...`
        });
        
        this.reconnectTimer = setTimeout(() => {
            if (!this.isConnected && !this.isConnecting) {
                this.connectToTransparencyServer();
            }
        }, delay);
    }
    
    // Periodic Updates
    startPeriodicUpdates() {
        // Fetch full transparency data every 30 seconds
        setInterval(() => {
            this.fetchFullTransparencyData();
        }, 30000);
        
        // Initial fetch
        setTimeout(() => {
            this.fetchFullTransparencyData();
        }, 2000);
    }
    
    async fetchFullTransparencyData() {
        try {
            const response = await fetch(`${this.config.apiUrl}/full-transparency`);
            if (response.ok) {
                const data = await response.json();
                this.handleFullTransparencyData(data);
            }
        } catch (error) {
            console.error('❌ Error fetching transparency data:', error);
        }
    }
    
    handleFullTransparencyData(data) {
        console.log('📊 Received full transparency data');
        
        if (data.analysis) this.updateAnalysisDisplay(data.analysis);
        if (data.decision) this.updateDecisionDisplay(data.decision);
        if (data.patterns) this.updatePatternDisplay(data.patterns);
        if (data.risk) this.updateRiskDisplay(data.risk);
        if (data.performance) this.updatePerformanceDisplay(data.performance);
    }
    
    // Public Methods for Controls
    reconnect() {
        this.reconnectAttempts = 0;
        this.disconnect();
        setTimeout(() => {
            this.connectToTransparencyServer();
        }, 1000);
    }
    
    refresh() {
        this.fetchFullTransparencyData();
        this.addThoughtEntry({
            type: 'analysis',
            message: '🔄 SYSTEM: Manual refresh requested - fetching latest data...'
        });
    }
    
    exportData() {
        // Export current transparency data
        const data = {
            timestamp: new Date().toISOString(),
            analysis: this.getCurrentAnalysisData(),
            thoughts: this.getCurrentThoughts(),
            performance: this.getCurrentPerformanceData()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ogz-transparency-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.addThoughtEntry({
            type: 'analysis',
            message: '💾 SYSTEM: Transparency data exported successfully'
        });
    }
    
    getCurrentAnalysisData() {
        return {
            marketScore: document.getElementById('market-score').textContent,
            patternScore: document.getElementById('pattern-score').textContent,
            riskScore: document.getElementById('risk-score').textContent,
            decision: document.getElementById('decision-value').textContent
        };
    }
    
    getCurrentThoughts() {
        const thoughtStream = document.getElementById('thought-stream');
        const thoughts = [];
        
        Array.from(thoughtStream.children).forEach(entry => {
            thoughts.push(entry.textContent);
        });
        
        return thoughts;
    }
    
    getCurrentPerformanceData() {
        return {
            aiConfidence: document.getElementById('ai-confidence').textContent,
            decisionSpeed: document.getElementById('decision-speed').textContent,
            accuracyRate: document.getElementById('accuracy-rate').textContent,
            patternMatches: document.getElementById('pattern-matches').textContent,
            riskLevel: document.getElementById('risk-level').textContent
        };
    }
    
    disconnect() {
        console.log('🔌 Disconnecting transparency client...');
        
        // Clear all timers
        this.clearReconnectTimer();
        this.stopHeartbeat();
        
        // Close websocket connection
        if (this.websocket) {
            this.websocket.close(1000, 'Manual disconnect');
            this.websocket = null;
        }
        
        // Stop neural animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Reset connection state
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastHeartbeat = null;
        
        this.updateConnectionStatus('disconnected');
    }
}

// Global functions for button controls
function reconnectTransparency() {
    if (window.transparencyClient) {
        window.transparencyClient.reconnect();
    }
}

function refreshTransparency() {
    if (window.transparencyClient) {
        window.transparencyClient.refresh();
    }
}

function exportData() {
    if (window.transparencyClient) {
        window.transparencyClient.exportData();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing OGZ Prime Transparency Dashboard...');
    window.transparencyClient = new TransparencyClient();
});