import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  accessCode: string;
  setAccessCode: (code: string) => void;
  openedDays: string[]; // GUID for cards: "YYYY-MM-DD" or similar
  setOpenedDays: (days: string[]) => void;
  openDay: (dayId: string) => void;
  cards: any[];
  setCards: (cards: any[]) => void;
  currentMonth: number;
  currentYear: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  resetCalendar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      accessCode: '',
      setAccessCode: (code) => set({ accessCode: code }),
      openedDays: [],
      setOpenedDays: (days) => set({ openedDays: days }),
      cards: [],
      setCards: (cards) => set({ cards }),
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      setMonth: (month) => set({ currentMonth: month }),
      setYear: (year) => set({ currentYear: year }),
      openDay: (dayId) => set((state) => ({ 
        openedDays: state.openedDays.includes(dayId) ? state.openedDays : [...state.openedDays, dayId] 
      })),
      resetCalendar: () => set({ 
        openedDays: [], 
        accessCode: '', 
        cards: [], 
        currentMonth: new Date().getMonth(), 
        currentYear: new Date().getFullYear() 
      }),
    }),
    {
      name: 'calendar-storage',
    }
  )
);
