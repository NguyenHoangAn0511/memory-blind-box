'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cake, Library, Info, RefreshCw, Download, Mail, ArrowLeft, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { getCardByDay, CardData } from '@/lib/data';
import LetterEnvelope from '@/components/LetterEnvelope';
import { supabase } from '@/lib/supabase';
import Polaroid from '@/components/Polaroid';
import BoosterPackOpening from '@/components/BoosterPackOpening';
import { ENFORCE_DATE_LOCK } from '@/components/LoginGuard';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCardId = (year: number, month: number, day: number) => `${year}-${month + 1}-${day}`;

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isNewCard, setIsNewCard] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [boosterCard, setBoosterCard] = useState<CardData | null>(null);
  
  const cards = useAppStore((state) => state.cards);
  const setCards = useAppStore((state) => state.setCards);
  const openedDays = useAppStore((state) => state.openedDays);
  const setOpenedDays = useAppStore((state) => state.setOpenedDays);
  const accessCode = useAppStore((state) => state.accessCode);
  const currentMonth = useAppStore((state) => state.currentMonth);
  const currentYear = useAppStore((state) => state.currentYear);
  const setMonth = useAppStore((state) => state.setMonth);
  const setYear = useAppStore((state) => state.setYear);
  const resetCalendar = useAppStore((state) => state.resetCalendar);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const sb = supabase;
    if (!sb) return;

    const fetchCards = async () => {
       const { data, error } = await sb
        .from('cards')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('day', { ascending: true });
        
      if (data && !error) {
        setCards(data);
      } else {
        setCards([]);
      }
    };

    fetchCards();

    const channel = sb
      .channel('cards-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, (payload) => {
        fetchCards();
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [setCards, currentMonth, currentYear]);

  const changeMonth = (dir: number) => {
    let newMonth = currentMonth + dir;
    let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    else if (newMonth < 0) { newMonth = 11; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleDayClick = (day: number) => {
    if (ENFORCE_DATE_LOCK) {
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Allow opening anything today or earlier
      const targetDate = new Date(currentYear, currentMonth, day);
      if (targetDate > now) {
        setDialog({ 
          open: true, 
          message: `This secret memory is still in the future! Come back on ${MONTH_NAMES[currentMonth]} ${day}, ${currentYear}.` 
        });
        return;
      }
    }

    const card = getCardByDay(cards, day);
    if (!card) {
      setDialog({ 
        open: true, 
        message: `Oops! It looks like no memory was captured for ${MONTH_NAMES[currentMonth]} ${day} yet. Maybe it's a secret for later? ☁️✨` 
      });
      return;
    }

    const fullId = getCardId(currentYear, currentMonth, day);
    const isNew = !openedDays.includes(fullId);
    setIsNewCard(isNew);
    
    if (isNew) {
      const newOpened = [...openedDays, fullId];
      setOpenedDays(newOpened);
      if (supabase && accessCode) {
        supabase.from('profiles').update({ opened_days: newOpened }).eq('access_code', accessCode).then();
      }
      // Show booster pack animation first for new cards
      setBoosterCard(card);
    } else {
      setSelectedCard(card);
    }
  };

  const triggerConfetti = (card: CardData) => {
    const defaults = { spread: 360, ticks: 100, gravity: 0.5, decay: 0.94, startVelocity: 30, shapes: ['star' as any] };
    if (card.type === 'Birthday') {
      confetti({ ...defaults, particleCount: 150, scalar: 2, colors: ['#ffc0cb', '#ff69b4', '#ffffff'] } as any);
    } else if (card.type === 'Core Memory') {
      confetti({ ...defaults, particleCount: 80, scalar: 1.2, colors: ['#fbbf24', '#ffffff'] } as any);
    } else {
      confetti({ spread: 70, particleCount: 40, origin: { y: 0.6 } });
    }
  };

  if (!isClient) return null;

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const getGlowStyle = (isOpened: boolean, cardType: string) => {
    if (!isOpened) return {};
    switch (cardType) {
      case 'Birthday': return { boxShadow: "0 0 20px rgba(255, 105, 180, 0.4)" };
      case 'Anniversary': return { boxShadow: "0 0 20px rgba(220, 38, 38, 0.4)" };
      case 'Core Memory': return { boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)" };
      case 'Secret': return { boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)" };
      case 'Holiday': return { boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)" };
      case 'Dinner': return { boxShadow: "0 0 15px rgba(0,0,0,0.2)" };
      default: return { boxShadow: "0 0 15px rgba(0,0,0,0.1)" };
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center p-4 md:p-8 font-sans text-stone-800">
      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="flex flex-col items-center md:items-start">
           <div className="flex items-center gap-4 mb-1">
             <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
             <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter text-stone-900 flex items-center gap-3">
               {MONTH_NAMES[currentMonth]} <span className="text-stone-300 font-mono text-2xl md:text-3xl font-light">{currentYear}</span>
             </h1>
             <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
           </div>
           <p className="text-stone-400 font-mono text-xs uppercase tracking-[0.3em] font-medium ml-1">Blind Box Experience</p>
        </div>
        <div className="flex gap-4">
          <Link href="/collection" className="flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-widest border border-stone-300 rounded-full hover:bg-stone-200 transition-colors"><Library className="w-4 h-4" /> <span className="hidden sm:inline">Collection</span></Link>
          <button onClick={resetCalendar} className="flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-widest border border-stone-300 rounded-full hover:bg-stone-200 transition-colors text-stone-500 hover:text-rose-500"><LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span></button>
        </div>
      </header>

      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="text-center text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-400 pb-2">{day}</div>))}
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
            const fullId = getCardId(currentYear, currentMonth, day);
            const isOpened = openedDays.includes(fullId);
            const card = getCardByDay(cards, day);
            return (
              <motion.div
                key={fullId}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDayClick(day)}
                style={getGlowStyle(isOpened, card?.type || '')}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl md:rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-500 shadow-sm hover:shadow-xl ${isOpened ? 'bg-white' : 'bg-stone-200 hover:bg-stone-300'} ${day === 26 && currentMonth === 10 ? 'ring-4 ring-pink-200 ring-offset-2' : ''}`}
              >
                {day === 26 && currentMonth === 10 && <Cake className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 text-pink-400 z-20 drop-shadow-md" />}
                {isOpened && card ? (
                  <>
                    <Image src={card.imageUrl} alt="" fill className="object-cover opacity-40" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="relative z-10 text-base md:text-2xl font-serif text-white">{day}</span>
                  </>
                ) : (
                  <span className={`text-base md:text-2xl font-serif ${day === 26 && currentMonth === 10 ? 'text-pink-500' : 'text-stone-500'}`}>{day}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <footer className="w-full max-w-5xl mt-20 md:mt-32 pt-12 border-t border-stone-200 flex flex-col md:flex-row gap-12 text-center md:text-left">
          <div className="flex-1"><h3 className="font-serif text-2xl font-bold mb-4 text-stone-900">The Blind Box Mystery</h3><p className="text-stone-500 leading-relaxed text-sm md:text-base">A year of digital collectibles, each uniquely crafted around our shared memories. Unbox one memory every day as we count down to our biggest moments.</p></div>
          <div className="flex-1">
            <h3 className="font-serif text-2xl font-bold mb-4 text-stone-900">TCG Mechanics</h3>
            <p className="text-stone-500 leading-relaxed text-sm md:text-base">
              Cards feature multiple rarities: <span className="text-stone-900 font-medium">Casual</span>, <span className="text-rose-600 font-medium">Dinner</span>, <span className="text-sky-600 font-medium font-bold">Holiday</span>, <span className="text-red-600 font-medium">Anniversary</span>, <span className="text-amber-500 font-medium">Core Memory</span>, <span className="text-purple-600 font-medium">Secret</span>, and the ultra-rare <span className="text-pink-600 font-bold">Birthday holographic</span>.
            </p>
          </div>
      </footer>

      {/* Booster Pack Opening Animation */}
      <AnimatePresence>
        {boosterCard && (
          <BoosterPackOpening
            key={boosterCard.id}
            card={boosterCard}
            onComplete={() => {
              triggerConfetti(boosterCard);
              setSelectedCard(boosterCard);
              setBoosterCard(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dialog.open && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-4 border-pink-100">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-sm"><span className="text-3xl">🤫</span></div>
                <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Notice</h3>
                <p className="text-stone-500 text-sm mb-6 leading-relaxed">{dialog.message}</p>
                <button onClick={() => setDialog({ open: false, message: '' })} className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg hover:bg-pink-600 transition-colors">Got it!</button>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} className="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-md">
             <div className="flex-1 flex flex-col items-center justify-center p-4">
               <motion.div key={selectedCard.id} layoutId={`polaroid-${selectedCard.id}`} className="my-auto"><Polaroid card={selectedCard} isNew={isNewCard} /></motion.div>
               <button onClick={() => setSelectedCard(null)} className="mt-8 px-8 py-3 bg-white text-black rounded-full font-mono text-xs uppercase tracking-widest hover:bg-pink-400 hover:text-white transition-all shadow-2xl">Close Memory</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showLetter && <LetterEnvelope onClose={() => setShowLetter(false)} />}
    </main>
  );
}
