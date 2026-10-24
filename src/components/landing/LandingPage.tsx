import React, { useState } from 'react';
import { LireadLogo } from '../ui/LireadLogo';
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronRight, 
  ArrowRight, 
  Check, 
  Bookmark, 
  BarChart3, 
  Feather,
  Star,
  Compass,
  Library,
  Quote,
  SlidersHorizontal,
  Flame,
  Trophy
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAmbientAudioStore } from '../../stores/ambientAudioStore';
import { AmbientSoundId } from '../../types/theme';
import { useAuthStore } from '../../stores/authStore';
import { ReadingImpactCalculator } from './ReadingImpactCalculator';
import { ScrollRevealCard } from './ScrollRevealCard';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenTimer?: () => void;
  onGoToLogin?: () => void;
  onGuest?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenTimer, onGoToLogin, onGuest }) => {
  const { signInAsGuest } = useAuthStore();
  const handleGuest = () => {
    signInAsGuest();
    if (onGuest) onGuest(); else onEnterApp();
  };
  const { vibeConfig } = useTheme();
  const { 
    isPlaying, 
    activeSoundId, 
    togglePlay, 
    play, 
    pause, 
    volume, 
    setVolume, 
    isMuted, 
    toggleMute 
  } = useAmbientAudioStore();

  const soundOptions: Array<{ id: AmbientSoundId; label: string; icon: string; desc: string }> = [
    { id: 'birds', label: 'Morning Songbirds', icon: '🕊️', desc: 'Light forest morning breeze' },
    { id: 'rain', label: 'Window Rain', icon: '🌧️', desc: 'Soft droplets against window glass' },
    { id: 'fireplace', label: 'Hearth Fireplace', icon: '🔥', desc: 'Crackling cedar in a library' },
    { id: 'deep-space', label: 'Cosmic Resonance', icon: '🌌', desc: 'Hypnotic low-frequency focus drone' },
  ];

  const handleSelectSound = async (soundId: AmbientSoundId) => {
    if (activeSoundId === soundId && isPlaying) {
      pause();
    } else {
      await play(soundId);
    }
  };

  return (
    <div 
      data-theme="light"
      className="min-h-screen w-full transition-colors duration-500 overflow-x-clip flex flex-col justify-between bg-vibe-bg"
      style={{
        backgroundColor: 'var(--vibe-bg)',
        color: 'var(--vibe-ink)',
      }}
    >
      
      {/* ==============================================================================
          1. STICKY EDITORIAL TOP NAVIGATION
          ============================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-vibe-bg/85 backdrop-blur-md border-b border-vibe-border px-4 sm:px-6 lg:px-12 py-3.5 transition-colors duration-500">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Logo & Manifesto link */}
          <div className="flex items-center gap-2.5">
            <LireadLogo size="md" className="transition-transform active:scale-95" />
            <div>
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-vibe-ink">
                Liread
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide text-vibe-ink-secondary">
            <a href="#features" className="hover:text-vibe-accent transition-colors">
              Features
            </a>
            <a href="#timer" className="hover:text-vibe-accent transition-colors">
              Timer
            </a>
            <a href="#soundscapes" className="hover:text-vibe-accent transition-colors">
              Soundscapes
            </a>
            <a href="#bookshelf" className="hover:text-vibe-accent transition-colors">
              Bookshelf
            </a>
            <a href="#analytics" className="hover:text-vibe-accent transition-colors">
              Analytics
            </a>
            <a href="#calculator" className="hover:text-vibe-accent transition-colors">
              Impact
            </a>
            <a href="#quotes" className="hover:text-vibe-accent transition-colors">
              Philosophy
            </a>
          </nav>

          {/* Right Action Stack: Login / Guest */}
          <div className="flex items-center gap-1.5 sm:gap-3">

            {/* Desktop buttons */}
            <button
              type="button"
              onClick={handleGuest}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all border border-vibe-border shadow-xs active:scale-95"
            >
              <span>Continue as Guest</span>
            </button>

            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all shadow-xs active:scale-95"
              >
                <span>Sign In / Create Account</span>
              </button>
            )}

            {/* Mobile buttons */}
            <button
              type="button"
              onClick={handleGuest}
              className="flex sm:hidden items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all border border-vibe-border shadow-xs active:scale-95"
            >
              <span>Guest</span>
            </button>

            {onGoToLogin && (
              <button
                type="button"
                onClick={onGoToLogin}
                className="flex sm:hidden items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all shadow-xs active:scale-95"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ==============================================================================
          2. HERO SECTION: EDITORIAL HEADLINE & ATMOSPHERIC SHOWCASE
          ============================================================================== */}
      <section className="relative w-full pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-12 flex flex-col items-center text-center">
        {/* Editorial Title */}
        <h1 className="max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-display font-normal tracking-tight text-vibe-ink leading-[1.15] sm:leading-[1.12] mb-6">
          Where deep reading meets <br />
          <span className="italic font-display font-normal text-vibe-accent">
            aesthetic focus.
          </span>
        </h1>

        {/* Lead Subtitle */}
        <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-vibe-ink-secondary leading-relaxed font-normal mb-8 sm:mb-10">
          Cultivate a calm, distraction-free reading habit with atmospheric generative soundscapes, 
          curated multi-theme aesthetics inspired by Kinfolk and archival libraries, and mindful reflection tools.
        </p>

        {/* Action Button Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-12 sm:mb-16">
          {onGoToLogin && (
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2.5"
            >
              <span>Create Account / Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleGuest}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-semibold bg-vibe-card hover:bg-vibe-card-subtle text-vibe-ink border border-vibe-border transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Continue as Guest</span>
            <ChevronRight className="w-4 h-4 text-vibe-ink-muted" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('features');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full text-sm font-semibold bg-vibe-card-subtle hover:bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink border border-vibe-border-subtle transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Explore Features</span>
            <ChevronRight className="w-4 h-4 text-vibe-ink-muted" />
          </button>
        </div>

      </section>

      {/* ==============================================================================
          3. CORE PRODUCT ARCHITECTURE: INTRO BANNER
          ============================================================================== */}
      <section id="features" className="w-full pt-16 sm:pt-24 pb-4 px-4 sm:px-6 lg:px-12 border-t border-vibe-border">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
            Everything You Need to Read More Deeply
          </h2>
          <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed max-w-xl mx-auto">
            No distracting ads, no infinite dopamine doom-scrolling. Just pure focus, literary connection, and timeless tools.
          </p>
        </div>
      </section>

      {/* ==============================================================================
          FEATURE 1: DISTRACTION-FREE IMMERSION TIMER
          ============================================================================== */}
      <section id="timer" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left: Text & Editorial Details */}
            <div className="lg:col-span-6 space-y-6">

              <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
                Distraction-Free Immersion Timer
              </h2>

              <p className="text-sm sm:text-base text-vibe-ink-secondary leading-relaxed">
                Step into a full-screen reading state with a gentle stopwatch, customizable interval chimes, and instant session logging. Every second spent in a book quietly adds to your daily goals.
              </p>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-vibe-ink-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Full-screen Zen mode with dark room compatibility</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Persistent mini HUD bar while browsing the feed</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Integrated with ambient background audio loops</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenTimer || onEnterApp}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all shadow-xs active:scale-95"
                >
                  <Clock className="w-4 h-4" />
                  <span>Launch Reading Timer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Interactive Timer Visual Mockup */}
            <div className="lg:col-span-6">
              <ScrollRevealCard delayMs={80}>
                <div className="rounded-3xl bg-vibe-card border border-vibe-border p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                      Active Reading Session
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-vibe-card-subtle border border-vibe-border text-vibe-ink-muted">
                    Zen HUD Active
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-vibe-ink-muted">Currently Reading</p>
                  <h4 className="text-base sm:text-lg font-heading font-bold text-vibe-ink flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-vibe-accent flex-shrink-0" />
                    <span>The Creative Act: A Way of Being</span>
                  </h4>
                  <p className="text-xs text-vibe-ink-secondary">Rick Rubin · Chapter 14: Intention</p>
                </div>

                {/* Big Clock Display */}
                <div className="py-6 px-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border text-center space-y-2 relative">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-vibe-ink-muted">
                    Session Duration
                  </span>
                  <div className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-vibe-ink">
                    00:42:15
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-vibe-accent font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-vibe-accent" />
                    <span>Interval chime in 07:45 · 25m interval</span>
                  </div>
                </div>

                {/* Progress bar toward daily goal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vibe-ink-secondary">Daily Goal Progress</span>
                    <span className="font-mono font-semibold text-vibe-ink">42 / 60 min (70%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-vibe-border overflow-hidden">
                    <div className="h-full rounded-full bg-vibe-accent transition-all duration-500 w-[70%]" />
                  </div>
                </div>

                {/* Mock session controls */}
                <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-vibe-card-subtle border border-vibe-border text-vibe-ink-muted flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-vibe-accent" />
                    Hearth Fireplace (Playing)
                  </span>
                  <span className="text-[11px] text-vibe-ink-muted">
                    Logs automatically on pause
                  </span>
                </div>
              </div>
              </ScrollRevealCard>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================================
          FEATURE 2: ATMOSPHERIC SOUNDSCAPE ENGINE
          ============================================================================== */}
      <section id="soundscapes" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left: Interactive Soundscape Player Lounge */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <ScrollRevealCard delayMs={80}>
                <div className="p-6 sm:p-8 rounded-3xl bg-vibe-card border border-vibe-border shadow-lg space-y-6">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-heading font-bold text-vibe-ink">Interactive Audio Lounge</h4>
                      <p className="text-[11px] text-vibe-ink-muted">Tap any vibe to preview in real-time</p>
                    </div>
                  </div>

                  {isPlaying && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Audio
                      </span>
                      <button
                        type="button"
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute' : 'Mute'}
                        className="p-1.5 rounded-lg text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* 4 Interactive Audio Tracks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {soundOptions.map((sound) => {
                    const isThisPlaying = activeSoundId === sound.id && isPlaying;
                    return (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => handleSelectSound(sound.id)}
                        className={`p-3 rounded-2xl text-left border text-xs transition-all flex items-center justify-between gap-2 active:scale-98 ${
                          isThisPlaying
                            ? 'border-vibe-accent bg-vibe-accent-subtle text-vibe-accent font-semibold ring-1 ring-vibe-accent/30 shadow-xs'
                            : 'border-vibe-border bg-vibe-card-subtle hover:bg-vibe-card text-vibe-ink hover:border-vibe-border'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl">{sound.icon}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold leading-tight">{sound.label}</p>
                            <p className="text-[10px] text-vibe-ink-muted truncate">{sound.desc}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isThisPlaying ? (
                            <div className="w-7 h-7 rounded-full bg-vibe-accent text-white flex items-center justify-center shadow-xs">
                              <Pause className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border border-vibe-border bg-vibe-card flex items-center justify-center text-vibe-ink-muted hover:text-vibe-ink shadow-xs">
                              <Play className="w-3 h-3 ml-0.5" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Volume Slider when active */}
                {isPlaying ? (
                  <div className="flex items-center gap-3 pt-3 border-t border-vibe-border text-xs text-vibe-ink-muted">
                    <span className="text-[11px] font-mono">Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-vibe-accent cursor-pointer h-1.5 bg-vibe-border rounded-lg"
                    />
                    <span className="font-mono text-[11px] font-semibold text-vibe-ink min-w-[32px] text-right">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-center text-vibe-ink-muted pt-1">
                    Free looping Web Audio synthesis · Zero external ads or network lag
                  </p>
                )}
              </div>
              </ScrollRevealCard>
            </div>

            {/* Right: Text & Editorial Details */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">

              <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
                Atmospheric Soundscape Engine
              </h2>

              <p className="text-sm sm:text-base text-vibe-ink-secondary leading-relaxed">
                Drown out modern notifications with seamlessly looping binaural audio. Whether you prefer the crackle of a private library hearth or raindrops on a Shibuya coffee shop window.
              </p>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-vibe-ink-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Auto-paired soundscapes for each aesthetic theme</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Independent volume controls & mute hotkey</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Lightweight audio synthesis with zero bandwidth lag</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================================
          FEATURE 3: DIGITAL BOOKSHELF & SAVED QUOTES
          ============================================================================== */}
      <section id="bookshelf" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left: Text & Editorial Details */}
            <div className="lg:col-span-6 space-y-6">

              <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
                Digital Bookshelf & Saved Quotes
              </h2>

              <p className="text-sm sm:text-base text-vibe-ink-secondary leading-relaxed">
                Preserve memorable lines and marginalia with literary serif cards. Build your digital personal library, track reading progress percentages, and revisit kept quotes anytime.
              </p>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-vibe-ink-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Formatted passage cards with page numbers & book jackets</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>One-click bookmarking into your private saved stash</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Share insights with a community of serious readers</span>
                </li>
              </ul>
            </div>

            {/* Right: Visual Bookshelf + Quote Cards */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Card 1: Bookshelf Queue Preview */}
              <ScrollRevealCard delayMs={60}>
                <div className="rounded-3xl bg-vibe-card border border-vibe-border p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-vibe-border">
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4 text-vibe-accent" />
                    <span className="text-xs font-heading font-bold uppercase tracking-wider text-vibe-ink">Active Reading Shelf</span>
                  </div>
                  <span className="text-[11px] font-mono text-vibe-ink-muted">3 Books in Progress</span>
                </div>

                <div className="space-y-3">
                  {/* Book 1 */}
                  <div className="p-3 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-heading font-bold text-vibe-ink">The Creative Act</span>
                        <span className="text-vibe-ink-muted"> · Rick Rubin</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-vibe-accent">68%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-vibe-border overflow-hidden">
                      <div className="h-full bg-vibe-accent rounded-full w-[68%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-vibe-ink-muted">
                      <span className="font-mono">Page 142 of 210</span>
                      <span>Updated 2 hours ago</span>
                    </div>
                  </div>

                  {/* Book 2 */}
                  <div className="p-3 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-heading font-bold text-vibe-ink">Meditations</span>
                        <span className="text-vibe-ink-muted"> · Marcus Aurelius</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-vibe-accent">42%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-vibe-border overflow-hidden">
                      <div className="h-full bg-vibe-accent rounded-full w-[42%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-vibe-ink-muted">
                      <span className="font-mono">Book IV · Gregory Hays translation</span>
                      <span>Yesterday</span>
                    </div>
                  </div>
                </div>
              </div>

              </ScrollRevealCard>

              {/* Card 2: Saved Literary Passage Preview */}
              <ScrollRevealCard delayMs={160}>
                <div className="rounded-3xl bg-vibe-card border border-vibe-border p-6 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-vibe-accent">
                    <Quote className="w-4 h-4" />
                    <span>Saved Passage</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-vibe-accent font-medium px-2 py-0.5 rounded-full bg-vibe-accent-subtle border border-vibe-accent/20">
                    <Bookmark className="w-3 h-3 fill-current" />
                    <span>In Your Stash</span>
                  </div>
                </div>

                <blockquote className="font-display italic text-sm sm:text-base text-vibe-ink leading-relaxed font-normal">
                  “The art of reading is in great part that of acquiring a better, deeper understanding of life through the words of others.”
                </blockquote>

                <div className="flex items-center justify-between text-[11px] text-vibe-ink-muted pt-1">
                  <span>Virginia Woolf · To the Lighthouse</span>
                  <span className="font-mono">Page 84</span>
                </div>
              </div>
              </ScrollRevealCard>

            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================================
          FEATURE 4: GENTLE ANALYTICS & HABIT STREAKS
          ============================================================================== */}
      <section id="analytics" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* Left: Visual Analytics Mockup */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <ScrollRevealCard delayMs={80}>
                <div className="rounded-3xl bg-vibe-card border border-vibe-border p-6 sm:p-8 shadow-lg space-y-6">
                
                {/* Metric Summary Pills */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-heading font-bold">
                      <Flame className="w-4 h-4 fill-current" />
                      <span>Reading Streak</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-vibe-ink">7 Days</div>
                    <p className="text-[10px] text-vibe-ink-muted">Personal record this month</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-vibe-accent font-heading font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Today's Time</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-vibe-ink">52m <span className="text-xs font-normal text-vibe-ink-muted">/ 60m</span></div>
                    <p className="text-[10px] text-vibe-ink-muted">87% of daily goal</p>
                  </div>
                </div>

                {/* 7-Day Gentle Habit Activity Chart */}
                <div className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-vibe-ink">7-Day Reading Rhythm</span>
                    <span className="font-mono text-[11px] text-vibe-ink-muted">Total: 6.8 hrs</span>
                  </div>

                  <div className="flex items-end justify-between gap-2 h-24 pt-4">
                    {[
                      { day: 'M', mins: 45, height: '60%' },
                      { day: 'T', mins: 60, height: '80%' },
                      { day: 'W', mins: 30, height: '40%' },
                      { day: 'T', mins: 75, height: '100%' },
                      { day: 'F', mins: 50, height: '65%' },
                      { day: 'S', mins: 90, height: '100%' },
                      { day: 'S', mins: 52, height: '70%', today: true },
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div 
                          className={`w-full rounded-md transition-all ${
                            item.today 
                              ? 'bg-vibe-accent shadow-xs' 
                              : 'bg-vibe-accent/65 hover:bg-vibe-accent/85'
                          }`}
                          style={{ height: item.height }}
                          title={`${item.mins} minutes`}
                        />
                        <span className={`text-[10px] font-mono ${item.today ? 'font-bold text-vibe-accent' : 'text-vibe-ink-muted'}`}>
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Friendly Community Consistent Circle Preview */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-vibe-ink flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Consistent Readers Circle
                    </span>
                    <span className="text-[11px] text-vibe-ink-muted">Self-paced & Equal</span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { goal: '100% of plan', name: 'Elena Rostova', streak: '28d streak', badge: '✨' },
                      { goal: '100% of plan', name: 'Julian Reed', streak: '19d streak', badge: '✨' },
                      { goal: '100% of plan', name: 'Sophia Chen', streak: '21d streak', badge: '✨' },
                    ].map((reader) => (
                      <div key={reader.name} className="flex items-center justify-between p-2 rounded-xl bg-vibe-card-subtle text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{reader.badge}</span>
                          <span className="font-medium text-vibe-ink">{reader.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{reader.goal}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-vibe-ink-muted pt-1">
                    Every reader who fulfills their personal daily plan is celebrated equally.
                  </p>
                </div>

              </div>
              </ScrollRevealCard>
            </div>

            {/* Right: Text & Editorial Details */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">

              <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
                Gentle Analytics & Habit Streaks
              </h2>

              <p className="text-sm sm:text-base text-vibe-ink-secondary leading-relaxed">
                Track your consistency with elegant circular gauges, 7-day and 30-day bar charts, and the calm Community Sanctuary designed to inspire rather than create burnout.
              </p>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-vibe-ink-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Customizable daily minute goals (30m, 60m, 90m)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Weekly reading rankings with fellow literature lovers</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Privacy-first offline localStorage persistence</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ==============================================================================
          INTERACTIVE ANNUAL READING IMPACT CALCULATOR
          ============================================================================== */}
      <ReadingImpactCalculator
        onStartHabit={() => (onGoToLogin ? onGoToLogin() : handleGuest())}
        onContinueGuest={handleGuest}
      />

      {/* ==============================================================================
          5. PHILOSOPHY & LITERARY QUOTES
          ============================================================================== */}
      <section id="quotes" className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border">
        <ScrollRevealCard delayMs={80} className="max-w-4xl mx-auto text-center space-y-8">
          
          <div className="w-10 h-10 rounded-full bg-vibe-accent-subtle text-vibe-accent mx-auto flex items-center justify-center">
            <Feather className="w-5 h-5" />
          </div>

          <blockquote className="font-display italic text-xl sm:text-2xl lg:text-3xl text-vibe-ink leading-relaxed max-w-3xl mx-auto font-normal">
            “When I think of all the books still left for me to read, I have the certainty of being still happy.”
          </blockquote>

          <div className="space-y-1">
            <p className="text-sm font-heading font-bold text-vibe-ink tracking-wide">Jules Renard</p>
            <p className="text-xs text-vibe-ink-muted">French Author & Dramatist</p>
          </div>

        </ScrollRevealCard>
      </section>

      {/* ==============================================================================
          7. FINAL HIGH-IMPACT CALL TO ACTION
          ============================================================================== */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-vibe-border relative overflow-hidden">
        <ScrollRevealCard delayMs={80} className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-vibe-border bg-vibe-card p-8 sm:p-14 text-center shadow-xl space-y-6">

          <h2 className="text-2xl sm:text-4xl font-display font-normal text-vibe-ink tracking-tight">
            Reclaim your attention. <br />
            <span className="italic font-display font-normal text-vibe-accent">One page at a time.</span>
          </h2>

          <p className="text-xs sm:text-sm text-vibe-ink-secondary max-w-lg mx-auto leading-relaxed">
            A quiet, distraction-free space to turn your daily reading into an intentional art form. 
            Free, private, and distraction-free forever.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Create Account / Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleGuest}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-vibe-ink border border-vibe-border hover:bg-vibe-card-subtle transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Continue as Guest</span>
              <ChevronRight className="w-4 h-4 text-vibe-ink-muted" />
            </button>
          </div>

          <p className="text-[11px] text-vibe-ink-muted">
            No credit card required · Zero algorithms · Immediate access
          </p>
        </div>
        </ScrollRevealCard>

      </section>

      {/* ==============================================================================
          8. EDITORIAL FOOTER
          ============================================================================== */}
      <footer className="w-full py-10 px-4 sm:px-6 lg:px-12 border-t border-vibe-border bg-vibe-bg text-xs text-vibe-ink-muted transition-colors duration-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2.5">
            <LireadLogo size="xs" />
            <span className="font-display text-base font-bold text-vibe-ink">Liread</span>
            <span className="text-[11px]">© 2026 Liread Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <a href="#features" className="hover:text-vibe-ink transition-colors">Features</a>
            <a href="#timer" className="hover:text-vibe-ink transition-colors">Timer</a>
            <a href="#soundscapes" className="hover:text-vibe-ink transition-colors">Soundscapes</a>
            <a href="#bookshelf" className="hover:text-vibe-ink transition-colors">Bookshelf</a>
            <a href="#analytics" className="hover:text-vibe-ink transition-colors">Analytics</a>
            <a href="#calculator" className="hover:text-vibe-ink transition-colors">Impact</a>
            <a href="#quotes" className="hover:text-vibe-ink transition-colors">Philosophy</a>
            <button 
              onClick={handleGuest} 
              className="hover:text-vibe-ink transition-colors font-medium"
            >
              Continue as Guest
            </button>
            {onGoToLogin && (
              <button 
                onClick={onGoToLogin} 
                className="hover:text-vibe-ink transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>

        </div>
      </footer>

    </div>
  );
};
