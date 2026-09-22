import React, { useState } from 'react';
import { UserPresence } from '../../types';
import { COLLABORATOR_COLORS } from '../../hooks/useAwareness';
import { Users, Wifi, WifiOff, Settings2, Check, Sparkles } from 'lucide-react';

interface ParticipantListProps {
  currentUser: { id: string; name: string; color: string };
  collaborators: UserPresence[];
  status: 'connected' | 'connecting' | 'local-sync' | 'disconnected';
  isSupabaseConnected: boolean;
  latencyMs: number;
  onUpdateProfile: (name: string, color: string) => void;
  onOpenSettings: () => void;
  onToggleSimulator?: () => void;
  isSimulatorActive?: boolean;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  currentUser,
  collaborators,
  status,
  isSupabaseConnected,
  latencyMs,
  onUpdateProfile,
  onOpenSettings,
  onToggleSimulator,
  isSimulatorActive,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);
  const [tempColor, setTempColor] = useState(currentUser.color);

  const allUsers = [
    { ...currentUser, isSelf: true },
    ...collaborators.map((c) => ({ ...c, isSelf: false })),
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateProfile(tempName.trim(), tempColor);
      setIsProfileModalOpen(false);
    }
  };

  const getStatusBadge = () => {
    if (isSupabaseConnected && status === 'connected') {
      return (
        <div
          title={`Synced via Supabase Realtime (${latencyMs}ms)`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-xs cursor-pointer hover:bg-emerald-100 transition-colors"
          onClick={onOpenSettings}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime Live</span>
          <span className="text-[10px] opacity-75 font-mono">({latencyMs}ms)</span>
        </div>
      );
    }

    if (status === 'connecting') {
      return (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 shadow-xs cursor-pointer"
          onClick={onOpenSettings}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Connecting...</span>
        </div>
      );
    }

    // Real-time synchronization active
    return (
      <div
        title="Multiplayer synchronization active via CRDT real-time sync."
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#8169ff] text-xs font-semibold border border-purple-200 shadow-xs select-none"
      >
        <Wifi size={13} className="text-[#8169ff]" />
        <span>Live Sync</span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Simulation / Testing Bot Toggle */}
      {onToggleSimulator && (
        <button
          type="button"
          id="btn-simulate-collab"
          onClick={onToggleSimulator}
          title={
            isSimulatorActive
              ? 'Stop simulated collaborator'
              : 'Spawn interactive collaborator bot to test live real-time sync'
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            isSimulatorActive
              ? 'bg-[#8169ff] text-white border-[#8169ff] shadow-sm'
              : 'bg-white hover:bg-[#f3f1ff] text-[#181818] border-[#e5e5ea]'
          }`}
        >
          <Sparkles size={14} className={isSimulatorActive ? 'animate-spin' : 'text-[#8169ff]'} />
          <span>{isSimulatorActive ? 'Sim Active' : 'Sim Collaborator'}</span>
        </button>
      )}

      {/* Connection Status Badge */}
      {getStatusBadge()}

      {/* Participants Avatar Stack */}
      <div
        id="participants-stack"
        onClick={() => {
          setTempName(currentUser.name);
          setTempColor(currentUser.color);
          setIsProfileModalOpen(true);
        }}
        className="flex items-center -space-x-2 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors"
        title="Active participants. Click to edit your nickname & color."
      >
        {allUsers.slice(0, 5).map((user, idx) => (
          <div
            key={user.id || idx}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-xs select-none transition-transform hover:scale-110"
            style={{ backgroundColor: user.color }}
            title={`${user.name} ${user.isSelf ? '(You)' : ''}`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {allUsers.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-[#181818] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            +{allUsers.length - 5}
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#e5e5ea]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#181818]">
                Your Collaboration Identity
              </h3>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={24}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#d0d0d8] focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1.5">
                  Cursor & Avatar Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLLABORATOR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setTempColor(col)}
                      className={`h-9 rounded-xl flex items-center justify-center transition-transform ${
                        tempColor === col ? 'ring-3 ring-offset-2 ring-[#8169ff] scale-105' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {tempColor === col && <Check size={16} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8169ff] hover:bg-[#6d4ff0] text-white shadow-sm"
                >
                  Save Identity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
