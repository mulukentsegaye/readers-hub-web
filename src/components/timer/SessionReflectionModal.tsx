import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bookmark,
  Share2,
  X,
  Flame,
  Check,
  Compass,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useReflectionStore } from '../../stores/reflectionStore';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedStore';
import { toast } from '../../stores/noticeStore';
import { sanctuaryService } from '../../services/sanctuaryService';

export const SessionReflectionModal: React.FC = () => {
  const { isOpen, sessionMinutes, bookTitle, bookAuthor, closeReflection } = useReflectionStore();
  const { user } = useAuthStore();
  const { addPost } = useFeedStore();

  const [insightText, setInsightText] = useState('');
  const [applicationText, setApplicationText] = useState('');
  const [showApplicationField, setShowApplicationField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form whenever opened
  useEffect(() => {
    if (isOpen) {
      setInsightText('');
      setApplicationText('');
      setShowApplicationField(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape closes cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeReflection();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeReflection]);

  if (!isOpen) return null;

  const handleSavePrivately = () => {
    if (!insightText.trim()) {
      toast.info('Session recorded. No note was added.', 'Session Saved');
      closeReflection();
      return;
    }

    sanctuaryService.savePrivateInsight({
      userId: user?.id,
      bookTitle,
      bookAuthor,
      quoteOrInsight: insightText.trim(),
      actionableApplication: applicationText.trim() || undefined,
    });

    toast.success('Your takeaway has been saved privately to Saved Passages.', 'Saved to Private Notes');
    closeReflection();
  };

  const handlePublishToCommunity = async () => {
    if (!insightText.trim()) {
      toast.warning('Please enter a quote or takeaway before sharing with the community.', 'Note Required');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPost(
        {
          bookTitle,
          bookAuthor: bookAuthor || 'Unknown Author',
          quoteText: insightText.trim(),
          recommendationText: applicationText.trim() || undefined,
          tag: applicationText.trim() ? 'Application' : 'Wisdom',
          postType: 'passage',
        },
        user?.id
      );
      toast.success('Your wisdom note is now live on the Community Feed.', 'Insight Published');
      closeReflection();
    } catch {
      toast.error('Could not publish insight at this time.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflection-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeReflection}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-vibe-card border border-vibe-border shadow-2xl p-5 sm:p-7 max-h-[92dvh] overflow-y-auto overscroll-contain transition-all duration-300 celebration-toast-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-vibe-accent" />

        {/* Close / Skip Button */}
        <button
          type="button"
          onClick={closeReflection}
          aria-label="Skip reflection"
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle flex items-center justify-center transition-colors cursor-pointer"
          title="Skip reflection"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Session Milestone */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Session Complete
            </span>
            <span className="text-[11px] font-mono text-vibe-ink-muted">
              +{sessionMinutes} {sessionMinutes === 1 ? 'min' : 'mins'} logged
            </span>
          </div>

          <div>
            <h3
              id="reflection-modal-title"
              className="font-heading text-lg sm:text-xl font-bold text-vibe-ink tracking-tight leading-snug"
            >
              What is one takeaway worth keeping?
            </h3>
            <p className="text-xs text-vibe-ink-secondary mt-1">
              From <span className="font-semibold text-vibe-ink">"{bookTitle}"</span>. Reading is about rhythm, comprehension, and wisdom.
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3.5">
          {/* Main Quote / Insight Input */}
          <div>
            <label htmlFor="reflection-text" className="block text-xs font-medium text-vibe-ink mb-1.5">
              Quote or Key Insight
            </label>
            <textarea
              id="reflection-text"
              rows={3}
              value={insightText}
              onChange={(e) => setInsightText(e.target.value)}
              placeholder="A memorable line, an unexpected concept, or a mental model you want to remember..."
              className="w-full text-xs sm:text-sm p-3 sm:p-3.5 rounded-2xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:bg-vibe-card focus:outline-none transition-all resize-none leading-relaxed"
              autoFocus
            />
          </div>

          {/* Optional: "How I'm Applying This" (Non-Fiction) */}
          <div>
            {!showApplicationField ? (
              <button
                type="button"
                onClick={() => setShowApplicationField(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-vibe-accent hover:text-vibe-accent-hover hover:underline transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>+ Add "How I'm Applying This" tag (Non-fiction action)</span>
              </button>
            ) : (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label htmlFor="application-text" className="text-xs font-medium text-vibe-ink flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-vibe-accent" />
                    <span>How I'm Applying This</span>
                    <span className="text-[10px] font-mono text-vibe-ink-muted">(Practical Action)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplicationField(false);
                      setApplicationText('');
                    }}
                    className="text-[11px] text-vibe-ink-muted hover:text-vibe-ink"
                  >
                    Remove
                  </button>
                </div>
                <input
                  id="application-text"
                  type="text"
                  value={applicationText}
                  onChange={(e) => setApplicationText(e.target.value)}
                  placeholder="e.g. Setting a 15-minute phone-free morning routine before opening email..."
                  className="w-full text-xs p-2.5 sm:p-3 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:bg-vibe-card focus:outline-none transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-vibe-border flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={closeReflection}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-vibe-ink-muted hover:text-vibe-ink rounded-xl hover:bg-vibe-card-subtle transition-colors cursor-pointer text-center"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSavePrivately}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-vibe-border bg-vibe-card-subtle hover:bg-vibe-card text-vibe-ink text-xs font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Save privately to your notes"
            >
              <Bookmark className="w-3.5 h-3.5 text-vibe-ink-muted" />
              <span>Save Privately</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !insightText.trim()}
              onClick={handlePublishToCommunity}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-vibe-accent hover:bg-vibe-accent-hover disabled:opacity-50 text-white text-xs font-medium shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Publish as an Insight Card to Community Feed"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Publish to Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
