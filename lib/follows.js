import { supabase } from './supabase';
import { logActivity } from './activity';

export async function followUser(followingId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === followingId) return;

  const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: followingId });
  if (error) throw error;

  const { data: followedProfile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', followingId)
    .maybeSingle();

  await logActivity('follow_user', {
    following_id: followingId,
    following_username: followedProfile?.username ?? null,
    following_display_name: followedProfile?.display_name ?? null,
  });
}

export async function unfollowUser(followingId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function isFollowing(followingId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle();

  return !!data;
}
