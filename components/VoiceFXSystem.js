// VoiceFXSystem.js - Visceral audio feedback for trading events
// Makes your bot sound ALIVE with reactive sound effects

class VoiceFXSystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.volume = options.volume || 0.7;
    
    // Initialize Web Audio API
    this.audioContext = null;
    this.sounds = {};
    this.voices = {
      main: options.voice || 'Alex', // System voice
      rate: options.rate || 1.1,
      pitch: options.pitch || 1.0
    };
    
    // Sound effect presets
    this.presets = {
      profit: { reverb: 0.3, delay: 0.1, pitch: 1.2, excitement: 0.8 },
      loss: { reverb: 0.1, delay: 0, pitch: 0.8, excitement: 0.3 },
      warning: { reverb: 0.2, delay: 0.05, pitch: 0.9, excitement: 0.6 },
      epic: { reverb: 0.5, delay: 0.2, pitch: 1.1, excitement: 1.0 },
      calm: { reverb: 0.1, delay: 0, pitch: 1.0, excitement: 0.2 }
    };
    
    this.initialize();
  }

  initialize() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.setupEffects();
      this.loadSounds();
    }
  }

  setupEffects() {
    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volume;
    
    // Reverb (convolver)
    this.convolver = this.audioContext.createConvolver();
    this.reverbGain = this.audioContext.createGain();
    
    // Delay
    this.delay = this.audioContext.createDelay(1.0);
    this.delayGain = this.audioContext.createGain();
    
    // Filter for tone shaping
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = 'highpass';
    this.filter.frequency.value = 100;
    
    // Connect effects chain
    this.connectEffects();
    
    // Create impulse response for reverb
    this.createReverbImpulse();
  }

  connectEffects() {
    // Dry path
    this.filter.connect(this.masterGain);
    
    // Reverb path
    this.filter.connect(this.convolver);
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
    
    // Delay path
    this.filter.connect(this.delay);
    this.delay.connect(this.delayGain);
    this.delayGain.connect(this.masterGain);
    
    // Feedback loop for delay
    this.delayGain.connect(this.delay);
    
    // Connect to output
    this.masterGain.connect(this.audioContext.destination);
  }

  createReverbImpulse() {
    const length = this.audioContext.sampleRate * 2; // 2 second reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    this.convolver.buffer = impulse;
  }

  /**
   * Load sound effects
   */
  async loadSounds() {
    // Synthesize basic trading sounds
    this.sounds = {
      profit: this.createProfitSound(),
      loss: this.createLossSound(),
      alert: this.createAlertSound(),
      success: this.createSuccessSound(),
      tick: this.createTickSound()
    };
  }

  createProfitSound() {
    return () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.filter);
      
      // Rising tone for profit
      osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.5);
    };
  }

  createLossSound() {
    return () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.filter);
      
      // Falling tone for loss
      osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.4);
    };
  }

  createAlertSound() {
    return () => {
      // Two-tone alert
      [440, 554].forEach((freq, i) => {
        setTimeout(() => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(this.filter);
          
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
          
          osc.start();
          osc.stop(this.audioContext.currentTime + 0.1);
        }, i * 150);
      });
    };
  }

  createSuccessSound() {
    return () => {
      const notes = [523, 659, 784]; // C, E, G
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(this.filter);
          
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
          
          osc.start();
          osc.stop(this.audioContext.currentTime + 0.3);
        }, i * 100);
      });
    };
  }

  createTickSound() {
    return () => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.filter);
      
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.02);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.02);
    };
  }

  /**
   * Speak with effects
   */
  speak(text, preset = 'calm') {
    if (!this.enabled) return;
    
    const effectSettings = this.presets[preset] || this.presets.calm;
    
    // Apply effect settings
    this.applyEffects(effectSettings);
    
    // Use speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings based on preset
      utterance.rate = this.voices.rate * (1 + (effectSettings.excitement - 0.5) * 0.4);
      utterance.pitch = this.voices.pitch * effectSettings.pitch;
      utterance.volume = this.volume;
      
      // Select voice
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name.includes(this.voices.main)) || voices[0];
      if (selectedVoice) utterance.voice = selectedVoice;
      
      speechSynthesis.speak(utterance);
    }
    
    // Play associated sound effect
    this.playEffectForPreset(preset);
  }

  applyEffects(settings) {
    // Set reverb amount
    this.reverbGain.gain.value = settings.reverb || 0.2;
    
    // Set delay
    this.delay.delayTime.value = settings.delay || 0;
    this.delayGain.gain.value = settings.delay > 0 ? 0.3 : 0;
    
    // Adjust filter based on excitement
    const filterFreq = 100 + (settings.excitement || 0.5) * 1000;
    this.filter.frequency.value = filterFreq;
  }

  playEffectForPreset(preset) {
    switch(preset) {
      case 'profit':
        this.sounds.profit?.();
        break;
      case 'loss':
        this.sounds.loss?.();
        break;
      case 'warning':
        this.sounds.alert?.();
        break;
      case 'epic':
        this.sounds.success?.();
        break;
      default:
        this.sounds.tick?.();
    }
  }

  /**
   * React to trading events
   */
  onTrade(trade) {
    if (!this.enabled) return;
    
    const profit = trade.profit || 0;
    
    if (profit > 5) {
      this.speak(`MASSIVE WIN! Plus ${profit.toFixed(1)} percent!`, 'epic');
    } else if (profit > 2) {
      this.speak(`Nice profit! ${profit.toFixed(1)} percent gain.`, 'profit');
    } else if (profit > 0) {
      this.speak(`Small win. ${profit.toFixed(1)} percent.`, 'calm');
    } else if (profit < -2) {
      this.speak(`Loss alert. Down ${Math.abs(profit).toFixed(1)} percent.`, 'loss');
    } else {
      this.speak(`Minor loss. ${Math.abs(profit).toFixed(1)} percent.`, 'calm');
    }
  }

  onCommandExecuted(command, result) {
    if (!this.enabled) return;
    
    if (result.success) {
      this.speak(result.message || 'Command executed successfully', 'calm');
    } else {
      this.speak(`Error: ${result.error}`, 'warning');
    }
  }

  onMilestone(type, value) {
    if (!this.enabled) return;
    
    switch(type) {
      case 'profit_target':
        this.speak(`PROFIT TARGET HIT! ${value} percent achieved!`, 'epic');
        break;
      case 'win_streak':
        this.speak(`${value} wins in a row! You're on fire!`, 'profit');
        break;
      case 'daily_goal':
        this.speak(`Daily goal reached! Time to celebrate!`, 'epic');
        break;
      case 'drawdown_warning':
        this.speak(`Warning: Drawdown at ${value} percent`, 'warning');
        break;
    }
  }

  /**
   * Play sound effect
   */
  playSound(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    this.sounds[soundName]();
  }

  /**
   * Set volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Toggle effects
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// React Component for Voice FX Control
const VoiceFXControl = ({ ogzPrime }) => {
  const [fxSystem] = React.useState(() => new VoiceFXSystem());
  const [enabled, setEnabled] = React.useState(fxSystem.enabled);
  const [volume, setVolume] = React.useState(fxSystem.volume * 100);
  const [testText, setTestText] = React.useState('');
  
  // Connect to OGZPrime events
  React.useEffect(() => {
    if (!ogzPrime) return;
    
    // Hook into trade events
    const onTrade = (trade) => fxSystem.onTrade(trade);
    const onCommand = (cmd, result) => fxSystem.onCommandExecuted(cmd, result);
    
    ogzPrime.on('trade_completed', onTrade);
    ogzPrime.on('command_executed', onCommand);
    
    return () => {
      ogzPrime.off('trade_completed', onTrade);
      ogzPrime.off('command_executed', onCommand);
    };
  }, [ogzPrime, fxSystem]);
  
  const toggleFX = () => {
    const newState = fxSystem.toggle();
    setEnabled(newState);
  };
  
  const updateVolume = (newVolume) => {
    setVolume(newVolume);
    fxSystem.setVolume(newVolume / 100);
  };
  
  const testPreset = (preset) => {
    fxSystem.speak(testText || `Testing ${preset} voice effect`, preset);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: '#000',
      border: '2px solid #00ff00',
      padding: '20px',
      borderRadius: '10px',
      color: '#00ff00',
      fontFamily: 'monospace',
      minWidth: '300px',
      zIndex: 9998
    }}>
      <h3 style={{ marginBottom: '15px' }}>🔊 Voice FX System</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={toggleFX} style={{
          padding: '10px 20px',
          background: enabled ? '#00ff00' : '#ff0000',
          color: '#000',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          {enabled ? '🔊 FX ON' : '🔇 FX OFF'}
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Volume: {volume}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => updateVolume(e.target.value)}
          style={{ width: '100%', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Test message..."
          style={{
            width: '100%',
            padding: '5px',
            background: '#111',
            border: '1px solid #00ff00',
            color: '#00ff00'
          }}
        />
      </div>
      
      <div>
        <strong>Test Presets:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '10px' }}>
          {Object.keys(fxSystem.presets).map(preset => (
            <button
              key={preset}
              onClick={() => testPreset(preset)}
              style={{
                padding: '5px 10px',
                background: '#111',
                border: '1px solid #00ff00',
                color: '#00ff00',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {preset.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

module.exports = { VoiceFXSystem, VoiceFXControl };
