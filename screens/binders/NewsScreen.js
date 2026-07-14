import { StyleSheet, View } from 'react-native';
import NewsList from '../../components/binders/NewsList';
import AppHeader from '../../components/AppHeader';
import AdBanner from '../../components/AdBanner';
import { useTheme } from '../../lib/ThemeContext';

export default function NewsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <NewsList />
      <AdBanner />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
}
