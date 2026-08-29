// ============================================
// Edge Function : push-notify
// Envoie une notification push web (Web Push API)
// à tous les appareils abonnés d'un utilisateur
// lorsqu'une notification est créée (nouveau message,
// offre matching >= 60%, nouvelle candidature, ...).
// L'utilisateur clique sur la notification pour ouvrir
// la page concernée sur le site web.
// Appelée par le trigger SQL "send_push_notification"
// (voir migration-push.sql) via pg_net.
//
// Déployer avec le CLI Supabase :
//   supabase functions deploy push-notify --no-verify-jwt
//
// Secrets à configurer (Dashboard > Edge Functions > Secrets) :
//   VAPID_PUBLIC_KEY : clé publique VAPID (générée avec
//                      `npx web-push generate-vapid-keys`,
//                      identique à celle de client/src/services/push.js)
//   VAPID_PRIVATE_KEY : clé privée VAPID (jamais côté client)
//   VAPID_SUBJECT (optionnel) : mailto: ou URL, ex. mailto:noreply@nexadigic.cm
//   SITE_URL (optionnel)      : URL du site
//   NOTIFY_SECRET             : secret partagé, identique à celui
//                               défini dans migration-push.sql
// ============================================

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-notify-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const NOTIFY_SECRET = Deno.env.get('NOTIFY_SECRET') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@nexadigic.cm';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://nexjoob.nexadigic.cm';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
);

function notificationUrl(notif, role) {
  switch (notif.type) {
    case 'new_message':
      return `${SITE_URL}/${role === 'recruiter' ? 'recruiter' : 'candidate'}/chat/${notif.related_id || ''}`;
    case 'job_match':
      return `${SITE_URL}/jobs/${notif.related_id || ''}`;
    case 'candidates_match':
      return `${SITE_URL}/recruiter/jobs/${notif.related_id || ''}/matching`;
    case 'new_application':
      return role === 'recruiter'
        ? `${SITE_URL}/recruiter/jobs/${notif.related_id || ''}`
        : `${SITE_URL}/jobs/${notif.related_id || ''}`;
    case 'application_update':
      return `${SITE_URL}/jobs/${notif.related_id || ''}`;
    default:
      return `${SITE_URL}/notifications`;
  }
}

function notificationTitle(type) {
  switch (type) {
    case 'new_message': return 'Nouveau message';
    case 'job_match': return 'Une offre vous correspond';
    case 'candidates_match': return 'Candidats potentiels';
    case 'new_application': return 'Nouvelle candidature';
    case 'application_update': return 'Mise à jour de candidature';
    default: return 'nexjoob';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  if (req.headers.get('x-notify-secret') !== NOTIFY_SECRET) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    // corps invalide
  }
  if (!payload.notificationId) {
    return new Response('Missing notificationId', { status: 400, headers: corsHeaders });
  }

  const { data: notif, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', payload.notificationId)
    .single();
  if (error || !notif) {
    return new Response('Notification not found', { status: 404, headers: corsHeaders });
  }

  const { data: recipient } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', notif.user_id)
    .single();
  const role = recipient?.role || 'candidate';

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', notif.user_id);
  if (subError) {
    return new Response('Error loading subscriptions', { status: 500, headers: corsHeaders });
  }
  if (!subscriptions || subscriptions.length === 0) {
    return new Response('No subscriptions', { status: 200, headers: corsHeaders });
  }

  const pushPayload = JSON.stringify({
    title: notificationTitle(notif.type),
    body: notif.message || 'Une nouvelle notification vous attend sur nexjoob.',
    url: notificationUrl(notif, role),
  });

  let sent = 0;
  for (const sub of subscriptions) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(subscription, pushPayload);
      sent += 1;
    } catch (err) {
      // Abonnement expiré ou invalide -> suppression
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200, headers: corsHeaders });
});
