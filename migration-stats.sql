-- ============================================
-- STATISTIQUES PLATEFORME (ADMIN)
-- L'admin doit pouvoir lire les conversations et
-- messages pour calculer les candidats "en entretien".
-- ============================================

DROP POLICY IF EXISTS "Admins see all conversations" ON conversations;
CREATE POLICY "Admins see all conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins see all messages" ON messages;
CREATE POLICY "Admins see all messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- ============================================
-- Comptage public "candidatures en entretien"
-- (candidat ayant postulé + au moins un message
-- dans la conversation liée). SECURITY DEFINER
-- pour permettre aux visiteurs anonymes de lire
-- le compteur sans exposer les données.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_platform_interview_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT a.candidate_id)
  FROM applications a
  JOIN conversations c
    ON c.job_id = a.job_id
   AND c.candidate_id = a.candidate_id
  WHERE EXISTS (
    SELECT 1 FROM messages m
    WHERE m.conversation_id = c.id
  );
$$;

REVOKE ALL ON FUNCTION public.get_platform_interview_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_interview_count() TO anon, authenticated, service_role;
