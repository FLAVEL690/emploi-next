-- ============================================
-- COMPTEUR DE VUES DES OFFRES
-- Tout visiteur (même non connecté) peut incrémenter
-- le compteur de vues d'une offre via cette fonction,
-- sans pour autant avoir le droit de modifier l'offre.
-- ============================================

DROP FUNCTION IF EXISTS public.increment_job_views(BIGINT);

CREATE OR REPLACE FUNCTION public.increment_job_views(job_id BIGINT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE jobs
  SET views = views + 1
  WHERE id = job_id
  RETURNING views;
$$;

REVOKE ALL ON FUNCTION public.increment_job_views(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_job_views(BIGINT) TO anon, authenticated, service_role;
