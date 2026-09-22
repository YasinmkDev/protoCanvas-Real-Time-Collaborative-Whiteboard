import React, { useState } from 'react';
import { Sparkles, Heart, Zap, Coffee, CheckCircle2, Rocket } from 'lucide-react';

interface FloatingSticker {
  id: number;
  label: string;
  emoji: string;
  x: number;
  y: number;
  color: string;
}

const STICKERS = [
  { label: 'Ship It', emoji: '🚀', color: '#8169ff' },
  { label: 'Pure Magic', emoji: '✨', color: '#2563eb' },
  { label: 'Sub-50ms', emoji: '⚡', color: '#059669' },
  { label: 'Pixel Perfect', emoji: '📐', color: '#ea580c' },
  { label: 'Love This', emoji: '💜', color: '#db2777' },
  { label: 'Zero Conflicts', emoji: '🧠', color: '#7c3aed' },
];

export const PlayfulReactionStickerPad: React.FC = () => {
  const [floatingStickers, setFloatingStickers] = useState<FloatingSticker[]>([]);
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    'Ship It': 42,
    'Pure Magic': 89,
    'Sub-50ms': 63,
    'Pixel Perfect': 35,
    'Love This': 128,
    'Zero Conflicts': 74,
  });

  const handleTriggerSticker = (s: (typeof STICKERS)[0], e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newSticker: FloatingSticker = {
      id: Date.now() + Math.random(),
      label: s.label,
      emoji: s.emoji,
      x: rect.left + rect.width / 2 + (Math.random() * 60 - 30),
      y: rect.top - 20,
      color: s.color,
    };

    setFloatingStickers((prev) => [...prev, newSticker]);
    setCounts((prev) => ({ ...prev, [s.label]: (prev[s.label] || 0) + 1 }));

    // Remove after animation completes
    setTimeout(() => {
      setFloatingStickers((prev) => prev.filter((item) => item.id !== newSticker.id));
    }, 1400);
  };

  return (
    <div className="relative flex flex-col items-center py-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-handwriting text-2xl text-[#8169ff] -rotate-3 select-none">
          Leave a live workshop reaction:
        </span>
      </div>

      {/* Interactive Sticker Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl px-4">
        {STICKERS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={(e) => handleTriggerSticker(s, e)}
            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#e5e5ea] hover:border-[#8169ff] text-xs font-semibold text-[#181818] shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-base group-hover:rotate-12 transition-transform">{s.emoji}</span>
            <span>{s.label}</span>
            <span className="text-[10px] text-[#999999] font-mono bg-gray-100 px-1.5 py-0.5 rounded-full">
              {counts[s.label]}
            </span>
          </button>
        ))}
      </div>

      {/* Floating Animated Bursts */}
      {floatingStickers.map((st) => (
        <div
          key={st.id}
          className="fixed pointer-events-none z-50 animate-out fade-out slide-out-to-top-12 duration-1000 flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg"
          style={{
            left: st.x,
            top: st.y,
            backgroundColor: st.color,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span>{st.emoji}</span>
          <span>{st.label}</span>
        </div>
      ))}
    </div>
  );
};
