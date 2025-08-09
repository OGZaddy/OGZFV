// ==========================================
// FILE: train-mover.js
// Script to train The Mover on massive markdown datasets
// ==========================================
const MoverCore = require('./mover-core');
const MoverMemory = require('./mover-memory'); // Use FULL memory, not VPS limited
const MoverTrainingSystem = require('./mover-training-system');
const path = require('path');

class MoverTrainer {
  constructor() {
    console.log('[MoverTrainer] Initializing FULL CAPACITY training system...');
    
    // Use UNLIMITED memory for training (not VPS limited)
    this.moverMemory = new MoverMemory({
      memoryDir: './training-memory',
      maxMemorySize: Infinity,        // UNLIMITED for training
      maxShortTermEvents: Infinity,   // UNLIMITED for training
      persistInterval: 60000,         // 1 minute for training
      compressionThreshold: 50000,    // Compress after 50k events
      enableLongTermCompression: true,
      enableAdvancedPatternDetection: true
    });
    
    this.moverCore = new MoverCore({
      personality: 'training_mode',
      enableAdvancedLearning: true,
      unlimitedMemory: true
    });
    
    this.trainingSystem = new MoverTrainingSystem(this.moverCore, this.moverMemory);
    
    console.log('[MoverTrainer] Training system initialized with UNLIMITED capacity');
  }

  async trainOnMarkdown(dataPath) {
    console.log(`\n🧠 THE MOVER TRAINING SYSTEM 🧠`);
    console.log(`======================================`);
    console.log(`Training data path: ${dataPath}`);
    console.log(`Memory limit: UNLIMITED`);
    console.log(`Expected capacity: 1M+ lines`);
    console.log(`======================================\n`);
    
    try {
      const startTime = Date.now();
      
      // Train on the massive markdown corpus
      const report = await this.trainingSystem.trainOnMarkdownCorpus(dataPath);
      
      const endTime = Date.now();
      const totalTime = Math.round((endTime - startTime) / 1000);
      
      console.log(`\n🎯 TRAINING COMPLETE! 🎯`);
      console.log(`======================================`);
      console.log(`Total time: ${totalTime} seconds`);
      console.log(`Lines processed: ${report.summary.totalLinesProcessed.toLocaleString()}`);
      console.log(`Files processed: ${report.summary.totalFiles}`);
      console.log(`Knowledge extracted: ${report.summary.knowledgeExtracted.toLocaleString()}`);
      console.log(`Patterns detected: ${report.summary.patternsDetected.toLocaleString()}`);
      console.log(`Average speed: ${report.summary.averageSpeed}`);
      console.log(`======================================\n`);
      
      console.log(`📊 KNOWLEDGE BREAKDOWN:`);
      console.log(`Trading Concepts: ${report.knowledgeBreakdown.tradingConcepts.toLocaleString()}`);
      console.log(`Strategies: ${report.knowledgeBreakdown.strategies.toLocaleString()}`);
      console.log(`Technical Analysis: ${report.knowledgeBreakdown.technicalAnalysis.toLocaleString()}`);
      console.log(`Market Insights: ${report.knowledgeBreakdown.marketInsights.toLocaleString()}`);
      console.log(`Personality Traits: ${report.knowledgeBreakdown.personalityTraits.toLocaleString()}\n`);
      
      console.log(`📈 QUALITY METRICS:`);
      console.log(`Avg Concept Confidence: ${report.quality.averageConceptConfidence}`);
      console.log(`Avg Strategy Effectiveness: ${report.quality.averageStrategyEffectiveness}`);
      console.log(`Avg Pattern Reliability: ${report.quality.averagePatternReliability}\n`);
      
      // Test The Mover's new knowledge
      await this.testTrainedKnowledge();
      
      return report;
      
    } catch (error) {
      console.error('[MoverTrainer] Training failed:', error);
      throw error;
    }
  }

  async testTrainedKnowledge() {
    console.log(`🧪 TESTING TRAINED KNOWLEDGE:`);
    console.log(`======================================`);
    
    const testQueries = [
      'support and resistance',
      'trading strategy',
      'risk management', 
      'price action',
      'bullish pattern'
    ];
    
    for (const query of testQueries) {
      const results = this.trainingSystem.queryKnowledge(query, 'all', 3);
      console.log(`\nQuery: "${query}"`);
      console.log(`Results found: ${results.length}`);
      
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. [${result.category}] ${result.content.substring(0, 100)}...`);
        console.log(`     Source: ${result.source} | Score: ${result.score.toFixed(3)}`);
      });
    }
    
    console.log(`\n✅ Knowledge test complete!\n`);
  }

  async exportTrainedModel() {
    console.log(`📦 EXPORTING TRAINED MODEL:`);
    
    const modelData = {
      metadata: {
        trainingDate: new Date().toISOString(),
        totalKnowledge: this.trainingSystem.knowledgeBase.tradingConcepts.size + 
                       this.trainingSystem.knowledgeBase.strategies.size +
                       this.trainingSystem.knowledgeBase.technicalAnalysis.size +
                       this.trainingSystem.knowledgeBase.marketInsights.size +
                       this.trainingSystem.knowledgeBase.personalityTraits.size,
        memoryStats: this.moverMemory.getMemoryStats()
      },
      
      knowledgeBase: {
        tradingConcepts: Array.from(this.trainingSystem.knowledgeBase.tradingConcepts.values()),
        strategies: Array.from(this.trainingSystem.knowledgeBase.strategies.values()),
        technicalAnalysis: Array.from(this.trainingSystem.knowledgeBase.technicalAnalysis.values()),
        marketInsights: Array.from(this.trainingSystem.knowledgeBase.marketInsights.values()),
        personalityTraits: Array.from(this.trainingSystem.knowledgeBase.personalityTraits.values())
      },
      
      corePersonality: this.moverCore.getPersonalitySnapshot(),
      memorySnapshot: this.moverMemory.createFullSnapshot()
    };
    
    const exportPath = `./trained-models/mover-trained-${Date.now()}.json`;
    const fs = require('fs').promises;
    await fs.mkdir('./trained-models', { recursive: true });
    await fs.writeFile(exportPath, JSON.stringify(modelData, null, 2));
    
    console.log(`✅ Model exported to: ${exportPath}`);
    console.log(`📊 Model size: ${(JSON.stringify(modelData).length / 1024 / 1024).toFixed(2)} MB`);
    
    return exportPath;
  }
}

// Main execution
async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node train-mover.js <path-to-markdown-data>');
    console.log('');
    console.log('Examples:');
    console.log('  node train-mover.js ./training-data/');
    console.log('  node train-mover.js ./massive-markdown-corpus.md');
    console.log('  node train-mover.js ../trading-knowledge/');
    process.exit(1);
  }
  
  const dataPath = process.argv[2];
  
  try {
    const trainer = new MoverTrainer();
    
    // Train on the provided data
    const report = await trainer.trainOnMarkdown(dataPath);
    
    // Export the trained model
    const modelPath = await trainer.exportTrainedModel();
    
    console.log(`\n🚀 TRAINING COMPLETE!`);
    console.log(`======================================`);
    console.log(`The Mover has been successfully trained on your markdown corpus.`);
    console.log(`Trained model saved to: ${modelPath}`);
    console.log(`\nTo use the trained model in production:`);
    console.log(`1. Copy the knowledge files to your VPS`);
    console.log(`2. Load them into the production Mover system`);
    console.log(`3. The Mover will now have all the training knowledge!`);
    console.log(`======================================\n`);
    
  } catch (error) {
    console.error('Training failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MoverTrainer;
