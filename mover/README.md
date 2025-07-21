// ==========================================
// FILE: README.md
// Documentation for The Mover
// ==========================================
# The Mover - AI Support Agent for OGZ Prime

The Mover is an AI-powered support agent that serves as the interactive memory and voice of the OGZ Prime trading platform. It provides real-time trade narration, performance insights, and intelligent support.

## Features

- **Real-time Trade Narration**: Converts trade events into human-readable narratives
- **Memory System**: Maintains short-term and long-term memory of trading events
- **Doctrine Ingestion**: Loads and applies trading rules and strategies
- **Log Interpretation**: Analyzes log files to extract meaningful insights
- **WebSocket Integration**: Connects directly to OGZ Prime for live data
- **Voice Pipeline Ready**: Prepared for ElevenLabs or custom TTS integration
- **Personality System**: Multiple personalities for different narration styles

## Installation

1. Copy all files to the /mover directory in your OGZ Prime installation
2. Install dependencies:
   ```bash
   cd mover
   npm install ws express dotenv
   ```
3. Copy .env.example to .env and configure your settings
4. Ensure OGZ Prime is running with WebSocket enabled

## Usage

Start The Mover:
```bash
node mover-server.js
```

The Mover will:
- Connect to OGZ Prime via WebSocket
- Start HTTP API on port 4000
- Start WebSocket server on port 4001
- Begin processing trade events immediately

## API Endpoints

- `GET /health` - System health and statistics
- `POST /doctrine/ingest` - Load new doctrine files
- `POST /narrate` - Manually trigger narration
- `GET /memory/recall?query=term` - Search memory
- `GET /report` - Get session report
- `POST /voice/toggle` - Toggle voice output

## WebSocket Protocol

Connect to `ws://localhost:4001` and send:

```javascript
// Subscribe to narrations
{ "type": "subscribe" }

// Send command
{ "type": "command", "command": "status" }

// Query memory
{ "type": "query", "query": "profit" }
```

## Personality Options

- `professional_trader`: Formal, technical analysis focused
- `aggressive_trader`: High energy, momentum focused
- `zen_master`: Calm, philosophical approach
- `houston_focused`: Every trade viewed through Houston goal lens

## Houston Progress Tracking

The Mover tracks progress toward the Houston relocation goal:
- Target: $25,000
- Current: $10,000 (40%)
- Updates with every trade

## Voice Integration

Ready for ElevenLabs integration:
1. Add your API key to .env
2. Enable voice output
3. Narrations will be spoken in real-time

## Memory System

The Mover remembers:
- All trades and outcomes
- Market patterns
- Performance metrics
- Significant events

Query memory:
```
GET /memory/recall?query=winning+trades&limit=20
```

## Adding Custom Doctrine

Create a JSON file with rules and strategies:
```json
{
  "rules": [
    {
      "name": "momentum_rule",
      "condition": { "type": "pattern", "value": "breakout" },
      "action": "Increase position size by 25%"
    }
  ]
}
```

Ingest via API:
```
POST /doctrine/ingest
{
  "path": "./doctrine/momentum.json",
  "id": "momentum_doctrine"
}
```

## Frontend Interface

Open `mover-frontend.html` in a browser for:
- Real-time narration feed
- Performance statistics
- Houston progress tracking
- Voice control
- Personality switching

## Architecture

```
The Mover
├── mover-core.js        # AI brain and narration engine
├── mover-memory.js      # Memory management system
├── mover-server.js      # WebSocket and HTTP server
├── mover-log-interpreter.js  # Log analysis
├── primary_doctrine.json     # Initial trading rules
└── mover-frontend.html      # Web interface
```

## Integration with OGZ Prime

The Mover connects to OGZ Prime's WebSocket (default port 8080) and listens for:
- Trade executions
- Market analysis updates
- System alerts
- Pattern detections

## Performance

- Processes events in <100ms
- Maintains last 10,000 events in memory
- Persists memory every minute
- Handles 1000+ narrations per hour

## Future Enhancements

- ElevenLabs voice synthesis
- Discord/Telegram notifications
- Stream Deck integration
- Advanced pattern learning
- Multi-language support

## Support

For issues or questions:
- Check logs in ./logs directory
- Use /health endpoint for diagnostics
- Memory stats at /memory/recall

---

Built with 💪 for the journey to Houston 🚀

## Recent Updates

**Memory System Restored (Fixed)**: The Mover's memory capacity has been restored to full capabilities:
- `mover-memory-vps.js`: Increased to 10,000 events, 50 categories
- `mover-vps-config.js`: Full capacity 50,000 events, 100 categories  
- Supports all functions: trading, tech support, sales, development, Discord, VSCode, etc.
- Ready for million-line training with unlimited memory during training phase
