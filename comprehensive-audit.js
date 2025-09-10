#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM AUDIT
 * Verifies what's actually connected vs what should be
 */

const fs = require('fs');
const path = require('path');

class SystemAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      defensive: {
        riskManager: { imported: false, instantiated: false, used: false },
        safetyNet: { imported: false, instantiated: false, used: false }
      },
      offensive: {},
      connections: {
        correctlyWired: [],
        partiallyWired: [],
        notWired: [],
        shouldBeWired: []
      },
      critical: {
        issues: [],
        warnings: [],
        recommendations: []
      }
    };
  }
  
  auditFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n📋 Auditing: ${fileName}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Track all module references
    const moduleTracker = {
      imports: new Set(),
      instantiations: new Set(),
      methodCalls: new Set(),
      actualUsage: new Map()
    };
    
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      
      // Check imports
      if (line.includes('require(') && line.includes('./core/')) {
        const match = line.match(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/);
        if (match) {
          moduleTracker.imports.add(match[1]);
          console.log(`  ✓ Line ${lineNum}: Imported ${match[1]}`);
        }
      }
      
      // Check instantiations
      if (line.includes('new ') && !line.includes('//')) {
        const match = line.match(/new\s+(\w+)\(/);
        if (match && moduleTracker.imports.has(match[1])) {
          moduleTracker.instantiations.add(match[1]);
          console.log(`  ✓ Line ${lineNum}: Instantiated ${match[1]}`);
        }
      }
      
      // Check method calls (actual usage)
      moduleTracker.imports.forEach(moduleName => {
        const varName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
        const patterns = [
          `this.${varName}.`,
          `${varName}.`,
        ];
        
        patterns.forEach(pattern => {
          if (line.includes(pattern) && !line.includes('//') && !line.includes('console.log')) {
            const methodMatch = line.match(new RegExp(`${pattern.replace('.', '\\.')}(\\w+)`));
            if (methodMatch) {
              const usage = `${moduleName}.${methodMatch[1]}()`;
              if (!moduleTracker.actualUsage.has(moduleName)) {
                moduleTracker.actualUsage.set(moduleName, []);
              }
              moduleTracker.actualUsage.get(moduleName).push({
                line: lineNum,
                method: methodMatch[1],
                context: line.trim()
              });
            }
          }
        });
      });
      
      // Special checks for defensive modules
      if (line.includes('RiskManager')) {
        this.results.defensive.riskManager.imported = true;
        if (line.includes('new RiskManager')) {
          this.results.defensive.riskManager.instantiated = true;
        }
        if (line.includes('.assessTradeRisk') || line.includes('.calculatePositionSize')) {
          this.results.defensive.riskManager.used = true;
        }
      }
      
      if (line.includes('TradingSafetyNet') || line.includes('SafetyNet')) {
        this.results.defensive.safetyNet.imported = true;
        if (line.includes('new TradingSafetyNet') || line.includes('new SafetyNet')) {
          this.results.defensive.safetyNet.instantiated = true;
        }
        if (line.includes('.validateTrade') || line.includes('.updateTradeResult')) {
          this.results.defensive.safetyNet.used = true;
        }
      }
      
      // Check for hardcoded values (RED FLAGS)
      if (line.includes('confidence = 0.65') || line.includes('confidence = 65')) {
        this.results.critical.issues.push({
          line: lineNum,
          type: 'HARDCODED_CONFIDENCE',
          severity: 'CRITICAL',
          content: line.trim()
        });
      }
      
      if (line.includes('Math.random()') && !line.includes('//')) {
        this.results.critical.warnings.push({
          line: lineNum,
          type: 'RANDOM_TRADING',
          severity: 'HIGH',
          content: line.trim()
        });
      }
    });
    
    // Analyze results
    moduleTracker.imports.forEach(module => {
      const status = {
        module,
        imported: true,
        instantiated: moduleTracker.instantiations.has(module),
        used: moduleTracker.actualUsage.has(module),
        usageCount: moduleTracker.actualUsage.get(module)?.length || 0
      };
      
      if (status.used) {
        this.results.connections.correctlyWired.push(module);
      } else if (status.instantiated) {
        this.results.connections.partiallyWired.push(module);
      } else {
        this.results.connections.notWired.push(module);
      }
      
      this.results.offensive[module] = status;
    });
    
    return moduleTracker;
  }
  
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE SYSTEM AUDIT REPORT');
    console.log('='.repeat(80));
    
    // Defensive modules status
    console.log('\n🛡️ DEFENSIVE MODULES:');
    console.log(`  RiskManager:`);
    console.log(`    Imported: ${this.results.defensive.riskManager.imported ? '✅' : '❌'}`);
    console.log(`    Instantiated: ${this.results.defensive.riskManager.instantiated ? '✅' : '❌'}`);
    console.log(`    Used: ${this.results.defensive.riskManager.used ? '✅' : '❌'}`);
    
    console.log(`  SafetyNet:`);
    console.log(`    Imported: ${this.results.defensive.safetyNet.imported ? '✅' : '❌'}`);
    console.log(`    Instantiated: ${this.results.defensive.safetyNet.instantiated ? '✅' : '❌'}`);
    console.log(`    Used: ${this.results.defensive.safetyNet.used ? '✅' : '❌'}`);
    
    // Connection status
    console.log('\n🔌 MODULE CONNECTIONS:');
    console.log(`  ✅ Correctly Wired: ${this.results.connections.correctlyWired.length}`);
    if (this.results.connections.correctlyWired.length > 0) {
      this.results.connections.correctlyWired.forEach(m => console.log(`     - ${m}`));
    }
    
    console.log(`  ⚠️  Partially Wired: ${this.results.connections.partiallyWired.length}`);
    if (this.results.connections.partiallyWired.length > 0) {
      this.results.connections.partiallyWired.forEach(m => console.log(`     - ${m}`));
    }
    
    console.log(`  ❌ Not Wired: ${this.results.connections.notWired.length}`);
    if (this.results.connections.notWired.length > 0) {
      this.results.connections.notWired.forEach(m => console.log(`     - ${m}`));
    }
    
    // Critical issues
    if (this.results.critical.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.results.critical.issues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.type}`);
        console.log(`    ${issue.content}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.connections.notWired.length > 0) {
      console.log('  1. Connect these unused modules:');
      this.results.connections.notWired.forEach(m => {
        console.log(`     - Wire up ${m} to trading logic`);
      });
    }
    
    if (this.results.critical.issues.some(i => i.type === 'HARDCODED_CONFIDENCE')) {
      console.log('  2. Replace hardcoded confidence with dynamic calculation');
    }
    
    if (!this.results.defensive.riskManager.used || !this.results.defensive.safetyNet.used) {
      console.log('  3. Ensure defensive modules are called before EVERY trade');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save results
    fs.writeFileSync(
      'comprehensive-audit-results.json',
      JSON.stringify(this.results, null, 2)
    );
    console.log('📁 Full audit saved to comprehensive-audit-results.json');
  }
}

// Run audit
const auditor = new SystemAuditor();

// Audit the main bot file
const botFile = './run-trading-bot-v13-simplified.js';
if (fs.existsSync(botFile)) {
  auditor.auditFile(botFile);
} else {
  console.log('❌ Bot file not found');
}

// Generate report
auditor.generateReport();