'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import Image from 'next/image';
import { Rarity, CardData } from '@/lib/data';

// ─── Rarity Config ────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<Rarity, {
  packColor: string;
  stripColor: string;
  glowColor: string;
  glowRgb: string;
  particleColor: string[];
  idleEffect: 'none' | 'pulse' | 'sweep' | 'heartbeat' | 'dust' | 'lightning' | 'rainbow';
  flipDuration: number;
  screenEffect: 'none' | 'cold' | 'warm' | 'sepia' | 'glitch' | 'blast';
  particleShape: 'spark' | 'snowflake' | 'heart' | 'star' | 'arc' | 'confetti';
  particleCount: number;
}> = {
  Casual: { packColor: '#1e293b', stripColor: '#94a3b8', glowColor: '#94a3b8', glowRgb: '148,163,184', particleColor: ['#e2e8f0'], idleEffect: 'none', flipDuration: 0.30, screenEffect: 'none', particleShape: 'spark', particleCount: 0 },
  Dinner: { packColor: '#0f172a', stripColor: '#fbbf24', glowColor: '#f59e0b', glowRgb: '245,158,11', particleColor: ['#fbbf24', '#ef4444'], idleEffect: 'pulse', flipDuration: 0.30, screenEffect: 'warm', particleShape: 'spark', particleCount: 12 },
  Holiday: { packColor: '#0c1a3a', stripColor: '#3b82f6', glowColor: '#3b82f6', glowRgb: '59,130,246', particleColor: ['#93c5fd', '#ffffff'], idleEffect: 'sweep', flipDuration: 0.35, screenEffect: 'cold', particleShape: 'snowflake', particleCount: 20 },
  Anniversary: { packColor: '#1a0000', stripColor: '#ef4444', glowColor: '#ef4444', glowRgb: '239,68,68', particleColor: ['#ef4444', '#fbbf24'], idleEffect: 'heartbeat', flipDuration: 0.50, screenEffect: 'warm', particleShape: 'heart', particleCount: 15 },
  'Core Memory': { packColor: '#1a1200', stripColor: '#f59e0b', glowColor: '#f59e0b', glowRgb: '245,158,11', particleColor: ['#fbbf24', '#fff7ed'], idleEffect: 'dust', flipDuration: 0.40, screenEffect: 'sepia', particleShape: 'star', particleCount: 30 },
  Secret: { packColor: '#0a0014', stripColor: '#7c3aed', glowColor: '#7c3aed', glowRgb: '124,58,237', particleColor: ['#a78bfa', '#c4b5fd'], idleEffect: 'lightning', flipDuration: 0.55, screenEffect: 'glitch', particleShape: 'arc', particleCount: 12 },
  Birthday: { packColor: '#0f0f1a', stripColor: '#ff69b4', glowColor: '#ff69b4', glowRgb: '255,105,180', particleColor: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'], idleEffect: 'rainbow', flipDuration: 0.50, screenEffect: 'blast', particleShape: 'confetti', particleCount: 50 },
};

// ─── Phase Enum ───────────────────────────────────────────────────────────────
type Phase =
  | 'idle'           // pack floating, waiting for tap
  | 'zoom'           // pack zooms to center
  | 'shake'          // pre-tear buildup
  | 'tear'           // the rip + burst
  | 'reveal'         // card rises, facing back
  | 'await_entry'    // waiting for user to enter memory
  | 'flipping'       // card auto-flipping
  | 'done';          // animation finished → call onComplete

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: string;
  rotation: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BoosterPackOpening({
  card,
  onComplete,
}: {
  card: CardData;
  onComplete: () => void;
}) {
  const cfg = RARITY_CONFIG[card.type];
  const [phase, setPhase] = useState<Phase>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [showRays, setShowRays] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [screenTint, setScreenTint] = useState<string | null>(null);
  const [chromatic, setChromatic] = useState(false);
  const [tearOpen, setTearOpen] = useState(false);
  const packX = useMotionValue(0);
  const packY = useMotionValue(0);
  const screenX = useMotionValue(0);
  const screenY = useMotionValue(0);

  // Generate particles once per reveal
  const spawnParticles = useCallback(() => {
    const count = cfg.particleCount;
    if (count === 0) return;
    const ps: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 80;
      return {
        id: i,
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: cfg.particleColor[i % cfg.particleColor.length],
        size: 4 + Math.random() * 8,
        shape: cfg.particleShape,
        rotation: Math.random() * 360,
      };
    });
    setParticles(ps);
  }, [cfg]);

  // Audio helper
  const playSfx = useCallback((url: string, volume = 0.5) => {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.play().catch(e => console.log('SFX block:', e));
    } catch (e) { /* silent */ }
  }, []);

  // Orchestration Part 1: Unboxing
  const handleTap = useCallback(async () => {
    if (phase !== 'idle') return;

    // 1 → Zoom
    setPhase('zoom');

    // SFX: Initial pack tap sound
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', 0.4);

    // Start continuous rumble immediately
    animate(screenX, [0, -1, 1, -1, 0.5, -0.5, 0], { duration: 0.3, repeat: Infinity, ease: "linear" });
    animate(screenY, [0, 0.5, -0.5, 1, -1, 0.5, 0], { duration: 0.3, repeat: Infinity, ease: "linear" });
    animate(packX, [0, -3, 3, -2, 2, 0], { duration: 0.4, repeat: Infinity, ease: "linear" });
    animate(packY, [0, 2, -2, 1, -1, 0], { duration: 0.4, repeat: Infinity, ease: "linear" });

    await sleep(350);

    // 2 → Shake buildup (Intensify)
    setPhase('shake');
    animate(screenX, [0, -3, 3, -1.5, 1.5, 0], { duration: 0.2, repeat: Infinity, ease: "linear" });
    animate(screenY, [0, 1.5, -1.5, 3, -3, 0], { duration: 0.2, repeat: Infinity, ease: "linear" });
    animate(packX, [0, -10, 10, -6, 6, 0], { duration: 0.15, repeat: Infinity, ease: "linear" });
    animate(packY, [0, 6, -6, 10, -10, 0], { duration: 0.15, repeat: Infinity, ease: "linear" });

    await sleep(600);

    // 3 → Tear + burst
    setPhase('tear');
    setTearOpen(true);
    setShowCard(true); // Start card rise while pack breaks

    // SFX: Tear/Burst sound
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 0.6);

    // Final violent screen impact shake (overrides rumble)
    animate(screenX, [0, -25, 20, -15, 10, -5, 2, 0], { duration: 0.5, ease: "easeOut" });
    animate(screenY, [0, 15, -20, 12, -8, 4, -1, 0], { duration: 0.5, ease: "easeOut" });
    animate(packX, 0); // Stop pack internal shake as it breaks
    animate(packY, 0);

    // Flash
    setShowFlash(true);
    await sleep(80);
    setShowFlash(false);

    // Rays
    setShowRays(true);
    await sleep(400);
    setShowRays(false);

    // Apply screen tint
    if (cfg.screenEffect === 'cold') setScreenTint('hue-rotate(10deg) saturate(1.4)');
    if (cfg.screenEffect === 'warm') setScreenTint('sepia(0.2) saturate(1.2)');
    if (cfg.screenEffect === 'sepia') setScreenTint('sepia(0.4) saturate(0.8)');
    if (cfg.screenEffect === 'glitch') {
      setChromatic(true);
      setTimeout(() => setChromatic(false), 300);
    }
    if (cfg.screenEffect === 'blast') {
      setShowFlash(true);
      await sleep(250);
      setShowFlash(false);
    }

    // 4 → Card reveal particles
    setPhase('reveal');
    spawnParticles();

    // Brief suspense while facing the back
    await sleep(1000);
    setTimeout(() => setScreenTint(null), 1200);

    // Auto-transition to the Polaroid modal (which starts on its back)
    setPhase('done');
    onComplete();
  }, [phase, packX, packY, screenX, screenY, cfg, spawnParticles, onComplete]);



  // Birthday auto-hype on idle
  const isBirthday = card.type === 'Birthday';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.96)',
        x: screenX,
        y: screenY
      }}
    >
      {/* Screen Tint Overlay */}
      <AnimatePresence>
        {screenTint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ backdropFilter: screenTint }}
          />
        )}
      </AnimatePresence>

      {/* Chromatic Aberration (Secret) */}
      <AnimatePresence>
        {chromatic && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.06 }}
              className="absolute inset-0 pointer-events-none z-20"
              style={{ background: 'rgba(255,0,0,0.15)', transform: 'translateX(-4px)' }}
            />
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.06 }}
              className="absolute inset-0 pointer-events-none z-20"
              style={{ background: 'rgba(0,0,255,0.15)', transform: 'translateX(4px)' }}
            />
          </>
        )}
      </AnimatePresence>

      {/* White Flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: cfg.screenEffect === 'blast' ? 1 : 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
            className="absolute inset-0 bg-white pointer-events-none z-30"
          />
        )}
      </AnimatePresence>

      {/* Birthday Rainbow Viewport Vignette */}
      {isBirthday && phase !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.3] }}
          transition={{ duration: 2 }}
          className="absolute inset-0 pointer-events-none z-5"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255,105,180,0.3) 100%)',
            boxShadow: 'inset 0 0 80px rgba(255,105,180,0.4)',
          }}
        />
      )}

      {/* Light Rays (burst) */}
      <AnimatePresence>
        {showRays && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0, opacity: 0.9 }}
                animate={{ scaleY: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute origin-bottom"
                style={{
                  width: 2,
                  height: 90,
                  background: `linear-gradient(to top, ${cfg.glowColor}, transparent)`,
                  transform: `rotate(${i * 45}deg) translateY(-50px)`,
                  transformOrigin: 'bottom center',
                  bottom: '50%',
                  left: '50%',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
        <AnimatePresence>
          {particles.map(p => (
            <ParticleEl key={p.id} particle={p} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── THE PACK ─────────────────────────────────── */}
      <AnimatePresence>
        {phase !== 'reveal' && phase !== 'done' && (
          // Outer wrapper: handles entry/exit scale+opacity, idle float on Y
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 60 }}
            animate={
              phase === 'idle'
                ? { scale: 1, opacity: 1, y: [0, -4, 0], transition: { scale: { type: 'spring', stiffness: 280, damping: 22 }, opacity: { duration: 0.5 }, y: { delay: 0.5, repeat: Infinity, duration: 3, ease: 'easeInOut' } } }
                : phase === 'zoom'
                  ? { scale: 1.15, opacity: 1, y: 0 }
                  : { scale: 1.1, opacity: 1, y: 0 }
            }
            exit={{ scale: 0.6, opacity: 0, y: 80, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={handleTap}
            className="relative cursor-pointer select-none z-50"
            style={{ width: 380, height: 580, perspective: 1200 }}
          >
            {/* Inner wrapper: handles shake via MotionValues (x/y offset only) */}
            <motion.div
              style={{ x: packX, y: packY, width: '100%', height: '100%' }}
            >
              {/* TOP HALF OF THE PACK */}
              <motion.div
                initial={false}
                animate={tearOpen ? { y: -400, rotate: -15, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeIn" }}
                style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 55%)' }}
              >
                <Pack card={card} cfg={cfg} phase={phase} />
              </motion.div>

              {/* BOTTOM HALF OF THE PACK */}
              <motion.div
                initial={false}
                animate={tearOpen ? { y: 400, rotate: 20, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeIn" }}
                style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 55%, 100% 45%, 100% 100%, 0 100%)' }}
              >
                <Pack card={card} cfg={cfg} phase={phase} />
              </motion.div>
            </motion.div>

            {/* Tap hint */}
            {phase === 'idle' && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-widest whitespace-nowrap"
                style={{ color: cfg.stripColor }}
              >
                Tap to open
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARD REVEAL ────────────────────────────── */}
      <AnimatePresence>
        {showCard && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <CardReveal card={card} cfg={cfg} flipped={cardFlipped} />
          </div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      {phase !== 'done' && (
        <button
          onClick={onComplete}
          className="absolute bottom-6 right-6 text-xs font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors z-50"
        >
          Skip →
        </button>
      )}
    </motion.div>
  );
}

// ─── Pack visual ─────────────────────────────────────────────────────────────
function Pack({ card, cfg, phase }: {
  card: CardData;
  cfg: typeof RARITY_CONFIG[Rarity];
  phase: Phase;
}) {
  const isBirthday = card.type === 'Birthday';
  const isLightning = cfg.idleEffect === 'lightning';

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-sky-100"
      style={{
        boxShadow: `0 0 40px rgba(${cfg.glowRgb}, ${phase === 'shake' ? 0.7 : 0.25}), 0 20px 60px rgba(0,0,0,0.8)`,
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* Moving Holographic Foil (Foil effect) */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{
          backgroundPosition: { repeat: Infinity, duration: 5, ease: "linear" },
          opacity: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        }}
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(255,255,0,0.2) 20%, rgba(0,255,0,0.2) 40%, rgba(0,255,255,0.2) 60%, rgba(0,0,255,0.2) 80%, rgba(255,0,255,0.2) 100%)',
          backgroundSize: '400% 400%',
          mixBlendMode: 'color-dodge',
        }}
      />

      {/* Sun/Ray theme element in top left */}
      <div className="absolute top-4 left-4 w-12 h-12 opacity-40">
        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md" />
        <div className="absolute inset-2 border-2 border-white rounded-full" />
      </div>

      {/* Mountains from card back (simplified) */}
      <div className="absolute bottom-0 inset-x-0 h-[40%] z-5 opacity-40 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-full bg-emerald-500" style={{ clipPath: "polygon(0 40%, 15% 15%, 35% 45%, 55% 10%, 75% 55%, 90% 25%, 100% 45%, 100% 100%, 0% 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-emerald-600" style={{ clipPath: "polygon(0 50%, 25% 25%, 50% 65%, 75% 15%, 100% 55%, 100% 100%, 0% 100%)" }} />
      </div>

      {/* Logo area */}
      <div className="absolute inset-x-0 top-12 flex flex-col items-center z-20 select-none">
        <span className="text-stone-800 font-serif font-black text-2xl tracking-tight drop-shadow-sm">MiAn TCG</span>
        <span className="text-stone-500 font-mono text-[9px] tracking-[0.4em] uppercase mt-0.5">Authentic Archive</span>
      </div>

      {/* Center Rarity Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3 mt-4">
        <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-sm border-2 border-white shadow-inner flex items-center justify-center overflow-hidden">
          <RarityIcon type={card.type} color={cfg.stripColor} size="large" />
          {/* Secondary internal shimmer */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />
        </div>
        <div className="px-4 py-1 rounded-full bg-stone-900/10 backdrop-blur-md border border-stone-200/50">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-stone-700">
            {card.type} Pack
          </span>
        </div>
      </div>

      {/* Seam glow where it will tear */}
      <AnimatePresence>
        {phase === 'shake' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute inset-x-0 h-4 pointer-events-none z-30"
            style={{ top: '48%', background: `radial-gradient(ellipse at center, ${cfg.glowColor}, transparent 80%)` }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Card Reveal ─────────────────────────────────────────────────────────────
function CardReveal({ card, cfg, flipped }: { card: CardData; cfg: typeof RARITY_CONFIG[Rarity]; flipped: boolean }) {
  const isBirthday = card.type === 'Birthday';

  return (
    <motion.div
      layoutId={`polaroid-${card.id}`}
      initial={{ y: 60, opacity: 0, scale: 0.7 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        x: [0, -20, 15, -10, 5, -2, 0, -1, 1], // Impact shake then idle jitter
        rotate: [0, -5, 4, -3, 2, -1, 0, -0.5, 0.5]
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring', stiffness: 280, damping: 22,
        x: {
          times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 1],
          repeat: Infinity,
          duration: 3,
          ease: "linear"
        },
        rotate: {
          times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 1],
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut"
        }
      }}
      className="flex flex-col items-center gap-6"
      style={{ perspective: 1000 }}
    >
      {/* Card shell with flip */}
      <motion.div
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: cfg.flipDuration, type: 'spring', stiffness: 200, damping: 20 }}
        className="relative"
        style={{ width: 320, height: 448, transformStyle: 'preserve-3d' }}
      >
        {/* FRONT (card face - identical styling to Polaroid inner content) */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-2 bg-stone-900"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg) translateZ(1px)',
            boxShadow: flipped ? `0 0 ${isBirthday ? 80 : 50}px rgba(${cfg.glowRgb}, ${isBirthday ? 0.8 : 0.5})` : 'none',
            border: `1px solid rgba(${cfg.glowRgb}, 0.4)`,
          }}
        >
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt={card.type}
              fill
              className="object-cover pointer-events-none z-0"
              style={{ objectPosition: card.objectPosition || "center" }}
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-10" />

          {/* Text overlay matching Polaroid */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 z-40 text-white select-none pointer-events-none">
            <h3 className="text-xl font-bold font-serif whitespace-nowrap drop-shadow-md">{card.type}</h3>
            <p className="text-[9px] mb-2 font-mono tracking-tighter uppercase text-white/70">{card.date} • {card.location}</p>
            <div className="bg-white/10 border-white/5 p-2 rounded-xl backdrop-blur-md border shadow-lg max-h-[60%] overflow-y-auto hidden-scrollbar pointer-events-auto">
              <p className="text-[10px] leading-tight italic">&quot;{card.loveNote}&quot;</p>
            </div>
          </div>

          {/* Birthday prism overlay */}
          {isBirthday && (
            <motion.div
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(255,0,0,0.3), rgba(255,127,0,0.3), rgba(255,255,0,0.3), rgba(0,255,0,0.3), rgba(0,255,255,0.3), rgba(0,0,255,0.3), rgba(255,0,255,0.3), rgba(255,0,0,0.3))',
                backgroundSize: '400% 100%',
                mixBlendMode: 'color-dodge',
              }}
            />
          )}

          {/* Glitch scan lines (Secret) */}
          {card.type === 'Secret' && flipped && (
            <>
              <motion.div
                animate={{ y: ['-100%', '200%'] }}
                transition={{ repeat: 2, duration: 0.08 }}
                className="absolute inset-x-0 h-1 bg-purple-300/40 pointer-events-none z-20"
              />
              <motion.div
                animate={{ y: ['200%', '-100%'] }}
                transition={{ repeat: 2, duration: 0.12, delay: 0.05 }}
                className="absolute inset-x-0 h-0.5 bg-blue-300/30 pointer-events-none z-20"
              />
            </>
          )}
        </div>

        {/* BACK Face */}
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

      {/* Instruction text */}
      <AnimatePresence>
        {flipped && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-mono uppercase tracking-widest text-white/40"
          >
            Opening memory...
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Particle Element ─────────────────────────────────────────────────────────
function ParticleEl({ particle: p }: { particle: Particle }) {
  const shape = p.shape;

  const content: Record<string, string> = {
    spark: '●',
    snowflake: '❄',
    heart: '♥',
    star: '✦',
    arc: '×',
    confetti: '■',
  };

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rotation }}
      animate={{
        x: p.vx,
        y: p.vy + 60,  // gravity
        opacity: 0,
        scale: shape === 'confetti' ? [1, 0.8, 0.4] : 0.2,
        rotate: p.rotation + (Math.random() > 0.5 ? 180 : -180),
      }}
      transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut' }}
      exit={{ opacity: 0 }}
      className="absolute pointer-events-none select-none"
      style={{
        color: p.color,
        fontSize: p.size,
        textShadow: `0 0 8px ${p.color}`,
        fontFamily: 'monospace',
      }}
    >
      {content[shape] ?? '●'}
    </motion.div>
  );
}

// ─── Dust Motes (Core Memory idle) ───────────────────────────────────────────
function DustMotes({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 3,
            height: 3 + Math.random() * 3,
            background: color,
            left: `${15 + i * 17}%`,
            bottom: 0,
            filter: 'blur(1px)',
          }}
          animate={{
            y: [0, -(40 + i * 8)],
            x: [0, (i % 2 === 0 ? 1 : -1) * (8 + Math.random() * 10)],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2 + i * 0.3,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Lightning Corners (Secret idle) ─────────────────────────────────────────
function LightningCorners({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map((pos, i) => (
        <motion.div
          key={i}
          className={`absolute ${pos} w-3 h-3`}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{
            repeat: Infinity,
            duration: 0.3,
            delay: Math.random() * 2,
            repeatDelay: 0.5 + Math.random() * 1.5,
          }}
          style={{ color, fontSize: 12, textShadow: `0 0 8px ${color}` }}
        >
          ⚡
        </motion.div>
      ))}
    </div>
  );
}

// ─── Rarity Icon ─────────────────────────────────────────────────────────────
function RarityIcon({ type, color, size = 'normal' }: { type: Rarity; color: string; size?: 'normal' | 'large' }) {
  const emoji: Record<Rarity, string> = {
    Casual: '☁️', Dinner: '🍷', Holiday: '⚡', Anniversary: '❤️',
    'Core Memory': '🌟', Secret: '👻', Birthday: '🎂',
  };
  const sz = size === 'large' ? 'text-5xl' : 'text-2xl';
  return (
    <div className={`${sz} drop-shadow-lg`} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
      {emoji[type]}
    </div>
  );
}

// ─── Util ─────────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
