// ==========================================
// THE MOVER - VOICE & VIDEO INTEGRATION
// ElevenLabs + D-ID API Integration
// ==========================================

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class VoiceVideoIntegration {
  constructor() {
    this.elevenlabsKey = process.env.ELEVENLABS_API_KEY;
    this.elevenlabsVoiceId = process.env.ELEVENLABS_VOICE_ID;
    this.didApiKey = process.env.DID_API_KEY;
    this.didAvatarId = process.env.DID_AVATAR_ID;
    
    console.log('[VoiceVideo] Integration initializing...');
    
    if (!this.elevenlabsKey) {
      console.warn('[VoiceVideo] ElevenLabs API key missing');
    }
    
    if (!this.didApiKey) {
      console.warn('[VoiceVideo] D-ID API key missing');
    }
  }

  async generateVoice(text, options = {}) {
    try {
      if (!this.elevenlabsKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenlabsVoiceId}`,
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
            'xi-api-key': this.elevenlabsKey
          },
          responseType: 'arraybuffer'
        }
      );

      // Save audio file
      const audioPath = path.join(__dirname, '../data/mover-audio');
      await fs.mkdir(audioPath, { recursive: true });
      
      const filename = `mover_${Date.now()}.mp3`;
      const filepath = path.join(audioPath, filename);
      
      await fs.writeFile(filepath, response.data);
      
      console.log(`[VoiceVideo] Generated voice: ${filename}`);
      
      return {
        success: true,
        audioFile: filepath,
        filename: filename,
        url: `/mover-audio/${filename}`
      };
      
    } catch (error) {
      console.error('[VoiceVideo] Voice generation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async generateVideo(audioUrl, text, options = {}) {
    try {
      if (!this.didApiKey) {
        throw new Error('D-ID API key not configured');
      }

      // Create video with D-ID
      const response = await axios.post(
        'https://api.d-id.com/talks',
        {
          source_url: options.avatarImageUrl || process.env.AVATAR_IMAGE_URL,
          script: {
            type: "audio",
            audio_url: audioUrl,
            subtitles: "false"
          },
          config: {
            fluent: "false",
            pad_audio: "0.0"
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.didApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const talkId = response.data.id;
      console.log(`[VoiceVideo] Video generation started: ${talkId}`);

      // Poll for completion
      let videoReady = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait

      while (!videoReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        try {
          const statusResponse = await axios.get(
            `https://api.d-id.com/talks/${talkId}`,
            {
              headers: {
                'Authorization': `Basic ${this.didApiKey}`
              }
            }
          );

          const status = statusResponse.data.status;
          console.log(`[VoiceVideo] Video status: ${status}`);

          if (status === 'done') {
            videoReady = true;
            return {
              success: true,
              videoUrl: statusResponse.data.result_url,
              talkId: talkId,
              status: 'completed'
            };
          } else if (status === 'error') {
            throw new Error('Video generation failed');
          }

        } catch (statusError) {
          console.error('[VoiceVideo] Status check error:', statusError.message);
        }

        attempts++;
      }

      return {
        success: false,
        error: 'Video generation timeout',
        talkId: talkId
      };

    } catch (error) {
      console.error('[VoiceVideo] Video generation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async generateComplete(text, options = {}) {
    try {
      console.log('[VoiceVideo] Generating complete response for:', text.substring(0, 50) + '...');

      // Generate voice first
      const voiceResult = await this.generateVoice(text, options);
      
      if (!voiceResult.success) {
        return { success: false, error: 'Voice generation failed', details: voiceResult };
      }

      // Generate video if requested
      if (options.includeVideo && this.didApiKey) {
        const videoResult = await this.generateVideo(voiceResult.url, text, options);
        
        return {
          success: true,
          voice: voiceResult,
          video: videoResult,
          text: text,
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        voice: voiceResult,
        text: text,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[VoiceVideo] Complete generation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    const results = {
      elevenlabs: false,
      did: false,
      errors: []
    };

    // Test ElevenLabs
    try {
      if (this.elevenlabsKey) {
        const testResponse = await axios.get('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': this.elevenlabsKey }
        });
        results.elevenlabs = testResponse.status === 200;
        console.log('[VoiceVideo] ElevenLabs connection: ✅');
      } else {
        results.errors.push('ElevenLabs API key missing');
      }
    } catch (error) {
      results.errors.push(`ElevenLabs error: ${error.message}`);
      console.log('[VoiceVideo] ElevenLabs connection: ❌');
    }

    // Test D-ID
    try {
      if (this.didApiKey) {
        const testResponse = await axios.get('https://api.d-id.com/talks', {
          headers: { 'Authorization': `Basic ${this.didApiKey}` }
        });
        results.did = testResponse.status === 200;
        console.log('[VoiceVideo] D-ID connection: ✅');
      } else {
        results.errors.push('D-ID API key missing');
      }
    } catch (error) {
      results.errors.push(`D-ID error: ${error.message}`);
      console.log('[VoiceVideo] D-ID connection: ❌');
    }

    return results;
  }
}

module.exports = VoiceVideoIntegration;