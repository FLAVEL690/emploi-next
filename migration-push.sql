-- ============================================
-- MIGRATION: Notifications push web (Web Push)
--
-- Envoie une notification push (même si l'utilisateur
-- n'est pas sur l'application) lorsqu'une notification
-- est créée : nouveau message, offre matching >= 60%,
-- nouvelle candidature, mise à jour de candidature.
-- L'utilisateur clique sur la notification pour ouvrir
-- la page concernée sur le site web (téléphone ou PC).
--
-- Prérequis :
--  1. Créer l'Edge Function "push-notify" avec le code
--     de supabase/functions/push-notify/index.ts
--  2. Configurer les secrets de la fonction :
--       VAPID_PUBLIC_KEY : clé publique VAPID (la même que
--                          celle dans client/src/services/push.js)
--       VAPID_PRIVATE_KEY : clé privée VAPID
--       VAPID_SUBJECT (optionnel) : mailto: ou https://
--       SITE_URL (optionnel)      : URL du site
--       NOTIFY_SECRET : le MÊME secret que NOTIFY_SECRET ci-dessous
--  3. Remplacez NOTIFY_SECRET et <PROJECT_REF> ci-dessous
-- Exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Nettoyage de l'ancien système d'email (si migration-email.sql
-- a déjà été exécutée auparavant)
DROP TRIGGER IF EXISTS trg_send_notification_email ON notifications;
DROP FUNCTION IF EXISTS public.send_notification_email();

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- TABLE DES ABONNEMENTS PUSH
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FONCTION + TRIGGER D'ENVOI PUSH
-- ============================================

CREATE OR REPLACE FUNCTION public.send_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_name TEXT;
  function_url TEXT;
  notify_secret TEXT := '8f4c9a7e2d6b1a5c3e8f0d7b9a2c4e6f'; -- Remplacez par votre secret
BEGIN
  -- Résolution du host (URL de l'Edge Function)
  BEGIN
    host_name := NULLIF(current_setting('request.headers', true), '')::jsonb ->> 'host';
  EXCEPTION WHEN OTHERS THEN
    host_name := NULL;
  END;

  IF host_name IS NULL THEN
    BEGIN
      host_name := split_part(NULLIF(current_setting('request.jwt.claim.iss', true), ''), '/', 3);
    EXCEPTION WHEN OTHERS THEN
      host_name := NULL;
    END;
  END IF;

  IF host_name IS NULL THEN
    host_name := 'xkngygqflmkxiqtmxcnv.supabase.co'; -- Remplacez par la référence de votre projet
  END IF;

  function_url := 'https://' || host_name || '/functions/v1/push-notify';

  -- Appel asynchrone de l'Edge Function (ne bloque pas l'insertion)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', notify_secret
    ),
    body := jsonb_build_object('notificationId', NEW.id),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_send_push_notification ON notifications;
CREATE TRIGGER trg_send_push_notification
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_push_notification();
