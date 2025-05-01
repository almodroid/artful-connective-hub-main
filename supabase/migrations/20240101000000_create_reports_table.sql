-- Create the reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_id_idx ON reports(reported_id);
CREATE INDEX IF NOT EXISTS reports_content_id_idx ON reports(content_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at);

-- Create a function to create the reports table if it doesn't exist
CREATE OR REPLACE FUNCTION create_reports_table()
RETURNS void AS $$
BEGIN
  -- Check if the reports table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    -- Create the reports table
    CREATE TABLE reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
      content_id UUID NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX reports_reporter_id_idx ON reports(reporter_id);
    CREATE INDEX reports_reported_id_idx ON reports(reported_id);
    CREATE INDEX reports_content_id_idx ON reports(content_id);
    CREATE INDEX reports_status_idx ON reports(status);
    CREATE INDEX reports_created_at_idx ON reports(created_at);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Register the function in the Supabase schema
COMMENT ON FUNCTION create_reports_table() IS 'Creates the reports table if it does not exist'; 