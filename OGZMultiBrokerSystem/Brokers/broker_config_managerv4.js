// BrokerConfigManager.js - Manages broker configurations and user login
// Provides GUI interface for users to configure their broker accounts

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Broker Configuration Manager
 * Handles storing, encrypting, and managing multiple broker configurations
 */
class BrokerConfigManager {
  constructor(config = {}) {
    this.config = {
      configDirectory: path.join(process.cwd(), 'broker-configs'),
      encryptionKey: config.encryptionKey || this.generateEncryptionKey(),
      maxConfigs: 10, // Maximum number of broker configs per user
      supportedBrokers: [
        'alpaca',
        'robinhood',
        'tdameritrade',
        'kraken',
        'coinbase',
        'binance',
        'ibkr'
      ],
      ...config
    };
    
    // Ensure config directory exists
    if (!fs.existsSync(this.config.configDirectory)) {
      fs.mkdirSync(this.config.configDirectory, { recursive: true });
    }
    
    // Load existing configurations
    this.configurations = new Map();
    this.loadConfigurations();
  }
  
  /**
   * Get all supported brokers with their details
   * @returns {Array} Array of broker information
   */
  getSupportedBrokers() {
    return [
      {
        id: 'alpaca',
        name: 'Alpaca Markets',
        description: 'Commission-free stock & ETF trading',
        markets: ['stocks', 'etfs'],
        paperTrading: true,
        requiredFields: [
          { name: 'apiKey', label: 'API Key', type: 'text', required: true },
          { name: 'apiSecret', label: 'API Secret', type: 'password', required: true },
          { name: 'sandbox', label: 'Paper Trading', type: 'checkbox', required: false }
        ]
      },
      {
        id: 'kraken',
        name: 'Kraken',
        description: 'Leading cryptocurrency exchange',
        markets: ['crypto'],
        paperTrading: false,
        requiredFields: [
          { name: 'apiKey', label: 'API Key', type: 'text', required: true },
          { name: 'apiSecret', label: 'API Secret', type: 'password', required: true }
        ]
      },
      {
        id: 'coinbase',
        name: 'Coinbase Pro',
        description: 'Professional cryptocurrency trading',
        markets: ['crypto'],
        paperTrading: true,
        requiredFields: [
          { name: 'apiKey', label: 'API Key', type: 'text', required: true },
          { name: 'apiSecret', label: 'API Secret', type: 'password', required: true },
          { name: 'passphrase', label: 'Passphrase', type: 'password', required: true },
          { name: 'sandbox', label: 'Sandbox Mode', type: 'checkbox', required: false }
        ]
      },
      {
        id: 'binance',
        name: 'Binance',
        description: 'World\'s largest cryptocurrency exchange',
        markets: ['crypto'],
        paperTrading: false,
        requiredFields: [
          { name: 'apiKey', label: 'API Key', type: 'text', required: true },
          { name: 'apiSecret', label: 'API Secret', type: 'password', required: true }
        ]
      },
      {
        id: 'robinhood',
        name: 'Robinhood',
        description: 'Commission-free stocks, ETFs, options & crypto',
        markets: ['stocks', 'etfs', 'crypto', 'options'],
        paperTrading: false,
        requiredFields: [
          { name: 'username', label: 'Username', type: 'text', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true },
          { name: 'mfaCode', label: 'MFA Code (if enabled)', type: 'text', required: false },
          { name: 'deviceId', label: 'Device ID (optional)', type: 'text', required: false }
        ]
      },
      {
        id: 'tdameritrade',
        name: 'TD Ameritrade (Schwab)',
        description: 'Professional trading platform with advanced tools',
        markets: ['stocks', 'etfs', 'options', 'mutual_funds'],
        paperTrading: true,
        requiredFields: [
          { name: 'clientId', label: 'Client ID', type: 'text', required: true },
          { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: false },
          { name: 'accessToken', label: 'Access Token', type: 'password', required: false },
          { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: false }
        ]
      },
    ];
  }
  
  /**
   * Add a new broker configuration
   * @param {string} userId - User identifier
   * @param {string} brokerId - Broker identifier
   * @param {string} configName - Configuration name
   * @param {Object} credentials - Broker credentials
   * @param {Object} settings - Additional settings
   * @returns {Promise<string>} Configuration ID
   */
  async addBrokerConfig(userId, brokerId, configName, credentials, settings = {}) {
    try {
      // Validate broker ID
      if (!this.config.supportedBrokers.includes(brokerId)) {
        throw new Error(`Unsupported broker: ${brokerId}`);
      }
      
      // Validate required fields
      const brokerInfo = this.getSupportedBrokers().find(b => b.id === brokerId);
      const missingFields = brokerInfo.requiredFields
        .filter(field => field.required && !credentials[field.name])
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Check configuration limit
      const userConfigs = this.getUserConfigurations(userId);
      if (userConfigs.length >= this.config.maxConfigs) {
        throw new Error(`Maximum number of configurations (${this.config.maxConfigs}) reached`);
      }
      
      // Create configuration
      const configId = this.generateConfigId();
      const configuration = {
        id: configId,
        userId,
        brokerId,
        name: configName,
        credentials: this.encryptCredentials(credentials),
        settings,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        active: true
      };
      
      // Test connection before saving
      await this.testBrokerConnection(brokerId, credentials);
      
      // Store configuration
      this.configurations.set(configId, configuration);
      
      // Save to disk
      this.saveConfiguration(configId, configuration);
      
      console.log(`✅ Added broker configuration: ${configName} (${brokerId})`);
      
      return configId;
    } catch (error) {
      console.error(`❌ Failed to add broker configuration: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update an existing broker configuration
   * @param {string} configId - Configuration ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<boolean>} Success status
   */
  async updateBrokerConfig(configId, updates) {
    try {
      const config = this.configurations.get(configId);
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      // Create updated configuration
      const updatedConfig = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // If credentials are being updated, test connection
      if (updates.credentials) {
        updatedConfig.credentials = this.encryptCredentials(updates.credentials);
        await this.testBrokerConnection(config.brokerId, updates.credentials);
      }
      
      // Update in memory and save to disk
      this.configurations.set(configId, updatedConfig);
      this.saveConfiguration(configId, updatedConfig);
      
      console.log(`✅ Updated broker configuration: ${configId}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to update broker configuration: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Remove a broker configuration
   * @param {string} configId - Configuration ID
   * @returns {boolean} Success status
   */
  removeBrokerConfig(configId) {
    try {
      const config = this.configurations.get(configId);
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      // Remove from memory
      this.configurations.delete(configId);
      
      // Remove file
      const configFile = path.join(this.config.configDirectory, `${configId}.json`);
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile);
      }
      
      console.log(`✅ Removed broker configuration: ${configId}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove broker configuration: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get broker configuration by ID
   * @param {string} configId - Configuration ID
   * @returns {Object|null} Configuration or null if not found
   */
  getBrokerConfig(configId) {
    const config = this.configurations.get(configId);
    if (!config) return null;
    
    // Return decrypted configuration
    return {
      ...config,
      credentials: this.decryptCredentials(config.credentials)
    };
  }
  
  /**
   * Get all configurations for a user
   * @param {string} userId - User identifier
   * @returns {Array} Array of user configurations
   */
  getUserConfigurations(userId) {
    const userConfigs = [];
    
    for (const [configId, config] of this.configurations) {
      if (config.userId === userId && config.active) {
        userConfigs.push({
          ...config,
          credentials: this.decryptCredentials(config.credentials)
        });
      }
    }
    
    return userConfigs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  /**
   * Test broker connection
   * @param {string} brokerId - Broker identifier
   * @param {Object} credentials - Broker credentials
   * @returns {Promise<boolean>} Connection test result
   */
  async testBrokerConnection(brokerId, credentials) {
    try {
      // Create temporary adapter for testing
      const AdapterClass = this.getBrokerAdapterClass(brokerId);
      const testAdapter = new AdapterClass(credentials);
      
      // Test connection
      const connected = await testAdapter.connect();
      
      // Clean up
      await testAdapter.disconnect();
      
      return connected;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }
  
  /**
   * Get broker adapter class
   * @param {string} brokerId - Broker identifier
   * @returns {Class} Adapter class
   * @private
   */
  getBrokerAdapterClass(brokerId) {
    const adapterMap = {
      'alpaca': require('./adapters/AlpacaAdapter'),
      'robinhood': require('./adapters/RobinhoodAdapter'),
      'tdameritrade': require('./adapters/TDAmeriteAdapter'),
      'kraken': require('./adapters/KrakenAdapter'),
      'coinbase': require('./adapters/CoinbaseAdapter'),
      'binance': require('./adapters/BinanceAdapter'),
      'ibkr': require('./adapters/IBKRAdapter')
    };
    
    const AdapterClass = adapterMap[brokerId];
    if (!AdapterClass) {
      throw new Error(`Adapter not found for broker: ${brokerId}`);
    }
    
    return AdapterClass;
  }
  
  /**
   * Load all configurations from disk
   * @private
   */
  loadConfigurations() {
    try {
      const configFiles = fs.readdirSync(this.config.configDirectory)
        .filter(file => file.endsWith('.json'));
      
      for (const file of configFiles) {
        const configPath = path.join(this.config.configDirectory, file);
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        this.configurations.set(configData.id, configData);
      }
      
      console.log(`📋 Loaded ${this.configurations.size} broker configurations`);
    } catch (error) {
      console.error('❌ Failed to load configurations:', error.message);
    }
  }
  
  /**
   * Save configuration to disk
   * @param {string} configId - Configuration ID
   * @param {Object} configuration - Configuration data
   * @private
   */
  saveConfiguration(configId, configuration) {
    const configFile = path.join(this.config.configDirectory, `${configId}.json`);
    fs.writeFileSync(configFile, JSON.stringify(configuration, null, 2));
  }
  
  /**
   * Encrypt credentials
   * @param {Object} credentials - Credentials to encrypt
   * @returns {Object} Encrypted credentials
   * @private
   */
  encryptCredentials(credentials) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.config.encryptionKey);
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  /**
   * Decrypt credentials
   * @param {Object} encryptedData - Encrypted credentials
   * @returns {Object} Decrypted credentials
   * @private
   */
  decryptCredentials(encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, this.config.encryptionKey);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ Failed to decrypt credentials:', error.message);
      return {};
    }
  }
  
  /**
   * Generate encryption key
   * @returns {string} Encryption key
   * @private
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Generate configuration ID
   * @returns {string} Configuration ID
   * @private
   */
  generateConfigId() {
    return `config_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Export configurations for backup
   * @param {string} userId - User identifier
   * @returns {Object} Exported configurations
   */
  exportConfigurations(userId) {
    const userConfigs = this.getUserConfigurations(userId);
    
    return {
      exportedAt: new Date().toISOString(),
      configurations: userConfigs.map(config => ({
        ...config,
        credentials: this.encryptCredentials(config.credentials) // Re-encrypt for export
      }))
    };
  }
  
  /**
   * Import configurations from backup
   * @param {string} userId - User identifier
   * @param {Object} exportedData - Exported configuration data
   * @returns {number} Number of configurations imported
   */
  importConfigurations(userId, exportedData) {
    let importedCount = 0;
    
    for (const config of exportedData.configurations) {
      try {
        // Generate new ID for imported config
        const newConfigId = this.generateConfigId();
        const importedConfig = {
          ...config,
          id: newConfigId,
          userId,
          importedAt: new Date().toISOString()
        };
        
        // Store configuration
        this.configurations.set(newConfigId, importedConfig);
        this.saveConfiguration(newConfigId, importedConfig);
        
        importedCount++;
      } catch (error) {
        console.error(`❌ Failed to import configuration: ${error.message}`);
      }
    }
    
    console.log(`✅ Imported ${importedCount} broker configurations`);
    
    return importedCount;
  }
  
  /**
   * Update last used timestamp
   * @param {string} configId - Configuration ID
   */
  markConfigUsed(configId) {
    const config = this.configurations.get(configId);
    if (config) {
      config.lastUsed = new Date().toISOString();
      this.saveConfiguration(configId, config);
    }
  }
  
  /**
   * Get configuration summary
   * @returns {Object} Summary statistics
   */
  getSummary() {
    const totalConfigs = this.configurations.size;
    const brokerCounts = {};
    
    for (const config of this.configurations.values()) {
      brokerCounts[config.brokerId] = (brokerCounts[config.brokerId] || 0) + 1;
    }
    
    return {
      totalConfigurations: totalConfigs,
      brokerBreakdown: brokerCounts,
      supportedBrokers: this.config.supportedBrokers
    };
  }
}

module.exports = BrokerConfigManager;