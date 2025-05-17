-- Add message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- Add blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Add media support to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'gif')),
ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Create function to check message edit time limit
CREATE OR REPLACE FUNCTION check_message_edit_time_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (EXTRACT(EPOCH FROM (NOW() - OLD.created_at)) > 60) THEN
    RAISE EXCEPTION 'Cannot edit message after 60 seconds';
  END IF;
  NEW.edited := TRUE;
  NEW.edited_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message edit time limit
CREATE TRIGGER check_message_edit_time_limit
BEFORE UPDATE OF content ON messages
FOR EACH ROW
EXECUTE FUNCTION check_message_edit_time_limit();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Enable Row Level Security for new tables
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policies for message_reactions
CREATE POLICY "Users can view reactions in conversations they are part of"
ON message_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversation_participants cp
  JOIN messages m ON m.conversation_id = cp.conversation_id
  WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
));

CREATE POLICY "Users can add reactions to messages in their conversations"
ON message_reactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions"
ON message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for blocked_users
CREATE POLICY "Users can view their blocked users list"
ON blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users"
ON blocked_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

CREATE POLICY "Users can unblock users they blocked"
ON blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- Modify message policies to check for blocked users
DROP POLICY IF EXISTS "Users can send messages to conversations they are part of" ON messages;
CREATE POLICY "Users can send messages to conversations they are part of"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  ) AND
  NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id != auth.uid()
    )) OR
    (blocked_id = auth.uid() AND blocker_id IN (
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id != auth.uid()
    ))
  )
);

-- Add function to delete conversation
CREATE OR REPLACE FUNCTION delete_conversation(conversation_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Check if the user is a participant in the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversation_id_param AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Delete the conversation and all related data (messages, reactions, etc. will be deleted via CASCADE)
  DELETE FROM conversations WHERE id = conversation_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;