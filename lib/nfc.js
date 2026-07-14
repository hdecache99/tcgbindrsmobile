import { isExpoGo } from './isExpoGo';

const BASE_URL = 'https://www.tcgbindrs.com';

// react-native-nfc-manager es un módulo nativo (config plugin) — no existe
// dentro de Expo Go. require() en vez de import estático para no cargarlo
// ahí en absoluto (mismo patrón que lib/ads.js con AdMob).

export async function isNfcSupported() {
  if (isExpoGo) return false;
  try {
    const NfcManager = require('react-native-nfc-manager').default;
    return await NfcManager.isSupported();
  } catch {
    return false;
  }
}

// Escribe la URL pública del binder en una etiqueta NFC física (registro
// NDEF tipo URI) — cualquier teléfono con NFC, tenga o no la app instalada,
// abre esa URL solo con acercarlo a la etiqueta. No hace falta código de
// "lectura" del lado de la app: eso lo maneja el sistema operativo solo.
export async function writeBinderToNfc(binderId) {
  if (isExpoGo) {
    throw new Error('NFC no está disponible en Expo Go — necesitas un build nativo de la app.');
  }

  const { default: NfcManager, NfcTech, Ndef } = require('react-native-nfc-manager');
  const url = `${BASE_URL}/b/${binderId}`;

  await NfcManager.requestTechnology(NfcTech.Ndef);
  try {
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
}
