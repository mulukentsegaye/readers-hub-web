import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Pause, Square, RotateCcw, BookOpen, ArrowLeft } from 'lucide-react';
import { useTimerStore } from '../../stores/timerStore';
import { useAuthStore } from '../../stores/authStore';
import { useCelebrationStore } from '../../stores/celebrationStore';
import { useReflectionStore } from '../../stores/reflectionStore';
import { AmbientAudioController } from './AmbientAudioController';
import { NavigationTab } from '../layout/SidebarLeft';

interface FullTimerModalProps {
  previousTab?: NavigationTab;
}

const TAB_NAME_MAP: Record<NavigationTab, string> = {
  feed: 'Community Feed',
  explore: 'Explore Books',
  timer: 'reading feed',
  analytics: 'My Progress',
  leaderboard: 'Reading Sanctuary',
  sanctuary: 'Reading Sanctuary',
  bookshelf: 'My Bookshelf',
  saved: 'Saved Passages',
  book_details: 'Book Info',
  reader: 'E-Reader',
  profile: 'Reader Profile',
};

export const FullTimerModal: React.FC<FullTimerModalProps> = ({ previousTab = 'feed' }) => {
  const {
    isFullScreenOpen,
    setFullScreenOpen,
    isRunning,
    bookTitle,
    bookAuthor,
    coverImageUrl,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    getElapsedSeconds
  } = useTimerStore();

  const { logSessionMinutes } = useAuthStore();
  const { showCelebration } = useCelebrationStore();
  const [seconds, setSeconds] = useState(getElapsedSeconds());

  // Transition & lifecycle states
  const [isRendered, setIsRendered] = useState(isFullScreenOpen);
  const [transitionStage, setTransitionStage] = useState<'idle' | 'entering' | 'exiting'>('idle');
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize elapsed clock
  useEffect(() => {
    setSeconds(getElapsedSeconds());
    const interval = setInterval(() => {
      setSeconds(getElapsedSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, getElapsedSeconds]);

  // Synchronize store opening/closing with peaceful page transitions
  useEffect(() => {
    if (isFullScreenOpen) {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      setIsRendered(true);
      setTransitionStage('entering');

      enterTimeoutRef.current = setTimeout(() => {
        setTransitionStage('idle');
      }, 380);
    } else if (isRendered && transitionStage !== 'exiting') {
      // Gracefully handle external close (e.g. from background actions)
      setTransitionStage('exiting');
      exitTimeoutRef.current = setTimeout(() => {
        setIsRendered(false);
        setTransitionStage('idle');
      }, 220);
    }
  }, [isFullScreenOpen]);

  // Clean up any timeouts on unmount
  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  // Peaceful close handler with exit animation
  const handleClose = (onComplete?: () => void) => {
    if (transitionStage === 'exiting') return;

    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    setTransitionStage('exiting');

    exitTimeoutRef.current = setTimeout(() => {
      onComplete?.();
      setFullScreenOpen(false);
      setIsRendered(false);
      setTransitionStage('idle');
    }, 220);
  };

  // Keyboard accessibility: Escape key closes with peaceful transition
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRendered && transitionStage !== 'exiting') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, transitionStage]);

  if (!isRendered) return null;

  const formatHours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const formatMins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const formatSecs = (seconds % 60).toString().padStart(2, '0');

  const handleStopAndSave = () => {
    handleClose(() => {
      const mins = stopTimer();
      if (mins > 0) {
        logSessionMinutes(mins, bookTitle);
        useReflectionStore.getState().openReflection(mins, bookTitle, bookAuthor);
      }
    });
  };

  const backDestinationName = TAB_NAME_MAP[previousTab] || 'reading feed';
  const transitionClass =
    transitionStage === 'exiting'
      ? 'timer-page-exit'
      : transitionStage === 'entering'
      ? 'timer-page-enter'
      : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Distraction-free reading timer"
      className={`fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-8 md:p-12 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto bg-vibe-bg text-vibe-ink backdrop-blur-md transition-colors duration-500 ${transitionClass}`}
    >
      {/* Signature Liread Ambient Top Beam during Transition */}
      {transitionStage !== 'idle' && (
        <div className="peaceful-top-beam" aria-hidden="true" />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto relative z-10 timer-element-reveal-1">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => handleClose()}
            aria-label={`Back to ${backDestinationName}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-vibe-border bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all active:scale-95 shadow-xs group"
            title={`Back to ${backDestinationName}`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-vibe-accent text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading text-xs sm:text-sm font-semibold text-vibe-ink">
              Distraction-Free Reading
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <AmbientAudioController compact />

          <button
            onClick={() => handleClose()}
            aria-label="Close timer"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-vibe-border bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors shadow-xs"
            title="Close timer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Focus Display */}
      <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 sm:space-y-6 my-auto py-6 relative z-10 timer-element-reveal-2">
        
        {/* Book Jacket Art */}
        <div className="relative w-24 h-36 sm:w-32 sm:h-48 rounded-lg shadow-vibe-elevated border border-vibe-border bg-vibe-card overflow-hidden flex flex-col items-center justify-between text-center">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={bookTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full p-3 sm:p-4 flex flex-col items-center justify-between">
              <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-vibe-ink line-clamp-2">
                {bookTitle}
              </span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-vibe-border flex items-center justify-center">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-vibe-accent/40"></span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-medium text-vibe-ink-muted truncate w-full">
                {bookAuthor}
              </span>
              <div className="absolute left-1.5 sm:left-2 top-0 bottom-0 w-[2px] bg-black/10 dark:bg-white/10"></div>
            </div>
          )}
        </div>

        {/* Current Book Info */}
        <div className="space-y-0.5">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-vibe-ink break-words">
            {bookTitle}
          </h1>
          <p className="text-xs text-vibe-ink-muted">
            by {bookAuthor}
          </p>
        </div>

        {/* Digital Clock */}
        <div className="font-mono text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold tracking-wider py-2 select-none drop-shadow-sm text-vibe-ink">
          <span>{formatHours}</span>:
          <span>{formatMins}</span>:
          <span>{formatSecs}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 sm:gap-4 pt-2">
          <button
            onClick={resetTimer}
            aria-label="Reset timer"
            className="min-w-[48px] min-h-[48px] p-3 rounded-full border border-vibe-border bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all shadow-xs flex items-center justify-center active:scale-95"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={isRunning ? pauseTimer : resumeTimer}
            aria-label={isRunning ? 'Pause reading' : (seconds > 0 ? 'Resume reading' : 'Start reading')}
            className="min-h-[48px] flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white text-sm sm:text-base font-medium shadow-lg transition-all active:scale-95"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause Reading</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{seconds > 0 ? 'Resume Reading' : 'Start Reading'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleStopAndSave}
            aria-label="Finish and save reading session"
            className="min-w-[48px] min-h-[48px] p-3 rounded-full border border-vibe-border bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all shadow-xs flex items-center justify-center active:scale-95"
            title="Finish & log session"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Ambient Background Audio paired with Active Vibe */}
        <div className="w-full pt-3">
          <AmbientAudioController />
        </div>

      </div>

      {/* Bottom Quote & Tip */}
      <div className="text-center max-w-xl mx-auto pt-4 relative z-10 timer-element-reveal-3">
        <p className="font-display italic text-sm sm:text-base text-vibe-ink-secondary leading-relaxed font-normal">
          “The more that you read, the more things you will know. The more that you learn, the more places you'll go.”
        </p>
        <span className="text-[10px] font-mono mt-1 block text-vibe-ink-muted">
          Close to return to {backDestinationName} while timer keeps ticking
        </span>
      </div>

    </div>
  );
};
