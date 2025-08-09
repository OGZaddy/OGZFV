/**
 * ARCHITECTURE FIX: System Health Monitor Module
 * Extracted from monolithic QuantumNeuromorphicCore.js
 * Handles continuous health monitoring with bounded memory
 */

const EventEmitter = require('events');

class SystemHealthMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monitoringInterval: config.monitoringInterval || 5000, // 5 seconds
      healthCheckTimeout: config.healthCheckTimeout || 3000,
      maxHealthHistory: config.maxHealthHistory || 200,
      alertThresholds: {
        memoryUsage: config.memoryThreshold || 0.85, // 85%
        cpuUsage: config.cpuThreshold || 0.80, // 80%
        errorRate: config.errorThreshold || 0.10, // 10%
        responseTime: config.responseThreshold || 5000, // 5s
        ...config.alertThresholds
      },
      ...config
    };
    
    // ARCHITECTURE FIX: Bounded health state
    this.healthState = {
      status: 'INITIALIZING',
      lastCheck: 0,
      systemMetrics: {
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { usage: 0, load: [0, 0, 0] },
        errors: { count: 0, rate: 0 },
        performance: { avgResponseTime: 0, latency: 0 }
      },
      healthHistory: [],
      alerts: new Set(),
      lastCleanup: Date.now()
    };
    
    this.metrics = {
      totalChecks: 0,
      healthyChecks: 0,
      unhealthyChecks: 0,
      alertsTriggered: 0,
      averageCheckTime: 0
    };
    
    this.operationLocks = { monitoring: false, cleanup: false };
    
    // ARCHITECTURE FIX: Monitoring intervals with cleanup
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.monitoringInterval);
    
    this.cleanupInterval = setInterval(() => {
      this.performHealthCleanup();
    }, 60000); // Every minute
    
    console.log('🏥 System Health Monitor initialized');
  }
  
  async initialize() {
    try {
      console.log('🏥 Initializing System Health Monitor...');
      
      // Perform initial health check
      await this.performHealthCheck();
      
      this.healthState.status = 'MONITORING';
      console.log('✅ System Health Monitor ready');
      this.emit('healthMonitorReady');
      
      return true;
    } catch (error) {
      console.error('❌ Health Monitor initialization failed:', error);
      this.healthState.status = 'ERROR';
      throw error;
    }
  }
  
  async performHealthCheck() {
    if (this.operationLocks.monitoring) return;
    this.operationLocks.monitoring = true;
    
    const checkStartTime = Date.now();
    
    try {
      // Collect system metrics
      const memoryMetrics = await this.collectMemoryMetrics();
      const cpuMetrics = await this.collectCPUMetrics();
      const errorMetrics = await this.collectErrorMetrics();
      const performanceMetrics = await this.collectPerformanceMetrics();
      
      // Update health state
      this.healthState.systemMetrics = {
        memory: memoryMetrics,
        cpu: cpuMetrics,
        errors: errorMetrics,
        performance: performanceMetrics
      };
      
      // Analyze health status
      const healthStatus = this.analyzeHealthStatus();
      this.healthState.status = healthStatus.status;
      
      // Check for alerts
      const alerts = this.checkAlertThresholds();
      this.processAlerts(alerts);
      
      // Record health check
      const checkDuration = Date.now() - checkStartTime;
      this.recordHealthCheck({
        timestamp: checkStartTime,
        duration: checkDuration,
        status: healthStatus.status,
        metrics: this.healthState.systemMetrics,
        alerts: alerts.length
      });
      
      this.healthState.lastCheck = checkStartTime;
      
      // Emit health status
      this.emit('healthCheckComplete', {
        status: healthStatus.status,
        metrics: this.healthState.systemMetrics,
        alerts: alerts,
        timestamp: checkStartTime
      });
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.healthState.status = 'ERROR';
      this.emit('healthCheckError', error);
    } finally {
      this.operationLocks.monitoring = false;
    }
  }
  
  async collectMemoryMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      used: usedMem,
      total: totalMem,
      percentage: usedMem / totalMem,
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: memUsage.heapUsed / memUsage.heapTotal
      },
      rss: memUsage.rss,
      external: memUsage.external
    };
  }
  
  async collectCPUMetrics() {
    const loadAvg = require('os').loadavg();
    const cpuCount = require('os').cpus().length;
    
    return {
      usage: loadAvg[0] / cpuCount, // 1-minute load average normalized
      load: loadAvg,
      cores: cpuCount,
      normalized: {
        load1m: (loadAvg[0] / cpuCount).toFixed(3),
        load5m: (loadAvg[1] / cpuCount).toFixed(3),
        load15m: (loadAvg[2] / cpuCount).toFixed(3)
      }
    };
  }
  
  async collectErrorMetrics() {
    // In a real implementation, this would track actual errors
    // For now, simulate error tracking
    return {
      count: Math.floor(Math.random() * 10),
      rate: Math.random() * 0.05, // 0-5% error rate
      recent: Math.floor(Math.random() * 3),
      severity: {
        critical: Math.floor(Math.random() * 2),
        warning: Math.floor(Math.random() * 5),
        info: Math.floor(Math.random() * 10)
      }
    };
  }
  
  async collectPerformanceMetrics() {
    return {
      avgResponseTime: 50 + Math.random() * 200, // 50-250ms
      latency: Math.random() * 100, // 0-100ms
      throughput: 100 + Math.random() * 500, // ops/sec
      uptime: process.uptime(),
      eventLoopLag: this.measureEventLoopLag()
    };
  }
  
  measureEventLoopLag() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to ms
      return lag;
    });
    return Math.random() * 10; // Simplified for demo
  }
  
  analyzeHealthStatus() {
    const { memory, cpu, errors, performance } = this.healthState.systemMetrics;
    
    let healthScore = 100;
    let issues = [];
    
    // Check memory
    if (memory.percentage > this.config.alertThresholds.memoryUsage) {
      healthScore -= 25;
      issues.push(`High memory usage: ${(memory.percentage * 100).toFixed(1)}%`);
    }
    
    // Check CPU
    if (cpu.usage > this.config.alertThresholds.cpuUsage) {
      healthScore -= 20;
      issues.push(`High CPU usage: ${(cpu.usage * 100).toFixed(1)}%`);
    }
    
    // Check error rate
    if (errors.rate > this.config.alertThresholds.errorRate) {
      healthScore -= 30;
      issues.push(`High error rate: ${(errors.rate * 100).toFixed(1)}%`);
    }
    
    // Check performance
    if (performance.avgResponseTime > this.config.alertThresholds.responseTime) {
      healthScore -= 15;
      issues.push(`Slow response time: ${performance.avgResponseTime.toFixed(0)}ms`);
    }
    
    let status;
    if (healthScore >= 90) status = 'HEALTHY';
    else if (healthScore >= 70) status = 'WARNING';
    else if (healthScore >= 50) status = 'DEGRADED';
    else status = 'CRITICAL';
    
    return {
      status,
      score: healthScore,
      issues
    };
  }
  
  checkAlertThresholds() {
    const alerts = [];
    const { memory, cpu, errors, performance } = this.healthState.systemMetrics;
    
    if (memory.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'MEMORY_HIGH',
        severity: 'WARNING',
        message: `Memory usage at ${(memory.percentage * 100).toFixed(1)}%`,
        value: memory.percentage,
        threshold: this.config.alertThresholds.memoryUsage,
        timestamp: Date.now()
      });
    }
    
    if (cpu.usage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'CPU_HIGH',
        severity: 'WARNING',
        message: `CPU usage at ${(cpu.usage * 100).toFixed(1)}%`,
        value: cpu.usage,
        threshold: this.config.alertThresholds.cpuUsage,
        timestamp: Date.now()
      });
    }
    
    if (errors.rate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'ERROR_RATE_HIGH',
        severity: 'CRITICAL',
        message: `Error rate at ${(errors.rate * 100).toFixed(1)}%`,
        value: errors.rate,
        threshold: this.config.alertThresholds.errorRate,
        timestamp: Date.now()
      });
    }
    
    return alerts;
  }
  
  processAlerts(alerts) {
    alerts.forEach(alert => {
      // Add to active alerts
      this.healthState.alerts.add(alert);
      
      // Emit alert event
      this.emit('healthAlert', alert);
      
      // Log alert
      console.log(`🚨 HEALTH ALERT [${alert.severity}]: ${alert.message}`);
      
      // Update metrics
      this.metrics.alertsTriggered++;
    });
  }
  
  recordHealthCheck(healthCheck) {
    // Update metrics
    this.metrics.totalChecks++;
    if (healthCheck.status === 'HEALTHY') {
      this.metrics.healthyChecks++;
    } else {
      this.metrics.unhealthyChecks++;
    }
    
    // Update average check time
    this.metrics.averageCheckTime = 
      (this.metrics.averageCheckTime * 0.9) + (healthCheck.duration * 0.1);
    
    // Add to history with bounds
    this.healthState.healthHistory.push(healthCheck);
    
    // MEMORY LEAK FIX: Limit history size
    if (this.healthState.healthHistory.length > this.config.maxHealthHistory) {
      this.healthState.healthHistory.shift();
    }
  }
  
  async performHealthCleanup() {
    if (this.operationLocks.cleanup) return;
    this.operationLocks.cleanup = true;
    
    try {
      const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour
      
      // Clean old alerts
      const activeAlerts = Array.from(this.healthState.alerts)
        .filter(alert => alert.timestamp > cutoffTime);
      
      this.healthState.alerts.clear();
      activeAlerts.forEach(alert => {
        this.healthState.alerts.add(alert);
      });
      
      this.healthState.lastCleanup = Date.now();
      
    } finally {
      this.operationLocks.cleanup = false;
    }
  }
  
  async shutdown() {
    console.log('🏥 Shutting down System Health Monitor...');
    
    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear state
    this.healthState.healthHistory = [];
    this.healthState.alerts.clear();
    this.removeAllListeners();
    
    console.log('✅ System Health Monitor shutdown complete');
  }
  
  getHealthStatus() {
    const healthyPercentage = this.metrics.totalChecks > 0
      ? (this.metrics.healthyChecks / this.metrics.totalChecks) * 100
      : 0;
    
    return {
      status: this.healthState.status,
      lastCheck: this.healthState.lastCheck,
      systemMetrics: this.healthState.systemMetrics,
      healthyPercentage: healthyPercentage.toFixed(1) + '%',
      totalChecks: this.metrics.totalChecks,
      alertsTriggered: this.metrics.alertsTriggered,
      averageCheckTime: this.metrics.averageCheckTime.toFixed(1) + 'ms',
      activeAlerts: this.healthState.alerts.size,
      lastCleanup: this.healthState.lastCleanup,
      uptime: process.uptime(),
      memoryUsage: {
        healthHistory: this.healthState.healthHistory.length,
        maxHealthHistory: this.config.maxHealthHistory,
        activeAlerts: this.healthState.alerts.size
      },
      thresholds: this.config.alertThresholds
    };
  }
}

module.exports = SystemHealthMonitor;
