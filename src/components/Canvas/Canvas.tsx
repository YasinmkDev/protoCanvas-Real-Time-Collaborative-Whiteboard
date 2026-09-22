import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as Y from 'yjs';
import {
  Tool,
  WhiteboardElement,
  Viewport,
  UserPresence,
  CanvasSettings,
  ResizeHandle,
} from '../../types';
import {
  drawElement,
  drawSelectionBox,
  drawMarqueeBox,
  drawCollaboratorSelections,
  getCombinedBounds,
  setImageRepaintCallback,
} from './ElementRenderer';
import { CursorLayer } from './CursorLayer';
import { Minimap } from './Minimap';
import { updateElementProps } from '../../lib/yjsSchema';
import { ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface CanvasProps {
  doc: Y.Doc;
  userOrigin: string;
  elements: WhiteboardElement[];
  draftElement: WhiteboardElement | null;
  activeTool: Tool;
  selectedIds: string[];
  hoveredId?: string | null;
  hoveredHandle?: ResizeHandle | null;
  collaborators: UserPresence[];
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  laserPoints?: { x: number; y: number; time: number }[];
  settings: CanvasSettings;
  isPanning?: boolean;
  marqueeRect?: { x: number; y: number; width: number; height: number } | null;
  onImportImage?: (imgData: {
    src: string;
    width: number;
    height: number;
    fileName?: string;
    x?: number;
    y?: number;
  }) => void;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  onContextMenu?: (
    e: React.MouseEvent<HTMLElement>,
    coords: { x: number; y: number; canvasX: number; canvasY: number }
  ) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  doc,
  userOrigin,
  elements,
  draftElement,
  activeTool,
  selectedIds,
  hoveredId,
  hoveredHandle,
  collaborators,
  viewport,
  setViewport,
  editingTextId,
  setEditingTextId,
  laserPoints = [],
  settings,
  isPanning = false,
  marqueeRect,
  onImportImage,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDoubleClick,
  onWheel,
  zoomIn,
  zoomOut,
  resetZoom,
  onContextMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // Handle right-click context menu event
  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onContextMenu) return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect() || containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasX = Math.round((screenX - viewport.x) / viewport.zoom);
    const canvasY = Math.round((screenY - viewport.y) / viewport.zoom);
    onContextMenu(e, { x: e.clientX, y: e.clientY, canvasX, canvasY });
  };

  // Map of elements for fast lookup
  const elementsMap = useRef<Map<string, WhiteboardElement>>(new Map());
  useEffect(() => {
    const map = new Map<string, WhiteboardElement>();
    elements.forEach((el) => map.set(el.id, el));
    elementsMap.current = map;
  }, [elements]);

  // Main Render Routine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Reset transform
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Background Tone
    let bgColor = '#ffffff';
    let gridColor = '#e8e8ed';
    if (settings.bgTone === 'warm') {
      bgColor = '#faf8f5';
      gridColor = '#e5e1da';
    } else if (settings.bgTone === 'blueprint') {
      bgColor = '#0f172a';
      gridColor = '#1e293b';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid (Dots, Lines, Isometric, None)
    if (settings.gridStyle !== 'none' && viewport.zoom >= 0.25) {
      ctx.save();
      const baseSize = (settings.gridSize || 28) * viewport.zoom;
      const offsetX = viewport.x % baseSize;
      const offsetY = viewport.y % baseSize;

      if (settings.gridStyle === 'dots') {
        ctx.fillStyle = gridColor;
        const dotRadius = Math.max(0.75, 1.2 * Math.min(1.2, viewport.zoom));
        for (let x = offsetX; x < width; x += baseSize) {
          for (let y = offsetY; y < height; y += baseSize) {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (settings.gridStyle === 'lines') {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offsetX; x < width; x += baseSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = offsetY; y < height; y += baseSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      } else if (settings.gridStyle === 'isometric') {
        ctx.fillStyle = gridColor;
        const isoX = baseSize;
        const isoY = baseSize * 0.577; // tan(30 deg)
        const dotRadius = Math.max(0.75, 1.1 * Math.min(1.2, viewport.zoom));
        for (let row = -2; row * isoY < height + isoY * 2; row++) {
          const y = ((viewport.y % (isoY * 2)) + row * isoY);
          const xShift = (row % 2 === 0 ? 0 : isoX / 2);
          for (let col = -2; col * isoX < width + isoX * 2; col++) {
            const x = ((viewport.x % isoX) + col * isoX + xShift);
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // 3. Apply World Transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // 4. Draw committed elements (sorted by zOrder)
    elements.forEach((el) => {
      if (el.id === editingTextId) return;
      drawElement(ctx, el);
    });

    // 5. Draw active in-progress draft element
    if (draftElement) {
      drawElement(ctx, draftElement);
    }

    // 6. Draw laser trail
    if (laserPoints.length > 1) {
      const now = Date.now();
      ctx.save();
      for (let i = 1; i < laserPoints.length; i++) {
        const p1 = laserPoints[i - 1];
        const p2 = laserPoints[i];
        const age = now - p2.time;
        const alpha = Math.max(0, 1 - age / 1200);
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.9})`;
        ctx.lineWidth = Math.max(2, 6 * alpha);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Glowing core
        ctx.strokeStyle = `rgba(254, 202, 202, ${alpha})`;
        ctx.lineWidth = Math.max(1, 2.5 * alpha);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. Draw collaborator ghost selections (FR-3)
    drawCollaboratorSelections(ctx, collaborators, elementsMap.current, viewport.zoom);

    // 8. Draw local selection box with resize handles and group indicator
    if (selectedIds.length > 0) {
      const selectedEls = selectedIds
        .map((id) => elementsMap.current.get(id))
        .filter(Boolean) as WhiteboardElement[];

      const combinedBounds = getCombinedBounds(selectedEls);
      if (combinedBounds) {
        const groupIds = new Set(
          selectedEls.map((el) => el.groupId).filter(Boolean)
        );
        let groupLabel: string | undefined;
        if (groupIds.size === 1 && selectedEls.every((el) => el.groupId)) {
          groupLabel = `Group (${selectedEls.length})`;
        } else if (groupIds.size > 1) {
          groupLabel = `Multiple Groups (${selectedEls.length})`;
        }

        drawSelectionBox(ctx, combinedBounds, viewport.zoom, '#8169ff', groupLabel);
      }
    }

    // 9. Draw active marquee selection box
    if (marqueeRect && (marqueeRect.width > 2 || marqueeRect.height > 2)) {
      drawMarqueeBox(ctx, marqueeRect, viewport.zoom, '#8169ff');
    }

    ctx.restore();
  }, [
    elements,
    draftElement,
    selectedIds,
    collaborators,
    viewport,
    editingTextId,
    laserPoints,
    settings,
    marqueeRect,
  ]);

  // RequestAnimationFrame animation render loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderCanvas();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderCanvas]);

  // Handle high-DPI canvas resizing
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        setContainerSize({ width, height });
        renderCanvas();
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [renderCanvas]);

  // Hook up image cache async repaint callback
  useEffect(() => {
    setImageRepaintCallback(() => {
      renderCanvas();
    });
    return () => {
      setImageRepaintCallback(null);
    };
  }, [renderCanvas]);

  // Image Drag and Drop onto canvas
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onImportImage) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const dropY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const maxDim = 450;
            let w = img.naturalWidth || 300;
            let h = img.naturalHeight || 200;
            if (w > maxDim || h > maxDim) {
              const r = w / h;
              if (w > h) {
                w = maxDim;
                h = Math.round(maxDim / r);
              } else {
                h = maxDim;
                w = Math.round(maxDim * r);
              }
            }
            onImportImage({
              src: dataUrl,
              width: w,
              height: h,
              fileName: file.name,
              x: dropX,
              y: dropY,
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Cursor style based on active tool and hovered resize handles
  const getCursorClass = () => {
    if (activeTool === 'hand') return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    if (activeTool === 'select') {
      if (hoveredHandle) {
        if (hoveredHandle === 'nw' || hoveredHandle === 'se') return 'cursor-nwse-resize';
        if (hoveredHandle === 'ne' || hoveredHandle === 'sw') return 'cursor-nesw-resize';
        if (hoveredHandle === 'e' || hoveredHandle === 'w') return 'cursor-ew-resize';
        if (hoveredHandle === 'n' || hoveredHandle === 's') return 'cursor-ns-resize';
      }
      if (hoveredId && selectedIds.includes(hoveredId)) {
        return 'cursor-move';
      }
      return 'cursor-default';
    }
    switch (activeTool) {
      case 'pen':
      case 'highlighter':
      case 'line':
      case 'rect':
      case 'circle':
      case 'diamond':
      case 'star':
      case 'arrow':
      case 'laser':
        return 'cursor-crosshair';
      case 'sticky':
        return 'cursor-pointer';
      case 'text':
        return 'cursor-text';
      case 'eraser':
        return 'cursor-cell';
      default:
        return 'cursor-default';
    }
  };

  const currentEditingElement = editingTextId ? elementsMap.current.get(editingTextId) : null;

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full overflow-hidden select-none bg-white ${getCursorClass()}`}
    >
      <canvas
        ref={canvasRef}
        id="whiteboard-canvas"
        className="block touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        onContextMenu={handleContextMenu}
      />

      {/* Visual Image Drag-Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-[#8169ff]/10 backdrop-blur-xs border-4 border-dashed border-[#8169ff] flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="p-6 bg-white/95 rounded-3xl shadow-2xl flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#8169ff]/10 text-[#8169ff] flex items-center justify-center">
              <ImageIcon size={30} />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-base text-gray-900">
                Drop image here to place on canvas
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Will be imported with original dimensions and author protection
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Remote Cursors Overlay */}
      <CursorLayer collaborators={collaborators} viewport={viewport} />

      {/* Inline Text & Sticky Note Editor */}
      {editingTextId &&
        currentEditingElement &&
        (currentEditingElement.type === 'text' || currentEditingElement.type === 'sticky') && (
          <div
            className="absolute z-30 pointer-events-auto"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditingTextId(null);
              handleContextMenu(e);
            }}
            style={{
              left: currentEditingElement.x * viewport.zoom + viewport.x,
              top: currentEditingElement.y * viewport.zoom + viewport.y,
              width:
                currentEditingElement.type === 'sticky'
                  ? currentEditingElement.width * viewport.zoom
                  : undefined,
              height:
                currentEditingElement.type === 'sticky'
                  ? currentEditingElement.height * viewport.zoom
                  : undefined,
              transformOrigin: 'top left',
            }}
          >
            <textarea
              autoFocus
              defaultValue={currentEditingElement.content || ''}
              placeholder={
                currentEditingElement.type === 'sticky'
                  ? 'Type note here...'
                  : 'Type text here...'
              }
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingTextId(null);
                handleContextMenu(e);
              }}
            onChange={(e) => {
              updateElementProps(
                doc,
                currentEditingElement.id,
                { content: e.target.value },
                userOrigin
              );
            }}
            onBlur={() => setEditingTextId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditingTextId(null);
              } else if (
                currentEditingElement.type === 'text' &&
                e.key === 'Enter' &&
                !e.shiftKey
              ) {
                e.preventDefault();
                setEditingTextId(null);
              }
            }}
            style={{
              fontSize: `${(currentEditingElement.fontSize || 16) * viewport.zoom}px`,
              color: currentEditingElement.color || '#181818',
              backgroundColor:
                currentEditingElement.type === 'sticky'
                  ? currentEditingElement.fillColor || '#fef08a'
                  : 'rgba(255, 255, 255, 0.95)',
              lineHeight: 1.35,
              padding: currentEditingElement.type === 'sticky' ? '12px' : '4px',
            }}
            className="w-full h-full rounded-xl border-2 border-[#8169ff] outline-none shadow-xl resize-none font-medium overflow-hidden"
          />
        </div>
      )}

      {/* Interactive Radar / Minimap */}
      <Minimap
        elements={elements}
        viewport={viewport}
        setViewport={setViewport}
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
      />

      {/* Zoom Controls Overlay (Bottom-Right) */}
      <div
        id="zoom-controls"
        className="fixed bottom-6 right-6 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-[#e5e5ea] rounded-xl shadow-md text-xs font-semibold text-[#181818]"
        style={{
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom Out (Ctrl -)"
          className="p-1.5 hover:bg-[#f3f1ff] hover:text-[#8169ff] rounded-lg transition-all"
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          title="Reset Zoom (100%)"
          className="px-2 py-1 hover:bg-[#f3f1ff] hover:text-[#8169ff] rounded-lg transition-all min-w-[52px] text-center"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          title="Zoom In (Ctrl +)"
          className="p-1.5 hover:bg-[#f3f1ff] hover:text-[#8169ff] rounded-lg transition-all"
        >
          <ZoomIn size={15} />
        </button>
        <div className="w-[1px] h-4 bg-[#e5e5ea] mx-0.5" />
        <button
          type="button"
          onClick={resetZoom}
          title="Reset Viewport Origin"
          className="p-1.5 hover:bg-[#f3f1ff] hover:text-[#8169ff] rounded-lg transition-all text-[#666666]"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
