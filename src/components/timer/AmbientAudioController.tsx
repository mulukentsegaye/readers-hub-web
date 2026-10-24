import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Volume1, 
  Flame, 
  CloudRain, 
  Radio, 
  Bird, 
  Sparkles, 
  Sliders, 
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAmbientAudioStore } from '../../stores/ambientAudioStore';
import { useThemeStore } from '../../stores/themeStore';
import { AmbientSoundId, AMBIENT_SOUNDS } from '../../types/theme';
import { ambientAudioEngine } from '../../lib/ambientAudioEngine';

interface AmbientAudioControllerProps {
  compact?: boolean;
}

export const AmbientAudioController: React.FC<AmbientAudioControllerProps> = ({ compact = false }) => {
  const {
    isPlaying,
    volume,
    isMuted,
    activeSoundId,
    autoPairWithTheme,
    togglePlay,
    setVolume,
    toggleMute,
    setSound,
    setAutoPairWithTheme,
    getActiveTrackConfig,
  } = useAmbientAudioStore();

  const { theme } = useThemeStore();
  const [levels, setLevels] = useState<number[]>([15, 25, 40, 20, 10]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const activeTrack = getActiveTrackConfig();

  // Poll visualizer levels when playing for animated waveforms
  useEffect(() => {
    if (!isPlaying) {
      setLevels([6, 6, 6, 6, 6]);
      return;
    }

    const interval = setInterval(() => {
      const liveLevels = ambientAudioEngine.getFrequencyLevels();
      // If live levels are quiet or analyzing, generate subtle dynamic wave simulation
      const baseWave = liveLevels.map((val, idx) => {
        if (val > 5) return val;
        // Pleasant natural rhythmic bobbing for ambient visualizer
        const time = Date.now() / 250;
        const bob = Math.sin(time + idx * 0.9) * 25 + 35;
        return Math.max(12, Math.min(85, Math.round(bob)));
      });
      setLevels(baseWave);
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const getSoundIcon = (id: AmbientSoundId, size = 'w-4 h-4') => {
    switch (id) {
      case 'fireplace':
        return <Flame className={size} />;
      case 'rain':
        return <CloudRain className={size} />;
      case 'deep-space':
        return <Radio className={size} />;
      case 'birds':
      default:
        return <Bird className={size} />;
    }
  };

  // Compact Mini Toggle (e.g., for FloatingTimerBar or Header)
  if (compact) {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label={isPlaying ? `Pause ambient sound: ${activeTrack.name}` : `Play ambient sound: ${activeTrack.name}`}
          className={`min-w-[40px] min-h-[40px] px-2.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium border transition-all active:scale-95 ${
            isPlaying
              ? 'bg-vibe-accent text-white border-vibe-accent shadow-xs'
              : 'bg-vibe-card text-vibe-ink-secondary border-vibe-border hover:bg-vibe-card-subtle'
          }`}
          title={`${isPlaying ? 'Playing' : 'Toggle'}: ${activeTrack.name} (${activeTrack.themeVibe})`}
        >
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3.5 w-3.5 px-0.5">
              <span className="w-0.5 bg-current rounded-full transition-all duration-150" style={{ height: `${Math.max(20, levels[0])}%` }} />
              <span className="w-0.5 bg-current rounded-full transition-all duration-150" style={{ height: `${Math.max(40, levels[2])}%` }} />
              <span className="w-0.5 bg-current rounded-full transition-all duration-150" style={{ height: `${Math.max(25, levels[4])}%` }} />
            </div>
          ) : (
            <VolumeX className="w-4 h-4" />
          )}

          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">
            {activeTrack.id === 'deep-space' ? 'Space' : activeTrack.id}
          </span>
        </button>
      </div>
    );
  }

  // Full Expanded Controller for Reading Timer Modal
  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-vibe-card/90 border border-vibe-border/90 backdrop-blur-md shadow-vibe-elevated p-3 sm:p-4 text-vibe-ink transition-all overflow-hidden">
      
      {/* Top Summary Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
        
        {/* Left: Current Ambient Track & Live Animated Equalizer */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-vibe-accent text-white border-vibe-accent shadow-md'
                : 'bg-vibe-card-subtle text-vibe-ink-secondary border-vibe-border hover:text-vibe-ink'
            }`}
            title={isPlaying ? 'Pause ambient sound' : 'Start ambient sound'}
          >
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 justify-center">
                <span className="w-0.5 bg-white rounded-full transition-all duration-150" style={{ height: `${Math.max(20, levels[0])}%` }} />
                <span className="w-0.5 bg-white rounded-full transition-all duration-150" style={{ height: `${Math.max(50, levels[1])}%` }} />
                <span className="w-0.5 bg-white rounded-full transition-all duration-150" style={{ height: `${Math.max(30, levels[2])}%` }} />
                <span className="w-0.5 bg-white rounded-full transition-all duration-150" style={{ height: `${Math.max(60, levels[3])}%` }} />
              </div>
            ) : (
              getSoundIcon(activeTrack.id, 'w-4 h-4 sm:w-5 sm:h-5')
            )}
          </button>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold truncate text-vibe-ink">
                {activeTrack.name}
              </span>
              <span className="hidden xs:inline-block text-[9.5px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-vibe-badge-bg text-vibe-badge-text border border-vibe-border-subtle flex-shrink-0">
                {activeTrack.themeVibe}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-vibe-ink-muted truncate mt-0.5">
              {activeTrack.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Toggle & Settings expander */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause ambient sound' : 'Start ambient sound'}
            className={`h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl font-medium text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-vibe-accent text-white shadow-xs'
                : 'bg-vibe-card-subtle text-vibe-ink hover:bg-vibe-card-hover border border-vibe-border'
            }`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Playing</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Ambient Off</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            aria-label={isPanelOpen ? 'Collapse ambient audio settings' : 'Expand ambient audio settings'}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-vibe-border bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink transition-colors flex-shrink-0 cursor-pointer"
            title="Audio mix & vibe pairing options"
          >
            {isPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Soundscape Mixer Drawer */}
      {isPanelOpen && (
        <div className="mt-4 pt-3.5 border-t border-vibe-border-subtle space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
          
          {/* 4 Paired Theme Vibe Soundscapes Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-vibe-ink-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-vibe-accent" />
                Theme Ambient Soundscapes
              </span>
              <button
                type="button"
                onClick={() => setAutoPairWithTheme(!autoPairWithTheme)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                  autoPairWithTheme
                    ? 'bg-vibe-accent-subtle text-vibe-accent border-vibe-accent/30 font-semibold'
                    : 'text-vibe-ink-muted border-vibe-border hover:text-vibe-ink'
                }`}
                title="When enabled, changing your visual theme automatically changes the background ambient sound"
              >
                {autoPairWithTheme ? '✨ Auto-Sync: ON' : 'Auto-Sync: OFF'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(AMBIENT_SOUNDS) as AmbientSoundId[]).map((id) => {
                const snd = AMBIENT_SOUNDS[id];
                const isSelected = activeSoundId === id;
                const isThemePaired = snd.themeId === theme;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={async () => {
                      await setSound(id);
                      if (!isPlaying) {
                        await togglePlay();
                      }
                    }}
                    className={`min-h-[44px] p-2 rounded-xl border text-left flex items-center justify-between transition-all group overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'bg-vibe-card-subtle border-vibe-accent shadow-xs'
                        : 'bg-vibe-card border-vibe-border/70 hover:border-vibe-border hover:bg-vibe-card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-vibe-accent text-white' : 'bg-vibe-card-subtle text-vibe-ink-muted group-hover:text-vibe-ink'
                        }`}
                      >
                        {getSoundIcon(id, 'w-3.5 h-3.5')}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold truncate leading-none text-vibe-ink">
                            {snd.name}
                          </span>
                        </div>
                        <p className="text-[10px] truncate text-vibe-ink-muted mt-0.5 leading-tight">
                          {snd.themeVibe} {isThemePaired && '• (Active)'}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-vibe-accent flex-shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Slider with Mute Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-vibe-card-subtle/80 p-2 sm:p-2.5 rounded-xl border border-vibe-border-subtle overflow-hidden">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute ambient sound' : 'Mute ambient sound'}
              className="w-8 h-8 sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg text-vibe-ink-secondary hover:text-vibe-ink transition-colors flex-shrink-0 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Ambient background sound volume"
                className="w-full accent-vibe-accent h-1.5 rounded-lg cursor-pointer bg-vibe-border min-w-0"
              />
              <span className="font-mono text-[10px] text-vibe-ink-muted min-w-[28px] text-right flex-shrink-0">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>

          {/* Stream details note */}
          <div className="flex items-center justify-between text-[10px] text-vibe-ink-muted pt-1 flex-wrap gap-1">
            <span className="flex items-center gap-1.5 truncate min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="truncate">Gapless Web Audio stream</span>
            </span>
            <span className="font-mono flex-shrink-0">
              {activeTrack.id === 'deep-space' ? 'Cosmic 432Hz' : 'Natural Ambience'}
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
