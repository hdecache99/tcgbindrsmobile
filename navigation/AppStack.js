import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DesktopScreen from '../screens/DesktopScreen';
import BindersListScreen from '../screens/binders/BindersListScreen';
import CreateBinderScreen from '../screens/binders/CreateBinderScreen';
import BinderDetailScreen from '../screens/binders/BinderDetailScreen';
import CardSearchScreen from '../screens/binders/CardSearchScreen';
import CardScannerScreen from '../screens/binders/CardScannerScreen';
import CardDetailScreen from '../screens/binders/CardDetailScreen';
import UserProfileScreen from '../screens/binders/UserProfileScreen';
import BinderSettingsScreen from '../screens/binders/BinderSettingsScreen';
import BinderExportScreen from '../screens/binders/BinderExportScreen';
import FeedScreen from '../screens/binders/FeedScreen';
import QuickScanScreen from '../screens/binders/QuickScanScreen';
import NewsScreen from '../screens/binders/NewsScreen';
import SalesScreen from '../screens/SalesScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

// Reemplaza AppTabs: un solo stack plano con el escritorio como pantalla
// inicial, en vez de 6 tabs cada uno con su propio stack duplicando
// BinderDetail/CardDetail/UserProfile/etc. Los muebles del escritorio hacen
// scroll a secciones de la misma pantalla (ver DesktopScreen), y las tarjetas
// de binder navegan directo a estas pantallas hermanas.
export default function AppStack() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      initialRouteName="Desktop"
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.bold, color: colors.foreground },
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Desktop" component={DesktopScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BindersList" component={BindersListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateBinder" component={CreateBinderScreen} options={{ title: 'Nuevo binder' }} />
      <Stack.Screen name="BinderDetail" component={BinderDetailScreen} />
      <Stack.Screen name="CardSearch" component={CardSearchScreen} options={{ title: 'Agregar carta' }} />
      <Stack.Screen name="CardScanner" component={CardScannerScreen} options={{ title: 'Escanear cartas' }} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="BinderSettings" component={BinderSettingsScreen} options={{ title: 'Configurar binder' }} />
      <Stack.Screen name="BinderExport" component={BinderExportScreen} options={{ title: 'Exportar binder' }} />
      <Stack.Screen name="DiscoverList" component={FeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="QuickScanMain" component={QuickScanScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewsList" component={NewsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalesMain" component={SalesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
