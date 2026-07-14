import { isExpoGo } from './isExpoGo';

// AdMob/ATT son módulos nativos (config plugin) que no existen dentro de
// Expo Go — solo en un dev client/build propio ya compilado con ese código
// nativo. require() en vez de import estático para que ni siquiera se
// evalúen esos paquetes cuando corre en Expo Go (un import estático los
// cargaría siempre, aunque después no se llamen, y eso sí truena).

// Se corre una sola vez al abrir la app, antes de mostrar cualquier anuncio:
// 1) En iOS pide el permiso de App Tracking Transparency (obligatorio desde
//    iOS 14.5 para poder usar el IDFA en anuncios) — en Android/iOS viejo esto
//    resuelve solo como concedido, no hace falta chequear plataforma.
// 2) Junta el consentimiento GDPR/UK/California vía el formulario de Google
//    (UMP) — solo aparece donde la ley lo exige, en el resto de países no se
//    muestra nada.
// 3) Solo inicializa el SDK de anuncios (y por lo tanto empieza a pedir
//    anuncios) una vez que el consentimiento quedó resuelto.
export async function initializeAds() {
  if (isExpoGo) return { canRequestAds: false };

  const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
  const mobileAds = require('react-native-google-mobile-ads');
  const { AdsConsent } = mobileAds;

  await requestTrackingPermissionsAsync();

  await AdsConsent.requestInfoUpdate();
  const consentInfo = await AdsConsent.loadAndShowConsentFormIfRequired();

  if (consentInfo.canRequestAds) {
    await mobileAds.default().initialize();
  }

  return consentInfo;
}

// Botón de "opciones de privacidad" en Ajustes — Google exige dar una forma
// de que el usuario pueda revisar/cambiar su elección de consentimiento
// después del primer arranque, no solo una vez.
export async function showPrivacyOptionsForm() {
  if (isExpoGo) return false;

  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = require('react-native-google-mobile-ads');
  const consentInfo = await AdsConsent.getConsentInfo();
  if (consentInfo.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED) {
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  }
  return false;
}
