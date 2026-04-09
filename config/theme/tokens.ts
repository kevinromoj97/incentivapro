/**
 * IncentivaPro — Design Tokens
 * Paleta inspirada en BBVA México.
 * Para cambiar colores, edita SOLO este archivo.
 */
export const tokens = {
  colors: {
    primary:       '#004481',   // Azul BBVA principal
    primaryDark:   '#002F5F',   // Hover / fondo oscuro
    primaryLight:  '#1973B8',   // Variante clara
    accent:        '#5AC4BE',   // Aqua/turquesa BBVA
    background:    '#F5F7FA',   // Fondo de la app
    surface:       '#FFFFFF',   // Tarjetas y paneles
    textPrimary:   '#1A1A2E',   // Texto principal
    textSecondary: '#6B7280',   // Labels y texto secundario
    success:       '#10B981',   // Verde — logro >= 100%
    successLight:  '#D1FAE5',
    warning:       '#F59E0B',   // Amarillo — logro 90-99%
    warningLight:  '#FEF3C7',
    danger:        '#EF4444',   // Rojo — logro < 90%
    dangerLight:   '#FEE2E2',
    border:        '#E5E7EB',   // Bordes
    muted:         '#F3F4F6',   // Fondos suaves
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '1rem',
    full: '9999px',
  },
  shadow: {
    card: '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.07)',
    hover: '0 4px 12px 0 rgba(0,0,0,.10)',
    modal: '0 20px 60px -10px rgba(0,0,0,.18)',
  },
  font: {
    family: 'Inter, system-ui, sans-serif',
    sizeXs:  '0.75rem',
    sizeSm:  '0.875rem',
    sizeMd:  '1rem',
    sizeLg:  '1.125rem',
    sizeXl:  '1.25rem',
    size2xl: '1.5rem',
    size3xl: '1.875rem',
    size4xl: '2.25rem',
  },
} as const

export type TokenColors = typeof tokens.colors
