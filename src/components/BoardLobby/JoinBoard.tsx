import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface JoinBoardProps {
  onJoin: (code: string) => void;
}

export const JoinBoard: React.FC<JoinBoardProps> = ({ onJoin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 3) {
      setError('Enter a valid 6-character room code');
      return;
    }
    setError('');
    onJoin(clean);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            id="join-code-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="e.g. ABC123"
            maxLength={8}
            className="w-full px-4 py-3 text-sm font-mono uppercase tracking-wider rounded-xl border border-[#d0d0d8] focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none"
          />
        </div>
        <button
          type="submit"
          id="btn-join-room"
          className="px-5 py-3 rounded-xl bg-[#181818] hover:bg-black text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
        >
          <LogIn size={15} />
          <span>Join Board</span>
        </button>
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </form>
  );
};
