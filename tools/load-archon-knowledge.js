#!/usr/bin/env node

const axios = require('axios');
const ARCHON_URL = 'http://149.28.242.111:8181';

// EXPENSIVE FUCKING LESSONS WE LEARNED
const lessons = [
  {
    category: 'architecture',
    problem: 'Bot made 257,000 "decisions" but NEVER executed a single trade',
    solution: 'Add ExecutionLayer that ACTUALLY connects to exchange',
    cost_in_time: '2 months',
    cost_in_money: 900,
    never_do_again: [
      'Trust that "decisions" = trades',
      'Add quantum consciousness bullshit',
      'Focus on AI complexity over execution'
    ],
    always_do: [
      'CHECK IF BOT ACTUALLY TRADES',
      'Test with real exchange connection',
      'Use pm2 logs to verify trades'
    ]
  },
  {
    category: 'websocket',
    problem: 'Changed 127.0.0.1 to localhost, broke everything',
    solution: 'NEVER change working IPs - IPv4 vs IPv6 matters',
    cost_in_time: '3 days',
    cost_in_money: 150,
    never_do_again: [
      'Change working configuration',
      'Trust localhost = 127.0.0.1',
      'Modify without testing'
    ],
    always_do: [
      'Keep working configs unchanged',
      'Test with wscat first',
      'Use 127.0.0.1 for IPv4'
    ]
  },
  {
    category: 'modules',
    problem: 'Added QuantumNeuromorphicCore - bot stopped trading',
    solution: 'Remove quantum BS, use simple indicators',
    cost_in_time: '1 week',
    cost_in_money: 200,
    never_do_again: [
      'Add quantum modules',
      'Trust complex = better',
      'Add features without testing impact'
    ],
    always_do: [
      'Test module impact on trading',
      'Keep it simple stupid (KISS)',
      'Verify trades still execute'
    ]
  },
  {
    category: 'testing',
    problem: 'Console.log showed trades but none were real',
    solution: 'Check actual exchange/broker for REAL trades',
    cost_in_time: '2 weeks',
    cost_in_money: 300,
    never_do_again: [
      'Trust console.log for verification',
      'Assume paper trades = real setup',
      'Skip exchange verification'
    ],
    always_do: [
      'Verify on actual exchange',
      'Check account balance changes',
      'Use exchange API to confirm'
    ]
  }
];

// FORMULAS THAT ACTUALLY FUCKING WORK
const formulas = [
  {
    name: 'Sharpe Ratio',
    formula: '(avgReturn - riskFree) / stdDev',
    implementation: `
function calculateSharpe(returns, riskFree = 0.02) {
  const avg = returns.reduce((a,b) => a+b) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
  const std = Math.sqrt(variance);
  return (avg - riskFree) / std;
}`,
    expected_range: '>1.0 Good, >2.0 Very Good, >3.0 Excellent',
    usage_context: 'Risk-adjusted performance - THE metric hedge funds use'
  },
  {
    name: 'Kelly Criterion',
    formula: 'f* = (p*b - q) / b',
    implementation: `
function kellySize(winRate, avgWin, avgLoss) {
  const b = avgWin / avgLoss;
  const p = winRate;
  const q = 1 - winRate;
  const kelly = (p * b - q) / b;
  return Math.max(0, Math.min(0.25, kelly * 0.5)); // Half-Kelly, max 25%
}`,
    expected_range: '10-25% typical, use half-Kelly for safety',
    usage_context: 'Optimal position sizing to maximize growth'
  },
  {
    name: 'Maximum Drawdown',
    formula: '(Peak - Trough) / Peak',
    implementation: `
function maxDrawdown(equity) {
  let peak = equity[0];
  let maxDD = 0;
  for (let val of equity) {
    peak = Math.max(peak, val);
    const dd = (peak - val) / peak;
    maxDD = Math.max(maxDD, dd);
  }
  return maxDD;
}`,
    expected_range: '<10% Excellent, <20% Good, >30% Dangerous',
    usage_context: 'Risk metric - how much you can lose from peak'
  }
];

// MODULES - WHAT'S REAL VS BULLSHIT
const modules = [
  {
    name: 'ExecutionLayer',
    file_path: '/core/ExecutionLayer.js',
    dependencies: ['ccxt', 'axios'],
    exports: ['connect', 'executeTrade', 'getBalance'],
    performance_impact: 'CRITICAL',
    real_value: true
  },
  {
    name: 'QuantumNeuromorphicCore',
    file_path: '/core/QuantumNeuromorphicCore.js',
    dependencies: ['tensorflow', 'quantum-bullshit'],
    exports: ['quantumConsciousness', 'makeDecision'],
    performance_impact: 'NEGATIVE',
    real_value: false
  },
  {
    name: 'ModuleAutoLoader',
    file_path: '/ModuleAutoLoader.js',
    dependencies: [],
    exports: ['require', 'loadAll'],
    performance_impact: 'HIGH',
    real_value: true
  },
  {
    name: 'WebSocketManager',
    file_path: '/core/WebSocketManager.js',
    dependencies: ['ws'],
    exports: ['connect', 'broadcast'],
    performance_impact: 'HIGH',
    real_value: true
  }
];

// UPLOAD TO ARCHON
async function uploadToArchon() {
  console.log('🚀 LOADING REAL KNOWLEDGE INTO ARCHON...\n');
  
  // Upload lessons
  console.log('📚 Uploading expensive lessons...');
  for (const lesson of lessons) {
    try {
      await axios.post(`${ARCHON_URL}/api/knowledge/add`, {
        title: `LESSON: ${lesson.problem}`,
        content: JSON.stringify(lesson, null, 2),
        category: 'lessons',
        tags: ['expensive', 'mistake', lesson.category]
      });
      console.log(`✅ Loaded lesson: ${lesson.problem.substring(0, 50)}...`);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  
  // Upload formulas
  console.log('\n📐 Uploading working formulas...');
  for (const formula of formulas) {
    try {
      await axios.post(`${ARCHON_URL}/api/knowledge/add`, {
        title: `FORMULA: ${formula.name}`,
        content: JSON.stringify(formula, null, 2),
        category: 'formulas',
        tags: ['math', 'working', 'proven']
      });
      console.log(`✅ Loaded formula: ${formula.name}`);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  
  // Upload module registry
  console.log('\n🔧 Uploading module registry...');
  for (const module of modules) {
    try {
      await axios.post(`${ARCHON_URL}/api/knowledge/add`, {
        title: `MODULE: ${module.name} (${module.real_value ? 'WORKS' : 'BULLSHIT'})`,
        content: JSON.stringify(module, null, 2),
        category: 'modules',
        tags: [module.real_value ? 'working' : 'bullshit', 'module']
      });
      console.log(`✅ Loaded module: ${module.name} - ${module.real_value ? '✓ REAL' : '✗ BS'}`);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
    }
  }
  
  console.log('\n🎉 ARCHON NOW KNOWS WHAT ACTUALLY WORKS!');
}

uploadToArchon();