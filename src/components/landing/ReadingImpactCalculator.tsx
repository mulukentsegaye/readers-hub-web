import { ScrollRevealCard } from './ScrollRevealCard';
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Compass, 
  CheckCircle2, 
  TrendingUp,
  Bookmark
} from 'lucide-react';

interface ReadingImpactCalculatorProps {
  onStartHabit: () => void;
  onContinueGuest?: () => void;
}

// Lightweight springy ease-out interpolator for real-time counters
function useAnimatedNumber(target: number, decimals: number = 0, duration: number = 320): string {
  const [current, setCurrent] = useState<number>(target);
  const prevTargetRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = current;
    const endVal = target;
    const startTime = performance.now();

    if (startVal === endVal) return;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const nextVal = startVal + (endVal - startVal) * easeOut;

      setCurrent(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(endVal);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return decimals === 0 ? Math.round(current).toString() : current.toFixed(decimals);
}

export const ReadingImpactCalculator: React.FC<ReadingImpactCalculatorProps> = ({
  onStartHabit,
  onContinueGuest
}) => {
  const [minutes, setMinutes] = useState<number>(15);

  // Benchmarked Formulas calibrated to baseline: 15 min/day = 18 books, 109 hours, 3.2M words
  const targetBooks = Math.round(minutes * 1.2);
  const targetHours = Math.round((minutes / 15) * 109);
  const targetWords = (minutes / 15) * 3.2;

  // Animated smooth counter displays
  const animatedBooks = useAnimatedNumber(targetBooks, 0);
  const animatedHours = useAnimatedNumber(targetHours, 0);
  const animatedWords = useAnimatedNumber(targetWords, 1);

  // Dynamic compounding insights based on minutes
  const getMilestoneInsight = (mins: number) => {
    if (mins <= 15) {
      return {
        quote: "Finishing 'Atomic Habits', 'Meditations', and 'The Great Gatsby' every single month.",
        tag: "Mindful Reader",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20"
      };
    } else if (mins <= 25) {
      return {
        quote: "Over 4 uninterrupted days & nights of pure contemplative wisdom — more than most adults experience in 5 years.",
        tag: "Consistent Scholar",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20"
      };
    } else if (mins <= 45) {
      return {
        quote: "The equivalent of completing 3 university-level humanities degrees purely in self-directed deep focus.",
        tag: "Deep Cultivator",
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-500/10 border-sky-500/20"
      };
    } else {
      return {
        quote: "Absorbing more masterwork literature and human insight in 12 months than 98% of people read in a lifetime.",
        tag: "Literary Polymath",
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10 border-purple-500/20"
      };
    }
  };

  const milestone = getMilestoneInsight(minutes);

  const presets = [
    { label: '10 min', val: 10, note: 'Micro-habit' },
    { label: '15 min', val: 15, note: 'Recommended' },
    { label: '25 min', val: 25, note: 'Pomodoro' },
    { label: '45 min', val: 45, note: 'Deep Dive' },
    { label: '60 min', val: 60, note: 'Mastery' },
  ];

  return (
    <section id="calculator" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border relative">
      {/* Background ambient decorative glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 dark:opacity-20 overflow-hidden"
      >
        <div className="w-[620px] h-[340px] rounded-full bg-vibe-accent/15 blur-3xl transform -translate-y-12" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-10 sm:mb-14">

          <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
            Small daily pages. <br />
            <span className="italic font-display font-normal text-vibe-accent">Massive compounding wisdom.</span>
          </h2>

          <p className="text-xs sm:text-base text-vibe-ink-secondary leading-relaxed">
            See how a modest, distraction-free reading habit transforms your mental life over the course of a single year.
          </p>
        </div>

        {/* Main Interactive Calculator Card */}
        <ScrollRevealCard delayMs={60}>
          <div className="rounded-3xl bg-vibe-card border border-vibe-border shadow-xl p-6 sm:p-10 lg:p-12 space-y-8 backdrop-blur-sm">
          
          {/* Header row: Slider prompt + current value badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-vibe-border">
            <div className="space-y-1">
              <label 
                htmlFor="reading-minutes-slider" 
                className="text-sm sm:text-base font-heading font-bold text-vibe-ink flex items-center gap-2"
              >
                <span>I want to read</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-vibe-accent text-white font-mono text-sm sm:text-base font-bold shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {minutes} min
                </span>
                <span>per day</span>
              </label>
              <p className="text-xs text-vibe-ink-muted">
                Drag the slider or tap a preset to simulate your annual reading compounding.
              </p>
            </div>

            {/* Habit Category Tag */}
            <div className={`self-start sm:self-center px-3 py-1.5 rounded-full text-xs font-heading font-semibold border ${milestone.bg} ${milestone.color} transition-colors duration-300`}>
              ✦ {milestone.tag}
            </div>
          </div>

          {/* Interactive Range Slider Control */}
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center">
              <input
                id="reading-minutes-slider"
                type="range"
                min="10"
                max="60"
                step="1"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-vibe-accent cursor-pointer h-2.5 bg-vibe-card-subtle rounded-lg border border-vibe-border transition-all"
                aria-label="Daily reading minutes target"
              />
            </div>

            {/* Slider Scale Indicators */}
            <div className="flex justify-between items-center text-[11px] font-mono text-vibe-ink-muted px-1">
              <span>10 min / day</span>
              <span className="hidden sm:inline">25 min (Pomodoro)</span>
              <span className="hidden sm:inline">40 min</span>
              <span>60 min / day</span>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-heading font-medium text-vibe-ink-muted mr-1">
                Quick presets:
              </span>
              {presets.map((p) => {
                const isActive = minutes === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setMinutes(p.val)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border active:scale-95 ${
                      isActive
                        ? 'bg-vibe-accent text-white border-vibe-accent shadow-xs font-bold'
                        : 'bg-vibe-card-subtle text-vibe-ink-secondary border-vibe-border hover:bg-vibe-border/60 hover:text-vibe-ink'
                    }`}
                  >
                    <span>{p.label}</span>
                    {p.val === 15 && (
                      <span className="ml-1.5 text-[10px] opacity-80">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Metrics Cards: 3-column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4">
            
            {/* Metric 1: Full Books */}
            <div className="rounded-2xl p-5 sm:p-6 bg-vibe-card-subtle border border-vibe-border space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-vibe-ink tracking-tight flex items-baseline gap-1.5">
                  <span>{animatedBooks}</span>
                  <span className="text-sm font-sans font-medium text-vibe-ink-muted">books</span>
                </div>
                <div className="text-xs font-heading font-bold text-vibe-ink uppercase tracking-wider">
                  Full Books Read / Year
                </div>
              </div>
              <p className="text-[11px] text-vibe-ink-muted leading-relaxed">
                Based on an average 65,000–70,000 word book (approx. 250 pages).
              </p>
            </div>

            {/* Metric 2: Deep Focus Hours */}
            <div className="rounded-2xl p-5 sm:p-6 bg-vibe-card-subtle border border-vibe-border space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-vibe-ink tracking-tight flex items-baseline gap-1.5">
                  <span>{animatedHours}</span>
                  <span className="text-sm font-sans font-medium text-vibe-ink-muted">hours</span>
                </div>
                <div className="text-xs font-heading font-bold text-vibe-ink uppercase tracking-wider">
                  Calm, Deep Focus Time
                </div>
              </div>
              <p className="text-[11px] text-vibe-ink-muted leading-relaxed">
                Zero notifications, zero feeds, and pure mental replenishment.
              </p>
            </div>

            {/* Metric 3: Words Absorbed */}
            <div className="rounded-2xl p-5 sm:p-6 bg-vibe-card-subtle border border-vibe-border space-y-3 transition-transform hover:-translate-y-0.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-mono font-bold text-vibe-ink tracking-tight flex items-baseline gap-1.5">
                  <span>{animatedWords}M</span>
                  <span className="text-sm font-sans font-medium text-vibe-ink-muted">words</span>
                </div>
                <div className="text-xs font-heading font-bold text-vibe-ink uppercase tracking-wider">
                  Words & Ideas Absorbed
                </div>
              </div>
              <p className="text-[11px] text-vibe-ink-muted leading-relaxed">
                Expands vocabulary, cognitive reserve, and nuanced critical thinking.
              </p>
            </div>

          </div>

          {/* Dynamic Compounding Milestone Callout */}
          <div className="rounded-2xl p-4 sm:p-5 bg-vibe-card-subtle/80 border border-vibe-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bookmark className="w-4 h-4 fill-current" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-vibe-ink block">
                  Literary Milestone Equivalent
                </span>
                <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed font-display italic">
                  “{milestone.quote}”
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-vibe-ink-muted flex-shrink-0 self-end sm:self-center">
              365-day compounding
            </div>
          </div>

          {/* Social Media Contrast Reality Check */}
          <div className="p-4 rounded-xl bg-vibe-card border border-vibe-border/60 text-xs text-vibe-ink-secondary flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-vibe-accent flex-shrink-0" />
            <p className="leading-relaxed">
              <span className="font-semibold text-vibe-ink">Perspective check:</span> The average adult spends over 140 minutes daily on algorithm feeds. Reclaiming just <span className="font-mono font-bold text-vibe-accent">{minutes} minutes</span> turns fleeting screen time into <span className="font-semibold text-vibe-ink">{targetBooks} finished books</span> every year.
            </p>
          </div>

          {/* Action CTA Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onStartHabit}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Build this habit with Liread</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {onContinueGuest && (
              <button
                type="button"
                onClick={onContinueGuest}
                className="w-full sm:w-auto px-6 py-4 rounded-full text-xs sm:text-sm font-semibold text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all border border-vibe-border active:scale-95 flex items-center justify-center"
              >
                <span>Explore as guest first</span>
              </button>
            )}
          </div>

          <p className="text-center text-[11px] text-vibe-ink-muted">
            Includes gentle habit tracking · Offline web app · Clean focus timer with ambient soundscapes
          </p>

        </div>
        </ScrollRevealCard>

      </div>
    </section>
  );
};
