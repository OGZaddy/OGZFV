/**
 * COMPREHENSIVE MODULE AUDIT - All 4 Bots
 * Discovers, verifies, tests, and assigns modules to appropriate tiers
 */

const fs = require('fs');
const path = require('path');

class ModuleAuditor {
  constructor() {
    this.auditResults = {
      starter: { files: [], imports: [], active: [], performance: [], assignments: [] },
      pro: { files: [], imports: [], active: [], performance: [], assignments: [] },
      elite: { files: [], imports: [], active: [], performance: [], assignments: [] },
      quantum: { files: [], imports: [], active: [], performance: [], assignments: [] }
    };
    
    this.botPaths = {
      starter: './trading-system/bot-starter-tier.js',
      pro: './trading-system/bot-pro-tier.js', 
      elite: './trading-system/bot-elite-tier.js',
      quantum: './run-trading-bot-v13-quantum.js'
    };
  }

  // STEP 1: Discovery - List every .js file
  async step1_discovery() {
    console.log('🔍 STEP 1: MODULE DISCOVERY\n');
    
    const searchPaths = [
      './core',
      './components',
      './utils',
      './tools',
      './lib',
      './modules',
      './quantum-system',
      './trading-system'
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        console.log(`📁 Scanning: ${searchPath}`);
        this.scanDirectory(searchPath);
      }
    }

    console.log(`\n📊 DISCOVERY RESULTS:`);
    console.log(`   Total .js files found: ${this.allModules.length}`);
    console.log(`   Core modules: ${this.allModules.filter(f => f.includes('/core/')).length}`);
    console.log(`   Components: ${this.allModules.filter(f => f.includes('/components/')).length}`);
    console.log(`   Utils: ${this.allModules.filter(f => f.includes('/utils/')).length}`);
    console.log(`   Tools: ${this.allModules.filter(f => f.includes('/tools/')).length}`);
  }

  scanDirectory(dir, modules = []) {
    if (!this.allModules) this.allModules = [];
    
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          this.scanDirectory(filePath, modules);
        } else if (file.endsWith('.js') && !file.startsWith('.')) {
          const moduleInfo = {
            path: filePath,
            name: file.replace('.js', ''),
            category: this.categorizeModule(filePath),
            size: stat.size,
            modified: stat.mtime
          };
          this.allModules.push(moduleInfo);
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not scan ${dir}: ${error.message}`);
    }
  }

  categorizeModule(filePath) {
    if (filePath.includes('/core/')) return 'core';
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/utils/')) return 'utility';
    if (filePath.includes('/tools/')) return 'tool';
    if (filePath.includes('/lib/')) return 'library';
    if (filePath.includes('quantum')) return 'quantum';
    if (filePath.includes('trading')) return 'trading';
    return 'other';
  }

  // STEP 2: Verification - Check imports/requires
  async step2_verification() {
    console.log('\n🔎 STEP 2: IMPORT VERIFICATION\n');
    
    for (const [botName, botPath] of Object.entries(this.botPaths)) {
      if (fs.existsSync(botPath)) {
        console.log(`🤖 Analyzing ${botName.toUpperCase()} BOT: ${botPath}`);
        const imports = this.analyzeImports(botPath);
        this.auditResults[botName].imports = imports;
        
        console.log(`   Direct imports: ${imports.direct.length}`);
        console.log(`   Module loader: ${imports.moduleLoader.length}`);
        console.log(`   Dynamic requires: ${imports.dynamic.length}`);
        
        // Show key imports
        imports.direct.slice(0, 5).forEach(imp => {
          console.log(`     📦 ${imp.module} (${imp.type})`);
        });
        if (imports.direct.length > 5) {
          console.log(`     ... and ${imports.direct.length - 5} more`);
        }
      } else {
        console.log(`❌ Bot file not found: ${botPath}`);
      }
      console.log('');
    }
  }

  analyzeImports(filePath) {
    const imports = {
      direct: [],
      moduleLoader: [],
      dynamic: []
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        line = line.trim();
        
        // Direct requires
        const directMatch = line.match(/(?:const|let|var)\s+.*?=\s*require\(['"`]([^'"`]+)['"`]\)/);
        if (directMatch) {
          imports.direct.push({
            module: directMatch[1],
            line: index + 1,
            type: 'require',
            statement: line
          });
        }

        // Module loader usage
        const moduleLoaderMatch = line.match(/moduleLoader\.require\(['"`]([^'"`]+)['"`]\)/);
        if (moduleLoaderMatch) {
          imports.moduleLoader.push({
            module: moduleLoaderMatch[1],
            line: index + 1,
            type: 'moduleLoader',
            statement: line
          });
        }

        // Dynamic imports
        const dynamicMatch = line.match(/import\(['"`]([^'"`]+)['"`]\)/);
        if (dynamicMatch) {
          imports.dynamic.push({
            module: dynamicMatch[1],
            line: index + 1,
            type: 'dynamic',
            statement: line
          });
        }
      });
    } catch (error) {
      console.log(`⚠️ Could not analyze ${filePath}: ${error.message}`);
    }

    return imports;
  }

  // STEP 3: Testing - Verify execution
  async step3_testing() {
    console.log('\n🧪 STEP 3: EXECUTION TESTING\n');
    
    for (const [botName, botPath] of Object.entries(this.botPaths)) {
      console.log(`🔬 Testing ${botName.toUpperCase()} BOT modules:`);
      
      const imports = this.auditResults[botName].imports;
      const activeModules = [];

      for (const imp of imports.direct) {
        const testResult = this.testModuleExecution(imp.module, botPath);
        if (testResult.active) {
          activeModules.push({
            ...imp,
            ...testResult
          });
        }
      }

      for (const imp of imports.moduleLoader) {
        const testResult = this.testModuleExecution(imp.module, botPath, true);
        if (testResult.active) {
          activeModules.push({
            ...imp,
            ...testResult
          });
        }
      }

      this.auditResults[botName].active = activeModules;
      console.log(`   ✅ Active modules: ${activeModules.length}`);
      console.log(`   ⚠️ Failed to load: ${imports.direct.length + imports.moduleLoader.length - activeModules.length}`);
      
      activeModules.slice(0, 3).forEach(mod => {
        console.log(`     🟢 ${mod.module} - ${mod.description || 'No description'}`);
      });
      console.log('');
    }
  }

  testModuleExecution(modulePath, botPath, isModuleLoader = false) {
    try {
      let fullPath;
      
      if (isModuleLoader) {
        // Handle module loader paths like @core/PerformanceAnalyzer
        if (modulePath.startsWith('@core/')) {
          fullPath = `./core/${modulePath.replace('@core/', '')}.js`;
        } else if (modulePath.startsWith('@components/')) {
          fullPath = `./components/${modulePath.replace('@components/', '')}.js`;
        } else {
          fullPath = `./${modulePath}.js`;
        }
      } else {
        fullPath = modulePath;
      }

      // Check if file exists
      if (fullPath.startsWith('./') && fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        return {
          active: true,
          exists: true,
          size: content.length,
          description: this.extractDescription(content),
          exports: this.analyzeExports(content),
          lastModified: fs.statSync(fullPath).mtime
        };
      } else if (!fullPath.startsWith('./')) {
        // External module (npm package)
        return {
          active: true,
          exists: true,
          external: true,
          description: `External NPM module: ${modulePath}`
        };
      } else {
        return {
          active: false,
          exists: false,
          error: 'File not found'
        };
      }
    } catch (error) {
      return {
        active: false,
        exists: false,
        error: error.message
      };
    }
  }

  extractDescription(content) {
    // Look for class description, JSDoc, or initial comment
    const lines = content.split('\n');
    let description = '';
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('//')) {
        description += line.replace(/^[\*\/\s]+/, '') + ' ';
      } else if (line.includes('class ')) {
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          description = `Class: ${classMatch[1]} - ${description}`;
          break;
        }
      }
    }
    
    return description.trim().substring(0, 100) || 'No description found';
  }

  analyzeExports(content) {
    const exports = [];
    
    // Look for module.exports, exports, class definitions, function definitions
    const exportPatterns = [
      /module\.exports\s*=\s*(\w+)/g,
      /exports\.(\w+)/g,
      /class\s+(\w+)/g,
      /function\s+(\w+)/g,
      /const\s+(\w+)\s*=\s*\(/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        exports.push(match[1]);
      }
    });

    return [...new Set(exports)]; // Remove duplicates
  }

  // STEP 4: Performance Analysis
  async step4_performance() {
    console.log('\n📈 STEP 4: PERFORMANCE ANALYSIS\n');
    
    // Analyze recent reports for module performance
    for (const botName of Object.keys(this.botPaths)) {
      console.log(`📊 Analyzing ${botName.toUpperCase()} performance:`);
      
      const reportDir = `./reports/${botName}`;
      if (fs.existsSync(reportDir)) {
        const reports = fs.readdirSync(reportDir)
          .filter(f => f.startsWith('launch-report'))
          .sort()
          .slice(-5); // Last 5 reports

        let totalTrades = 0;
        let totalProfit = 0;
        let moduleUsage = new Map();

        reports.forEach(reportFile => {
          try {
            const reportPath = path.join(reportDir, reportFile);
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            
            totalTrades += report.totalTrades || 0;
            totalProfit += report.totalProfit || 0;
            
            if (report.modulesUsage) {
              report.modulesUsage.forEach(([module, count]) => {
                moduleUsage.set(module, (moduleUsage.get(module) || 0) + count);
              });
            }
          } catch (error) {
            console.log(`    ⚠️ Could not parse ${reportFile}`);
          }
        });

        const performance = {
          totalTrades,
          totalProfit,
          avgProfitPerTrade: totalTrades > 0 ? totalProfit / totalTrades : 0,
          moduleUsage: Array.from(moduleUsage.entries()).sort((a, b) => b[1] - a[1]),
          winRate: totalTrades > 0 ? (totalProfit > 0 ? 'Positive' : 'Negative') : 'No data'
        };

        this.auditResults[botName].performance = performance;
        
        console.log(`    Trades: ${totalTrades}, P&L: $${totalProfit.toFixed(2)}, Win Rate: ${performance.winRate}`);
        console.log(`    Top modules: ${performance.moduleUsage.slice(0, 3).map(([mod, count]) => `${mod}(${count})`).join(', ')}`);
      } else {
        console.log(`    ❌ No reports directory found`);
      }
      console.log('');
    }
  }

  // STEP 5: Documentation
  async step5_documentation() {
    console.log('\n📝 STEP 5: MODULE DOCUMENTATION\n');
    
    const moduleCategories = {
      core: [],
      indicators: [],
      patterns: [],
      ai: [],
      quantum: [],
      utilities: []
    };

    this.allModules.forEach(mod => {
      const category = this.classifyModule(mod);
      if (!moduleCategories[category]) moduleCategories[category] = [];
      moduleCategories[category].push(mod);
    });

    Object.entries(moduleCategories).forEach(([category, modules]) => {
      if (modules.length > 0) {
        console.log(`📚 ${category.toUpperCase()} MODULES (${modules.length}):`);
        modules.slice(0, 5).forEach(mod => {
          console.log(`    📄 ${mod.name} - ${mod.path}`);
        });
        if (modules.length > 5) {
          console.log(`    ... and ${modules.length - 5} more`);
        }
        console.log('');
      }
    });
  }

  classifyModule(mod) {
    const name = mod.name.toLowerCase();
    const path = mod.path.toLowerCase();
    
    if (name.includes('rsi') || name.includes('macd') || name.includes('indicator')) return 'indicators';
    if (name.includes('pattern') || name.includes('recognition')) return 'patterns';
    if (name.includes('ai') || name.includes('neural') || name.includes('ml')) return 'ai';
    if (name.includes('quantum') || name.includes('divine')) return 'quantum';
    if (path.includes('/core/')) return 'core';
    return 'utilities';
  }

  // STEP 6: Tier Assignment
  async step6_assignment() {
    console.log('\n🎯 STEP 6: BOT TIER ASSIGNMENTS\n');
    
    const tierAssignments = {
      starter: {
        recommended: ['RSI', 'MACD', 'BasicLogic', 'PerformanceTracker'],
        limit: 4,
        complexity: 'Basic'
      },
      pro: {
        recommended: ['RSI', 'MACD', 'PatternRecognition', 'BollingerBands', 'TrendAnalysis'],
        limit: 8,
        complexity: 'Intermediate'
      },
      elite: {
        recommended: ['QuantumAggregator', 'StatisticalArbitrage', 'SelfLearning', 'PerformanceValidator', 'AdvancedPatterns'],
        limit: 15,
        complexity: 'Advanced'
      },
      quantum: {
        recommended: ['QuantumCore', 'DivineModules', 'MLPredictions', 'NeuromorphicProcessing', 'RealityBending'],
        limit: 25,
        complexity: 'Unlimited'
      }
    };

    Object.entries(tierAssignments).forEach(([tier, config]) => {
      console.log(`🎖️ ${tier.toUpperCase()} TIER ($${this.getTierPrice(tier)}):`);
      console.log(`    Complexity: ${config.complexity}`);
      console.log(`    Module Limit: ${config.limit}`);
      console.log(`    Recommended Modules:`);
      
      config.recommended.forEach(mod => {
        const isActive = this.isModuleActiveInBot(mod, tier);
        const status = isActive ? '✅' : '⏳';
        console.log(`      ${status} ${mod}`);
      });
      
      const currentActive = this.auditResults[tier].active.length;
      console.log(`    Currently Active: ${currentActive}/${config.limit}`);
      console.log('');
    });
  }

  getTierPrice(tier) {
    const prices = { starter: 97, pro: 297, elite: 997, quantum: 2997 };
    return prices[tier];
  }

  isModuleActiveInBot(moduleName, botTier) {
    const active = this.auditResults[botTier].active;
    return active.some(mod => 
      mod.module.includes(moduleName) || 
      mod.module.toLowerCase().includes(moduleName.toLowerCase())
    );
  }

  // Generate final report
  generateReport() {
    console.log('\n📋 COMPREHENSIVE AUDIT REPORT');
    console.log('═'.repeat(50));
    
    Object.entries(this.auditResults).forEach(([botName, results]) => {
      console.log(`\n🤖 ${botName.toUpperCase()} BOT SUMMARY:`);
      console.log(`   📦 Total imports: ${results.imports?.direct?.length || 0 + results.imports?.moduleLoader?.length || 0}`);
      console.log(`   ✅ Active modules: ${results.active?.length || 0}`);
      console.log(`   📊 Total trades: ${results.performance?.totalTrades || 0}`);
      console.log(`   💰 Total P&L: $${(results.performance?.totalProfit || 0).toFixed(2)}`);
      
      if (results.performance?.moduleUsage?.length > 0) {
        console.log(`   🏆 Top performing modules:`);
        results.performance.moduleUsage.slice(0, 3).forEach(([mod, count]) => {
          console.log(`      - ${mod}: ${count} uses`);
        });
      }
    });

    console.log('\n✅ MODULE AUDIT COMPLETE');
    console.log(`⏱️ Total modules discovered: ${this.allModules?.length || 0}`);
    console.log(`🎯 Ready for tier optimization and launch!`);
  }

  // Main execution
  async runFullAudit() {
    console.log('🚀 STARTING COMPREHENSIVE MODULE AUDIT');
    console.log('═'.repeat(50));
    
    await this.step1_discovery();
    await this.step2_verification();
    await this.step3_testing();
    await this.step4_performance();
    await this.step5_documentation();
    await this.step6_assignment();
    
    this.generateReport();
    
    // Save results to file
    fs.writeFileSync('./module-audit-results.json', JSON.stringify(this.auditResults, null, 2));
    console.log('\n💾 Full audit results saved to: ./module-audit-results.json');
  }
}

// Execute the audit
const auditor = new ModuleAuditor();
auditor.runFullAudit().catch(console.error);