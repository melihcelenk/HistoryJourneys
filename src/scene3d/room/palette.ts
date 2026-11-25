/** Colours of the room, gathered in one place so that the textures and materials stay in tune. */
export const PALETTE = {
  tileTurquoise: '#1c8f96',
  tileTurquoiseDeep: '#0f6f7c',
  tileCobalt: '#16307a',
  tileCobaltDeep: '#0d1f55',
  tileGreen: '#124c3c',
  tileWhite: '#e9e6da',
  tileYellow: '#d9a92c',
  tileManganese: '#4a2a4e',
  grout: '#b9b09c',
  gold: '#d8b257',
  goldDeep: '#a9812f',
  plaster: '#ece5d6',
  plasterShade: '#cfc4ad',
  paintBlue: '#1f3f8c',
  paintRed: '#9c2f25',
  paintGreen: '#2c5d45',
  paintOchre: '#c79a3a',
  paintBlack: '#1d1a18',
  marble: '#d9d4c8',
  marbleVein: '#a8a59c',
  terracotta: '#9a5a3c',
  terracottaDark: '#7c452e',
  walnut: '#4a2c18',
  walnutDark: '#2c180c',
  walnutLight: '#7a4d2a',
  ebony: '#1c120c',
  ivory: '#e6dcc4',
  iron: '#2a2a2c',
  brass: '#b88a3a',
  carpetRed: '#8e1f1c',
  carpetBlue: '#1c2f5e',
  carpetYellow: '#c9a03f',
  carpetIvory: '#e2d6b8',
  carpetBrown: '#33190f',
  carpetGreen: '#2f5a4a',
  velvetCrimson: '#7d1220',
  silkBlue: '#1f3a6e',
  silkGreen: '#23533f',
  silkIvory: '#dfd3b4',
  skyTop: '#9fc4e8',
  skyHorizon: '#fff0cf',
  sun: '#ffd9a0',
  fire: '#ff8a2a',
} as const;

/** Parses "#rrggbb" into its three channels, 0 to 255. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Moves a colour towards white (positive amount) or black (negative amount); the amount is between -1 and 1. */
export function shade(hex: string, amount: number): string {
  const target = amount >= 0 ? 255 : 0;
  const weight = Math.min(1, Math.abs(amount));
  const [r, g, b] = hexToRgb(hex).map((channel) => Math.round(channel + (target - channel) * weight));
  return `rgb(${r}, ${g}, ${b})`;
}
