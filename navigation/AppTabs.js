import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import BindersStack from './BindersStack';
import DiscoverStack from './DiscoverStack';
import QuickScanStack from './QuickScanStack';
import NewsStack from './NewsStack';
import SalesStack from './SalesStack';
import ProfileStack from './ProfileStack';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';

const Tab = createBottomTabNavigator();

const ICONS = {
  Binders: 'albums',
  Feed: 'compass',
  Escanear: 'scan',
  Noticias: 'newspaper',
  Ventas: 'cash',
  Perfil: 'person-circle',
};

export default function AppTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Binders" component={BindersStack} options={{ tabBarLabel: t('tab_binders') }} />
      <Tab.Screen name="Feed" component={DiscoverStack} options={{ tabBarLabel: t('tab_feed') }} />
      <Tab.Screen name="Escanear" component={QuickScanStack} options={{ tabBarLabel: t('menu_scan') }} />
      <Tab.Screen name="Noticias" component={NewsStack} options={{ tabBarLabel: t('feed_news') }} />
      <Tab.Screen name="Ventas" component={SalesStack} options={{ tabBarLabel: t('tab_sales') }} />
      <Tab.Screen name="Perfil" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
    </Tab.Navigator>
  );
}
