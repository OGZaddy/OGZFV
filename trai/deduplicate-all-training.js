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

const trainingDataPath = '/home/trey/OGZFV-valhalla/trai/training-data';
const allMessages = [];
const messageHashes = new Set();

// Stats tracking
const stats = {
    total_files_processed: 0,
    total_messages_loaded: 0,
    duplicate_messages_removed: 0,
    unique_messages: 0,
    sources: {
        claude: 0,
        chatgpt: 0,
        projects: 0,
        other: 0
    }
};

// Function to extract text content from various message formats
function extractText(item) {
    let text = '';
    
    // Handle different message formats
    if (item.text) {
        text = item.text;
    } else if (item.content) {
        if (typeof item.content === 'string') {
            text = item.content;
        } else if (Array.isArray(item.content)) {
            item.content.forEach(c => {
                if (c.text) text += ' ' + c.text;
                else if (c.content) text += ' ' + c.content;
            });
        } else if (typeof item.content === 'object') {
            if (item.content.content) text = item.content.content;
            else if (item.content.name) text = item.content.name + ' ' + (item.content.description || '');
        }
    }
    
    return text.trim();
}

// Function to categorize a message
function categorizeMessage(text) {
    if (!text || !text.trim()) return null;
    
    text = text.toLowerCase();
    
    const scores = {};
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        scores[category] = 0;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                scores[category]++;
            }
        });
    }
    
    let maxScore = 0;
    let bestCategory = 'casual_chat';
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
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

// Load all existing training data
console.log('Loading all existing training data...');

for (const category of Object.keys(CATEGORIES)) {
    const categoryPath = path.join(trainingDataPath, category);
    
    if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
            const filePath = path.join(categoryPath, file);
            console.log(`  Loading: ${category}/${file}`);
            
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                stats.total_files_processed++;
                
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        stats.total_messages_loaded++;
                        
                        const text = extractText(item);
                        if (text) {
                            // Create hash from exact text + timestamp to preserve evolution
                            const timestamp = item.timestamp || item.created_at || '';
                            const hashContent = text + '|' + timestamp;
                            const hash = crypto.createHash('md5').update(hashContent).digest('hex');
                            
                            if (!messageHashes.has(hash)) {
                                messageHashes.add(hash);
                                
                                // Determine source
                                let source = 'other';
                                if (file.includes('claude')) {
                                    source = 'claude';
                                    stats.sources.claude++;
                                } else if (file.includes('project')) {
                                    source = 'projects';
                                    stats.sources.projects++;
                                }
                                
                                allMessages.push({
                                    ...item,
                                    text: text,
                                    category: category,
                                    source: source,
                                    hash: hash,
                                    original_file: file
                                });
                            } else {
                                stats.duplicate_messages_removed++;
                            }
                        }
                    });
                }
            } catch (error) {
                console.error(`Error loading ${filePath}: ${error.message}`);
            }
        });
    }
}

console.log(`\nLoaded ${allMessages.length} unique messages from existing data`);
console.log(`Removed ${stats.duplicate_messages_removed} duplicates from existing data`);

// Now process ChatGPT data
console.log('\nProcessing ChatGPT conversations...');
const chatgptData = JSON.parse(fs.readFileSync('conversations (1).json', 'utf8'));

// Function to extract messages from ChatGPT conversation
function extractChatGPTMessages(conversation) {
    const messages = [];
    const mapping = conversation.mapping || {};
    
    for (const [nodeId, node] of Object.entries(mapping)) {
        if (node.message && node.message.content && node.message.content.parts) {
            const message = node.message;
            const text = message.content.parts.join(' ');
            
            if (text && text.trim() && message.author.role !== 'system') {
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

let chatgptNewMessages = 0;
let chatgptDuplicates = 0;

chatgptData.forEach((conversation, convIndex) => {
    const messages = extractChatGPTMessages(conversation);
    
    messages.forEach(message => {
        // Use exact text + timestamp to preserve conversation evolution
        const timestamp = message.create_time || '';
        const hashContent = message.text + '|' + timestamp;
        const hash = crypto.createHash('md5').update(hashContent).digest('hex');
        
        if (!messageHashes.has(hash)) {
            messageHashes.add(hash);
            chatgptNewMessages++;
            stats.sources.chatgpt++;
            
            const category = categorizeMessage(message.text);
            
            if (category) {
                allMessages.push({
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
            }
        } else {
            chatgptDuplicates++;
        }
    });
    
    if ((convIndex + 1) % 50 === 0) {
        console.log(`  Processed ${convIndex + 1}/${chatgptData.length} ChatGPT conversations...`);
    }
});

console.log(`Added ${chatgptNewMessages} new ChatGPT messages`);
console.log(`Skipped ${chatgptDuplicates} ChatGPT duplicates`);

// Re-categorize everything and organize by category
console.log('\nReorganizing all unique messages by category...');
const finalCategorized = {
    architecture: [],
    brainstorming: [],
    casual_chat: [],
    development: [],
    emotions: [],
    problem_solving: [],
    rants: [],
    training: []
};

allMessages.forEach(message => {
    const category = message.category || categorizeMessage(message.text);
    if (category && finalCategorized[category]) {
        finalCategorized[category].push(message);
    }
});

// Create clean training-data folder
const cleanDataPath = path.join('/home/trey/OGZFV-valhalla/trai', 'training-data-clean');
if (!fs.existsSync(cleanDataPath)) {
    fs.mkdirSync(cleanDataPath, { recursive: true });
}

// Save deduplicated data
console.log('\nSaving clean deduplicated training data...');
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

for (const [category, messages] of Object.entries(finalCategorized)) {
    if (messages.length === 0) continue;
    
    const categoryPath = path.join(cleanDataPath, category);
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }
    
    const filename = path.join(categoryPath, `unified-deduped-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(messages, null, 2));
    console.log(`  ${category}: ${messages.length} messages`);
}

// Save comprehensive stats
stats.unique_messages = allMessages.length;
stats.timestamp = new Date().toISOString();
stats.categories = {};
for (const [category, messages] of Object.entries(finalCategorized)) {
    stats.categories[category] = messages.length;
}

const statsFile = path.join(cleanDataPath, 'deduplication-complete-stats.json');
fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

// Print final summary
console.log('\n=== COMPLETE DEDUPLICATION SUMMARY ===');
console.log(`Total files processed: ${stats.total_files_processed}`);
console.log(`Total messages loaded: ${stats.total_messages_loaded + chatgptNewMessages + chatgptDuplicates}`);
console.log(`Duplicates removed: ${stats.duplicate_messages_removed + chatgptDuplicates}`);
console.log(`Final unique messages: ${stats.unique_messages}`);
console.log('\nMessages by source:');
console.log(`  Claude: ${stats.sources.claude}`);
console.log(`  ChatGPT: ${stats.sources.chatgpt}`);
console.log(`  Projects: ${stats.sources.projects}`);
console.log('\nFinal distribution by category:');
for (const [category, count] of Object.entries(stats.categories)) {
    const percentage = ((count / stats.unique_messages) * 100).toFixed(1);
    console.log(`  ${category}: ${count} (${percentage}%)`);
}
console.log(`\nClean data saved to: ${cleanDataPath}`);