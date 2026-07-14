import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { getUserBinders } from '../../lib/binders';
import BinderGridTile from '../../components/binders/BinderGridTile';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import AppHeader from '../../components/AppHeader';
import AdBanner from '../../components/AdBanner';
import { useTheme } from '../../lib/ThemeContext';

export default function BindersListScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [binders, setBinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await getUserBinders();
    setBinders(data);
  }

  // useFocusEffect corre cada vez que esta pantalla vuelve a tener foco
  // (ej. al volver de CreateBinder), a diferencia de useEffect que solo
  // corre una vez al montar.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <FlatList
        data={binders}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState message="Todavía no tienes binders." />}
        renderItem={({ item }) => (
          <BinderGridTile
            binder={item}
            onPress={() => navigation.navigate('BinderDetail', { binderId: item.id, title: item.title })}
          />
        )}
      />

      <Button
        title="Nuevo binder"
        icon="add-outline"
        onPress={() => navigation.navigate('CreateBinder')}
        style={styles.fab}
      />

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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  fab: {
    position: 'absolute',
    bottom: 68,
    left: 16,
    right: 16,
  },
  });
}
