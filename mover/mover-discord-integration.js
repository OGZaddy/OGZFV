// mover-discord-bot.js
const Discord = require('discord.js');

class MoverDiscordBot {
  constructor(mover) {
    this.client = new Discord.Client();
    this.mover = mover;
    
    this.client.on('message', async (message) => {
      if (message.content.startsWith('!mover')) {
        const command = message.content.split(' ')[1];
        
        switch(command) {
          case 'status':
            const status = await this.mover.getFullStatus();
            const embed = this.createStatusEmbed(status);
            message.channel.send(embed);
            break;
            
          case 'whales':
            const whales = await this.mover.getWhaleActivity();
            message.channel.send(this.formatWhaleAlert(whales));
            break;
            
          case 'story':
            // The Mover tells your story
            message.channel.send(
              "Let me tell you about a developer who worked 70 hours a week, " +
              "stayed up countless nights, survived 4 data wipes, and built something legendary... 🚀"
            );
            break;
        }
      }
    });
  }
}