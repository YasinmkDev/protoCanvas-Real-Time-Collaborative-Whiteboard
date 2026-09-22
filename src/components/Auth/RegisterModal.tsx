import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  supabaseSignUp,
  supabaseSignIn,
  quickGuestLogin,
} from '../../lib/auth';
import { COLLABORATOR_COLORS } from '../../hooks/useAwareness';
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  initialMode?: 'register' | 'login';
}

const ROLES = [
  'Product Designer',
  'Software Architect',
  'Design Engineer',
  'Product Manager',
  'Creative Director',
  'Motion Lead',
];

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedColor, setSelectedColor] = useState(COLLABORATOR_COLORS[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid business or personal email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password is required and must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please provide your full display name.');
        return;
      }

      setIsLoading(true);
      try {
        const { user, error: authError } = await supabaseSignUp({
          name: cleanName,
          email: cleanEmail,
          password,
          role: selectedRole,
          color: selectedColor,
        });

        if (authError && !user) {
          setError(authError);
          setIsLoading(false);
          return;
        }

        onSuccess(user);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Registration encountered an error. Please retry.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        const { user, error: authError } = await supabaseSignIn(cleanEmail, password);

        if (authError || !user) {
          setError(authError || 'Invalid email or password. Please check credentials.');
          setIsLoading(false);
          return;
        }

        onSuccess(user);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Sign in encountered an error. Please retry.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGuestEntry = () => {
    const profile = quickGuestLogin(name || undefined);
    onSuccess(profile);
    onClose();
  };

  const previewInitials = name.trim()
    ? name.trim().slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#e5e5ea] relative overflow-hidden transition-all"
        style={{
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-[#8169ff] via-[#9d8bfd] to-[#6d4ff0]" />

        <div className="p-6 sm:p-7">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* Modal Header with Live Avatar Preview */}
          <div className="flex items-center gap-3.5 mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-lg shadow-sm transition-all relative overflow-hidden shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              {mode === 'register' ? previewInitials : 'P'}
              <div className="absolute inset-0 bg-linear-to-tr from-black/15 to-transparent pointer-events-none" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-gray-900 tracking-tight leading-snug">
                {mode === 'register' ? 'Join ProtoCanvas Studio' : 'Welcome Back'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {mode === 'register'
                  ? 'Set up your cloud profile & real-time identity'
                  : 'Sign in to access your cloud whiteboards'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-gray-100/90 rounded-xl mb-5 border border-gray-200/60">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  required
                  placeholder="maya@designstudio.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <span className="text-[11px] text-gray-400">Min. 6 characters</span>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#8169ff] focus:ring-2 focus:ring-[#8169ff]/20 outline-none text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                {/* Role Selection Pills */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Briefcase size={14} className="text-gray-500" />
                    <label className="text-xs font-semibold text-gray-700">
                      Studio Role
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedRole === r
                            ? 'bg-[#8169ff] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cursor Color Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Multiplayer Ghost Cursor Color
                  </label>
                  <div className="flex items-center gap-2">
                    {COLLABORATOR_COLORS.slice(0, 7).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          selectedColor === c
                            ? 'scale-115 ring-2 ring-offset-2 ring-[#8169ff] shadow-xs'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        title={`Select ${c}`}
                      >
                        {selectedColor === c && (
                          <Check size={13} className="text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs animate-in fade-in duration-150">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              id="btn-submit-auth"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] disabled:opacity-60 text-white font-display font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting with Supabase...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'register' ? 'Create Account & Enter' : 'Sign In & Enter'}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-2.5 text-gray-400 font-medium">
                or continue as guest
              </span>
            </div>
          </div>

          {/* 1-Click Guest Button */}
          <button
            type="button"
            id="btn-guest-entry"
            onClick={handleGuestEntry}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-purple-50/60 hover:text-[#8169ff] hover:border-[#8169ff]/40 text-gray-700 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={15} className="text-[#8169ff]" />
            <span>Instant 1-Click Guest Access</span>
          </button>

          <p className="text-center text-[11px] text-gray-400 mt-3.5 flex items-center justify-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
            <span>Supabase Auth & CRDT Conflict-Free Synchronization</span>
          </p>
        </div>
      </div>
    </div>
  );
};
