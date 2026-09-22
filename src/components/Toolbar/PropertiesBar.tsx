import React from 'react';
import { Tool, WhiteboardElement, StrokeStyle } from '../../types';
import * as Y from 'yjs';
import { updateElementProps, toggleElementProtection } from '../../lib/yjsSchema';
import { getElementBounds } from '../Canvas/ElementRenderer';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Layers,
  Lock,
  Unlock,
  Sliders,
  Shield,
  ShieldAlert,
  Component,
  Boxes,
} from 'lucide-react';

interface PropertiesBarProps {
  activeTool: Tool;
  strokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  fillColor: string;
  onChangeFillColor: (color: string) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  selectedElements: WhiteboardElement[];
  allElements: WhiteboardElement[];
  doc: Y.Doc;
  userOrigin: string;
  canGroup?: boolean;
  canUngroup?: boolean;
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
}

const COLOR_PALETTE = [
  { name: 'Violet', value: '#8169ff' },
  { name: 'Carbon', value: '#181818' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Graphite', value: '#64748b' },
];

const STICKY_PALETTE = [
  { name: 'Lemon', value: '#fef08a' },
  { name: 'Peach', value: '#fed7aa' },
  { name: 'Soft Lilac', value: '#e9d5ff' },
  { name: 'Mint', value: '#bbf7d0' },
  { name: 'Aqua Sky', value: '#bae6fd' },
  { name: 'Rose Pink', value: '#fecdd3' },
];

const FILL_PALETTE = [
  { name: 'None', value: 'transparent' },
  { name: 'Soft Lilac', value: '#ede9fe' },
  { name: 'Pastel Aqua', value: '#ccfbf1' },
  { name: 'Pastel Amber', value: '#fef3c7' },
  { name: 'Pastel Rose', value: '#ffe4e6' },
  { name: 'Pure White', value: '#ffffff' },
];

const STROKE_WIDTHS = [
  { label: 'Thin', width: 2 },
  { label: 'Medium', width: 4 },
  { label: 'Thick', width: 8 },
  { label: 'Bold', width: 12 },
];

const FONT_SIZES = [
  { label: 'S', size: 14 },
  { label: 'M', size: 20 },
  { label: 'L', size: 28 },
  { label: 'XL', size: 40 },
];

const STROKE_STYLES: { label: string; value: StrokeStyle }[] = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
];

const OPACITIES = [
  { label: '100%', value: 1 },
  { label: '75%', value: 0.75 },
  { label: '50%', value: 0.5 },
  { label: '25%', value: 0.25 },
];

export const PropertiesBar: React.FC<PropertiesBarProps> = ({
  activeTool,
  strokeColor,
  onChangeStrokeColor,
  strokeWidth,
  onChangeStrokeWidth,
  fillColor,
  onChangeFillColor,
  fontSize,
  onChangeFontSize,
  selectedElements,
  allElements,
  doc,
  userOrigin,
  canGroup = false,
  canUngroup = false,
  onGroupSelected,
  onUngroupSelected,
}) => {
  const isStickyTool =
    activeTool === 'sticky' || selectedElements.some((e) => e.type === 'sticky');

  const isShapeTool =
    activeTool === 'rect' ||
    activeTool === 'circle' ||
    activeTool === 'diamond' ||
    activeTool === 'star' ||
    selectedElements.some(
      (e) =>
        e.type === 'rect' ||
        e.type === 'circle' ||
        e.type === 'diamond' ||
        e.type === 'star'
    );

  const isTextTool =
    activeTool === 'text' || selectedElements.some((e) => e.type === 'text');

  const isMultiSelection = selectedElements.length >= 2;
  const isSingleSelection = selectedElements.length === 1;
  const primarySelected = selectedElements[0] || null;

  // Handlers for styling
  const handleColorPick = (color: string) => {
    onChangeStrokeColor(color);
    selectedElements.forEach((el) => {
      updateElementProps(doc, el.id, { color }, userOrigin);
    });
  };

  const handleWidthPick = (width: number) => {
    onChangeStrokeWidth(width);
    selectedElements.forEach((el) => {
      updateElementProps(doc, el.id, { strokeWidth: width }, userOrigin);
    });
  };

  const handleFillPick = (fill: string) => {
    onChangeFillColor(fill);
    selectedElements.forEach((el) => {
      updateElementProps(doc, el.id, { fillColor: fill }, userOrigin);
    });
  };

  const handleFontSizePick = (size: number) => {
    onChangeFontSize(size);
    selectedElements.forEach((el) => {
      if (el.type === 'text' || el.type === 'sticky') {
        updateElementProps(doc, el.id, { fontSize: size }, userOrigin);
      }
    });
  };

  const handleStrokeStylePick = (style: StrokeStyle) => {
    selectedElements.forEach((el) => {
      updateElementProps(doc, el.id, { strokeStyle: style }, userOrigin);
    });
  };

  const handleOpacityPick = (opacity: number) => {
    selectedElements.forEach((el) => {
      updateElementProps(doc, el.id, { opacity }, userOrigin);
    });
  };

  const handleToggleLock = () => {
    const shouldLock = !selectedElements.every((e) => e.isLocked);
    selectedElements.forEach((el) => {
      updateElementProps(doc, el.id, { isLocked: shouldLock }, userOrigin);
    });
  };

  const handleBusinessTagPick = (tag?: string) => {
    selectedElements.forEach((el) => {
      if (el.type === 'sticky') {
        updateElementProps(doc, el.id, { businessTag: tag } as any, userOrigin);
      }
    });
  };

  const handleBringToFront = () => {
    const maxZ = allElements.reduce((acc, el) => Math.max(acc, el.zOrder), 0);
    selectedElements.forEach((el, idx) => {
      updateElementProps(doc, el.id, { zOrder: maxZ + 1 + idx }, userOrigin);
    });
  };

  const handleSendToBack = () => {
    const minZ = allElements.reduce((acc, el) => Math.min(acc, el.zOrder), 0);
    selectedElements.forEach((el, idx) => {
      updateElementProps(doc, el.id, { zOrder: minZ - (selectedElements.length - idx) }, userOrigin);
    });
  };

  // Alignment operations
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElements.length < 2) return;

    const boundsMap = new Map(selectedElements.map((el) => [el.id, getElementBounds(el)]));
    const allBounds = selectedElements.map((el) => boundsMap.get(el.id)!);

    const minX = Math.min(...allBounds.map((b) => b.minX));
    const maxX = Math.max(...allBounds.map((b) => b.maxX));
    const minY = Math.min(...allBounds.map((b) => b.minY));
    const maxY = Math.max(...allBounds.map((b) => b.maxY));

    doc.transact(() => {
      selectedElements.forEach((el) => {
        const b = boundsMap.get(el.id)!;
        let newX = el.x;
        let newY = el.y;

        if (type === 'left') {
          newX = el.x + (minX - b.minX);
        } else if (type === 'center') {
          const groupMidX = (minX + maxX) / 2;
          const elMidX = (b.minX + b.maxX) / 2;
          newX = el.x + (groupMidX - elMidX);
        } else if (type === 'right') {
          newX = el.x + (maxX - b.maxX);
        } else if (type === 'top') {
          newY = el.y + (minY - b.minY);
        } else if (type === 'middle') {
          const groupMidY = (minY + maxY) / 2;
          const elMidY = (b.minY + b.maxY) / 2;
          newY = el.y + (groupMidY - elMidY);
        } else if (type === 'bottom') {
          newY = el.y + (maxY - b.maxY);
        }

        const deltaX = newX - el.x;
        const deltaY = newY - el.y;

        if (el.type === 'line' || el.type === 'arrow') {
          updateElementProps(
            doc,
            el.id,
            { x: newX, y: newY, x2: el.x2 + deltaX, y2: el.y2 + deltaY },
            userOrigin
          );
        } else if (el.type === 'pen' || el.type === 'highlighter') {
          const newPoints = el.points.map((p, i) => p + (i % 2 === 0 ? deltaX : deltaY));
          updateElementProps(doc, el.id, { x: newX, y: newY, points: newPoints }, userOrigin);
        } else {
          updateElementProps(doc, el.id, { x: newX, y: newY }, userOrigin);
        }
      });
    }, userOrigin);
  };

  // Hide properties bar if non-customizable tool is active and no selection
  if (
    (activeTool === 'eraser' || activeTool === 'hand' || activeTool === 'laser') &&
    selectedElements.length === 0
  ) {
    return null;
  }

  return (
    <div
      id="properties-dock"
      className="fixed top-20 left-6 z-20 flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-md border border-[#e5e5ea] rounded-2xl shadow-lg transition-all text-xs font-medium text-[#181818] max-w-[240px]"
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Alignment Bar (When 2+ elements selected) */}
      {isMultiSelection && (
        <div className="flex flex-col gap-1 pb-2 border-b border-[#f0f0f4]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">
            Align Selection
          </span>
          <div className="flex items-center gap-1 bg-[#f7f7f9] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleAlign('left')}
              title="Align Left"
              className="p-1.5 hover:bg-white hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('center')}
              title="Align Horizontal Center"
              className="p-1.5 hover:bg-white hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('right')}
              title="Align Right"
              className="p-1.5 hover:bg-white hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <AlignRight size={14} />
            </button>
            <div className="w-[1px] h-4 bg-[#e0e0e6] mx-0.5" />
            <button
              type="button"
              onClick={() => handleAlign('top')}
              title="Align Top"
              className="p-1.5 hover:bg-white hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <AlignStartVertical size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('middle')}
              title="Align Vertical Middle"
              className="p-1.5 hover:bg-white hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <AlignCenterVertical size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleAlign('bottom')}
              title="Align Bottom"
              className="p-1.5 hover:bg-white hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <AlignEndVertical size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Note Color Palette */}
      {isStickyTool && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            Paper Color
          </span>
          <div className="flex items-center gap-1.5">
            {STICKY_PALETTE.map((stk) => (
              <button
                key={stk.value}
                type="button"
                title={stk.name}
                onClick={() => handleFillPick(stk.value)}
                className={`w-5 h-5 rounded-full border border-black/10 transition-transform ${
                  fillColor === stk.value
                    ? 'scale-125 ring-2 ring-offset-1 ring-[#8169ff]'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: stk.value }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke / Text Color */}
      {!isStickyTool && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            {isTextTool ? 'Text Color' : 'Stroke Color'}
          </span>
          <div className="flex items-center gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => handleColorPick(c.value)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  strokeColor === c.value
                    ? 'scale-125 ring-2 ring-offset-1 ring-[#8169ff]'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Width */}
      {!isTextTool && !isStickyTool && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#f0f0f4]">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            Stroke Width
          </span>
          <div className="flex items-center gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.width}
                type="button"
                onClick={() => handleWidthPick(w.width)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  strokeWidth === w.width
                    ? 'bg-[#8169ff] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#555555] hover:bg-[#eaeaf0]'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shape Fill (Rect, Circle, Diamond, Star) */}
      {isShapeTool && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#f0f0f4]">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            Shape Fill
          </span>
          <div className="flex items-center gap-1.5">
            {FILL_PALETTE.map((f) => (
              <button
                key={f.value}
                type="button"
                title={f.name}
                onClick={() => handleFillPick(f.value)}
                className={`w-5 h-5 rounded-full border border-[#d0d0d8] relative transition-transform ${
                  fillColor === f.value
                    ? 'scale-125 ring-2 ring-offset-1 ring-[#8169ff]'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: f.value === 'transparent' ? '#ffffff' : f.value }}
              >
                {f.value === 'transparent' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-rose-500 rotate-45" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Size (Text & Sticky) */}
      {(isTextTool || isStickyTool) && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#f0f0f4]">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            Font Size
          </span>
          <div className="flex items-center gap-1">
            {FONT_SIZES.map((fs) => (
              <button
                key={fs.size}
                type="button"
                onClick={() => handleFontSizePick(fs.size)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  fontSize === fs.size
                    ? 'bg-[#8169ff] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#555555] hover:bg-[#eaeaf0]'
                }`}
              >
                {fs.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stroke Style (Solid, Dashed, Dotted) when elements are selected */}
      {selectedElements.length > 0 && !isTextTool && !isStickyTool && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#f0f0f4]">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            Line Style
          </span>
          <div className="flex items-center gap-1">
            {STROKE_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleStrokeStylePick(s.value)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  primarySelected?.strokeStyle === s.value
                    ? 'bg-[#8169ff] text-white'
                    : 'bg-[#f5f5f7] text-[#555555] hover:bg-[#eaeaf0]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Business Status Tag (For Sticky Notes) */}
      {selectedElements.length > 0 && selectedElements.some((e) => e.type === 'sticky') && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#f0f0f4]">
          <span className="text-[11px] font-semibold text-[#666666] tracking-wide">
            Business Status Tag
          </span>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {[
              { id: 'idea', label: '💡 Idea' },
              { id: 'approved', label: '✅ Approved' },
              { id: 'in_review', label: '⏳ In Review' },
              { id: 'blocked', label: '🚧 Blocked' },
              { id: 'done', label: '🎯 Goal' },
            ].map((tag) => {
              const isActive = (primarySelected as any)?.businessTag === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    handleBusinessTagPick(isActive ? undefined : tag.id);
                  }}
                  className={`px-2 py-1 rounded-lg font-bold border transition-all text-left truncate ${
                    isActive
                      ? 'bg-[#8169ff] text-white border-[#8169ff]'
                      : 'bg-[#f7f7f9] text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Author & Protection Controls */}
      {selectedElements.length === 1 && (
        <div className="flex flex-col gap-1 pt-1.5 border-t border-[#f0f0f4]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-medium">Drawing Author</span>
            <span className="font-semibold text-gray-800 truncate max-w-[110px]">
              {selectedElements[0].createdBy === userOrigin
                ? 'You (Author)'
                : selectedElements[0].createdByName || 'Collaborator'}
            </span>
          </div>
          {selectedElements[0].createdBy === userOrigin ? (
            <button
              type="button"
              onClick={() =>
                toggleElementProtection(
                  doc,
                  selectedElements[0].id,
                  selectedElements[0].isProtected === false,
                  userOrigin
                )
              }
              className={`mt-0.5 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                selectedElements[0].isProtected !== false
                  ? 'bg-[#8169ff]/10 text-[#8169ff] border border-[#8169ff]/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Shield size={12} />
              <span>{selectedElements[0].isProtected !== false ? '🛡️ Protected (Creator)' : '🌐 Open for All'}</span>
            </button>
          ) : selectedElements[0].isProtected !== false ? (
            <div className="mt-0.5 p-1 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
              <ShieldAlert size={12} className="shrink-0 text-amber-600" />
              <span>Protected by author</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Shape Grouping Controls */}
      {(canGroup || canUngroup) && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#f0f0f4]">
          <span className="text-[11px] text-gray-400 font-medium">Group Shapes</span>
          <div className="flex items-center gap-1.5">
            {canGroup && onGroupSelected && (
              <button
                type="button"
                id="btn-group-shapes"
                onClick={onGroupSelected}
                title="Group selected shapes (Ctrl+G)"
                className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-[#8169ff]/10 hover:bg-[#8169ff]/20 text-[#8169ff] text-xs font-bold transition-all border border-[#8169ff]/30"
              >
                <Component size={13} />
                <span>Group (Ctrl+G)</span>
              </button>
            )}
            {canUngroup && onUngroupSelected && (
              <button
                type="button"
                id="btn-ungroup-shapes"
                onClick={onUngroupSelected}
                title="Ungroup selected shapes (Ctrl+Shift+G)"
                className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all border border-gray-200"
              >
                <Boxes size={13} />
                <span>Ungroup</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Layering & Locking when items are selected */}
      {selectedElements.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f4]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBringToFront}
              title="Bring to Front"
              className="p-1.5 hover:bg-[#f3f1ff] hover:text-[#8169ff] rounded-lg transition-all text-[#555555]"
            >
              <Layers size={14} />
            </button>
            <button
              type="button"
              onClick={handleToggleLock}
              title={
                selectedElements.every((e) => e.isLocked)
                  ? 'Unlock Selected'
                  : 'Lock Selected'
              }
              className={`p-1.5 rounded-lg transition-all ${
                selectedElements.every((e) => e.isLocked)
                  ? 'bg-amber-100 text-amber-700'
                  : 'hover:bg-[#f3f1ff] hover:text-[#8169ff] text-[#555555]'
              }`}
            >
              {selectedElements.every((e) => e.isLocked) ? (
                <Lock size={14} />
              ) : (
                <Unlock size={14} />
              )}
            </button>
          </div>
          <span className="text-[10px] text-[#888888] font-medium">
            {selectedElements.length} selected
          </span>
        </div>
      )}
    </div>
  );
};
