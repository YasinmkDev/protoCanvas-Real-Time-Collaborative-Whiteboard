import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WhiteboardElement, Viewport, BoundingBox } from '../../types';
import { getCombinedBounds, drawElement } from './ElementRenderer';
import { MapPin, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';

interface MinimapProps {
  elements: WhiteboardElement[];
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  containerWidth: number;
  containerHeight: number;
}

const MAP_WIDTH = 190;
const MAP_HEIGHT = 120;
const PADDING = 200; // world padding around elements

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  viewport,
  setViewport,
  containerWidth,
  containerHeight,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);

  // Compute world boundary for minimap
  const getWorldBounds = useCallback((): BoundingBox => {
    const elBounds = getCombinedBounds(elements);
    // Also consider current viewport world rectangle
    const vpMinX = -viewport.x / viewport.zoom;
    const vpMinY = -viewport.y / viewport.zoom;
    const vpMaxX = vpMinX + containerWidth / viewport.zoom;
    const vpMaxY = vpMinY + containerHeight / viewport.zoom;

    if (!elBounds) {
      return {
        minX: Math.min(vpMinX, -600) - PADDING,
        minY: Math.min(vpMinY, -400) - PADDING,
        maxX: Math.max(vpMaxX, 600) + PADDING,
        maxY: Math.max(vpMaxY, 400) + PADDING,
        width: Math.max(1200, vpMaxX - vpMinX + PADDING * 2),
        height: Math.max(800, vpMaxY - vpMinY + PADDING * 2),
      };
    }

    const minX = Math.min(elBounds.minX, vpMinX) - PADDING;
    const minY = Math.min(elBounds.minY, vpMinY) - PADDING;
    const maxX = Math.max(elBounds.maxX, vpMaxX) + PADDING;
    const maxY = Math.max(elBounds.maxY, vpMaxY) + PADDING;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
    };
  }, [elements, viewport, containerWidth, containerHeight]);

  // Fit all elements to screen
  const fitToScreen = useCallback(() => {
    const elBounds = getCombinedBounds(elements);
    if (!elBounds || elements.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const padding = 80;
    const availWidth = Math.max(200, containerWidth - padding * 2);
    const availHeight = Math.max(200, containerHeight - padding * 2);

    const zoomX = availWidth / elBounds.width;
    const zoomY = availHeight / elBounds.height;
    const fitZoom = Math.min(1.5, Math.max(0.15, Math.min(zoomX, zoomY)));

    const centerX = elBounds.minX + elBounds.width / 2;
    const centerY = elBounds.minY + elBounds.height / 2;

    setViewport({
      x: containerWidth / 2 - centerX * fitZoom,
      y: containerHeight / 2 - centerY * fitZoom,
      zoom: fitZoom,
    });
  }, [elements, containerWidth, containerHeight, setViewport]);

  // Draw minimap canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MAP_WIDTH * dpr;
    canvas.height = MAP_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = '#f8f8fb';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Compute scale to fit world inside map
    const world = getWorldBounds();
    const scale = Math.min(MAP_WIDTH / world.width, MAP_HEIGHT / world.height);

    // Centering offsets
    const offsetX = (MAP_WIDTH - world.width * scale) / 2;
    const offsetY = (MAP_HEIGHT - world.height * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-world.minX, -world.minY);

    // Draw elements miniature
    elements.forEach((el) => {
      drawElement(ctx, el);
    });

    // Draw Viewport Camera Frustum
    const vpWorldX = -viewport.x / viewport.zoom;
    const vpWorldY = -viewport.y / viewport.zoom;
    const vpWorldW = containerWidth / viewport.zoom;
    const vpWorldH = containerHeight / viewport.zoom;

    ctx.fillStyle = 'rgba(129, 105, 255, 0.16)';
    ctx.fillRect(vpWorldX, vpWorldY, vpWorldW, vpWorldH);

    ctx.strokeStyle = '#8169ff';
    ctx.lineWidth = 1.5 / scale;
    ctx.strokeRect(vpWorldX, vpWorldY, vpWorldW, vpWorldH);

    ctx.restore();
  }, [isOpen, elements, viewport, containerWidth, containerHeight, getWorldBounds]);

  // Pan to clicked location on minimap
  const handleMapPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mapX = e.clientX - rect.left;
      const mapY = e.clientY - rect.top;

      const world = getWorldBounds();
      const scale = Math.min(MAP_WIDTH / world.width, MAP_HEIGHT / world.height);
      const offsetX = (MAP_WIDTH - world.width * scale) / 2;
      const offsetY = (MAP_HEIGHT - world.height * scale) / 2;

      const worldX = (mapX - offsetX) / scale + world.minX;
      const worldY = (mapY - offsetY) / scale + world.minY;

      // Center viewport around this world point
      setViewport((prev) => ({
        ...prev,
        x: containerWidth / 2 - worldX * prev.zoom,
        y: containerHeight / 2 - worldY * prev.zoom,
      }));
    },
    [containerWidth, containerHeight, getWorldBounds, setViewport]
  );

  return (
    <div
      id="canvas-minimap"
      className="fixed bottom-20 right-6 z-20 flex flex-col bg-white/95 backdrop-blur-md border border-[#e5e5ea] rounded-2xl shadow-lg overflow-hidden transition-all text-xs"
      style={{
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#f0f0f4] bg-white/90">
        <div className="flex items-center gap-1.5 font-semibold text-[#181818] text-[11px]">
          <MapPin size={12} className="text-[#8169ff]" />
          <span>Radar View</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fitToScreen}
            title="Fit All Content to Screen"
            className="p-1 hover:bg-[#f3f1ff] hover:text-[#8169ff] rounded text-[#666666] transition-all"
          >
            <Maximize2 size={12} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Collapse Radar' : 'Expand Radar'}
            className="p-1 hover:bg-gray-100 rounded text-[#666666] transition-all"
          >
            {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Map body */}
      {isOpen && (
        <div className="relative p-1.5 bg-[#fbfbfd]">
          <canvas
            ref={canvasRef}
            className="block rounded-lg cursor-crosshair border border-[#ececf2]"
            style={{ width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px` }}
            onPointerDown={(e) => {
              isDraggingRef.current = true;
              handleMapPointer(e);
            }}
            onPointerMove={(e) => {
              if (isDraggingRef.current) handleMapPointer(e);
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
            }}
            onPointerLeave={() => {
              isDraggingRef.current = false;
            }}
          />
          <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-[#888888] font-medium">
            <span>{elements.length} {elements.length === 1 ? 'element' : 'elements'}</span>
            <span className="text-[#8169ff] font-semibold">Click to pan</span>
          </div>
        </div>
      )}
    </div>
  );
};
