import Constants, { ExecutionEnvironment } from 'expo-constants';

// AdMob y App Tracking Transparency son módulos nativos agregados vía config
// plugin — no existen dentro de Expo Go (solo en un dev client/build propio
// con el código nativo ya compilado). Sin este chequeo, la app truena al
// abrir dentro de Expo Go.
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
