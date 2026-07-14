import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuickScanScreen from '../screens/binders/QuickScanScreen';
import BinderDetailScreen from '../screens/binders/BinderDetailScreen';
import CardDetailScreen from '../screens/binders/CardDetailScreen';
import UserProfileScreen from '../screens/binders/UserProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Stack = createNativeStackNavigator();

export default function QuickScanStack() {
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
      <Stack.Screen name="QuickScanMain" component={QuickScanScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BinderDetail" component={BinderDetailScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings_title') }} />
    </Stack.Navigator>
  );
}
