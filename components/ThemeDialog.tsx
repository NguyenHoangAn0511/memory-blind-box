'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function ThemeDialog({ isOpen, message, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="w-full max-w-sm bg-pink-50 rounded-3xl shadow-2xl p-6 border-[6px] border-pink-200 relative text-center flex flex-col items-center"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-pink-400 hover:text-pink-600 transition-colors focus:outline-none">
              <X size={20} strokeWidth={3} />
            </button>
            <div className="w-16 h-16 bg-white rounded-full flex justify-center items-center mb-4 border-4 border-pink-200 shadow-md">
              <span className="text-2xl animate-pulse">⏳</span>
            </div>
            <h3 className="text-2xl font-serif text-pink-600 font-bold mb-2">Too Early!</h3>
            <p className="text-stone-600 font-sans leading-relaxed text-sm px-2">
              {message}
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-pink-400 text-white rounded-xl font-bold font-serif text-lg tracking-wider shadow-md hover:bg-pink-500 hover:shadow-lg transition-all active:scale-95"
            >
              Okay
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
