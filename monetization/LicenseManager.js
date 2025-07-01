LicenseManager.js
// monetization/licenseManager.js
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class LicenseManager {
  constructor(config = {}) {
    this.config = {
      publicKey: process.env.LICENSE_PUBLIC_KEY,
      privateKey: process.env.LICENSE_PRIVATE_KEY,
      apiEndpoint: process.env.LICENSE_API || 'https://api.ogzprime.com/license',
      cachePath: path.join(process.cwd(), 'data', '.licenses'),
      offlineGracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      heartbeatInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxDevices: 2,
      ...config
    };
    
    this.activeModules = new Set();
    this.cachedLicenses = new Map();
    this.deviceId = this.generateDeviceId();
    this.lastValidation = null;
    this.validationInterval = null;
  }

  async initialize() {
    // Create cache directory
    await fs.mkdir(this.config.cachePath, { recursive: true });
    
    // Load cached licenses
    await this.loadCachedLicenses();
    
    // Start heartbeat
    this.startHeartbeat();
  }

  generateDeviceId() {
    const { hostname, platform, arch } = require('os');
    const deviceString = `${hostname()}-${platform()}-${arch()}`;
    return crypto.createHash('sha256').update(deviceString).digest('hex');
  }

  async validateLicense(licenseKey, userId) {
    try {
      // Check cache first
      const cached = this.cachedLicenses.get(licenseKey);
      if (cached && cached.expires > Date.now()) {
        this.activeModules = new Set(cached.modules);
        return cached.modules;
      }

      // Validate with server
      const requestData = JSON.stringify({
        licenseKey,
        userId,
        deviceId: this.deviceId,
        version: '10.2.0',
        timestamp: Date.now()
      });

      const response = await this.makeRequest('/validate', 'POST', requestData);
      const data = JSON.parse(response);

      if (!data.valid) {
        throw new Error(data.message || 'Invalid license');
      }

      // Check device limit
      if (data.devices && data.devices.length >= this.config.maxDevices && 
          !data.devices.includes(this.deviceId)) {
        throw new Error(`License is already active on ${this.config.maxDevices} devices`);
      }

      // Cache the result
      const cacheData = {
        modules: data.modules,
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        userId,
        features: data.features || {},
        limits: data.limits || {}
      };

      this.cachedLicenses.set(licenseKey, cacheData);
      this.activeModules = new Set(data.modules);
      
      // Save to disk for offline use
      await this.saveLicenseCache(licenseKey, cacheData);
      
      this.lastValidation = Date.now();
      
      return data.modules;
    } catch (error) {
      console.error('License validation error:', error.message);
      
      // Try offline validation
      const offlineModules = await this.loadOfflineLicense(licenseKey);
      if (offlineModules.length > 0) {
        console.log('Using offline license cache');
        return offlineModules;
      }
      
      throw error;
    }
  }

  async makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.apiEndpoint + path);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'X-Device-ID': this.deviceId,
          'X-License-Version': '1.0'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', chunk => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async loadOfflineLicense(licenseKey) {
    try {
      const licensePath = path.join(this.config.cachePath, `${licenseKey}.json`);
      const data = await fs.readFile(licensePath, 'utf8');
      const license = JSON.parse(data);
      
      // Check if within grace period
      const gracePeriodEnd = this.lastValidation + this.config.offlineGracePeriod;
      if (Date.now() <= gracePeriodEnd && license.expires > Date.now()) {
        this.activeModules = new Set(license.modules);
        return license.modules;
      }
      
      throw new Error('Offline license expired');
    } catch (error) {
      console.error('Offline license load failed:', error.message);
      return [];
    }
  }

  async loadCachedLicenses() {
    try {
      const files = await fs.readdir(this.config.cachePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.cachePath, file);
          const data = await fs.readFile(filePath, 'utf8');
          const license = JSON.parse(data);
          const licenseKey = file.replace('.json', '');
          
          if (license.expires > Date.now()) {
            this.cachedLicenses.set(licenseKey, license);
          }
        }
      }
      
      console.log(`Loaded ${this.cachedLicenses.size} cached licenses`);
    } catch (error) {
      console.error('Error loading cached licenses:', error.message);
    }
  }

  async saveLicenseCache(licenseKey, licenseData) {
    try {
      const licensePath = path.join(this.config.cachePath, `${licenseKey}.json`);
      const dataToSave = {
        ...licenseData,
        deviceId: this.deviceId,
        savedAt: Date.now()
      };
      
      await fs.writeFile(licensePath, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Error saving license cache:', error.message);
    }
  }

  isModuleLicensed(moduleName) {
    return this.activeModules.has(moduleName);
  }

  getActiveModules() {
    return Array.from(this.activeModules);
  }

  async activateModule(licenseKey, moduleName) {
    try {
      const requestData = JSON.stringify({
        licenseKey,
        moduleName,
        deviceId: this.deviceId,
        action: 'activate'
      });

      const response = await this.makeRequest('/module', 'POST', requestData);
      const data = JSON.parse(response);

      if (data.success) {
        this.activeModules.add(moduleName);
        
        // Update cache
        const cached = this.cachedLicenses.get(licenseKey);
        if (cached) {
          cached.modules.push(moduleName);
          await this.saveLicenseCache(licenseKey, cached);
        }
        
        return true;
      }
      
      throw new Error(data.message || 'Module activation failed');
    } catch (error) {
      console.error('Module activation error:', error.message);
      return false;
    }
  }

  async deactivateModule(licenseKey, moduleName) {
    try {
      const requestData = JSON.stringify({
        licenseKey,
        moduleName,
        deviceId: this.deviceId,
        action: 'deactivate'
      });

      const response = await this.makeRequest('/module', 'POST', requestData);
      const data = JSON.parse(response);

      if (data.success) {
        this.activeModules.delete(moduleName);
        
        // Update cache
        const cached = this.cachedLicenses.get(licenseKey);
        if (cached) {
          cached.modules = cached.modules.filter(m => m !== moduleName);
          await this.saveLicenseCache(licenseKey, cached);
        }
        
        return true;
      }
      
      throw new Error(data.message || 'Module deactivation failed');
    } catch (error) {
      console.error('Module deactivation error:', error.message);
      return false;
    }
  }

  async transferLicense(licenseKey, newDeviceId) {
    try {
      const requestData = JSON.stringify({
        licenseKey,
        currentDeviceId: this.deviceId,
        newDeviceId,
        timestamp: Date.now()
      });

      const response = await this.makeRequest('/transfer', 'POST', requestData);
      const data = JSON.parse(response);

      if (data.success) {
        // Clear local cache
        this.cachedLicenses.delete(licenseKey);
        this.activeModules.clear();
        
        // Remove cached file
        const licensePath = path.join(this.config.cachePath, `${licenseKey}.json`);
        await fs.unlink(licensePath).catch(() => {});
        
        return true;
      }
      
      throw new Error(data.message || 'License transfer failed');
    } catch (error) {
      console.error('License transfer error:', error.message);
      return false;
    }
  }

  startHeartbeat() {
    this.validationInterval = setInterval(async () => {
      // Revalidate all active licenses
      for (const [licenseKey, cacheData] of this.cachedLicenses) {
        try {
          await this.validateLicense(licenseKey, cacheData.userId);
        } catch (error) {
          console.error(`Heartbeat validation failed for ${licenseKey}:`, error.message);
        }
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  async generateTrialLicense(email, modules, duration = 7) {
    try {
      const requestData = JSON.stringify({
        email,
        modules,
        duration,
        deviceId: this.deviceId,
        type: 'trial'
      });

      const response = await this.makeRequest('/trial', 'POST', requestData);
      const data = JSON.parse(response);

      if (data.licenseKey) {
        // Automatically validate the trial license
        await this.validateLicense(data.licenseKey, email);
        return data.licenseKey;
      }
      
      throw new Error(data.message || 'Trial generation failed');
    } catch (error) {
      console.error('Trial license error:', error.message);
      return null;
    }
  }

  getLicenseInfo() {
    const licenses = [];
    
    for (const [key, data] of this.cachedLicenses) {
      licenses.push({
        key: key.substring(0, 8) + '...', // Partial key for security
        modules: data.modules,
        expires: new Date(data.expires).toLocaleDateString(),
        features: data.features || {},
        limits: data.limits || {}
      });
    }
    
    return {
      deviceId: this.deviceId,
      activeModules: this.getActiveModules(),
      licenses,
      lastValidation: this.lastValidation ? new Date(this.lastValidation).toISOString() : null,
      offlineMode: Date.now() - (this.lastValidation || 0) > 24 * 60 * 60 * 1000
    };
  }

  async cleanup() {
    this.stopHeartbeat();
    
    // Save current state
    for (const [key, data] of this.cachedLicenses) {
      await this.saveLicenseCache(key, data);
    }
  }
}

module.exports = LicenseManager;