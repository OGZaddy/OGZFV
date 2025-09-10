const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// Load existing Claude messages for deduplication
console.log('Loading existing Claude categorized data...');
const existingHashes = new Set();
const trainingDataPath = '/home/trey/OGZFV-valhalla/trai/training-data';

// Load all existing Claude imports to build hash set
for (const category of Object.keys(CATEGORIES)) {
    const categoryPath = path.join(trainingDataPath, category);
    const claudeFile = path.join(categoryPath, `claude-import-2025-09-09T21-13-4${category === 'architecture' ? '5' : '6'}.json`);
    
    if (fs.existsSync(claudeFile)) {
        const messages = JSON.parse(fs.readFileSync(claudeFile, 'utf8'));
        messages.forEach(msg => {
            // Create hash from message content
            const content = msg.text || JSON.stringify(msg.content);
            if (content) {
                const hash = crypto.createHash('md5').update(content.toLowerCase()).digest('hex');
                existingHashes.add(hash);
            }
        });
    }
}

console.log(`Loaded ${existingHashes.size} existing message hashes from Claude data`);

// Load ChatGPT conversations
console.log('Loading ChatGPT conversations...');
const chatgptData = JSON.parse(fs.readFileSync('conversations (1).json', 'utf8'));

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
    total_conversations: chatgptData.length,
    total_messages: 0,
    duplicate_messages: 0,
    new_messages: 0,
    categorized_messages: 0
};

// Function to extract messages from ChatGPT conversation
function extractMessages(conversation) {
    const messages = [];
    const mapping = conversation.mapping || {};
    
    for (const [nodeId, node] of Object.entries(mapping)) {
        if (node.message && node.message.content && node.message.content.parts) {
            const message = node.message;
            const text = message.content.parts.join(' ');
            
            if (text && text.trim()) {
                messages.push({
                    id: nodeId,
                    role: message.author.role,
                    text: text,
                    create_time: message.create_time || conversation.create_time,
                    conversation_title: conversation.title,
                    conversation_id: conversation.conversation_id || conversation.id
                });
            }
        }
    }
    
    return messages;
}

// Function to categorize a message
function categorizeMessage(text) {
    if (!text || !text.trim()) return null;
    
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
    let bestCategory = 'casual_chat';
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    // Special rules
    if (maxScore === 0) {
        if (text.includes('?')) {
            bestCategory = 'problem_solving';
        } else if (text.includes('```') || text.includes('def ') || text.includes('function')) {
            bestCategory = 'development';
        } else if (text.length > 500) {
            bestCategory = 'training';
        }
    }
    
    return bestCategory;
}

// Process ChatGPT conversations
console.log('Processing ChatGPT conversations...');
chatgptData.forEach((conversation, convIndex) => {
    const messages = extractMessages(conversation);
    
    messages.forEach(message => {
        stats.total_messages++;
        
        // Check for duplicates
        const hash = crypto.createHash('md5').update(message.text.toLowerCase()).digest('hex');
        
        if (existingHashes.has(hash)) {
            stats.duplicate_messages++;
            return; // Skip duplicate
        }
        
        // New unique message
        stats.new_messages++;
        existingHashes.add(hash); // Add to set to catch duplicates within ChatGPT data
        
        // Only process non-system messages
        if (message.role !== 'system') {
            const category = categorizeMessage(message.text);
            
            if (category) {
                categorizedData[category].push({
                    source: 'chatgpt',
                    conversation_id: message.conversation_id,
                    conversation_title: message.conversation_title,
                    message_id: message.id,
                    role: message.role,
                    timestamp: new Date(message.create_time * 1000).toISOString(),
                    text: message.text,
                    category: category,
                    hash: hash
                });
                stats.categorized_messages++;
            }
        }
    });
    
    // Progress indicator
    if ((convIndex + 1) % 50 === 0) {
        console.log(`Processed ${convIndex + 1}/${chatgptData.length} conversations...`);
    }
});

// Save deduplicated ChatGPT data
console.log('\nSaving deduplicated ChatGPT data...');
for (const [category, messages] of Object.entries(categorizedData)) {
    if (messages.length === 0) continue;
    
    const categoryPath = path.join(trainingDataPath, category);
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = path.join(categoryPath, `chatgpt-deduped-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(messages, null, 2));
    console.log(`  ${category}: ${messages.length} new messages saved`);
}

// Save deduplication stats
const statsFile = path.join(trainingDataPath, 'deduplication-stats.json');
stats.timestamp = new Date().toISOString();
stats.categories = {};
for (const [category, messages] of Object.entries(categorizedData)) {
    stats.categories[category] = messages.length;
}

fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

// Print summary
console.log('\n=== DEDUPLICATION COMPLETE ===');
console.log(`Total ChatGPT conversations: ${stats.total_conversations}`);
console.log(`Total ChatGPT messages: ${stats.total_messages}`);
console.log(`Duplicate messages skipped: ${stats.duplicate_messages}`);
console.log(`New unique messages: ${stats.new_messages}`);
console.log(`Categorized new messages: ${stats.categorized_messages}`);
console.log('\nNew messages per category:');
for (const [category, messages] of Object.entries(categorizedData)) {
    if (messages.length > 0) {
        const percentage = ((messages.length / stats.categorized_messages) * 100).toFixed(1);
        console.log(`  ${category}: ${messages.length} (${percentage}%)`);
    }
}