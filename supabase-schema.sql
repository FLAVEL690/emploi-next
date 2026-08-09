-- ============================================
-- SCHEMA SQL POUR SUPABASE (PostgreSQL)
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'recruiter', 'candidate')) DEFAULT 'candidate',
  company TEXT,
  phone TEXT,
  avatar TEXT,
  cv TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des offres d'emploi
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
  mode TEXT NOT NULL CHECK (mode IN ('on-site', 'remote', 'hybrid')),
  salary TEXT,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  requirements TEXT,
  benefits TEXT,
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'any')) DEFAULT 'any',
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des candidatures
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des publicités
CREATE TABLE IF NOT EXISTS advertisements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  link_url TEXT,
  position TEXT DEFAULT 'banner' CHECK (position IN ('banner', 'sidebar', 'inline')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des offres sauvegardées
CREATE TABLE IF NOT EXISTS saved_jobs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Table des conversations (chat candidat-recruteur par offre)
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- Table des messages du chat
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

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT
);

-- Insérer les catégories par défaut
INSERT INTO categories (name) VALUES
  ('Informatique & Tech'),
  ('Marketing & Communication'),
  ('Finance & Comptabilité'),
  ('Ressources Humaines'),
  ('Commercial & Vente'),
  ('Santé & Médical'),
  ('Éducation & Formation'),
  ('Ingénierie'),
  ('Design & Créatif'),
  ('Logistique & Transport'),
  ('Juridique'),
  ('Hôtellerie & Restauration'),
  ('BTP & Construction'),
  ('Agriculture'),
  ('Autre')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Profiles visibles par tous" ON profiles;
CREATE POLICY "Profiles visibles par tous" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
CREATE POLICY "Admin can delete profiles" ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- JOBS
DROP POLICY IF EXISTS "Jobs actifs visibles par tous" ON jobs;
CREATE POLICY "Jobs actifs visibles par tous" ON jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Recruiters and admins can insert jobs" ON jobs;
CREATE POLICY "Recruiters and admins can insert jobs" ON jobs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('recruiter', 'admin'))
);
DROP POLICY IF EXISTS "Owner or admin can update jobs" ON jobs;
CREATE POLICY "Owner or admin can update jobs" ON jobs FOR UPDATE USING (
  recruiter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Owner or admin can delete jobs" ON jobs;
CREATE POLICY "Owner or admin can delete jobs" ON jobs FOR DELETE USING (
  recruiter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- APPLICATIONS
DROP POLICY IF EXISTS "Candidates see own applications" ON applications;
CREATE POLICY "Candidates see own applications" ON applications FOR SELECT USING (
  candidate_id = auth.uid()
  OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Candidates can apply" ON applications;
CREATE POLICY "Candidates can apply" ON applications FOR INSERT WITH CHECK (
  candidate_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'candidate')
);
DROP POLICY IF EXISTS "Recruiter or admin can update application status" ON applications;
CREATE POLICY "Recruiter or admin can update application status" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ADVERTISEMENTS
DROP POLICY IF EXISTS "Ads visibles par tous" ON advertisements;
CREATE POLICY "Ads visibles par tous" ON advertisements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage ads" ON advertisements;
CREATE POLICY "Admin can manage ads" ON advertisements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admin can update ads" ON advertisements;
CREATE POLICY "Admin can update ads" ON advertisements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admin can delete ads" ON advertisements;
CREATE POLICY "Admin can delete ads" ON advertisements FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SAVED JOBS
DROP POLICY IF EXISTS "Users see own saved jobs" ON saved_jobs;
CREATE POLICY "Users see own saved jobs" ON saved_jobs FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can save jobs" ON saved_jobs;
CREATE POLICY "Users can save jobs" ON saved_jobs FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can unsave jobs" ON saved_jobs;
CREATE POLICY "Users can unsave jobs" ON saved_jobs FOR DELETE USING (user_id = auth.uid());

-- CATEGORIES
DROP POLICY IF EXISTS "Categories visibles par tous" ON categories;
CREATE POLICY "Categories visibles par tous" ON categories FOR SELECT USING (true);

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
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Créer le profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, company, phone, city, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'country'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour désactiver les offres expirées (à appeler via un cron Supabase)
CREATE OR REPLACE FUNCTION deactivate_expired_jobs()
RETURNS void AS $$
BEGIN
  UPDATE jobs SET is_active = FALSE WHERE expires_at <= NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKET pour les publicités
-- ============================================
-- Créer manuellement dans Supabase Dashboard > Storage :
-- Bucket name: "ads" (public)
-- Policies: allow authenticated admins to upload, allow public read

-- ============================================
-- STORAGE BUCKET pour les documents du chat
-- ============================================
-- Créer manuellement dans Supabase Dashboard > Storage :
-- Bucket name: "chat-documents" (public)
-- Policies: allow authenticated users to upload, allow public read

-- ============================================
-- REALTIME pour la messagerie
-- ============================================
-- Activer dans Supabase Dashboard > Database > Replication :
-- publications "supabase_realtime" -> ajouter les tables
-- conversations et messages

-- ============================================
-- CRÉER LE COMPTE ADMIN
-- ============================================
-- Après avoir créé un compte via l'interface Auth de Supabase,
-- exécuter cette requête en remplaçant l'UUID :
-- UPDATE profiles SET role = 'admin' WHERE email = 'votre-email-admin@gmail.com';
