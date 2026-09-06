import type { CosmeticSlot } from '../types';
import { assetUrl } from './assetUrl';

export type CosmeticCategory =
  | 'logo'
  | 'weapon'
  | 'gadget'
  | 'pattern'
  | 'color'
  | 'base';

/** Rodzina chwytu — wspólne dłonie w paper-doll v2. */
export type GripFamily = 'staff' | 'dual' | 'fan' | 'empty';

export type CosmeticItem = {
  id: string;
  label: string;
  category: CosmeticCategory;
  slot: CosmeticSlot | 'outfitColor' | 'headbandColor' | 'body' | 'fur' | 'faceMark';
  price: number;
  defaultOwned: boolean;
  /** Klucz assetu / glyph / hex. */
  assetKey: string;
  /** Podgląd w sklepie — ścieżka PNG; unikalna per przedmiot. */
  preview?: string;
  description: string;
  /** Tylko bronie — do silnika v2. */
  gripFamily?: GripFamily;
  /**
   * Brak prawdziwego, unikalnego assetu na pandzie.
   * Widać w sklepie jako „Wkrótce”, nie da się kupić.
   */
  comingSoon?: boolean;
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
  // Logo — glyph na opasce działa już teraz
  {
    id: 'logo-paw',
    label: 'Łapa pandy',
    category: 'logo',
    slot: 'headbandLogo',
    price: 0,
    defaultOwned: true,
    assetKey: 'paw',
    preview: '/art/panda-v2/round/shop/logos/paw.png',
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
    preview: '/art/panda-v2/round/shop/logos/bamboo.png',
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
    preview: '/art/panda-v2/round/shop/logos/mountain.png',
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
    preview: '/art/panda-v2/round/shop/logos/wave.png',
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
    preview: '/art/panda-v2/round/shop/logos/moon.png',
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
    preview: '/art/panda-v2/round/shop/logos/bolt.png',
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
    preview: '/art/panda-v2/round/shop/logos/dragon.png',
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
    preview: '/art/panda-v2/round/shop/logos/star.png',
    description: 'Gwiazda mistrza poranka.',
  },

  // Bronie z unikalnym PNG w public/art/items — w szafie od teraz, wygląd na pandzie w v2
  {
    id: 'weapon-bo',
    label: 'Bambusowy kij bo',
    category: 'weapon',
    slot: 'hand',
    price: 0,
    defaultOwned: true,
    assetKey: 'bo',
    preview: '/art/panda-v2/round/shop/weapons/bo.png',
    gripFamily: 'staff',
    description: 'Klasyczny kij równowagi.',
  },
  {
    id: 'weapon-bokken',
    label: 'Drewniany miecz bokken',
    category: 'weapon',
    slot: 'hand',
    price: 320,
    defaultOwned: false,
    assetKey: 'bokken',
    preview: '/art/panda-v2/round/shop/weapons/bokken.png',
    gripFamily: 'staff',
    description: 'Miękki, treningowy miecz.',
  },
  {
    id: 'weapon-nunchaku',
    label: 'Piankowe nunchaku',
    category: 'weapon',
    slot: 'hand',
    price: 450,
    defaultOwned: false,
    assetKey: 'nunchaku',
    preview: '/art/panda-v2/round/shop/weapons/nunchaku.png',
    gripFamily: 'dual',
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
    preview: '/art/panda-v2/round/shop/weapons/sai.png',
    gripFamily: 'dual',
    description: 'Pałeczki strażnika tęczy.',
  },
  {
    id: 'weapon-fan',
    label: 'Wachlarz ninja',
    category: 'weapon',
    slot: 'hand',
    price: 380,
    defaultOwned: false,
    assetKey: 'fan',
    preview: '/art/panda-v2/round/shop/weapons/fan.png',
    gripFamily: 'fan',
    description: 'Wachlarz robi wiatr jak w lesie.',
  },

  // Duplikaty tego samego PNG — w katalogu jako zapowiedź, bez sprzedaży
  {
    id: 'weapon-sticks',
    label: 'Dwa bambusowe pałeczki',
    category: 'weapon',
    slot: 'hand',
    price: 220,
    defaultOwned: false,
    assetKey: 'sticks',
    preview: '/art/panda-v2/round/shop/weapons/sticks.png',
    gripFamily: 'dual',
    description: 'Lekkie pałeczki do pokazu.',
  },
  {
    id: 'weapon-dragon-staff',
    label: 'Kostur smoka',
    category: 'weapon',
    slot: 'hand',
    price: 700,
    defaultOwned: false,
    assetKey: 'dragon-staff',
    preview: '/art/panda-v2/round/shop/weapons/dragon-staff.png',
    gripFamily: 'staff',
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
    preview: '/art/panda-v2/round/shop/weapons/naginata.png',
    gripFamily: 'staff',
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
    preview: '/art/panda-v2/round/shop/weapons/master.png',
    gripFamily: 'staff',
    description: 'Najrzadszy kij dojo.',
  },

  // Gadżety na warstwach v2 (aury / wzory kimona — później)
  {
    id: 'gadget-talisman',
    label: 'Talizman szczęścia',
    category: 'gadget',
    slot: 'belt',
    price: 140,
    defaultOwned: false,
    assetKey: 'talisman',
    preview: '/art/panda-v2/round/shop/gadgets/talisman.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/bottle.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/pouch.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/scarf.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/glasses.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/mask.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/pack.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/cape.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/dragon-pack.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/leaves.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/cloud.png',
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
    preview: '/art/panda-v2/round/shop/gadgets/sparks.png',
    description: 'Iskierki wokół postaci.',
  },

  // Wzory kimona — kafelek + maska CSS
  {
    id: 'pattern-bamboo',
    label: 'Wzór bambusowy',
    category: 'pattern',
    slot: 'outfitPattern',
    price: 250,
    defaultOwned: false,
    assetKey: 'bamboo',
    preview: '/art/panda-v2/round/shop/patterns/bamboo.png',
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
    preview: '/art/panda-v2/round/shop/patterns/waves.png',
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
    preview: '/art/panda-v2/round/shop/patterns/mountains.png',
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
    preview: '/art/panda-v2/round/shop/patterns/stars.png',
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
    preview: '/art/panda-v2/round/shop/patterns/scales.png',
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
    preview: '/art/panda-v2/round/shop/patterns/gold.png',
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

/** Da się kupić w sklepiku (nie „Wkrótce”, cena > 0). */
export function isPurchasable(item: CosmeticItem): boolean {
  return item.price > 0 && item.comingSoon !== true;
}

/** Przymiarka zmienia wygląd już na flat sprite (logo). */
export function canTryOnFlat(item: CosmeticItem): boolean {
  return item.slot === 'headbandLogo' && item.comingSoon !== true;
}

/** Glyph / emoji przejściowy dla logo (do czasu PNG). */
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

/** @deprecated Faza 0: nie renderujemy emoji gadżetów na pandzie. */
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
  return assetUrl(`art/icons/task-${icon}.png`);
}

export const VOICE_LINE_FIELDS: { key: string; label: string }[] = [
  { key: 't20', label: 'T-20' },
  { key: 't10', label: 'T-10' },
  { key: 't5', label: 'T-5' },
  { key: 't0', label: 'Wyjście' },
  { key: 'complete', label: 'Komplet (użyj {name})' },
];
