import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Sparkles, AlertCircle } from 'lucide-react';

interface ImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imgData: { src: string; width: number; height: number; fileName?: string }) => void;
}

export const ImageImportModal: React.FC<ImageImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }
    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setIsProcessing(false);
        const maxInitialDim = 480;
        let w = img.naturalWidth || 300;
        let h = img.naturalHeight || 200;
        if (w > maxInitialDim || h > maxInitialDim) {
          const ratio = w / h;
          if (w > h) {
            w = maxInitialDim;
            h = Math.round(maxInitialDim / ratio);
          } else {
            h = maxInitialDim;
            w = Math.round(maxInitialDim * ratio);
          }
        }
        onImport({ src: dataUrl, width: w, height: h, fileName: file.name });
        onClose();
      };
      img.onerror = () => {
        setIsProcessing(false);
        setError('Failed to decode image data.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setError(null);
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setIsProcessing(false);
      const maxInitialDim = 480;
      let w = img.naturalWidth || 300;
      let h = img.naturalHeight || 200;
      if (w > maxInitialDim || h > maxInitialDim) {
        const ratio = w / h;
        if (w > h) {
          w = maxInitialDim;
          h = Math.round(maxInitialDim / ratio);
        } else {
          h = maxInitialDim;
          w = Math.round(maxInitialDim * ratio);
        }
      }
      onImport({ src: urlInput.trim(), width: w, height: h, fileName: 'Web Image' });
      setUrlInput('');
      onClose();
    };
    img.onerror = () => {
      setIsProcessing(false);
      setError('Could not load image from this URL. Please verify the link or try saving the image and uploading it.');
    };
    img.src = urlInput.trim();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Sample stock assets for quick demonstration
  const sampleImages = [
    {
      name: 'System Architecture',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Design System Kit',
      url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Brainstorm Flowchart',
      url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-[#e5e5ea] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#8169ff]/10 text-[#8169ff] flex items-center justify-center">
              <ImageIcon size={19} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                Import Image to Canvas
              </h3>
              <p className="text-xs text-gray-500">
                Upload files, paste from clipboard, or enter an image URL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 border-2 border-dashed border-[#8169ff]/30 hover:border-[#8169ff] rounded-2xl p-6 text-center cursor-pointer bg-[#8169ff]/5 hover:bg-[#8169ff]/10 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs text-[#8169ff] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Upload size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">
              Click to browse or drag and drop an image
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Supports PNG, JPG, WebP, SVG, and GIF (Max 15MB)
            </p>
          </div>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleUrlSubmit} className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Or import from Image URL
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#8169ff] focus:ring-1 focus:ring-[#8169ff]"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing || !urlInput.trim()}
              className="px-4 py-2 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isProcessing ? 'Loading...' : 'Import'}
            </button>
          </div>
        </form>

        {/* Quick Sample Presets */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
            <Sparkles size={13} className="text-[#8169ff]" />
            <span>Quick Sample Assets:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sampleImages.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => {
                  setUrlInput(sample.url);
                }}
                className="p-2 text-left rounded-xl border border-gray-100 hover:border-[#8169ff]/30 hover:bg-[#8169ff]/5 text-[11px] font-medium text-gray-700 transition-colors cursor-pointer"
              >
                <div className="w-full h-12 rounded-lg bg-gray-100 overflow-hidden mb-1.5">
                  <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                </div>
                <span className="truncate block font-semibold">{sample.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
