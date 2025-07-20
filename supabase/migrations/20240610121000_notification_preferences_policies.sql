-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to select (read) their own preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own preferences (optional)
CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
  FOR DELETE USING (auth.uid() = user_id); 