import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Coffee, 
  Bookmark, 
  Heart, 
  BookOpen, 
  Feather, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

interface ReadingDeskAssemblyProps {
  onOpenBook?: () => void;
}

export const ReadingDeskAssembly: React.FC<ReadingDeskAssemblyProps> = ({ onOpenBook }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAssembled, setIsAssembled] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isQuoteLiked, setIsQuoteLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(38);
  const [hasEverTriggered, setHasEverTriggered] = useState<boolean>(false);

  // Trigger assembly precisely when the desk is centered in the user's viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When at least 30% of the desk is comfortably visible in the user's viewport
          if (entry.isIntersecting) {
            // Slight delay so the user is settled looking at the section
            const timer = setTimeout(() => {
              setIsAssembled(true);
              setHasEverTriggered(true);
            }, 180);
            return () => clearTimeout(timer);
          } else {
            // When user scrolls completely away, reset so it re-assembles when returning
            if (entry.boundingClientRect.top > window.innerHeight) {
              setIsAssembled(false);
            }
          }
        });
      },
      {
        threshold: 0.32,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Replay animation on demand
  const handleReplayAssembly = () => {
    setIsAssembled(false);
    setTimeout(() => {
      setIsAssembled(true);
    }, 120);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-3xl bg-vibe-card border border-vibe-border p-4 sm:p-8 shadow-xl overflow-hidden select-none"
    >
      {/* Decorative CSS keyframe for rising tea steam */}
      <style>{`
        @keyframes teaSteamWaft {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          40% { opacity: 0.7; }
          100% { transform: translateY(-26px) scaleX(1.4); opacity: 0; }
        }
        .animate-tea-steam-1 {
          animation: teaSteamWaft 2.6s ease-out infinite;
        }
        .animate-tea-steam-2 {
          animation: teaSteamWaft 2.6s ease-out infinite 0.9s;
        }
        .animate-tea-steam-3 {
          animation: teaSteamWaft 2.6s ease-out infinite 1.7s;
        }
      `}</style>

      {/* Desk Stage Header with Live Status & Replay Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-vibe-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-vibe-ink">
              The Reader's Desk Assembly
            </h4>
            <p className="text-[11px] text-vibe-ink-muted">
              {isAssembled 
                ? '✦ Desk assembled in flow · Tap items to explore' 
                : 'Scattered tools gather into place as you arrive'}
            </p>
          </div>
        </div>

        {/* Live status badge & Replay button */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-all ${
            isAssembled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          }`}>
            {isAssembled ? 'Assembled 100%' : 'Scattered State'}
          </div>

          <button
            type="button"
            onClick={handleReplayAssembly}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-vibe-border text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Watch the tools scatter and assemble again"
          >
            <RotateCcw className="w-3.5 h-3.5 text-vibe-accent" />
            <span>Replay</span>
          </button>
        </div>
      </div>

      {/* ==============================================================================
          THE PHYSICAL DESK MAT STAGE
          ============================================================================== */}
      <div className="relative w-full h-[490px] sm:h-[540px] my-4 rounded-2xl bg-amber-950/[0.03] dark:bg-black/30 border border-amber-900/10 dark:border-white/5 flex items-center justify-center overflow-hidden">
        
        {/* Leather / Felt Desk Mat with Stitched Border */}
        <div 
          className="absolute inset-4 sm:inset-6 rounded-2xl border-2 border-dashed border-amber-900/20 dark:border-amber-100/10 pointer-events-none transition-all duration-500"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(251, 249, 244, 0.4) 0%, rgba(245, 241, 233, 0.15) 100%)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.03)'
          }}
        >
          {/* Mat Corner Deboss Stamp */}
          <div className="absolute bottom-3 left-4 text-[9px] font-mono tracking-widest uppercase text-amber-900/40 dark:text-amber-100/30 font-bold">
            LIREAD · SANCTUARY DESK MAT
          </div>
        </div>

        {/* ----------------------------------------------------------------------------
            ITEM 1: SLEEK TORTOISESHELL READING GLASSES (Top Left)
            Floats in from top-left with elastic spring physics
            ---------------------------------------------------------------------------- */}
        <div
          onClick={() => setActiveTooltip(activeTooltip === 'glasses' ? null : 'glasses')}
          className="absolute left-4 sm:left-12 top-6 sm:top-12 z-20 cursor-pointer group hover:scale-105"
          style={{
            transform: isAssembled 
              ? 'translate(0px, 0px) rotate(-6deg) scale(1)' 
              : 'translate(-120px, -95px) rotate(-42deg) scale(0.88)',
            opacity: isAssembled ? 1 : 0.25,
            transition: 'transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) 140ms, opacity 0.5s ease 140ms',
            filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.15))'
          }}
        >
          <div className="relative p-2.5 rounded-2xl bg-vibe-card/95 backdrop-blur-md border border-amber-900/20 shadow-md">
            {/* SVG Glasses Icon Graphic */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              {/* Left Lens */}
              <div className="w-8 h-8 rounded-full border-2 border-amber-800 bg-amber-500/10 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
                <span className="text-[10px] font-mono text-amber-900 dark:text-amber-300 font-bold">👓</span>
              </div>
              {/* Bridge */}
              <div className="w-2.5 h-0.5 bg-amber-800 rounded-full" />
              {/* Right Lens */}
              <div className="w-8 h-8 rounded-full border-2 border-amber-800 bg-amber-500/10 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
                <span className="text-[10px] font-mono text-amber-900 dark:text-amber-300 font-bold">👓</span>
              </div>
            </div>

            <div className="text-[9px] font-mono text-center text-amber-900 dark:text-amber-200 font-semibold pt-0.5">
              Reading Lenses
            </div>

            {/* Interactive Tooltip */}
            {activeTooltip === 'glasses' && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-vibe-ink text-vibe-bg text-[10px] shadow-xl z-30 font-sans pointer-events-none text-center">
                <p className="font-bold">✦ Clarity & Reduced Glare</p>
                <p className="opacity-80">Filters digital distractions for pure literary immersion.</p>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------------
            ITEM 2: STEAMING PORCELAIN TEA MUG (Top Right)
            Floats in from top-right with elastic spring physics
            ---------------------------------------------------------------------------- */}
        <div
          onClick={() => setActiveTooltip(activeTooltip === 'mug' ? null : 'mug')}
          className="absolute right-4 sm:right-12 top-6 sm:top-12 z-20 cursor-pointer group hover:scale-105"
          style={{
            transform: isAssembled 
              ? 'translate(0px, 0px) rotate(4deg) scale(1)' 
              : 'translate(120px, -85px) rotate(32deg) scale(0.88)',
            opacity: isAssembled ? 1 : 0.25,
            transition: 'transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) 280ms, opacity 0.5s ease 280ms',
            filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.16))'
          }}
        >
          <div className="relative p-3 rounded-2xl bg-vibe-card/95 backdrop-blur-md border border-amber-900/20 shadow-md flex flex-col items-center">
            
            {/* Animated Rising Steam Wisps */}
            <div className="absolute -top-5 flex items-center gap-1.5 h-6 pointer-events-none">
              <span className="w-1 h-3.5 bg-stone-400/50 dark:bg-stone-300/40 rounded-full blur-[0.6px] animate-tea-steam-1" />
              <span className="w-1 h-4.5 bg-stone-400/50 dark:bg-stone-300/40 rounded-full blur-[0.6px] animate-tea-steam-2" />
              <span className="w-1 h-3.5 bg-stone-400/50 dark:bg-stone-300/40 rounded-full blur-[0.6px] animate-tea-steam-3" />
            </div>

            {/* Mug Body */}
            <div className="relative flex items-center">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 flex items-center justify-center shadow-inner">
                <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              {/* Mug Handle */}
              <div className="w-3.5 h-6 border-2 border-stone-300 dark:border-stone-700 rounded-r-lg -ml-0.5" />
            </div>

            <span className="text-[9px] font-mono text-amber-900 dark:text-amber-200 font-semibold pt-1">
              Earl Grey & Lavender
            </span>

            {/* Interactive Tooltip */}
            {activeTooltip === 'mug' && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-vibe-ink text-vibe-bg text-[10px] shadow-xl z-30 font-sans pointer-events-none text-center">
                <p className="font-bold">☕ Mindful Companion</p>
                <p className="opacity-80">Brewed warm. Sip slowly between chapters.</p>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------------
            ITEM 3: CLASSIC FOUNTAIN PEN & MARGIN NOTEPAD (Bottom Left)
            Floats in from bottom-left with elastic spring physics
            ---------------------------------------------------------------------------- */}
        <div
          onClick={() => setActiveTooltip(activeTooltip === 'pen' ? null : 'pen')}
          className="absolute left-4 sm:left-12 bottom-6 sm:bottom-12 z-20 cursor-pointer group hover:scale-105"
          style={{
            transform: isAssembled 
              ? 'translate(0px, 0px) rotate(28deg) scale(1)' 
              : 'translate(-110px, 110px) rotate(-65deg) scale(0.88)',
            opacity: isAssembled ? 1 : 0.25,
            transition: 'transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) 420ms, opacity 0.5s ease 420ms',
            filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.15))'
          }}
        >
          <div className="relative p-2.5 rounded-2xl bg-vibe-card/95 backdrop-blur-md border border-amber-900/20 shadow-md space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-900/10 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                <Feather className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-vibe-ink block">Gold-Nib Pen</span>
                <span className="text-[9px] font-mono text-vibe-ink-muted block">Archival Ink</span>
              </div>
            </div>

            <div className="text-[9px] text-vibe-ink-secondary italic font-display border-t border-vibe-border pt-1">
              “Write what altered you.”
            </div>

            {/* Interactive Tooltip */}
            {activeTooltip === 'pen' && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-vibe-ink text-vibe-bg text-[10px] shadow-xl z-30 font-sans pointer-events-none text-center">
                <p className="font-bold">✒️ The Marginalia Tool</p>
                <p className="opacity-80">Capture private epiphanies as you read.</p>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------------
            ITEM 4: SILK RIBBON BOOKMARK (Bottom Right)
            Floats in from bottom-right with elastic spring physics
            ---------------------------------------------------------------------------- */}
        <div
          onClick={() => setActiveTooltip(activeTooltip === 'bookmark' ? null : 'bookmark')}
          className="absolute right-4 sm:right-12 bottom-6 sm:bottom-12 z-20 cursor-pointer group hover:scale-105"
          style={{
            transform: isAssembled 
              ? 'translate(0px, 0px) rotate(-12deg) scale(1)' 
              : 'translate(115px, 100px) rotate(45deg) scale(0.88)',
            opacity: isAssembled ? 1 : 0.25,
            transition: 'transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) 560ms, opacity 0.5s ease 560ms',
            filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.15))'
          }}
        >
          <div className="relative p-2.5 rounded-2xl bg-vibe-card/95 backdrop-blur-md border border-amber-900/20 shadow-md flex items-center gap-2">
            {/* Ribbon Graphic with Chevron Tail */}
            <div 
              className="w-4 h-9 bg-emerald-700 dark:bg-emerald-600 rounded-t-sm shadow-xs flex items-center justify-center text-amber-300"
              style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' }}
            >
              <span className="text-[8px] font-mono mb-1">✦</span>
            </div>

            <div className="space-y-0.5 pr-1">
              <span className="text-[10px] font-mono font-bold text-vibe-ink block">Silk Ribbon</span>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">Page 142 Kept</span>
            </div>

            {/* Interactive Tooltip */}
            {activeTooltip === 'bookmark' && (
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-vibe-ink text-vibe-bg text-[10px] shadow-xl z-30 font-sans pointer-events-none text-center">
                <p className="font-bold">🔖 Memory Keeper</p>
                <p className="opacity-80">Automatically bookmarks your exact reading depth.</p>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------------
            ITEM 5: THE ASSEMBLED OPEN BOOK & MARGINALIA PASSAGE (Desk Centerpiece)
            Lands smoothly in center with soft settling drop
            ---------------------------------------------------------------------------- */}
        <div
          className="relative z-10 w-[92%] sm:w-[460px] lg:w-[500px]"
          style={{
            transform: isAssembled ? 'translateY(0px) scale(1)' : 'translateY(-50px) scale(0.92)',
            opacity: isAssembled ? 1 : 0.4,
            transition: 'transform 0.9s cubic-bezier(0.34, 1.35, 0.64, 1) 50ms, opacity 0.6s ease 50ms',
            filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.22))'
          }}
        >
          <div className="rounded-2xl bg-[#FCFAF6] dark:bg-stone-900 border border-stone-300 dark:border-stone-800 p-5 sm:p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative overflow-hidden">
            
            {/* Center Book Spine Crease Gradient */}
            <div 
              className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 pointer-events-none opacity-40"
              style={{
                background: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 50%, transparent 100%)'
              }}
            />

            {/* Top Book Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Active Reading Queue</span>
              </div>
              <span className="font-mono text-[10px] text-stone-500">Page 142 · 68% Complete</span>
            </div>

            {/* Book Body: Currently Open Book Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              
              {/* Left Spread: Book Title & Progress Bar */}
              <div className="space-y-2 sm:border-r sm:border-stone-200 dark:sm:border-stone-800 sm:pr-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                  Currently Reading
                </span>
                <h5 className="font-heading font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-tight">
                  The Creative Act: A Way of Being
                </h5>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                  Rick Rubin · Penguin Press
                </p>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div className="h-full bg-emerald-700 dark:bg-emerald-500 rounded-full w-[68%]" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-stone-500">
                    <span>142 of 210 pages</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-400">68%</span>
                  </div>
                </div>
              </div>

              {/* Right Spread: Saved Passage Deckled Slip */}
              <div className="space-y-2 sm:pl-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                  <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold">
                    <Bookmark className="w-3 h-3 fill-current" />
                    <span>Kept Passage</span>
                  </span>
                  
                  {/* Interactive Heart Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuoteLiked(!isQuoteLiked);
                      setLikeCount((prev) => (isQuoteLiked ? prev - 1 : prev + 1));
                    }}
                    className="flex items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Bookmark this quote"
                  >
                    <Heart className={`w-3 h-3 ${isQuoteLiked ? 'fill-emerald-700 text-emerald-700' : ''}`} />
                    <span>{likeCount}</span>
                  </button>
                </div>

                <blockquote className="font-display italic text-xs leading-relaxed text-stone-800 dark:text-stone-200">
                  “The art of reading is in great part that of acquiring a better, deeper understanding of life through the words of others.”
                </blockquote>

                <span className="text-[10px] text-stone-500 font-sans block pt-1">
                  Virginia Woolf · <span className="italic">To the Lighthouse</span>
                </span>
              </div>

            </div>

            {/* Bottom Book Edge Bar */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[10px] font-mono text-stone-500">
              <span>Private Offline Encrypted Storage</span>
              <span className="text-emerald-800 dark:text-emerald-400 font-bold">Synced with Reading Sanctuary</span>
            </div>

          </div>
        </div>

      </div>

      {/* Assembly Status & Quick Tap Prompt */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-vibe-ink-muted">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-vibe-accent" />
          <span>Tap glasses, tea mug, fountain pen, or bookmark to explore their ritual purpose.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplayAssembly}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Watch Desk Assemble Again</span>
          </button>
        </div>
      </div>

    </div>
  );
};
