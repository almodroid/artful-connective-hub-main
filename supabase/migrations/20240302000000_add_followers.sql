-- Migration to add followers functionality

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for the follower
    UPDATE profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for the user being followed
    UPDATE profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for the follower
    UPDATE profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for the user being followed
    UPDATE profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower counts
CREATE TRIGGER update_follower_counts
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- Add follower counts to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Enable RLS on followers table
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create policies for followers
CREATE POLICY "Followers are viewable by everyone."
ON followers FOR SELECT
USING (true);

CREATE POLICY "Users can follow others."
ON followers FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others."
ON followers FOR DELETE
USING (auth.uid() = follower_id);

-- Create function to check if a user is following another user
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM followers
    WHERE followers.follower_id = $1
    AND followers.following_id = $2
  );
END;
$$ LANGUAGE plpgsql; 