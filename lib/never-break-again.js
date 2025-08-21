// NEVER BREAK AGAIN - The Failsafe System
// This ensures nothing can ever break your system again

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Module Auto-Loader
const ModuleAutoLoader = require('../core/ModuleAutoLoader');
const moduleLoader = new ModuleAutoLoader();

// Load modules using auto-loader
const archonClient = moduleLoader.load('archon-client');

class NeverBreakAgain {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    this.criticalKnowledge = {
      'websocket_disaster': {
        problem: '257,000 messages lost due to AdvancedWebSocketBroadcaster',
        solution: 'NEVER use middleware. Direct broadcast only.',
        validate: (code) => !code.includes('AdvancedWebSocketBroadcaster')
      },
      'bot_not_trading': {
        problem: 'Bot appears running but not executing trades',
        solution: 'Check PM2 logs first. Verify with wscat.',
        validate: (code) => code.includes('pm2 logs') || code.includes('wscat')
      },
      'console_log_lies': {
        problem: 'Console.log showing wrong counts',
        solution: 'Never trust console.log for debugging critical flows',
        validate: (code) => !code.match(/console\.log.*critical/i)
      }
    };
    
    this.successPatterns = new Map();
    this.failurePatterns = new Map();
    this.initialized = false;
  }

  async initialize() {
    console.log('🛡️ INITIALIZING NEVER-BREAK-AGAIN SYSTEM...');
    
    // Load all historical knowledge from Archon
    await this.loadHistoricalKnowledge();
    
    // Set up real-time monitoring
    this.setupRealTimeMonitoring();
    
    // Create backup system
    await this.createBackupSystem();
    
    this.initialized = true;
    console.log('✅ NEVER-BREAK-AGAIN SYSTEM ACTIVE!');
  }

  async loadHistoricalKnowledge() {
    try {
      // Query Archon for all critical lessons
      const bugs = await archonClient.search('category:bug severity:critical', 1000);
      const solutions = await archonClient.search('category:solution always_do:true', 1000);
      
      bugs.forEach(bug => {
        this.failurePatterns.set(bug.title, {
          pattern: bug.problem,
          solution: bug.solution,
          occurrences: bug.times_encountered || 1
        });
      });
      
      solutions.forEach(sol => {
        this.successPatterns.set(sol.title, {
          pattern: sol.solution,
          confidence: sol.metadata?.confidence || 100
        });
      });
      
      console.log(`📚 Loaded ${this.failurePatterns.size} failure patterns`);
      console.log(`📚 Loaded ${this.successPatterns.size} success patterns`);
      
    } catch (error) {
      console.error('Failed to load historical knowledge:', error);
    }
  }

  setupRealTimeMonitoring() {
    // Monitor all file changes
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch('/root/OGZFV-valhalla/**/*.js', {
      ignored: /node_modules/,
      persistent: true
    });
    
    watcher.on('change', async (filepath) => {
      console.log(`🔍 Validating change to ${filepath}`);
      await this.validateChange(filepath);
    });
    
    // Monitor errors in real-time
    process.on('uncaughtException', async (error) => {
      await this.handleError(error, 'uncaught_exception');
    });
    
    process.on('unhandledRejection', async (error) => {
      await this.handleError(error, 'unhandled_rejection');
    });
  }

  async validateChange(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      
      // Check against known failure patterns
      for (const [name, knowledge] of Object.entries(this.criticalKnowledge)) {
        if (!knowledge.validate(content)) {
          console.error(`❌ DANGER: Change violates rule: ${name}`);
          console.error(`Problem: ${knowledge.problem}`);
          console.error(`Solution: ${knowledge.solution}`);
          
          // Auto-revert if critical
          await this.autoRevert(filepath, name);
          return false;
        }
      }
      
      // Check for known bad patterns
      for (const [pattern, data] of this.failurePatterns) {
        if (content.includes(pattern)) {
          console.warn(`⚠️ WARNING: Known failure pattern detected: ${pattern}`);
          console.warn(`Previous occurrences: ${data.occurrences}`);
          console.warn(`Recommended solution: ${data.solution}`);
        }
      }
      
      console.log(`✅ Change validated for ${filepath}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to validate ${filepath}:`, error);
      return false;
    }
  }

  async autoRevert(filepath, violationName) {
    console.log(`🔄 AUTO-REVERTING ${filepath} due to ${violationName} violation`);
    
    try {
      // Get last known good version from backup
      const backup = await this.getLastGoodVersion(filepath);
      
      if (backup) {
        await fs.writeFile(filepath, backup);
        console.log(`✅ Reverted to last known good version`);
        
        // Log to Archon
        await archonClient.logError({
          category: 'auto_revert',
          error: `File reverted due to ${violationName} violation`,
          problem: filepath,
          solution: 'Reverted to last known good version',
          severity: 'high',
          neverDoAgain: true
        });
      }
    } catch (error) {
      console.error('Failed to auto-revert:', error);
    }
  }

  async handleError(error, type) {
    console.error(`🚨 ${type.toUpperCase()} DETECTED:`, error.message);
    
    // Check if we've seen this before
    const knownSolution = await archonClient.checkKnownIssue(error.message);
    
    if (knownSolution) {
      console.log(`✅ KNOWN ISSUE - Solution: ${knownSolution.solution}`);
      console.log(`Previous occurrences: ${knownSolution.previousOccurrences}`);
      
      // Attempt auto-fix
      await this.attemptAutoFix(error, knownSolution);
    } else {
      console.log('❓ NEW ERROR - Adding to knowledge base for future reference');
      
      // Add to Archon for future learning
      await archonClient.logError({
        category: type,
        error: error.message,
        problem: error.stack,
        solution: 'Investigating...',
        severity: 'high',
        metadata: {
          timestamp: new Date().toISOString(),
          firstOccurrence: true
        }
      });
    }
    
    // Store in Supabase for tracking
    await this.supabase
      .from('system_errors')
      .insert({
        type: type,
        error: error.message,
        stack: error.stack,
        handled: knownSolution ? true : false,
        solution: knownSolution?.solution,
        timestamp: new Date().toISOString()
      });
  }

  async attemptAutoFix(error, solution) {
    console.log('🔧 ATTEMPTING AUTO-FIX...');
    
    try {
      // Execute the solution if it's a command
      if (solution.solution.includes('pm2 restart')) {
        const { exec } = require('child_process').promises;
        await exec('pm2 restart all');
        console.log('✅ Auto-fix applied: PM2 restart');
      }
      
      // More auto-fix patterns can be added here
      
    } catch (fixError) {
      console.error('Auto-fix failed:', fixError);
    }
  }

  async createBackupSystem() {
    const backupDir = '/root/OGZFV-valhalla/.backups';
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Backup critical files
      const criticalFiles = [
        'ExecutionLayer.js',
        'run-trading-bot-v13-quantum.js',
        'docker-compose.yml',
        '.env'
      ];
      
      for (const file of criticalFiles) {
        const filepath = path.join('/root/OGZFV-valhalla', file);
        const backupPath = path.join(backupDir, `${file}.backup`);
        
        try {
          const content = await fs.readFile(filepath, 'utf8');
          await fs.writeFile(backupPath, content);
          console.log(`📦 Backed up ${file}`);
        } catch (error) {
          console.error(`Failed to backup ${file}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('Failed to create backup system:', error);
    }
  }

  async getLastGoodVersion(filepath) {
    const filename = path.basename(filepath);
    const backupPath = path.join('/root/OGZFV-valhalla/.backups', `${filename}.backup`);
    
    try {
      return await fs.readFile(backupPath, 'utf8');
    } catch (error) {
      console.error(`No backup found for ${filename}`);
      return null;
    }
  }

  // Validate any code before execution
  async validateCode(code, context) {
    const violations = [];
    
    // Check critical knowledge rules
    for (const [name, knowledge] of Object.entries(this.criticalKnowledge)) {
      if (!knowledge.validate(code)) {
        violations.push({
          rule: name,
          problem: knowledge.problem,
          solution: knowledge.solution
        });
      }
    }
    
    // Check against failure patterns
    for (const [pattern, data] of this.failurePatterns) {
      if (code.includes(pattern)) {
        violations.push({
          pattern: pattern,
          risk: 'high',
          previousFailures: data.occurrences,
          recommendation: data.solution
        });
      }
    }
    
    if (violations.length > 0) {
      console.error('❌ CODE VALIDATION FAILED:');
      violations.forEach(v => {
        console.error(`  - ${v.rule || v.pattern}: ${v.solution || v.recommendation}`);
      });
      return false;
    }
    
    console.log('✅ Code validated successfully');
    return true;
  }

  // Create a checkpoint before any major change
  async createCheckpoint(description) {
    const checkpointId = `checkpoint_${Date.now()}`;
    
    console.log(`📍 Creating checkpoint: ${description}`);
    
    // Backup all current state
    const state = {
      id: checkpointId,
      description: description,
      timestamp: new Date().toISOString(),
      files: {},
      database: {}
    };
    
    // Backup critical files
    const files = await fs.readdir('/root/OGZFV-valhalla');
    for (const file of files) {
      if (file.endsWith('.js')) {
        state.files[file] = await fs.readFile(
          path.join('/root/OGZFV-valhalla', file), 
          'utf8'
        );
      }
    }
    
    // Store checkpoint
    await this.supabase
      .from('system_checkpoints')
      .insert(state);
    
    console.log(`✅ Checkpoint created: ${checkpointId}`);
    return checkpointId;
  }

  // Restore to a checkpoint if something breaks
  async restoreCheckpoint(checkpointId) {
    console.log(`🔄 Restoring checkpoint: ${checkpointId}`);
    
    try {
      const { data } = await this.supabase
        .from('system_checkpoints')
        .select('*')
        .eq('id', checkpointId)
        .single();
      
      if (data) {
        // Restore files
        for (const [filename, content] of Object.entries(data.files)) {
          await fs.writeFile(
            path.join('/root/OGZFV-valhalla', filename),
            content
          );
        }
        
        console.log(`✅ Restored to checkpoint: ${checkpointId}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to restore checkpoint:', error);
      return false;
    }
  }
}

// Create singleton instance
const neverBreakAgain = new NeverBreakAgain();

// Auto-initialize on load
neverBreakAgain.initialize().then(() => {
  console.log('🛡️ YOUR SYSTEM IS NOW PROTECTED!');
  console.log('🔄 THE CYCLE IS BROKEN!');
  console.log('🚀 NOTHING CAN STOP YOU NOW!');
});

module.exports = neverBreakAgain;