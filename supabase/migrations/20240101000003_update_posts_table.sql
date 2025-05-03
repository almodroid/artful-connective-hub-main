-- Update posts table with media-related fields and constraints
BEGIN;

-- Ensure media_type has correct constraints
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_media_type_check,
  ADD CONSTRAINT posts_media_type_check
  CHECK (media_type IN ('images', 'gif', 'video'));

-- Migrate data from image_url to media_urls if image_url exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'posts' AND column_name = 'image_url') THEN
    -- Update media_urls with image_url data where image_url is not null
    UPDATE posts
    SET media_urls = ARRAY[image_url],
        media_type = 'images'
    WHERE image_url IS NOT NULL
      AND (media_urls IS NULL OR media_urls = '{}');
      
    -- Drop image_url column after migration
    ALTER TABLE posts DROP COLUMN image_url;
  END IF;
END $$;

-- Add link field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'link') THEN
    ALTER TABLE posts ADD COLUMN link TEXT;
  END IF;
END $$;

-- Add media_urls array if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
    ALTER TABLE posts ADD COLUMN media_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add media_type field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'media_type') THEN
    ALTER TABLE posts ADD COLUMN media_type TEXT;
  END IF;
END $$;

COMMIT;