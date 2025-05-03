-- Artful Connective Hub Database Schema
-- This SQL file contains the schema definition for the Supabase project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  header_image TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  cover_image_url TEXT,
  content_blocks JSONB,
  external_link TEXT,
  views INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_likes table
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  content TEXT NOT NULL,
  link TEXT,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT CHECK (media_type IN ('images', 'gif', 'video')),
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts table
CREATE POLICY "Enable insert for authenticated users" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Ensure users can only insert with their own user_id" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Enable update for owners" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);

-- Create posts_tags junction table
CREATE TABLE IF NOT EXISTS posts_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_global BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  action_type TEXT,
  action_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at fields
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_portfolio_updated_at
BEFORE UPDATE ON portfolio
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create function to increment project views
CREATE OR REPLACE FUNCTION increment_project_views(project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET views = COALESCE(views, 0) + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts
      SET comments_count = COALESCE(comments_count, 0) + 1
      WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts
      SET likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts
      SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
      WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts
      SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post counts
CREATE TRIGGER update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_counts();

-- Set up Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profiles"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile."
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Create policies for projects
CREATE POLICY "Projects are viewable by everyone."
ON projects FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own projects."
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects."
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects."
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for project_comments
CREATE POLICY "Project comments are viewable by everyone."
ON project_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own project comments."
ON project_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project comments."
ON project_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project comments."
ON project_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for project_likes
CREATE POLICY "Project likes are viewable by everyone."
ON project_likes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own project likes."
ON project_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project likes."
ON project_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for posts
CREATE POLICY "Public posts are visible to everyone" ON posts
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can create their own posts" ON posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts."
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts."
ON posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts."
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for post_comments
CREATE POLICY "Post comments are viewable by everyone."
ON post_comments FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own post comments."
ON post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post comments."
ON post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own post comments."
ON post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for post_likes
CREATE POLICY "Post likes are viewable by everyone."
ON post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own post likes."
ON post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post likes."
ON post_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for tags and posts_tags
CREATE POLICY "Tags are viewable by everyone."
ON tags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert tags."
ON tags FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Posts_tags are viewable by everyone."
ON posts_tags FOR SELECT
USING (true);

CREATE POLICY "Users can manage posts_tags for their own posts."
ON posts_tags FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()));

CREATE POLICY "Users can delete posts_tags for their own posts."
ON posts_tags FOR DELETE
USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid()));

-- Create policies for portfolio
CREATE POLICY "Portfolio items are viewable by everyone."
ON portfolio FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own portfolio items."
ON portfolio FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio items."
ON portfolio FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio items."
ON portfolio FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications or global ones."
ON notifications FOR SELECT
USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Only authenticated users can insert notifications."
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications."
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications."
ON notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Allow media management" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = (auth.jwt() ->> 'id')::text
)
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = (auth.jwt() ->> 'id')::text
);

-- Create a trigger function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150?u=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();