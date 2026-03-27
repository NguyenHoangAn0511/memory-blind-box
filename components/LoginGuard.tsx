'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

// Set this to TRUE to enforce the strict "Wait until April 2026" rule during development
export const ENFORCE_DATE_LOCK = true;

// If Supabase is disconnected, we use a fallback local passcode
const FALLBACK_PASSCODE = 'HAPPYBIRTHDAY';

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Store connection
  const accessCode = useAppStore((state) => state.accessCode);
  const setAccessCode = useAppStore((state) => state.setAccessCode);
  const setOpenedDays = useAppStore((state) => state.setOpenedDays);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    setIsClient(true);
    const wasUnlocked = localStorage.getItem('unlocked') === 'true';
    const storedCode = localStorage.getItem('mian_access_code');

    if (wasUnlocked && storedCode) {
      setAccessCode(storedCode);
    }
  }, [setAccessCode]);

  // 2. React to Store Changes (Re-locks if accessCode is cleared)
  useEffect(() => {
    if (!accessCode) {
      setUnlocked(false);
      localStorage.removeItem('unlocked');
      localStorage.removeItem('mian_access_code');
    } else {
      setUnlocked(true);
      localStorage.setItem('unlocked', 'true');
      localStorage.setItem('mian_access_code', accessCode);

      // If we just unlocked, and have Supabase, sync data
      if (supabase && accessCode !== 'ADMIN') {
        supabase
          .from('profiles')
          .select('opened_days')
          .eq('access_code', accessCode)
          .single()
          .then(({ data }) => {
            if (data?.opened_days) {
              setOpenedDays(data.opened_days);
            }
          });
      }
    }
  }, [accessCode, setOpenedDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (code.toLowerCase() === 'iamnotadmin') {
      setAccessCode('ADMIN');
      window.location.href = '/admin';
      return;
    }

    setLoading(true);
    setError('');

    // If Supabase is configured, check the database
    if (supabase) {
      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('access_code', code.toUpperCase())
          .single();

        if (dbError || !data) {
          setError('Invalid access code.');
        } else {
          // Sync with the global store - this triggers the useEffect above
          setAccessCode(code.toUpperCase());
          if (data.opened_days) {
            setOpenedDays(data.opened_days);
          }
        }
      } catch (err) {
        setError('Database connection error.');
      }
    } else {
      // Fallback local logic before they plug in Supabase Keys
      if (code.toUpperCase() === FALLBACK_PASSCODE) {
        setAccessCode(code.toUpperCase());
      } else {
        setError('Invalid access code.');
      }
    }

    setLoading(false);
  };

  if (!isClient) return null;

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-pink-50 p-4 text-stone-800 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-pink-100 text-center relative overflow-hidden">
        {/* Cute deco */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-pink-100 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-multiply opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-200 translate-x-1/3 translate-y-1/3 rounded-full mix-blend-multiply opacity-50"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 mb-6 bg-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
            <span className="text-4xl">💌</span>
          </div>

          <h2 className="text-3xl font-serif text-pink-600 mb-2 drop-shadow-sm">MiAn TCG</h2>
          <p className="text-stone-500 mb-8 font-serif">Enter your secret code to unlock today&apos;s memory.</p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:ring focus:ring-pink-100 outline-none transition-all text-center tracking-widest uppercase font-mono text-xl shadow-inner bg-stone-50"
              placeholder="ACCESS CODE"
              autoComplete="off"
            />
            {error && <p className="text-rose-500 font-serif text-sm bg-rose-50 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-pink-400 text-white rounded-xl font-serif text-xl shadow-lg hover:bg-pink-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Unlock Memories'}
            </button>
          </form>

          {/* Helper msg for dev */}
          {!supabase && (
            <p className="text-[10px] text-stone-400 mt-6 font-mono">
              Database not detected. Local Fallback Code: {FALLBACK_PASSCODE}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
