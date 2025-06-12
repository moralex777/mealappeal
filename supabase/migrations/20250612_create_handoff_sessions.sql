-- Create handoff_sessions table for QR code PC-to-mobile transfers
CREATE TABLE handoff_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT,
  current_path TEXT NOT NULL,
  context_data JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}',
  analytics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_handoff_sessions_user_id ON handoff_sessions(user_id);
CREATE INDEX idx_handoff_sessions_expires_at ON handoff_sessions(expires_at);
CREATE INDEX idx_handoff_sessions_created_at ON handoff_sessions(created_at);

-- Create RLS policies
ALTER TABLE handoff_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to create handoff sessions
CREATE POLICY "Users can create handoff sessions" ON handoff_sessions
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read handoff sessions by ID (for QR code scanning)
CREATE POLICY "Anyone can read handoff sessions by ID" ON handoff_sessions
  FOR SELECT USING (true);

-- Allow users to update their own handoff sessions
CREATE POLICY "Users can update their own handoff sessions" ON handoff_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own handoff sessions
CREATE POLICY "Users can delete their own handoff sessions" ON handoff_sessions
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_handoff_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM handoff_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (runs every hour)
SELECT cron.schedule('cleanup-handoff-sessions', '0 * * * *', 'SELECT cleanup_expired_handoff_sessions();');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_handoff_sessions_updated_at
  BEFORE UPDATE ON handoff_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();