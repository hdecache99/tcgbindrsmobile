import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/binders/FeedScreen';
import BinderDetailScreen from '../screens/binders/BinderDetailScreen';
import CardDetailScreen from '../screens/binders/CardDetailScreen';
import UserProfileScreen from '../screens/binders/UserProfileScreen';
import CardSearchScreen from '../screens/binders/CardSearchScreen';
import CardScannerScreen from '../screens/binders/CardScannerScreen';
import BinderSettingsScreen from '../screens/binders/BinderSettingsScreen';
import BinderExportScreen from '../screens/binders/BinderExportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

// Mismas pantallas de "acciones de binder" que BindersStack (menos
// BindersList/CreateBinder, que no aplican acá) — BinderDetailScreen se ve
// desde el Feed también cuando el binder es tuyo (isOwner=true, con FAB de
// editar), así que necesita poder navegar a las mismas rutas. `Settings` vive
// acá (no en ProfileStack) porque el menú hamburguesa se abre desde
// FeedScreen, que es la pantalla inicial de este stack.
export default function DiscoverStack() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.foreground },
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="DiscoverList" component={FeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BinderDetail" component={BinderDetailScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="CardSearch" component={CardSearchScreen} options={{ title: 'Agregar carta' }} />
      <Stack.Screen name="CardScanner" component={CardScannerScreen} options={{ title: 'Escanear cartas' }} />
      <Stack.Screen name="BinderSettings" component={BinderSettingsScreen} options={{ title: 'Configurar binder' }} />
      <Stack.Screen name="BinderExport" component={BinderExportScreen} options={{ title: 'Exportar binder' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
