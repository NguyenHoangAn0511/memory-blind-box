'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import Image from 'next/image';
import { Rarity, CardData } from '@/lib/data';
import Polaroid from '@/components/Polaroid';

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
  | 'reading'        // card revealed and interactive
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

    // SFX: Initial pack tap sound (Magic Sparkle)
    playSfx('https://assets.mixkit.co/active_storage/sfx/2620/2620-preview.mp3', 0.5);

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
    spawnParticles(); // Burst particles immediately

    // SFX: Tear/Burst sound
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 0.6);

    // Final violent screen impact shake
    animate(screenX, [0, -25, 20, -15, 10, -5, 2, 0], { duration: 0.5, ease: "easeOut" });
    animate(screenY, [0, 15, -20, 12, -8, 4, -1, 0], { duration: 0.5, ease: "easeOut" });
    animate(packX, 0); 
    animate(packY, 0);

    // Flash
    setShowFlash(true);
    await sleep(80);
    setShowFlash(false);

    // Rays
    setShowRays(true);
    
    // Apply screen tint effects
    if (cfg.screenEffect === 'cold') setScreenTint('hue-rotate(10deg) saturate(1.4)');
    if (cfg.screenEffect === 'warm') setScreenTint('sepia(0.2) saturate(1.2)');
    if (cfg.screenEffect === 'sepia') setScreenTint('sepia(0.4) saturate(0.8)');
    if (cfg.screenEffect === 'glitch') {
      setChromatic(true);
      setTimeout(() => setChromatic(false), 300);
    }
    
    if (cfg.screenEffect === 'blast') {
      setShowFlash(true);
    }

    // Reveal the card underneath the debris
    await sleep(150);
    setShowCard(true);

    if (cfg.screenEffect === 'blast') {
      await sleep(100);
      setShowFlash(false);
    }

    // Wait for the impact and debris to mostly clear
    await sleep(500);
    
    setShowRays(false);
    setPhase('reading');
  }, [phase, card, playSfx, packX, packY, screenX, screenY, cfg, spawnParticles]);

  const isBirthday = card.type === 'Birthday';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/90 backdrop-blur-md"
      style={{
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
        {phase !== 'reading' && phase !== 'done' && (
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
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            onClick={handleTap}
            className="relative cursor-pointer select-none z-50"
            style={{ width: 280, height: 440, perspective: 1000 }}
          >
            <motion.div style={{ x: packX, y: packY, width: '100%', height: '100%' }}>
              {/* TOP HALF */}
              <motion.div
                initial={false}
                animate={tearOpen ? { y: -400, rotate: -15, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeIn" }}
                style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 55%)' }}
              >
                <Pack card={card} cfg={cfg} phase={phase} />
              </motion.div>

              {/* BOTTOM HALF */}
              <motion.div
                initial={false}
                animate={tearOpen ? { y: 400, rotate: 20, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeIn" }}
                style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 55%, 100% 45%, 100% 100%, 0 100%)' }}
              >
                <Pack card={card} cfg={cfg} phase={phase} />
              </motion.div>
            </motion.div>

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

      {/* ── THE CARD ─────────────────────────────────── */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-[60] pointer-events-none"
          >
            <div className="relative pointer-events-auto">
              <Polaroid 
                card={card} 
                isNew={true} 
                onFlip={(isFront) => {
                  if (isFront) spawnParticles();
                }}
              />
              
              {phase === 'reading' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4"
                >
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 0.5);
                      setPhase('done');
                      onComplete();
                    }}
                    className="px-8 py-3 bg-white text-black rounded-full font-mono text-[10px] md:text-xs uppercase tracking-widest hover:bg-pink-400 hover:text-white transition-all shadow-2xl"
                  >
                    Keep Memory
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button - only show during pack phases */}
      {phase !== 'reading' && phase !== 'done' && (
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 0.5);
            onComplete();
          }}
          className="absolute bottom-6 right-6 text-xs font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors z-50"
        >
          Skip →
        </button>
      )}
    </motion.div>
  );
}

// ─── Pack visual ─────────────────────────────────────────────────────────────
function Pack({ card, cfg, phase }: { card: CardData; cfg: any; phase: Phase }) {
  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-sky-100"
      style={{
        boxShadow: `0 0 40px rgba(${cfg.glowRgb}, ${phase === 'shake' ? 0.7 : 0.25}), 0 20px 60px rgba(0,0,0,0.8)`,
        transition: 'box-shadow 0.3s',
      }}
    >
      <motion.div
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'], opacity: [0.15, 0.3, 0.15] }}
        transition={{ backgroundPosition: { repeat: Infinity, duration: 5, ease: "linear" }, opacity: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(255,255,0,0.2) 20%, rgba(0,255,0,0.2) 40%, rgba(0,255,255,0.2) 60%, rgba(0,0,255,0.2) 80%, rgba(255,0,255,0.2) 100%)',
          backgroundSize: '400% 400%',
          mixBlendMode: 'color-dodge',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-[40%] z-5 opacity-40 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-full bg-emerald-500" style={{ clipPath: "polygon(0 40%, 15% 15%, 35% 45%, 55% 10%, 75% 55%, 90% 25%, 100% 45%, 100% 100%, 0% 100%)" }} />
      </div>
      <div className="absolute inset-x-0 top-12 flex flex-col items-center z-20 select-none">
        <span className="text-stone-800 font-serif font-black text-2xl tracking-tight drop-shadow-sm">MiAn TCG</span>
        <span className="text-stone-500 font-mono text-[9px] tracking-[0.4em] uppercase mt-0.5">Authentic Archive</span>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3 mt-4">
        <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-sm border-2 border-white shadow-inner flex items-center justify-center overflow-hidden">
          <span className="text-4xl drop-shadow-lg">🦄</span>
        </div>
      </div>
    </div>
  );
}


// ─── Particle Element ─────────────────────────────────────────────────────────
function ParticleEl({ particle: p }: { particle: Particle }) {
  const content: Record<string, string> = { spark: '●', snowflake: '❄', heart: '♥', star: '✦', arc: '×', confetti: '■' };
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: p.rotation }}
      animate={{ x: p.vx, y: p.vy + 60, opacity: 0, scale: 0.2, rotate: p.rotation + 180 }}
      transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut' }}
      className="absolute pointer-events-none"
      style={{ color: p.color, fontSize: p.size, textShadow: `0 0 8px ${p.color}`, fontFamily: 'monospace' }}
    >
      {content[p.shape] ?? '●'}
    </motion.div>
  );
}

// ─── Util ─────────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
