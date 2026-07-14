import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// El FAB en sí queda siempre morado fijo (colors.primary) — es un control de
// la app, no algo que deba cambiar con el color de tema del binder (eso sí se
// aplica en el header/franja/botón de configurar, en BinderDetailScreen).
export default function SpeedDialFab({ actions }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open ? (
        <View style={styles.actionsList}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionButton}
              onPress={() => {
                setOpen(false);
                action.onPress();
              }}
            >
              <View style={styles.actionIconBadge}>
                <Ionicons name={action.icon} size={16} color="#fff" />
              </View>
              <Text style={styles.actionLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.mainButton} onPress={() => setOpen((o) => !o)}>
        {/* Cruz dibujada con geometría (no con el glifo "+"/"×" de texto) para que
            quede perfectamente centrada sin pelear con la métrica de la fuente. */}
        <View style={{ transform: [{ rotate: open ? '45deg' : '0deg' }] }}>
          <View style={styles.crossHorizontal} />
          <View style={styles.crossVertical} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'flex-end',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#fff',
    top: -1.5,
    left: -10,
  },
  crossVertical: {
    position: 'absolute',
    width: 3,
    height: 20,
    borderRadius: 1.5,
    backgroundColor: '#fff',
    top: -10,
    left: -1.5,
  },
  actionsList: {
    marginBottom: spacing.sm,
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 190,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionLabel: {
    flex: 1,
    color: colors.foreground,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  });
}
