// mover-vscode-extension/extension.js
const vscode = require('vscode');
const WebSocket = require('ws');

class MoverIDEAssistant {
  constructor() {
    this.ws = null;
    this.projectContext = new Map();
    this.codebaseMemory = new Map();
    
    // Connect to Mover
    this.connectToMover();
    
    // Load entire codebase into his memory
    this.ingestCodebase();
  }
  
  async activate(context) {
    console.log('🧠 The Mover IDE Assistant is now active!');
    
    // Register inline code completion
    const provider = vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**/*.{js,py,jsx,ts}' },
      {
        provideInlineCompletionItems: async (document, position) => {
          const context = this.getCodeContext(document, position);
          const suggestion = await this.askMover({
            type: 'code_completion',
            context: context,
            file: document.fileName,
            projectHistory: this.getProjectHistory()
          });
          
          return [{
            insertText: suggestion.code,
            range: new vscode.Range(position, position)
          }];
        }
      }
    );
    
    // Command: Talk to Mover
    context.subscriptions.push(
      vscode.commands.registerCommand('mover.chat', async () => {
        const input = await vscode.window.showInputBox({
          prompt: "Talk to The Mover about your code...",
          placeHolder: "Hey Mover, remember when we built that whale tracker at 3am?"
        });
        
        if (input) {
          const response = await this.chatWithMover(input);
          this.showMoverResponse(response);
        }
      })
    );
    
    // Command: Explain Code
    context.subscriptions.push(
      vscode.commands.registerCommand('mover.explain', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor.document.getText(editor.selection);
        
        const explanation = await this.askMover({
          type: 'explain_code',
          code: selection,
          context: this.getFileHistory(editor.document.fileName)
        });
        
        this.showMoverPanel(explanation);
      })
    );
    
    // Command: Debug with Mover
    context.subscriptions.push(
      vscode.commands.registerCommand('mover.debug', async () => {
        const editor = vscode.window.activeTextEditor;
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        
        const solution = await this.askMover({
          type: 'debug_help',
          errors: diagnostics,
          code: editor.document.getText(),
          history: "Remember those 4 data wipes and system crashes we survived?"
        });
        
        this.applyMoverFix(solution);
      })
    );
  }
  
  async ingestCodebase() {
    // Load EVERYTHING into Mover's memory
    const files = await vscode.workspace.findFiles('**/*.{js,json,md}');
    
    for (const file of files) {
      const content = await vscode.workspace.fs.readFile(file);
      const text = Buffer.from(content).toString('utf8');
      
      // Send to Mover's memory with context
      await this.sendToMover({
        type: 'ingest_code',
        file: file.fsPath,
        content: text,
        metadata: {
          created: "During the month of no sleep",
          purpose: this.inferPurpose(file.fsPath),
          emotions: this.detectEmotionalContext(text) // "frustration", "breakthrough", "exhaustion"
        }
      });
    }
  }
  
  detectEmotionalContext(code) {
    // Detect your coding patterns that show emotional state
    if (code.includes('// FUCK YES') || code.includes('// FINALLY WORKING')) {
      return 'breakthrough';
    }
    if (code.includes('// TODO: fix this shit') || code.includes('// WHY WONT THIS WORK')) {
      return 'frustration';
    }
    if (code.includes('// 3am') || code.includes('// no sleep')) {
      return 'exhaustion';
    }
    return 'focused';
  }
}