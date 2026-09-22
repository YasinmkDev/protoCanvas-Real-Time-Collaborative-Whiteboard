import React, { useState } from 'react';
import { UserProfile } from '../../lib/auth';
import { Sparkles, LogIn, ArrowRight, User } from 'lucide-react';

interface LandingNavbarProps {
  currentUser: UserProfile;
  onOpenAuth: (mode: 'register' | 'login') => void;
  onLaunchCanvas: () => void;
  onJoinRoom: (code: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  currentUser,
  onOpenAuth,
  onLaunchCanvas,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState('');

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length >= 3) {
      onJoinRoom(clean);
    }
  };

  return (
    <header
      id="landing-navbar"
      className="sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur-md border-b border-[#f0f0f4] px-4 sm:px-8 flex items-center justify-between"
    >
      {/* Left: Brand Logo & Wordmark */}
      <div className="flex items-center gap-6">
        <a href="#hero" className="flex items-center gap-2.5 select-none group">
          <div className="w-8 h-8 rounded-xl bg-[#8169ff] group-hover:bg-[#6d4ff0] flex items-center justify-center text-white font-display font-extrabold text-lg shadow-xs transition-colors">
            P
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-[#000000]">
            ProtoCanvas
          </span>
        </a>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#181818]">
          <a
            href="#features"
            className="hover:text-[#8169ff] transition-colors"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="hover:text-[#8169ff] transition-colors"
          >
            3-Layer Engine
          </a>
          <a
            href="#interactive-demo"
            className="hover:text-[#8169ff] transition-colors"
          >
            Live Studio
          </a>
          <a
            href="#faq"
            className="hover:text-[#8169ff] transition-colors"
          >
            FAQ
          </a>
        </nav>
      </div>

      {/* Right Cluster: Quick Join + Auth/Launch CTA */}
      <div className="flex items-center gap-3">
        {/* Quick Room Input Pill */}
        <form onSubmit={handleRoomSubmit} className="hidden lg:flex items-center">
          <div className="flex items-center bg-gray-100 rounded-full pl-3 pr-1 py-1 border border-transparent focus-within:border-[#8169ff] focus-within:bg-white transition-all">
            <input
              type="text"
              placeholder="Join room..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-24 text-xs font-mono uppercase bg-transparent outline-none text-[#181818] placeholder:text-[#999999]"
            />
            <button
              type="submit"
              disabled={!roomCode.trim()}
              className="px-2.5 py-1 rounded-full bg-[#181818] hover:bg-black disabled:opacity-40 text-white text-[11px] font-semibold transition-all"
            >
              Go
            </button>
          </div>
        </form>

        {currentUser.isRegistered ? (
          /* User is Registered - Show User Identity & Launch Button */
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50/80 hover:bg-purple-100/80 border border-purple-100 cursor-pointer transition-colors"
              onClick={() => onOpenAuth('register')}
              title={`Logged in as ${currentUser.name} (${currentUser.role}). Click to edit profile.`}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.avatarInitials}
              </div>
              <span className="text-xs font-semibold text-[#181818] max-w-[100px] truncate hidden sm:inline">
                {currentUser.name}
              </span>
            </div>

            <button
              type="button"
              id="btn-launch-canvas-nav"
              onClick={onLaunchCanvas}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white font-display font-bold text-xs shadow-xs transition-all"
            >
              <span>Launch Canvas</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Guest / Not Logged In - Show Assigned Proper User ID & Sign In / Launch */
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/80 cursor-pointer transition-colors"
              onClick={() => onOpenAuth('register')}
              title={`Assigned Guest ID: ${currentUser.name}. Click to customize profile or sign in.`}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.avatarInitials}
              </div>
              <span className="text-xs font-semibold text-gray-700 max-w-[100px] truncate hidden sm:inline">
                {currentUser.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-gray-500 font-medium border border-gray-200 hidden sm:inline">
                Guest
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-[#8169ff] hover:underline px-2 py-1 transition-all"
            >
              Sign In
            </button>

            <button
              type="button"
              id="btn-nav-register"
              onClick={onLaunchCanvas}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white font-display font-bold text-xs shadow-xs transition-all"
            >
              <span>Launch Canvas</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
