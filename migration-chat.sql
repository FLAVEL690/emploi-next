-- ============================================
-- MIGRATION: Messagerie interne (chat)
-- Les candidatures se font uniquement via la plateforme.
-- Candidat et recruteur échangent dans un chat, le candidat
-- joint les documents demandés (max 2 Mo par document).
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- Conversations : une par couple (offre, candidat)
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- Messages (les pièces jointes sont stockées dans attachments en JSONB)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users see their own conversations" ON conversations;
CREATE POLICY "Users see their own conversations" ON conversations FOR SELECT USING (
  candidate_id = auth.uid() OR recruiter_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
  candidate_id = auth.uid() OR recruiter_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
  candidate_id = auth.uid() OR recruiter_id = auth.uid()
);

-- MESSAGES
DROP POLICY IF EXISTS "Users see messages of their conversations" ON messages;
CREATE POLICY "Users see messages of their conversations" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.candidate_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations" ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.candidate_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);
DROP POLICY IF EXISTS "Users can update messages read status" ON messages;
CREATE POLICY "Users can update messages read status" ON messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.candidate_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

-- ============================================
-- REALTIME (messages en temps réel)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ============================================
-- STORAGE BUCKET pour les documents du chat
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-documents', 'chat-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload chat documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-documents');

DROP POLICY IF EXISTS "Everyone can read chat documents" ON storage.objects;
CREATE POLICY "Everyone can read chat documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-documents');

-- ============================================
-- FORCER LA RÉCEPTION VIA LA PLATEFORME
-- ============================================

UPDATE jobs SET application_method = 'platform'
WHERE application_method IN ('whatsapp', 'email');
