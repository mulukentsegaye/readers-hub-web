import React, { useEffect, useState } from 'react';
import { Pause, Play, Square, Maximize2 } from 'lucide-react';
import { useTimerStore } from '../../stores/timerStore';
import { useAuthStore } from '../../stores/authStore';
import { useCelebrationStore } from '../../stores/celebrationStore';
import { useReflectionStore } from '../../stores/reflectionStore';
import { AmbientAudioController } from './AmbientAudioController';

export const FloatingTimerBar: React.FC = () => {
  const {
    isRunning,
    isFullScreenOpen,
    bookTitle,
    bookAuthor,
    subtitleNote,
    coverImageUrl,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getElapsedSeconds,
    setFullScreenOpen
  } = useTimerStore();

  const { logSessionMinutes } = useAuthStore();
  const { showCelebration } = useCelebrationStore();
  const [seconds, setSeconds] = useState(getElapsedSeconds());

  useEffect(() => {
    setSeconds(getElapsedSeconds());
    const interval = setInterval(() => {
      setSeconds(getElapsedSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, getElapsedSeconds]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const minutesRead = stopTimer();
    if (minutesRead > 0) {
      logSessionMinutes(minutesRead, bookTitle);
      useReflectionStore.getState().openReflection(minutesRead, bookTitle, bookAuthor);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const bookInitial = bookTitle ? bookTitle.slice(0, 3).toUpperCase() : 'LIR';
  const isIdle = !isRunning && seconds === 0;

  return (
    <div 
      onClick={() => setFullScreenOpen(true)}
      className={`fixed ${isIdle ? 'hidden md:flex' : 'flex'} bottom-[calc(env(safe-area-inset-bottom)+3.85rem)] md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-[88%] md:max-w-xl rounded-full p-2 sm:p-2.5 px-3 sm:px-4 bg-vibe-card/95 backdrop-blur-md border border-vibe-border shadow-float items-center justify-between gap-2 sm:gap-3 cursor-pointer transition-all duration-300 group hover:border-vibe-accent/40 ${
        isFullScreenOpen ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
      }`}
      title="Click to open full distraction-free reading timer"
    >
      {/* Left: Thumbnail & Book Details */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 relative z-10">
        <div className="relative w-8 h-10 rounded-md overflow-hidden border border-vibe-border bg-vibe-card-subtle shadow-xs flex-shrink-0 flex items-center justify-center">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={bookTitle} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[8px] font-bold text-vibe-ink text-center leading-none">
              {bookInitial}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-vibe-accent ${isRunning ? 'animate-pulse' : 'opacity-40'}`} />
            <span className="font-sans text-[10px] font-medium tracking-wider uppercase truncate text-vibe-accent">
              {isRunning ? 'Reading Now' : (seconds > 0 ? 'Timer Paused' : 'Ready to Start')}
            </span>
          </div>

          <h3 className="font-sans text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px] text-vibe-ink leading-tight">
            {bookTitle}
          </h3>

          <p className="hidden sm:block text-[11px] truncate max-w-[180px] text-vibe-ink-muted">
            {subtitleNote}
          </p>
        </div>
      </div>

      {/* Right: Ambient Audio + Digital Stopwatch & Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 relative z-10">
        <AmbientAudioController compact />

        <div className="text-right">
          <div className="font-mono text-sm sm:text-base font-semibold tracking-tight leading-none text-vibe-ink tabular-nums">
            {formatTime(seconds)}
          </div>
          <span className="hidden sm:inline-block text-[10px] font-medium text-vibe-ink-muted">
            Active session
          </span>
        </div>

        {/* Pause/Play Button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={isRunning ? 'Pause timer' : (seconds > 0 ? 'Resume timer' : 'Start timer')}
          className="h-9 px-3 sm:px-3.5 rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs font-medium shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              <span className="hidden sm:inline">{seconds > 0 ? 'Resume' : 'Start'}</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        <button
          type="button"
          onClick={handleStop}
          aria-label="Stop and log reading session"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-vibe-card-subtle border border-vibe-border text-vibe-ink-secondary hover:text-vibe-ink active:scale-95 transition-all"
          title="Stop & save session"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Fullscreen Expand Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFullScreenOpen(true);
          }}
          aria-label="Expand distraction-free mode"
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-vibe-ink-muted hover:text-vibe-ink transition-colors"
          title="Full screen reading mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
