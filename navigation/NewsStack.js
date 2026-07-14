import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewsScreen from '../screens/binders/NewsScreen';
import CardScannerScreen from '../screens/binders/CardScannerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

export default function NewsStack() {
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
      <Stack.Screen name="NewsList" component={NewsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CardScanner" component={CardScannerScreen} options={{ title: 'Escanear cartas' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
