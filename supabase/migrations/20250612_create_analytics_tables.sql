-- Create analytics tables for device usage and conversion tracking

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_info JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics sessions table
CREATE TABLE analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_info JSONB NOT NULL DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  page_views JSONB DEFAULT '[]',
  interactions JSONB DEFAULT '[]',
  conversions JSONB DEFAULT '[]',
  qr_codes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device journeys table for cross-device tracking
CREATE TABLE device_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  devices JSONB DEFAULT '[]',
  conversions JSONB DEFAULT '[]',
  total_duration INTEGER DEFAULT 0,
  cross_device_transitions INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR code interactions table
CREATE TABLE qr_code_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_session_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('generated', 'displayed', 'scanned', 'completed')),
  source_device TEXT NOT NULL,
  target_device TEXT,
  conversion_time INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);

CREATE INDEX idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX idx_analytics_sessions_device_type ON analytics_sessions USING GIN ((device_info->>'device_type'));

CREATE INDEX idx_device_journeys_journey_id ON device_journeys(journey_id);
CREATE INDEX idx_device_journeys_user_id ON device_journeys(user_id);
CREATE INDEX idx_device_journeys_start_time ON device_journeys(start_time);

CREATE INDEX idx_qr_code_interactions_session_id ON qr_code_interactions(qr_session_id);
CREATE INDEX idx_qr_code_interactions_action ON qr_code_interactions(action);
CREATE INDEX idx_qr_code_interactions_timestamp ON qr_code_interactions(timestamp);
CREATE INDEX idx_qr_code_interactions_user_id ON qr_code_interactions(user_id);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_events
CREATE POLICY "Users can insert their own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read their own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for analytics_sessions
CREATE POLICY "Users can insert their own analytics sessions" ON analytics_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read their own analytics sessions" ON analytics_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own analytics sessions" ON analytics_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for device_journeys
CREATE POLICY "Users can insert their own device journeys" ON device_journeys
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read their own device journeys" ON device_journeys
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own device journeys" ON device_journeys
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for qr_code_interactions
CREATE POLICY "Anyone can insert QR code interactions" ON qr_code_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own QR code interactions" ON qr_code_interactions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin policies (for analytics dashboard)
CREATE POLICY "Admins can read all analytics data" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all session data" ON analytics_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all device journeys" ON device_journeys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all QR interactions" ON qr_code_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_sessions_updated_at
  BEFORE UPDATE ON analytics_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_journeys_updated_at
  BEFORE UPDATE ON device_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old analytics data (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
DECLARE
  cutoff_date TIMESTAMPTZ := NOW() - INTERVAL '90 days';
BEGIN
  -- Clean up old analytics events
  DELETE FROM analytics_events WHERE timestamp < cutoff_date;
  
  -- Clean up old analytics sessions
  DELETE FROM analytics_sessions WHERE start_time < cutoff_date;
  
  -- Clean up old QR code interactions
  DELETE FROM qr_code_interactions WHERE timestamp < cutoff_date;
  
  -- Clean up old device journeys
  DELETE FROM device_journeys WHERE start_time < cutoff_date;
  
  RAISE NOTICE 'Cleaned up analytics data older than %', cutoff_date;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old analytics data (runs daily at 2 AM)
SELECT cron.schedule('cleanup-analytics-data', '0 2 * * *', 'SELECT cleanup_old_analytics_data();');

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW daily_device_stats AS
SELECT 
  DATE(timestamp) as date,
  device_info->>'device_type' as device_type,
  device_info->>'platform' as platform,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), device_info->>'device_type', device_info->>'platform'
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_daily_device_stats_unique ON daily_device_stats (date, device_type, platform);

-- Create materialized view for conversion funnel
CREATE MATERIALIZED VIEW conversion_funnel_stats AS
SELECT 
  DATE(timestamp) as date,
  device_info->>'device_type' as device_type,
  SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as page_views,
  SUM(CASE WHEN event_name = 'mobile_banner_interaction' AND properties->>'action' = 'shown' THEN 1 ELSE 0 END) as banner_shows,
  SUM(CASE WHEN event_name = 'mobile_banner_interaction' AND properties->>'action' = 'clicked' THEN 1 ELSE 0 END) as banner_clicks,
  SUM(CASE WHEN event_name = 'qr_code_interaction' AND properties->>'qr_action' = 'generated' THEN 1 ELSE 0 END) as qr_generated,
  SUM(CASE WHEN event_name = 'qr_code_interaction' AND properties->>'qr_action' = 'scanned' THEN 1 ELSE 0 END) as qr_scanned,
  SUM(CASE WHEN event_name = 'conversion' AND properties->>'conversion_type' = 'mobile_switch' THEN 1 ELSE 0 END) as mobile_conversions
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), device_info->>'device_type'
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_conversion_funnel_stats_unique ON conversion_funnel_stats (date, device_type);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_device_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY conversion_funnel_stats;
  RAISE NOTICE 'Analytics materialized views refreshed';
END;
$$ LANGUAGE plpgsql;

-- Schedule materialized view refresh (every hour)
SELECT cron.schedule('refresh-analytics-views', '0 * * * *', 'SELECT refresh_analytics_views();');