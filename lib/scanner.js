import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No hay sesión activa — cierra sesión y vuelve a entrar, luego intenta escanear de nuevo.');
  }
  return `Bearer ${session.access_token}`;
}

// Escanea una foto (puede tener varias cartas, ej. una página de binder) usando
// el mismo pipeline de IA (OpenRouter/Gemini) que ya corre en tu web — el móvil
// solo sube la imagen, todo el reconocimiento pasa en el servidor.
export async function scanCards(imageUri) {
  const formData = new FormData();
  formData.append('images', {
    uri: imageUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  });

  const res = await fetch(`${API_BASE_URL}/api/scan-cards`, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: formData,
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.error || 'Error al escanear la imagen.');
    err.status = res.status;
    err.details = json;
    throw err;
  }

  return json;
}

// Escaneo rápido de UNA sola carta — solo para consultar su precio de mercado
// al instante (sin agregarla a ningún binder). El endpoint responde en NDJSON
// (una línea por mensaje: 'detection' primero, luego 'result' con precios) porque
// la web lo consume en streaming; React Native no soporta leer el body como
// stream de forma confiable, así que acá se espera la respuesta completa y se
// parsean las líneas de una — se pierde el efecto progresivo pero el resultado
// final es idéntico.
export async function quickScanCard(imageUri) {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  });

  const res = await fetch(`${API_BASE_URL}/api/quick-scan`, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: formData,
  });

  const text = await res.text();

  if (!res.ok) {
    let message = 'Error al escanear la imagen.';
    try {
      message = JSON.parse(text).error || message;
    } catch {
      // texto de error no era JSON — se queda con el mensaje genérico
    }
    throw new Error(message);
  }

  let detection = null;
  let result = null;

  for (const line of text.split('\n').filter(Boolean)) {
    const msg = JSON.parse(line);
    if (msg.type === 'error') throw new Error(msg.error);
    if (msg.type === 'detection') detection = msg.detection;
    if (msg.type === 'result') result = msg;
  }

  if (!result) throw new Error('No se pudo procesar la carta.');

  return { detection, ...result };
}
