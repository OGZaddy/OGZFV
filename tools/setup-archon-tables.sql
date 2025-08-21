-- TRADING STRATEGIES TABLE - REAL SHIT THAT WORKS
CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  type TEXT, -- 'lstm', 'gru', 'ensemble', 'statarb'
  code TEXT, -- Actual implementation
  performance JSONB, -- {sharpe: 2.4, winRate: 0.64, etc}
  parameters JSONB, -- {lookback: 30, units: 64, etc}
  created_at TIMESTAMP DEFAULT NOW(),
  last_tested TIMESTAMP,
  status TEXT -- 'active', 'testing', 'failed'
);

-- BACKTEST RESULTS - PROOF OF WHAT WORKS
CREATE TABLE IF NOT EXISTS backtests (
  id SERIAL PRIMARY KEY,
  strategy_id INTEGER REFERENCES strategies(id),
  data_range TSRANGE,
  sharpe DECIMAL,
  calmar DECIMAL,
  max_drawdown DECIMAL,
  win_rate DECIMAL,
  profit_factor DECIMAL,
  total_return DECIMAL,
  trades_count INTEGER,
  parameters_used JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LESSONS LEARNED - NEVER REPEAT THESE FUCKING MISTAKES
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  category TEXT, -- 'bug', 'optimization', 'architecture'
  problem TEXT,
  solution TEXT,
  cost_in_time TEXT, -- '2 weeks', '3 days'
  cost_in_money DECIMAL, -- 150.00
  never_do_again TEXT[], -- ['change working URLs', 'add quantum BS']
  always_do TEXT[], -- ['use autoloader', 'check if bot trades']
  created_at TIMESTAMP DEFAULT NOW()
);

-- FORMULAS THAT ACTUALLY WORK
CREATE TABLE IF NOT EXISTS formulas (
  id SERIAL PRIMARY KEY,
  name TEXT, -- 'Sharpe Ratio', 'Kelly Criterion'
  formula TEXT, -- The actual math
  implementation TEXT, -- JavaScript code
  expected_range TEXT, -- 'Good: >2.0'
  usage_context TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MODULE REGISTRY - WHAT'S REAL VS BULLSHIT
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  file_path TEXT,
  dependencies TEXT[],
  exports TEXT[],
  performance_impact TEXT, -- 'High', 'Medium', 'Low'
  real_value BOOLEAN DEFAULT true, -- Does it actually help?
  created_at TIMESTAMP DEFAULT NOW()
);

-- ACTUAL TRADES - PROOF WE'RE MAKING MONEY
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  order_id TEXT,
  action TEXT,
  size DECIMAL,
  price DECIMAL,
  pnl DECIMAL,
  timestamp TIMESTAMP DEFAULT NOW()
);