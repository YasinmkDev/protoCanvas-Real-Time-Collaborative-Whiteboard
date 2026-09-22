import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
} from '../../lib/supabase';
import { Database, Check, ShieldCheck, X, ExternalLink, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupabaseConnected: boolean;
  onReconnect: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  isSupabaseConnected,
  onReconnect,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    if (cfg) {
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && anonKey.trim()) {
      saveSupabaseConfig(url.trim(), anonKey.trim());
      setSavedSuccess(true);
      onReconnect();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    onReconnect();
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
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8169ff] flex items-center justify-center">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#181818]">
                Supabase Realtime Backend
              </h3>
              <p className="text-xs text-[#666666]">
                Configure Supabase Postgres & Realtime Transport
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

        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Current Status Card */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isSupabaseConnected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : 'bg-purple-50/70 border-purple-200 text-purple-900'
            }`}
          >
            <ShieldCheck size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                {isSupabaseConnected
                  ? 'Supabase Realtime Connected'
                  : 'Multi-Tab Collaborative Mode Active'}
              </p>
              <p className="text-[11px] mt-0.5 opacity-85 leading-relaxed">
                {isSupabaseConnected
                  ? 'Connected to Supabase Realtime channel & Postgres BYTEA persistence. Cursors and CRDT edits broadcast live with sub-50ms latency.'
                  : 'Currently syncing instantaneously across browser tabs using BroadcastChannel. You can connect your own Supabase project below to enable cross-device cloud persistence.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#d0d0d8] focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Supabase Anon Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#d0d0d8] focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Safe for client-side use with Supabase Row Level Security (RLS) enabled.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-500 hover:text-rose-600 font-semibold"
              >
                Clear Credentials
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onReconnect}
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Reconnect</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {savedSuccess ? <Check size={14} /> : null}
                  <span>{savedSuccess ? 'Saved & Connected' : 'Save Config'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Architecture info */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800">3-Layer State Architecture</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li><b>Layer 1 (Ephemeral):</b> Live cursors + active selection via Awareness</li>
              <li><b>Layer 2 (Committed):</b> Yjs CRDT elements synced via Supabase Realtime</li>
              <li><b>Layer 3 (Persisted):</b> BYTEA snapshots stored in Postgres <code className="bg-gray-200 px-1 py-0.2 rounded font-mono">yjs_documents</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
