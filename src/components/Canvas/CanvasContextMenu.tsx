import React, { useEffect, useRef, useState } from 'react';
import { WhiteboardElement, Tool, BusinessTag, StickyElement } from '../../types';
import {
  Copy,
  Scissors,
  Clipboard,
  CopyPlus,
  Trash2,
  FolderPlus,
  FolderMinus,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  StickyNote,
  Square,
  Circle,
  Diamond,
  MoveRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  CheckSquare,
  ChevronRight,
  Sparkles,
  Tag,
  AlertCircle,
  History,
} from 'lucide-react';

export interface ContextMenuPosition {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: ContextMenuPosition;
  onClose: () => void;
  selectedElements: WhiteboardElement[];
  allElements: WhiteboardElement[];
  canGroup: boolean;
  canUngroup: boolean;
  canPaste: boolean;
  canEditSelected: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: (pos?: { x: number; y: number }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onToggleLock: () => void;
  onToggleProtection: () => void;
  onSelectAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onInsertShape: (type: Tool, pos: { x: number; y: number }) => void;
  onUpdateStickyTag?: (tag: BusinessTag) => void;
  onEditText?: () => void;
  onOpenHistory?: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  selectedElements,
  allElements,
  canGroup,
  canUngroup,
  canPaste,
  canEditSelected,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onToggleProtection,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onInsertShape,
  onUpdateStickyTag,
  onEditText,
  onOpenHistory,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasSelection = selectedElements.length > 0;
  const isMultiSelection = selectedElements.length > 1;
  const anyLocked = selectedElements.some((el) => el.isLocked);
  const anyProtected = selectedElements.some((el) => el.isProtected !== false);
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const isStickySelected = singleElement?.type === 'sticky';
  const isTextOrSticky = singleElement?.type === 'text' || singleElement?.type === 'sticky';

  // Smart boundary clamp calculations
  const menuWidth = 240;
  const menuHeight = hasSelection ? 420 : 340;
  const padding = 12;

  let left = position.x;
  let top = position.y;

  if (typeof window !== 'undefined') {
    if (left + menuWidth > window.innerWidth - padding) {
      left = Math.max(padding, left - menuWidth);
    }
    if (top + menuHeight > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - menuHeight - padding);
    }
  }

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      id="canvas-context-menu"
      className="fixed z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e5e5ea] text-gray-800 text-xs font-medium py-1.5 shadow-2xl select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        left,
        top,
        minWidth: '228px',
        boxShadow:
          'rgba(0, 0, 0, 0.16) 0px 8px 24px -4px, rgba(0, 0, 0, 0.08) 0px 2px 6px 0px, 0 0 0 1px rgba(0,0,0,0.06)',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* SELECTION CONTEXT */}
      {hasSelection ? (
        <div className="space-y-0.5">
          {/* Header pill showing selected count or type */}
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-gray-100 text-[11px] text-gray-400">
            <span className="font-semibold text-gray-700">
              {isMultiSelection
                ? `${selectedElements.length} Elements Selected`
                : singleElement?.type.toUpperCase()}
            </span>
            {canGroup && (
              <span className="text-[10px] bg-purple-50 text-[#8169ff] font-bold px-1.5 py-0.5 rounded-md">
                Groupable
              </span>
            )}
            {canUngroup && (
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-md">
                Grouped
              </span>
            )}
          </div>

          {/* Edit Text shortcut if applicable */}
          {isTextOrSticky && onEditText && (
            <button
              type="button"
              onClick={() => handleAction(onEditText)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-purple-50 hover:text-[#8169ff] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Type size={14} />
                <span>Edit Content</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Enter</span>
            </button>
          )}

          {/* Clipboard Actions */}
          <button
            type="button"
            onClick={() => handleAction(onCopy)}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Copy size={14} className="text-gray-500" />
              <span>Copy</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+C</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onCut)}
            disabled={!canEditSelected}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Scissors size={14} className="text-gray-500" />
              <span>Cut</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+X</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(() => onPaste({ x: position.canvasX, y: position.canvasY }))}
            disabled={!canPaste}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Clipboard size={14} className="text-gray-500" />
              <span>Paste Here</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+V</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onDuplicate)}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <CopyPlus size={14} className="text-gray-500" />
              <span>Duplicate</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+D</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Grouping Section */}
          {canGroup && (
            <button
              type="button"
              onClick={() => handleAction(onGroup)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#8169ff]/10 hover:text-[#8169ff] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FolderPlus size={14} className="text-[#8169ff]" />
                <span className="font-semibold">Group Shapes</span>
              </div>
              <span className="text-[10px] text-[#8169ff] font-mono">Ctrl+G</span>
            </button>
          )}

          {canUngroup && (
            <button
              type="button"
              onClick={() => handleAction(onUngroup)}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FolderMinus size={14} className="text-amber-600" />
                <span className="font-semibold">Ungroup</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Ctrl+Shift+G</span>
            </button>
          )}

          {/* Layer Ordering Submenu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('layers')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <ArrowUpToLine size={14} className="text-gray-500" />
                <span>Layer Order</span>
              </div>
              <ChevronRight size={13} className="text-gray-400" />
            </div>

            {activeSubmenu === 'layers' && (
              <div
                className="absolute left-full top-0 ml-1 bg-white rounded-xl border border-[#e5e5ea] py-1 shadow-xl min-w-[170px] z-50 animate-in fade-in zoom-in-95 duration-100"
                style={{
                  boxShadow: 'rgba(0, 0, 0, 0.16) 0px 8px 24px -4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleAction(onBringToFront)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpToLine size={13} />
                    <span>Bring to Front</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Ctrl+]</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onBringForward)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUp size={13} />
                    <span>Bring Forward</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Alt+]</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onSendBackward)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDown size={13} />
                    <span>Send Backward</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Alt+[</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(onSendToBack)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownToLine size={13} />
                    <span>Send to Back</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Ctrl+[</span>
                </button>
              </div>
            )}
          </div>

          <div className="my-1 border-t border-gray-100" />

          {/* Sticky Note Kanban Metadata Quick-Tagger */}
          {isStickySelected && onUpdateStickyTag && (
            <div
              className="relative"
              onMouseEnter={() => setActiveSubmenu('stickyMeta')}
              onMouseLeave={() => setActiveSubmenu(null)}
            >
              <div className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <Tag size={14} className="text-[#8169ff]" />
                  <span>Business Tag</span>
                </div>
                <ChevronRight size={13} className="text-gray-400" />
              </div>

              {activeSubmenu === 'stickyMeta' && (
                <div
                  className="absolute left-full top-0 ml-1 bg-white rounded-xl border border-[#e5e5ea] py-1 shadow-xl min-w-[160px] z-50 animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    boxShadow: 'rgba(0, 0, 0, 0.16) 0px 8px 24px -4px',
                  }}
                >
                  <div className="px-3 py-1 text-[10px] text-gray-400 font-semibold uppercase">
                    Status Tag
                  </div>
                  {(
                    [
                      { id: 'idea', label: '💡 Idea' },
                      { id: 'in_review', label: '🔍 In Review' },
                      { id: 'approved', label: '✨ Approved' },
                      { id: 'done', label: '✅ Done' },
                      { id: 'blocked', label: '🚫 Blocked' },
                    ] as { id: BusinessTag; label: string }[]
                  ).map((tagItem) => (
                    <button
                      key={tagItem.id}
                      type="button"
                      onClick={() => handleAction(() => onUpdateStickyTag(tagItem.id))}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>{tagItem.label}</span>
                      {(singleElement as StickyElement)?.businessTag === tagItem.id && (
                        <CheckSquare size={13} className="text-[#8169ff]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lock & Protection Controls */}
          <button
            type="button"
            onClick={() => handleAction(onToggleLock)}
            disabled={!canEditSelected}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {anyLocked ? (
                <Unlock size={14} className="text-emerald-600" />
              ) : (
                <Lock size={14} className="text-gray-500" />
              )}
              <span>{anyLocked ? 'Unlock Elements' : 'Lock Elements'}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+L</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onToggleProtection)}
            disabled={!canEditSelected}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {anyProtected ? (
                <ShieldOff size={14} className="text-amber-600" />
              ) : (
                <ShieldCheck size={14} className="text-emerald-600" />
              )}
              <span>{anyProtected ? 'Open for Collaborators' : 'Shield Protect'}</span>
            </div>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Delete Action */}
          <button
            type="button"
            onClick={() => handleAction(onDelete)}
            disabled={!canEditSelected}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-rose-50 text-rose-600 disabled:opacity-40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={14} />
              <span className="font-medium">Delete</span>
            </div>
            <span className="text-[10px] text-rose-400 font-mono">Del</span>
          </button>
        </div>
      ) : (
        /* EMPTY CANVAS CONTEXT */
        <div className="space-y-0.5">
          <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400">
            Canvas Actions
          </div>

          <button
            type="button"
            onClick={() => handleAction(() => onPaste({ x: position.canvasX, y: position.canvasY }))}
            disabled={!canPaste}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Clipboard size={14} className="text-gray-500" />
              <span>Paste Here</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+V</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Quick Insert Items */}
          <button
            type="button"
            onClick={() =>
              handleAction(() =>
                onInsertShape('sticky', { x: position.canvasX, y: position.canvasY })
              )
            }
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-yellow-50 hover:text-amber-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <StickyNote size={14} className="text-amber-500" />
              <span>Insert Sticky Note</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">N</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAction(() =>
                onInsertShape('text', { x: position.canvasX, y: position.canvasY })
              )
            }
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Type size={14} className="text-gray-500" />
              <span>Insert Text</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">T</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAction(() =>
                onInsertShape('rect', { x: position.canvasX, y: position.canvasY })
              )
            }
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Square size={14} className="text-gray-500" />
              <span>Insert Rectangle</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">R</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAction(() =>
                onInsertShape('circle', { x: position.canvasX, y: position.canvasY })
              )
            }
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Circle size={14} className="text-gray-500" />
              <span>Insert Circle</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">O</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAction(() =>
                onInsertShape('diamond', { x: position.canvasX, y: position.canvasY })
              )
            }
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Diamond size={14} className="text-gray-500" />
              <span>Insert Decision Diamond</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">D</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAction(() =>
                onInsertShape('arrow', { x: position.canvasX, y: position.canvasY })
              )
            }
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <MoveRight size={14} className="text-gray-500" />
              <span>Insert Arrow Connector</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">A</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Select All */}
          <button
            type="button"
            onClick={() => handleAction(onSelectAll)}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare size={14} className="text-gray-500" />
              <span>Select All</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+A</span>
          </button>

          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => handleAction(onZoomIn)}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ZoomIn size={14} className="text-gray-500" />
              <span>Zoom In</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">+</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onZoomOut)}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ZoomOut size={14} className="text-gray-500" />
              <span>Zoom Out</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">-</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onResetZoom)}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Maximize size={14} className="text-gray-500" />
              <span>Reset to 100%</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Ctrl+0</span>
          </button>

          {onOpenHistory && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => handleAction(onOpenHistory)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-purple-50 text-[#8169ff] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <History size={14} className="text-[#8169ff]" />
                  <span className="font-medium">Previous Whiteboards</span>
                </div>
                <span className="text-[10px] text-[#8169ff]/70 font-mono">History</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
