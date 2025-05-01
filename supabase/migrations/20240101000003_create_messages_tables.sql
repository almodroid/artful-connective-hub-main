-- Create messages and conversations tables
BEGIN;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    is_group BOOLEAN DEFAULT FALSE,
    name TEXT -- For group conversations
);

-- Create conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_admin BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('text', 'image', 'video', 'audio')),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, reaction)
);

-- Create RLS policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (true);

-- Conversation participants policies
CREATE POLICY "Users can view their conversation participants"
    ON conversation_participants FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations"
    ON conversation_participants FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own participant status"
    ON conversation_participants FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants
            WHERE user_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

CREATE POLICY "Users can edit their own messages"
    ON messages FOR UPDATE
    USING (
        sender_id = auth.uid()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        sender_id = auth.uid()
        AND deleted_at IS NULL
    );

CREATE POLICY "Users can delete their own messages"
    ON messages FOR UPDATE
    USING (
        sender_id = auth.uid()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        sender_id = auth.uid()
        AND deleted_at IS NOT NULL
    );

-- Message reactions policies
CREATE POLICY "Users can view reactions in their conversations"
    ON message_reactions FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM messages
            WHERE conversation_id IN (
                SELECT conversation_id FROM conversation_participants
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their reactions"
    ON message_reactions FOR DELETE
    USING (user_id = auth.uid());

-- Create functions
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Create function to handle message deletion
CREATE OR REPLACE FUNCTION handle_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is the last message in the conversation, update conversation's last_message_at
    IF NOT EXISTS (
        SELECT 1 FROM messages
        WHERE conversation_id = OLD.conversation_id
        AND id != OLD.id
        AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
    ) THEN
        UPDATE conversations
        SET last_message_at = NULL,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_message_deletion_trigger
    AFTER UPDATE OF deleted_at ON messages
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION handle_message_deletion();

COMMIT; 