import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  CloudRain, 
  Moon, 
  Flame, 
  Clock, 
  BookOpen, 
  Volume2, 
  Pause, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Coffee, 
  Feather, 
  Check, 
  Bookmark, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useAmbientAudioStore } from '../../stores/ambientAudioStore';
import { AmbientSoundId } from '../../types/theme';

interface DailyRitualDeckProps {
  onStartRitual: () => void;
  onExploreGuest?: () => void;
}

interface RitualCardData {
  id: string;
  time: string;
  period: string;
  title: string;
  subtitle: string;
  description: string;
  soundId: AmbientSoundId;
  soundLabel: string;
  soundEmoji: string;
  themeAccent: string;
  themeBg: string;
  themeBorder: string;
  icon: React.ReactNode;
  quote: {
    text: string;
    author: string;
    work: string;
  };
}

export const DailyRitualDeck: React.FC<DailyRitualDeckProps> = ({
  onStartRitual,
  onExploreGuest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isManualJumping, setIsManualJumping] = useState<boolean>(false);
  const jumpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio store integration
  const { isPlaying, activeSoundId, play, pause, togglePlay } = useAmbientAudioStore();

  // Mini live state for Card 1 (Morning timer)
  const [morningSeconds, setMorningSeconds] = useState<number>(900); // 15:00
  const [isMorningTimerActive, setIsMorningTimerActive] = useState<boolean>(false);

  // Mini live state for Card 3 (Evening reflection)
  const [reflectionText, setReflectionText] = useState<string>(
    'The mind is not a vessel to be filled, but a fire to be kindled.'
  );
  const [isReflectionSaved, setIsReflectionSaved] = useState<boolean>(true);

  // Live timer tick for Card 1
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isMorningTimerActive) {
      interval = setInterval(() => {
        setMorningSeconds((prev) => (prev > 0 ? prev - 1 : 900));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMorningTimerActive]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cards: RitualCardData[] = [
    {
      id: 'morning',
      time: '07:30 AM',
      period: 'Morning Awakening',
      title: 'Morning Clarity',
      subtitle: '15m Timer with Morning Songbirds',
      description:
        'Replace the reflexive morning phone grab with 15 minutes of silent prose. Light forest morning breeze and birdsong awaken your focus gently before emails, Slack, and the noisy working world demand your attention.',
      soundId: 'birds',
      soundLabel: 'Morning Songbirds',
      soundEmoji: '🕊️',
      themeAccent: 'text-emerald-600 dark:text-emerald-400',
      themeBg: 'bg-emerald-500/10',
      themeBorder: 'border-emerald-500/20',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      quote: {
        text: 'The morning hour has gold in its mouth.',
        author: 'Latin Proverb',
        work: 'Archival Epigraph'
      }
    },
    {
      id: 'afternoon',
      time: '01:15 PM',
      period: 'Midday Decompression',
      title: 'Afternoon Reset',
      subtitle: '20m Focus Break · 1 Chapter with Window Rain',
      description:
        'Escape midday Zoom fatigue and screen strain. Settle into a 20-minute reading break with soft rain droplets against window glass, quieting cognitive chatter and recharging your working memory.',
      soundId: 'rain',
      soundLabel: 'Window Rain',
      soundEmoji: '🌧️',
      themeAccent: 'text-sky-600 dark:text-sky-400',
      themeBg: 'bg-sky-500/10',
      themeBorder: 'border-sky-500/20',
      icon: <CloudRain className="w-5 h-5 text-sky-500" />,
      quote: {
        text: 'A chapter in the afternoon is an antidote to the hurry of the world.',
        author: 'Virginia Woolf',
        work: 'Literary Essays'
      }
    },
    {
      id: 'evening',
      time: '09:45 PM',
      period: 'Night Wind-Down',
      title: 'Evening Sanctuary',
      subtitle: 'Cedar Hearth + Post-Reading Reflection',
      description:
        'Close out the day under warm lamplight as cedarwood crackles in the hearth. Log your finished pages, distill one 1-sentence mindful takeaway, and watch your daily streak quietly compound.',
      soundId: 'fireplace',
      soundLabel: 'Cedar Hearth Fireplace',
      soundEmoji: '🔥',
      themeAccent: 'text-amber-600 dark:text-amber-400',
      themeBg: 'bg-amber-500/10',
      themeBorder: 'border-amber-500/20',
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      quote: {
        text: 'Reading is that fruitful miracle of a communication in the midst of solitude.',
        author: 'Marcel Proust',
        work: 'On Reading'
      }
    }
  ];

  // Scroll listener for sticky crossfade progress
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (!containerRef.current || isManualJumping) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentScroll / totalScrollable));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollProgress(rawProgress);

        // Derive active index: 0 (0 to 0.33), 1 (0.33 to 0.66), 2 (0.66 to 1.0)
        if (rawProgress < 0.34) {
          setActiveIndex(0);
        } else if (rawProgress < 0.68) {
          setActiveIndex(1);
        } else {
          setActiveIndex(2);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isManualJumping]);

  // Jump to specific card milestone on click
  const jumpToCard = (index: number) => {
    if (!containerRef.current) return;
    setIsManualJumping(true);
    setActiveIndex(index);

    const targetProgress = index === 0 ? 0.05 : index === 1 ? 0.5 : 0.95;
    setScrollProgress(targetProgress);

    const containerTop = containerRef.current.offsetTop;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = containerTop + targetProgress * totalScrollable;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });

    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
    jumpTimerRef.current = setTimeout(() => {
      setIsManualJumping(false);
    }, 850);
  };

  const activeCard = cards[activeIndex];

  return (
    <section
      ref={containerRef}
      id="ritual"
      className="relative w-full border-t border-vibe-border bg-vibe-bg text-vibe-ink"
      style={{ height: '290vh' }}
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-12 overflow-hidden select-none">
        

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
          
          {/* ==============================================================================
              LEFT COLUMN: PINNED EDITORIAL NARRATIVE & TIMELINE TRACKER
              ============================================================================== */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            

            {/* Pinned Evocative Headline */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-display font-normal text-vibe-ink tracking-tight leading-[1.14]">
                Your daily reading ritual, <br />
                <span className="italic font-display font-normal text-vibe-accent">
                  morning to night.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed">
                Experience how 15 to 20 quiet minutes fit naturally into the cadence of modern life.
                Scroll down to journey through the day.
              </p>
            </div>

            {/* Vertical Interactive Timeline Steps */}
            <div className="space-y-3 pt-2">
              {cards.map((card, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => jumpToCard(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between group active:scale-[0.99] cursor-pointer ${
                      isActive
                        ? 'bg-vibe-card border-vibe-accent shadow-md'
                        : 'bg-vibe-card/40 border-vibe-border hover:bg-vibe-card hover:border-vibe-border-subtle opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isActive ? card.themeBg : 'bg-vibe-card-subtle'
                      }`}>
                        {card.icon}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-vibe-ink">
                            {card.time}
                          </span>
                          <span className="text-[10px] font-mono text-vibe-ink-muted">·</span>
                          <span className={`text-[11px] font-heading font-semibold ${
                            isActive ? card.themeAccent : 'text-vibe-ink-muted'
                          }`}>
                            {card.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-vibe-ink-secondary truncate max-w-[220px] sm:max-w-[280px]">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-vibe-accent animate-pulse" />
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform text-vibe-ink-muted ${
                        isActive ? 'translate-x-0.5 text-vibe-accent' : 'group-hover:translate-x-0.5'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Scroller Footnote */}
            <div className="hidden sm:flex items-center gap-3 pt-2 text-xs font-mono text-vibe-ink-muted">
              <span>Scroll to step through time</span>
              <span className="w-12 h-px bg-vibe-border" />
              <span>{Math.round(scrollProgress * 100)}% through the day</span>
            </div>

          </div>

          {/* ==============================================================================
              RIGHT COLUMN: DYNAMIC SLIDING CARDS WITH REAL-TIME TACTILE MOCKUPS
              ============================================================================== */}
          <div className="lg:col-span-7 relative h-[480px] sm:h-[520px] w-full flex items-center justify-center">
            
            {cards.map((card, idx) => {
              const isActive = activeIndex === idx;
              const isPast = activeIndex > idx;
              const isFuture = activeIndex < idx;

              // Smooth dynamic translation and stacking
              let transformStyle = 'translateY(0px) scale(1)';
              let opacity = 1;
              let zIndex = 20;

              if (isPast) {
                transformStyle = 'translateY(-28px) scale(0.95)';
                opacity = 0;
                zIndex = 10;
              } else if (isFuture) {
                transformStyle = 'translateY(36px) scale(0.96)';
                opacity = 0;
                zIndex = 10;
              }

              return (
                <div
                  key={card.id}
                  className="absolute inset-0 transition-all duration-500 ease-out flex flex-col justify-between"
                  style={{
                    transform: transformStyle,
                    opacity,
                    zIndex,
                    pointerEvents: isActive ? 'auto' : 'none'
                  }}
                >
                  <div className="rounded-3xl bg-vibe-card border border-vibe-border p-6 sm:p-8 shadow-xl flex flex-col justify-between h-full backdrop-blur-md space-y-6">
                    
                    {/* Card Top Metadata & Audio Button */}
                    <div className="flex items-center justify-between pb-4 border-b border-vibe-border">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${card.themeBg} ${card.themeBorder} ${card.themeAccent}`}>
                          {card.time}
                        </span>
                        <span className="text-xs font-heading font-semibold text-vibe-ink-secondary">
                          {card.period}
                        </span>
                      </div>

                      {/* Interactive Sound Preview Pill */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (activeSoundId === card.soundId && isPlaying) {
                            pause();
                          } else {
                            await play(card.soundId);
                          }
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all border shadow-xs active:scale-95 ${
                          activeSoundId === card.soundId && isPlaying
                            ? 'bg-vibe-accent text-white border-vibe-accent font-bold'
                            : 'bg-vibe-card-subtle text-vibe-ink-secondary border-vibe-border hover:bg-vibe-card hover:text-vibe-ink'
                        }`}
                        title="Listen to this soundscape preview"
                      >
                        <span className="text-sm">{card.soundEmoji}</span>
                        <span className="hidden sm:inline text-[11px] font-sans font-medium">
                          {activeSoundId === card.soundId && isPlaying ? 'Playing' : 'Listen'}
                        </span>
                        {activeSoundId === card.soundId && isPlaying ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3 ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Card Narrative Body */}
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-display font-normal text-vibe-ink tracking-tight">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed font-normal">
                        {card.description}
                      </p>
                    </div>

                    {/* Specific Interactive Mockup depending on Card */}
                    {card.id === 'morning' && (
                      <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-vibe-ink-muted">Morning Focus Stopwatch</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">15 min Habit Goal</span>
                        </div>

                        <div className="flex items-center justify-between bg-vibe-card p-3 rounded-xl border border-vibe-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                              {formatTimer(morningSeconds)}
                            </div>
                            <div>
                              <p className="font-heading font-bold text-xs text-vibe-ink">Gentle Morning Session</p>
                              <p className="text-[11px] text-vibe-ink-muted">Forest birdsong active · 0 notifications</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsMorningTimerActive(!isMorningTimerActive)}
                            className="px-3 py-1.5 rounded-full bg-vibe-accent text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            {isMorningTimerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isMorningTimerActive ? 'Pause' : 'Start'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {card.id === 'afternoon' && (
                      <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-vibe-ink-muted">Midday Break Reading</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">Chapter IV in Progress</span>
                        </div>

                        <div className="bg-vibe-card p-3 rounded-xl border border-vibe-border space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-heading font-bold text-vibe-ink">The Creative Act · Rick Rubin</span>
                            <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">70%</span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-vibe-border overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full w-[70%]" />
                          </div>

                          <p className="font-display italic text-xs text-vibe-ink-secondary pt-1 border-t border-vibe-border">
                            “The object isn't to make art, it's to be in that wonderful state which makes art inevitable.”
                          </p>
                        </div>
                      </div>
                    )}

                    {card.id === 'evening' && (
                      <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-vibe-ink-muted">Post-Reading Mindful Takeaway</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">Streak: 14 Days 🔥</span>
                        </div>

                        <div className="bg-vibe-card p-3.5 rounded-xl border border-vibe-border space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-vibe-ink-muted">
                            <span className="flex items-center gap-1 font-semibold text-vibe-ink">
                              <Feather className="w-3.5 h-3.5 text-amber-500" />
                              <span>Kept Reflection Slip</span>
                            </span>
                            <span className="font-mono">Marcus Aurelius</span>
                          </div>

                          <textarea
                            value={reflectionText}
                            onChange={(e) => {
                              setReflectionText(e.target.value);
                              setIsReflectionSaved(false);
                            }}
                            rows={2}
                            className="w-full text-xs font-display italic text-vibe-ink bg-transparent border-0 focus:ring-0 p-0 resize-none leading-relaxed"
                            placeholder="Write one thought you absorbed tonight..."
                          />

                          <div className="flex items-center justify-between pt-1 border-t border-vibe-border text-[10px] text-vibe-ink-muted">
                            <span>Saved to your private marginalia stash</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Synced</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom Epigraph & Action Strip */}
                    <div className="pt-3 border-t border-vibe-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-vibe-ink-muted">
                        <Bookmark className="w-3.5 h-3.5 text-vibe-accent" />
                        <span className="italic font-display text-[11px]">
                          “{card.quote.text}”
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={onStartRitual}
                        className="px-4 py-2 rounded-full bg-vibe-accent text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-vibe-accent-hover transition-all shadow-xs active:scale-95 flex-shrink-0"
                      >
                        <span>Build This Ritual</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}

          </div>

        </div>

      </div>
    </section>
  );
};
