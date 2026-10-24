import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  Play, 
  ArrowLeft, 
  Check, 
  Trash2, 
  MoreVertical, 
  Compass, 
  Sparkles,
  ChevronDown 
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedStore';
import { useTimerStore } from '../../stores/timerStore';
import { bookshelfService, BookshelfItem } from '../../services/bookshelfService';
import { sanitizeOpenLibraryCover } from '../../services/bookSearchService';
import { toast } from '../../stores/noticeStore';

interface BookshelfViewProps {
  initialTab?: 'bookshelf' | 'saved';
  onBack?: () => void;
  onViewBookDetails?: (title: string, author: string, cover?: string) => void;
  onExploreClick?: () => void;
}

interface BookshelfCoverCardProps {
  title: string;
  author: string;
  coverUrl?: string;
  status: string;
  statusCode: 'want_to_read' | 'currently_reading' | 'finished';
}

const BookshelfCoverCard: React.FC<BookshelfCoverCardProps> = ({
  title,
  author,
  coverUrl,
  status,
  statusCode,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isReading = statusCode === 'currently_reading';
  const isFinished = statusCode === 'finished';

  const palette = React.useMemo(() => {
    const styles = [
      { bg: 'bg-stone-900', border: 'border-stone-700/50', foil: 'text-stone-300' },
      { bg: 'bg-zinc-900', border: 'border-zinc-700/50', foil: 'text-zinc-300' },
      { bg: 'bg-neutral-900', border: 'border-neutral-700/50', foil: 'text-neutral-300' },
      { bg: 'bg-slate-900', border: 'border-slate-700/50', foil: 'text-slate-300' },
      { bg: 'bg-stone-950', border: 'border-stone-800/60', foil: 'text-amber-200/80' },
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = (hash << 5) - hash + title.charCodeAt(i);
    return styles[Math.abs(hash) % styles.length];
  }, [title]);

  return (
    <div className="relative aspect-[2/3] w-full max-w-[220px] sm:max-w-none mx-auto rounded-xl overflow-hidden mb-3.5 border border-vibe-border/60 bg-vibe-card-subtle shadow-sm flex items-center justify-center">
      {coverUrl && !hasError ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-vibe-border/30 animate-pulse flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-vibe-ink-muted/50" />
            </div>
          )}
          <img 
            src={coverUrl} 
            alt={title} 
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`} 
          />
          {/* Subtle spine shadow along the left edge for book realism */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-white/5 to-transparent pointer-events-none" />
        </>
      ) : (
        <div className={`relative w-full h-full p-4 flex flex-col justify-between ${palette.bg} border ${palette.border} select-none`}>
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/60 via-white/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-white/50 pl-1">
            <span>Liread</span>
            <BookOpen className={`w-3.5 h-3.5 ${palette.foil}`} />
          </div>
          <div className="space-y-1 pl-1 my-auto">
            <span className="font-heading font-bold text-white text-sm line-clamp-3 leading-snug drop-shadow-xs">
              {title}
            </span>
            <span className="text-[11px] text-white/70 block line-clamp-1">
              {author}
            </span>
          </div>
          <div className="pl-1 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/40">
            <span>Bookshelf</span>
            <span className="font-serif italic text-white/60">Edition</span>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs flex items-center gap-1 ${
          isReading 
            ? 'bg-amber-600/90 text-white' 
            : isFinished 
            ? 'bg-emerald-600/90 text-white' 
            : 'bg-vibe-accent/90 text-white'
        }`}>
          {isFinished && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          {status}
        </span>
      </div>
    </div>
  );
};

export const BookshelfView: React.FC<BookshelfViewProps> = ({ 
  initialTab = 'bookshelf', 
  onBack, 
  onViewBookDetails,
  onExploreClick 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bookshelf' | 'saved'>(initialTab);
  const [shelfFilter, setShelfFilter] = useState<'all' | 'want_to_read' | 'currently_reading' | 'finished'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const { user, isGuest, refreshProfile } = useAuthStore();
  const { posts } = useFeedStore();
  const { prepareTimerForBook } = useTimerStore();
  const [dbBooks, setDbBooks] = useState<BookshelfItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load books on mount / user change
  useEffect(() => {
    if (!user || isGuest) { 
      setDbBooks([]); 
      return; 
    }
    setLoading(true);
    bookshelfService.getBookshelf(user.id)
      .then((items) => setDbBooks(items || []))
      .catch((err) => console.warn('Could not load bookshelf:', err))
      .finally(() => setLoading(false));
  }, [user?.id, isGuest]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const savedPosts = posts.filter((p) => p.isSaved);

  const demoBooks = [
    {
      id: 'demo-1',
      title: 'The Creative Act: A Way of Being',
      author: 'Rick Rubin',
      progress: 68,
      status: 'Currently Reading',
      statusCode: 'currently_reading' as const,
      coverUrl: 'https://covers.openlibrary.org/b/id/13316390-L.jpg',
    },
    {
      id: 'demo-2',
      title: 'Atomic Habits',
      author: 'James Clear',
      progress: 100,
      status: 'Finished',
      statusCode: 'finished' as const,
      coverUrl: 'https://covers.openlibrary.org/b/id/12539702-L.jpg',
    },
    {
      id: 'demo-3',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      progress: 42,
      status: 'Currently Reading',
      statusCode: 'currently_reading' as const,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780812968255-L.jpg',
    },
  ];

  const mappedBooks = dbBooks.length > 0 ? dbBooks.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    progress: b.progressPercentage,
    status: b.status === 'currently_reading' ? 'Currently Reading' : b.status === 'finished' ? 'Finished' : 'Want to Read',
    statusCode: b.status,
    coverUrl: sanitizeOpenLibraryCover(b.title, b.author, b.coverImageUrl) || '',
  })) : (isGuest ? demoBooks : []);

  // Shelf category counts
  const countAll = mappedBooks.length;
  const countWant = mappedBooks.filter((b) => b.statusCode === 'want_to_read').length;
  const countReading = mappedBooks.filter((b) => b.statusCode === 'currently_reading').length;
  const countFinished = mappedBooks.filter((b) => b.statusCode === 'finished').length;

  const displayedBooks = mappedBooks.filter((b) => {
    if (shelfFilter === 'all') return true;
    return b.statusCode === shelfFilter;
  });

  const handleStartTimerForBook = (title: string, author: string, cover?: string) => {
    prepareTimerForBook(title, author, cover);
  };

  const handleUpdateStatus = async (
    e: React.MouseEvent,
    item: { id: string; title: string; author: string; coverUrl?: string },
    newStatus: 'want_to_read' | 'currently_reading' | 'finished'
  ) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (!user || isGuest) return;

    try {
      await bookshelfService.setBookStatus(user.id, {
        title: item.title,
        author: item.author,
        coverImageUrl: item.coverUrl,
        status: newStatus,
        progressPercentage: newStatus === 'finished' ? 100 : newStatus === 'want_to_read' ? 0 : 25,
      });

      const updated = await bookshelfService.getBookshelf(user.id);
      setDbBooks(updated);
      refreshProfile();
      toast.success(
        `Moved to ${newStatus === 'want_to_read' ? 'Want to Read' : newStatus === 'currently_reading' ? 'Currently Reading' : 'Finished'}.`,
        'Shelf Updated'
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to update shelf status.');
    }
  };

  const handleRemoveBook = async (e: React.MouseEvent, bookId: string, title: string) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (!user || isGuest) return;

    try {
      await bookshelfService.removeBook(user.id, bookId);
      setDbBooks((prev) => prev.filter((b) => b.id !== bookId));
      refreshProfile();
      toast.info(`"${title}" was removed from your bookshelf.`, 'Book Removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove book from bookshelf.');
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-16">
      <div className="space-y-4">
        {onBack && (
          <button 
            type="button" 
            onClick={onBack} 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vibe-card border border-vibe-border text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink transition-colors group shadow-soft" 
            aria-label="Back to feed"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Feed</span>
          </button>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-vibe-accent" />
              <span className="font-sans text-[10.5px] font-medium tracking-wider uppercase text-vibe-ink-muted/80">
                Personal Library
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-vibe-ink leading-tight">
              {activeSubTab === 'bookshelf' ? 'My Bookshelf' : 'Saved Passages'}
            </h1>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full border border-vibe-border bg-vibe-card-subtle">
            <button 
              onClick={() => setActiveSubTab('bookshelf')} 
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeSubTab === 'bookshelf' 
                  ? 'bg-vibe-card text-vibe-accent font-medium shadow-xs border border-vibe-border' 
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Bookshelf ({mappedBooks.length})</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('saved')} 
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeSubTab === 'saved' 
                  ? 'bg-vibe-card text-vibe-accent font-medium shadow-xs border border-vibe-border' 
                  : 'text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedPosts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {isGuest && activeSubTab === 'bookshelf' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>Guest mode active. Books added will be saved permanently once you sign in.</span>
        </div>
      )}

      {activeSubTab === 'bookshelf' ? (
        <div className="space-y-6">
          {/* Bookshelf Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setShelfFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                shelfFilter === 'all'
                  ? 'bg-vibe-ink text-vibe-card shadow-xs'
                  : 'bg-vibe-card border border-vibe-border text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle'
              }`}
            >
              <span>All Books</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${shelfFilter === 'all' ? 'bg-white/20 text-white' : 'bg-vibe-card-subtle text-vibe-ink-muted'}`}>
                {countAll}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShelfFilter('want_to_read')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                shelfFilter === 'want_to_read'
                  ? 'bg-vibe-accent text-white shadow-xs'
                  : 'bg-vibe-card border border-vibe-border text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle'
              }`}
            >
              <span>Want to Read</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${shelfFilter === 'want_to_read' ? 'bg-white/20 text-white' : 'bg-vibe-card-subtle text-vibe-ink-muted'}`}>
                {countWant}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShelfFilter('currently_reading')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                shelfFilter === 'currently_reading'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-vibe-card border border-vibe-border text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle'
              }`}
            >
              <span>Currently Reading</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${shelfFilter === 'currently_reading' ? 'bg-white/20 text-white' : 'bg-vibe-card-subtle text-vibe-ink-muted'}`}>
                {countReading}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShelfFilter('finished')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                shelfFilter === 'finished'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-vibe-card border border-vibe-border text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle'
              }`}
            >
              <span>Finished</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${shelfFilter === 'finished' ? 'bg-white/20 text-white' : 'bg-vibe-card-subtle text-vibe-ink-muted'}`}>
                {countFinished}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-vibe-ink-muted animate-pulse">
              Syncing your personal library…
            </div>
          ) : displayedBooks.length === 0 ? (
            <div className="rounded-3xl p-10 sm:p-14 text-center border border-vibe-border bg-vibe-card space-y-4 shadow-soft max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold text-vibe-ink">
                  {shelfFilter === 'want_to_read'
                    ? 'No books in "Want to Read"'
                    : shelfFilter === 'currently_reading'
                    ? 'No books in "Currently Reading"'
                    : shelfFilter === 'finished'
                    ? 'No finished books yet'
                    : 'Your bookshelf is empty'}
                </h3>
                <p className="text-xs text-vibe-ink-muted leading-relaxed max-w-sm mx-auto">
                  {shelfFilter === 'want_to_read'
                    ? 'Click "Want to Read" on any book details page to queue up your next literary adventures.'
                    : shelfFilter === 'all'
                    ? 'Books you track or add to your wishlists will appear here automatically across all your devices.'
                    : 'Change book statuses or start a reading session with the timer to update this shelf.'}
                </p>
              </div>

              {onExploreClick && (
                <button
                  type="button"
                  onClick={onExploreClick}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vibe-accent text-white text-xs font-semibold hover:bg-vibe-accent-hover transition-all active:scale-95 shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore Books</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {displayedBooks.map((b) => {
                const isFinished = b.statusCode === 'finished';
                const isReading = b.statusCode === 'currently_reading';
                const isWantToRead = b.statusCode === 'want_to_read';
                const isMenuOpen = activeMenuId === b.id;

                return (
                  <div 
                    key={b.id} 
                    className="bg-vibe-card border border-vibe-border rounded-2xl p-3 sm:p-4 shadow-soft flex flex-col justify-between hover:shadow-float transition-shadow duration-200 group relative"
                  >
                    {/* Book Cover Presentation */}
                    <div className="relative mb-2.5 sm:mb-3.5 group/cover">
                      <BookshelfCoverCard
                        title={b.title}
                        author={b.author}
                        coverUrl={b.coverUrl}
                        status={b.status}
                        statusCode={b.statusCode}
                      />

                      {/* Quick Actions Dropdown Button */}
                      {!isGuest && (
                        <div className="absolute top-2.5 right-2.5 z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : b.id);
                            }}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95 shadow-xs cursor-pointer"
                            title="Manage Book"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div 
                              onClick={(e) => e.stopPropagation()} 
                              className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-vibe-card border border-vibe-border shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-vibe-ink-muted">
                                Move Status
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleUpdateStatus(e, b, 'want_to_read')}
                                className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>Want to Read</span>
                                {isWantToRead && <Check className="w-3.5 h-3.5 text-vibe-accent" />}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleUpdateStatus(e, b, 'currently_reading')}
                                className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>Currently Reading</span>
                                {isReading && <Check className="w-3.5 h-3.5 text-vibe-accent" />}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleUpdateStatus(e, b, 'finished')}
                                className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>Finished</span>
                                {isFinished && <Check className="w-3.5 h-3.5 text-vibe-accent" />}
                              </button>

                              <div className="pt-1 mt-1 border-t border-vibe-border">
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveBook(e, b.id, b.title)}
                                  className="w-full text-left px-3 py-1.5 text-xs rounded-xl text-red-600 hover:bg-red-500/10 transition-colors flex items-center justify-between cursor-pointer"
                                >
                                  <span>Remove</span>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Click overlay to view details */}
                      <button 
                        onClick={() => onViewBookDetails?.(b.title, b.author, b.coverUrl)} 
                        className="absolute inset-0 cursor-pointer" 
                        title={`View "${b.title}" details`}
                      />
                    </div>

                    {/* Meta & Actions */}
                    <div className="space-y-2.5 sm:space-y-3">
                      <div>
                        <h3
                          onClick={() => onViewBookDetails?.(b.title, b.author, b.coverUrl)}
                          className="font-heading text-xs sm:text-base font-semibold text-vibe-ink line-clamp-1 group-hover:text-vibe-accent transition-colors cursor-pointer hover:underline leading-snug"
                          title={`View book info and overview for "${b.title}"`}
                        >
                          {b.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-vibe-ink-muted mt-0.5 line-clamp-1">{b.author}</p>
                      </div>

                      {/* Reading Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] sm:text-xs text-vibe-ink-muted">
                          <span className="font-medium text-vibe-ink-secondary">Progress</span>
                          <span className="font-mono font-semibold text-vibe-ink">{b.progress}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5 bg-vibe-card-subtle overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              isFinished ? 'bg-emerald-500' : isReading ? 'bg-amber-500' : 'bg-vibe-accent'
                            }`} 
                            style={{ width: `${b.progress}%` }} 
                          />
                        </div>
                      </div>

                      {/* Card Button */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button 
                          onClick={() => handleStartTimerForBook(b.title, b.author, b.coverUrl)} 
                          className="py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-vibe-accent hover:bg-vibe-accent-hover text-white transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-xs truncate cursor-pointer"
                        >
                          <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current flex-shrink-0" />
                          <span className="truncate">{isFinished ? 'Re-read' : 'Read'}</span>
                        </button>

                        <button
                          onClick={() => onViewBookDetails?.(b.title, b.author, b.coverUrl)}
                          className="py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-[10px] sm:text-xs font-medium bg-vibe-card-subtle hover:bg-vibe-card text-vibe-ink border border-vibe-border hover:border-vibe-accent transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-xs truncate cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-vibe-accent flex-shrink-0" />
                          <span className="truncate">Overview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.length === 0 ? (
            <div className="rounded-3xl p-12 text-center border border-vibe-border bg-vibe-card space-y-3 shadow-soft max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-vibe-ink">No saved passages yet</h3>
              <p className="text-xs text-vibe-ink-muted leading-relaxed">
                Click the bookmark icon on any quote in your Discover Feed to collect your favorite literary passages here.
              </p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div 
                key={post.id} 
                className="bg-vibe-card border border-vibe-border rounded-2xl p-5 sm:p-6 shadow-soft space-y-3 hover:border-vibe-border transition-all duration-300"
              >
                <div className="flex items-center justify-between text-xs text-vibe-ink-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-vibe-accent" />
                    <span className="font-semibold text-vibe-ink">{post.bookTitle}</span>
                    <span className="text-vibe-ink-muted">by {post.bookAuthor}</span>
                  </div>
                  {post.pageNumber && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-vibe-card-subtle border border-vibe-border text-vibe-ink-muted">
                      p. {post.pageNumber}
                    </span>
                  )}
                </div>
                <blockquote className="font-display italic font-normal text-base sm:text-lg text-vibe-ink leading-relaxed border-l-2 border-vibe-accent pl-4 py-0.5">
                  “{post.quoteText}”
                </blockquote>
                <div className="pt-2 border-t border-vibe-border-subtle flex items-center justify-between text-xs text-vibe-ink-secondary">
                  <span>Saved from <strong className="text-vibe-ink font-medium">{post.authorName}</strong></span>
                  <button 
                    onClick={() => handleStartTimerForBook(post.bookTitle, post.bookAuthor, post.coverImageUrl)} 
                    className="inline-flex items-center gap-1 font-semibold text-vibe-accent hover:text-vibe-accent-hover transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Time this book</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
