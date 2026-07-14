export const lightColors = {
  primary: '#7A3B9A',
  primaryHover: '#5E2D78',
  secondary: '#10b981',
  accent: '#FFCE00',
  background: '#f8f7fc',
  foreground: '#1a1023',
  muted: '#f0edf8',
  mutedForeground: '#6b7280',
  card: '#ffffff',
  border: 'rgba(122, 59, 154, 0.16)',
  placeholder: '#b0aab8',
  danger: '#ef4444',
  whatsapp: '#25D366',
};

export const darkColors = {
  primary: '#9d5ec2',
  primaryHover: '#b478d9',
  secondary: '#10b981',
  accent: '#FFCE00',
  background: '#140e1a',
  foreground: '#f1edf7',
  muted: '#211830',
  mutedForeground: '#a79fb3',
  card: '#1d1526',
  border: 'rgba(157, 94, 194, 0.28)',
  placeholder: '#6f6680',
  danger: '#f87171',
  whatsapp: '#25D366',
};

// Mantenido por compatibilidad con cualquier import estático que quede — el
// tema real (claro/oscuro) se obtiene con useTheme() de lib/ThemeContext.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const fonts = {
  regular: 'Epilogue_400Regular',
  medium: 'Epilogue_500Medium',
  semibold: 'Epilogue_600SemiBold',
  bold: 'Epilogue_700Bold',
  extrabold: 'Epilogue_800ExtraBold',
};
