import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  Plus,
  Search,
  Clock,
  Trash2,
  Copy,
  ArrowRight,
  FolderKanban,
  Edit2,
  Check,
  FileText,
  Shapes,
  Image as ImageIcon,
  StickyNote,
} from 'lucide-react';
import { BoardMetadata } from '../../types';
import {
  getLocalBoards,
  saveLocalBoard,
  deleteLocalBoard,
  renameLocalBoard,
  duplicateLocalBoard,
  generateBoardCode,
} from '../../lib/supabase';

interface CanvasHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardCode: string;
  onSelectBoard: (boardCode: string) => void;
  activeBoardElementCount?: number;
}

export const CanvasHistorySidebar: React.FC<CanvasHistorySidebarProps> = ({
  isOpen,
  onClose,
  currentBoardCode,
  onSelectBoard,
  activeBoardElementCount = 0,
}) => {
  const [boards, setBoards] = useState<BoardMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load boards on open and whenever currentBoardCode changes
  const reloadBoards = () => {
    const list = getLocalBoards();
    setBoards(list);
  };

  useEffect(() => {
    if (isOpen) {
      reloadBoards();
    }
  }, [isOpen, currentBoardCode]);

  // Format relative time helper
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Filtered boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase().trim();
    return boards.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.previewSnippet && b.previewSnippet.toLowerCase().includes(q))
    );
  }, [boards, searchQuery]);

  // Create new canvas
  const handleCreateNewBoard = () => {
    const newCode = generateBoardCode();
    saveLocalBoard({
      id: newCode,
      name: `Board ${newCode}`,
      elementCount: 0,
      previewSnippet: 'Fresh blank canvas',
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    });
    reloadBoards();
    onSelectBoard(newCode);
    onClose();
  };

  // Duplicate board
  const handleDuplicate = (b: BoardMetadata) => {
    const newCode = generateBoardCode();
    duplicateLocalBoard(b.id, newCode, `${b.name || `Board ${b.id}`} (Copy)`);
    reloadBoards();
    onSelectBoard(newCode);
  };

  // Delete board
  const handleDelete = (id: string) => {
    const updated = deleteLocalBoard(id);
    setBoards(updated);
    setDeleteConfirmId(null);
    // If deleted the currently active board, switch to the first available or create a new one
    if (id === currentBoardCode) {
      if (updated.length > 0) {
        onSelectBoard(updated[0].id);
      } else {
        handleCreateNewBoard();
      }
    }
  };

  // Start rename
  const handleStartRename = (b: BoardMetadata) => {
    setEditingId(b.id);
    setEditingName(b.name || `Board ${b.id}`);
  };

  // Commit rename
  const handleCommitRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      renameLocalBoard(id, trimmed);
      reloadBoards();
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile / outside click */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity lg:bg-transparent lg:pointer-events-none"
        onClick={onClose}
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        id="canvas-history-sidebar"
        className="fixed top-0 left-0 bottom-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-r border-gray-200 flex flex-col animate-in slide-in-from-left duration-200 lg:pointer-events-auto"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8169ff]/10 text-[#8169ff] flex items-center justify-center shadow-xs">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 font-display flex items-center gap-1.5">
                <span>Canvas History</span>
                <span className="text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {boards.length}
                </span>
              </h2>
              <p className="text-[11px] text-gray-500">Track and load previous whiteboards</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCreateNewBoard}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-semibold shadow-xs transition-colors"
              title="Create new canvas"
            >
              <Plus size={14} />
              <span>New</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Close history sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-100 bg-gray-50/60">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous canvases by name or note..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:border-[#8169ff] focus:ring-1 focus:ring-[#8169ff] outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Boards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredBoards.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                <FolderKanban size={24} />
              </div>
              <p className="text-xs font-semibold text-gray-700">No previous canvases found</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto">
                {searchQuery
                  ? 'No canvases matched your search terms.'
                  : 'Your canvas work and boards will automatically appear here as you draw.'}
              </p>
              <button
                type="button"
                onClick={handleCreateNewBoard}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#f3f1ff] hover:text-[#8169ff] text-xs font-semibold text-gray-700 transition-colors"
              >
                <Plus size={13} />
                <span>Start New Canvas</span>
              </button>
            </div>
          ) : (
            filteredBoards.map((b) => {
              const isActive = b.id === currentBoardCode;
              const isEditing = editingId === b.id;
              const isDeleting = deleteConfirmId === b.id;

              return (
                <div
                  key={b.id}
                  className={`group relative rounded-2xl border transition-all p-3 ${
                    isActive
                      ? 'bg-[#8169ff]/5 border-[#8169ff]/40 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top row: Title + Active Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommitRename(b.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="w-full text-xs font-bold text-gray-900 border border-[#8169ff] rounded px-1.5 py-0.5 outline-none bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleCommitRename(b.id)}
                            className="p-1 rounded bg-[#8169ff] text-white hover:bg-[#6d4ff0]"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3
                            onClick={() => {
                              if (!isActive) {
                                onSelectBoard(b.id);
                                onClose();
                              }
                            }}
                            className={`text-xs font-bold truncate cursor-pointer transition-colors ${
                              isActive
                                ? 'text-[#8169ff]'
                                : 'text-gray-800 group-hover:text-gray-900 hover:underline'
                            }`}
                            title="Click to open this canvas"
                          >
                            {b.name || `Board ${b.id}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleStartRename(b)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity p-0.5"
                            title="Rename board"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}

                      {/* Code & timestamp */}
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        <span className="font-mono font-semibold text-gray-500 bg-gray-100 px-1 py-0.2 rounded">
                          {b.id}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{formatTime(b.last_active_at || b.updated_at)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Active pill badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8169ff] text-white shrink-0 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBoard(b.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8169ff] hover:text-[#6d4ff0] bg-[#8169ff]/10 hover:bg-[#8169ff]/20 px-2 py-1 rounded-lg transition-colors shrink-0"
                        title="Load this previous canvas"
                      >
                        <span>Load</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>

                  {/* Preview Snippet / Content Summary */}
                  <div className="mt-2 text-[11px] text-gray-600 bg-gray-50/80 rounded-xl p-2 border border-gray-100">
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1 text-gray-700 font-semibold">
                        <Shapes size={11} className="text-[#8169ff]" />
                        {isActive ? activeBoardElementCount : b.elementCount ?? 0}{' '}
                        {(isActive ? activeBoardElementCount : b.elementCount ?? 0) === 1
                          ? 'element'
                          : 'elements'}
                      </span>

                      {b.elementsSummary?.stickies ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <StickyNote size={10} />
                          {b.elementsSummary.stickies} stickies
                        </span>
                      ) : null}

                      {b.elementsSummary?.images ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <ImageIcon size={10} />
                          {b.elementsSummary.images} images
                        </span>
                      ) : null}
                    </div>

                    {b.previewSnippet ? (
                      <p className="mt-1 text-[10px] text-gray-500 italic line-clamp-1">
                        "{b.previewSnippet}"
                      </p>
                    ) : null}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(b)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title="Duplicate canvas into new board"
                      >
                        <Copy size={11} />
                        <span>Duplicate</span>
                      </button>
                    </div>

                    <div>
                      {isDeleting ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-150">
                          <span className="text-[10px] text-red-600 font-medium mr-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px]"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(b.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete canvas from history"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70 text-[10px] text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Local autosave active</span>
          </span>
          <span className="font-mono text-[9px] text-gray-400">ProtoCanvas v2.4</span>
        </div>
      </aside>
    </>
  );
};
