-- Create bookmarked_posts table
CREATE TABLE bookmarked_posts (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

-- Enable Row Level Security (RLS) for bookmarked_posts
ALTER TABLE bookmarked_posts ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own bookmarked posts
CREATE POLICY "Users can view their own bookmarked posts" ON bookmarked_posts
FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own bookmarked posts
CREATE POLICY "Users can insert their own bookmarked posts" ON bookmarked_posts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own bookmarked posts
CREATE POLICY "Users can delete their own bookmarked posts" ON bookmarked_posts
FOR DELETE USING (auth.uid() = user_id);