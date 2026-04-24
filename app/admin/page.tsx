'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import cardsData from '@/lib/cards.json';
import { CardData, Rarity } from '@/lib/data';
import Link from 'next/image';
import NextLink from 'next/link';
import { Save, ArrowLeft, LogOut, Upload, Zap, Image as ImageIcon, Settings, Calendar, Palette, Database, ChevronLeft, ChevronRight, RefreshCw, Sparkles, Wand2, Plus, Trash2, ArrowUp, ArrowDown, Film } from 'lucide-react';
import Polaroid from '@/components/Polaroid';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { getCardByDay } from '@/lib/data';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminPage() {
  const cards = useAppStore((state) => state.cards);
  const setCards = useAppStore((state) => state.setCards);
  const currentMonth = useAppStore((state) => state.currentMonth);
  const currentYear = useAppStore((state) => state.currentYear);
  const setMonth = useAppStore((state) => state.setMonth);
  const setYear = useAppStore((state) => state.setYear);

  const [selectedDay, setSelectedDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideshowFileInputRef = useRef<HTMLInputElement>(null);
  const [slideshowUploading, setSlideshowUploading] = useState(false);
  const [editCard, setEditCard] = useState<CardData | null>(null);
  const [color1, setColor1] = useState('#22c55e');
  const [color2, setColor2] = useState('#3b82f6');

  useEffect(() => {
    setIsClient(true);
    if (!supabase) return;
    supabase.from('cards').select('*').eq('month', currentMonth).eq('year', currentYear).order('day', { ascending: true }).then(({ data }) => {
      if (data) setCards(data); else setCards([]);
    });
  }, [setCards, currentMonth, currentYear]);

  useEffect(() => {
    const existing = getCardByDay(cards, selectedDay);
    if (existing) {
      setEditCard(existing);
      if (existing.colorGradient) {
        const colors = existing.colorGradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
        if (colors && colors.length >= 2) { setColor1(colors[0]); setColor2(colors[1]); }
      }
    } else {
      setEditCard({
        id: `card-${currentYear}-${currentMonth + 1}-${selectedDay}`,
        day: selectedDay, type: 'Casual', imageUrl: '',
        date: `${MONTH_NAMES[currentMonth]} ${selectedDay}, ${currentYear}`,
        location: 'TBD', loveNote: 'A beautiful memory...',
        month: currentMonth, year: currentYear
      });
    }
  }, [cards, selectedDay, currentMonth, currentYear]);

  const handleUpdate = (field: keyof CardData, value: any) => {
    if (!editCard) return;
    setEditCard({ ...editCard, [field]: value });
  };

  const updateGradient = (c1: string, c2: string) => {
    setColor1(c1); setColor2(c2);
    handleUpdate('colorGradient', `linear-gradient(to bottom right, ${c1}, ${c2})`);
  };

  const handleLogout = () => { useAppStore.getState().resetCalendar(); window.location.href = '/'; };
  const changeMonth = (dir: number) => {
    let newMonth = currentMonth + dir; let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear++; } else if (newMonth < 0) { newMonth = 11; newYear--; }
    setMonth(newMonth); setYear(newYear);
  };

  const suggestColorsFromImage = () => {
    if (!editCard?.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 50; canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      
      const picks: { r: number, g: number, b: number }[] = [];
      for (let i = 0; i < data.length; i += 20 * 4) {
        picks.push({ r: data[i], g: data[i+1], b: data[i+2] });
      }
      
      const rgbToHex = (r: number, g: number, b: number) => "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      
      // Select two distinct colors
      const c1 = picks[Math.floor(picks.length * 0.2)];
      const c2 = picks[Math.floor(picks.length * 0.8)];
      
      if (c1 && c2) {
        const hex1 = rgbToHex(c1.r, c1.g, c1.b);
        const hex2 = rgbToHex(c2.r, c2.g, c2.b);
        updateGradient(hex1, hex2);
      }
    };
    img.src = editCard.imageUrl;
  };

  const resetToDefaultStyle = () => {
    if (!editCard) return;
    setEditCard({ ...editCard, colorGradient: undefined, holoOpacity: undefined, borderOpacity: undefined, glareOpacity: undefined, objectPosition: undefined });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentYear}-${currentMonth}-${selectedDay}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `memories/${fileName}`;
      const { error } = await supabase.storage.from('memories').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(filePath);
      handleUpdate('imageUrl', publicUrl);
    } catch (err: any) { alert(`Upload error: ${err.message}`); } finally { setUploading(false); }
  };

  // Birthday slideshow image management
  const handleSlideshowFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !editCard) return;
    const currentImages = editCard.slideshowImages || [];
    if (currentImages.length >= 10) {
      alert('Maximum 10 slideshow images allowed!');
      return;
    }
    setSlideshowUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `slideshow-${currentYear}-${currentMonth}-${selectedDay}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `memories/${fileName}`;
      const { error } = await supabase.storage.from('memories').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(filePath);
      handleUpdate('slideshowImages', [...currentImages, publicUrl]);
    } catch (err: any) { alert(`Upload error: ${err.message}`); } finally { setSlideshowUploading(false); }
  };

  const addSlideshowUrl = (url: string) => {
    if (!editCard || !url.trim()) return;
    const currentImages = editCard.slideshowImages || [];
    if (currentImages.length >= 10) {
      alert('Maximum 10 slideshow images allowed!');
      return;
    }
    handleUpdate('slideshowImages', [...currentImages, url.trim()]);
  };

  const removeSlideshowImage = (index: number) => {
    if (!editCard) return;
    const currentImages = editCard.slideshowImages || [];
    handleUpdate('slideshowImages', currentImages.filter((_, i) => i !== index));
  };

  const moveSlideshowImage = (index: number, direction: 'up' | 'down') => {
    if (!editCard) return;
    const currentImages = [...(editCard.slideshowImages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentImages.length) return;
    [currentImages[index], currentImages[targetIndex]] = [currentImages[targetIndex], currentImages[index]];
    handleUpdate('slideshowImages', currentImages);
  };

  const handleSave = async () => {
    if (!supabase || !editCard) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('cards').upsert(editCard);
      if (error) throw error;
      setCards([...cards.filter(c => c.day !== selectedDay), editCard].sort((a, b) => a.day - b.day));
      alert("Saved Successfully!");
    } catch (e: any) { alert("Save Error: " + (e.message || "Unknown error")); }
    setSaving(false);
  };

  if (!isClient) return null;
  const rarities: Rarity[] = ['Casual', 'Dinner', 'Holiday', 'Anniversary', 'Core Memory', 'Secret', 'Birthday'];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-[450px] bg-white shadow-2xl z-20 overflow-y-auto max-h-screen border-r border-stone-200 flex flex-col">
        <header className="p-6 bg-stone-900 text-white flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <NextLink href="/" className="hover:text-pink-300 transition-colors"><ArrowLeft className="w-6 h-6" /></NextLink>
            <h1 className="text-xl font-serif font-bold tracking-tight">MiAn Editor</h1>
          </div>
          <button onClick={handleLogout} className="text-stone-400 hover:text-rose-400 transition-colors"><LogOut className="w-5 h-5" /></button>
        </header>

        <div className="p-6 space-y-8 flex-grow">
          <section className="bg-stone-50 p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 pl-2 border-l-2 border-stone-300">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Context</label>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors"><ChevronLeft /></button>
              <div className="text-center">
                <div className="font-serif font-bold text-lg">{MONTH_NAMES[currentMonth]}</div>
                <div className="text-xs font-mono text-stone-400 uppercase tracking-tighter">{currentYear}</div>
              </div>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors"><ChevronRight /></button>
            </div>
          </section>

          <section>
            <label className="flex items-center gap-2 text-xs font-black text-stone-400 uppercase tracking-widest mb-3"><Calendar className="w-3 h-3" /> Select Day</label>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 31 }).map((_, i) => i + 1).map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} className={`py-3 text-sm font-mono rounded-xl border-2 transition-all ${selectedDay === d ? 'bg-pink-500 text-white border-pink-500 shadow-xl' : 'bg-white text-stone-700 border-stone-100 hover:border-pink-200'}`}>{d}</button>
              ))}
            </div>
          </section>

          {editCard && (
            <>
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-xs font-black text-stone-400 uppercase tracking-widest"><Settings className="w-3 h-3" /> Content</label>
                  <button onClick={resetToDefaultStyle} className="text-[10px] bg-stone-100 px-3 py-1.5 rounded-full text-stone-500 hover:bg-stone-200 font-bold uppercase tracking-tighter">Revert</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-[10px] text-stone-400 font-bold ml-1 uppercase">Rarity</span><select value={editCard.type} onChange={(e) => handleUpdate('type', e.target.value)} className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-100">{rarities.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  <div><span className="text-[10px] text-stone-400 font-bold ml-1 uppercase">Banner</span><input type="text" value={editCard.date} onChange={(e) => handleUpdate('date', e.target.value)} className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs outline-none focus:border-pink-300" /></div>
                </div>
                <div><span className="text-[10px] text-stone-400 font-bold ml-1 uppercase">Location</span><input type="text" value={editCard.location} onChange={(e) => handleUpdate('location', e.target.value)} className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-pink-300" /></div>
                <div><span className="text-[10px] text-stone-400 font-bold ml-1 uppercase">Note</span><textarea value={editCard.loveNote} onChange={(e) => handleUpdate('loveNote', e.target.value)} rows={2} className="w-full px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl font-serif text-sm outline-none resize-none focus:ring-2 focus:ring-pink-100" /></div>
              </section>

              <section className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between mb-3 border-l-2 border-pink-400 pl-2">
                  <label className="flex items-center gap-2 text-xs font-black text-stone-900 uppercase tracking-widest"><Palette className="w-3 h-3 text-pink-500" /> Premium Tuning</label>
                  <button onClick={suggestColorsFromImage} className="text-[9px] bg-pink-100 text-pink-600 px-3 py-1.5 rounded-full font-black uppercase tracking-widest hover:bg-pink-200 transition-all flex items-center gap-2 group">
                    <Wand2 className="w-3 h-3 group-hover:rotate-12 transition-transform" /> Sync Tones
                  </button>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-stone-200">
                      <input type="color" value={color1} onChange={(e) => updateGradient(e.target.value, color2)} className="w-10 h-10 border-none rounded-lg cursor-pointer bg-transparent" />
                      <div className="flex-grow h-px bg-stone-100" />
                      <input type="color" value={color2} onChange={(e) => updateGradient(color1, e.target.value)} className="w-10 h-10 border-none rounded-lg cursor-pointer bg-transparent" />
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      {[{f:'borderOpacity', l:'Border'}, {f:'holoOpacity', l:'Foil'}, {f:'glareOpacity', l:'Gloss'}].map(o => (
                        <div key={o.f} className="flex flex-col items-center gap-1"><span className="text-[8px] text-stone-400 font-black uppercase">{o.l}</span><input type="range" min="0" max="1" step="0.05" value={(editCard as any)[o.f] ?? 1} onChange={(e) => handleUpdate(o.f as any, parseFloat(e.target.value))} className="w-full accent-pink-500" /></div>
                      ))}
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-stone-400 uppercase tracking-widest"><ImageIcon className="w-3 h-3" /> Media</label>
                <div className="flex gap-1 bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm focus-within:ring-2 focus-within:ring-pink-100">
                  <input type="text" placeholder="URL..." value={editCard.imageUrl} onChange={(e) => handleUpdate('imageUrl', e.target.value)} className="flex-grow px-4 py-3 font-mono text-[9px] outline-none" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-stone-900 text-white px-4 hover:bg-stone-800 disabled:opacity-50 transition-colors uppercase font-black text-[10px]">{uploading ? '...' : 'Upload'}</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                </div>
                
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold ml-1 uppercase block mb-3 text-center">Focal Alignment</span>
                  <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                    {['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'].map(pos => (
                      <button
                        key={pos}
                        onClick={() => handleUpdate('objectPosition', pos)}
                        className={`aspect-square rounded-md border-2 transition-all ${editCard.objectPosition === pos ? 'bg-pink-500 border-pink-500 shadow-sm' : 'bg-white border-stone-100 hover:border-pink-200 shadow-xs'}`}
                        title={pos}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Birthday Slideshow Section */}
              {editCard.type === 'Birthday' && (
                <section className="space-y-4 bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-2xl border-2 border-pink-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-2 text-xs font-black text-pink-600 uppercase tracking-widest">
                      <Film className="w-3 h-3" /> Birthday Slideshow
                    </label>
                    <span className="text-[9px] font-mono text-pink-400 uppercase tracking-wider">
                      {(editCard.slideshowImages || []).length}/10 images
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Upload up to 10 photos for an animated slideshow that cycles through on the Birthday card.
                  </p>

                  {/* Slideshow Image Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {(editCard.slideshowImages || []).map((imgUrl, idx) => (
                      <div key={`slide-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                        <img src={imgUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => moveSlideshowImage(idx, 'up')} disabled={idx === 0} className="p-1 bg-white/90 rounded-full hover:bg-white disabled:opacity-30 transition-all">
                            <ArrowUp className="w-3 h-3 text-stone-700" />
                          </button>
                          <button onClick={() => moveSlideshowImage(idx, 'down')} disabled={idx === (editCard.slideshowImages || []).length - 1} className="p-1 bg-white/90 rounded-full hover:bg-white disabled:opacity-30 transition-all">
                            <ArrowDown className="w-3 h-3 text-stone-700" />
                          </button>
                          <button onClick={() => removeSlideshowImage(idx)} className="p-1 bg-red-100 rounded-full hover:bg-red-200 transition-all">
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                        <div className="absolute top-1 left-1 bg-pink-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                          {idx + 1}
                        </div>
                      </div>
                    ))}

                    {/* Add Image Tile */}
                    {(editCard.slideshowImages || []).length < 10 && (
                      <button
                        onClick={() => slideshowFileInputRef.current?.click()}
                        disabled={slideshowUploading}
                        className="aspect-square rounded-xl border-2 border-dashed border-pink-300 flex flex-col items-center justify-center gap-1 hover:bg-pink-100/50 hover:border-pink-400 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {slideshowUploading ? (
                          <RefreshCw className="w-5 h-5 text-pink-400 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5 text-pink-400" />
                        )}
                        <span className="text-[8px] text-pink-400 font-bold uppercase">
                          {slideshowUploading ? 'Uploading...' : 'Add'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* URL input for slideshow */}
                  <div className="flex gap-1 bg-white rounded-xl overflow-hidden border border-pink-200 shadow-sm">
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      id="slideshow-url-input"
                      className="flex-grow px-3 py-2 font-mono text-[9px] outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          addSlideshowUrl(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('slideshow-url-input') as HTMLInputElement;
                        if (input) {
                          addSlideshowUrl(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-pink-500 text-white px-3 hover:bg-pink-600 transition-colors uppercase font-black text-[9px]"
                    >
                      Add URL
                    </button>
                  </div>

                  <input type="file" ref={slideshowFileInputRef} onChange={handleSlideshowFileUpload} className="hidden" accept="image/*" />
                </section>
              )}

              <div className="pt-4 pb-10">
                <button onClick={handleSave} disabled={saving} className="group relative w-full py-5 bg-pink-500 text-white rounded-[2rem] font-serif text-2xl font-black shadow-2xl hover:bg-pink-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Save className="w-7 h-7" /> <span>{saving ? 'Syncing...' : 'Save Creation'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-grow bg-stone-100 flex items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center text-stone-200/50 font-black text-[10vw] select-none uppercase pointer-events-none tracking-tighter mix-blend-multiply opacity-20">PREVIEW STUDIO</div>
        {editCard && (
          <div className="relative z-10 w-[280px] scale-[1.3] md:scale-[1.7]">
            <Polaroid key={`preview-${selectedDay}-${currentMonth}`} card={editCard} overrides={{ disableAnimation: true }} />
          </div>
        )}
      </div>
    </div>
  );
}
