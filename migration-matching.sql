-- ============================================
-- MIGRATION: Ajout des champs pour le matching
-- et profil entreprise recruteur
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Ajouter les champs de matching aux profils candidats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_types TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT '';

-- Ajouter les champs entreprise aux profils recruteurs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter TEXT;

-- Ajouter les compétences aux offres d'emploi
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Mettre à jour la contrainte de type de contrat (ajouter CDD et CDI)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_type_check CHECK (type IN ('full-time', 'part-time', 'cdd', 'cdi', 'contract', 'internship', 'freelance'));
