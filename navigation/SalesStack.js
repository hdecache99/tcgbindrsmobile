import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SalesScreen from '../screens/SalesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

export default function SalesStack() {
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
      <Stack.Screen name="SalesMain" component={SalesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
