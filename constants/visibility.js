export const VISIBILITY_LABEL = {
  public: 'Público',
  unlisted: 'No listado',
  private: 'Privado',
};

// Mismos tonos semánticos que la web: público=verde, no listado=ámbar, privado=gris.
export const VISIBILITY_COLOR = {
  public: { color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  unlisted: { color: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  private: { color: '#6b7280', backgroundColor: 'rgba(107, 114, 128, 0.12)' },
};

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: VISIBILITY_LABEL.private },
  { value: 'unlisted', label: VISIBILITY_LABEL.unlisted },
  { value: 'public', label: VISIBILITY_LABEL.public },
];
