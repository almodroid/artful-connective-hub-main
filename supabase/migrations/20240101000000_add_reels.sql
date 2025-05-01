-- Migration to add Reels functionality

-- Create reels table
CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caption TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reel_comments table
CREATE TABLE IF NOT EXISTS reel_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reel_likes table
CREATE TABLE IF NOT EXISTS reel_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id);

-- Create trigger for updated_at field
CREATE TRIGGER update_reels_updated_at
BEFORE UPDATE ON reels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create function to update reel counts
CREATE OR REPLACE FUNCTION update_reel_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'reel_comments' THEN
      UPDATE reels
      SET comments_count = COALESCE(comments_count, 0) + 1
      WHERE id = NEW.reel_id;
    ELSIF TG_TABLE_NAME = 'reel_likes' THEN
      UPDATE reels
      SET likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = NEW.reel_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'reel_comments' THEN
      UPDATE reels
      SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
      WHERE id = OLD.reel_id;
    ELSIF TG_TABLE_NAME = 'reel_likes' THEN
      UPDATE reels
      SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
      WHERE id = OLD.reel_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reel counts
CREATE TRIGGER update_reel_comments_count
AFTER INSERT OR DELETE ON reel_comments
FOR EACH ROW
EXECUTE FUNCTION update_reel_counts();

CREATE TRIGGER update_reel_likes_count
AFTER INSERT OR DELETE ON reel_likes
FOR EACH ROW
EXECUTE FUNCTION update_reel_counts();

-- Enable RLS on new tables
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for reels
CREATE POLICY "Reels are viewable by everyone."
ON reels FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reels."
ON reels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reels."
ON reels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reels."
ON reels FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for reel_comments
CREATE POLICY "Reel comments are viewable by everyone."
ON reel_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reel comments."
ON reel_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reel comments."
ON reel_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reel comments."
ON reel_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for reel_likes
CREATE POLICY "Reel likes are viewable by everyone."
ON reel_likes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reel likes."
ON reel_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reel likes."
ON reel_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create function to increment reel views
CREATE OR REPLACE FUNCTION increment_reel_views(reel_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reels
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql;

-- Create storage policies for reels bucket
CREATE POLICY "Allow authenticated users to create reels bucket"
ON storage.buckets FOR INSERT TO authenticated
WITH CHECK (id = 'reels');

CREATE POLICY "Allow authenticated users to upload reels"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'reels' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to update their own reels"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'reels' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'reels' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow authenticated users to delete their own reels"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'reels' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public access to reels"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'reels');