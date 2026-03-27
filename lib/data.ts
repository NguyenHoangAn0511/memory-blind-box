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

export interface Letter {
  id: string;
  title: string;
  sender: string;
  content: string[];
  date: string;
  unlockCondition: { month: number; day: number };
}

export const LETTERS: Letter[] = [
  {
    id: 'birthday-letter',
    title: 'A Special Message',
    sender: 'An',
    date: 'April 26',
    unlockCondition: { month: 3, day: 26 },
    content: [
      "If you are reading this, it means you have uncovered every single memory we've hidden away for this month.",
      "Seeing all these moments together—the quiet dinners, the grand holidays, the silly casual days—reminds me of how incredibly lucky I am to share this journey with you. Each card isn't just a photograph; it's a testament to the beautiful life we are building together.",
      "Thank you for every smile, every adventure, and every quiet moment we've shared. I cherish these memories more than words can say, and I cannot wait to create a thousand more with you.",
      "Here is to our past, our present, and our beautiful future."
    ]
  }
];

