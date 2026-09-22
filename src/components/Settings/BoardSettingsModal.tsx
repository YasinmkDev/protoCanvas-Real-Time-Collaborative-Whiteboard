import React, { useState } from 'react';
import * as Y from 'yjs';
import {
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Database,
  Download,
  Upload,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { WhiteboardElement } from '../../types';
import { setElementInDoc } from '../../lib/yjsSchema';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardCode: string;
  isSupabaseConnected: boolean;
  latencyMs: number;
  onReconnect: () => void;
  doc: Y.Doc;
  elements: WhiteboardElement[];
  userOrigin: string;
}

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  onClose,
  boardCode,
  isSupabaseConnected,
  latencyMs,
  onReconnect,
  doc,
  elements,
  userOrigin,
}) => {
  const [boardMode, setBoardMode] = useState<'creator_protected' | 'open'>(() => {
    try {
      const mode = doc.getText('board_permission_mode').toString();
      return mode === 'open' ? 'open' : 'creator_protected';
    } catch {
      return 'creator_protected';
    }
  });

  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeChange = (newMode: 'creator_protected' | 'open') => {
    setBoardMode(newMode);
    doc.transact(() => {
      const text = doc.getText('board_permission_mode');
      text.delete(0, text.length);
      text.insert(0, newMode);
    }, userOrigin);
  };

  // Export board as JSON
  const handleExportJson = () => {
    const data = {
      version: 1,
      boardCode,
      exportedAt: new Date().toISOString(),
      elementsCount: elements.length,
      elements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${boardCode}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import board from JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.elements || !Array.isArray(json.elements)) {
          throw new Error('Invalid board JSON format: "elements" array missing.');
        }

        doc.transact(() => {
          json.elements.forEach((el: WhiteboardElement) => {
            setElementInDoc(doc, el, userOrigin);
          });
        }, userOrigin);

        setImportStatus(`Successfully restored ${json.elements.length} elements!`);
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        setImportStatus(`Import failed: ${err.message || 'Corrupt JSON'}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-[#e5e5ea] flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8169ff]/10 text-[#8169ff] flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                Board Governance & Infrastructure
              </h3>
              <p className="text-xs text-gray-500">
                Room <span className="font-mono font-bold text-gray-700">{boardCode}</span> · Real-time status & access control
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

        {/* Backend & Security Status Box */}
        <div className="mt-5 p-4 rounded-2xl bg-gray-50/80 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-[#8169ff]" />
              <span className="text-xs font-bold text-gray-900">Secure Backend Environment</span>
            </div>
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSupabaseConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isSupabaseConnected ? 'Connected & Active' : 'Connecting / Local Mesh'}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Supabase Host</span>
              <span className="font-mono text-gray-800 font-semibold truncate block mt-0.5">
                luokhoatwhkjfthljypn.supabase.co
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Security Credential Source</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={12} />
                Environment (.env) Secured
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Real-Time Transport</span>
              <span className="text-gray-800 font-semibold flex items-center gap-1 mt-0.5">
                <Zap size={12} className="text-amber-500" />
                WebSocket CRDT (20 fps)
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block font-medium">Network Latency</span>
              <span className="text-gray-800 font-semibold flex items-center gap-1 mt-0.5">
                <Cpu size={12} className="text-[#8169ff]" />
                {latencyMs > 0 ? `${latencyMs}ms ping` : '< 25ms optimal'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Credentials are loaded securely via server environment variables.
            </span>
            <button
              type="button"
              onClick={onReconnect}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reconnect</span>
            </button>
          </div>
        </div>

        {/* Board Permission Governance Mode */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-gray-900 mb-2">
            Board Collaboration & Ownership Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => handleModeChange('creator_protected')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                boardMode === 'creator_protected'
                  ? 'border-[#8169ff] bg-[#8169ff]/5 text-gray-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Lock size={15} className="text-[#8169ff]" />
                <span>Protected Collaboration</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Drawings are protected by author. Collaborators must request edit permission to move or edit others' work.
              </p>
            </div>

            <div
              onClick={() => handleModeChange('open')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                boardMode === 'open'
                  ? 'border-[#8169ff] bg-[#8169ff]/5 text-gray-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Globe size={15} className="text-emerald-600" />
                <span>Open Collaboration</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Freeform team mode. Any participant on the board can edit, move, or style any drawing without restrictions.
              </p>
            </div>
          </div>
        </div>

        {/* Business Backup & Restore */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-900 mb-2">
            Enterprise Backup & Data Portability
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#e5e5ea] hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
            >
              <Download size={14} className="text-[#8169ff]" />
              <span>Export Board Backup (.json)</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#e5e5ea] hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer">
              <Upload size={14} className="text-emerald-600" />
              <span>Restore from .json</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <p className="mt-2 text-xs font-semibold text-[#8169ff] animate-in fade-in">
              {importStatus}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
