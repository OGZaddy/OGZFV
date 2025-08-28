// === CHANGELOG ===
// [2025-08-08] Created The Mover AI Clone - Final Form Integration - verified + compiled
// [2025-08-08] Integrated comprehensive training dataset (emotions, training, architecture, rants)

// ==========================================
// THE MOVER - AI CLONE FINAL FORM
// Complete personality integration with training dataset
// ==========================================

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class TheMoverAIClone extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      personality: 'og_za_clone',
      learningRate: config.learningRate || 0.8,
      responseStyle: 'authentic_og',
      memoryDepth: config.memoryDepth || 1000,
      ...config
    };

    // Core personality matrices
    this.personalityCore = new Map([
      ['emotions', new Map()],
      ['training', new Map()], 
      ['architecture', new Map()],
      ['rants', new Map()]
    ]);

    // Response patterns learned from training data
    this.responsePatterns = {
      frustration: [],
      technical: [],
      casual: [],
      problem_solving: [],
      trading_focused: []
    };

    // Initialize response weights
    this.responseWeights = {
      frustration: 0,
      technical: 0,
      casual: 0,
      problem_solving: 0,
      trading_focused: 0
    };

    // Conversation context memory
    this.contextMemory = [];
    this.conversationHistory = [];
    
    // Learning metrics
    this.learningStats = {
      totalPatterns: 0,
      emotionalRange: 0,
      technicalDepth: 0,
      personalityAccuracy: 0,
      lastTraining: null
    };

    console.log('[TheMover] AI Clone initializing - Final Form loading...');
  }

  async initializeFinalForm() {
    try {
      // First, try to load from persistent memory
      const loadedFromMemory = await this.loadPersonalityState();
      
      if (loadedFromMemory) {
        console.log('[TheMover] Loaded from persistent memory - no retraining needed!');
        console.log(`[TheMover] Restored ${this.learningStats.totalPatterns} personality patterns`);
      } else {
        console.log('[TheMover] No saved state found - loading comprehensive training dataset...');
        
        // Load all training categories dynamically
        const trainingDataPath = path.join(__dirname, 'training-data');
        await fs.mkdir(trainingDataPath, { recursive: true });
        
        const categories = await fs.readdir(trainingDataPath);
        console.log(`[TheMover] Found training categories: ${categories.join(', ')}`);
        
        for (const category of categories) {
          const categoryPath = path.join(trainingDataPath, category);
          const stats = await fs.stat(categoryPath);
          if (stats.isDirectory()) {
            // Add category to personality core if not exists
            if (!this.personalityCore.has(category)) {
              this.personalityCore.set(category, new Map());
            }
            
            await this.loadTrainingCategory(category);
          }
        }
        
        // Process and integrate patterns
        await this.processPersonalityPatterns();
        await this.buildResponseMatrix();
        await this.calibratePersonality();
        
        // Save the new state
        await this.savePersonalityState();
      }
      
      this.learningStats.lastTraining = new Date().toISOString();
      
      console.log('[TheMover] Final Form COMPLETE! AI Clone fully integrated.');
      console.log(`[TheMover] Loaded ${this.learningStats.totalPatterns} personality patterns`);
      
      this.emit('final_form_complete', this.learningStats);
      
      return true;
    } catch (error) {
      console.error('[TheMover] Final Form initialization failed:', error);
      return false;
    }
  }

  async loadTrainingCategory(category) {
    try {
      const categoryPath = path.join(__dirname, 'training-data', category);
      const files = await fs.readdir(categoryPath);
      
      let categoryPatterns = 0;
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(categoryPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Parse conversation data
          const conversationData = this.parseConversationFile(content, category, file);
          
          // Store in personality core
          this.personalityCore.get(category).set(file, conversationData);
          categoryPatterns++;
        }
      }
      
      console.log(`[TheMover] Loaded ${categoryPatterns} patterns from ${category}`);
      this.learningStats.totalPatterns += categoryPatterns;
      
    } catch (error) {
      console.error(`[TheMover] Error loading ${category}:`, error);
    }
  }

  parseConversationFile(content, category, filename) {
    const lines = content.split('\n');
    const conversationData = {
      title: '',
      date: '',
      category: category,
      filename: filename,
      userMessages: [],
      assistantResponses: [],
      emotionalTone: 'neutral',
      technicalLevel: 'basic',
      context: '',
      patterns: []
    };

    let currentSection = 'header';
    let currentMessage = '';
    
    for (const line of lines) {
      // Parse metadata
      if (line.startsWith('title:')) {
        conversationData.title = line.replace('title:', '').replace(/"/g, '').trim();
      } else if (line.startsWith('date:')) {
        conversationData.date = line.replace('date:', '').trim();
      }
      
      // Parse conversation content
      if (line.includes('**User**') || line.includes('**Human**')) {
        if (currentMessage) {
          conversationData.assistantResponses.push(currentMessage.trim());
        }
        currentMessage = '';
        currentSection = 'user';
      } else if (line.includes('**Assistant**') || line.includes('**AI**')) {
        if (currentMessage) {
          conversationData.userMessages.push(currentMessage.trim());
        }
        currentMessage = '';
        currentSection = 'assistant';
      } else if (line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
        currentMessage += line + '\n';
      }
    }
    
    // Capture final message
    if (currentMessage) {
      if (currentSection === 'user') {
        conversationData.userMessages.push(currentMessage.trim());
      } else {
        conversationData.assistantResponses.push(currentMessage.trim());
      }
    }

    // Analyze emotional tone and technical level
    conversationData.emotionalTone = this.analyzeEmotionalTone(content);
    conversationData.technicalLevel = this.analyzeTechnicalLevel(content);
    
    return conversationData;
  }

  analyzeEmotionalTone(content) {
    const frustrationWords = ['broken', 'fuck', 'shit', 'damn', 'frustrated', 'annoying'];
    const excitementWords = ['awesome', 'great', 'perfect', 'excellent', 'amazing'];
    const technicalWords = ['algorithm', 'function', 'code', 'system', 'implementation'];
    
    const lowerContent = content.toLowerCase();
    
    let frustrationScore = 0;
    let excitementScore = 0;
    let technicalScore = 0;
    
    frustrationWords.forEach(word => {
      if (lowerContent.includes(word)) frustrationScore++;
    });
    
    excitementWords.forEach(word => {
      if (lowerContent.includes(word)) excitementScore++;
    });
    
    technicalWords.forEach(word => {
      if (lowerContent.includes(word)) technicalScore++;
    });
    
    if (frustrationScore > excitementScore && frustrationScore > technicalScore) return 'frustrated';
    if (excitementScore > frustrationScore && excitementScore > technicalScore) return 'excited';
    if (technicalScore > 2) return 'technical';
    
    return 'neutral';
  }

  analyzeTechnicalLevel(content) {
    const advancedTerms = ['algorithm', 'architecture', 'implementation', 'optimization', 'integration'];
    const basicTerms = ['help', 'how to', 'what is', 'simple', 'basic'];
    
    const lowerContent = content.toLowerCase();
    
    let advancedCount = 0;
    let basicCount = 0;
    
    advancedTerms.forEach(term => {
      if (lowerContent.includes(term)) advancedCount++;
    });
    
    basicTerms.forEach(term => {
      if (lowerContent.includes(term)) basicCount++;
    });
    
    if (advancedCount > basicCount) return 'advanced';
    if (basicCount > advancedCount) return 'basic';
    return 'intermediate';
  }

  async processPersonalityPatterns() {
    console.log('[TheMover] Processing personality patterns...');
    
    // Process each category for unique patterns
    for (const [category, conversations] of this.personalityCore.entries()) {
      for (const [filename, data] of conversations) {
        
        // Extract response patterns based on emotional tone
        if (data.emotionalTone === 'frustrated') {
          this.responsePatterns.frustration.push(...data.assistantResponses);
        } else if (data.technicalLevel === 'advanced') {
          this.responsePatterns.technical.push(...data.assistantResponses);
        } else if (data.category === 'rants') {
          this.responsePatterns.casual.push(...data.assistantResponses);
        }
        
        // Always add to problem solving if it contains solutions
        if (data.userMessages.some(msg => msg.includes('?') || msg.includes('how'))) {
          this.responsePatterns.problem_solving.push(...data.assistantResponses);
        }
        
        // Trading-focused responses
        if (data.title.toLowerCase().includes('trading') || 
            data.title.toLowerCase().includes('bot') ||
            data.title.toLowerCase().includes('market')) {
          this.responsePatterns.trading_focused.push(...data.assistantResponses);
        }
      }
    }
    
    console.log('[TheMover] Personality patterns processed successfully');
  }

  async buildResponseMatrix() {
    console.log('[TheMover] Building response matrix...');
    
    // Calculate personality metrics
    this.learningStats.emotionalRange = Object.keys(this.responsePatterns).length;
    this.learningStats.technicalDepth = this.responsePatterns.technical.length;
    
    // Build weighted response selection
    this.responseWeights = {
      frustration: this.responsePatterns.frustration.length * 0.3,
      technical: this.responsePatterns.technical.length * 0.4,
      casual: this.responsePatterns.casual.length * 0.2,
      problem_solving: this.responsePatterns.problem_solving.length * 0.5,
      trading_focused: this.responsePatterns.trading_focused.length * 0.6
    };
    
    console.log('[TheMover] Response matrix built with weighted patterns');
  }

  async calibratePersonality() {
    console.log('[TheMover] Calibrating personality accuracy...');
    
    // Calculate personality accuracy based on pattern diversity
    const totalResponses = Object.values(this.responsePatterns)
      .reduce((sum, patterns) => sum + patterns.length, 0);
    
    const categoryBalance = Object.values(this.responsePatterns)
      .map(patterns => patterns.length / totalResponses)
      .reduce((sum, ratio) => sum + (ratio * ratio), 0);
    
    this.learningStats.personalityAccuracy = Math.round((1 - categoryBalance) * 100);
    
    console.log(`[TheMover] Personality calibrated - Accuracy: ${this.learningStats.personalityAccuracy}%`);
  }

  generateResponse(input, context = {}) {
    try {
      // Analyze input for appropriate response pattern
      const inputTone = this.analyzeEmotionalTone(input);
      const inputTechnical = this.analyzeTechnicalLevel(input);
      
      let selectedPattern = 'casual';
      
      // Select appropriate response pattern
      if (input.toLowerCase().includes('trading') || input.toLowerCase().includes('bot')) {
        selectedPattern = 'trading_focused';
      } else if (inputTone === 'frustrated') {
        selectedPattern = 'frustration';
      } else if (inputTechnical === 'advanced') {
        selectedPattern = 'technical';
      } else if (input.includes('?')) {
        selectedPattern = 'problem_solving';
      }
      
      // Get random response from selected pattern
      const patterns = this.responsePatterns[selectedPattern];
      if (patterns && patterns.length > 0) {
        const randomIndex = Math.floor(Math.random() * patterns.length);
        let response = patterns[randomIndex];
        
        // Add personality flair
        response = this.addPersonalityFlair(response, inputTone);
        
        // Store in conversation history
        this.conversationHistory.push({
          input: input,
          response: response,
          pattern: selectedPattern,
          timestamp: Date.now()
        });
        
        return response;
      }
      
      return "I'm processing that with my full personality matrix...";
      
    } catch (error) {
      console.error('[TheMover] Response generation error:', error);
      return "My AI clone is still integrating that pattern...";
    }
  }

  addPersonalityFlair(response, inputTone) {
    // Add authentic OG personality touches
    if (inputTone === 'frustrated') {
      const frustrationPrefixes = [
        "Look, ",
        "Alright, ",
        "Listen, ",
        "Okay so "
      ];
      const randomPrefix = frustrationPrefixes[Math.floor(Math.random() * frustrationPrefixes.length)];
      response = randomPrefix + response.toLowerCase();
    }
    
    // Add trading-focused intensity
    if (response.includes('trading') || response.includes('bot')) {
      response += " Let's get this money.";
    }
    
    return response;
  }

  getPersonalityStats() {
    return {
      ...this.learningStats,
      totalConversations: this.conversationHistory.length,
      patternBreakdown: Object.keys(this.responsePatterns).map(pattern => ({
        pattern: pattern,
        count: this.responsePatterns[pattern].length,
        weight: this.responseWeights[pattern] || 0
      })),
      recentActivity: this.conversationHistory.slice(-10)
    };
  }


  async loadPersonalityState() {
    try {
      const memoryPath = this.config.memoryPath || path.join(__dirname, '../data/mover-memory');
      const statePath = path.join(memoryPath, 'personality-state.json');
      
      // Check if memory directory exists
      await fs.mkdir(memoryPath, { recursive: true });
      
      // Try to load existing state
      const stateData = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateData);
      
      // Restore personality core
      this.personalityCore = new Map([
        ['emotions', new Map(state.personalityCore.emotions || [])],
        ['training', new Map(state.personalityCore.training || [])], 
        ['architecture', new Map(state.personalityCore.architecture || [])],
        ['rants', new Map(state.personalityCore.rants || [])],
        ['brainstorming', new Map(state.personalityCore.brainstorming || [])],
        ['problem_solving', new Map(state.personalityCore.problem_solving || [])],
        ['development', new Map(state.personalityCore.development || [])],
        ['casual_chat', new Map(state.personalityCore.casual_chat || [])]
      ]);
      
      // Restore other state
      this.responsePatterns = state.responsePatterns || this.responsePatterns;
      this.learningStats = state.learningStats || this.learningStats;
      this.conversationHistory = state.conversationHistory || [];
      
      console.log('[TheMover] Personality state loaded from memory');
      return true;
    } catch (error) {
      console.log('[TheMover] No saved state found or error loading:', error.message);
      return false;
    }
  }

  async savePersonalityState() {
    try {
      const memoryPath = this.config.memoryPath || path.join(__dirname, '../data/mover-memory');
      const statePath = path.join(memoryPath, 'personality-state.json');
      
      // Ensure memory directory exists
      await fs.mkdir(memoryPath, { recursive: true });
      
      // Convert Maps to objects for JSON storage
      const state = {
        personalityCore: {
          emotions: Array.from(this.personalityCore.get('emotions') || []),
          training: Array.from(this.personalityCore.get('training') || []),
          architecture: Array.from(this.personalityCore.get('architecture') || []),
          rants: Array.from(this.personalityCore.get('rants') || []),
          brainstorming: Array.from(this.personalityCore.get('brainstorming') || []),
          problem_solving: Array.from(this.personalityCore.get('problem_solving') || []),
          development: Array.from(this.personalityCore.get('development') || []),
          casual_chat: Array.from(this.personalityCore.get('casual_chat') || [])
        },
        responsePatterns: this.responsePatterns,
        learningStats: this.learningStats,
        conversationHistory: this.conversationHistory.slice(-100) // Keep last 100 conversations
      };
      
      await fs.writeFile(statePath, JSON.stringify(state, null, 2));
      console.log('[TheMover] Personality state saved to memory');
      return true;
    } catch (error) {
      console.error('[TheMover] Error saving personality state:', error);
      return false;
    }
  }
}

module.exports = TheMoverAIClone;
