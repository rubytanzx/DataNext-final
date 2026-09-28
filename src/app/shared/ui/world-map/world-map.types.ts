export type KidbObs = { economy: string; period: string; value: number | null };

export type AdbRegion = 'cwrd' | 'sard' | 'eard' | 'serd' | 'pard' | 'nmem' | 'oth';

// SVG-space coordinates matching the world-map-coded.svg viewBox (30.767 241.591 784.077 458.627)
export interface MapMarker {
  x: number;
  y: number;
  label: string;
}
