'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, ChevronRight } from 'lucide-react';
import { Letter } from '@/lib/data';

export default function LetterBox({ 
  unlockedLetters, 
  allLetters, 
  onOpenLetter, 
  onClose 
}: { 
  unlockedLetters: string[], 
  allLetters: Letter[], 
  onOpenLetter: (letter: Letter) => void, 
  onClose: () => void 
}) {
  const lettersToShow = allLetters.filter(l => unlockedLetters.includes(l.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[150] bg-stone-100/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl h-[80vh] bg-white rounded-[2.5rem] shadow-2xl border-4 border-stone-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-serif font-black text-stone-900">Letter Box</h2>
            <p className="text-stone-400 font-mono text-xs uppercase tracking-widest mt-1">
              Your secret messages ({lettersToShow.length})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {lettersToShow.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Mail className="w-16 h-16 mb-4" />
              <p className="font-serif text-xl">No letters yet...</p>
              <p className="text-sm font-mono mt-2">Open special memory cards to unlock secret messages.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lettersToShow.map((letter) => (
                <motion.div
                  key={letter.id}
                  whileHover={{ x: 10 }}
                  onClick={() => onOpenLetter(letter)}
                  className="group flex items-center gap-6 p-6 bg-stone-50 hover:bg-pink-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-pink-100"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-serif font-bold text-stone-800">{letter.title}</h3>
                    <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">{letter.date} • From {letter.sender}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-stone-50 border-t border-stone-100 text-center">
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em]">Authentic Archive Service</p>
        </div>
      </div>
    </motion.div>
  );
}
