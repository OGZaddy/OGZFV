// BrokerSetupInterface.js - User-friendly broker configuration interface
// Provides CLI and web interface for setting up broker connections

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const BrokerConfigManager = require('./BrokerConfigManager');
const MultiBrokerManager = require('./MultiBrokerManager');

/**
 * Broker Setup Interface
 * Provides interactive setup for broker configurations
 */
class BrokerSetupInterface {
  constructor(config = {}) {
    this.config = {
      userId: config.userId || 'default_user',
      interactiveMode: config.interactiveMode !== false,
      ...config
    };
    
    // Initialize managers
    this.configManager = new BrokerConfigManager();
    this.brokerManager = new MultiBrokerManager();
    
    // Setup readline interface for CLI
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  /**
   * Start the broker setup process
   * @returns {Promise<Object>} Setup results
   */
  async start() {
    console.log('\n🚀 Welcome to OGZ Prime Broker Setup');
    console.log('=====================================\n');
    
    if (this.config.interactiveMode) {
      return this.runInteractiveSetup();
    } else {
      return this.runQuickSetup();
    }
  }
  
  /**
   * Run interactive broker setup
   * @returns {Promise<Object>} Setup results
   * @private
   */
  async runInteractiveSetup() {
    try {
      // Show existing configurations
      await this.showExistingConfigurations();
      
      // Main menu
      while (true) {
        const choice = await this.showMainMenu();
        
        switch (choice) {
          case '1':
            await this.addNewBroker();
            break;
          case '2':
            await this.testBrokerConnections();
            break;
          case '3':
            await this.editBrokerConfiguration();
            break;
          case '4':
            await this.removeBrokerConfiguration();
            break;
          case '5':
            await this.exportConfigurations();
            break;
          case '6':
            await this.importConfigurations();
            break;
          case '7':
            await this.startTrading();
            return { status: 'ready_to_trade' };
          case '8':
            console.log('\n👋 Goodbye! Happy trading with OGZ Prime!');
            return { status: 'exit' };
          default:
            console.log('❌ Invalid choice. Please try again.');
        }
      }
    } catch (error) {
      console.error(`❌ Setup failed: ${error.message}`);
      return { status: 'error', error: error.message };
    } finally {
      this.rl.close();
    }
  }
  
  /**
   * Show existing broker configurations
   * @private
   */
  async showExistingConfigurations() {
    const userConfigs = this.configManager.getUserConfigurations(this.config.userId);
    
    if (userConfigs.length === 0) {
      console.log('📋 No broker configurations found. Let\'s set up your first broker!\n');
      return;
    }
    
    console.log('📋 Your Current Broker Configurations:');
    console.log('=====================================');
    
    userConfigs.forEach((config, index) => {
      const lastUsed = config.lastUsed 
        ? new Date(config.lastUsed).toLocaleDateString()
        : 'Never';
      
      console.log(`${index + 1}. ${config.name} (${config.brokerId.toUpperCase()})`);
      console.log(`   Created: ${new Date(config.createdAt).toLocaleDateString()}`);
      console.log(`   Last Used: ${lastUsed}\n`);
    });
  }
  
  /**
   * Show main menu and get user choice
   * @returns {Promise<string>} User choice
   * @private
   */
  async showMainMenu() {
    console.log('\n🔧 What would you like to do?');
    console.log('1. Add New Broker');
    console.log('2. Test Broker Connections');
    console.log('3. Edit Broker Configuration');
    console.log('4. Remove Broker Configuration');
    console.log('5. Export Configurations');
    console.log('6. Import Configurations');
    console.log('7. Start Trading with OGZ Prime');
    console.log('8. Exit');
    
    return this.question('\nEnter your choice (1-8): ');
  }
  
  /**
   * Add a new broker configuration
   * @private
   */
  async addNewBroker() {
    console.log('\n➕ Adding New Broker Configuration');
    console.log('==================================');
    
    // Show supported brokers
    const supportedBrokers = this.configManager.getSupportedBrokers();
    
    console.log('\n📊 Supported Brokers:');
    supportedBrokers.forEach((broker, index) => {
      console.log(`${index + 1}. ${broker.name} - ${broker.description}`);
      console.log(`   Markets: ${broker.markets.join(', ')}`);
      console.log(`   Paper Trading: ${broker.paperTrading ? 'Yes' : 'No'}\n`);
    });
    
    // Get broker selection
    const brokerChoice = await this.question('Select a broker (enter number): ');
    const brokerIndex = parseInt(brokerChoice) - 1;
    
    if (brokerIndex < 0 || brokerIndex >= supportedBrokers.length) {
      console.log('❌ Invalid broker selection.');
      return;
    }
    
    const selectedBroker = supportedBrokers[brokerIndex];
    
    // Get configuration name
    const configName = await this.question(`\nEnter a name for this ${selectedBroker.name} configuration: `);
    
    // Collect credentials
    console.log(`\n🔐 Enter your ${selectedBroker.name} credentials:`);
    const credentials = {};
    
    for (const field of selectedBroker.requiredFields) {
      if (field.type === 'select') {
        console.log(`\n${field.label} options: ${field.options.join(', ')}`);
        const value = await this.question(`${field.label}: `);
        if (field.options.includes(value)) {
          credentials[field.name] = value;
        } else {
          console.log(`❌ Invalid option. Please choose from: ${field.options.join(', ')}`);
          return;
        }
      } else if (field.type === 'checkbox') {
        const value = await this.question(`${field.label} (y/n): `);
        credentials[field.name] = value.toLowerCase() === 'y' || value.toLowerCase() === 'yes';
      } else {
        const value = await this.question(`${field.label}: `);
        credentials[field.name] = value;
      }
    }
    
    try {
      // Add configuration
      console.log('\n🔄 Testing connection...');
      const configId = await this.configManager.addBrokerConfig(
        this.config.userId,
        selectedBroker.id,
        configName,
        credentials
      );
      
      console.log(`✅ Successfully added ${selectedBroker.name} configuration!`);
      console.log(`   Configuration ID: ${configId}`);
      console.log(`   Name: ${configName}\n`);
    } catch (error) {
      console.log(`❌ Failed to add broker configuration: ${error.message}\n`);
    }
  }
  
  /**
   * Test broker connections
   * @private
   */
  async testBrokerConnections() {
    console.log('\n🔍 Testing Broker Connections');
    console.log('=============================');
    
    const userConfigs = this.configManager.getUserConfigurations(this.config.userId);
    
    if (userConfigs.length === 0) {
      console.log('❌ No broker configurations to test.');
      return;
    }
    
    for (const config of userConfigs) {
      console.log(`\n🔄 Testing ${config.name} (${config.brokerId.toUpperCase()})...`);
      
      try {
        const success = await this.configManager.testBrokerConnection(
          config.brokerId,
          config.credentials
        );
        
        if (success) {
          console.log(`✅ ${config.name} connection successful!`);
        } else {
          console.log(`❌ ${config.name} connection failed.`);
        }
      } catch (error) {
        console.log(`❌ ${config.name} connection error: ${error.message}`);
      }
    }
    
    console.log('\n🏁 Connection testing complete.');
  }
  
  /**
   * Start trading with configured brokers
   * @private
   */
  async startTrading() {
    console.log('\n🚀 Starting OGZ Prime Trading System');
    console.log('===================================');
    
    const userConfigs = this.configManager.getUserConfigurations(this.config.userId);
    
    if (userConfigs.length === 0) {
      console.log('❌ No broker configurations found. Please add at least one broker first.');
      return;
    }
    
    // Select primary broker
    console.log('\n📊 Available Brokers:');
    userConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name} (${config.brokerId.toUpperCase()})`);
    });
    
    const primaryChoice = await this.question('\nSelect primary broker (enter number): ');
    const primaryIndex = parseInt(primaryChoice) - 1;
    
    if (primaryIndex < 0 || primaryIndex >= userConfigs.length) {
      console.log('❌ Invalid broker selection.');
      return;
    }
    
    const primaryConfig = userConfigs[primaryIndex];
    
    // Prepare broker configurations for MultiBrokerManager
    const brokerConfigs = {};
    
    for (const config of userConfigs) {
      brokerConfigs[config.brokerId] = config.credentials;
    }
    
    try {
      // Initialize MultiBrokerManager
      console.log('\n🔄 Initializing broker connections...');
      
      const managerConfig = {
        primaryBroker: primaryConfig.brokerId,
        enableFailover: userConfigs.length > 1,
        logAllOrders: true
      };
      
      this.brokerManager = new MultiBrokerManager(managerConfig);
      
      const initialized = await this.brokerManager.initialize(brokerConfigs);
      
      if (initialized) {
        console.log('✅ All brokers connected successfully!');
        console.log(`🎯 Primary broker: ${primaryConfig.name}`);
        
        if (userConfigs.length > 1) {
          console.log('🔄 Failover enabled with additional brokers');
        }
        
        // Mark configurations as used
        userConfigs.forEach(config => {
          this.configManager.markConfigUsed(config.id);
        });
        
        console.log('\n🎉 OGZ Prime is ready to trade!');
        console.log('The trading system will now take control...\n');
      } else {
        console.log('❌ Failed to initialize broker connections.');
      }
    } catch (error) {
      console.log(`❌ Failed to start trading system: ${error.message}`);
    }
  }
  
  /**
   * Edit existing broker configuration
   * @private
   */
  async editBrokerConfiguration() {
    console.log('\n✏️ Edit Broker Configuration');
    console.log('============================');
    
    const userConfigs = this.configManager.getUserConfigurations(this.config.userId);
    
    if (userConfigs.length === 0) {
      console.log('❌ No broker configurations to edit.');
      return;
    }
    
    console.log('\n📊 Your Configurations:');
    userConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name} (${config.brokerId.toUpperCase()})`);
    });
    
    const choice = await this.question('\nSelect configuration to edit (enter number): ');
    const configIndex = parseInt(choice) - 1;
    
    if (configIndex < 0 || configIndex >= userConfigs.length) {
      console.log('❌ Invalid configuration selection.');
      return;
    }
    
    const configToEdit = userConfigs[configIndex];
    
    console.log(`\n✏️ Editing: ${configToEdit.name}`);
    console.log('What would you like to edit?');
    console.log('1. Configuration Name');
    console.log('2. Credentials');
    console.log('3. Back to Main Menu');
    
    const editChoice = await this.question('\nEnter your choice (1-3): ');
    
    switch (editChoice) {
      case '1':
        const newName = await this.question('Enter new configuration name: ');
        await this.configManager.updateBrokerConfig(configToEdit.id, { name: newName });
        console.log('✅ Configuration name updated!');
        break;
      case '2':
        console.log('🔐 Update credentials (press Enter to keep current value):');
        // This would implement credential updating logic
        console.log('⚠️ Credential editing feature coming soon!');
        break;
      case '3':
        return;
      default:
        console.log('❌ Invalid choice.');
    }
  }
  
  /**
   * Remove broker configuration
   * @private
   */
  async removeBrokerConfiguration() {
    console.log('\n🗑️ Remove Broker Configuration');
    console.log('==============================');
    
    const userConfigs = this.configManager.getUserConfigurations(this.config.userId);
    
    if (userConfigs.length === 0) {
      console.log('❌ No broker configurations to remove.');
      return;
    }
    
    console.log('\n📊 Your Configurations:');
    userConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name} (${config.brokerId.toUpperCase()})`);
    });
    
    const choice = await this.question('\nSelect configuration to remove (enter number): ');
    const configIndex = parseInt(choice) - 1;
    
    if (configIndex < 0 || configIndex >= userConfigs.length) {
      console.log('❌ Invalid configuration selection.');
      return;
    }
    
    const configToRemove = userConfigs[configIndex];
    
    const confirm = await this.question(`\n⚠️ Are you sure you want to remove "${configToRemove.name}"? (y/n): `);
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      const success = this.configManager.removeBrokerConfig(configToRemove.id);
      
      if (success) {
        console.log('✅ Configuration removed successfully!');
      } else {
        console.log('❌ Failed to remove configuration.');
      }
    } else {
      console.log('❌ Removal cancelled.');
    }
  }
  
  /**
   * Export configurations
   * @private
   */
  async exportConfigurations() {
    console.log('\n📤 Export Configurations');
    console.log('========================');
    
    try {
      const exportData = this.configManager.exportConfigurations(this.config.userId);
      const exportFile = path.join(process.cwd(), `ogz-broker-configs-${Date.now()}.json`);
      
      fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
      
      console.log(`✅ Configurations exported to: ${exportFile}`);
      console.log('💡 Keep this file secure - it contains encrypted broker credentials!');
    } catch (error) {
      console.log(`❌ Export failed: ${error.message}`);
    }
  }
  
  /**
   * Import configurations
   * @private
   */
  async importConfigurations() {
    console.log('\n📥 Import Configurations');
    console.log('========================');
    
    const importFile = await this.question('Enter path to configuration file: ');
    
    if (!fs.existsSync(importFile)) {
      console.log('❌ File not found.');
      return;
    }
    
    try {
      const importData = JSON.parse(fs.readFileSync(importFile, 'utf8'));
      const importedCount = this.configManager.importConfigurations(this.config.userId, importData);
      
      console.log(`✅ Successfully imported ${importedCount} configurations!`);
    } catch (error) {
      console.log(`❌ Import failed: ${error.message}`);
    }
  }
  
  /**
   * Run quick setup mode (non-interactive)
   * @returns {Promise<Object>} Setup results
   * @private
   */
  async runQuickSetup() {
    console.log('🚀 Quick Setup Mode - Loading existing configurations...\n');
    
    const userConfigs = this.configManager.getUserConfigurations(this.config.userId);
    
    if (userConfigs.length === 0) {
      console.log('❌ No broker configurations found. Please run in interactive mode first.');
      return { status: 'no_configs' };
    }
    
    // Use first configuration as primary
    const primaryConfig = userConfigs[0];
    
    // Prepare broker configurations
    const brokerConfigs = {};
    for (const config of userConfigs) {
      brokerConfigs[config.brokerId] = config.credentials;
    }
    
    // Initialize MultiBrokerManager
    const managerConfig = {
      primaryBroker: primaryConfig.brokerId,
      enableFailover: userConfigs.length > 1
    };
    
    this.brokerManager = new MultiBrokerManager(managerConfig);
    
    const initialized = await this.brokerManager.initialize(brokerConfigs);
    
    if (initialized) {
      console.log('✅ Broker connections established!');
      return { 
        status: 'ready', 
        brokerManager: this.brokerManager,
        primaryBroker: primaryConfig.brokerId
      };
    } else {
      console.log('❌ Failed to initialize broker connections.');
      return { status: 'connection_failed' };
    }
  }
  
  /**
   * Prompt user for input
   * @param {string} prompt - Question prompt
   * @returns {Promise<string>} User input
   * @private
   */
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
  
  /**
   * Get the initialized broker manager
   * @returns {MultiBrokerManager} Broker manager instance
   */
  getBrokerManager() {
    return this.brokerManager;
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
    }
  }
}

module.exports = BrokerSetupInterface;