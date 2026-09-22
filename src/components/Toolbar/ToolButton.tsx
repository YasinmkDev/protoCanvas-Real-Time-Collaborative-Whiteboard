import React from 'react';

interface ToolButtonProps {
  id?: string;
  isActive?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  disabled?: boolean;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  id,
  isActive,
  onClick,
  icon,
  label,
  shortcut,
  disabled,
}) => {
  return (
    <button
      id={id}
      type="button"
      title={`${label} ${shortcut ? `(${shortcut})` : ''}`}
      onClick={onClick}
      disabled={disabled}
      className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 select-none ${
        disabled
          ? 'opacity-30 cursor-not-allowed text-[#999999]'
          : isActive
          ? 'bg-[#8169ff] text-white shadow-sm'
          : 'text-[#181818] hover:bg-[#f3f1ff] hover:text-[#8169ff]'
      }`}
    >
      {icon}

      {/* Floating tooltip */}
      <div className="pointer-events-none absolute -top-8.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 bg-[#181818] text-white text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap shadow-md flex items-center gap-1">
        <span>{label}</span>
        {shortcut && (
          <kbd className="bg-[#333333] text-white/80 px-1 py-0.2 rounded text-[9px] font-mono">
            {shortcut}
          </kbd>
        )}
      </div>
    </button>
  );
};
