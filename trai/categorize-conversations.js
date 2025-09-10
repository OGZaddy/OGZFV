const fs = require('fs');
const path = require('path');

// TRAI's 8 memory categories
const CATEGORIES = {
    architecture: ['system', 'design', 'structure', 'component', 'module', 'api', 'database', 'infrastructure', 'deployment', 'server', 'websocket', 'ssl', 'config'],
    brainstorming: ['idea', 'what if', 'could we', 'should we', 'consider', 'possibility', 'alternative', 'option', 'think about', 'explore'],
    casual_chat: ['hello', 'hi', 'hey', 'how are', 'thanks', 'thank you', 'bye', 'goodbye', 'lol', 'haha', 'nice', 'cool', 'awesome'],
    development: ['code', 'function', 'implement', 'debug', 'error', 'fix', 'build', 'compile', 'test', 'git', 'commit', 'push', 'branch'],
    emotions: ['feel', 'happy', 'sad', 'angry', 'frustrated', 'excited', 'worried', 'stress', 'love', 'hate', 'afraid', 'nervous'],
    problem_solving: ['issue', 'problem', 'bug', 'solve', 'solution', 'why', 'how to', 'troubleshoot', 'diagnose', 'resolve', 'broken'],
    rants: ['stupid', 'annoying', 'waste', 'terrible', 'awful', 'ridiculous', 'insane', 'crazy', 'bullshit', 'damn', 'fuck', 'shit'],
    training: ['learn', 'teach', 'explain', 'understand', 'concept', 'tutorial', 'guide', 'documentation', 'example', 'practice', 'knowledge']
};

// Load conversations
console.log('Loading conversations.json...');
const conversations = JSON.parse(fs.readFileSync('/home/trey/OGZFV-valhalla/trai/conversations.json', 'utf8'));

// Initialize category storage
const categorizedData = {
    architecture: [],
    brainstorming: [],
    casual_chat: [],
    development: [],
    emotions: [],
    problem_solving: [],
    rants: [],
    training: []
};

// Stats tracking
const stats = {
    total_conversations: conversations.length,
    total_messages: 0,
    empty_conversations: 0,
    categorized_messages: 0,
    uncategorized_messages: 0
};

// Function to categorize a message
function categorizeMessage(message) {
    if (!message.text && (!message.content || message.content.length === 0)) {
        return null;
    }
    
    // Extract text content
    let text = message.text || '';
    if (message.content && Array.isArray(message.content)) {
        message.content.forEach(content => {
            if (content.text) text += ' ' + content.text;
        });
    }
    
    if (!text.trim()) return null;
    
    text = text.toLowerCase();
    
    // Score each category
    const scores = {};
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        scores[category] = 0;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                scores[category]++;
            }
        });
    }
    
    // Find the category with the highest score
    let maxScore = 0;
    let bestCategory = 'casual_chat'; // default
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    // If no keywords matched, try to infer from context
    if (maxScore === 0) {
        if (text.includes('?')) {
            bestCategory = 'problem_solving';
        } else if (text.length < 50) {
            bestCategory = 'casual_chat';
        } else if (text.includes('```') || text.includes('function') || text.includes('const') || text.includes('let')) {
            bestCategory = 'development';
        } else {
            bestCategory = 'training';
        }
    }
    
    return bestCategory;
}

// Process conversations
console.log('Processing conversations...');
conversations.forEach((conv, convIndex) => {
    if (!conv.chat_messages || conv.chat_messages.length === 0) {
        stats.empty_conversations++;
        return;
    }
    
    // Process each message in the conversation
    conv.chat_messages.forEach((message, msgIndex) => {
        stats.total_messages++;
        
        const category = categorizeMessage(message);
        if (category) {
            const processedMessage = {
                conversation_id: conv.uuid,
                conversation_index: convIndex,
                message_index: msgIndex,
                sender: message.sender,
                timestamp: message.created_at,
                text: message.text || '',
                content: message.content || [],
                category: category
            };
            
            categorizedData[category].push(processedMessage);
            stats.categorized_messages++;
        } else {
            stats.uncategorized_messages++;
        }
    });
    
    // Progress indicator
    if ((convIndex + 1) % 100 === 0) {
        console.log(`Processed ${convIndex + 1}/${conversations.length} conversations...`);
    }
});

// Create training-data directories if they don't exist
const trainingDataPath = '/home/trey/OGZFV-valhalla/trai/training-data';
if (!fs.existsSync(trainingDataPath)) {
    fs.mkdirSync(trainingDataPath, { recursive: true });
}

// Save categorized data
console.log('\nSaving categorized data...');
for (const [category, messages] of Object.entries(categorizedData)) {
    const categoryPath = path.join(trainingDataPath, category);
    
    // Create category directory if it doesn't exist
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }
    
    // Save messages to category file
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = path.join(categoryPath, `claude-import-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(messages, null, 2));
    console.log(`  ${category}: ${messages.length} messages saved to ${filename}`);
}

// Save statistics
const statsFile = path.join(trainingDataPath, 'import-stats.json');
stats.timestamp = new Date().toISOString();
stats.categories = {};
for (const [category, messages] of Object.entries(categorizedData)) {
    stats.categories[category] = messages.length;
}

fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

// Print summary
console.log('\n=== CATEGORIZATION COMPLETE ===');
console.log(`Total conversations: ${stats.total_conversations}`);
console.log(`Total messages: ${stats.total_messages}`);
console.log(`Empty conversations: ${stats.empty_conversations}`);
console.log(`Categorized messages: ${stats.categorized_messages}`);
console.log(`Uncategorized messages: ${stats.uncategorized_messages}`);
console.log('\nMessages per category:');
for (const [category, messages] of Object.entries(categorizedData)) {
    const percentage = ((messages.length / stats.categorized_messages) * 100).toFixed(1);
    console.log(`  ${category}: ${messages.length} (${percentage}%)`);
}