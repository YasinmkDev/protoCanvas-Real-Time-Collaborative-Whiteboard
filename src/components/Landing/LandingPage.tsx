import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../lib/auth';
import { getLocalBoards } from '../../lib/supabase';
import { BoardMetadata } from '../../types';
import { LandingNavbar } from './LandingNavbar';
import { PlayfulMiniCanvas } from './PlayfulMiniCanvas';
import { PlayfulReactionStickerPad } from './PlayfulReactionStickerPad';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  Shield,
  Layers,
  FileCode,
  Download,
  Share2,
  ChevronDown,
  Play,
  CheckCircle2,
  Laptop,
  Palette,
  History,
  Clock,
} from 'lucide-react';

interface LandingPageProps {
  currentUser: UserProfile;
  onOpenAuth: (mode: 'register' | 'login') => void;
  onLaunchCanvas: (roomCode?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenAuth,
  onLaunchCanvas,
}) => {
  const [heroRoomCode, setHeroRoomCode] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [recentBoards, setRecentBoards] = useState<BoardMetadata[]>([]);

  useEffect(() => {
    try {
      const boards = getLocalBoards();
      setRecentBoards(boards.slice(0, 4));
    } catch {
      // silent fallback
    }
  }, []);

  const handleHeroJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroRoomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean) {
      onLaunchCanvas(clean);
    } else {
      onLaunchCanvas();
    }
  };

  const faqs = [
    {
      q: 'How does real-time collaboration work without merge conflicts?',
      a: 'ProtoCanvas uses Yjs CRDTs (Conflict-free Replicated Data Types) where elements have unique deterministic IDs. Simultaneous operations converge mathematically to the exact same state on all machines, guaranteeing zero merge conflicts even during high-frequency concurrent sketching.',
    },
    {
      q: 'What is the 3-Layer state architecture?',
      a: '1) Ephemeral: Sub-50ms live cursor and awareness broadcasts over Supabase Realtime. 2) Committed: In-memory Yjs CRDT document managing shapes, strokes, and text. 3) Persisted: Supabase Postgres database storing BYTEA binary snapshots with automatic 10-second debounce and room archiving.',
    },
    {
      q: 'Do I need an account to collaborate with my team?',
      a: 'No! While you can register for a personalized profile with custom cursor colors and roles, you can also join any 6-character room instantly as a guest with 1 click.',
    },
    {
      q: 'Can I export our whiteboard drawings to vector or PNG formats?',
      a: 'Yes! The studio provides instant 1-click vector SVG export (mathematical cubic Bézier paths that scale infinitely) and high-resolution 2x Retina PNG export.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#181818] font-sans relative selection:bg-[#8169ff] selection:text-white">
      {/* Atmosphere Gradients: Aqua Wash on Left & Lilac Bleed on Right */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background: `
            radial-gradient(47.72% 108.66% at -12.1% 21.18%, rgba(129, 219, 219, 0.25) 24.27%, rgba(160, 232, 232, 0) 100%),
            radial-gradient(62.81% 136.54% at 103.92% 77.32%, rgba(227, 222, 255, 0.7) 0%, rgba(201, 191, 255, 0) 100%)
          `,
        }}
      />

      {/* Top Navbar */}
      <LandingNavbar
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onLaunchCanvas={() => onLaunchCanvas()}
        onJoinRoom={(code) => onLaunchCanvas(code)}
      />

      <main className="relative z-10">
        {/* ================= HERO SECTION ================= */}
        <section id="hero" className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Tag Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f3f1ff] border border-[#e3deff] text-[#8169ff] text-xs font-semibold tracking-wide uppercase mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#8169ff] animate-pulse" />
            <span>Multi-User CRDT Prototyping Workshop</span>
          </div>

          {/* Display Headline */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-[62px] text-[#000000] tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6">
            Think together in real-time.{' '}
            <span className="text-[#8169ff]">Zero merge conflicts.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-base sm:text-xl text-[#555555] max-w-2xl mx-auto mb-4 leading-relaxed">
            An infinite vector canvas powered by Yjs and Supabase Realtime.
            Sketch, wireframe, and brainstorm with live sub-50ms multiplayer awareness.
          </p>

          {/* Playful Handwritten Script Callout */}
          <div className="mb-8 select-none">
            <span className="font-handwriting text-2xl sm:text-3xl text-[#8169ff] -rotate-4 inline-block transform hover:scale-105 transition-transform">
              ~ live interactive drafting table below ~
            </span>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-12">
            {currentUser.isRegistered ? (
              <button
                type="button"
                id="btn-hero-launch"
                onClick={() => onLaunchCanvas()}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white font-display font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Canvas as {currentUser.name}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                id="btn-hero-register"
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white font-display font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Register & Enter Canvas</span>
              </button>
            )}

            {/* Room Code Quick Join Form */}
            <form onSubmit={handleHeroJoinRoom} className="w-full sm:w-auto flex items-center">
              <div className="w-full flex items-center bg-white rounded-xl pl-3.5 pr-1.5 py-1.5 border border-[#e5e5ea] focus-within:border-[#8169ff] focus-within:ring-2 focus-within:ring-[#8169ff]/20 shadow-xs">
                <input
                  type="text"
                  placeholder="Room Code (ABC123)"
                  value={heroRoomCode}
                  onChange={(e) => setHeroRoomCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full sm:w-36 text-xs font-mono uppercase bg-transparent outline-none text-[#181818] placeholder:text-[#999999]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-[#181818] hover:bg-black text-white text-xs font-semibold transition-all shrink-0 cursor-pointer"
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Quick Resume Recent Whiteboards */}
          {recentBoards.length > 0 && (
            <div className="w-full max-w-xl mx-auto mb-10 p-3.5 rounded-2xl bg-white/90 border border-[#e5e5ea] shadow-xs backdrop-blur-xs text-left animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <History size={13} className="text-[#8169ff]" />
                  <span>Resume Previous Whiteboards</span>
                </span>
                <span className="text-[11px] text-gray-400">Stored locally in your browser</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentBoards.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onLaunchCanvas(b.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-purple-50/50 hover:border-[#8169ff]/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-gray-900 group-hover:text-[#8169ff]">
                          {b.id}
                        </span>
                        {b.name && (
                          <span className="text-xs font-medium text-gray-600 truncate max-w-[110px]">
                            · {b.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {b.previewSnippet || `${b.elementCount || 0} elements on canvas`}
                      </p>
                    </div>
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-[#8169ff] shrink-0 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#555555] font-medium mb-14">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-[#8169ff]" />
              <span>&lt;50ms Realtime Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-[#8169ff]" />
              <span>Yjs CRDT Determinism</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#8169ff]" />
              <span>Infinite Room Collaboration</span>
            </div>
          </div>

          {/* Interactive Playful Hero Demo Panel */}
          <div id="interactive-demo">
            <PlayfulMiniCanvas onOpenCanvas={() => onLaunchCanvas()} />
          </div>
        </section>

        {/* ================= INTERACTIVE PLAYFUL REACTION STAMP PAD ================= */}
        <section className="border-y border-[#f0f0f4] bg-white/60 backdrop-blur-xs">
          <PlayfulReactionStickerPad />
        </section>

        {/* ================= TRUST LOGO STRIP ================= */}
        <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#999999] mb-8">
            Engineered for high-bandwidth creative teams & design workshops
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-center opacity-65 grayscale hover:grayscale-0 transition-all">
            {['Figma', 'Supabase', 'Linear', 'Notion', 'ProtoPie', 'Vercel'].map((name) => (
              <div
                key={name}
                className="flex items-center justify-center py-2 px-4 text-sm font-display font-bold text-[#555555] hover:text-[#181818] transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </section>

        {/* ================= 3-LAYER ARCHITECTURE & FEATURES ================= */}
        <section id="architecture" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#8169ff] text-xs font-semibold uppercase mb-3">
              <Layers size={13} />
              <span>Architecture Specification</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#000000] tracking-tight mb-4">
              The 3-Layer Realtime Canvas Engine
            </h2>
            <p className="text-base text-[#555555]">
              Designed according to modern multiplayer primitives: instant sub-50ms awareness,
              mathematically guaranteed state convergence, and durable Postgres snapshots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Layer 1: Ephemeral */}
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e5ea] transition-all hover:border-[#8169ff]/40"
              style={{
                boxShadow:
                  'rgba(0, 0, 0, 0.08) 0px 3px 12px 0px, rgba(0, 0, 0, 0.04) 0px 0px 2px 0px',
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8169ff] mb-5 font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-display font-bold text-xl text-[#000000] mb-2">
                Layer 1: Ephemeral Awareness
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed mb-4">
                High-frequency live cursor positions, user selection boxes, and connection heartbeats
                broadcast over Supabase Realtime broadcast channels at 50ms intervals.
              </p>
              <ul className="space-y-2 text-xs text-[#555555]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Sub-50ms cursor latency throttle</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Curated 10-color WCAG presence indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Cross-tab BroadcastChannel fallback</span>
                </li>
              </ul>
            </div>

            {/* Layer 2: Committed CRDT */}
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e5ea] transition-all hover:border-[#8169ff]/40"
              style={{
                boxShadow:
                  'rgba(0, 0, 0, 0.08) 0px 3px 12px 0px, rgba(0, 0, 0, 0.04) 0px 0px 2px 0px',
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8169ff] mb-5 font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-display font-bold text-xl text-[#000000] mb-2">
                Layer 2: Committed Yjs CRDT
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed mb-4">
                Vector strokes, geometric rectangles, ellipses, and text primitives are stored in a
                shared Y.Map. Any edit automatically converges across all clients with zero conflicts.
              </p>
              <ul className="space-y-2 text-xs text-[#555555]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Quadratic Bézier freehand smoothing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Per-user scoped Undo/Redo tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Native multi-element bounding boxes</span>
                </li>
              </ul>
            </div>

            {/* Layer 3: Persisted Postgres */}
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e5ea] transition-all hover:border-[#8169ff]/40"
              style={{
                boxShadow:
                  'rgba(0, 0, 0, 0.08) 0px 3px 12px 0px, rgba(0, 0, 0, 0.04) 0px 0px 2px 0px',
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8169ff] mb-5 font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-display font-bold text-xl text-[#000000] mb-2">
                Layer 3: Supabase Postgres
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed mb-4">
                Documents are saved as compacted binary snapshots (BYTEA) directly in Supabase Postgres.
                Anyone opening a room URL loads the exact vector state in milliseconds.
              </p>
              <ul className="space-y-2 text-xs text-[#555555]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Compact Yjs document snapshots</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Automatic 10s debounced updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#8169ff]" />
                  <span>Room archiving & access control rules</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= STUDIO TOOL FEATURES GRID ================= */}
        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f1ff] text-[#8169ff] text-xs font-semibold mb-3">
                <Palette size={13} />
                <span>Crafted For Prototypers</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#000000] tracking-tight mb-4">
                Raw 2D HTML5 Canvas Performance.
              </h2>
              <p className="text-base text-[#555555] leading-relaxed mb-6">
                Unlike DOM-heavy diagramming tools that drop frames under load, ProtoCanvas renders
                straight to high-DPI 2D canvas with requestAnimationFrame loops, giving 60fps pan/zoom
                and sub-pixel crisp vector lines.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Download className="text-[#8169ff] mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-[#181818]">Instant SVG & 2x PNG Export</h4>
                    <p className="text-xs text-[#555555]">
                      Export clean vector paths ready for Figma, Illustrator, or high-res documentation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Share2 className="text-[#8169ff] mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-[#181818]">6-Character Room Share</h4>
                    <p className="text-xs text-[#555555]">
                      Share room links or memorable 6-character room codes with your team for instant access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ProtoPie Style Testimonial Card */}
            <div
              className="bg-white rounded-2xl p-8 border border-[#e5e5ea] relative"
              style={{
                boxShadow:
                  'rgba(0, 0, 0, 0.12) 0px 3px 12px 0px, rgba(0, 0, 0, 0.04) 0px 0px 2px 0px',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8169ff] text-white font-display font-bold flex items-center justify-center text-sm">
                    JB
                  </div>
                  <div>
                    <div className="font-display font-bold text-base text-[#000000]">Jon Bernbach</div>
                    <div className="text-xs text-[#555555]">Product Designer, Meta</div>
                  </div>
                </div>

                {/* 52px circular Carbon play button from design.md */}
                <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform cursor-pointer">
                  <Play size={16} fill="white" className="ml-0.5" />
                </div>
              </div>

              <blockquote className="font-sans text-base text-[#181818] leading-relaxed italic mb-4">
                &ldquo;The fluidity of raw 2D canvas coupled with instantaneous CRDT updates makes this
                feel like drawing with actual violet ink on the same physical drafting table with my
                entire team.&rdquo;
              </blockquote>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#8169ff]">
                <span>Read customer story</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-extrabold text-3xl text-[#000000] tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#555555]">
              Everything you need to know about multiplayer CRDTs and live whiteboards.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#e5e5ea] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between text-sm font-semibold text-[#181818] hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#999999] transition-transform ${
                      expandedFaq === idx ? 'rotate-180 text-[#8169ff]' : ''
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-[#555555] leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================= CALL TO ACTION BANNER ================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div
            className="bg-gradient-to-r from-[#8169ff] to-[#6d4ff0] rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden"
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="font-handwriting text-3xl text-white/90 -rotate-2 inline-block mb-2">
                Join our live creative community
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight mb-4">
                Ready to sketch your next breakthrough?
              </h2>
              <p className="text-sm sm:text-base text-purple-100 mb-8 max-w-xl mx-auto">
                No complex downloads, no laggy screen-sharing. Launch an infinite board and collaborate
                in real time in seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  id="btn-footer-cta-register"
                  onClick={() => (currentUser.isRegistered ? onLaunchCanvas() : onOpenAuth('register'))}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#8169ff] hover:bg-purple-50 font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{currentUser.isRegistered ? 'Open Whiteboard Canvas' : 'Create Free Account & Launch'}</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  id="btn-footer-cta-guest"
                  onClick={() => onLaunchCanvas()}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/40 hover:bg-white/10 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Instant Guest Access
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#f0f0f4] bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#555555]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#8169ff] flex items-center justify-center text-white font-display font-extrabold text-xs">
              P
            </div>
            <span className="font-display font-bold text-sm text-[#000000]">
              ProtoCanvas Studio
            </span>
            <span className="text-[#999999]">· Yjs + Supabase Realtime</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#features" className="hover:text-[#8169ff] transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-[#8169ff] transition-colors">
              Architecture
            </a>
            <a href="#interactive-demo" className="hover:text-[#8169ff] transition-colors">
              Live Sandbox
            </a>
            <a href="#faq" className="hover:text-[#8169ff] transition-colors">
              FAQ
            </a>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="text-[#8169ff] font-semibold hover:underline"
            >
              Account Portal
            </button>
          </div>

          <div className="text-center md:text-right text-[#999999]">
            <span>Designed in Electric Violet & Paper White</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
