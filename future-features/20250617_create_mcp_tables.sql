-- MCP Infrastructure Tables
-- Required for Security, Monitoring, and Analytics MCPs

-- Audit Logs Table (Security & Compliance MCP)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  hash VARCHAR(64) NOT NULL, -- SHA-256 hash for tamper detection
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Schema Migrations Table (Database & Backup MCP)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  checksum VARCHAR(64),
  status VARCHAR(50) DEFAULT 'pending',
  error TEXT,
  rolled_back_at TIMESTAMPTZ
);

-- Performance Metrics Table (Production Monitoring MCP)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT
);

-- Create indexes for performance queries
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_response_time ON performance_metrics(response_time_ms);

-- API Usage Tracking Table (API Cost Management MCP)
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL, -- 'openai', 'usda', etc.
  endpoint VARCHAR(255) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  cached BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for cost tracking
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_service ON api_usage(service);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp DESC);

-- User Analytics Events Table (User Analytics MCP)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  event_properties JSONB,
  page_path VARCHAR(500),
  user_agent TEXT,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Customer Feedback Table (Customer Support MCP)
CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'bug', 'feature', 'praise', 'complaint'
  category VARCHAR(100),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_progress', 'resolved'
  priority VARCHAR(20) DEFAULT 'medium',
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for support queries
CREATE INDEX idx_customer_feedback_user_id ON customer_feedback(user_id);
CREATE INDEX idx_customer_feedback_status ON customer_feedback(status);
CREATE INDEX idx_customer_feedback_created_at ON customer_feedback(created_at DESC);

-- Create helper functions for MCPs

-- Function to get slow queries (Database MCP)
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  mean_time DOUBLE PRECISION,
  max_time DOUBLE PRECISION
) AS $$
BEGIN
  -- This is a placeholder - in production, enable pg_stat_statements
  RETURN QUERY
  SELECT 
    'Sample slow query'::TEXT as query,
    100::BIGINT as calls,
    1500.0::DOUBLE PRECISION as mean_time,
    3000.0::DOUBLE PRECISION as max_time;
END;
$$ LANGUAGE plpgsql;

-- Function to get database size (Database MCP)
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS BIGINT AS $$
BEGIN
  RETURN pg_database_size(current_database());
END;
$$ LANGUAGE plpgsql;

-- Function to get table sizes (Database MCP)
CREATE OR REPLACE FUNCTION get_tables_sizes()
RETURNS TABLE (
  table_name TEXT,
  size_bytes BIGINT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename AS table_name,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to execute SQL (for migrations - use with caution!)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only allow for service role
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON schema_migrations TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT ON api_usage TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_feedback TO authenticated;

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Users can view their own API usage" ON api_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own analytics" ON analytics_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own feedback" ON customer_feedback
  FOR ALL USING (user_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_feedback_updated_at BEFORE UPDATE ON customer_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();