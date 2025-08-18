/**
 * COMPRESSED LOG MANAGER
 * 
 * Handles log compression, rotation, and memory management
 * to prevent the self-consuming bots from eating all your RAM/disk
 */

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class CompressedLogManager {
    constructor(config = {}) {
        this.config = {
            maxLogSize: config.maxLogSize || 10 * 1024 * 1024, // 10MB per file
            maxTotalSize: config.maxTotalSize || 100 * 1024 * 1024, // 100MB total
            compressionLevel: config.compressionLevel || 9, // Max compression
            rotationInterval: config.rotationInterval || 3600000, // Rotate hourly
            retentionDays: config.retentionDays || 7, // Keep 7 days of logs
            compressAfterHours: config.compressAfterHours || 1, // Compress after 1 hour
            ...config
        };
        
        this.logQueue = [];
        this.currentSize = 0;
        this.isCompressing = false;
        
        // Start rotation timer
        this.startRotation();
        
        console.log('📦 COMPRESSED LOG MANAGER INITIALIZED');
        console.log(`   Max size: ${this.config.maxTotalSize / 1024 / 1024}MB`);
        console.log(`   Retention: ${this.config.retentionDays} days`);
    }
    
    /**
     * Write log entry with automatic compression
     */
    async writeLog(botTier, logType, data) {
        const entry = {
            timestamp: Date.now(),
            botTier,
            type: logType,
            data: this.compressData(data) // Compress data structure
        };
        
        // Add to queue
        this.logQueue.push(entry);
        
        // Batch write for efficiency
        if (this.logQueue.length >= 100 || Date.now() - this.lastWrite > 5000) {
            await this.flushQueue();
        }
        
        // Check size limits
        await this.checkSizeLimits();
    }
    
    /**
     * Compress data structure (remove redundant fields)
     */
    compressData(data) {
        // Remove redundant/large fields
        const compressed = { ...data };
        
        // Remove large arrays if they exist
        if (compressed.candles && compressed.candles.length > 50) {
            compressed.candles = compressed.candles.slice(-50); // Keep only last 50
        }
        
        // Round numbers to save space
        if (compressed.price) compressed.price = Math.round(compressed.price * 100) / 100;
        if (compressed.confidence) compressed.confidence = Math.round(compressed.confidence * 10) / 10;
        
        // Remove debug fields
        delete compressed.debug;
        delete compressed.raw;
        delete compressed.fullData;
        
        return compressed;
    }
    
    /**
     * Flush log queue to disk
     */
    async flushQueue() {
        if (this.logQueue.length === 0) return;
        
        const logs = [...this.logQueue];
        this.logQueue = [];
        this.lastWrite = Date.now();
        
        // Group by bot tier
        const grouped = {};
        logs.forEach(log => {
            if (!grouped[log.botTier]) grouped[log.botTier] = [];
            grouped[log.botTier].push(log);
        });
        
        // Write each tier's logs
        for (const [tier, tierLogs] of Object.entries(grouped)) {
            await this.appendToFile(tier, tierLogs);
        }
    }
    
    /**
     * Append logs to file with size checking
     */
    async appendToFile(botTier, logs) {
        const date = new Date().toISOString().split('T')[0];
        const hour = new Date().getHours();
        const filename = `${botTier}_${date}_${hour}.json`;
        const filepath = path.join(this.config.logPath, filename);
        
        try {
            // Check if file exists and its size
            let existingLogs = [];
            let fileSize = 0;
            
            try {
                const stats = await fs.stat(filepath);
                fileSize = stats.size;
                
                if (fileSize < this.config.maxLogSize) {
                    const content = await fs.readFile(filepath, 'utf8');
                    existingLogs = JSON.parse(content);
                }
            } catch (e) {
                // File doesn't exist
            }
            
            // If file too large, rotate
            if (fileSize >= this.config.maxLogSize) {
                await this.rotateFile(filepath);
                existingLogs = [];
            }
            
            // Append new logs
            existingLogs.push(...logs);
            
            // Write back
            await fs.writeFile(filepath, JSON.stringify(existingLogs));
            
            // Update current size
            this.currentSize += JSON.stringify(logs).length;
            
        } catch (error) {
            console.error(`Error writing logs for ${botTier}:`, error);
        }
    }
    
    /**
     * Rotate and compress old file
     */
    async rotateFile(filepath) {
        const compressed = `${filepath}.gz`;
        
        try {
            // Read file
            const content = await fs.readFile(filepath);
            
            // Compress with max compression
            const compressedContent = await gzip(content, {
                level: this.config.compressionLevel
            });
            
            // Write compressed file
            await fs.writeFile(compressed, compressedContent);
            
            // Delete original
            await fs.unlink(filepath);
            
            console.log(`🗜️ Compressed ${path.basename(filepath)} (${content.length} → ${compressedContent.length} bytes)`);
            
        } catch (error) {
            console.error('Error rotating file:', error);
        }
    }
    
    /**
     * Read compressed logs for consumption
     */
    async readLogs(botTier, startTime = null, endTime = null) {
        const logs = [];
        
        try {
            const files = await fs.readdir(this.config.logPath);
            const tierFiles = files.filter(f => f.startsWith(botTier));
            
            for (const file of tierFiles) {
                const filepath = path.join(this.config.logPath, file);
                
                if (file.endsWith('.gz')) {
                    // Read compressed file
                    const compressed = await fs.readFile(filepath);
                    const decompressed = await gunzip(compressed);
                    const fileLogs = JSON.parse(decompressed.toString());
                    
                    // Filter by time if needed
                    if (startTime || endTime) {
                        logs.push(...fileLogs.filter(log => {
                            if (startTime && log.timestamp < startTime) return false;
                            if (endTime && log.timestamp > endTime) return false;
                            return true;
                        }));
                    } else {
                        logs.push(...fileLogs);
                    }
                } else if (file.endsWith('.json')) {
                    // Read uncompressed file
                    const content = await fs.readFile(filepath, 'utf8');
                    const fileLogs = JSON.parse(content);
                    logs.push(...fileLogs);
                }
            }
        } catch (error) {
            console.error('Error reading logs:', error);
        }
        
        return logs;
    }
    
    /**
     * Check and enforce size limits
     */
    async checkSizeLimits() {
        if (this.isCompressing) return;
        
        try {
            const files = await fs.readdir(this.config.logPath);
            let totalSize = 0;
            const fileStats = [];
            
            // Get all file sizes
            for (const file of files) {
                const filepath = path.join(this.config.logPath, file);
                const stats = await fs.stat(filepath);
                totalSize += stats.size;
                fileStats.push({ file, size: stats.size, mtime: stats.mtime });
            }
            
            // If over limit, delete oldest files
            if (totalSize > this.config.maxTotalSize) {
                console.log(`⚠️ Log size limit exceeded: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
                
                this.isCompressing = true;
                
                // Sort by modification time (oldest first)
                fileStats.sort((a, b) => a.mtime - b.mtime);
                
                // Delete oldest files until under limit
                while (totalSize > this.config.maxTotalSize && fileStats.length > 0) {
                    const oldest = fileStats.shift();
                    const filepath = path.join(this.config.logPath, oldest.file);
                    
                    await fs.unlink(filepath);
                    totalSize -= oldest.size;
                    
                    console.log(`🗑️ Deleted old log: ${oldest.file}`);
                }
                
                this.isCompressing = false;
            }
            
            // Compress old uncompressed files
            await this.compressOldFiles();
            
        } catch (error) {
            console.error('Error checking size limits:', error);
            this.isCompressing = false;
        }
    }
    
    /**
     * Compress files older than threshold
     */
    async compressOldFiles() {
        const now = Date.now();
        const threshold = this.config.compressAfterHours * 60 * 60 * 1000;
        
        try {
            const files = await fs.readdir(this.config.logPath);
            
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                
                const filepath = path.join(this.config.logPath, file);
                const stats = await fs.stat(filepath);
                
                if (now - stats.mtimeMs > threshold) {
                    await this.rotateFile(filepath);
                }
            }
        } catch (error) {
            console.error('Error compressing old files:', error);
        }
    }
    
    /**
     * Clean up old logs based on retention policy
     */
    async cleanupOldLogs() {
        const now = Date.now();
        const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
        
        try {
            const files = await fs.readdir(this.config.logPath);
            
            for (const file of files) {
                const filepath = path.join(this.config.logPath, file);
                const stats = await fs.stat(filepath);
                
                if (now - stats.mtimeMs > retentionMs) {
                    await fs.unlink(filepath);
                    console.log(`🗑️ Cleaned up old log: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old logs:', error);
        }
    }
    
    /**
     * Start automatic rotation and cleanup
     */
    startRotation() {
        // Rotate logs hourly
        setInterval(() => {
            this.flushQueue();
            this.checkSizeLimits();
        }, this.config.rotationInterval);
        
        // Clean up daily
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000);
    }
    
    /**
     * Get storage statistics
     */
    async getStats() {
        const files = await fs.readdir(this.config.logPath);
        let totalSize = 0;
        let compressedFiles = 0;
        let uncompressedFiles = 0;
        
        for (const file of files) {
            const filepath = path.join(this.config.logPath, file);
            const stats = await fs.stat(filepath);
            totalSize += stats.size;
            
            if (file.endsWith('.gz')) {
                compressedFiles++;
            } else {
                uncompressedFiles++;
            }
        }
        
        return {
            totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
            totalFiles: files.length,
            compressedFiles,
            uncompressedFiles,
            utilizationPercent: ((totalSize / this.config.maxTotalSize) * 100).toFixed(1) + '%'
        };
    }
}

module.exports = CompressedLogManager;