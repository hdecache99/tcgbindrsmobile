import { supabase } from './supabase';

export async function reportUser(reportedUserId, reason, details) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay sesión activa.');

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason,
    details: details?.trim() || null,
  });

  if (error) throw error;
}
