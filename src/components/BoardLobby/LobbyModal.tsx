import React, { useEffect, useState } from 'react';
import { BoardMetadata } from '../../types';
import { fetchRecentBoards } from '../../lib/supabase';
import { CreateBoard } from './CreateBoard';
import { JoinBoard } from './JoinBoard';
import { LayoutGrid, Share2, Copy, Check, Clock, X, History } from 'lucide-react';

interface LobbyModalProps {
  currentBoardCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectBoard: (code: string) => void;
  onOpenHistory?: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  currentBoardCode,
  isOpen,
  onClose,
  onSelectBoard,
  onOpenHistory,
}) => {
  const [recentBoards, setRecentBoards] = useState<BoardMetadata[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRecentBoards().then(setRecentBoards);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}?board=${currentBoardCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelect = (code: string) => {
    onSelectBoard(code);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#e5e5ea] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8169ff] flex items-center justify-center">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#181818]">
                Rooms & Boards
              </h3>
              <p className="text-xs text-[#666666]">
                Current Room: <span className="font-mono font-bold text-[#8169ff]">{currentBoardCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-5 overflow-y-auto flex-1">
          {/* Share Current Board */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Share2 size={16} className="text-[#8169ff] shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-xs text-gray-900">Share This Whiteboard</p>
                <p className="text-[11px] text-gray-500 font-mono truncate">{shareUrl}</p>
              </div>
            </div>
            <button
              type="button"
              id="btn-copy-share-link"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shrink-0 transition-all"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Create New Board */}
          <div>
            <CreateBoard onBoardCreated={handleSelect} />
          </div>

          {/* Join with Code */}
          <div>
            <label className="block text-xs font-semibold text-[#555555] mb-1.5">
              Join with 6-Char Code
            </label>
            <JoinBoard onJoin={handleSelect} />
          </div>

          {/* Recent Active Boards List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#555555] flex items-center gap-1.5">
                <Clock size={13} />
                <span>Recent Active Boards (FR-1)</span>
              </span>
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="text-[11px] text-[#8169ff] hover:text-[#6d4ff0] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <History size={12} />
                  <span>Full History</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentBoards.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-400">
                  No other recent boards recorded yet.
                </div>
              ) : (
                recentBoards.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelect(b.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      b.id === currentBoardCode
                        ? 'border-[#8169ff] bg-purple-50/50'
                        : 'border-gray-100 bg-gray-50 hover:bg-purple-50/30 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#181818]">
                        {b.id}
                      </span>
                      {b.id === currentBoardCode && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#8169ff] text-white text-[9px] font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(b.last_active_at || b.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
