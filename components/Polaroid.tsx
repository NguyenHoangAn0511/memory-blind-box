'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useMotionTemplate, animate } from 'motion/react';
import Image from 'next/image';
import { CardData } from '@/lib/data';
import { Cake, Sparkles, Sun, Cloud, Heart, Star, Film, Ghost, Utensils, Zap } from 'lucide-react';
import ScratchOff from './ScratchOff';

const COLOR_GRADIENTS: Record<string, string> = {
  'Casual': "linear-gradient(135deg, #1e293b, #334155, #1e293b)",
  'Dinner': "linear-gradient(135deg, #0f172a, #000000, #0f172a)",
  'Holiday': "linear-gradient(135deg, #2563eb, #3b82f6, #1d4ed8)",
  'Anniversary': "linear-gradient(135deg, #991b1b, #ef4444, #7f1d1d)",
  'Core Memory': "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
  'Secret': "linear-gradient(135deg, #4c1d95, #7c3aed, #2e1065)",
  'Birthday': "linear-gradient(105deg, #ff4d4d, #f9cb28, #30e3ca, #11999e, #40514e, #2f89fc, #9356de)"
};

const HOLO_GRADIENTS: Record<string, string> = {
  'Casual': "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05))",
  'Dinner': "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05))",
  'Holiday': "linear-gradient(105deg, rgba(147,197,253,0.3), rgba(255,255,255,0.5), rgba(147,197,253,0.3))",
  'Anniversary': "linear-gradient(135deg, rgba(254,202,202,0.4), rgba(255,255,255,0.7), rgba(254,202,202,0.4))",
  'Core Memory': "linear-gradient(135deg, rgba(253,246,178,0.4), rgba(255,255,255,0.7), rgba(253,246,178,0.4))",
  'Secret': "linear-gradient(135deg, rgba(232,121,249,0.3), rgba(255,255,255,0.7), rgba(232,121,249,0.3))",
  'Birthday': "linear-gradient(135deg, rgba(255,0,0,0.5) 0%, rgba(255,154,0,0.5) 15%, rgba(255,255,0,0.5) 30%, rgba(0,255,0,0.5) 45%, rgba(0,255,255,0.5) 60%, rgba(0,0,255,0.3) 75%, rgba(255,0,255,0.3) 90%, rgba(255,0,0,0.3) 100%)"
};

export default function Polaroid({
  card,
  isNew = false,
  onReOpen,
  onFlip,
  overrides
}: {
  card: CardData;
  isNew?: boolean;
  onReOpen?: () => void;
  onFlip?: (isFront: boolean) => void;
  overrides?: {
    colorGradient?: string;
    holoGradient?: string;
    holoOpacity?: number;
    borderOpacity?: number;
    glareOpacity?: number;
    disableAnimation?: boolean;
    objectPosition?: string;
  };
}) {
  const [isFlipped, setIsFlipped] = useState(isNew);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isScratchCompleted, setIsScratchCompleted] = useState(!isNew);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const disableAnimation = overrides?.disableAnimation ?? false;
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-1, 1], [60, -60]);
  const rotateY = useTransform(mouseXSpring, [-1, 1], [-60, 60]);

  const bgX = useTransform(mouseXSpring, [-1, 1], ["-50%", "150%"]);
  const bgY = useTransform(mouseYSpring, [-1, 1], ["-50%", "150%"]);
  const bgPos = useMotionTemplate`${bgX} ${bgY}`;

  const prismRotate = useTransform(mouseXSpring, [-1, 1], [0, 360]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${bgX} ${bgY}, rgba(255,255,255,1.0) 5%, transparent 65%)`;

  useEffect(() => {
    const controlsX = animate(x, [x.get(), 0.2, -0.1, 0.1, -0.1, 0], { repeat: Infinity, repeatType: "mirror", duration: 7, ease: "easeInOut" });
    const controlsY = animate(y, [y.get(), -0.2, 0.1, -0.1, 0.1, 0], { repeat: Infinity, repeatType: "mirror", duration: 9, ease: "easeInOut" });
    return () => { controlsX.stop(); controlsY.stop(); };
  }, [x, y]);

  const rootSvgDataUri = useMemo(() => {
    let seed = Math.abs((card.type + card.date + card.location).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) || 12345;
    const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    let paths = '';

    if (card.type === 'Birthday') {
      const RAINBOW = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      for (let i = 0; i < 200; i++) {
        const cx = random() * 400; const cy = random() * 400; const size = random() * 25 + 8;
        const color = RAINBOW[Math.floor(random() * RAINBOW.length)];
        paths += `<rect x="${cx}" y="${cy}" width="${size}" height="${size}" transform="rotate(${random() * 360} ${cx} ${cy})" fill="${color}" opacity="0.4" />`;
      }
    } else if (card.type === 'Casual') {
      for (let i = 0; i < 400; i += 10) {
        paths += `<line x1="${i}" y1="0" x2="${i}" y2="400" stroke="white" stroke-width="0.5" opacity="0.5" />`;
        paths += `<line x1="0" y1="${i}" x2="400" y2="${i}" stroke="white" stroke-width="0.5" opacity="0.5" />`;
      }
    } else if (card.type === 'Dinner') {
      for (let i = 0; i < 200; i++) { paths += `<circle cx="${random() * 400}" cy="${random() * 400}" r="${random() * 1}" fill="white" opacity="0.8" />`; }
    } else if (card.type === 'Holiday') {
      for (let i = 0; i < 40; i++) {
        let cx = random() * 400; let cy = random() * 400; let s = random() * 8 + 4;
        paths += `<path d="M ${cx - s} ${cy} L ${cx + s} ${cy} M ${cx} ${cy - s} L ${cx} ${cy + s}" stroke="white" stroke-width="0.5" opacity="0.4" />`;
      }
    } else if (card.type === 'Anniversary') {
      for (let i = 0; i < 30; i++) {
        let cx = random() * 400; let cy = random() * 400;
        paths += `<path d="M ${cx} ${cy} A 5 5 0 0 1 ${cx + 10} ${cy} Q ${cx + 10} ${cy + 10} ${cx} ${cy + 15} Q ${cx - 10} ${cy + 10} ${cx - 10} ${cy} A 5 5 0 0 1 ${cx} ${cy}" fill="white" opacity="0.8" />`;
      }
    } else if (card.type === 'Core Memory') {
      for (let i = 0; i < 150; i++) {
        paths += `<circle cx="${random() * 400}" cy="${random() * 400}" r="${random() * 2.5}" fill="white" opacity="0.8" />`;
      }
    } else if (card.type === 'Secret') {
      for (let i = 0; i < 80; i++) {
        let x = random() * 400; let y = random() * 400;
        paths += `<line x1="${x}" y1="${y}" x2="${x + random() * 40}" y2="${y}" stroke="white" stroke-width="1" opacity="0.4" />`;
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><g>${paths}</g></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [card]);

  const baseColor = overrides?.colorGradient || card.colorGradient || COLOR_GRADIENTS[card.type] || COLOR_GRADIENTS['Casual'];
  const holoBorder = `${rootSvgDataUri}, ${baseColor}`;
  const currentHoloGradient = overrides?.holoGradient || card.holoGradient || HOLO_GRADIENTS[card.type] || HOLO_GRADIENTS['Casual'];
  const currentHoloOpacity = overrides?.holoOpacity ?? card.holoOpacity ?? 0.8;
  const currentBorderOpacity = overrides?.borderOpacity ?? card.borderOpacity ?? 1;
  const currentGlareOpacity = overrides?.glareOpacity ?? card.glareOpacity ?? 0.8;
  const currentObjectPosition = overrides?.objectPosition || card.objectPosition || "center";

  const prismBg = useMotionTemplate`conic-gradient(from ${prismRotate}deg at 50% 50%, rgba(255,0,0,${card.type === 'Birthday' ? 0.4 : 0.15}), rgba(255,127,0,${card.type === 'Birthday' ? 0.4 : 0.15}), rgba(255,255,0,${card.type === 'Birthday' ? 0.4 : 0.15}), rgba(0,255,0,${card.type === 'Birthday' ? 0.4 : 0.15}), rgba(0,255,255,${card.type === 'Birthday' ? 0.4 : 0.15}), rgba(0,0,255,${card.type === 'Birthday' ? 0.3 : 0.1}), rgba(75,0,130,${card.type === 'Birthday' ? 0.3 : 0.1}), rgba(148,0,211,${card.type === 'Birthday' ? 0.3 : 0.1}), rgba(255,0,0,${card.type === 'Birthday' ? 0.4 : 0.15}))`;

  const textColor = "text-white";
  const labelColor = "text-white/70";
  const noteBg = "bg-white/10 border-white/5";

  const playSfx = (url: string, volume = 0.5) => {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.play().catch(() => { });
    } catch (e) { }
  };

  const handleFlip = () => {
    // If we are looking at the front face of a new card and haven't finished scratching, prevent flipping it back
    if (isNew && !isFlipped && !isScratchCompleted) return;

    const newFlipped = !isFlipped;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 0.8);
    
    // If we are flipping from back to front for the first time
    if (newFlipped === false && !hasRevealed) {
      setHasRevealed(true);
      if (onFlip) onFlip(true);
    }
    
    setIsFlipped(newFlipped);
  };

  return (
    <div style={{ perspective: 1000 }} className={`flex justify-center items-center w-full h-full ${textColor}`}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d", touchAction: "none" }}
        initial={disableAnimation || isNew ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-[85vw] max-w-72 aspect-[63/88] cursor-pointer select-none group"
        onClick={handleFlip}
      >
        <motion.div
          style={{
            transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d",
            boxShadow: card.type === 'Birthday' ? "0 0 50px rgba(255, 105, 180, 0.4)" : card.type === 'Anniversary' ? "0 0 40px rgba(220, 38, 38, 0.4)" : card.type === 'Core Memory' ? "0 0 40px rgba(245, 158, 11, 0.4)" : card.type === 'Secret' ? "0 0 40px rgba(124, 58, 237, 0.4)" : "0 25px 50px -12px rgba(0,0,0,0.5)"
          }}
          initial={{ rotateY: isFlipped ? 180 : 0 }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.15 }}
          className="w-full h-full relative rounded-xl"
        >
          {/* Front Face */}
          <div
            style={{
              backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(0deg) translateZ(1px)",
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            className="absolute inset-0 rounded-xl overflow-hidden bg-stone-900 shadow-2xl"
          >
            {card.imageUrl ? <Image src={card.imageUrl} alt={card.type} fill className="object-cover pointer-events-none z-0" style={{ objectPosition: currentObjectPosition }} referrerPolicy="no-referrer" /> : <div className="absolute inset-0 bg-stone-800 z-0" />}

            {card.type !== 'Casual' && (
              <motion.div className="absolute inset-0 z-5 pointer-events-none" style={{ backgroundImage: prismBg, opacity: card.type === 'Birthday' ? 0.6 : 0.3 }} />
            )}

            <motion.div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundImage: holoBorder, backgroundSize: "300% 300%", backgroundPosition: bgPos, mixBlendMode: "overlay", opacity: currentBorderOpacity }} />
            <div className="absolute inset-x-0 top-0 h-[100%] z-15 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <motion.div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundImage: glareBg, mixBlendMode: "color-dodge", opacity: currentGlareOpacity * 1.5 }} />

            <div className="absolute top-2 right-2 z-[60] flex flex-col items-center gap-2">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} className={`bg-white/90 p-1.5 rounded-full shadow-lg border border-white/20`}>
                {card.type === 'Birthday' ? <Cake className="w-4 h-4 text-pink-500" /> : card.type === 'Secret' ? <Ghost className="w-4 h-4 text-purple-600" /> : card.type === 'Core Memory' ? <Film className="w-4 h-4 text-amber-500" /> : card.type === 'Dinner' ? <Utensils className="w-4 h-4 text-red-900" /> : card.type === 'Anniversary' ? <Heart className="w-4 h-4 text-red-600" /> : card.type === 'Holiday' ? <Zap className="w-4 h-4 text-blue-600" /> : <Sparkles className="w-4 h-4 text-slate-400" />}
              </motion.div>
            </div>

            {/* 3. Inner Content */}
            <div style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d", boxShadow: "0 0 15px rgba(0,0,0,0.2), inset 0 0 20px rgba(0,0,0,0.4)" }} className="absolute inset-3 z-20 rounded-lg overflow-hidden bg-black border border-stone-800">
              {card.imageUrl ? <Image src={card.imageUrl} alt={card.type} fill className="object-cover pointer-events-none z-0" style={{ objectPosition: currentObjectPosition }} referrerPolicy="no-referrer" /> : <div className="absolute inset-0 flex items-center justify-center bg-stone-900"><span className="text-stone-700 font-serif italic text-xs whitespace-nowrap">Uncaptured Moment</span></div>}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10`} />

              {card.type !== 'Casual' && <motion.div animate={{ opacity: isScratchCompleted ? currentBorderOpacity * 0.5 : 0 }} className="absolute inset-0 z-30 pointer-events-none" style={{ backgroundImage: rootSvgDataUri, backgroundSize: "300% 300%", backgroundPosition: bgPos, mixBlendMode: "overlay" }} />}
              {card.type !== 'Casual' && <motion.div animate={{ opacity: isScratchCompleted ? currentHoloOpacity * 0.6 : 0 }} className="absolute inset-0 z-30 pointer-events-none" style={{ backgroundImage: currentHoloGradient, backgroundSize: "300% 300%", backgroundPosition: bgPos, mixBlendMode: "overlay" }} />}

              <div style={{ transform: "translateZ(40px)" }} className={`absolute inset-0 flex flex-col justify-end p-4 z-40 ${textColor} select-none pointer-events-none`}>
                <h3 className="text-xl font-bold font-serif whitespace-nowrap drop-shadow-md">{card.type}</h3>
                <p className={`text-[9px] mb-2 font-mono tracking-tighter uppercase ${labelColor}`}>{card.date} • {card.location}</p>
                <div className={`${noteBg} p-2 rounded-xl backdrop-blur-md border shadow-lg max-h-[60%] overflow-y-auto hidden-scrollbar pointer-events-auto`}>
                  <p className="text-[10px] leading-tight italic">&quot;{card.loveNote}&quot;</p>
                </div>
              </div>
              <motion.div className="absolute inset-0 z-50 pointer-events-none" style={{ backgroundImage: glareBg, mixBlendMode: "overlay", opacity: currentGlareOpacity * 0.2 }} />
            </div>

            {/* Scratch Off Layer */}
            {isNew && (
              <div style={{ transform: "translateZ(50px)" }} className="absolute inset-3 z-[100] rounded-xl overflow-hidden pointer-events-auto">
                <ScratchOff 
                  width={600} 
                  height={800} 
                  onComplete={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 1.0);
                    setIsScratchCompleted(true);
                  }} 
                />
              </div>
            )}
          </div>

          {/* Back Face */}
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg) translateZ(1px)" }} className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl bg-sky-100 border-4 border-white flex flex-col justify-end">
            <div className="absolute top-12 left-12 w-20 h-20 z-0">
              <motion.div animate={{ scale: [1, 1.05, 1], rotate: 360 }} transition={{ scale: { duration: 4, repeat: Infinity }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }} className="relative w-full h-full flex items-center justify-center">
                {[...Array(8)].map((_, i) => (<div key={i} className="absolute w-1 h-24 bg-gradient-to-t from-yellow-300 to-transparent" style={{ transform: `rotate(${i * 45}deg) translateY(-2px)` }} />))}
                <div className="absolute inset-2 bg-yellow-400 rounded-full border-2 border-white shadow-xl flex items-center justify-center overflow-hidden"><div className="w-full h-full bg-gradient-to-tr from-yellow-500 to-white/40" /></div>
              </motion.div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-[70%] z-5 opacity-20"><div className="absolute inset-x-0 bottom-0 h-full bg-stone-900" style={{ clipPath: "polygon(0% 100%, 20% 40%, 40% 80%, 65% 10%, 85% 60%, 100% 30%, 100% 100%)" }} /></div>
            <div className="relative h-[48%] w-full z-20">
              <div className="absolute bottom-0 w-full h-[85%] bg-emerald-400 border-t border-white/20" style={{ clipPath: "polygon(0 40%, 15% 15%, 35% 45%, 55% 10%, 75% 55%, 90% 25%, 100% 45%, 100% 100%, 0% 100%)" }} />
              <div className="absolute bottom-0 w-full h-[65%] bg-emerald-500 border-t border-white/20" style={{ clipPath: "polygon(0 50%, 25% 25%, 50% 65%, 75% 15%, 100% 55%, 100% 100%, 0% 100%)" }} />
              <div className="absolute bottom-0 w-full h-[45%] bg-emerald-600 border-t border-white/20" style={{ clipPath: "polygon(0 45%, 30% 65%, 45% 35%, 65% 60%, 85% 40%, 100% 50%, 100% 100%, 0% 100%)" }} />
              <div className="absolute bottom-6 w-full text-center z-40 text-white"><h3 className="font-serif font-black text-3xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">MiAn TCG</h3><p className="font-mono text-[9px] font-bold tracking-[0.4em] uppercase mt-1">Authentic Archive</p></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-50 -mt-10 pointer-events-none">
              <motion.div animate={{ y: [0, -20, 0], rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative"><span className="text-7xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)]">🦄</span><motion.span animate={{ opacity: [1, 0, 1], scale: [1, 1.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-4 -right-2 text-2xl">✨</motion.span></motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
