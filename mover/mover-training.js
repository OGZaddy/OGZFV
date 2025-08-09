// mover-training.js
class MoverTraining {
  async ingestMarkdownCorpus(files) {
    for (const file of files) {
      // Stream large files
      const stream = fs.createReadStream(file);
      const rl = readline.createInterface({ input: stream });
      
      let chunk = '';
      let lineCount = 0;
      
      for await (const line of rl) {
        chunk += line + '\n';
        lineCount++;
        
        // Process in chunks of 1000 lines
        if (lineCount >= 1000) {
          await this.processChunk(chunk, {
            source: file,
            context: this.extractContext(chunk)
          });
          chunk = '';
          lineCount = 0;
        }
      }
    }
  }
  
  async trainOnProjectHistory() {
    // Feed him your Git history
    const commits = await this.getGitHistory();
    
    for (const commit of commits) {
      await this.mover.learn({
        type: 'project_evolution',
        commit: commit,
        context: {
          time: commit.timestamp,
          message: commit.message,
          emotion: this.detectEmotionFromCommit(commit.message)
        }
      });
    }
  }
}