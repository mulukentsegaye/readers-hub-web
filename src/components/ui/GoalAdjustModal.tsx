import React, { useState, useEffect } from 'react';
import { Target, Clock, X, Plus, Minus, Check } from 'lucide-react';
import { useNoticeStore, toast } from '../../stores/noticeStore';

const PRESET_MINUTES = [15, 30, 45, 60, 90, 120];

export const GoalAdjustModal: React.FC = () => {
  const { goalModal, closeGoalModal } = useNoticeStore();
  const [minutes, setMinutes] = useState(60);

  useEffect(() => {
    if (goalModal?.isOpen) {
      setMinutes(goalModal.initialMinutes || 60);
    }
  }, [goalModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && goalModal?.isOpen) {
        closeGoalModal();
      }
    };
    if (goalModal?.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goalModal, closeGoalModal]);

  if (!goalModal?.isOpen) return null;

  const handleAdjust = (delta: number) => {
    setMinutes((prev) => Math.max(5, Math.min(480, prev + delta)));
  };

  const handleSave = () => {
    const finalMinutes = Math.max(5, Math.min(480, minutes));
    if (goalModal.onSave) {
      goalModal.onSave(finalMinutes);
    }
    toast.success(`Daily reading goal set to ${finalMinutes} minutes per day.`, 'Goal Updated');
    closeGoalModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={closeGoalModal}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-vibe-card border border-vibe-border shadow-2xl p-6 sm:p-7 max-h-[92dvh] overflow-y-auto overscroll-contain transition-all duration-300 celebration-toast-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeGoalModal}
          aria-label="Close dialog"
          className="absolute top-4.5 right-4.5 w-8 h-8 rounded-full text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          {/* Target Icon */}
          <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3.5 shadow-md">
            <Target className="w-6.5 h-6.5 text-amber-200 fill-amber-200/30" />
          </div>

          <h3
            id="goal-modal-title"
            className="font-heading text-xl font-bold text-vibe-ink tracking-tight mb-1"
          >
            Adjust Daily Reading Goal
          </h3>
          <p className="text-xs text-vibe-ink-secondary mb-5">
            How many mindful minutes would you like to read each day?
          </p>

          {/* Stepper Display */}
          <div className="w-full bg-vibe-card-subtle border border-vibe-border rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleAdjust(-5)}
                disabled={minutes <= 5}
                aria-label="Decrease by 5 minutes"
                className="w-9 h-9 rounded-xl bg-vibe-card border border-vibe-border text-vibe-ink hover:bg-vibe-card-hover disabled:opacity-40 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center min-w-[120px]">
                <div className="font-mono text-3xl font-extrabold text-vibe-accent tracking-tight">
                  {minutes}
                </div>
                <div className="text-[11px] font-medium text-vibe-ink-muted uppercase tracking-wider mt-0.5">
                  Minutes / Day
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdjust(5)}
                disabled={minutes >= 480}
                aria-label="Increase by 5 minutes"
                className="w-9 h-9 rounded-xl bg-vibe-card border border-vibe-border text-vibe-ink hover:bg-vibe-card-hover disabled:opacity-40 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Adjustment Steppers (-15, +15) */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-vibe-border/60">
              <button
                type="button"
                onClick={() => handleAdjust(-15)}
                disabled={minutes <= 15}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card transition-colors disabled:opacity-40"
              >
                -15m
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(15)}
                disabled={minutes >= 465}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card transition-colors disabled:opacity-40"
              >
                +15m
              </button>
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div className="w-full mb-6">
            <div className="text-[11px] font-medium text-vibe-ink-muted uppercase tracking-wider mb-2 text-left">
              Quick presets
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_MINUTES.map((preset) => {
                const isActive = minutes === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinutes(preset)}
                    className={`py-2 px-1 text-xs font-mono font-semibold rounded-xl border transition-all ${
                      isActive
                        ? 'bg-vibe-accent text-white border-vibe-accent shadow-xs'
                        : 'bg-vibe-card text-vibe-ink border-vibe-border hover:border-vibe-accent/50 hover:bg-vibe-card-subtle'
                    }`}
                  >
                    {preset}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={closeGoalModal}
              className="flex-1 px-4 py-2.5 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-hover text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-vibe-accent hover:bg-vibe-accent-hover text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save Goal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
