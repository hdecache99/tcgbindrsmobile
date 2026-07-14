import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Requerido por Google Play / App Store: borra la cuenta y todos sus datos
// de forma permanente (llama al mismo endpoint que usa la web). Mobile no
// puede correr server actions de Next.js directo, así que pasa por la API
// con el token de la sesión — igual que scanCards/moderateAvatar.
export async function deleteAccount() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No hay sesión activa.');
  }

  const res = await fetch(`${API_BASE_URL}/api/account/delete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'No se pudo eliminar la cuenta.');
  }

  await supabase.auth.signOut();
}
