const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dbpuhvxbiedjqxeqdonw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicHVodnhiaWVkanF4ZXFkb253Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg1ODIwNiwiZXhwIjoyMDcwNDM0MjA2fQ.S-GjkFcWj_IDjaEf62Q-ZSukWr7kR0Jv9bAP_N-UiVw';

// Create Supabase client with service role key for full access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Trade logging function
async function logTrade(tradeData) {
  try {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        bot_type: tradeData.botType || 'unknown',
        bot_instance: tradeData.botInstance,
        trade_id: tradeData.tradeId,
        pair: tradeData.pair,
        action: tradeData.action,
        price: tradeData.price,
        quantity: tradeData.quantity,
        total_value: tradeData.totalValue,
        fee: tradeData.fee,
        pnl: tradeData.pnl,
        pnl_percentage: tradeData.pnlPercentage,
        pattern: tradeData.pattern,
        confidence: tradeData.confidence,
        indicators: tradeData.indicators,
        metadata: tradeData.metadata,
        executed_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error logging trade to Supabase:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception logging trade:', err);
    return { success: false, error: err.message };
  }
}

// Performance tracking
async function updateBotPerformance(botType, metrics) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bot_performance')
      .upsert({
        bot_type: botType,
        date: today,
        ...metrics,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'bot_type,date'
      })
      .select();

    if (error) {
      console.error('Error updating bot performance:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception updating performance:', err);
    return { success: false, error: err.message };
  }
}

// Market data caching
async function cacheMarketData(marketData) {
  try {
    const { data, error } = await supabase
      .from('market_data')
      .insert({
        pair: marketData.pair,
        timeframe: marketData.timeframe,
        open: marketData.open,
        high: marketData.high,
        low: marketData.low,
        close: marketData.close,
        volume: marketData.volume,
        timestamp: marketData.timestamp || new Date().toISOString()
      })
      .select();

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Error caching market data:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception caching market data:', err);
    return { success: false, error: err.message };
  }
}

// Pattern detection logging
async function logPattern(patternData) {
  try {
    const { data, error } = await supabase
      .from('patterns')
      .insert({
        pair: patternData.pair,
        timeframe: patternData.timeframe,
        pattern_name: patternData.patternName,
        pattern_type: patternData.patternType,
        confidence: patternData.confidence,
        expected_move: patternData.expectedMove,
        risk_reward_ratio: patternData.riskRewardRatio,
        entry_price: patternData.entryPrice,
        target_price: patternData.targetPrice,
        stop_loss: patternData.stopLoss,
        metadata: patternData.metadata,
        detected_at: new Date().toISOString(),
        expires_at: patternData.expiresAt
      })
      .select();

    if (error) {
      console.error('Error logging pattern:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception logging pattern:', err);
    return { success: false, error: err.message };
  }
}

// Knowledge base operations
async function addKnowledge(knowledge) {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        category: knowledge.category,
        subcategory: knowledge.subcategory,
        title: knowledge.title,
        problem: knowledge.problem,
        solution: knowledge.solution,
        code_snippet: knowledge.codeSnippet,
        tags: knowledge.tags,
        severity: knowledge.severity,
        time_wasted: knowledge.timeWasted,
        never_do_again: knowledge.neverDoAgain || false,
        always_do: knowledge.alwaysDo || false,
        metadata: knowledge.metadata,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error adding knowledge:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception adding knowledge:', err);
    return { success: false, error: err.message };
  }
}

// Alert system
async function createAlert(alertData) {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        bot_type: alertData.botType,
        alert_type: alertData.alertType,
        severity: alertData.severity || 'info',
        title: alertData.title,
        message: alertData.message,
        metadata: alertData.metadata,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating alert:', error);
      return { success: false, error };
    }

    // Send real-time notification
    if (data && data[0]) {
      await supabase
        .from('alerts')
        .update({ id: data[0].id })
        .eq('id', data[0].id);
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception creating alert:', err);
    return { success: false, error: err.message };
  }
}

// Get recent trades
async function getRecentTrades(botType = null, limit = 100) {
  try {
    let query = supabase
      .from('trades')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (botType) {
      query = query.eq('bot_type', botType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trades:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception fetching trades:', err);
    return { success: false, error: err.message };
  }
}

// Get performance metrics
async function getPerformanceMetrics(botType = null, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('bot_performance')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (botType) {
      query = query.eq('bot_type', botType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching performance:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception fetching performance:', err);
    return { success: false, error: err.message };
  }
}

// Real-time subscriptions
function subscribeToTrades(callback) {
  return supabase
    .channel('trades-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'trades'
    }, callback)
    .subscribe();
}

function subscribeToAlerts(callback) {
  return supabase
    .channel('alerts-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts'
    }, callback)
    .subscribe();
}

module.exports = {
  supabase,
  logTrade,
  updateBotPerformance,
  cacheMarketData,
  logPattern,
  addKnowledge,
  createAlert,
  getRecentTrades,
  getPerformanceMetrics,
  subscribeToTrades,
  subscribeToAlerts
};