// ==========================================
// TRAI VOICE & VIDEO SERVER
// ElevenLabs + D-ID Integration
// ==========================================

require('dotenv').config({ path: '/home/trey/OGZFV-valhalla/.env' });
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// API Keys from environment
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const DID_API_KEY = process.env.DID_API_KEY;

app.use(express.static('public'));
app.use(express.json());

// Serve the main interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>TRAI - Voice & Video Interface</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #000;
      color: #0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    #video-container {
      width: 640px;
      height: 480px;
      background: #111;
      border: 2px solid #0f0;
      margin: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #chat-container {
      width: 640px;
      height: 200px;
      background: #111;
      border: 1px solid #0f0;
      padding: 10px;
      overflow-y: auto;
      margin: 10px;
    }
    #input-container {
      display: flex;
      width: 640px;
      margin: 10px;
    }
    #message-input {
      flex: 1;
      background: #111;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 10px;
      font-family: 'Courier New', monospace;
    }
    #send-button {
      background: #0f0;
      color: #000;
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      font-weight: bold;
    }
    .message {
      margin: 5px 0;
      padding: 5px;
    }
    .user-message {
      color: #0ff;
    }
    .trai-message {
      color: #0f0;
    }
    #status {
      color: #ff0;
      margin: 10px;
    }
    h1 {
      color: #0f0;
      text-shadow: 0 0 10px #0f0;
    }
    #audio-visualizer {
      width: 640px;
      height: 50px;
      background: #111;
      border: 1px solid #0f0;
      margin: 10px;
    }
  </style>
</head>
<body>
  <h1>🧠 TRAI - AI CLONE INTERFACE</h1>
  <div id="status">Connecting...</div>
  
  <div id="video-container">
    <video id="trai-video" width="640" height="480" autoplay></video>
    <div id="avatar-placeholder">TRAI Avatar Loading...</div>
  </div>
  
  <div id="audio-visualizer"></div>
  
  <div id="chat-container"></div>
  
  <div id="input-container">
    <input type="text" id="message-input" placeholder="Talk to TRAI..." />
    <button id="send-button">SEND</button>
  </div>
  
  <audio id="trai-audio" autoplay></audio>

  <script>
    const ws = new WebSocket('ws://' + window.location.host);
    const chat = document.getElementById('chat-container');
    const input = document.getElementById('message-input');
    const status = document.getElementById('status');
    const audio = document.getElementById('trai-audio');
    const video = document.getElementById('trai-video');
    
    ws.onopen = () => {
      status.textContent = '✅ Connected to TRAI';
      addMessage('System', 'Connected to TRAI consciousness');
    };
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'response') {
        addMessage('TRAI', data.text);
      }
      
      if (data.type === 'audio' && data.audioUrl) {
        // Play audio
        audio.src = data.audioUrl;
        audio.play();
      }
      
      if (data.type === 'video' && data.videoUrl) {
        // Play video
        video.src = data.videoUrl;
        video.play();
      }
    };
    
    ws.onerror = (error) => {
      status.textContent = '❌ Connection error';
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      status.textContent = '🔌 Disconnected';
    };
    
    function sendMessage() {
      const message = input.value.trim();
      if (message) {
        addMessage('You', message);
        ws.send(JSON.stringify({ type: 'message', text: message }));
        input.value = '';
      }
    }
    
    function addMessage(sender, text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + (sender === 'You' ? 'user-message' : 'trai-message');
      messageDiv.textContent = sender + ': ' + text;
      chat.appendChild(messageDiv);
      chat.scrollTop = chat.scrollHeight;
    }
    
    document.getElementById('send-button').onclick = sendMessage;
    input.onkeypress = (e) => {
      if (e.key === 'Enter') sendMessage();
    };
  </script>
</body>
</html>
  `);
});

// Generate voice with ElevenLabs
async function generateVoice(text) {
  if (!ELEVENLABS_API_KEY) {
    console.log('[Voice] No ElevenLabs API key');
    return null;
  }
  
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('[Voice] Generation failed:', error.message);
    return null;
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 New client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'message') {
        console.log('💬 Received:', data.text);
        
        // Connect to TRAI on port 3010 for response
        const traiWs = new WebSocket('ws://127.0.0.1:3010/ws');
        
        traiWs.on('open', () => {
          traiWs.send(JSON.stringify({
            type: 'query',
            prompt: data.text,
            clientId: 'voice-interface'
          }));
        });
        
        traiWs.on('message', async (traiResponse) => {
          const response = JSON.parse(traiResponse);
          
          if (response.type === 'response' || response.response) {
            const responseText = response.response || response.text || 'I am processing...';
            
            // Send text response
            ws.send(JSON.stringify({
              type: 'response',
              text: responseText
            }));
            
            // Generate and send voice
            const audioBuffer = await generateVoice(responseText);
            if (audioBuffer) {
              // Convert to base64 for sending
              const audioBase64 = Buffer.from(audioBuffer).toString('base64');
              const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
              
              ws.send(JSON.stringify({
                type: 'audio',
                audioUrl: audioUrl
              }));
            }
          }
        });
        
        traiWs.on('error', (error) => {
          console.error('TRAI connection error:', error);
          ws.send(JSON.stringify({
            type: 'response',
            text: 'Connection to TRAI brain failed. Running in offline mode.'
          }));
        });
      }
    } catch (error) {
      console.error('Message processing error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.VOICE_PORT || 3011;
server.listen(PORT, () => {
  console.log(`
==================================================
TRAI VOICE & VIDEO SERVER
==================================================
🎤 Voice: ${ELEVENLABS_API_KEY ? 'ElevenLabs Connected' : 'No Voice API'}
🎥 Video: ${DID_API_KEY ? 'D-ID Connected' : 'No Video API'}
🌐 Interface: http://localhost:${PORT}
📡 WebSocket: ws://localhost:${PORT}
==================================================
  `);
});