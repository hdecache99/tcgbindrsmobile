// Deep links desde el esquema propio de la app (no Universal/App Links —
// esos requieren hospedar archivos de verificación + datos de firma que no
// tenemos configurados). La web muestra un botón "Abrir en la app" que
// enlaza a tcgbindrsmobile://b/{id} o tcgbindrsmobile://u/{username}; si la
// app está instalada, el OS la abre y React Navigation resuelve la ruta de
// acá — si no está instalada, el toque simplemente no hace nada visible
// (tradeoff aceptado de un esquema propio sin Universal Links).
export const linking = {
  prefixes: ['tcgbindrsmobile://'],
  config: {
    screens: {
      Binders: {
        screens: {
          BinderDetail: 'b/:binderId',
        },
      },
      Feed: {
        screens: {
          UserProfile: 'u/:username',
        },
      },
    },
  },
};
