-- Create schema for trading bot data
CREATE SCHEMA IF NOT EXISTS trading;

-- Trades table for storing all trade executions
CREATE TABLE IF NOT EXISTS trading.trades (
  id BIGSERIAL PRIMARY KEY,
  bot_type VARCHAR(50) NOT NULL,
  bot_instance VARCHAR(100),
  trade_id VARCHAR(100) UNIQUE,
  pair VARCHAR(20) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  total_value DECIMAL(20, 8),
  fee DECIMAL(20, 8),
  pnl DECIMAL(20, 8),
  pnl_percentage DECIMAL(10, 4),
  pattern VARCHAR(100),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  indicators JSONB,
  metadata JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_trades_bot_type ON trading.trades(bot_type);
CREATE INDEX idx_trades_pair ON trading.trades(pair);
CREATE INDEX idx_trades_executed_at ON trading.trades(executed_at DESC);
CREATE INDEX idx_trades_pnl ON trading.trades(pnl DESC);
CREATE INDEX idx_trades_pattern ON trading.trades(pattern);

-- Bot performance metrics table
CREATE TABLE IF NOT EXISTS trading.bot_performance (
  id BIGSERIAL PRIMARY KEY,
  bot_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2),
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  avg_pnl_per_trade DECIMAL(20, 8),
  best_trade DECIMAL(20, 8),
  worst_trade DECIMAL(20, 8),
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_type, date)
);

-- Market data cache
CREATE TABLE IF NOT EXISTS trading.market_data (
  id BIGSERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  open DECIMAL(20, 8),
  high DECIMAL(20, 8),
  low DECIMAL(20, 8),
  close DECIMAL(20, 8),
  volume DECIMAL(20, 8),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pair, timeframe, timestamp)
);

-- Pattern recognition results
CREATE TABLE IF NOT EXISTS trading.patterns (
  id BIGSERIAL PRIMARY KEY,
  pair VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  pattern_name VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(50),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  expected_move DECIMAL(10, 4),
  risk_reward_ratio DECIMAL(10, 4),
  entry_price DECIMAL(20, 8),
  target_price DECIMAL(20, 8),
  stop_loss DECIMAL(20, 8),
  metadata JSONB,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- User accounts for bot access
CREATE TABLE IF NOT EXISTS trading.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'elite', 'quantum')),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  api_key VARCHAR(255) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archon knowledge base integration
CREATE TABLE IF NOT EXISTS trading.knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  problem TEXT,
  solution TEXT,
  code_snippet TEXT,
  tags TEXT[],
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  time_wasted INTERVAL,
  times_encountered INTEGER DEFAULT 1,
  last_encountered TIMESTAMP WITH TIME ZONE,
  never_do_again BOOLEAN DEFAULT FALSE,
  always_do BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts and notifications
CREATE TABLE IF NOT EXISTS trading.alerts (
  id BIGSERIAL PRIMARY KEY,
  bot_type VARCHAR(50),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create views for real-time monitoring
CREATE OR REPLACE VIEW trading.live_performance AS
SELECT 
  bot_type,
  COUNT(*) as total_trades_today,
  SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins_today,
  SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses_today,
  ROUND(AVG(confidence), 2) as avg_confidence,
  SUM(pnl) as total_pnl_today,
  MAX(pnl) as best_trade_today,
  MIN(pnl) as worst_trade_today
FROM trading.trades
WHERE executed_at >= CURRENT_DATE
GROUP BY bot_type;

-- Create function for updating bot performance
CREATE OR REPLACE FUNCTION trading.update_bot_performance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trading.bot_performance (
    bot_type, date, total_trades, winning_trades, losing_trades,
    win_rate, total_pnl, avg_pnl_per_trade
  )
  VALUES (
    NEW.bot_type,
    DATE(NEW.executed_at),
    1,
    CASE WHEN NEW.pnl > 0 THEN 1 ELSE 0 END,
    CASE WHEN NEW.pnl < 0 THEN 1 ELSE 0 END,
    CASE WHEN NEW.pnl > 0 THEN 100 ELSE 0 END,
    NEW.pnl,
    NEW.pnl
  )
  ON CONFLICT (bot_type, date) DO UPDATE SET
    total_trades = bot_performance.total_trades + 1,
    winning_trades = bot_performance.winning_trades + CASE WHEN NEW.pnl > 0 THEN 1 ELSE 0 END,
    losing_trades = bot_performance.losing_trades + CASE WHEN NEW.pnl < 0 THEN 1 ELSE 0 END,
    win_rate = ROUND((bot_performance.winning_trades + CASE WHEN NEW.pnl > 0 THEN 1 ELSE 0 END)::DECIMAL / 
               (bot_performance.total_trades + 1) * 100, 2),
    total_pnl = bot_performance.total_pnl + NEW.pnl,
    avg_pnl_per_trade = (bot_performance.total_pnl + NEW.pnl) / (bot_performance.total_trades + 1),
    best_trade = GREATEST(bot_performance.best_trade, NEW.pnl),
    worst_trade = LEAST(bot_performance.worst_trade, NEW.pnl),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic performance updates
CREATE TRIGGER update_performance_on_trade
AFTER INSERT ON trading.trades
FOR EACH ROW
EXECUTE FUNCTION trading.update_bot_performance();

-- Enable Row Level Security
ALTER TABLE trading.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading.bot_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Public read access" ON trading.bot_performance
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view their trades" ON trading.trades
  FOR SELECT USING (true);  -- Modify based on your auth requirements

-- Grant permissions
GRANT USAGE ON SCHEMA trading TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA trading TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA trading TO postgres;