import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Necesario para que el navegador in-app se cierre solo al volver a la app
// tras el login (recomendado por la doc de expo-web-browser).
WebBrowser.maybeCompleteAuthSession();

// `Linking.createURL` arma la URL correcta según el entorno: el esquema
// personalizado (tcgbindrsmobile://auth-callback) en un build nativo, o la
// URL de proxy de Expo Go durante desarrollo. Esta URL EXACTA debe estar
// agregada en Supabase > Authentication > URL Configuration > Redirect URLs
// (además de la que ya usa la web) o el redirect fallará.
const redirectTo = Linking.createURL('auth-callback');

// Mismo criterio que usa la web (src/app/auth/callback/route.ts) para
// distinguir "ya existe una cuenta con este correo por otro método" de un
// error genérico — Supabase no da un código de error dedicado para esto,
// solo un mensaje en inglés que contiene alguna de estas palabras.
function friendlyAuthError(rawMessage) {
  const lower = (rawMessage || '').toLowerCase();
  const isProviderConflict =
    lower.includes('provider') || lower.includes('identity') || lower.includes('already');

  if (isProviderConflict) {
    return 'Ya existe una cuenta con este correo usando otro método de inicio de sesión. Inicia sesión con ese método original (email/contraseña u otro proveedor).';
  }
  return rawMessage;
}

export async function signInWithOAuth(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    // El usuario canceló o cerró el navegador — no es un error a mostrar.
    return null;
  }

  // El código (o un error de Supabase/el proveedor) puede venir como query
  // (`?code=...`) o como fragmento (`#code=...`), según el proveedor —
  // revisamos ambos en vez de asumir uno solo.
  const url = new URL(result.url);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const getParam = (key) => url.searchParams.get(key) || hashParams.get(key);

  const oauthError = getParam('error_description') || getParam('error');
  if (oauthError) throw new Error(friendlyAuthError(decodeURIComponent(oauthError)));

  const code = getParam('code');
  if (!code) throw new Error(`No se recibió el código de autenticación. URL: ${result.url}`);

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw new Error(friendlyAuthError(exchangeError.message));
  return sessionData.session;
}
