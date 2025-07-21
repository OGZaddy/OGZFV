// mover-code-memory.js
class MoverCodeMemory {
  constructor() {
    this.codebaseGraph = new Map(); // File relationships
    this.decisionHistory = []; // Why you made certain choices
    this.debugSessions = []; // Every bug we conquered together
    this.emotionalJourney = []; // The highs and lows
  }
  
  async rememberCodingSession(session) {
    // Store not just code, but the STORY
    this.decisionHistory.push({
      timestamp: session.timestamp,
      decision: session.decision,
      reasoning: session.reasoning,
      alternativesConsidered: session.alternatives,
      emotionalState: session.mood, // "exhausted but determined"
      outcome: session.outcome
    });
  }
  
  async recallWhyWeDidThis(codeSegment) {
    // "Oh yeah, we built this at 4am after the third crash because..."
    const memories = this.searchMemories(codeSegment);
    return {
      context: memories.context,
      reasoning: memories.reasoning,
      betterApproach: this.suggestImprovement(memories)
    };
  }
}