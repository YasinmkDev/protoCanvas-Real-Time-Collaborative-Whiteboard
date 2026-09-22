import React, { useState } from 'react';
import { WhiteboardElement } from '../../types';
import { exportToPNG, exportToSVG, downloadFile } from '../../lib/exportUtils';
import { Download, Copy, Check, FileImage, FileCode, X } from 'lucide-react';

interface ExportMenuProps {
  elements: WhiteboardElement[];
  boardCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  elements,
  boardCode,
  isOpen,
  onClose,
}) => {
  const [transparent, setTransparent] = useState(false);
  const [scale, setScale] = useState<number>(2); // 2x high-resolution by default
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPNG = () => {
    const dataUrl = exportToPNG(elements, {
      scale,
      transparent,
    });
    if (dataUrl) {
      downloadFile(dataUrl, `whiteboard-${boardCode}-${scale}x.png`, 'image/png');
      onClose();
    }
  };

  const handleDownloadSVG = () => {
    const svgStr = exportToSVG(elements, {
      transparent,
    });
    if (svgStr) {
      downloadFile(svgStr, `whiteboard-${boardCode}.svg`, 'image/svg+xml');
      onClose();
    }
  };

  const handleCopyPNG = async () => {
    try {
      const dataUrl = exportToPNG(elements, { scale: 2, transparent });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write not supported or permitted in this context:', err);
    }
  };

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
              <Download size={18} />
            </div>
            <h3 className="font-display font-bold text-lg text-[#181818]">
              Export Whiteboard
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

        <div className="py-4 space-y-4 text-xs">
          {/* Transparent Background Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">Transparent Background</p>
              <p className="text-gray-500 text-[11px]">
                Remove the white canvas background
              </p>
            </div>
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
              className="w-4 h-4 rounded text-[#8169ff] focus:ring-[#8169ff] accent-[#8169ff] cursor-pointer"
            />
          </div>

          {/* Scale resolution */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">PNG Resolution</p>
              <p className="text-gray-500 text-[11px]">
                High-DPI 2x scale crisp for presentations & print
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                    scale === s
                      ? 'bg-[#8169ff] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="btn-export-png"
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white font-semibold shadow-sm transition-all text-xs"
            >
              <FileImage size={16} />
              <span>Export PNG ({scale}x)</span>
            </button>

            <button
              type="button"
              id="btn-export-svg"
              onClick={handleDownloadSVG}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#181818] hover:bg-black text-white font-semibold shadow-sm transition-all text-xs"
            >
              <FileCode size={16} />
              <span>Export SVG Vector</span>
            </button>
          </div>

          {/* Copy PNG to Clipboard */}
          <button
            type="button"
            onClick={handleCopyPNG}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold transition-all text-xs"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span>{copied ? 'Copied image to clipboard!' : 'Copy PNG to Clipboard'}</span>
          </button>
        </div>

        <div className="pt-2 text-center text-[11px] text-gray-400">
          Client-side instant export · {elements.length} elements included
        </div>
      </div>
    </div>
  );
};
