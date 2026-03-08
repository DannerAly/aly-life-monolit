export const CATEGORY_COLORS = [
  { name: 'Azul',     hex: '#3b82f6' },
  { name: 'Cielo',    hex: '#0ea5e9' },
  { name: 'Teal',     hex: '#14b8a6' },
  { name: 'Verde',    hex: '#10b981' },
  { name: 'Amber',    hex: '#f59e0b' },
  { name: 'Naranja',  hex: '#f97316' },
  { name: 'Rojo',     hex: '#f43f5e' },
  { name: 'Rosa',     hex: '#ec4899' },
  { name: 'Indigo',   hex: '#6366f1' },
  { name: 'Violeta',  hex: '#8b5cf6' },
] as const;

export type CategoryColor = typeof CATEGORY_COLORS[number];
