import { supabase } from './supabase';

// ============ AUTH ============

export async function signUp({ email, password, firstName, lastName, role, company, phone, city, country }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        first_name: firstName,
        last_name: lastName,
        role,
        company: company || null,
        phone: phone || null,
        city: city || null,
        country: country || null
      }
    }
  });
  if (error) throw error;
  if (data.user && !data.session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError) return signInData;
  }
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const fileName = `avatar_${userId}_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ============ JOBS ============

export async function getJobs({ category, city, country, district, mode, type, search, page = 1, limit = 12 } = {}) {
  let query = supabase
    .from('jobs')
    .select('*, profiles!jobs_recruiter_id_fkey(first_name, last_name, avatar)', { count: 'exact' })
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);
  if (city) query = query.ilike('city', `%${city}%`);
  if (country) query = query.ilike('country', `%${country}%`);
  if (district) query = query.ilike('district', `%${district}%`);
  if (mode) query = query.eq('mode', mode);
  if (type) query = query.eq('type', type);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company.ilike.%${search}%`);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { jobs: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) };
}

export async function getJobById(id) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, profiles!jobs_recruiter_id_fkey(first_name, last_name, company, avatar, company_description, website, linkedin, facebook, twitter)')
    .eq('id', id)
    .single();
  if (error) throw error;

  const viewedKey = `job_viewed_${id}`;
  if (!sessionStorage.getItem(viewedKey)) {
    sessionStorage.setItem(viewedKey, '1');
    supabase.rpc('increment_job_views', { job_id: id }).catch(() => { });
  }

  return data;
}

export async function getMyJobs(userId) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, applications(count)')
    .eq('recruiter_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(j => ({ ...j, applicationCount: j.applications?.[0]?.count || 0 }));
}

export async function createJob(jobData, userId, company) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      recruiter_id: userId,
      title: jobData.title,
      description: jobData.description,
      company: company || jobData.company || 'NexJob',
      category: jobData.category,
      type: jobData.type,
      mode: jobData.mode,
      salary: jobData.salary || null,
      country: jobData.country,
      city: jobData.city,
      district: jobData.district || null,
      requirements: jobData.requirements || null,
      benefits: jobData.benefits || null,
      experience_level: jobData.experienceLevel || 'any',
      expires_at: jobData.expiresAt,
      skills: jobData.skills || [],
      require_cv: jobData.requireCv ?? true,
      require_cover_letter: jobData.requireCoverLetter ?? false,
      other_documents: jobData.otherDocuments || null,
      application_method: 'platform',
      whatsapp_number: null,
      contact_email: null
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJob(id, updates) {
  const { data, error } = await supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJob(id) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw error;
}

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getJobStats() {
  const now = new Date().toISOString();
  const [jobsRes, companiesRes, candidatesRes, interviewRes] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('expires_at', now),
    supabase.from('jobs').select('company').eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
    supabase.rpc('get_platform_interview_count')
  ]);
  const uniqueCompanies = new Set((companiesRes.data || []).map(j => j.company)).size;
  return {
    jobs: jobsRes.count || 0,
    companies: uniqueCompanies,
    candidates: candidatesRes.count || 0,
    inInterview: interviewRes.data || 0
  };
}

// ============ APPLICATIONS ============

export async function applyToJob(jobId, candidateId, coverLetter) {
  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, candidate_id: candidateId, cover_letter: coverLetter || null })
    .select()
    .single();
  if (error) throw error;

  const { data: job } = await supabase.from('jobs').select('title, recruiter_id').eq('id', jobId).single();
  const { data: candidate } = await supabase.from('profiles').select('first_name, last_name').eq('id', candidateId).single();

  if (job) {
    await supabase.from('notifications').insert({
      user_id: job.recruiter_id,
      type: 'new_application',
      message: `Nouvelle candidature pour "${job.title}" de ${candidate?.first_name} ${candidate?.last_name}`,
      related_id: jobId
    });
  }

  return data;
}

export async function getMyApplications(candidateId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(title, company, city, country, type, mode, recruiter_id)')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(a => ({ ...a, ...a.jobs, jobs: undefined }));
}

export async function getJobApplications(jobId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles!applications_candidate_id_fkey(first_name, last_name, email, phone, city, country, bio, cv, avatar, skills, preferred_categories, preferred_types, experience_level)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(a => ({ ...a, ...a.profiles, profiles: undefined }));
}

export async function updateApplicationStatus(applicationId, status) {
  const { error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  if (error) throw error;

  const { data: app } = await supabase
    .from('applications')
    .select('candidate_id, job_id, jobs(title)')
    .eq('id', applicationId)
    .single();

  if (app) {
    const statusMessages = {
      reviewed: 'a été consultée',
      shortlisted: 'a été présélectionnée',
      rejected: "n'a pas été retenue",
      accepted: 'a été acceptée'
    };
    if (statusMessages[status]) {
      await supabase.from('notifications').insert({
        user_id: app.candidate_id,
        type: 'application_update',
        message: `Votre candidature pour "${app.jobs?.title}" ${statusMessages[status]}`,
        related_id: app.job_id
      });
    }
  }
}

// ============ SAVED JOBS ============

export async function toggleSaveJob(userId, jobId) {
  const { data: existing } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single();

  if (existing) {
    await supabase.from('saved_jobs').delete().eq('id', existing.id);
    return { saved: false };
  } else {
    await supabase.from('saved_jobs').insert({ user_id: userId, job_id: jobId });
    return { saved: true };
  }
}

export async function getSavedJobs(userId) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(s => ({ ...s.jobs, savedAt: s.created_at }));
}

export async function checkJobSaved(userId, jobId) {
  const { data } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single();
  return !!data;
}

// ============ NOTIFICATIONS ============

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

// ============ ADMIN ============

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteUser(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

export async function getAllJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, profiles!jobs_recruiter_id_fkey(first_name, company), applications(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(j => ({
    ...j,
    recruiterName: j.profiles?.first_name,
    appCount: j.applications?.[0]?.count || 0,
    profiles: undefined,
    applications: undefined
  }));
}

export async function getAllApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select(`*,
      jobs!applications_job_id_fkey(title, company, recruiter_id, profiles!jobs_recruiter_id_fkey(first_name)),
      profiles!applications_candidate_id_fkey(first_name, last_name, email, phone, city, country, bio, cv, avatar, skills, preferred_categories, preferred_types, experience_level)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(a => ({
    ...a,
    jobTitle: a.jobs?.title,
    company: a.jobs?.company,
    recruiterName: a.jobs?.profiles?.first_name,
    jobs: undefined,
    profiles: undefined
  }));
}

export async function getAllCandidates() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'candidate')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getInterviewCandidateCount() {
  const { data: apps } = await supabase.from('applications').select('candidate_id, job_id');
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, job_id, candidate_id');
  if (!conversations || conversations.length === 0) return 0;

  const convIds = conversations.map(c => c.id);
  const { data: msgs } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convIds);

  const convWithMsg = new Set((msgs || []).map(m => m.conversation_id));
  const interviewPairs = new Set(
    conversations
      .filter(c => convWithMsg.has(c.id))
      .map(c => `${c.job_id}:${c.candidate_id}`)
  );
  const inInterview = new Set(
    (apps || [])
      .filter(a => interviewPairs.has(`${a.job_id}:${a.candidate_id}`))
      .map(a => a.candidate_id)
  );
  return inInterview.size;
}

export async function getAdminStats() {
  const now = new Date().toISOString();
  const [users, recruiters, candidates, jobs, activeJobs, apps, ads, appStatuses] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recruiter'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true).gt('expires_at', now),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('advertisements').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('applications').select('status')
  ]);

  const statuses = appStatuses.data || [];
  const totalStatused = statuses.length;
  const acceptedCount = statuses.filter(a => a.status === 'accepted').length;
  const rejectedCount = statuses.filter(a => a.status === 'rejected').length;

  return {
    totalUsers: users.count || 0,
    recruiters: recruiters.count || 0,
    candidates: candidates.count || 0,
    totalJobs: jobs.count || 0,
    activeJobs: activeJobs.count || 0,
    applications: apps.count || 0,
    activeAds: ads.count || 0,
    inInterview: await getInterviewCandidateCount(),
    acceptedCount,
    rejectedCount,
    acceptedPct: totalStatused ? Math.round((acceptedCount / totalStatused) * 100) : 0,
    rejectedPct: totalStatused ? Math.round((rejectedCount / totalStatused) * 100) : 0
  };
}

// ============ ADVERTISEMENTS ============

export async function getPublicAds() {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return data || [];
}

export async function getAdminAds() {
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadAdMedia(file) {
  const ext = file.name.split('.').pop();
  const fileName = `ad_${Date.now()}_${Math.round(Math.random() * 1000)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('ads')
    .upload(fileName, file, { contentType: file.type });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('ads').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function createAd({ title, mediaUrl, mediaType, mobileMediaUrl, linkUrl, position }) {
  const { data, error } = await supabase
    .from('advertisements')
    .insert({ title, media_url: mediaUrl, media_type: mediaType, mobile_media_url: mobileMediaUrl || null, link_url: linkUrl || null, position: position || 'banner' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAd(id, updates) {
  const { error } = await supabase
    .from('advertisements')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAd(id) {
  const { data: ad } = await supabase.from('advertisements').select('media_url').eq('id', id).single();
  if (ad?.media_url) {
    const path = ad.media_url.split('/ads/')[1];
    if (path) await supabase.storage.from('ads').remove([path]);
  }
  const { error } = await supabase.from('advertisements').delete().eq('id', id);
  if (error) throw error;
}

// ============ MESSAGERIE (CHAT) ============

export async function getOrCreateConversation(jobId, candidateId, recruiterId) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('job_id', jobId)
    .eq('candidate_id', candidateId)
    .single();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ job_id: jobId, candidate_id: candidateId, recruiter_id: recruiterId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversationById(id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      job:jobs!conversations_job_id_fkey(id, title, company, require_cv, require_cover_letter, other_documents),
      candidate:profiles!conversations_candidate_id_fkey(first_name, last_name, avatar),
      recruiter:profiles!conversations_recruiter_id_fkey(first_name, last_name, company, avatar)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getConversationsForUser(userId) {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select(`
      *,
      job:jobs!conversations_job_id_fkey(id, title, company, require_cv, require_cover_letter, other_documents),
      candidate:profiles!conversations_candidate_id_fkey(first_name, last_name, avatar),
      recruiter:profiles!conversations_recruiter_id_fkey(first_name, last_name, company, avatar)
    `)
    .or(`candidate_id.eq.${userId},recruiter_id.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  const list = convs || [];
  if (list.length === 0) return list;

  const ids = list.map(c => c.id);
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, is_read')
    .in('conversation_id', ids)
    .order('created_at', { ascending: true });

  const byConv = {};
  (msgs || []).forEach(m => {
    if (!byConv[m.conversation_id]) byConv[m.conversation_id] = [];
    byConv[m.conversation_id].push(m);
  });

  return list.map(c => {
    const convMessages = byConv[c.id] || [];
    return {
      ...c,
      lastMessage: convMessages[convMessages.length - 1] || null,
      unreadCount: convMessages.filter(m => m.sender_id !== userId && !m.is_read).length
    };
  });
}

export async function getMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(conversationId, senderId, content, attachments = []) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || null,
      attachments: attachments || []
    })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Notification pour le destinataire (déclenche l'email via le trigger)
  const { data: conv } = await supabase
    .from('conversations')
    .select('job_id, candidate_id, recruiter_id')
    .eq('id', conversationId)
    .single();

  if (conv) {
    const recipientId = conv.candidate_id === senderId ? conv.recruiter_id : conv.candidate_id;
    const { data: job } = await supabase.from('jobs').select('title').eq('id', conv.job_id).single();
    const { data: sender } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', senderId)
      .single();
    const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ') || 'Un utilisateur';
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      message: `Nouveau message de ${senderName} concernant "${job?.title || 'votre offre'}"`,
      related_id: conversationId
    });
  }

  return data;
}

export async function markConversationRead(conversationId, userId) {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
}

export async function uploadChatDocument(file) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const fileName = `doc_${Date.now()}_${Math.round(Math.random() * 1000)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('chat-documents')
    .upload(fileName, file, { contentType: file.type || 'application/octet-stream' });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from('chat-documents').getPublicUrl(data.path);
  return { path: data.path, url: urlData.publicUrl };
}

// ============ NOTIFICATIONS PUSH WEB ============

function encodeKey(arrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

export async function savePushSubscription(subscription) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: encodeKey(subscription.getKey('p256dh')),
      auth: encodeKey(subscription.getKey('auth')),
      user_agent: navigator.userAgent
    }, { onConflict: 'endpoint' });
  if (error) throw error;
}

export async function deletePushSubscription(endpoint) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);
  if (error) throw error;
}
