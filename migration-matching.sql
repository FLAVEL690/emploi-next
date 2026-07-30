-- ============================================
-- MIGRATION: Ajout des champs pour le matching
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Ajouter les champs de matching aux profils candidats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_types TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', '')) DEFAULT '';

-- Ajouter les compétences aux offres d'emploi
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
