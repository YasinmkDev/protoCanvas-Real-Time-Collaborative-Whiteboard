import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Maximize2,
  RotateCcw,
} from 'lucide-react';

interface PlayfulMiniCanvasProps {
  onOpenCanvas: () => void;
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
}

export const PlayfulMiniCanvas: React.FC<PlayfulMiniCanvasProps> = ({ onOpenCanvas }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#8169ff');
  const [strokes, setStrokes] = useState<Stroke[]>([
    {
      id: 'default_arrow',
      points: [
        { x: 140, y: 190 },
        { x: 190, y: 160 },
        { x: 260, y: 140 },
        { x: 310, y: 135 },
      ],
      color: '#8169ff',
      width: 3,
    },
  ]);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<StrokePoint[]>([]);

  // Simulated peer cursors in the demo preview
  const [simPeers, setSimPeers] = useState([
    { id: 'elena', name: 'Elena (Designer)', color: '#059669', x: 240, y: 120, label: 'Drawing card ✨' },
    { id: 'alex', name: 'Alex (Motion)', color: '#ea580c', x: 480, y: 220, label: 'Zero conflicts! 🚀' },
  ]);

  // Animate simulated peer cursors playfully
  useEffect(() => {
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.025;
      setSimPeers([
        {
          id: 'elena',
          name: 'Elena (Designer)',
          color: '#059669',
          x: 230 + Math.sin(t * 1.4) * 80,
          y: 120 + Math.cos(t * 1.8) * 45,
          label: 'Drawing card ✨',
        },
        {
          id: 'alex',
          name: 'Alex (Motion)',
          color: '#ea580c',
          x: 520 + Math.cos(t * 1.2) * 70,
          y: 200 + Math.sin(t * 1.6) * 50,
          label: 'Zero conflicts! 🚀',
        },
      ]);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Draw loop for the preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle drafting grid
    ctx.fillStyle = '#f0f0f4';
    const gridSize = 24;
    for (let x = 12; x < w; x += gridSize) {
      for (let y = 12; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw static decorative workshop elements (pre-drawn UI wireframe)
    // Wireframe Card
    ctx.save();
    ctx.fillStyle = '#f8f8fb';
    ctx.strokeStyle = '#e5e5ea';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 50, 220, 150, 12);
    ctx.fill();
    ctx.stroke();

    // Card Header Bar
    ctx.fillStyle = '#8169ff';
    ctx.beginPath();
    ctx.roundRect(96, 68, 70, 8, 4);
    ctx.fill();

    // Card Content Lines
    ctx.fillStyle = '#e0e0e6';
    ctx.beginPath();
    ctx.roundRect(96, 90, 160, 6, 3);
    ctx.roundRect(96, 106, 130, 6, 3);
    ctx.roundRect(96, 122, 100, 6, 3);
    ctx.fill();

    // Small CTA Button in card
    ctx.fillStyle = '#c9bfff';
    ctx.beginPath();
    ctx.roundRect(96, 146, 75, 24, 6);
    ctx.fill();
    ctx.restore();

    // Playful Pastel Sticky Note
    ctx.save();
    ctx.fillStyle = '#fef3c7'; // soft pastel yellow
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(330, 70, 170, 110, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText('Multi-User CRDT', 346, 100);
    ctx.font = '400 11px Inter, sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText('Sub-50ms awareness', 346, 122);
    ctx.fillText('Zero merge conflicts!', 346, 140);
    ctx.restore();

    // 4. Draw user strokes
    strokes.forEach((s) => {
      if (s.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        const midX = (s.points[i - 1].x + s.points[i].x) / 2;
        const midY = (s.points[i - 1].y + s.points[i].y) / 2;
        ctx.quadraticCurveTo(s.points[i - 1].x, s.points[i - 1].y, midX, midY);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  // Pointer event handlers for drawing in demo
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'eraser') {
      // Clear recent stroke
      setStrokes((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPointsRef.current.push({ x, y });

    // Update ongoing stroke preview
    setStrokes((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].id === 'current_draw') {
        copy[copy.length - 1].points = [...currentPointsRef.current];
        return copy;
      }
      return [
        ...copy,
        {
          id: 'current_draw',
          points: [...currentPointsRef.current],
          color: strokeColor,
          width: 3,
        },
      ];
    });
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setStrokes((prev) =>
      prev.map((s) =>
        s.id === 'current_draw' ? { ...s, id: 'stroke_' + Math.random().toString(36) } : s
      )
    );
    currentPointsRef.current = [];
  };

  const handleClear = () => {
    setStrokes([]);
  };

  return (
    <div
      id="product-demo-panel"
      className="relative w-full max-w-[1040px] mx-auto bg-white rounded-2xl p-4 sm:p-6 border border-[#e5e5ea] transition-all"
      style={{
        boxShadow:
          'rgba(0, 0, 0, 0.12) 0px 3px 12px 0px, rgba(0, 0, 0, 0.04) 0px 0px 2px 0px',
      }}
    >
      {/* Demo Panel Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0f0f4]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-xs font-mono font-semibold text-[#555555]">
            room/ABC123 · live interactive drafting table
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multiplayer active</span>
          </span>
        </div>

        {/* Expand to Full Canvas Button */}
        <button
          type="button"
          onClick={onOpenCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Maximize2 size={13} />
          <span>Open Full Studio</span>
        </button>
      </div>

      {/* Interactive Canvas Stage */}
      <div className="relative w-full h-[340px] sm:h-[400px] rounded-xl overflow-hidden border border-[#e5e5ea] bg-white cursor-crosshair select-none">
        <canvas
          ref={canvasRef}
          width={1000}
          height={400}
          className="w-full h-full block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Live Simulated Collaborator Cursors */}
        {simPeers.map((peer) => (
          <div
            key={peer.id}
            className="pointer-events-none absolute transition-transform duration-75 ease-out z-20 flex flex-col items-start"
            style={{
              left: peer.x,
              top: peer.y,
              transform: 'translate(0, 0)',
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm -rotate-45"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={peer.color}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </svg>

            {/* User Name Badge & Reaction */}
            <div
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs whitespace-nowrap -mt-1 ml-3"
              style={{ backgroundColor: peer.color }}
            >
              {peer.name}
            </div>
            <div className="px-1.5 py-0.5 rounded bg-white text-[9px] font-semibold text-gray-700 shadow-sm border border-gray-100 ml-4 mt-0.5">
              {peer.label}
            </div>
          </div>
        ))}

        {/* Floating Mini Interactive Studio Tray */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-[#e5e5ea] shadow-md">
          <button
            type="button"
            title="Pen"
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-lg transition-all ${
              activeTool === 'pen'
                ? 'bg-[#8169ff] text-white'
                : 'text-[#181818] hover:bg-[#f3f1ff]'
            }`}
          >
            <Pen size={15} />
          </button>

          {/* Color buttons */}
          <div className="w-[1px] h-4 bg-gray-200 mx-1" />
          {['#8169ff', '#059669', '#2563eb', '#181818'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setStrokeColor(c)}
              className={`w-4 h-4 rounded-full transition-transform ${
                strokeColor === c ? 'scale-125 ring-2 ring-[#8169ff]' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="w-[1px] h-4 bg-gray-200 mx-1" />
          <button
            type="button"
            title="Clear Doodles"
            onClick={handleClear}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Hand-drawn invitation badge */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:block">
          <span className="font-handwriting text-xl text-[#8169ff] -rotate-3 block">
            Click & sketch right here! ✏️
          </span>
        </div>
      </div>
    </div>
  );
};
