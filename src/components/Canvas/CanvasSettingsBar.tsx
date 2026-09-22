import React, { useState, useRef, useEffect } from 'react';
import { CanvasSettings, GridStyle, CanvasBgTone } from '../../types';
import { Grid, Magnet, Palette, ChevronDown, Check } from 'lucide-react';

interface CanvasSettingsBarProps {
  settings: CanvasSettings;
  onChangeSettings: (newSettings: CanvasSettings) => void;
  onOpenTemplates: () => void;
}

export const CanvasSettingsBar: React.FC<CanvasSettingsBarProps> = ({
  settings,
  onChangeSettings,
  onOpenTemplates,
}) => {
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gridStyles: { id: GridStyle; label: string }[] = [
    { id: 'dots', label: 'Dot Grid' },
    { id: 'lines', label: 'Drafting Lines' },
    { id: 'isometric', label: 'Isometric Grid' },
    { id: 'none', label: 'Blank Canvas' },
  ];

  const bgTones: { id: CanvasBgTone; label: string; bg: string; border: string }[] = [
    { id: 'white', label: 'Clean White', bg: '#ffffff', border: '#e5e5ea' },
    { id: 'warm', label: 'Warm Draft', bg: '#faf8f5', border: '#e8e4df' },
    { id: 'blueprint', label: 'Blueprint Dark', bg: '#0f172a', border: '#334155' },
  ];

  return (
    <div
      ref={menuRef}
      id="canvas-settings-bar"
      className="fixed top-20 right-6 z-20 flex items-center gap-2"
    >
      {/* Templates Button */}
      <button
        type="button"
        id="btn-open-templates"
        onClick={onOpenTemplates}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-[#e5e5ea] hover:border-[#8169ff] text-[#181818] hover:text-[#8169ff] rounded-xl shadow-xs font-semibold text-xs transition-all active:scale-95"
        style={{
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <span className="text-purple-600">✨</span>
        <span>Templates</span>
      </button>

      {/* Snap to Grid Toggle */}
      <button
        type="button"
        id="btn-toggle-snap"
        onClick={() =>
          onChangeSettings({
            ...settings,
            snapToGrid: !settings.snapToGrid,
          })
        }
        title={settings.snapToGrid ? 'Snap to Grid is ON' : 'Snap to Grid is OFF'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all ${
          settings.snapToGrid
            ? 'bg-[#8169ff] text-white border-[#8169ff] shadow-xs'
            : 'bg-white/95 text-[#666666] border-[#e5e5ea] hover:text-[#181818]'
        }`}
        style={{
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Magnet size={13} className={settings.snapToGrid ? 'text-white' : 'text-[#888888]'} />
        <span>Snap</span>
      </button>

      {/* Grid & Canvas Look Popover Trigger */}
      <div className="relative">
        <button
          type="button"
          id="btn-grid-settings"
          onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-md border border-[#e5e5ea] hover:border-[#8169ff] rounded-xl text-xs font-semibold text-[#181818] shadow-xs transition-all"
          style={{
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Grid size={13} className="text-[#8169ff]" />
          <span className="capitalize">{settings.gridStyle}</span>
          <ChevronDown size={12} className="text-[#888888]" />
        </button>

        {/* Dropdown Menu */}
        {isGridMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-[#e5e5ea] shadow-xl p-3 z-30 space-y-3 animate-in fade-in zoom-in-95 duration-100"
            style={{
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Grid Patterns */}
            <div>
              <div className="text-[11px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">
                Grid Pattern
              </div>
              <div className="space-y-0.5">
                {gridStyles.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onChangeSettings({ ...settings, gridStyle: g.id });
                      setIsGridMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.gridStyle === g.id
                        ? 'bg-[#f3f1ff] text-[#8169ff] font-semibold'
                        : 'text-[#444444] hover:bg-gray-50'
                    }`}
                  >
                    <span>{g.label}</span>
                    {settings.gridStyle === g.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Paper Tone */}
            <div className="pt-2 border-t border-[#f0f0f4]">
              <div className="text-[11px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">
                Canvas Tone
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {bgTones.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    title={tone.label}
                    onClick={() => {
                      onChangeSettings({ ...settings, bgTone: tone.id });
                    }}
                    className={`h-7 rounded-lg border flex items-center justify-center transition-all ${
                      settings.bgTone === tone.id
                        ? 'ring-2 ring-offset-1 ring-[#8169ff]'
                        : 'hover:opacity-80'
                    }`}
                    style={{ backgroundColor: tone.bg, borderColor: tone.border }}
                  >
                    {settings.bgTone === tone.id && (
                      <Check
                        size={12}
                        className={tone.id === 'blueprint' ? 'text-white' : 'text-[#8169ff]'}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
