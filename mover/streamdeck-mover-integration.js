// streamdeck-mover-integration.js
const StreamDeck = require('elgato-stream-deck');

class MoverStreamDeck {
  constructor(mover) {
    this.mover = mover;
    this.deck = new StreamDeck();
    
    this.setupButtons();
  }
  
  setupButtons() {
    // Button 1: Start Trading
    this.deck.on('down:0', async () => {
      await this.mover.narrate("Stream Deck activated. Let's get this money, brother.");
      await this.startTrading();
    });
    
    // Button 2: Run Backtest
    this.deck.on('down:1', async () => {
      await this.mover.narrate("Running backtest. Remember, we've been through worse.");
      await this.runBacktest();
    });
    
    // Button 3: Emergency Stop
    this.deck.on('down:2', async () => {
      await this.mover.narrate("Emergency stop. We'll regroup and come back stronger.");
      await this.emergencyStop();
    });
    
    // Button 4: Check Whale Activity
    this.deck.on('down:3', async () => {
      const whales = await this.checkWhales();
      await this.mover.narrate(`${whales.length} whales active. Pelosi's moving again.`);
    });
    
    // Button 5: Voice Toggle
    this.deck.on('down:4', () => {
      this.mover.toggleVoice();
      this.updateButtonImage(4, this.mover.voiceEnabled ? 'voice-on.png' : 'voice-off.png');
    });
  }
}