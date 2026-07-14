import { View } from 'react-native';
import { isExpoGo } from '../lib/isExpoGo';

// Banner de anuncios (AdMob) para el pie de las pantallas principales de cada
// tab — nunca se monta en pantallas de escaneo/formularios/lectura de binder
// para no estorbar el flujo.
//
// No renderiza nada dentro de Expo Go (el módulo nativo de AdMob no existe
// ahí) — require() en vez de import estático para no cargar ese paquete en
// absoluto cuando corre en Expo Go.
export default function AdBanner() {
  if (isExpoGo) return null;

  const { BannerAd, BannerAdSize, TestIds } = require('react-native-google-mobile-ads');

  // __DEV__ fuerza SIEMPRE el ad unit de prueba de Google mientras
  // desarrollas — Google no sirve (o penaliza) anuncios reales a
  // dispositivos de desarrollador no registrados, justo para evitar
  // tráfico inválido / clics accidentales del propio dev. El ID real
  // (EXPO_PUBLIC_ADMOB_BANNER_ID) solo se usa en un build de producción.
  const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TestIds.BANNER;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => console.log('[AdBanner] ad loaded ✅')}
        onAdFailedToLoad={(err) => console.log('[AdBanner] failed to load ❌', err)}
      />
    </View>
  );
}
