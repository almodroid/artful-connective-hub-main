-- Migration to add Reel Reports functionality

-- Create reel_reports table
CREATE TABLE IF NOT EXISTS reel_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, rejected
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reel_reports_reel_id ON reel_reports(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_reports_reporter_id ON reel_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reel_reports_status ON reel_reports(status);

-- Enable RLS on new table
ALTER TABLE reel_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reel_reports
CREATE POLICY "Users can view their own reports"
ON reel_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON reel_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

CREATE POLICY "Users can create reports"
ON reel_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
ON reel_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

-- Users cannot delete reports, even their own 