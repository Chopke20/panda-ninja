import type { CosmeticSlot } from '../types';

export type CosmeticCategory =
  | 'logo'
  | 'weapon'
  | 'gadget'
  | 'pattern'
  | 'color'
  | 'base';

export type CosmeticItem = {
  id: string;
  label: string;
  category: CosmeticCategory;
  slot: CosmeticSlot | 'outfitColor' | 'headbandColor' | 'body' | 'fur' | 'faceMark';
  price: number;
  defaultOwned: boolean;
  /** Klucz assetu / glyph / hex. */
  assetKey: string;
  /** Podgląd w sklepie — opcjonalna ścieżka PNG. */
  preview?: string;
  description: string;
};

/** Kolory kimona / opaski dostępne od startu. */
export const OUTFIT_COLORS: { id: string; label: string; hex: string }[] = [
  { id: 'color-charcoal', label: 'Grafit', hex: '#3A3F46' },
  { id: 'color-indigo', label: 'Indygo', hex: '#3D4F8A' },
  { id: 'color-crimson', label: 'Karmazyn', hex: '#A83B3B' },
  { id: 'color-forest', label: 'Las', hex: '#3F6B4A' },
  { id: 'color-sand', label: 'Piasek', hex: '#C4A574' },
  { id: 'color-sky', label: 'Niebo', hex: '#5B8FB8' },
];

export const HEADBAND_COLORS: { id: string; label: string; hex: string }[] = [
  { id: 'hb-white', label: 'Biała', hex: '#F2F0EA' },
  { id: 'hb-red', label: 'Czerwona', hex: '#C44536' },
  { id: 'hb-blue', label: 'Niebieska', hex: '#3D6B8A' },
  { id: 'hb-green', label: 'Zielona', hex: '#3F8F62' },
  { id: 'hb-black', label: 'Czarna', hex: '#2A2926' },
  { id: 'hb-gold', label: 'Złota', hex: '#D4A017' },
];

export const ACCENTS: { hex: string; label: string }[] = [
  { hex: '#3D6B8A', label: 'Stal' },
  { hex: '#C44536', label: 'Czerwień' },
  { hex: '#3F8F62', label: 'Zieleń' },
  { hex: '#D4A017', label: 'Złoto' },
  { hex: '#6B4C9A', label: 'Fiolet' },
  { hex: '#C4783A', label: 'Miedź' },
  { hex: '#2C3A4A', label: 'Dojo' },
  { hex: '#5B7C99', label: 'Mgła' },
];

export const COSMETIC_CATALOG: CosmeticItem[] = [
  // Logo
  {
    id: 'logo-paw',
    label: 'Łapa pandy',
    category: 'logo',
    slot: 'headbandLogo',
    price: 0,
    defaultOwned: true,
    assetKey: 'paw',
    description: 'Startowe logo opaski.',
  },
  {
    id: 'logo-bamboo',
    label: 'Bambus',
    category: 'logo',
    slot: 'headbandLogo',
    price: 0,
    defaultOwned: true,
    assetKey: 'bamboo',
    description: 'Prosty znak bambusa.',
  },
  {
    id: 'logo-mountain',
    label: 'Góra dojo',
    category: 'logo',
    slot: 'headbandLogo',
    price: 120,
    defaultOwned: false,
    assetKey: 'mountain',
    description: 'Trzy szczyty nad dojo.',
  },
  {
    id: 'logo-wave',
    label: 'Fala',
    category: 'logo',
    slot: 'headbandLogo',
    price: 160,
    defaultOwned: false,
    assetKey: 'wave',
    description: 'Spokojna fala treningu.',
  },
  {
    id: 'logo-moon',
    label: 'Księżyc',
    category: 'logo',
    slot: 'headbandLogo',
    price: 220,
    defaultOwned: false,
    assetKey: 'moon',
    description: 'Sierp księżyca ninja.',
  },
  {
    id: 'logo-bolt',
    label: 'Błyskawica',
    category: 'logo',
    slot: 'headbandLogo',
    price: 280,
    defaultOwned: false,
    assetKey: 'bolt',
    description: 'Szybki błysk na opasce.',
  },
  {
    id: 'logo-dragon',
    label: 'Smok',
    category: 'logo',
    slot: 'headbandLogo',
    price: 500,
    defaultOwned: false,
    assetKey: 'dragon',
    description: 'Przyjazny znak smoka.',
  },
  {
    id: 'logo-star',
    label: 'Złota gwiazda',
    category: 'logo',
    slot: 'headbandLogo',
    price: 650,
    defaultOwned: false,
    assetKey: 'star',
    description: 'Gwiazda mistrza poranka.',
  },

  // Sprzęt treningowy
  {
    id: 'weapon-bo',
    label: 'Bambusowy kij bo',
    category: 'weapon',
    slot: 'hand',
    price: 0,
    defaultOwned: true,
    assetKey: 'bo',
    preview: '/art/items/weapon-bo.png',
    description: 'Klasyczny kij równowagi.',
  },
  {
    id: 'weapon-sticks',
    label: 'Dwa bambusowe pałeczki',
    category: 'weapon',
    slot: 'hand',
    price: 220,
    defaultOwned: false,
    assetKey: 'sticks',
    preview: '/art/items/weapon-nunchaku.png',
    description: 'Lekkie pałeczki do pokazu.',
  },
  {
    id: 'weapon-bokken',
    label: 'Drewniany miecz bokken',
    category: 'weapon',
    slot: 'hand',
    price: 320,
    defaultOwned: false,
    assetKey: 'bokken',
    preview: '/art/items/weapon-katana.png',
    description: 'Miękki, treningowy miecz.',
  },
  {
    id: 'weapon-fan',
    label: 'Wachlarz ninja',
    category: 'weapon',
    slot: 'hand',
    price: 380,
    defaultOwned: false,
    assetKey: 'fan',
    preview: '/art/items/weapon-kama.png',
    description: 'Wachlarz robi wiatr jak w lesie.',
  },
  {
    id: 'weapon-nunchaku',
    label: 'Piankowe nunchaku',
    category: 'weapon',
    slot: 'hand',
    price: 450,
    defaultOwned: false,
    assetKey: 'nunchaku',
    preview: '/art/items/weapon-nunchaku.png',
    description: 'Bezpieczne kręciołki chmur.',
  },
  {
    id: 'weapon-sai',
    label: 'Podwójne sai treningowe',
    category: 'weapon',
    slot: 'hand',
    price: 520,
    defaultOwned: false,
    assetKey: 'sai',
    preview: '/art/items/weapon-sai.png',
    description: 'Pałeczki strażnika tęczy.',
  },
  {
    id: 'weapon-dragon-staff',
    label: 'Kostur smoka',
    category: 'weapon',
    slot: 'hand',
    price: 700,
    defaultOwned: false,
    assetKey: 'dragon-staff',
    preview: '/art/items/weapon-bo.png',
    description: 'Długi kostur z motywem smoka.',
  },
  {
    id: 'weapon-naginata',
    label: 'Księżycowa naginata',
    category: 'weapon',
    slot: 'hand',
    price: 850,
    defaultOwned: false,
    assetKey: 'naginata',
    preview: '/art/items/weapon-katana.png',
    description: 'Treningowa naginata księżyca.',
  },
  {
    id: 'weapon-master',
    label: 'Złoty kij mistrza',
    category: 'weapon',
    slot: 'hand',
    price: 1200,
    defaultOwned: false,
    assetKey: 'master',
    preview: '/art/items/weapon-bo.png',
    description: 'Najrzadszy kij dojo.',
  },

  // Gadżety
  {
    id: 'gadget-talisman',
    label: 'Talizman szczęścia',
    category: 'gadget',
    slot: 'belt',
    price: 140,
    defaultOwned: false,
    assetKey: 'talisman',
    description: 'Mały znak dobrego startu.',
  },
  {
    id: 'gadget-bottle',
    label: 'Mini butelka bambusowa',
    category: 'gadget',
    slot: 'belt',
    price: 180,
    defaultOwned: false,
    assetKey: 'bottle',
    preview: '/art/icons/task-bottle.png',
    description: 'Bidon na szkolną wyprawę.',
  },
  {
    id: 'gadget-pouch',
    label: 'Sakiewka ninja',
    category: 'gadget',
    slot: 'belt',
    price: 220,
    defaultOwned: false,
    assetKey: 'pouch',
    description: 'Sakiewka na drobiazgi.',
  },
  {
    id: 'gadget-scarf',
    label: 'Czerwona chusta',
    category: 'gadget',
    slot: 'head',
    price: 260,
    defaultOwned: false,
    assetKey: 'scarf',
    description: 'Chusta na bok głowy.',
  },
  {
    id: 'gadget-glasses',
    label: 'Okulary mistrza',
    category: 'gadget',
    slot: 'head',
    price: 320,
    defaultOwned: false,
    assetKey: 'glasses',
    description: 'Okrągłe okulary dojo.',
  },
  {
    id: 'gadget-mask',
    label: 'Maska cienia',
    category: 'gadget',
    slot: 'head',
    price: 420,
    defaultOwned: false,
    assetKey: 'mask',
    description: 'Przyjazna maska treningowa.',
  },
  {
    id: 'gadget-pack',
    label: 'Mały plecak dojo',
    category: 'gadget',
    slot: 'back',
    price: 300,
    defaultOwned: false,
    assetKey: 'pack',
    preview: '/art/icons/task-backpack.png',
    description: 'Plecaczek na plecach.',
  },
  {
    id: 'gadget-cape',
    label: 'Peleryna nocnego ninja',
    category: 'gadget',
    slot: 'back',
    price: 550,
    defaultOwned: false,
    assetKey: 'cape',
    description: 'Krótka pelerynka.',
  },
  {
    id: 'gadget-dragon-pack',
    label: 'Plecak smoka',
    category: 'gadget',
    slot: 'back',
    price: 750,
    defaultOwned: false,
    assetKey: 'dragon-pack',
    preview: '/art/icons/task-backpack.png',
    description: 'Plecak z motywem smoka.',
  },
  {
    id: 'gadget-leaves',
    label: 'Liście bambusa',
    category: 'gadget',
    slot: 'aura',
    price: 380,
    defaultOwned: false,
    assetKey: 'leaves',
    description: 'Unoszące się listki.',
  },
  {
    id: 'gadget-cloud',
    label: 'Chmurka treningu',
    category: 'gadget',
    slot: 'aura',
    price: 500,
    defaultOwned: false,
    assetKey: 'cloud',
    description: 'Mała chmurka nad pandą.',
  },
  {
    id: 'gadget-sparks',
    label: 'Złote iskry',
    category: 'gadget',
    slot: 'aura',
    price: 800,
    defaultOwned: false,
    assetKey: 'sparks',
    description: 'Iskierki wokół postaci.',
  },

  // Wzory kimona
  {
    id: 'pattern-bamboo',
    label: 'Wzór bambusowy',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 250,
    defaultOwned: false,
    assetKey: 'bamboo',
    description: 'Delikatne łodygi na kimono.',
  },
  {
    id: 'pattern-waves',
    label: 'Wzór fal',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 350,
    defaultOwned: false,
    assetKey: 'waves',
    description: 'Fale na tkaninie.',
  },
  {
    id: 'pattern-mountains',
    label: 'Wzór gór',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 450,
    defaultOwned: false,
    assetKey: 'mountains',
    description: 'Szczyty dojo.',
  },
  {
    id: 'pattern-stars',
    label: 'Nocne gwiazdy',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 600,
    defaultOwned: false,
    assetKey: 'stars',
    description: 'Gwiazdki na kimono.',
  },
  {
    id: 'pattern-scales',
    label: 'Smocze łuski',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 850,
    defaultOwned: false,
    assetKey: 'scales',
    description: 'Łuskowaty wzór.',
  },
  {
    id: 'pattern-gold',
    label: 'Złote obszycie mistrza',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 1100,
    defaultOwned: false,
    assetKey: 'gold',
    description: 'Złoty pasek na kimono.',
  },
];

export function getCosmetic(id: string): CosmeticItem | undefined {
  return COSMETIC_CATALOG.find((item) => item.id === id);
}

export function defaultOwnedIds(): string[] {
  return COSMETIC_CATALOG.filter((item) => item.defaultOwned).map((item) => item.id);
}

export function cosmeticsByCategory(category: CosmeticCategory): CosmeticItem[] {
  return COSMETIC_CATALOG.filter((item) => item.category === category);
}

/** Glyph / emoji przejściowy dla logo (do czasu PNG z Gemini). */
export const LOGO_GLYPHS: Record<string, string> = {
  paw: '🐾',
  bamboo: '🎋',
  mountain: '⛰',
  wave: '🌊',
  moon: '🌙',
  bolt: '⚡',
  dragon: '🐉',
  star: '★',
};

export const GADGET_GLYPHS: Record<string, string> = {
  talisman: '🧧',
  bottle: '🍶',
  pouch: '🎒',
  scarf: '🧣',
  glasses: '👓',
  mask: '🎭',
  pack: '🎒',
  cape: '🦸',
  'dragon-pack': '🐉',
  leaves: '🍃',
  cloud: '☁️',
  sparks: '✨',
};

// Zachowane dla ikon zadań
export const TASK_ICONS = [
  'bed',
  'clothes',
  'shirt',
  'cereal',
  'milk',
  'toothbrush',
  'hairbrush',
  'soap',
  'toilet',
  'backpack',
  'lunchbox',
  'notebook',
  'book',
  'shoes',
  'jacket',
  'cap',
  'bottle',
  'dogbowl',
  'plant',
  'toys',
  'dishes',
  'panda',
  'curtains',
  'panda-smile',
  'panda-wink',
  'panda-happy',
  'dishes-clean',
  'curtains-closed',
  'keys',
  'clock',
] as const;

export type TaskIconId = (typeof TASK_ICONS)[number];

export function taskIconSrc(icon: string): string {
  return `/art/icons/task-${icon}.png`;
}

export const VOICE_LINE_FIELDS: { key: string; label: string }[] = [
  { key: 't20', label: 'T-20' },
  { key: 't10', label: 'T-10' },
  { key: 't5', label: 'T-5' },
  { key: 't0', label: 'Wyjście' },
  { key: 'complete', label: 'Komplet (użyj {name})' },
];
