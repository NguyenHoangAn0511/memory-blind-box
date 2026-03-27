'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MailOpen } from 'lucide-react';

export default function LetterEnvelope({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'closed' | 'opening' | 'reading'>('closed');

  const handleOpen = () => {
    setStep('opening');
    setTimeout(() => {
      setStep('reading');
    }, 1500); // Wait for envelope open & letter slide out animation
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {step === 'reading' && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {step !== 'reading' ? (
          <motion.div
            key="envelope"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.5 } }}
            className="relative w-full max-w-sm aspect-[4/3] flex flex-col items-center justify-center cursor-pointer"
            onClick={step === 'closed' ? handleOpen : undefined}
          >
            {/* The Envelope */}
            <div className="absolute inset-0 bg-rose-200 rounded-xl shadow-2xl overflow-hidden shadow-pink-900/40 overflow-visible">

              {/* Back flap (inside) */}
              <div
                className="absolute inset-x-0 top-0 h-1/2 bg-pink-300 origin-top"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  zIndex: 10
                }}
              />

              {/* The Letter inside sliding up */}
              <motion.div
                initial={{ y: "10%" }}
                animate={step === 'opening' ? { y: "-60%" } : { y: "10%" }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="absolute inset-x-4 top-4 bottom-4 bg-pink-50 rounded shadow-inner flex items-start justify-center p-6 z-20"
              >
                <div className="w-full h-full border border-pink-200 p-2 flex flex-col items-center justify-start opacity-50">
                  <div className="w-1/2 h-1 bg-pink-300 rounded mb-4" />
                  <div className="w-3/4 h-1 bg-pink-300 rounded mb-2" />
                  <div className="w-5/6 h-1 bg-pink-300 rounded mb-2" />
                  <div className="w-2/3 h-1 bg-pink-300 rounded mb-2" />
                </div>
              </motion.div>

              {/* Bottom fold */}
              <div
                className="absolute inset-0 bg-rose-50 z-30 flex flex-col justify-end items-center pb-4"
                style={{ clipPath: 'polygon(0 100%, 50% 40%, 100% 100%, 100% 100%, 0 100%)' }}
              >
                <span className="text-pink-400 font-serif italic text-lg drop-shadow-sm">From: An</span>
              </div>
              {/* Left fold */}
              <div
                className="absolute inset-0 bg-pink-100 z-30"
                style={{ clipPath: 'polygon(0 0, 50% 50%, 0 100%)', filter: 'brightness(0.98)' }}
              />
              {/* Right fold */}
              <div
                className="absolute inset-0 bg-pink-100 z-30"
                style={{ clipPath: 'polygon(100% 0, 50% 50%, 100% 100%)', filter: 'brightness(0.97)' }}
              />

              {/* Top Flap Wrapper (opens up) */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={step === 'opening' ? { rotateX: -180, zIndex: 5 } : { rotateX: 0, zIndex: 40 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-x-0 top-0 h-[65%] origin-top"
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* The actual triangle background with clipPath */}
                <div
                  className="absolute inset-0 bg-pink-200"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                />

                {/* Wax Seal */}
                <motion.div
                  animate={step === 'opening' ? { opacity: 0 } : { opacity: 1 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-12 h-12 bg-rose-400 rounded-full shadow-md flex items-center justify-center border-2 border-rose-500"
                >
                  <span className="text-rose-100 font-serif font-bold text-xl">M</span>
                </motion.div>
              </motion.div>

            </div>

            {step === 'closed' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-16 text-white/80 font-mono tracking-widest text-sm uppercase flex items-center gap-2"
              >
                <MailOpen className="w-4 h-4" />
                Tap to open
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="letter"
            initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
            className="w-full max-w-2xl bg-pink-50 shadow-2xl shadow-pink-900/30 rounded-sm p-8 md:p-12 relative overflow-y-auto max-h-[90vh]"
            style={{ backgroundImage: "radial-gradient(#fbcfe8 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          >
            {/* Stamp/Deco */}
            <div className="absolute top-8 right-8 w-16 h-16 border-2 border-pink-300 border-dashed rounded-full flex flex-col items-center justify-center opacity-60 transform rotate-12 bg-pink-100/50 shadow-sm">
              <span className="text-pink-500 font-serif uppercase text-[9px] text-center font-bold">Birthday</span>
              <span className="text-pink-400 font-serif uppercase text-[8px] text-center w-10">Edition</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-serif text-pink-600 mb-8 mt-4">My Dearest,</h2>

            <div className="space-y-6 text-stone-700 font-serif leading-relaxed text-lg md:text-xl">
              <p>
                If you are reading this, it means you have uncovered every single memory we've hidden away for this month.
              </p>
              <p>
                Seeing all these moments together—the quiet dinners, the grand holidays, the silly casual days—reminds me of how incredibly lucky I am to share this journey with you. Each card isn't just a photograph; it's a testament to the beautiful life we are building together.
              </p>
              <p>
                Thank you for every smile, every adventure, and every quiet moment we've shared. I cherish these memories more than words can say, and I cannot wait to create a thousand more with you.
              </p>
              <p>
                Here is to our past, our present, and our beautiful future.
              </p>
            </div>

            <div className="mt-12 text-right">
              <p className="text-pink-500 font-serif text-lg mb-2">With all my love,</p>
              <p className="text-4xl font-serif text-pink-600 italic signature decoration-pink-300 underline underline-offset-8">Yours Forever</p>
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-pink-400 text-white font-serif text-lg rounded-full shadow-lg hover:bg-pink-500 hover:shadow-pink-400/50 transition-all hover:-translate-y-1"
              >
                Keep these memories safe
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
