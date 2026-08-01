export const MUNICIPIO_COLORS: Record<string, { bg: string; text: string }> = {
  'Itagüí': { bg: '#EAF0FF', text: '#00289F' },
  Sabaneta: { bg: '#EAF5F0', text: '#0F7B57' },
  'San Antonio de Prado': { bg: '#F4EFFB', text: '#5B3E9E' },
  'La Estrella': { bg: '#FDF1E8', text: '#9A5417' },
  Envigado: { bg: '#EAF3F8', text: '#1B5C7E' },
  'Medellín': { bg: '#FBEFF2', text: '#9B2C48' },
}

export function municipioColor(municipio: string): { bg: string; text: string } {
  return MUNICIPIO_COLORS[municipio] ?? { bg: '#F1F2F5', text: '#6B7280' }
}
