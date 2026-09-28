import type { AdbRegion } from './world-map.types';

export const REGION_FILLS: Record<string, [string, string]> = {
  cwrd: ['#003f72', '#b3cfe4'],
  sard: ['#005fa0', '#b8d8f0'],
  eard: ['#007db7', '#bde3f5'],
  serd: ['#2e9fcb', '#c2ebf8'],
  pard: ['#54b8d4', '#caf1fb'],
};

export const REGION_FILLS_DARK: Record<string, [string, string]> = {
  cwrd: ['#3a8fc2', '#102840'],
  sard: ['#4ba3d4', '#122f4a'],
  eard: ['#5cb7e6', '#143754'],
  serd: ['#73caf2', '#163e5e'],
  pard: ['#8fd7f7', '#184568'],
};

export const LEAFLET_FLAG_ISO: Record<string, string> = {
  PNG: 'pg', FIJ: 'fj', VAN: 'vu', SOL: 'sb', TON: 'to', SAM: 'ws',
  KIR: 'ki', TUV: 'tv', MHL: 'mh', FSM: 'fm', NAU: 'nr', PAL: 'pw', COO: 'ck',
  NZL: 'nz', AUS: 'au',
  IND: 'in', PAK: 'pk', BAN: 'bd', SRI: 'lk', NEP: 'np', BHU: 'bt', MLD: 'mv', AFG: 'af',
  INO: 'id', PHI: 'ph', VIE: 'vn', THA: 'th', MAL: 'my', SIN: 'sg',
  CAM: 'kh', MYA: 'mm', LAO: 'la', TIM: 'tl',
  PRC: 'cn', JPN: 'jp', KOR: 'kr', MON: 'mn', HKG: 'hk',
  KAZ: 'kz', UZB: 'uz', AZE: 'az', GEO: 'ge', ARM: 'am', KGZ: 'kg', TAJ: 'tj',
};

export const ISO2_TO_ADB: Record<string, string> = Object.fromEntries(
  Object.entries(LEAFLET_FLAG_ISO).map(([adb, iso2]) => [iso2, adb])
);

export const ISO2_CENTROID: Record<string, [number, number]> = {
  pg: [147.18, -9.45],
  fj: [178.44, -18.14],
  vu: [168.32, -17.73],
  sb: [159.95, -9.43],
  to: [-175.22, -21.14],
  ws: [-171.77, -13.83],
  ki: [173.02, 1.33],
  tv: [179.22, -8.52],
  mh: [171.38, 7.12],
  fm: [158.19, 6.92],
  nr: [166.92, -0.55],
  pw: [134.62, 7.50],
  ck: [-159.77, -21.21],
  nz: [174.78, -41.29],
  au: [149.13, -35.28],
  in: [77.21, 28.61],
  pk: [73.07, 33.72],
  bd: [90.41, 23.81],
  lk: [79.86, 6.92],
  np: [85.32, 27.72],
  bt: [89.64, 27.47],
  mv: [73.51, 4.17],
  af: [69.17, 34.52],
  id: [106.85, -6.21],
  ph: [120.98, 14.60],
  vn: [105.85, 21.03],
  th: [100.52, 13.75],
  my: [101.69, 3.14],
  sg: [103.82, 1.36],
  kh: [104.92, 11.56],
  mm: [96.07, 19.76],
  la: [102.60, 17.97],
  tl: [125.58, -8.56],
  cn: [116.39, 39.91],
  jp: [139.69, 35.69],
  kr: [126.98, 37.57],
  mn: [106.92, 47.91],
  hk: [114.16, 22.28],
  kz: [71.44, 51.19],
  uz: [69.28, 41.32],
  az: [49.87, 40.41],
  ge: [44.83, 41.69],
  am: [44.51, 40.18],
  kg: [74.60, 42.87],
  tj: [68.77, 38.56],
};

export const REGION_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  pard: { center: [168, -10], zoom: 4 },
  seao: { center: [115,   8], zoom: 4 },
  eap:  { center: [110,  35], zoom: 3 },
  cwa:  { center: [ 65,  35], zoom: 3 },
  eca:  { center: [ 75,  42], zoom: 3 },
  ssa:  { center: [ 75,  25], zoom: 3 },
  cwrd: { center: [ 65,  35], zoom: 3 },
  sard: { center: [ 80,  25], zoom: 3 },
  eard: { center: [110,  35], zoom: 3 },
  serd: { center: [115,   8], zoom: 4 },
};

export const ISO_TO_REGION: Record<string, AdbRegion> = {
  in: 'sard', bd: 'sard', lk: 'sard', np: 'sard', bt: 'sard', mv: 'sard', pk: 'sard',
  cn: 'eard', mn: 'eard', kr: 'eard',
  kh: 'serd', id: 'serd', la: 'serd', mm: 'serd', ph: 'serd', th: 'serd',
  tl: 'serd', vn: 'serd', my: 'serd',
  fj: 'pard', pg: 'pard', sb: 'pard', vu: 'pard', ws: 'pard', to: 'pard',
  ki: 'pard', fm: 'pard', mh: 'pard', nr: 'pard', pw: 'pard', tv: 'pard',
  af: 'cwrd', am: 'cwrd', az: 'cwrd', ge: 'cwrd', kz: 'cwrd', kg: 'cwrd',
  tj: 'cwrd', tm: 'cwrd', uz: 'cwrd',
  au: 'nmem', at: 'nmem', be: 'nmem', ca: 'nmem', dk: 'nmem', fi: 'nmem',
  fr: 'nmem', de: 'nmem', ie: 'nmem', it: 'nmem', jp: 'nmem', lu: 'nmem',
  nl: 'nmem', nz: 'nmem', no: 'nmem', pt: 'nmem', es: 'nmem', se: 'nmem',
  ch: 'nmem', gb: 'nmem', us: 'nmem',
};

export const COUNTRY_NAMES: Record<string, string> = {
  in: 'India', bd: 'Bangladesh', pk: 'Pakistan', lk: 'Sri Lanka',
  np: 'Nepal', bt: 'Bhutan', mv: 'Maldives',
  cn: 'China', mn: 'Mongolia', kr: 'South Korea',
  kh: 'Cambodia', id: 'Indonesia', la: 'Laos', mm: 'Myanmar',
  ph: 'Philippines', th: 'Thailand', tl: 'Timor-Leste', vn: 'Vietnam',
  my: 'Malaysia', bn: 'Brunei', sg: 'Singapore',
  fj: 'Fiji', pg: 'Papua New Guinea', sb: 'Solomon Is.', vu: 'Vanuatu',
  ws: 'Samoa', to: 'Tonga', ki: 'Kiribati', fm: 'Micronesia',
  mh: 'Marshall Is.', nr: 'Nauru', pw: 'Palau', tv: 'Tuvalu',
  ck: 'Cook Islands',
  af: 'Afghanistan', am: 'Armenia', az: 'Azerbaijan', ge: 'Georgia',
  kz: 'Kazakhstan', kg: 'Kyrgyzstan', tj: 'Tajikistan', tm: 'Turkmenistan',
  uz: 'Uzbekistan', ir: 'Iran', tr: 'Türkiye',
  au: 'Australia', at: 'Austria', be: 'Belgium', ca: 'Canada',
  dk: 'Denmark', fi: 'Finland', fr: 'France', de: 'Germany',
  ie: 'Ireland', it: 'Italy', jp: 'Japan', lu: 'Luxembourg',
  nl: 'Netherlands', nz: 'New Zealand', no: 'Norway', pt: 'Portugal',
  es: 'Spain', se: 'Sweden', ch: 'Switzerland', gb: 'United Kingdom',
  us: 'United States',
  ru: 'Russia', ng: 'Nigeria', ke: 'Kenya', za: 'South Africa',
  eg: 'Egypt', ma: 'Morocco', br: 'Brazil', mx: 'Mexico', ar: 'Argentina',
  co: 'Colombia', pe: 'Peru', ua: 'Ukraine', pl: 'Poland',
  kp: 'North Korea',
};

const INDICATOR_PALETTE = ['#007DB7', '#00A651', '#F5A623', '#D0021B', '#9B59B6'];

export function indicatorColor(index: number): string {
  return INDICATOR_PALETTE[index % INDICATOR_PALETTE.length];
}
