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
