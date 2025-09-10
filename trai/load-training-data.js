const fs = require('fs');
const path = require('path');

// Function to load all training data
async function loadTrainingData() {
    const trainingDataPath = path.join(__dirname, 'training-data-clean');
    const categories = ['architecture', 'brainstorming', 'casual_chat', 'development', 'emotions', 'problem_solving', 'rants', 'training'];
    
    const allTrainingData = {
        memory: [],
        tradingKnowledge: [],
        architecture: [],
        categories: {}
    };
    
    console.log('🧠 Loading TRAI training data...');
    
    for (const category of categories) {
        const categoryPath = path.join(trainingDataPath, category);
        allTrainingData.categories[category] = [];
        
        try {
            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                const filePath = path.join(categoryPath, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        // Add to general memory
                        allTrainingData.memory.push({
                            category,
                            timestamp: item.timestamp || item.created_at || Date.now(),
                            data: item.text || item.content,
                            source: item.source || 'training',
                            type: category
                        });
                        
                        // Add to specific categories
                        allTrainingData.categories[category].push(item);
                        
                        // Special handling for architecture and development
                        if (category === 'architecture') {
                            allTrainingData.architecture.push({
                                component: item.text || item.content,
                                learned_at: Date.now()
                            });
                        }
                        
                        // Trading related content
                        if (item.text && (item.text.includes('trading') || item.text.includes('bot') || item.text.includes('market'))) {
                            allTrainingData.tradingKnowledge.push({
                                knowledge: item.text,
                                category,
                                timestamp: Date.now()
                            });
                        }
                    });
                }
            }
            
            console.log(`  ✓ Loaded ${allTrainingData.categories[category].length} ${category} messages`);
        } catch (error) {
            console.error(`  ✗ Error loading ${category}:`, error.message);
        }
    }
    
    // Create optimized memory file for TRAI
    const traiMemory = {
        memory: allTrainingData.memory.slice(-10000), // Keep last 10k for memory
        tradingKnowledge: allTrainingData.tradingKnowledge.slice(-1000),
        architecture: allTrainingData.architecture.slice(-500),
        timestamp: Date.now(),
        stats: {
            total_memories: allTrainingData.memory.length,
            trading_knowledge: allTrainingData.tradingKnowledge.length,
            architecture_items: allTrainingData.architecture.length,
            categories: Object.fromEntries(
                Object.entries(allTrainingData.categories).map(([k, v]) => [k, v.length])
            )
        }
    };
    
    // Save to TRAI memory file
    const memoryPath = path.join(__dirname, 'trai-memory.json');
    fs.writeFileSync(memoryPath, JSON.stringify(traiMemory, null, 2));
    
    console.log('\n📊 Training Data Summary:');
    console.log(`  Total memories: ${traiMemory.stats.total_memories}`);
    console.log(`  Trading knowledge: ${traiMemory.stats.trading_knowledge}`);
    console.log(`  Architecture items: ${traiMemory.stats.architecture_items}`);
    console.log('\n💾 Memory saved to:', memoryPath);
    
    return traiMemory;
}

// Run if called directly
if (require.main === module) {
    loadTrainingData().then(() => {
        console.log('\n✅ Training data loaded successfully!');
    }).catch(error => {
        console.error('\n❌ Failed to load training data:', error);
    });
}

module.exports = loadTrainingData;