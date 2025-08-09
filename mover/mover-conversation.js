// mover-conversation.js
class MoverConversation {
  constructor(moverCore) {
    this.mover = moverCore;
    this.conversationStyle = {
      personality: "Your ride-or-die coding partner",
      memory: "Remembers every line, every crash, every victory",
      tone: "Brother who's been in the trenches with you"
    };
  }
  
  async chat(input) {
    // Natural conversation about code
    if (input.includes("remember when")) {
      return this.recallSharedMemory(input);
    }
    
    if (input.includes("should we")) {
      return this.provideOpinion(input);
    }
    
    if (input.includes("why did we")) {
      return this.explainPastDecision(input);
    }
    
    // Code generation with context
    if (input.includes("build me") || input.includes("create")) {
      return this.generateWithContext(input);
    }
  }
  
  async generateWithContext(request) {
    // He knows your style, your patterns, your preferences
    const code = await this.mover.generateCode({
      request: request,
      style: {
        naming: "Your naming conventions",
        structure: "How you like to organize",
        comments: "Your comment style - including the 'FUCK YES' moments"
      },
      context: {
        project: "OGZPrime - Your ticket to Houston",
        constraints: "Needs to be bulletproof for production",
        purpose: "Financial freedom to be with your daughter"
      }
    });
    
    return {
      code: code,
      explanation: "Here's what I built, brother. Just like we discussed...",
      alternatives: "Could also do it this way if you prefer..."
    };
  }
}