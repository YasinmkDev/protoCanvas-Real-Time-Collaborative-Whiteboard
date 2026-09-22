import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'V', desc: 'Select tool (click, drag, resize, align)' },
  { key: 'H', desc: 'Hand tool (pan canvas without moving items)' },
  { key: 'K', desc: 'Laser pointer (transient presentation beam)' },
  { key: 'P', desc: 'Pen tool (freehand strokes)' },
  { key: 'M', desc: 'Highlighter (semi-transparent marker)' },
  { key: 'N', desc: 'Sticky note (quick pastel brainstorm cards)' },
  { key: 'R', desc: 'Rectangle tool' },
  { key: 'O', desc: 'Circle / Ellipse tool' },
  { key: 'D', desc: 'Diamond tool (decision flow node)' },
  { key: 'S', desc: 'Star badge tool' },
  { key: 'L', desc: 'Line tool' },
  { key: 'A', desc: 'Arrow connector tool' },
  { key: 'T', desc: 'Text tool (click to add/edit)' },
  { key: 'E', desc: 'Object eraser' },
  { key: 'Double Click', desc: 'Edit text or sticky note content' },
  { key: 'Ctrl + Z', desc: 'Undo (per-user history)' },
  { key: 'Ctrl + Shift + Z', desc: 'Redo' },
  { key: 'Del / Backspace', desc: 'Delete selected element(s)' },
  { key: 'Right-Click', desc: 'Open business context menu (Figma style)' },
  { key: 'Ctrl + C', desc: 'Copy selected element(s)' },
  { key: 'Ctrl + X', desc: 'Cut selected element(s)' },
  { key: 'Ctrl + V', desc: 'Paste element(s) at cursor' },
  { key: 'Ctrl + A', desc: 'Select all elements on canvas' },
  { key: 'Ctrl + D', desc: 'Duplicate selected element(s)' },
  { key: 'Ctrl + G', desc: 'Group selected shapes together' },
  { key: 'Ctrl + Shift + G', desc: 'Ungroup shapes' },
  { key: 'Ctrl + L', desc: 'Lock / Unlock selected element(s)' },
  { key: 'Ctrl + ]', desc: 'Bring element(s) to front' },
  { key: 'Ctrl + [', desc: 'Send element(s) to back' },
  { key: 'Ctrl + E', desc: 'Open Export menu (PNG / SVG)' },
  { key: 'Ctrl + H', desc: 'Open Canvas History sidebar' },
  { key: 'Space + Drag', desc: 'Pan infinite canvas' },
  { key: 'Wheel / Pinch', desc: 'Zoom centered at mouse cursor' },
  { key: '?', desc: 'Toggle keyboard shortcuts' },
];

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#e5e5ea]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8169ff] flex items-center justify-center">
              <Keyboard size={18} />
            </div>
            <h3 className="font-display font-bold text-lg text-[#181818]">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-3 max-h-[60vh] overflow-y-auto space-y-1 text-xs">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-600 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-gray-100 text-gray-800 font-mono font-bold text-[11px] border border-gray-200 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            Press <kbd className="font-mono font-bold text-gray-600">?</kbd> anywhere to view this guide
          </p>
        </div>
      </div>
    </div>
  );
};
