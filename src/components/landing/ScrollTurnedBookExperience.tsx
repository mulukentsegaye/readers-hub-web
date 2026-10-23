import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Bookmark, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  BookOpen, 
  Feather, 
  Check, 
  Flame, 
  Heart,
  RotateCcw
} from 'lucide-react';
import { useAmbientAudioStore } from '../../stores/ambientAudioStore';
import { AmbientSoundId } from '../../types/theme';

interface ScrollTurnedBookExperienceProps {
  onEnterApp: () => void;
  onOpenTimer?: () => void;
  onGoToLogin?: () => void;
  onGuest?: () => void;
}

export const ScrollTurnedBookExperience: React.FC<ScrollTurnedBookExperienceProps> = ({
  onEnterApp,
  onOpenTimer,
  onGoToLogin,
  onGuest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio integration from ambient store
  const { isPlaying, activeSoundId, play, pause, togglePlay } = useAmbientAudioStore();

  // Mini live demo timer state for Page 1
  const [timerSeconds, setTimerSeconds] = useState<number>(900); // 15:00
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Mini bookshelf quote saved state for Page 3
  const [isQuoteSaved, setIsQuoteSaved] = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(47);

  // Live timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 900));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll tracking with requestAnimationFrame for 60fps buttery smoothness
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (!containerRef.current) return;
      if (isManualOverride) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentScroll / totalScrollable));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollProgress(rawProgress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isManualOverride]);

  // Jump to specific book milestone
  const scrollToChapter = (targetProgress: number) => {
    if (!containerRef.current) return;
    setIsManualOverride(true);
    setScrollProgress(targetProgress);

    const containerTop = containerRef.current.offsetTop;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
    const targetScrollY = containerTop + targetProgress * totalScrollable;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });

    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      setIsManualOverride(false);
    }, 850);
  };

  // Dynamic 3D Book Rotation Calculations
  // Stage 1: Cover opening (0.00 -> 0.28)
  const coverTurnProgress = Math.min(1, Math.max(0, scrollProgress / 0.28));
  const coverAngle = -coverTurnProgress * 180;

  // Stage 2: Page 1 (Timer) turning to Page 2 (Soundscape) (0.28 -> 0.62)
  const page1TurnProgress = Math.min(1, Math.max(0, (scrollProgress - 0.28) / 0.34));
  const page1Angle = -page1TurnProgress * 180;

  // Stage 3: Page 2 (Soundscape) turning to Page 3 (Bookshelf) (0.62 -> 0.96)
  const page2TurnProgress = Math.min(1, Math.max(0, (scrollProgress - 0.62) / 0.34));
  const page2Angle = -page2TurnProgress * 180;

  // Current active chapter label for the HUD badge
  const getCurrentChapterInfo = () => {
    if (scrollProgress < 0.15) {
      return { label: 'Hardcover Binding', page: 'Cover', progressPct: Math.round(scrollProgress * 100) };
    } else if (scrollProgress < 0.45) {
      return { label: 'Chapter I: Distraction-Free Timer', page: 'Page 01', progressPct: Math.round(scrollProgress * 100) };
    } else if (scrollProgress < 0.78) {
      return { label: 'Chapter II: Ambient Soundscapes', page: 'Page 02', progressPct: Math.round(scrollProgress * 100) };
    } else {
      return { label: 'Chapter III: Digital Bookshelf & Margin Quotes', page: 'Page 03', progressPct: Math.round(scrollProgress * 100) };
    }
  };

  const chapterInfo = getCurrentChapterInfo();

  return (
    <section 
      ref={containerRef}
      id="experience"
      className="relative w-full border-t border-vibe-border bg-vibe-bg text-vibe-ink"
      style={{ height: '320vh' }}
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-between py-6 sm:py-8 px-3 sm:px-6 overflow-hidden select-none">
        
        {/* Top Floating Editorial HUD Header */}
        <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left z-20">
          <div>
            <h3 className="font-display text-lg sm:text-2xl font-normal text-vibe-ink tracking-tight">
              Turn the pages of your reading sanctuary.
            </h3>
          </div>

          {/* Current Page Pill Indicator */}
          <div className="flex items-center gap-2 bg-vibe-card border border-vibe-border px-3.5 py-1.5 rounded-full shadow-xs text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-vibe-accent animate-pulse" />
            <span className="font-bold text-vibe-ink">{chapterInfo.page}</span>
            <span className="text-vibe-ink-muted">·</span>
            <span className="text-vibe-ink-secondary text-[11px] hidden sm:inline">{chapterInfo.label}</span>
          </div>
        </div>

        {/* ==============================================================================
            3D BOOK STAGE & REALISTIC PHYSICAL PAGE ASSEMBLY
            ============================================================================== */}
        <div className="relative flex-1 w-full flex items-center justify-center my-2 sm:my-4" style={{ perspective: '2200px' }}>
          
          {/* Subtle Ambient Desk Lighting Drop-Shadow under the Book */}
          <div 
            className="absolute bottom-6 w-[280px] sm:w-[540px] lg:w-[680px] h-[35px] bg-black/25 dark:bg-black/50 blur-2xl rounded-full transition-all duration-300 pointer-events-none"
            style={{
              transform: `scale(${coverTurnProgress > 0.1 ? 1.25 : 0.85}) translateY(${coverTurnProgress * 12}px)`,
              opacity: 0.35 + coverTurnProgress * 0.25
            }}
          />

          {/* Book Wrapper with Scale for Mobile Responsiveness */}
          <div 
            className="relative transform transition-transform duration-300 scale-[0.68] xs:scale-[0.76] sm:scale-[0.88] md:scale-95 lg:scale-100"
            style={{
              width: '740px',
              height: '500px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Real Book Thickness Gilded Edge Stack (Stationary base) */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none border border-amber-900/10 shadow-2xl"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.06)'
              }}
            />

            {/* ====================================================================
                LEFT BASE SPREAD (Visible once cover has turned)
                ==================================================================== */}
            <div 
              className="absolute left-0 top-0 w-[370px] h-[500px] rounded-l-2xl border-l border-y border-stone-300 dark:border-stone-800 p-8 flex flex-col justify-between overflow-hidden shadow-inner"
              style={{
                background: 'linear-gradient(135deg, #FBF9F4 0%, #F5F1E9 100%)',
                color: '#1C1917',
              }}
            >
              {/* Spine Crease Inner Shadow */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                style={{
                  background: 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
                }}
              />

              {/* Dynamic Left Content according to Active Chapter */}
              {scrollProgress < 0.45 ? (
                // Left Spread: Chapter 1 Introduction
                <div className="space-y-6 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                        Liread Archive · Vol. I
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 font-medium">Page iv</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="font-mono text-[10px] text-emerald-800 uppercase tracking-widest font-bold block">
                        Chapter I
                      </span>
                      <h4 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                        The Sanctuary of Pure Focus
                      </h4>
                    </div>

                    <blockquote className="font-display italic text-sm text-stone-700 leading-relaxed border-l-2 border-emerald-700/40 pl-3 py-1">
                      “To read is to fly; it is to soar to a point of vantage where great thoughts begin to live.”
                      <footer className="text-[11px] font-sans font-medium text-stone-500 mt-1 not-italic">
                        — Marcel Proust
                      </footer>
                    </blockquote>

                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      In an attention economy built to fracture your concentration, Liread treats reading as a sacred ritual. 
                      Set your intention, close secondary tabs, and let time slow down.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-200/60 border border-stone-300/80 space-y-2 text-[11px] font-sans text-stone-700">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ritual Protocol</span>
                    </div>
                    <ul className="space-y-1 text-[10.5px] text-stone-600 pl-5 list-disc">
                      <li>Silence digital push notifications.</li>
                      <li>Immerse with gentle ambient pink noise.</li>
                      <li>Accumulate daily habit streaks calmly.</li>
                    </ul>
                  </div>
                </div>
              ) : scrollProgress < 0.78 ? (
                // Left Spread: Chapter 2 Introduction
                <div className="space-y-6 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                        Acoustic Ecology
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 font-medium">Page viii</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="font-mono text-[10px] text-emerald-800 uppercase tracking-widest font-bold block">
                        Chapter II
                      </span>
                      <h4 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                        The Acoustic Horizon
                      </h4>
                    </div>

                    <blockquote className="font-display italic text-sm text-stone-700 leading-relaxed border-l-2 border-emerald-700/40 pl-3 py-1">
                      “The sound of rain needs no translation.”
                      <footer className="text-[11px] font-sans font-medium text-stone-500 mt-1 not-italic">
                        — Alan Watts
                      </footer>
                    </blockquote>

                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Sudden noises jolt the nervous system. By weaving low-frequency rain and hearth drones directly into your browser, Liread masks erratic spikes so your mind sinks into uninterrupted flow.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-200/60 border border-stone-300/80 space-y-2 text-[11px] font-sans text-stone-700">
                    <span className="font-bold text-stone-900 block">Synthesized Web Audio</span>
                    <p className="text-[10.5px] text-stone-600">
                      Zero audio files downloaded over the network. Generated on-the-fly via mathematical oscillators. 100% offline capable.
                    </p>
                  </div>
                </div>
              ) : (
                // Left Spread: Chapter 3 Introduction
                <div className="space-y-6 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                        The Marginalia Archive
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 font-medium">Page xii</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="font-mono text-[10px] text-emerald-800 uppercase tracking-widest font-bold block">
                        Chapter III
                      </span>
                      <h4 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                        The Curated Shelf
                      </h4>
                    </div>

                    <blockquote className="font-display italic text-sm text-stone-700 leading-relaxed border-l-2 border-emerald-700/40 pl-3 py-1">
                      “I cannot remember the books I’ve read any more than the meals I have eaten; even so, they have made me.”
                      <footer className="text-[11px] font-sans font-medium text-stone-500 mt-1 not-italic">
                        — Ralph Waldo Emerson
                      </footer>
                    </blockquote>

                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Keep memorable quotes, track progress percentages without shame, and build a digital library that honors the books that altered your worldview.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-200/60 border border-stone-300/80 space-y-1.5 text-[11px] font-sans text-stone-700">
                    <span className="font-bold text-stone-900 block">Personal Archive Stats</span>
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-600 pt-1">
                      <span>18 Finished Books</span>
                      <span>42 Saved Passages</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Silk ribbon bookmark tip */}
              <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-2 border-t border-stone-300/60">
                <span>Liread Editions</span>
                <span>✦ Chapter Navigation Active</span>
              </div>
            </div>

            {/* ====================================================================
                RIGHT BASE SPREAD: PAGE 3 (Bookshelf & Quotes - Stationary at the back)
                ==================================================================== */}
            <div 
              className="absolute right-0 top-0 w-[370px] h-[500px] rounded-r-2xl border-r border-y border-stone-300 dark:border-stone-800 p-8 flex flex-col justify-between overflow-hidden shadow-inner"
              style={{
                background: 'linear-gradient(225deg, #FBF9F4 0%, #F5F1E9 100%)',
                color: '#1C1917',
              }}
            >
              {/* Spine Crease Inner Shadow */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-800 font-bold flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  <span>Digital Bookshelf & Margins</span>
                </span>
                <span className="font-mono text-[11px] text-stone-500 font-medium">Page 03</span>
              </div>

              {/* Active Digital Book Shelf Simulation */}
              <div className="space-y-4 my-auto">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold block">
                    Active Books in Progress
                  </span>

                  {/* Book 1 */}
                  <div className="p-3 rounded-xl bg-stone-200/70 border border-stone-300/80 space-y-1.5 transition-all hover:bg-stone-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-heading font-bold text-stone-900">The Creative Act</span>
                      <span className="font-mono text-[11px] font-bold text-emerald-800">68%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-300 overflow-hidden">
                      <div className="h-full bg-emerald-700 rounded-full w-[68%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                      <span>Rick Rubin</span>
                      <span>Page 142 of 210</span>
                    </div>
                  </div>

                  {/* Book 2 */}
                  <div className="p-3 rounded-xl bg-stone-200/70 border border-stone-300/80 space-y-1.5 transition-all hover:bg-stone-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-heading font-bold text-stone-900">Meditations</span>
                      <span className="font-mono text-[11px] font-bold text-emerald-800">42%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-300 overflow-hidden">
                      <div className="h-full bg-emerald-700 rounded-full w-[42%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                      <span>Marcus Aurelius</span>
                      <span>Book IV · Hays translation</span>
                    </div>
                  </div>
                </div>

                {/* Clipped Parchment Saved Passage */}
                <div className="relative p-4 rounded-xl bg-[#FFFDF9] border border-amber-900/20 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                    <span className="flex items-center gap-1 text-emerald-800 font-bold">
                      <Feather className="w-3 h-3" />
                      <span>Saved Passage</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuoteSaved(!isQuoteSaved);
                        setSaveCount((prev) => (isQuoteSaved ? prev - 1 : prev + 1));
                      }}
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
                      title="Bookmark this quote"
                    >
                      <Heart className={`w-3 h-3 ${isQuoteSaved ? 'fill-emerald-700 text-emerald-700' : ''}`} />
                      <span>{saveCount}</span>
                    </button>
                  </div>

                  <p className="font-display italic text-xs text-stone-800 leading-relaxed">
                    “The art of reading is in great part that of acquiring a better, deeper understanding of life through the words of others.”
                  </p>
                  <p className="text-[10px] text-stone-500 font-sans">
                    Virginia Woolf · <span className="italic">To the Lighthouse</span>
                  </p>
                </div>
              </div>

              {/* Bottom Action inside Page 3 */}
              <div className="pt-2 border-t border-stone-300/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onGoToLogin || onGuest || onEnterApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <span>Open Your Personal Shelf</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ====================================================================
                TURNING LEAF 2: PAGE 2 (Atmospheric Soundscapes & Waveform)
                Rotates from 0deg to -180deg
                ==================================================================== */}
            <div 
              className="absolute right-0 top-0 w-[370px] h-[500px] rounded-r-2xl border-r border-y border-stone-300 dark:border-stone-800 overflow-hidden shadow-2xl"
              style={{
                transformOrigin: 'left center',
                transform: `rotateY(${page2Angle}deg)`,
                transformStyle: 'preserve-3d',
                zIndex: page2Angle < -90 ? 10 : 30,
                pointerEvents: page2Angle < -90 ? 'none' : 'auto',
                transition: isManualOverride ? 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
              }}
            >
              {/* Front of Leaf 2: Page 2 (Soundscapes & Waveforms) */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-between"
                style={{
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(225deg, #FBF9F4 0%, #F5F1E9 100%)',
                  color: '#1C1917',
                }}
              >
                {/* Spine shadow */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
                  }}
                />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-800 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Atmospheric Soundscapes</span>
                  </span>
                  <span className="font-mono text-[11px] text-stone-500 font-medium">Page 02</span>
                </div>

                {/* Interactive Waveform & Soundscape Chips */}
                <div className="space-y-4 my-auto">
                  
                  {/* Dynamic Audio Waveform Equalizer */}
                  <div className="p-4 rounded-2xl bg-stone-200/70 border border-stone-300/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-600 animate-ping' : 'bg-stone-400'}`} />
                        <span className="font-mono text-[11px] font-bold text-stone-900 uppercase">
                          {isPlaying ? `Playing: ${activeSoundId}` : 'Audio Engine Standby'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white transition-all shadow-xs"
                        title={isPlaying ? 'Pause' : 'Play soundscape'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    </div>

                    {/* Animated equalizer bars */}
                    <div className="flex items-end justify-between gap-1.5 h-16 pt-2 px-2">
                      {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 50, 78, 60, 92, 48].map((h, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            isPlaying ? 'bg-emerald-700' : 'bg-stone-400/60'
                          }`}
                          style={{ 
                            height: isPlaying ? `${Math.max(18, (h * (i % 2 === 0 ? 1 : 0.75)))}%` : '15%',
                            transitionDelay: `${i * 20}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Soundscape Selector Pills */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold block">
                      Select Soundscape Atmosphere:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'rain' as AmbientSoundId, label: 'Window Rain', icon: '🌧️' },
                        { id: 'birds' as AmbientSoundId, label: 'Songbirds', icon: '🕊️' },
                        { id: 'fireplace' as AmbientSoundId, label: 'Cedar Hearth', icon: '🔥' },
                        { id: 'deep-space' as AmbientSoundId, label: 'Cosmic Drone', icon: '🌌' },
                      ].map((item) => {
                        const isCurrent = activeSoundId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={async () => {
                              if (activeSoundId === item.id && isPlaying) {
                                pause();
                              } else {
                                await play(item.id);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all active:scale-95 ${
                              isCurrent && isPlaying
                                ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                                : 'bg-stone-200/70 border-stone-300/80 text-stone-800 hover:bg-stone-200'
                            }`}
                          >
                            <span className="text-sm">{item.icon}</span>
                            <span className="text-[11px] font-sans truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer status */}
                <div className="pt-2 border-t border-stone-300/60 flex items-center justify-between text-[10px] font-mono text-stone-500">
                  <span>Procedural Audio Synthesis</span>
                  <span className="text-emerald-800 font-bold">Scroll down to Page 3 →</span>
                </div>
              </div>

              {/* Back of Leaf 2 (Visible when turned past -90deg onto left spread) */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-between"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #FBF9F4 0%, #F5F1E9 100%)',
                  color: '#1C1917',
                }}
              >
                {/* Right spine crease */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
                  }}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-300/80 pb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold">Archive Notes</span>
                    <span className="font-mono text-[11px] text-stone-500">Page xi</span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-stone-900">
                    Acoustics & Cognition
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    “Silence is not the absence of sound, but the stillness of the mind.”
                  </p>
                </div>

                <div className="text-[10px] font-mono text-stone-500">
                  Liread Sanctuary Archive
                </div>
              </div>
            </div>

            {/* ====================================================================
                TURNING LEAF 1: PAGE 1 (Minimalist Reading Timer)
                Rotates from 0deg to -180deg
                ==================================================================== */}
            <div 
              className="absolute right-0 top-0 w-[370px] h-[500px] rounded-r-2xl border-r border-y border-stone-300 dark:border-stone-800 overflow-hidden shadow-2xl"
              style={{
                transformOrigin: 'left center',
                transform: `rotateY(${page1Angle}deg)`,
                transformStyle: 'preserve-3d',
                zIndex: page1Angle < -90 ? 20 : 40,
                pointerEvents: page1Angle < -90 ? 'none' : 'auto',
                transition: isManualOverride ? 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
              }}
            >
              {/* Front of Leaf 1: Page 1 (The Minimalist Timer) */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-between"
                style={{
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(225deg, #FBF9F4 0%, #F5F1E9 100%)',
                  color: '#1C1917',
                }}
              >
                {/* Spine shadow */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
                  }}
                />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-800 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Distraction-Free Immersion</span>
                  </span>
                  <span className="font-mono text-[11px] text-stone-500 font-medium">Page 01</span>
                </div>

                {/* Interactive Timer Gauge Showcase */}
                <div className="space-y-4 my-auto flex flex-col items-center text-center">
                  
                  {/* Circular Dial Timer */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        stroke="#E7E5E4"
                        strokeWidth="5"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        stroke="#065F46"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={276}
                        strokeDashoffset={276 - (276 * ((900 - timerSeconds) / 900))}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-3xl font-bold tracking-tight text-stone-900">
                        {formatTimerDisplay(timerSeconds)}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mt-0.5">
                        {isTimerRunning ? 'Mindful Flow' : 'Target: 15m'}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Timer Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      <span>{isTimerRunning ? 'Pause Session' : 'Start Reading'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(900);
                      }}
                      className="p-2 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 transition-all active:scale-95"
                      title="Reset timer to 15m"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-600 max-w-[240px] leading-relaxed font-sans">
                    Gentle interval chimes and zero notification pings. Every second logs privately to your daily goal.
                  </p>

                </div>

                {/* Footer status */}
                <div className="pt-2 border-t border-stone-300/60 flex items-center justify-between text-[10px] font-mono text-stone-500">
                  <span>Zen Mode Protocol</span>
                  <span className="text-emerald-800 font-bold">Scroll down to Page 2 →</span>
                </div>
              </div>

              {/* Back of Leaf 1 (Visible when turned past -90deg onto left spread) */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-between"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #FBF9F4 0%, #F5F1E9 100%)',
                  color: '#1C1917',
                }}
              >
                {/* Right spine crease */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)'
                  }}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-300/80 pb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold">Focus Notes</span>
                    <span className="font-mono text-[11px] text-stone-500">Page vii</span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-stone-900">
                    The Habit of Presence
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    “Fifteen quiet minutes with a book anchors your day more deeply than two hours of digital distraction.”
                  </p>
                </div>

                <div className="text-[10px] font-mono text-stone-500">
                  Liread Sanctuary Archive
                </div>
              </div>
            </div>

            {/* ====================================================================
                HARDCOVER FRONT COVER (Opens 0deg to -180deg)
                Rich linen bookcloth, debossed gold foil typography
                ==================================================================== */}
            <div 
              className="absolute right-0 top-0 w-[370px] h-[500px] rounded-r-2xl overflow-hidden shadow-2xl"
              style={{
                transformOrigin: 'left center',
                transform: `rotateY(${coverAngle}deg)`,
                transformStyle: 'preserve-3d',
                zIndex: coverAngle < -90 ? 30 : 50,
                pointerEvents: coverAngle < -90 ? 'none' : 'auto',
                transition: isManualOverride ? 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                boxShadow: coverTurnProgress < 0.95 ? '10px 20px 40px rgba(0,0,0,0.45)' : 'none'
              }}
            >
              {/* Front Face: Book Cover */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-between border-y-2 border-r-2 border-emerald-950"
                style={{
                  backfaceVisibility: 'hidden',
                  background: '#064E3B',
                  color: '#FBF9F4',
                }}
              >
                {/* Bookcloth Fabric Texture / Linen Grid Accent */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#FDE68A 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* Spine Shadow on Left Edge */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                  }}
                />

                {/* Double Gold Foil Border Frame */}
                <div className="absolute inset-4 rounded-xl border border-amber-300/40 pointer-events-none">
                  <div className="absolute inset-1.5 rounded-lg border border-amber-300/20" />
                </div>

                {/* Top Cover Foil Emblem */}
                <div className="relative text-center pt-6 space-y-2">
                  <div className="w-12 h-12 rounded-full border border-amber-300/40 mx-auto flex items-center justify-center bg-emerald-900/40 text-amber-300 shadow-md">
                    <BookOpen className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-amber-200/80 font-bold block">
                    An Intentional Reading Sanctuary
                  </span>
                </div>

                {/* Center Title debossed gold typography */}
                <div className="relative text-center space-y-3 py-4">
                  <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-amber-100 drop-shadow-md">
                    LIREAD
                  </h2>
                  <div className="w-16 h-0.5 bg-amber-300/40 mx-auto" />
                  <p className="font-display italic text-sm text-amber-200/90 tracking-wide font-normal">
                    Volume I · The Art of Deep Focus
                  </p>
                </div>

                {/* Bottom Cover Inscription */}
                <div className="relative text-center pb-6 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-amber-300/30 text-[10px] font-mono text-amber-200/80">
                    <span>Scroll to Open</span>
                    <span className="animate-bounce">↓</span>
                  </div>

                  <p className="text-[10px] font-mono text-amber-300/60 uppercase tracking-widest">
                    Timer · Soundscapes · Bookshelf
                  </p>
                </div>

                {/* Gold bookmark ribbon draping down bottom */}
                <div 
                  className="absolute bottom-[-18px] left-16 w-5 h-10 bg-amber-400 shadow-md border-x border-amber-600 transform -skew-y-6"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' }}
                />
              </div>

              {/* Inside of Front Cover (Endpaper visible when opened) */}
              <div 
                className="absolute inset-0 p-8 flex flex-col justify-between"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  background: '#1C1917',
                  color: '#F8FAFC',
                }}
              >
                <div className="space-y-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                    Frontispiece & Ex Libris
                  </span>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">This sanctuary belongs to:</span>
                    <p className="font-display italic text-lg text-amber-200">The Intentional Reader</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  “A quiet space designed to protect your attention from algorithmic noise.”
                </div>

                <div className="text-[10px] font-mono text-slate-500">
                  Published by Liread · 2026
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ==============================================================================
            BOTTOM TACTILE SCRUBBER & CHAPTER NAVIGATION CONTROLS
            ============================================================================== */}
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3 z-20">
          
          {/* Chapter Quick-Jump Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-vibe-card/90 backdrop-blur-md border border-vibe-border p-1.5 rounded-full shadow-md">
            {[
              { label: 'Cover', progress: 0.05, icon: '📖' },
              { label: 'Ch. 1: Timer', progress: 0.35, icon: '⏱️' },
              { label: 'Ch. 2: Sound', progress: 0.70, icon: '🌧️' },
              { label: 'Ch. 3: Shelf', progress: 0.98, icon: '📚' },
            ].map((btn) => {
              const isSelected = 
                (btn.progress === 0.05 && scrollProgress < 0.20) ||
                (btn.progress === 0.35 && scrollProgress >= 0.20 && scrollProgress < 0.55) ||
                (btn.progress === 0.70 && scrollProgress >= 0.55 && scrollProgress < 0.85) ||
                (btn.progress === 0.98 && scrollProgress >= 0.85);

              return (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => scrollToChapter(btn.progress)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-vibe-accent text-white font-bold shadow-xs'
                      : 'text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle'
                  }`}
                >
                  <span>{btn.icon}</span>
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Native Scrub Track Indicator */}
          <div className="w-full max-w-md flex items-center gap-3 px-4">
            <span className="text-[11px] font-mono text-vibe-ink-muted">Scroll depth</span>
            <div className="flex-1 h-1.5 rounded-full bg-vibe-border overflow-hidden">
              <div 
                className="h-full bg-vibe-accent transition-all duration-150 rounded-full"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-vibe-ink min-w-[36px] text-right">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
