'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, Filter, ArrowUpDown, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import Polaroid from '@/components/Polaroid';
import { useAppStore } from '@/lib/store';
import { CardData, Rarity } from '@/lib/data';
import { supabase } from '@/lib/supabase';

type SortOption = 'day-asc' | 'day-desc' | 'rarity';

const getBorderClass = (type: Rarity) => {
  switch(type) {
    case 'Casual': return 'bg-white border-4 border-stone-400';
    case 'Dinner': return 'bg-white border-4 border-rose-400';
    case 'Holiday': return 'bg-white border-4 border-sky-400';
    case 'Anniversary': return 'bg-white border-4 border-fuchsia-400';
    case 'Core Memory': return 'bg-white border-4 border-amber-400';
    case 'Secret': return 'bg-white border-4 border-indigo-500';
    case 'Birthday': return 'border-holo';
    default: return 'bg-white border-4 border-stone-200';
  }
};

const RARITY_ORDER: Record<Rarity, number> = {
  'Birthday': 0,
  'Secret': 1,
  'Core Memory': 2,
  'Anniversary': 3,
  'Holiday': 4,
  'Dinner': 5,
  'Casual': 6,
};

export default function CollectionPage() {
  const openedDays = useAppStore((state) => state.openedDays);
  const [isClient, setIsClient] = useState(false);
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [filterType, setFilterType] = useState<Rarity | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('day-asc');
  const [groupByRarity, setGroupByRarity] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    
    const fetchCards = async () => {
      const sb = supabase;
      if (!sb) return;
      if (!openedDays || openedDays.length === 0) {
        setAllCards([]);
        return;
      }

      try {
        const fetchedCards: CardData[] = [];
        const chunkSize = 30;
        
        for (let i = 0; i < openedDays.length; i += chunkSize) {
          const chunk = openedDays.slice(i, i + chunkSize);
          const orConditions = chunk.map(id => {
            const parts = id.split('-');
            if (parts.length !== 3) return null;
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
            return `and(year.eq.${y},month.eq.${m},day.eq.${d})`;
          }).filter(Boolean).join(',');

          if (!orConditions) continue;

          const { data, error } = await sb.from('cards').select('*').or(orConditions);
          if (data && !error) {
            fetchedCards.push(...data);
          }
        }
        setAllCards(fetchedCards);
      } catch (err) {
        console.error('Failed to fetch collected cards:', err);
      }
    };
    fetchCards();
  }, [openedDays]);

  const collectedCards = useMemo(() => {
    return allCards.filter(card => {
      const fullId = card.year !== undefined && card.month !== undefined 
          ? `${card.year}-${card.month + 1}-${card.day}`
          : String(card.id);
      return openedDays.includes(fullId);
    });
  }, [allCards, openedDays]);

  const displayedCards = useMemo(() => {
    let filtered = collectedCards;
    
    if (filterType !== 'All') {
      filtered = filtered.filter(card => card.type === filterType);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'day-asc') return a.day - b.day;
      if (sortBy === 'day-desc') return b.day - a.day;
      if (sortBy === 'rarity') {
        const diff = RARITY_ORDER[a.type] - RARITY_ORDER[b.type];
        if (diff !== 0) return diff;
        return a.day - b.day;
      }
      return 0;
    });
  }, [collectedCards, filterType, sortBy]);

  const allTypes = ['All', ...Array.from(new Set(collectedCards.map(c => c.type)))] as (Rarity | 'All')[];

  const renderCard = (card: CardData) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ layout: { type: 'spring', bounce: 0.2, duration: 0.6 } }}
      layoutId={`collection-card-${card.day}`}
      key={card.day}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedCard(card)}
      className={`relative aspect-[3/4] rounded-xl flex flex-col items-center justify-center overflow-hidden transition-shadow duration-300 shadow-sm hover:shadow-xl cursor-pointer ${getBorderClass(card.type)}`}
    >
      <div className="absolute inset-0 opacity-80">
        <Image src={card.imageUrl} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
        <span className="text-2xl font-serif text-white drop-shadow-md">{card.day}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/80 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          {card.type}
        </span>
      </div>
    </motion.div>
  );

  if (!isClient) return null;

  return (
    <main className="min-h-screen bg-[#f5f5f0] font-sans text-stone-900 p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-stone-300 pb-6 gap-4">
        <div>
          <Link href="/" className="inline-flex items-center text-stone-500 hover:text-stone-800 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calendar
          </Link>
          <h1 className="text-4xl md:text-6xl font-serif font-light tracking-tight">Collection</h1>
          <p className="text-lg font-mono text-stone-500 mt-2">
            {collectedCards.length} Cards Collected
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Group By Rarity */}
          <div className="flex items-center gap-2 mr-2">
            <input 
              type="checkbox" 
              id="group-rarity" 
              checked={groupByRarity} 
              onChange={(e) => setGroupByRarity(e.target.checked)}
              className="w-4 h-4 accent-stone-600 rounded border-stone-300"
            />
            <label htmlFor="group-rarity" className="text-sm font-mono text-stone-600 cursor-pointer">
              Group by Rarity
            </label>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as Rarity | 'All')}
              className="bg-transparent border border-stone-300 rounded-md py-1 px-2 text-sm font-mono focus:outline-none focus:border-stone-500"
            >
              {allTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-stone-400" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border border-stone-300 rounded-md py-1 px-2 text-sm font-mono focus:outline-none focus:border-stone-500"
            >
              <option value="day-asc">Day (Asc)</option>
              <option value="day-desc">Day (Desc)</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="w-full max-w-5xl">
        {collectedCards.length === 0 ? (
          <div className="text-center py-20 text-stone-400 font-mono">
            <p>No cards collected yet.</p>
            <Link href="/" className="text-stone-600 hover:underline mt-4 inline-block">
              Go open some days!
            </Link>
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="text-center py-20 text-stone-400 font-mono">
            <p>No cards match your filter.</p>
          </div>
        ) : groupByRarity ? (
          <div className="space-y-12 w-full">
            {Object.entries(
              displayedCards.reduce((acc, card) => {
                if (!acc[card.type]) acc[card.type] = [];
                acc[card.type].push(card);
                return acc;
              }, {} as Record<string, CardData[]>)
            )
            .sort(([typeA], [typeB]) => RARITY_ORDER[typeA as Rarity] - RARITY_ORDER[typeB as Rarity])
            .map(([type, cards]) => (
              <div key={type} className="w-full">
                <h2 className="text-2xl font-serif mb-4 border-b border-stone-300 pb-2 flex items-baseline">
                  {type} 
                  <span className="text-stone-400 text-sm font-mono ml-3">({cards.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  <AnimatePresence>
                    {cards.map(renderCard)}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            <AnimatePresence>
              {displayedCards.map(renderCard)}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Opened Card Overlay */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md overflow-hidden"
          >
            <motion.div
              layout
              className={`flex-1 flex flex-col items-center justify-center p-4 transition-all duration-500`}
            >
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <motion.div layoutId={`collection-card-${selectedCard.day}`} className="my-auto">
                  <Polaroid card={selectedCard} isNew={false} />
                </motion.div>
                
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
                  <div className="flex items-center gap-4">
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setSelectedCard(null);
                      }}
                      className="px-8 py-3 bg-white text-black font-serif text-lg rounded-full shadow-xl hover:scale-105 transition-transform"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
