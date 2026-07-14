import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BindersListScreen from '../screens/binders/BindersListScreen';
import CreateBinderScreen from '../screens/binders/CreateBinderScreen';
import BinderDetailScreen from '../screens/binders/BinderDetailScreen';
import CardSearchScreen from '../screens/binders/CardSearchScreen';
import CardScannerScreen from '../screens/binders/CardScannerScreen';
import CardDetailScreen from '../screens/binders/CardDetailScreen';
import UserProfileScreen from '../screens/binders/UserProfileScreen';
import BinderSettingsScreen from '../screens/binders/BinderSettingsScreen';
import BinderExportScreen from '../screens/binders/BinderExportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

export default function BindersStack() {
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
      <Stack.Screen name="BindersList" component={BindersListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateBinder" component={CreateBinderScreen} options={{ title: 'Nuevo binder' }} />
      <Stack.Screen name="BinderDetail" component={BinderDetailScreen} />
      <Stack.Screen name="CardSearch" component={CardSearchScreen} options={{ title: 'Agregar carta' }} />
      <Stack.Screen name="CardScanner" component={CardScannerScreen} options={{ title: 'Escanear cartas' }} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="BinderSettings" component={BinderSettingsScreen} options={{ title: 'Configurar binder' }} />
      <Stack.Screen name="BinderExport" component={BinderExportScreen} options={{ title: 'Exportar binder' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
