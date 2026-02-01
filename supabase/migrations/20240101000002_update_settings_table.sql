 -- Update settings table with new fields and default values
BEGIN;

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'settings' AND column_name = 'category') THEN
        ALTER TABLE settings ADD COLUMN category text;
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'settings' AND column_name = 'description') THEN
        ALTER TABLE settings ADD COLUMN description text;
    END IF;
END $$;

-- Insert or update default settings
INSERT INTO settings (key, value, description, category)
VALUES
    -- Site settings
    ('site_name', 'Artspace', 'The name of your site', 'site'),
    ('site_description', 'A platform for artists to connect and share their work', 'Brief description of your site', 'site'),
    ('site_logo', '', 'URL to your site logo', 'site'),
    ('site_favicon', '', 'URL to your site favicon', 'site'),
    
    -- SEO settings
    ('meta_title', 'Artspace - Artist Community', 'Title for search engines', 'seo'),
    ('meta_description', 'Join the Artspace community to connect with artists, share your work, and discover new art.', 'Description for search engines', 'seo'),
    ('meta_keywords', 'art, artists, community, gallery, portfolio', 'Keywords for search engines', 'seo'),
    ('google_analytics_id', '', 'Google Analytics tracking ID', 'seo'),
    
    -- Social media settings
    ('facebook_url', '', 'Facebook page URL', 'social'),
    ('twitter_url', '', 'Twitter profile URL', 'social'),
    ('instagram_url', '', 'Instagram profile URL', 'social'),
    ('linkedin_url', '', 'LinkedIn company page URL', 'social'),
    
    -- SMTP settings
    ('smtp_host', '', 'SMTP server host', 'smtp'),
    ('smtp_port', '587', 'SMTP server port', 'smtp'),
    ('smtp_user', '', 'SMTP username', 'smtp'),
    ('smtp_password', '', 'SMTP password', 'smtp'),
    ('smtp_from_email', '', 'Sender email address', 'smtp'),
    ('smtp_from_name', '', 'Sender name', 'smtp'),
    
    -- Notification settings
    ('enable_email_notifications', 'true', 'Enable email notifications', 'notifications'),
    ('enable_push_notifications', 'true', 'Enable push notifications', 'notifications'),
    ('notification_frequency', 'instant', 'How often to send notifications', 'notifications'),
    
    -- Optimization settings
    ('enable_caching', 'true', 'Enable data caching', 'optimization'),
    ('enable_compression', 'true', 'Enable data compression', 'optimization'),
    ('enable_lazy_loading', 'true', 'Enable lazy loading of images', 'optimization'),
    ('max_upload_size', '5', 'Maximum file upload size in MB', 'optimization'),
    -- Google Ads settings
    ('ads_enabled', 'false', 'Enable or disable Google Ads', 'ads'),
    ('adsense_publisher_id', '', 'Google AdSense Publisher ID (ca-pub-...)', 'ads'),
    ('adsense_post_slot', '', 'AdSense Slot ID for Post', 'ads'),
    ('adsense_reel_slot', '', 'AdSense Slot ID for Reel', 'ads'),
    ('adsense_project_slot', '', 'AdSense Slot ID for Project Details', 'ads'),
    ('adsense_script', '', 'Custom AdSense script (optional)', 'ads')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;