import React, { useState } from 'react';
import { generateBoardCode, createBoardRecord } from '../../lib/supabase';
import { Plus, ArrowRight } from 'lucide-react';

interface CreateBoardProps {
  onBoardCreated: (code: string) => void;
}

export const CreateBoard: React.FC<CreateBoardProps> = ({ onBoardCreated }) => {
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const code = generateBoardCode();
      await createBoardRecord(code);
      onBoardCreated(code);
    } catch (err) {
      console.error('Failed to create board:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="btn-create-board"
      type="button"
      onClick={handleCreate}
      disabled={loading}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#8169ff] to-[#6d4ff0] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all text-left group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Plus size={22} className="text-white" />
        </div>
        <div>
          <h4 className="font-display font-bold text-base">Create New Board</h4>
          <p className="text-xs text-white/80">
            Generate unique 6-character room & instant link
          </p>
        </div>
      </div>
      <ArrowRight
        size={20}
        className="text-white/80 group-hover:translate-x-1 transition-transform"
      />
    </button>
  );
};
