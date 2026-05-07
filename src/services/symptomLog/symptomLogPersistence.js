import { getSupabaseBrowserClient } from '../../lib/supabase.js';

async function getCurrentUserId(supabase) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Sign in again to save symptom logs.');
  return userId;
}

export async function createSymptomLog(childId, conversationId = null) {
  const supabase = getSupabaseBrowserClient();
  const profileId = await getCurrentUserId(supabase);

  const { data, error } = await supabase
    .from('symptom_logs')
    .insert({
      profile_id: profileId,
      child_id: childId,
      conversation_id: conversationId,
      status: 'in_progress',
    })
    .select('id, status, started_at')
    .single();

  if (error) throw error;
  return data;
}

export async function completeSymptomLog(logId, { summary, summaryText, chiefComplaint }) {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('symptom_logs')
    .update({
      status: 'complete',
      summary,
      summary_text: summaryText,
      chief_complaint: chiefComplaint,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId)
    .select('id, status, completed_at, summary, chief_complaint')
    .single();

  if (error) throw error;
  return data;
}

export async function abandonSymptomLog(logId) {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from('symptom_logs')
    .update({ status: 'abandoned' })
    .eq('id', logId);

  if (error) throw error;
}

export async function loadSymptomLogs(childId = null, limit = 20) {
  const supabase = getSupabaseBrowserClient();
  const profileId = await getCurrentUserId(supabase);

  let query = supabase
    .from('symptom_logs')
    .select('id, child_id, status, chief_complaint, summary, started_at, completed_at')
    .eq('profile_id', profileId)
    .in('status', ['complete', 'in_progress'])
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (childId) {
    query = query.eq('child_id', childId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function loadSymptomLog(logId) {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSymptomLogConversation(logId, conversationId) {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from('symptom_logs')
    .update({ conversation_id: conversationId })
    .eq('id', logId);

  if (error) throw error;
}
