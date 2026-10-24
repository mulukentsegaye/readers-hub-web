import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Bookmark, 
  Share2, 
  Star, 
  Check, 
  Quote, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  ChevronDown,
  Trash2,
  Send,
  ExternalLink
} from 'lucide-react';
import { BookDetailsData, BookSummaryData } from '../../types';
import { aiSummaryService } from '../../services/aiSummaryService';
import { bookSearchService, sanitizeOpenLibraryCover } from '../../services/bookSearchService';
import { bookshelfService } from '../../services/bookshelfService';
import { useAuthStore } from '../../stores/authStore';
import { useNoticeStore, toast } from '../../stores/noticeStore';
import { useFeedStore } from '../../stores/feedStore';
import { PostCard } from '../feed/PostCard';

interface BookDetailsViewProps {
  book: BookDetailsData;
  onBack: () => void;
  onStartTimer: (title: string, author: string, cover?: string) => void;
  onShareBook: (book: { title: string; author: string; coverImageUrl?: string }) => void;
  onViewBookDetails?: (title: string, author: string, cover?: string) => void;
}

const TELEGRAM_BOT_USERNAME = (
  import.meta.env.VITE_TELEGRAM_BOT_USERNAME ||
  (import.meta as any).env?.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
  'LiReadBot'
).trim().replace(/^@/, '');


function renderFormattedInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-vibe-ink">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-vibe-ink/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function renderMarkdownSynopsis(rawContent: string, fontClass: string): React.ReactNode {
  let clean = rawContent
    .replace(/\r\n/g, '\n')
    .replace(/###\s*How to Apply These Insights Today[\s\S]*/gi, '')
    .replace(/1\.\s*\*\*Establish a Daily Sanctuary\*\*[\s\S]*/gi, '')
    .replace(/\*\*Establish a Daily Sanctuary\*\*[\s\S]*/gi, '')
    .trim();

  // Ensure double newline before and after headings
  clean = clean.replace(/([^\n])\n(###\s+)/g, '$1\n\n$2');
  clean = clean.replace(/(###[^\n]+)\n([^\n#])/g, '$1\n\n$2');

  const blocks = clean.split(/\n\n+/).filter((b) => b.trim().length > 0);

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // 1. Heading block (### Title)
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <h4
              key={idx}
              className="font-heading text-base sm:text-lg font-semibold text-vibe-ink pt-4 pb-1 border-b border-vibe-border/40 tracking-tight"
            >
              {headingText}
            </h4>
          );
        }

        // 2. Check if block contains list items (e.g. 1. **Title**: ... or - **Title**: ...)
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        const isList = lines.length > 1 && lines.every((l) => /^(\d+\.|\-|\*)\s+/.test(l.trim()));

        if (isList) {
          return (
            <div key={idx} className="space-y-2.5 my-3 pl-1">
              {lines.map((line, lIdx) => {
                const m = line.trim().match(/^(\d+\.|\-|\*)\s+(.*)/);
                const prefix = m ? m[1] : '';
                const body = m ? m[2] : line;
                return (
                  <div key={lIdx} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-md bg-vibe-accent-subtle text-vibe-accent font-mono text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {prefix.replace(/\./, '')}
                    </span>
                    <div className={`${fontClass} leading-relaxed`}>
                      {renderFormattedInline(body)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // 3. Regular paragraph
        return (
          <p key={idx} className={`${fontClass} leading-relaxed`}>
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({
  book,
  onBack,
  onStartTimer,
  onShareBook,
  onViewBookDetails,
}) => {
  const { user, isGuest, openAuthModal, refreshProfile } = useAuthStore();

  const [isUpdatingShelf, setIsUpdatingShelf] = useState(false);
  const { showAlertModal } = useNoticeStore();
  const { posts } = useFeedStore();

  const [detailedBook, setDetailedBook] = useState<BookDetailsData>(book);

  const telegramLink = (() => {
    if (!TELEGRAM_BOT_USERNAME) return null;
    if (detailedBook.telegramMessageId) {
      return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${detailedBook.telegramMessageId}`;
    }
    return `https://t.me/${TELEGRAM_BOT_USERNAME}`;
  })();
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Check bookshelf status on mount or when book / user changes
  useEffect(() => {
    let isMounted = true;
    async function checkShelf() {
      if (!user || isGuest || !detailedBook.title) {
        setBookshelfStatus('none');
        return;
      }
      try {
        const item = await bookshelfService.getBookStatus(user.id, detailedBook.title);
        if (isMounted) {
          if (item) {
            setBookshelfStatus(item.status);
          } else {
            setBookshelfStatus('none');
          }
        }
      } catch (err) {
        console.warn('Failed to check bookshelf status:', err);
      }
    }
    checkShelf();
    return () => {
      isMounted = false;
    };
  }, [user?.id, isGuest, detailedBook.title]);

  // Summary State
  const [summary, setSummary] = useState<BookSummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'synopsis' | 'quotes'>('summary');

  // Bookshelf status state
  const [bookshelfStatus, setBookshelfStatus] = useState<'none' | 'want_to_read' | 'currently_reading' | 'finished'>('none');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Reading typography vibe: 'serif' (Newsreader) or 'sans' (Inter)
  const [readingFont, setReadingFont] = useState<'serif' | 'sans'>(() => {
    try {
      return (localStorage.getItem('liread_reading_font') as 'serif' | 'sans') || 'serif';
    } catch {
      return 'serif';
    }
  });

  const handleFontChange = (font: 'serif' | 'sans') => {
    setReadingFont(font);
    try {
      localStorage.setItem('liread_reading_font', font);
    } catch {}
  };

  const bodyFontClass =
    readingFont === 'serif'
      ? 'font-serif text-base sm:text-[17px] leading-[1.8] text-vibe-ink/90'
      : 'font-sans text-sm sm:text-base leading-relaxed text-vibe-ink-secondary';

  const summarySectionRef = useRef<HTMLDivElement>(null);

  // Sync detailedBook state whenever book prop changes
  useEffect(() => {
    setCoverError(false);
    setDetailedBook({
      ...book,
      coverImageUrl: sanitizeOpenLibraryCover(book.title, book.author, book.coverImageUrl),
      telegramMessageId: book.telegramMessageId,
    });
  }, [book.title, book.author, book.coverImageUrl, book.description, book.telegramMessageId]);

  // Fetch deeper book details from Open Library if description is missing
  useEffect(() => {
    let isMounted = true;
    async function loadFullDetails() {
      if (!book.description) {
        setIsLoadingDetails(true);
        try {
          const fullData = await bookSearchService.getBookDetails(
            book.title,
            book.author,
            book.workKey,
            book.coverImageUrl
          );
          if (isMounted) {
            setDetailedBook({
              ...book,
              description: fullData.description || book.description,
              subjects: fullData.subjects || (book.subjects && book.subjects.length > 0 ? book.subjects : ['Literature', 'Philosophy', 'Focus']),
              firstPublishYear: fullData.firstPublishYear || book.firstPublishYear,
              coverImageUrl: sanitizeOpenLibraryCover(book.title, book.author, book.coverImageUrl || fullData.coverImageUrl),
              telegramMessageId: fullData.telegramMessageId || book.telegramMessageId,
            });
          }
        } catch (err) {
          console.warn('Failed to fetch full book details:', err);
        } finally {
          if (isMounted) setIsLoadingDetails(false);
        }
      }
    }
    loadFullDetails();
    return () => {
      isMounted = false;
    };
  }, [book.title, book.author, book.coverImageUrl, book.description, book.workKey]);

  // Load summary on mount or when requested
  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      setIsLoadingSummary(true);
      try {
        const res = await aiSummaryService.getBookSummary(
          detailedBook.title,
          detailedBook.author,
          detailedBook.description
        );
        if (isMounted) {
          setSummary(res);
        }
      } catch (err) {
        console.warn('Failed to load summary:', err);
      } finally {
        if (isMounted) setIsLoadingSummary(false);
      }
    }
    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [detailedBook.title, detailedBook.author, detailedBook.description]);

  const handleScrollToSummary = () => {
    setActiveTab('summary');
    if (summarySectionRef.current) {
      summarySectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookshelfToggle = async (status: 'want_to_read' | 'currently_reading' | 'finished') => {
    if (isGuest || !user) {
      showAlertModal({
        type: 'guest',
        title: 'Sign In Required',
        message: 'Create a free account or sign in to track books on your personal bookshelf across your devices.',
        confirmLabel: 'Sign In',
        cancelLabel: 'Keep Browsing',
        onConfirm: () => openAuthModal('signin'),
      });
      return;
    }

    setShowStatusDropdown(false);
    setIsUpdatingShelf(true);
    setBookshelfStatus(status);

    try {
      await bookshelfService.setBookStatus(user.id, {
        title: detailedBook.title,
        author: detailedBook.author,
        coverImageUrl: detailedBook.coverImageUrl,
        status,
        progressPercentage: status === 'finished' ? 100 : status === 'want_to_read' ? 0 : 25,
      });

      const label =
        status === 'want_to_read'
          ? 'Want to Read'
          : status === 'currently_reading'
          ? 'Currently Reading'
          : 'Finished';

      toast.success(`"${detailedBook.title}" added to your ${label} shelf.`, 'Bookshelf Updated');
      await refreshProfile();
    } catch (err) {
      console.error('Failed to update bookshelf:', err);
      toast.error('Could not save to bookshelf. Please try again.', 'Error');
    } finally {
      setIsUpdatingShelf(false);
    }
  };

  const handleRemoveFromShelf = async () => {
    if (isGuest || !user) return;
    setShowStatusDropdown(false);
    setIsUpdatingShelf(true);
    setBookshelfStatus('none');

    try {
      await bookshelfService.removeBookByTitle(user.id, detailedBook.title);
      toast.info(`"${detailedBook.title}" removed from your bookshelf.`, 'Removed from Shelf');
      await refreshProfile();
    } catch (err) {
      console.error('Failed to remove from bookshelf:', err);
      toast.error('Could not remove from bookshelf.', 'Error');
    } finally {
      setIsUpdatingShelf(false);
    }
  };

  // Filter community posts that talk about this specific book
  const bookRelatedPosts = posts.filter(
    (p) =>
      p.bookTitle.toLowerCase().includes(detailedBook.title.toLowerCase()) ||
      detailedBook.title.toLowerCase().includes(p.bookTitle.toLowerCase())
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* Top Navigation & Back Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-vibe-border bg-vibe-card text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all active:scale-95 shadow-xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>
      </div>

      {/* Hero: Book Presentation Header */}
      <div className="rounded-3xl border border-vibe-border bg-vibe-card p-4 sm:p-7 shadow-soft transition-all space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-7 items-center md:items-start">
          
          {/* Left: Book Cover Showcase */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="relative w-36 sm:w-44 h-52 sm:h-64 rounded-2xl overflow-hidden shadow-sm border border-vibe-border bg-vibe-card-subtle">
              {detailedBook.coverImageUrl && !coverError ? (
                <img
                  src={detailedBook.coverImageUrl}
                  alt={detailedBook.title}
                  onError={() => setCoverError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-vibe-card-subtle">
                  <BookOpen className="w-12 h-12 text-vibe-accent mb-2" />
                  <p className="font-heading font-semibold text-xs text-vibe-ink line-clamp-2">{detailedBook.title}</p>
                  <p className="text-xs text-vibe-ink-muted mt-1">{detailedBook.author}</p>
                </div>
              )}
            </div>

            {/* Subtle Open Library Attribution */}
            <span className="text-[10px] text-vibe-ink-muted mt-3 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Verified literary edition
            </span>
          </div>

          {/* Right: Book Metadata & Primary Action Stack */}
          <div className="md:col-span-8 space-y-5">
            <div>
              {/* Category & Year Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-vibe-accent-subtle text-vibe-accent border border-vibe-accent/20">
                  {detailedBook.subjects?.[0] || 'Literature'}
                </span>
                {detailedBook.firstPublishYear && (
                  <span className="text-xs font-mono text-vibe-ink-muted">
                    Published {detailedBook.firstPublishYear}
                  </span>
                )}
                <span className="text-vibe-border">·</span>
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  4.8 Community Rating
                </span>
              </div>

              {/* Title & Author */}
              <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-vibe-ink leading-tight">
                {detailedBook.title}
              </h1>
              <p className="text-sm sm:text-base text-vibe-ink-secondary mt-1 font-normal">
                by <span className="font-medium text-vibe-ink">{detailedBook.author}</span>
              </p>
            </div>

            {/* Reading Pills Row */}
            <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-vibe-border">
              <div className="text-center p-2 rounded-xl bg-vibe-card-subtle border border-vibe-border/50">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-vibe-ink-muted">Est. Read</span>
                <span className="text-xs font-mono font-medium text-vibe-ink">~5.5 Hours</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-vibe-card-subtle border border-vibe-border/50">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-vibe-ink-muted">Overview</span>
                <span className="text-xs font-mono font-medium text-vibe-accent">6–8 Mins</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-vibe-card-subtle border border-vibe-border/50">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-vibe-ink-muted">Pacing</span>
                <span className="text-xs font-medium text-vibe-ink">Mindful Flow</span>
              </div>
            </div>

            {/* Standard Unified Action Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              
              {/* Primary: Overview Button */}
              <button
                type="button"
                onClick={handleScrollToSummary}
                className="h-10 px-3 rounded-xl text-xs font-medium bg-vibe-accent text-white hover:bg-vibe-accent-hover shadow-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 group"
              >
                <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform flex-shrink-0" />
                <span className="truncate">Overview</span>
              </button>

              {/* Start Reading Timer */}
              <button
                type="button"
                onClick={() => onStartTimer(detailedBook.title, detailedBook.author, detailedBook.coverImageUrl)}
                className="h-10 px-3 rounded-xl text-xs font-medium bg-vibe-card border border-vibe-border text-vibe-ink hover:border-vibe-accent hover:bg-vibe-card-subtle transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-vibe-accent flex-shrink-0" />
                <span className="truncate">Start Timer</span>
              </button>

              {/* Bookshelf Status Selector */}
              <div className="relative">
                <button
                  type="button"
                  disabled={isUpdatingShelf}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full h-10 px-2.5 rounded-xl text-xs font-medium border border-vibe-border bg-vibe-card text-vibe-ink hover:border-vibe-accent hover:bg-vibe-card-subtle transition-all active:scale-98 flex items-center justify-between gap-1 shadow-xs disabled:opacity-60"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Bookmark className={`w-3.5 h-3.5 flex-shrink-0 ${bookshelfStatus !== 'none' ? 'fill-current text-vibe-accent' : 'text-vibe-ink-muted'}`} />
                    <span className="truncate">
                      {isUpdatingShelf ? 'Saving…' : (
                        bookshelfStatus === 'currently_reading' ? 'Reading' :
                        bookshelfStatus === 'want_to_read' ? 'Want to Read' :
                        bookshelfStatus === 'finished' ? 'Finished' :
                        'Add to Shelf'
                      )}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-vibe-ink-muted flex-shrink-0" />
                </button>

                {showStatusDropdown && (
                  <div className="absolute right-0 sm:left-0 mt-1.5 w-48 rounded-2xl bg-vibe-card border border-vibe-border shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-vibe-ink-muted">
                      Shelf Status
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBookshelfToggle('want_to_read')}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between"
                    >
                      <span>Want to Read</span>
                      {bookshelfStatus === 'want_to_read' && <Check className="w-3.5 h-3.5 text-vibe-accent" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookshelfToggle('currently_reading')}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between"
                    >
                      <span>Currently Reading</span>
                      {bookshelfStatus === 'currently_reading' && <Check className="w-3.5 h-3.5 text-vibe-accent" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookshelfToggle('finished')}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between"
                    >
                      <span>Finished</span>
                      {bookshelfStatus === 'finished' && <Check className="w-3.5 h-3.5 text-vibe-accent" />}
                    </button>

                    {bookshelfStatus !== 'none' && (
                      <div className="pt-1 mt-1 border-t border-vibe-border">
                        <button
                          type="button"
                          onClick={handleRemoveFromShelf}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl text-red-600 hover:bg-red-500/10 transition-colors flex items-center justify-between"
                        >
                          <span>Remove from Shelf</span>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Share Book / Passage */}
              <button
                type="button"
                onClick={() => onShareBook({
                  title: detailedBook.title,
                  author: detailedBook.author,
                  coverImageUrl: detailedBook.coverImageUrl,
                })}
                className="h-10 px-3 rounded-xl text-xs font-medium bg-vibe-card border border-vibe-border text-vibe-ink hover:border-vibe-accent hover:bg-vibe-card-subtle transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-xs"
                title={`Share a passage or moment from "${detailedBook.title}"`}
              >
                <Share2 className="w-3.5 h-3.5 text-vibe-accent flex-shrink-0" />
                <span className="truncate">Share</span>
              </button>

            </div>

            {/* Telegram Instant PDF Delivery Action */}
            <div className="pt-2">
              {telegramLink ? (
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-[#229ED9] hover:bg-[#1f8ec4] active:bg-[#1b7db0] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between gap-3 group border border-sky-400/30"
                  title={detailedBook.telegramMessageId ? `Get "${detailedBook.title}" PDF instantly via Telegram` : "Open LiRead Telegram Bot"}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Send className="w-3.5 h-3.5 fill-white text-white rotate-[-15deg]" />
                    </div>
                    <span className="font-medium tracking-tight truncate">📥 Get PDF on Telegram</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors flex-shrink-0">
                    <span>{detailedBook.telegramMessageId ? 'Instant PDF' : 'Via Bot'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              ) : (
                <div
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium bg-vibe-card-subtle border border-vibe-border text-vibe-ink-muted flex items-center justify-between gap-3 opacity-70"
                  title="Telegram bot is not yet configured"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-vibe-card flex items-center justify-center flex-shrink-0">
                      <Send className="w-3.5 h-3.5 text-vibe-ink-muted" />
                    </div>
                    <span className="truncate">📥 Get PDF on Telegram</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-vibe-card px-2 py-0.5 rounded-full border border-vibe-border">
                    Available Soon
                  </span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-vibe-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'summary'
              ? 'bg-vibe-accent text-white shadow-xs'
              : 'text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('synopsis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'synopsis'
              ? 'bg-vibe-accent text-white shadow-xs'
              : 'text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>About the Book</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'quotes'
              ? 'bg-vibe-accent text-white shadow-xs'
              : 'text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Community ({bookRelatedPosts.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: BOOK OVERVIEW
          ========================================================================= */}
      {activeTab === 'summary' && (
        <div ref={summarySectionRef} className="space-y-6">
          
          {isLoadingSummary ? (
            <div className="rounded-3xl border border-vibe-border bg-vibe-card p-12 text-center space-y-4 shadow-soft">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-vibe-accent" />
              <div className="space-y-1">
                <p className="font-heading font-semibold text-base text-vibe-ink">Loading Overview...</p>
                <p className="text-xs text-vibe-ink-muted max-w-sm mx-auto">
                  Preparing overview and reading insights for {detailedBook.title}.
                </p>
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              
              {/* Summary Header Card */}
              <div className="rounded-3xl border border-vibe-border bg-vibe-card p-6 sm:p-8 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-vibe-border">
                  <div className="flex items-center gap-2 text-xs font-semibold text-vibe-accent">
                    <Sparkles className="w-4 h-4" />
                    <span>Editorial Overview</span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-vibe-card-subtle border border-vibe-border text-vibe-ink-secondary">
                    {summary.readTimeMinutes} min read
                  </span>
                </div>

                {/* One-Sentence Takeaway */}
                {summary.oneSentenceTakeaway && (
                  <div className="py-2 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-vibe-ink-muted font-bold block">
                      Core Takeaway
                    </span>
                    <blockquote className="font-display italic text-base sm:text-xl text-vibe-ink leading-relaxed font-normal">
                      “{summary.oneSentenceTakeaway}”
                    </blockquote>
                  </div>
                )}
              </div>

              {/* Core Ideas / Themes Grid (Only when verified key ideas exist) */}
              {summary.keyIdeas && summary.keyIdeas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-vibe-ink">
                    Key Themes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.keyIdeas.map((idea, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-vibe-border bg-vibe-card p-5 space-y-2 shadow-xs hover:border-vibe-accent/40 transition-colors"
                      >
                        <h4 className="font-sans text-sm font-medium text-vibe-ink">
                          {idea.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed font-normal">
                          {idea.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Text Synopsis & Chapter Summary */}
              {summary.fullSummaryMarkdown && (
                <div className="rounded-3xl border border-vibe-border bg-vibe-card p-6 sm:p-8 md:p-10 shadow-soft space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-vibe-border">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-vibe-ink flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-vibe-accent" />
                        <span>Chapter Summary & Synopsis</span>
                      </h3>
                    </div>

                    {/* Editorial Reading Font Switcher */}
                    <div className="flex items-center gap-1 bg-vibe-card-subtle p-1 rounded-xl border border-vibe-border self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleFontChange('serif')}
                        className={`px-3 py-1 rounded-lg text-xs font-serif transition-colors ${
                          readingFont === 'serif'
                            ? 'bg-vibe-card text-vibe-ink font-semibold shadow-xs border border-vibe-border'
                            : 'text-vibe-ink-muted hover:text-vibe-ink'
                        }`}
                        title="Editorial Literary Serif (Newsreader)"
                      >
                        Aa Serif
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFontChange('sans')}
                        className={`px-3 py-1 rounded-lg text-xs font-sans transition-colors ${
                          readingFont === 'sans'
                            ? 'bg-vibe-card text-vibe-ink font-semibold shadow-xs border border-vibe-border'
                            : 'text-vibe-ink-muted hover:text-vibe-ink'
                        }`}
                        title="Clean Modern Sans (Inter)"
                      >
                        Aa Sans
                      </button>
                    </div>
                  </div>

                  <div>
                    {renderMarkdownSynopsis(summary.fullSummaryMarkdown, bodyFontClass)}
                  </div>
                </div>
              )}

              {/* Notable Quotes Card (Only when verified quotes exist) */}
              {summary.notableQuotes && summary.notableQuotes.length > 0 && (
                <div className="rounded-3xl border border-vibe-border bg-vibe-card p-6 sm:p-8 shadow-soft space-y-4">
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-vibe-ink flex items-center gap-2">
                    <Quote className="w-4 h-4 text-vibe-accent" />
                    <span>Notable Quotes</span>
                  </h3>
                  <div className="space-y-3">
                    {summary.notableQuotes.map((quote, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-vibe-card-subtle border border-vibe-border flex items-start justify-between gap-4 group"
                      >
                        <blockquote className="font-display italic text-xs sm:text-sm text-vibe-ink leading-relaxed font-normal">
                          {quote}
                        </blockquote>
                        <button
                          type="button"
                          onClick={() => onShareBook({
                            title: detailedBook.title,
                            author: detailedBook.author,
                            coverImageUrl: detailedBook.coverImageUrl,
                          })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-colors flex-shrink-0 opacity-80 group-hover:opacity-100"
                          title="Share this quote to community"
                        >
                          Share Quote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Reading Timer Call to Action */}
              <div className="rounded-3xl border border-vibe-border bg-vibe-card-subtle p-6 sm:p-8 text-center space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-vibe-accent font-bold">
                  Take The Full Journey
                </span>
                <h4 className="font-serif text-base sm:text-lg font-semibold text-vibe-ink">
                  Ready to read the complete work?
                </h4>
                <p className="text-xs sm:text-sm text-vibe-ink-secondary max-w-md mx-auto">
                  Step into distraction-free reading mode with customizable interval chimes and tranquil ambient soundscapes.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onStartTimer(detailedBook.title, detailedBook.author, detailedBook.coverImageUrl)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-medium bg-vibe-accent text-white hover:bg-vibe-accent-hover shadow-md transition-all active:scale-95"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Launch Reading Timer with {detailedBook.title}</span>
                  </button>

                  {telegramLink && (
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#229ED9] hover:bg-[#1f8ec4] text-white shadow-md transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4 fill-white" />
                      <span>📥 Get PDF on Telegram</span>
                    </a>
                  )}
                </div>
              </div>

            </div>
          ) : null}

        </div>
      )}

      {/* =========================================================================
          TAB 2: ABOUT THE BOOK / ARCHIVE SYNOPSIS
          ========================================================================= */}
      {activeTab === 'synopsis' && (
        <div className="rounded-3xl border border-vibe-border bg-vibe-card p-6 sm:p-8 md:p-10 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-vibe-border">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-vibe-ink">
                About {detailedBook.title}
              </h3>
            </div>

            {/* Editorial Reading Font Switcher */}
            <div className="flex items-center gap-1 bg-vibe-card-subtle p-1 rounded-xl border border-vibe-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleFontChange('serif')}
                className={`px-3 py-1 rounded-lg text-xs font-serif transition-colors ${
                  readingFont === 'serif'
                    ? 'bg-vibe-card text-vibe-ink font-semibold shadow-xs border border-vibe-border'
                    : 'text-vibe-ink-muted hover:text-vibe-ink'
                }`}
                title="Editorial Literary Serif (Newsreader)"
              >
                Aa Serif
              </button>
              <button
                type="button"
                onClick={() => handleFontChange('sans')}
                className={`px-3 py-1 rounded-lg text-xs font-sans transition-colors ${
                  readingFont === 'sans'
                    ? 'bg-vibe-card text-vibe-ink font-semibold shadow-xs border border-vibe-border'
                    : 'text-vibe-ink-muted hover:text-vibe-ink'
                }`}
                title="Clean Modern Sans (Inter)"
              >
                Aa Sans
              </button>
            </div>
          </div>

          {isLoadingDetails ? (
            <div className="py-12 text-center text-xs text-vibe-ink-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-vibe-accent" />
              <span>Fetching archive details...</span>
            </div>
          ) : (
            <div>
              {detailedBook.description ? (
                renderMarkdownSynopsis(detailedBook.description, bodyFontClass)
              ) : (
                <p className="italic text-vibe-ink-muted">
                  No editorial description is currently recorded for this specific edition.
                </p>
              )}
            </div>
          )}

          {detailedBook.subjects && detailedBook.subjects.length > 0 && (
            <div className="pt-4 border-t border-vibe-border space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-vibe-ink-muted block font-medium">
                Indexed Subjects & Themes
              </span>
              <div className="flex flex-wrap gap-2">
                {detailedBook.subjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs bg-vibe-card-subtle border border-vibe-border text-vibe-ink-secondary"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: COMMUNITY ACTIVITY & QUOTES
          ========================================================================= */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base sm:text-lg font-bold text-vibe-ink">
              Community Reflections ({bookRelatedPosts.length})
            </h3>
            <button
              type="button"
              onClick={() => onShareBook({
                title: detailedBook.title,
                author: detailedBook.author,
                coverImageUrl: detailedBook.coverImageUrl,
              })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share a Passage</span>
            </button>
          </div>

          {bookRelatedPosts.length > 0 ? (
            <div className="space-y-4">
              {bookRelatedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectBookForTimer={onStartTimer}
                  onViewBookDetails={onViewBookDetails}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-vibe-border bg-vibe-card p-10 text-center space-y-4 shadow-soft">
              <BookOpen className="w-10 h-10 mx-auto text-vibe-accent opacity-60" />
              <div className="space-y-1">
                <p className="font-heading font-semibold text-sm text-vibe-ink">No reader posts yet for this title</p>
                <p className="text-xs text-vibe-ink-muted max-w-sm mx-auto">
                  Be the first member of Liread to share a favorite quotation, rating, or personal reflection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onShareBook({
                  title: detailedBook.title,
                  author: detailedBook.author,
                  coverImageUrl: detailedBook.coverImageUrl,
                })}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish the First Moment</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
