-- Create the settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);
CREATE INDEX IF NOT EXISTS settings_category_idx ON settings(category);

-- Create a function to create the settings table if it doesn't exist
CREATE OR REPLACE FUNCTION create_settings_table()
RETURNS void AS $$
BEGIN
  -- Check if the settings table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings') THEN
    -- Create the settings table
    CREATE TABLE settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX settings_key_idx ON settings(key);
    CREATE INDEX settings_category_idx ON settings(category);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Register the function in the Supabase schema
COMMENT ON FUNCTION create_settings_table() IS 'Creates the settings table if it does not exist'; 