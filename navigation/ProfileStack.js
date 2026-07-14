import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CardScannerScreen from '../screens/binders/CardScannerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
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
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
      <Stack.Screen name="CardScanner" component={CardScannerScreen} options={{ title: 'Escanear cartas' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
