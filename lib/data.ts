export type Rarity = 'Casual' | 'Dinner' | 'Holiday' | 'Anniversary' | 'Core Memory' | 'Secret' | 'Birthday';

export interface CardData {
  id: string;
  day: number;
  type: Rarity;
  imageUrl: string;
  date: string;
  location: string;
  loveNote: string;
  // Dynamic Overrides
  colorGradient?: string;
  holoGradient?: string;
  holoOpacity?: number;
  borderOpacity?: number;
  // Year/Month
  month?: number;
  year?: number;
  glareOpacity?: number;
  objectPosition?: string;
}

export const RARITIES: { type: Rarity; color: string; glow: string }[] = [
  { type: 'Casual', color: 'bg-stone-200', glow: 'shadow-stone-400' },
  { type: 'Dinner', color: 'bg-rose-200', glow: 'shadow-rose-400' },
  { type: 'Holiday', color: 'bg-sky-200', glow: 'shadow-sky-400' },
  { type: 'Anniversary', color: 'bg-fuchsia-200', glow: 'shadow-fuchsia-400' },
  { type: 'Core Memory', color: 'bg-amber-200', glow: 'shadow-amber-400' },
  { type: 'Secret', color: 'bg-indigo-900 text-white', glow: 'shadow-indigo-500' },
  { type: 'Birthday', color: 'bg-white', glow: 'shadow-pink-500' },
];

import cardsData from './cards.json';

export const CARDS: CardData[] = cardsData as CardData[];

export function getCardByDay(cards: CardData[], day: number): CardData | undefined {
  return cards.find(c => c.day === day);
}
