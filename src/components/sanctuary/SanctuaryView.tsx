import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Check,
  Bookmark,
  BookOpen,
  ArrowLeft,
  SlidersHorizontal,
  Compass,
  Play,
  Heart,
  Users,
  Quote
} from 'lucide-react';
import { sanctuaryService } from '../../services/sanctuaryService';
import { useAuthStore } from '../../stores/authStore';
import { useTimerStore } from '../../stores/timerStore';
import { ConsistentReader, LiveCoReader, WeeklyCuratorInsight } from '../../types';
import { toast } from '../../stores/noticeStore';

interface SanctuaryViewProps {
  onBack?: () => void;
  onStartTimer?: (title: string, author: string, cover?: string) => void;
  onAdjustGoal?: () => void;
}

const COMMITMENT_PRESETS = [15, 30, 45, 60];

export const SanctuaryView: React.FC<SanctuaryViewProps> = ({
  onBack,
  onStartTimer,
  onAdjustGoal,
}) => {
  const { user, todayMinutesRead, isGuest, updateUser } = useAuthStore();
  const { isRunning, bookTitle: activeTimerBook } = useTimerStore();

  const [activeTab, setActiveTab] = useState<'circle' | 'curators' | 'streaks'>('circle');
  const [readers, setReaders] = useState<ConsistentReader[]>([]);
  const [liveCoReaders, setLiveCoReaders] = useState<LiveCoReader[]>([]);
  const [topCurators, setTopCurators] = useState<WeeklyCuratorInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const goal = user?.dailyGoalMinutes || 30;
  const userProgressPercent = Math.min(100, Math.round((todayMinutesRead / goal) * 100));

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      sanctuaryService.getConsistentReaders(user?.id),
      sanctuaryService.getLiveCoReaders(),
      sanctuaryService.getWeeklyCurators(),
    ])
      .then(([readersData, coReadersData, curatorsData]) => {
        if (!isMounted) return;
        setReaders(readersData || []);
        setLiveCoReaders(coReadersData || []);
        setTopCurators(curatorsData || []);
      })
      .catch((err) => {
        console.warn('Sanctuary fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, todayMinutesRead, goal]);

  const handleSetQuickGoal = async (minutes: number) => {
    await updateUser({ dailyGoalMinutes: minutes });
    toast.success(`Daily reading commitment updated to ${minutes} mins/day.`, 'Plan Updated');
  };

  // Add the current user to live co-readers list if their timer is running
  const effectiveLiveCoReaders = isRunning && activeTimerBook
    ? [
        {
          userId: user?.id || 'you',
          username: user?.username || 'you',
          fullName: user?.fullName || 'You',
          initials: 'YOU',
          avatarUrl: user?.avatarUrl,
          bookTitle: activeTimerBook,
          bookAuthor: 'Reading Now',
          sessionStartedMinutesAgo: 1,
          isCurrentUser: true,
        },
        ...liveCoReaders.filter((r) => r.userId !== user?.id),
      ]
    : liveCoReaders;

  // Filter or sort based on active tab
  const displayReaders = activeTab === 'streaks'
    ? [...readers].sort((a, b) => b.currentStreak - a.currentStreak)
    : readers;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20 px-2 sm:px-4">
      
      {/* Top Navigation & Header */}
      <div className="space-y-4 pt-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vibe-card border border-vibe-border text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink hover:border-vibe-border transition-colors group shadow-soft cursor-pointer"
            aria-label="Back to feed"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Feed</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-sans text-[10.5px] font-medium tracking-wider uppercase text-vibe-ink-muted/80">
                Community Sanctuary
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-vibe-ink leading-tight">
              Reading Sanctuary
            </h1>
          </div>

          {/* Tab Filter Pills */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-vibe-border bg-vibe-card-subtle shadow-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('circle')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'circle'
                  ? 'bg-vibe-card text-vibe-accent font-semibold shadow-xs border border-vibe-border'
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('curators')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'curators'
                  ? 'bg-vibe-card text-vibe-accent font-semibold shadow-xs border border-vibe-border'
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Curators</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('streaks')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'streaks'
                  ? 'bg-vibe-card text-vibe-accent font-semibold shadow-xs border border-vibe-border'
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Streaks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guest Notice */}
      {isGuest && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-4">
          <span>Guest browsing — create a free account to set your personal daily commitment and join the Consistent Circle.</span>
        </div>
      )}

      {/* 1. Live Co-Reading Sanctuary Presence Widget */}
      <div className="rounded-3xl border border-vibe-border bg-vibe-card-subtle p-4 sm:p-5 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-vibe-ink flex items-center gap-2">
                <span>Live Co-Reading Sanctuary</span>
                <span className="font-mono text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {effectiveLiveCoReaders.length} readers currently in session
                </span>
              </h2>
              <p className="text-[11px] text-vibe-ink-muted mt-0.5">
                Quiet companionship in books. No clocks, just focused minds reading side by side.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartTimer?.('The Creative Act: A Way of Being', 'Rick Rubin')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs font-medium shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Focus Session</span>
          </button>
        </div>

        {/* Live Reader Avatars & Current Books */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {effectiveLiveCoReaders.map((coReader) => (
            <div
              key={coReader.userId}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                coReader.isCurrentUser
                  ? 'bg-vibe-accent-subtle/80 border-vibe-accent/30 shadow-2xs'
                  : 'bg-vibe-card/80 border-vibe-border hover:border-vibe-border'
              }`}
            >
              <div className="relative flex-shrink-0">
                {coReader.avatarUrl ? (
                  <img
                    src={coReader.avatarUrl}
                    alt={coReader.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-vibe-border"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-vibe-accent text-white flex items-center justify-center font-bold text-xs">
                    {coReader.initials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-vibe-card" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-vibe-ink truncate">
                  {coReader.fullName} {coReader.isCurrentUser && <span className="text-vibe-accent font-normal">(You)</span>}
                </p>
                <p className="text-[11px] text-vibe-ink-muted truncate">
                  reading <span className="font-medium text-vibe-ink">{coReader.bookTitle}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Personal Daily Commitment & Consistency Circle Banner */}
      <div className="rounded-3xl border border-vibe-border bg-vibe-card p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-vibe-accent" />
              <span className="text-[10.5px] font-mono uppercase tracking-wider font-semibold text-vibe-accent">
                Your Daily Rhythm
              </span>
            </div>
            <h2 className="font-heading text-lg font-bold text-vibe-ink">
              Personal Daily Reading Commitment
            </h2>
            <p className="text-xs text-vibe-ink-muted mt-0.5">
              Set a manageable target. Consistency matters far more than volume.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {COMMITMENT_PRESETS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSetQuickGoal(mins)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-medium transition-all cursor-pointer ${
                  goal === mins
                    ? 'bg-vibe-accent text-white shadow-xs font-bold'
                    : 'bg-vibe-card-subtle text-vibe-ink-muted hover:text-vibe-ink border border-vibe-border'
                }`}
                title={`Set daily plan to ${mins} minutes`}
              >
                {mins}m
              </button>
            ))}
            <button
              type="button"
              onClick={onAdjustGoal}
              className="p-1.5 rounded-xl border border-vibe-border text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors cursor-pointer"
              title="Custom Goal"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center font-mono font-bold text-base flex-shrink-0">
              {todayMinutesRead}m
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tabular-nums text-vibe-ink">
                  {userProgressPercent}% of daily plan
                </span>
                {userProgressPercent >= 100 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Circle Complete
                  </span>
                )}
              </div>
              <p className="text-xs text-vibe-ink-muted mt-0.5">
                {userProgressPercent >= 100
                  ? 'You’ve reached your daily plan! You are celebrating in the Consistent Circle.'
                  : `${Math.max(0, goal - todayMinutesRead)} more minutes to complete your circle today.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vibe-card border border-vibe-border shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-mono text-xs font-bold tabular-nums text-vibe-ink">
                {user?.currentStreak ?? 0}d streak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Content: Consistent Circle OR Top Curators */}
      {activeTab === 'curators' ? (
        /* Top Wisdom Curators Showcase */
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-vibe-ink">
              Wisdom Curators
            </h2>
            <p className="text-xs text-vibe-ink-muted mt-0.5">
              Readers whose shared quotes and reflections were saved most this week.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCurators.map((curator) => (
              <div
                key={curator.id}
                className="bg-vibe-card border border-vibe-border rounded-2xl p-5 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-float transition-all"
              >
                <div className="space-y-3">
                  {/* Curator info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={curator.authorAvatar}
                        alt={curator.authorName}
                        className="w-7 h-7 rounded-full object-cover border border-vibe-border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-vibe-ink truncate">{curator.authorName}</p>
                        <p className="text-[10px] text-vibe-ink-muted truncate">@{curator.authorUsername}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <Bookmark className="w-3 h-3 fill-current" />
                      {curator.savedCount} saves
                    </span>
                  </div>

                  {/* Quote */}
                  <div className="p-3 rounded-xl bg-vibe-card-subtle border border-vibe-border-subtle relative">
                    <Quote className="w-4 h-4 text-vibe-accent/30 absolute top-2 right-2" />
                    <p className="font-serif italic text-xs sm:text-sm text-vibe-ink leading-relaxed">
                      "{curator.quoteOrInsight}"
                    </p>
                    <p className="text-[11px] text-vibe-ink-muted mt-2 font-medium">
                      — {curator.bookTitle} ({curator.bookAuthor})
                    </p>
                  </div>

                  {/* How I'm Applying This */}
                  {curator.actionableApplication && (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-mono uppercase tracking-wider font-bold text-vibe-accent">
                        <Compass className="w-3 h-3" />
                        How I'm Applying This
                      </span>
                      <p className="text-xs text-vibe-ink-secondary leading-snug">
                        {curator.actionableApplication}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-vibe-border-subtle text-[11px] text-vibe-ink-muted flex items-center justify-between">
                  <span>Shared {curator.createdAt}</span>
                  <span className="text-vibe-accent font-medium">Curated Wisdom</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* The Consistent Readers (Committed Circle) Showcase */
        <div className="bg-vibe-card border border-vibe-border rounded-3xl p-5 sm:p-6 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-vibe-border">
            <div>
              <h2 className="text-sm font-semibold text-vibe-ink flex items-center gap-2">
                <span>{activeTab === 'streaks' ? 'Streak Leaders' : 'Consistency Circle'}</span>
                <span className="font-mono text-xs font-normal text-vibe-ink-muted">
                  ({displayReaders.length} readers)
                </span>
              </h2>
              <p className="text-xs text-vibe-ink-muted mt-0.5">
                {activeTab === 'streaks'
                  ? 'Readers with the longest ongoing daily reading streaks.'
                  : 'Every reader who honors their personal daily plan is celebrated equally.'}
              </p>
            </div>

            <div className="text-xs text-vibe-ink-muted font-medium">
              {activeTab === 'streaks' ? 'Sorted by streak length' : 'Sorted by daily consistency'}
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-vibe-ink-muted">Loading sanctuary circle...</div>
          ) : (
            <div className="divide-y divide-vibe-border-subtle">
              {displayReaders.map((reader) => (
                <div
                  key={reader.userId}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-3 rounded-2xl transition-colors hover:bg-vibe-card-subtle ${
                    reader.isCurrentUser ? 'bg-vibe-accent-subtle/50' : ''
                  }`}
                >
                  {/* Left: Avatar & Reader info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      {reader.avatarUrl ? (
                        <img
                          src={reader.avatarUrl}
                          alt={reader.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-vibe-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-vibe-accent text-white flex items-center justify-center font-bold text-xs">
                          {reader.initials}
                        </div>
                      )}
                      {reader.isCurrentlyReading && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-vibe-card"
                          title="Currently reading"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-vibe-ink truncate">
                          {reader.fullName}
                        </p>
                        {reader.isCurrentUser && (
                          <span className="text-[10px] font-mono font-bold text-vibe-accent bg-vibe-accent-subtle px-1.5 py-0.5 rounded-md">
                            YOU
                          </span>
                        )}
                        {reader.isCurrentlyReading && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            reading {reader.currentlyReadingBook || 'in session'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-vibe-ink-muted truncate">
                        @{reader.username} · Daily Plan: <span className="font-mono">{reader.dailyGoalMinutes}m</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Personal Consistency Stats */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-3 sm:gap-6 pt-1 sm:pt-0 border-t sm:border-t-0 border-vibe-border-subtle">
                    {/* Goal Completion */}
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 block">
                        {reader.goalCompletionPercent}% of daily plan
                      </span>
                      <span className="text-[10px] font-mono text-vibe-ink-muted">
                        {reader.todayMinutesRead}m completed
                      </span>
                    </div>

                    {/* Streak Counter */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono text-xs font-semibold tabular-nums shrink-0">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{reader.currentStreak}d streak</span>
                    </div>

                    {/* Milestone pill */}
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      Fulfilled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
