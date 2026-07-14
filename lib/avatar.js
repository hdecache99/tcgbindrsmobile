import { File } from 'expo-file-system';
import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No hay sesión activa — cierra sesión y vuelve a entrar.');
  }
  return `Bearer ${session.access_token}`;
}

// Revisa la foto candidata con el mismo pipeline de IA (OpenRouter/Gemini) que
// ya corre en la web para el escaneo de cartas, antes de aceptarla como avatar.
export async function moderateAvatar(imageUri) {
  const formData = new FormData();
  formData.append('image', { uri: imageUri, name: 'avatar.jpg', type: 'image/jpeg' });

  const res = await fetch(`${API_BASE_URL}/api/moderate-avatar`, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo verificar la imagen.');
  return json; // { safe, reason }
}

// Sube la imagen ya aprobada directamente al bucket 'avatars' de Supabase
// Storage (RLS solo permite escribir dentro de la carpeta del propio usuario)
// y devuelve la URL pública con cache-bust para reflejar el cambio al toque.
export async function uploadAvatar(imageUri) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay sesión activa.');

  const file = new File(imageUri);
  const bytes = await file.bytes();
  const path = `${user.id}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);

  return `${publicUrl}?v=${Date.now()}`;
}
