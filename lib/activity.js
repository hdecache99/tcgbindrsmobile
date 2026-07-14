import { supabase } from './supabase';

export async function logActivity(actionType, metadata = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('activity_log')
    .insert({ user_id: user.id, action_type: actionType, metadata });

  if (error) console.error('Error logging activity:', error.message);
}

export async function getActivityFeed(limit = 20) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let followingIds = [];
  const { data: following, error: followErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!followErr) followingIds = following?.map((f) => f.following_id) ?? [];

  const targetIds = [...new Set([...followingIds, user.id])];

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, user_id, action_type, metadata, created_at, user:profiles(username, display_name, avatar_url)')
    .in('user_id', targetIds)
    .gte('created_at', threeDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity feed:', error.message);
    return [];
  }

  return data ?? [];
}
