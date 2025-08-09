// Real-time FPS and performance monitoring
class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.memory = null;
    this.isVisible = true;
    this.warningThreshold = 30; // FPS warning below 30
    
    this.createDisplay();
    this.startMonitoring();
  }

  createDisplay() {
    this.display = document.createElement('div');
    this.display.id = 'performance-monitor';
    this.display.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border: 1px solid #00ff00;
      border-radius: 5px;
      z-index: 10000;
      min-width: 150px;
    `;
    document.body.appendChild(this.display);
  }

  startMonitoring() {
    const monitor = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Get memory info if available
        if (performance.memory) {
          this.memory = {
            used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
            total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2)
          };
        }
        
        this.updateDisplay();
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  updateDisplay() {
    if (!this.isVisible) return;
    
    const fpsColor = this.fps >= 50 ? '#00ff00' : 
                     this.fps >= 30 ? '#ffff00' : '#ff0000';
    
    let html = `
      <div style="color: ${fpsColor}">FPS: ${this.fps}</div>
    `;
    
    if (this.memory) {
      html += `<div>MEM: ${this.memory.used}/${this.memory.total}MB</div>`;
    }
    
    html += `<div style="font-size: 10px; color: #666; margin-top: 5px;">Press P to toggle</div>`;
    
    this.display.innerHTML = html;
    
    // Log warnings
    if (this.fps < this.warningThreshold && this.fps > 0) {
      console.warn(`⚠️ Low FPS detected: ${this.fps}`);
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.display.style.display = this.isVisible ? 'block' : 'none';
  }
}

// Auto-initialize on load
window.addEventListener('DOMContentLoaded', () => {
  window.performanceMonitor = new PerformanceMonitor();
  
  // Toggle with 'P' key
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && e.ctrlKey) {
      window.performanceMonitor.toggle();
    }
  });
});
