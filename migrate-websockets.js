/**
 * WEBSOCKET MIGRATION SCRIPT
 * Automatically replaces all hardcoded WebSocket URLs with centralized configuration
 * 
 * This script will:
 * 1. Find all hardcoded WebSocket URLs
 * 2. Replace them with getWebSocketUrl() calls
 * 3. Add the necessary imports
 * 4. Create backups before modifying
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Directories to search (add more if needed)
  searchDirs: [
    '.',
    './core',
    './api',
    './components',
    './modules',
    './utils',
    './deployment',
    './analytics',
    './app'
  ],
  
  // File extensions to process
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  
  // Directories to ignore
  ignoreDirs: ['node_modules', '.git', 'logs', 'data', 'ssl', 'docs', 'documentation'],
  
  // Files to ignore
  ignoreFiles: ['migrate-websockets.js', 'WebSocketConfig.js'],
  
  // Backup directory
  backupDir: './websocket-migration-backup',
  
  // Common WebSocket URL patterns to replace
  patterns: [
    // Basic WebSocket URLs
    { 
      regex: /new\s+WebSocket\s*\(\s*['"`]wss?:\/\/[^'"`:]+:(\d+)['"`]\s*\)/g,
      replacement: (match, port) => {
        const service = getServiceByPort(port);
        return `new WebSocket(getWebSocketUrl('${service}'))`;
      }
    },
    // WebSocket URLs in strings
    {
      regex: /['"`]wss?:\/\/localhost:(\d+)['"`]/g,
      replacement: (match, port) => {
        const service = getServiceByPort(port);
        return `getWebSocketUrl('${service}')`;
      }
    },
    // WebSocket URLs with domains
    {
      regex: /['"`]wss?:\/\/([^:'"`:]+):(\d+)['"`]/g,
      replacement: (match, domain, port) => {
        const service = getServiceByPort(port);
        return `getWebSocketUrl('${service}')`;
      }
    },
    // HTTP API URLs
    {
      regex: /['"`]https?:\/\/localhost:(\d+)['"`]/g,
      replacement: (match, port) => {
        const service = getServiceByPort(port);
        return `getHttpUrl('${service}')`;
      }
    },
    // HTTP URLs with domains
    {
      regex: /['"`]https?:\/\/([^:'"`:]+):(\d+)['"`]/g,
      replacement: (match, domain, port) => {
        const service = getServiceByPort(port);
        return `getHttpUrl('${service}')`;
      }
    }
  ]
};

// Port to service mapping
const portToService = {
  '3001': 'data',
  '3002': 'gui',
  '3003': 'control',
  '3010': 'api',
  '8001': 'data',    // Your current wrong ports
  '8002': 'gui',     // Will be fixed to use 3001/3002/3003
  '8003': 'control',
  '8080': 'transparency',
  '8081': 'analytics',
  '8082': 'monitor',
  '8083': 'backup'
};

function getServiceByPort(port) {
  return portToService[port] || 'data';
}

// Statistics
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  urlsReplaced: 0,
  errors: []
};

// Create backup directory
function createBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(`📁 Created backup directory: ${CONFIG.backupDir}`);
  }
}

// Check if file should be processed
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  return CONFIG.extensions.includes(ext) && 
         !CONFIG.ignoreFiles.includes(fileName) &&
         !filePath.includes('node_modules') &&
         !filePath.includes('.git');
}

// Add import statement if not present
function addImportIfNeeded(content, filePath) {
  const hasWebSocketImport = content.includes('getWebSocketUrl');
  const hasHttpImport = content.includes('getHttpUrl');
  
  if (!hasWebSocketImport && !hasHttpImport) {
    return content;
  }
  
  // Check if import already exists
  if (content.includes("require('./core/WebSocketConfig')") || 
      content.includes('require("./core/WebSocketConfig")') ||
      content.includes("from './core/WebSocketConfig'")) {
    return content;
  }
  
  // Calculate relative path to WebSocketConfig
  const relativePath = path.relative(path.dirname(filePath), './core/WebSocketConfig.js')
    .replace(/\\/g, '/')
    .replace('.js', '');
  
  // Add require statement after first comment block or at top
  const importStatement = `const { getWebSocketUrl, getHttpUrl } = require('${relativePath}');\n`;
  
  // Find a good place to insert the import
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Skip initial comments and empty lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
      insertIndex = i;
      break;
    }
  }
  
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

// Process a single file
function processFile(filePath) {
  try {
    stats.filesProcessed++;
    
    // Read file
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply all patterns
    let totalReplacements = 0;
    CONFIG.patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        totalReplacements += matches.length;
        content = content.replace(pattern.regex, pattern.replacement);
      }
    });
    
    // If content changed, process the file
    if (content !== originalContent) {
      // Add import if needed
      content = addImportIfNeeded(content, filePath);
      
      // Create backup
      const backupPath = path.join(CONFIG.backupDir, path.relative('.', filePath));
      const backupDir = path.dirname(backupPath);
      fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(backupPath, originalContent);
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      
      stats.filesModified++;
      stats.urlsReplaced += totalReplacements;
      
      console.log(`✅ Updated ${filePath} (${totalReplacements} replacements)`);
    }
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

// Recursively process directory
function processDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!CONFIG.ignoreDirs.includes(entry.name)) {
          processDirectory(fullPath);
        }
      } else if (entry.isFile() && shouldProcessFile(fullPath)) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}: ${error.message}`);
  }
}

// Main migration function
function migrate() {
  console.log('🚀 Starting WebSocket URL Migration...\n');
  
  // Create backup directory
  createBackupDir();
  
  // Process all search directories
  CONFIG.searchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`📂 Searching in ${dir}...`);
      processDirectory(dir);
    }
  });
  
  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('✨ MIGRATION COMPLETE!\n');
  console.log(`📊 Statistics:`);
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Files modified: ${stats.filesModified}`);
  console.log(`   URLs replaced: ${stats.urlsReplaced}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    stats.errors.forEach(err => {
      console.log(`   - ${err.file}: ${err.error}`);
    });
  }
  
  console.log(`\n💾 Backups saved to: ${CONFIG.backupDir}`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Test your application');
  console.log('   2. If everything works, you can delete the backup directory');
  console.log('   3. For production, set: NODE_ENV=production WEBSOCKET_DOMAIN=your-domain.com');
  console.log('\n🎉 You\'ll never have to manually change WebSocket URLs again!');
}

// Run migration
if (require.main === module) {
  migrate();
} else {
  module.exports = { migrate, CONFIG };
}
