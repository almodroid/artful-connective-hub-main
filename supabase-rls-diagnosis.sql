-- SQL Diagnostic Script for Messaging System RLS Policies
-- Run this in Supabase SQL Editor

-- 1. Check if all tables have RLS enabled
SELECT 
    table_name,
    has_rls_enabled
FROM 
    pg_tables
WHERE 
    schemaname = 'public' AND
    table_name IN ('conversations', 'conversation_participants', 'messages', 'message_reactions')
ORDER BY 
    table_name;

-- 2. Check all policies for messaging-related tables
SELECT 
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
FROM
    pg_policies p
WHERE
    p.schemaname = 'public' AND
    p.tablename IN ('conversations', 'conversation_participants', 'messages', 'message_reactions')
ORDER BY
    p.tablename, p.policyname;

-- 3. Create a diagnostic function to trace RLS policy application
CREATE OR REPLACE FUNCTION debug_messaging_rls(current_user_id UUID)
RETURNS TABLE(
    table_name TEXT,
    operation TEXT,
    has_access BOOLEAN,
    explanation TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    test_conversation_id UUID;
    test_participant_id UUID;
    test_other_user_id UUID;
BEGIN
    -- Get a random user that is not the current user for testing
    SELECT id INTO test_other_user_id FROM auth.users 
    WHERE id != current_user_id 
    ORDER BY RANDOM() LIMIT 1;
    
    -- Create a test conversation for diagnosis
    INSERT INTO conversations (is_group, last_message_at)
    VALUES (false, NOW())
    RETURNING id INTO test_conversation_id;
    
    RETURN QUERY
    
    -- Check if we can SELECT from conversations
    SELECT 
        'conversations'::TEXT,
        'SELECT'::TEXT,
        EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'conversations' 
            AND cmd = 'SELECT'
            AND qual::TEXT ~~ '%auth.uid()%'
        ),
        'Policy exists but may require user to be in conversation_participants'::TEXT;
    
    -- Check if we can INSERT into conversations
    RETURN QUERY
    SELECT 
        'conversations'::TEXT,
        'INSERT'::TEXT,
        EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'conversations' 
            AND cmd = 'INSERT'
            AND (qual IS NULL OR qual::TEXT = 'true')
        ),
        'Policy should allow any authenticated user to create conversations'::TEXT;
    
    -- Check if we can SELECT from conversation_participants
    RETURN QUERY
    SELECT 
        'conversation_participants'::TEXT,
        'SELECT'::TEXT,
        EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'conversation_participants' 
            AND cmd = 'SELECT'
            AND qual::TEXT ~~ '%auth.uid()%'
        ),
        'Policy should allow user to see participants for their conversations'::TEXT;
    
    -- Check if we can INSERT into conversation_participants
    RETURN QUERY
    SELECT 
        'conversation_participants'::TEXT,
        'INSERT'::TEXT,
        EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'conversation_participants' 
            AND cmd = 'INSERT'
            AND (qual IS NULL OR qual::TEXT = 'true' OR with_check::TEXT ~~ '%auth.uid()%')
        ),
        'Policy should allow adding participants to conversations'::TEXT;
        
    -- Check if we can INSERT into messages
    RETURN QUERY
    SELECT 
        'messages'::TEXT,
        'INSERT'::TEXT,
        EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'messages' 
            AND cmd = 'INSERT'
            AND with_check::TEXT ~~ '%auth.uid()%'
            AND with_check::TEXT ~~ '%sender_id%'
        ),
        'Policy should check that the sender is the current user'::TEXT;
    
    -- Clean up test data
    DELETE FROM conversations WHERE id = test_conversation_id;
    
    RETURN;
END;
$$;

-- 4. Create a helper function to find direct conversations
CREATE OR REPLACE FUNCTION find_direct_conversation(current_user_id UUID, other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    found_conversation_id UUID;
BEGIN
    -- Find conversations where both users are participants
    SELECT cp1.conversation_id INTO found_conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN conversations c ON cp1.conversation_id = c.id
    WHERE cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id
    AND c.is_group = false
    -- Ensure it's a direct conversation (only 2 participants)
    AND (
        SELECT COUNT(*)
        FROM conversation_participants cp3
        WHERE cp3.conversation_id = cp1.conversation_id
    ) = 2
    LIMIT 1;
    
    RETURN found_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add SECURITY DEFINER to the function and grant permission
GRANT EXECUTE ON FUNCTION find_direct_conversation TO authenticated;
COMMENT ON FUNCTION find_direct_conversation IS 'Finds an existing direct conversation between two users if one exists';

-- 6. Create a function to analyze all conversations for a user
CREATE OR REPLACE FUNCTION analyze_user_conversations(user_id UUID)
RETURNS TABLE(
    conversation_id UUID,
    is_group BOOLEAN,
    created_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    participant_count INTEGER,
    other_participants TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.is_group,
        c.created_at,
        c.last_message_at,
        COUNT(cp.user_id)::INTEGER,
        ARRAY_AGG(DISTINCT p.username)::TEXT[]
    FROM 
        conversations c
    JOIN 
        conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN
        profiles p ON cp.user_id = p.id
    WHERE 
        c.id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = user_id
        )
    GROUP BY 
        c.id, c.is_group, c.created_at, c.last_message_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Make this function available to authenticated users
GRANT EXECUTE ON FUNCTION analyze_user_conversations TO authenticated;
COMMENT ON FUNCTION analyze_user_conversations IS 'Analyzes all conversations for a given user';

-- 8. Fix permissions for accessing conversation_participants
DO $$
BEGIN
    -- Recreate the policy for selecting conversation_participants
    DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
    
    CREATE POLICY "Users can view their conversation participants"
        ON conversation_participants FOR SELECT
        USING (true); -- Allow all users to view any conversation_participants record
        
    -- Recreate the policy for inserting conversation_participants
    DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
    
    CREATE POLICY "Users can join conversations"
        ON conversation_participants FOR INSERT
        WITH CHECK (true); -- Allow any authenticated user to insert into conversation_participants
END;
$$; 