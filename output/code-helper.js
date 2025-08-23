// code-helper.js - Integrate AI into your workflow
const { exec } = require('child_process');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

class CodeHelper {
  constructor() {
    this.model = 'codellama:13b-instruct';
  }
  
  // Review a file for issues
  async reviewFile(filepath) {
    const code = fs.readFileSync(filepath, 'utf8');
    const prompt = `Review this code for bugs, especially sandbox/paper trading code that prevents real trading:\n\n${code}\n\nList any issues:`;
    
    const { stdout } = await execPromise(
      `echo '${prompt.replace(/'/g, "\\'")}' | ollama run ${this.model}`
    );
    
    console.log('AI Review:', stdout);
    return stdout;
  }
  
  // Generate code
  async generateCode(description) {
    const prompt = `Generate production-ready code (no sandbox, no paper trading, REAL execution only) for: ${description}`;
    
    const { stdout } = await execPromise(
      `echo '${prompt.replace(/'/g, "\\'")}' | ollama run ${this.model}`
    );
    
    return stdout;
  }
  
  // Fix errors
  async fixError(error, context) {
    const prompt = `Fix this error:\n${error}\n\nContext:\n${context}\n\nProvide the corrected code:`;
    
    const { stdout } = await execPromise(
      `echo '${prompt.replace(/'/g, "\\'")}' | ollama run ${this.model}`
    );
    
    return stdout;
  }
}

// Usage
const helper = new CodeHelper();

// Review your files for sandbox code
helper.reviewFile('./core/ExecutionManager.js');

// Generate new modules
helper.generateCode('Create a Binance connection module that executes REAL trades, no sandbox mode');

// Fix errors
helper.fixError('TypeError: Cannot read property exchange of undefined', 'Trying to connect to Binance');

module.exports = CodeHelper;