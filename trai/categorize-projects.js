const fs = require('fs');
const path = require('path');

// TRAI's 8 memory categories
const CATEGORIES = {
    architecture: ['system', 'design', 'structure', 'component', 'module', 'api', 'database', 'infrastructure', 'deployment', 'server', 'websocket', 'ssl', 'config', 'architecture'],
    brainstorming: ['idea', 'what if', 'could we', 'should we', 'consider', 'possibility', 'alternative', 'option', 'think about', 'explore', 'concept', 'strategy'],
    casual_chat: ['hello', 'hi', 'hey', 'how are', 'thanks', 'thank you', 'bye', 'goodbye', 'lol', 'haha', 'nice', 'cool', 'awesome'],
    development: ['code', 'function', 'implement', 'debug', 'error', 'fix', 'build', 'compile', 'test', 'git', 'commit', 'push', 'branch', 'programming', 'script', 'algorithm'],
    emotions: ['feel', 'happy', 'sad', 'angry', 'frustrated', 'excited', 'worried', 'stress', 'love', 'hate', 'afraid', 'nervous'],
    problem_solving: ['issue', 'problem', 'bug', 'solve', 'solution', 'why', 'how to', 'troubleshoot', 'diagnose', 'resolve', 'broken', 'fix'],
    rants: ['stupid', 'annoying', 'waste', 'terrible', 'awful', 'ridiculous', 'insane', 'crazy', 'bullshit', 'damn', 'fuck', 'shit'],
    training: ['learn', 'teach', 'explain', 'understand', 'concept', 'tutorial', 'guide', 'documentation', 'example', 'practice', 'knowledge', 'instruction', 'lesson']
};

// Load projects
console.log('Loading projects.json...');
const projects = JSON.parse(fs.readFileSync('/home/trey/OGZFV-valhalla/trai/projects.json', 'utf8'));

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
    total_projects: projects.length,
    total_docs: 0,
    projects_with_docs: 0,
    categorized_items: 0
};

// Function to categorize content
function categorizeContent(text, source) {
    if (!text || !text.trim()) return null;
    
    text = text.toLowerCase();
    
    // Score each category
    const scores = {};
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        scores[category] = 0;
        keywords.forEach(keyword => {
            // Count occurrences, not just presence
            const regex = new RegExp(keyword, 'gi');
            const matches = text.match(regex);
            if (matches) {
                scores[category] += matches.length;
            }
        });
    }
    
    // Find the category with the highest score
    let maxScore = 0;
    let bestCategory = 'training'; // default for projects
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }
    
    // Special rules for projects
    if (maxScore === 0) {
        // If it's a prompt template, likely training or development
        if (source === 'prompt_template') {
            bestCategory = 'training';
        } else if (text.includes('```') || text.includes('function') || text.includes('const')) {
            bestCategory = 'development';
        } else if (text.length > 500) {
            bestCategory = 'training';
        }
    }
    
    return bestCategory;
}

// Process projects
console.log('Processing projects...');
projects.forEach((project, projIndex) => {
    // Process project name and description
    if (project.name || project.description) {
        const projectText = `${project.name || ''} ${project.description || ''}`;
        const category = categorizeContent(projectText, 'project_meta');
        
        if (category) {
            categorizedData[category].push({
                type: 'project_metadata',
                project_id: project.uuid,
                project_name: project.name,
                creator: project.creator ? project.creator.full_name : 'Unknown',
                created_at: project.created_at,
                content: {
                    name: project.name,
                    description: project.description,
                    is_starter: project.is_starter_project || false
                },
                category: category
            });
            stats.categorized_items++;
        }
    }
    
    // Process prompt template
    if (project.prompt_template && project.prompt_template.trim()) {
        const category = categorizeContent(project.prompt_template, 'prompt_template');
        
        if (category) {
            categorizedData[category].push({
                type: 'project_prompt',
                project_id: project.uuid,
                project_name: project.name,
                creator: project.creator ? project.creator.full_name : 'Unknown',
                created_at: project.created_at,
                content: project.prompt_template,
                category: category
            });
            stats.categorized_items++;
        }
    }
    
    // Process project documents
    if (project.docs && project.docs.length > 0) {
        stats.projects_with_docs++;
        
        project.docs.forEach((doc, docIndex) => {
            stats.total_docs++;
            
            const docText = `${doc.filename || ''} ${doc.content || ''}`;
            const category = categorizeContent(docText, 'document');
            
            if (category) {
                categorizedData[category].push({
                    type: 'project_document',
                    project_id: project.uuid,
                    project_name: project.name,
                    document_id: doc.uuid,
                    document_name: doc.filename,
                    creator: project.creator ? project.creator.full_name : 'Unknown',
                    created_at: project.created_at,
                    content: {
                        filename: doc.filename,
                        content: doc.content
                    },
                    category: category
                });
                stats.categorized_items++;
            }
        });
    }
    
    // Progress indicator
    if ((projIndex + 1) % 10 === 0) {
        console.log(`Processed ${projIndex + 1}/${projects.length} projects...`);
    }
});

// Save categorized data
console.log('\nSaving categorized project data...');
const trainingDataPath = '/home/trey/OGZFV-valhalla/trai/training-data';

for (const [category, items] of Object.entries(categorizedData)) {
    if (items.length === 0) continue;
    
    const categoryPath = path.join(trainingDataPath, category);
    
    // Create category directory if it doesn't exist
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
    }
    
    // Save items to category file
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = path.join(categoryPath, `projects-import-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(items, null, 2));
    console.log(`  ${category}: ${items.length} items saved to ${filename}`);
}

// Update statistics file
const statsFile = path.join(trainingDataPath, 'project-import-stats.json');
stats.timestamp = new Date().toISOString();
stats.categories = {};
for (const [category, items] of Object.entries(categorizedData)) {
    stats.categories[category] = items.length;
}

fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

// Print summary
console.log('\n=== PROJECT CATEGORIZATION COMPLETE ===');
console.log(`Total projects: ${stats.total_projects}`);
console.log(`Projects with documents: ${stats.projects_with_docs}`);
console.log(`Total documents: ${stats.total_docs}`);
console.log(`Total categorized items: ${stats.categorized_items}`);
console.log('\nItems per category:');
for (const [category, items] of Object.entries(categorizedData)) {
    if (items.length > 0) {
        const percentage = ((items.length / stats.categorized_items) * 100).toFixed(1);
        console.log(`  ${category}: ${items.length} (${percentage}%)`);
    }
}