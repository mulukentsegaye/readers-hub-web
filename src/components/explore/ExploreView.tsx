import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  TrendingUp, 
  Flame, 
  Filter,
  Search,
  Loader2,
  X,
  WifiOff,
  Landmark,
  User,
  Briefcase,
  Atom,
  Palette,
  Feather,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { 
  CURATED_BOOKS, 
  CURATED_CATEGORIES, 
  CuratedCategory, 
  CATEGORY_CONFIGS, 
  CategoryConfig,
  SPOTLIGHT_BOOK,
  CuratedBook 
} from '../../data/curatedBooks';
import { 
  bookSearchService, 
  SuggestedBook, 
  isOfflineOrNetworkError,
  sanitizeOpenLibraryCover
} from '../../services/bookSearchService';

interface ExploreViewProps {
  onViewBookDetails: (book: {
    title: string;
    author: string;
    coverImageUrl?: string;
    firstPublishYear?: number;
    workKey?: string;
    description?: string;
  }) => void;
  onStartTimer: (title: string, author: string, cover?: string) => void;
  onShareBook: (book: { title: string; author: string; coverImageUrl?: string }) => void;
  initialSearchQuery?: string;
  onClearInitialSearch?: () => void;
}

const PAGE_SIZE = 20;

function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 'ellipsis', total];
  }
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

function getCategoryIcon(iconName: string): React.ReactNode {
  switch (iconName) {
    case 'Compass':
      return <Compass className="w-4 h-4 text-sky-500" />;
    case 'Sparkles':
      return <Sparkles className="w-4 h-4 text-amber-500" />;
    case 'TrendingUp':
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case 'BookOpen':
      return <BookOpen className="w-4 h-4 text-purple-500" />;
    case 'Flame':
      return <Flame className="w-4 h-4 text-rose-500" />;
    case 'Landmark':
      return <Landmark className="w-4 h-4 text-stone-500" />;
    case 'User':
      return <User className="w-4 h-4 text-indigo-500" />;
    case 'Briefcase':
      return <Briefcase className="w-4 h-4 text-blue-500" />;
    case 'Atom':
      return <Atom className="w-4 h-4 text-teal-500" />;
    case 'Palette':
      return <Palette className="w-4 h-4 text-pink-500" />;
    case 'Feather':
      return <Feather className="w-4 h-4 text-amber-600" />;
    case 'ShieldAlert':
      return <ShieldAlert className="w-4 h-4 text-red-500" />;
    default:
      return <BookOpen className="w-4 h-4 text-vibe-accent" />;
  }
}

const BookCardCover: React.FC<{
  title: string;
  author: string;
  coverImageUrl?: string;
  coverThumbnailUrl?: string;
}> = ({ title, author, coverImageUrl, coverThumbnailUrl }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const src = sanitizeOpenLibraryCover(title, author, coverImageUrl || coverThumbnailUrl);

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

  if (!src || hasError) {
    return (
      <div className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-3 p-3.5 flex flex-col justify-between ${palette.bg} border ${palette.border} shadow-md select-none`}>
        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-white/50 pl-1">
          <span>Liread</span>
          <BookOpen className={`w-3.5 h-3.5 ${palette.foil}`} />
        </div>
        <div className="space-y-1.5 pl-1 my-auto">
          <p className="font-serif text-xs sm:text-sm font-bold text-white line-clamp-3 leading-snug drop-shadow-xs">
            {title}
          </p>
          <p className="text-[10px] uppercase font-sans tracking-wider text-white/70 line-clamp-1">
            {author}
          </p>
        </div>
        <div className="pl-1 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/40">
          <span>Edition</span>
          <span className="font-serif italic text-white/60">Classic</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-3 border border-vibe-border/60 bg-vibe-card-subtle shadow-xs">
      {!isLoaded && (
        <div className="absolute inset-0 bg-vibe-border/30 animate-pulse flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-vibe-ink-muted/50" />
        </div>
      )}
      <img
        src={src}
        alt={title}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

/**
 * Reusable Horizontal Shelf Component with smooth touch & arrow scrolling
 */
const HorizontalBookShelf: React.FC<{
  title: string;
  category: CuratedCategory;
  subjectSlug: string;
  icon: React.ReactNode;
  initialBooks?: SuggestedBook[];
  onSeeAll: (category: CuratedCategory) => void;
  onViewBookDetails: ExploreViewProps['onViewBookDetails'];
  onStartTimer: ExploreViewProps['onStartTimer'];
}> = ({
  title,
  category,
  subjectSlug,
  icon,
  initialBooks = [],
  onSeeAll,
  onViewBookDetails,
  onStartTimer,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [books, setBooks] = useState<SuggestedBook[]>(initialBooks);

  useEffect(() => {
    let isMounted = true;
    async function loadShelf() {
      // Asynchronously fetch extra books to fill the shelf to 16+ titles
      try {
        const remote = await bookSearchService.getShelfBooks(subjectSlug, 16);
        if (isMounted && remote.length > 0) {
          const seen = new Set<string>();
          const merged: SuggestedBook[] = [];
          for (const b of [...initialBooks, ...remote]) {
            const key = b.title.trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(b);
            }
          }
          setBooks(merged);
        }
      } catch (err) {
        console.warn(`Could not load shelf for ${subjectSlug}:`, err);
      }
    }

    loadShelf();
    return () => {
      isMounted = false;
    };
  }, [subjectSlug]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -420 : 420;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Shelf Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-serif text-lg sm:text-xl font-semibold text-vibe-ink">
            {title}
          </h2>
          <span className="text-[11px] font-mono text-vibe-ink-muted hidden sm:inline-block">
            ({books.length} books)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll arrow buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="w-7 h-7 rounded-full bg-vibe-card border border-vibe-border hover:bg-vibe-card-subtle flex items-center justify-center text-vibe-ink shadow-xs transition-transform active:scale-90 cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="w-7 h-7 rounded-full bg-vibe-card border border-vibe-border hover:bg-vibe-card-subtle flex items-center justify-center text-vibe-ink shadow-xs transition-transform active:scale-90 cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* See All Button */}
          <button
            type="button"
            onClick={() => onSeeAll(category)}
            className="text-xs text-vibe-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer ml-1"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth py-2 scrollbar-none snap-x snap-mandatory"
      >
        {books.map((b) => (
          <div
            key={b.id}
            onClick={() => onViewBookDetails({
              title: b.title,
              author: b.author,
              coverImageUrl: b.coverImageUrl,
              firstPublishYear: b.firstPublishYear,
              workKey: b.workKey,
            })}
            className="w-36 sm:w-44 flex-shrink-0 snap-start bg-vibe-card border border-vibe-border rounded-2xl p-3 shadow-soft hover:shadow-float hover:border-vibe-border transition-all duration-300 flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <BookCardCover
                title={b.title}
                author={b.author}
                coverImageUrl={b.coverImageUrl}
                coverThumbnailUrl={b.coverThumbnailUrl}
              />
              <div className="space-y-1">
                <h3
                  className="font-serif text-sm font-semibold text-vibe-ink line-clamp-2 leading-snug group-hover:text-vibe-accent transition-colors"
                  title={b.title}
                >
                  {b.title}
                </h3>
                <p className="text-[11px] text-vibe-ink-muted truncate">
                  {b.author}
                </p>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-vibe-border/50 flex items-center justify-between text-[10px] text-vibe-ink-muted">
              <span>{b.firstPublishYear || 'Classic'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTimer(b.title, b.author, b.coverImageUrl);
                }}
                className="hover:text-vibe-accent transition-colors flex items-center gap-1 font-medium"
              >
                <Clock className="w-3 h-3" />
                <span>Timer</span>
              </button>
            </div>
          </div>
        ))}

        {/* Trailing "Explore All" card in horizontal shelf */}
        <div
          onClick={() => onSeeAll(category)}
          className="w-36 sm:w-44 flex-shrink-0 snap-start bg-vibe-card-subtle border border-dashed border-vibe-border hover:border-vibe-accent rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <ChevronRight className="w-5 h-5" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-vibe-ink group-hover:text-vibe-accent transition-colors">
              Explore All
            </p>
            <p className="text-[10px] text-vibe-ink-muted mt-0.5">
              {category} catalog
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dedicated Paginated Category View ("See All" / category pill destination)
 */
const CategoryBrowseView: React.FC<{
  category: CuratedCategory;
  onBack: () => void;
  onViewBookDetails: ExploreViewProps['onViewBookDetails'];
  onStartTimer: ExploreViewProps['onStartTimer'];
}> = ({ category, onBack, onViewBookDetails, onStartTimer }) => {
  const config = CATEGORY_CONFIGS.find((c) => c.name === category) || CATEGORY_CONFIGS[0];
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [books, setBooks] = useState<SuggestedBook[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // In-memory cache for fast back & forth pagination
  const pageCacheRef = useRef<Map<number, SuggestedBook[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCurrentPage(1);
    pageCacheRef.current.clear();
  }, [category]);

  useEffect(() => {
    const cached = pageCacheRef.current.get(currentPage);
    if (cached && cached.length > 0) {
      setBooks(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchPage() {
      try {
        const res = await bookSearchService.getBooksByCategory(config.subjectSlug, {
          page: currentPage,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        setBooks(res.books);
        setTotalFound(res.totalFound);
        pageCacheRef.current.set(currentPage, res.books);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Failed to load category page:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPage();

    return () => {
      controller.abort();
    };
  }, [category, config.subjectSlug, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalFound / PAGE_SIZE));
  const paginationRange = getPaginationRange(currentPage, totalPages);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.getElementById('main-viewport');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setJumpPageInput('');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header & Breadcrumb */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vibe-card border border-vibe-border text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors group shadow-soft cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Shelves</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vibe-border/60 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-vibe-accent" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-vibe-ink-muted">
                {config.badgeLabel}
              </span>
              <span className="text-vibe-border">·</span>
              <span className="text-xs font-mono font-medium text-vibe-accent">
                {totalFound > 0 ? `${totalFound.toLocaleString()} Books Available` : 'Browsing Collection'}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-vibe-ink flex items-center gap-3">
              {getCategoryIcon(config.iconName)}
              <span>{config.shelfTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-vibe-ink-muted max-w-2xl leading-relaxed">
              {config.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-vibe-ink-muted font-mono">
            <span>Page {currentPage} of {totalPages.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-vibe-card border border-vibe-border rounded-2xl p-3 sm:p-4 shadow-soft space-y-3 animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-vibe-border/50" />
              <div className="h-4 bg-vibe-border/60 rounded w-3/4" />
              <div className="h-3 bg-vibe-border/40 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-vibe-card rounded-3xl border border-vibe-border p-8">
          <BookOpen className="w-8 h-8 text-vibe-ink-muted mx-auto" />
          <h3 className="font-serif text-lg font-semibold text-vibe-ink">No books loaded</h3>
          <p className="text-xs text-vibe-ink-muted max-w-md mx-auto">
            Could not retrieve books for this category right now. You can check your internet connection or explore other categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7">
          {books.map((b) => (
            <div
              key={b.id}
              onClick={() => onViewBookDetails({
                title: b.title,
                author: b.author,
                coverImageUrl: b.coverImageUrl,
                firstPublishYear: b.firstPublishYear,
                workKey: b.workKey,
              })}
              className="bg-vibe-card border border-vibe-border rounded-2xl p-3 sm:p-4 shadow-soft hover:shadow-float hover:border-vibe-border transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <BookCardCover
                  title={b.title}
                  author={b.author}
                  coverImageUrl={b.coverImageUrl}
                  coverThumbnailUrl={b.coverThumbnailUrl}
                />
                <div className="space-y-1">
                  <h3
                    className="font-serif text-base font-semibold text-vibe-ink line-clamp-2 leading-snug group-hover:text-vibe-accent transition-colors"
                    title={b.title}
                  >
                    {b.title}
                  </h3>
                  <p className="text-xs text-vibe-ink-muted line-clamp-1">
                    {b.author}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-vibe-border/60 flex items-center justify-between text-xs text-vibe-ink-muted">
                <span className="font-mono text-[11px]">{b.firstPublishYear || 'Edition'}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTimer(b.title, b.author, b.coverImageUrl);
                  }}
                  className="hover:text-vibe-accent transition-colors flex items-center gap-1 font-medium text-[11px]"
                >
                  <Clock className="w-3 h-3" />
                  <span>Timer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OceanofPDF-style Pagination Strip */}
      {totalPages > 1 && (
        <div className="pt-6 border-t border-vibe-border flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-vibe-card border-vibe-border hover:bg-vibe-card-subtle text-vibe-ink shadow-2xs active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Numbered Page Buttons */}
            {paginationRange.map((item, idx) => {
              if (item === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-vibe-ink-muted select-none">
                    …
                  </span>
                );
              }
              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handlePageChange(item)}
                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 ${
                    isActive
                      ? 'bg-vibe-accent text-white shadow-xs font-bold scale-105'
                      : 'bg-vibe-card border border-vibe-border text-vibe-ink hover:bg-vibe-card-subtle'
                  }`}
                >
                  {item}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-vibe-card border-vibe-border hover:bg-vibe-card-subtle text-vibe-ink shadow-2xs active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Jump to Page */}
          {totalPages > 5 && (
            <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-xs text-vibe-ink-muted">
              <span>Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`${currentPage}`}
                className="w-14 px-2 py-1 rounded-lg bg-vibe-card border border-vibe-border text-center text-xs text-vibe-ink focus:outline-none focus:border-vibe-accent shadow-2xs"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-vibe-card hover:bg-vibe-card-subtle border border-vibe-border text-xs font-semibold text-vibe-ink hover:text-vibe-accent transition-colors cursor-pointer shadow-2xs"
              >
                Go
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export const ExploreView: React.FC<ExploreViewProps> = ({
  onViewBookDetails,
  onStartTimer,
  initialSearchQuery,
  onClearInitialSearch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CuratedCategory>('All');

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [suggestions, setSuggestions] = useState<SuggestedBook[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageCacheRef = useRef<Map<number, SuggestedBook[]>>(new Map());

  // Synchronize when initialSearchQuery prop changes
  useEffect(() => {
    if (typeof initialSearchQuery === 'string' && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
      pageCacheRef.current.clear();
      setCurrentPage(1);
      if (initialSearchQuery.trim().length >= 2) {
        setShowResults(false);
      }
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setTotalFound(0);
      setCurrentPage(1);
      pageCacheRef.current.clear();
      setIsSearching(false);
      setIsOffline(false);
      return;
    }

    const cachedPage = pageCacheRef.current.get(currentPage);
    if (cachedPage && cachedPage.length > 0) {
      setSuggestions(cachedPage);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      const localMatches = bookSearchService.searchLocalCuratedBooks(query);
      const start = (currentPage - 1) * PAGE_SIZE;
      const pageSlice = localMatches.slice(start, start + PAGE_SIZE);
      setSuggestions(pageSlice);
      setTotalFound(localMatches.length);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { books, totalFound: count } = await bookSearchService.searchBooks(query, {
          limit: PAGE_SIZE,
          page: currentPage,
          signal: controller.signal,
        });
        setSuggestions(books);
        pageCacheRef.current.set(currentPage, books);
        setTotalFound(count);
        setIsOffline(false);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          if (isOfflineOrNetworkError(err)) {
            setIsOffline(true);
            const localMatches = bookSearchService.searchLocalCuratedBooks(query);
            const start = (currentPage - 1) * PAGE_SIZE;
            const pageSlice = localMatches.slice(start, start + PAGE_SIZE);
            setSuggestions(pageSlice);
            setTotalFound(localMatches.length);
          } else {
            console.warn('Search error in ExploreView:', err);
          }
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalFound / PAGE_SIZE));
  const paginationRange = getPaginationRange(currentPage, totalPages);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    const topEl = document.getElementById('search-results-top');
    if (topEl) {
      topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const mainEl = document.getElementById('main-viewport');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setJumpPageInput('');
    }
  };

  const handleSelectBook = (book: SuggestedBook) => {
    setShowResults(false);
    onViewBookDetails({
      title: book.title,
      author: book.author,
      coverImageUrl: book.coverImageUrl,
      firstPublishYear: book.firstPublishYear,
      workKey: book.workKey,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setTotalFound(0);
    setCurrentPage(1);
    pageCacheRef.current.clear();
    setShowResults(false);
    setIsSearching(false);
    onClearInitialSearch?.();
  };

  // Curated starter books for horizontal shelves
  const getInitialShelfBooks = (category: CuratedCategory): SuggestedBook[] => {
    let matches: CuratedBook[] = [];
    if (category === 'Philosophy') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Philosophy');
    } else if (category === 'Psychology') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Psychology');
    } else if (category === 'Habits & Focus') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Habits');
    } else if (category === 'Masterpiece Fiction') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Fiction');
    } else if (category === 'Sci-Fi & Fantasy') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Sci-Fi');
    } else if (category === 'History & Society') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'History');
    } else if (category === 'Biography & Memoir') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Biography');
    } else if (category === 'Business & Strategy') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Business');
    } else if (category === 'Science & Nature') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Science');
    } else if (category === 'Art & Creativity') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Art');
    } else if (category === 'Poetry') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Poetry');
    } else if (category === 'Mystery & Thriller') {
      matches = CURATED_BOOKS.filter((b) => b.category === 'Mystery');
    }

    return matches.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverImageUrl: b.coverImageUrl,
      coverThumbnailUrl: b.coverImageUrl,
      firstPublishYear: b.firstPublishYear,
      workKey: b.workKey,
    }));
  };

  return (
    <div className="w-full space-y-8 sm:space-y-10 animate-fade-in pb-16">
      {/* Search active view */}
      {searchQuery.trim().length >= 2 ? (
        <div id="search-results-top" className="space-y-6">
          {/* Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vibe-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-vibe-accent" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-vibe-ink-muted">
                  Search Results
                </span>
                {totalFound > 0 && (
                  <span className="text-xs text-vibe-accent font-semibold font-mono">
                    · {totalFound.toLocaleString()} {totalFound === 1 ? 'book' : 'books'} found
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-vibe-ink">
                Results for "{searchQuery}"
              </h1>
            </div>

            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-vibe-border bg-vibe-card text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search</span>
            </button>
          </div>

          {/* Search Results Grid */}
          {isSearching && suggestions.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-vibe-card border border-vibe-border rounded-2xl p-3 sm:p-4 shadow-soft space-y-3 animate-pulse">
                  <div className="aspect-[2/3] w-full rounded-xl bg-vibe-border/50" />
                  <div className="h-4 bg-vibe-border/60 rounded w-3/4" />
                  <div className="h-3 bg-vibe-border/40 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7">
                {suggestions.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBook(b)}
                    className="bg-vibe-card border border-vibe-border rounded-2xl p-3 sm:p-4 shadow-soft hover:shadow-float hover:border-vibe-border transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <BookCardCover
                        title={b.title}
                        author={b.author}
                        coverImageUrl={b.coverImageUrl}
                        coverThumbnailUrl={b.coverThumbnailUrl}
                      />
                      <div className="space-y-1">
                        <h3 className="font-serif text-base font-semibold text-vibe-ink line-clamp-2 leading-snug group-hover:text-vibe-accent transition-colors">
                          {b.title}
                        </h3>
                        <p className="text-xs text-vibe-ink-muted line-clamp-1">{b.author}</p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-vibe-border/60 flex items-center justify-between text-xs text-vibe-ink-muted">
                      <span className="font-mono text-[11px]">{b.firstPublishYear || 'Edition'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartTimer(b.title, b.author, b.coverImageUrl);
                        }}
                        className="hover:text-vibe-accent transition-colors flex items-center gap-1 font-medium text-[11px]"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Timer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search Pagination */}
              {totalPages > 1 && (
                <div className="pt-6 border-t border-vibe-border flex flex-col items-center gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || isSearching}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-vibe-card border-vibe-border hover:bg-vibe-card-subtle text-vibe-ink shadow-2xs active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {paginationRange.map((item, idx) => {
                      if (item === 'ellipsis') {
                        return <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-vibe-ink-muted select-none">…</span>;
                      }
                      const isActive = item === currentPage;
                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={isSearching}
                          onClick={() => handlePageChange(item)}
                          className={`min-w-8 h-8 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95 ${
                            isActive ? 'bg-vibe-accent text-white shadow-xs font-bold scale-105' : 'bg-vibe-card border border-vibe-border text-vibe-ink hover:bg-vibe-card-subtle'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages || isSearching}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-vibe-card border-vibe-border hover:bg-vibe-card-subtle text-vibe-ink shadow-2xs active:scale-95"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {totalPages > 5 && (
                    <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-xs text-vibe-ink-muted">
                      <span>Go to:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        placeholder={`${currentPage}`}
                        className="w-14 px-2 py-1 rounded-lg bg-vibe-card border border-vibe-border text-center text-xs text-vibe-ink focus:outline-none focus:border-vibe-accent shadow-2xs"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-vibe-card hover:bg-vibe-card-subtle border border-vibe-border text-xs font-semibold text-vibe-ink hover:text-vibe-accent transition-colors cursor-pointer shadow-2xs"
                      >
                        Go
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 bg-vibe-card rounded-3xl border border-vibe-border p-8">
              <BookOpen className="w-8 h-8 text-vibe-ink-muted mx-auto" />
              <p className="font-serif text-lg font-semibold text-vibe-ink">
                No books found for "{searchQuery}"
              </p>
              <p className="text-xs text-vibe-ink-muted max-w-sm mx-auto">
                We couldn't find matching titles in Open Library. Try searching with another keyword or author name.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 rounded-xl bg-vibe-accent text-white text-xs font-semibold hover:bg-vibe-accent-hover transition-all cursor-pointer shadow-xs"
                >
                  Explore Curated Shelves
                </button>
              </div>
            </div>
          )}
        </div>
      ) : selectedCategory !== 'All' ? (
        /* Dedicated Paginated Category View */
        <CategoryBrowseView
          category={selectedCategory}
          onBack={() => setSelectedCategory('All')}
          onViewBookDetails={onViewBookDetails}
          onStartTimer={onStartTimer}
        />
      ) : (
        /* Main Explore Page with Spotlight and Horizontal Shelves */
        <>
          {/* Page Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-vibe-accent/80" />
              <span className="font-sans text-[10.5px] font-medium tracking-wider uppercase text-vibe-ink-muted/80">
                Curated Recommendations & Global Library
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-vibe-ink">
              Explore Books
            </h1>
          </div>

          {/* Spotlight Hero Card */}
          <div 
            onClick={() => onViewBookDetails({
              title: SPOTLIGHT_BOOK.title,
              author: SPOTLIGHT_BOOK.author,
              coverImageUrl: SPOTLIGHT_BOOK.coverImageUrl,
              firstPublishYear: SPOTLIGHT_BOOK.firstPublishYear,
              workKey: SPOTLIGHT_BOOK.workKey,
              description: SPOTLIGHT_BOOK.description || SPOTLIGHT_BOOK.tagline,
            })}
            className="group relative rounded-3xl border border-vibe-border bg-vibe-card p-4 sm:p-8 shadow-soft hover:border-vibe-accent/30 transition-colors duration-300 cursor-pointer overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-center">
              <div className="md:col-span-4 flex justify-center md:justify-start">
                <div className="relative w-36 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-md border border-vibe-border bg-vibe-card-subtle flex-shrink-0">
                  <img
                    src={SPOTLIGHT_BOOK.coverImageUrl}
                    alt={SPOTLIGHT_BOOK.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-8 space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-sans uppercase tracking-wider font-medium bg-vibe-accent text-white shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    Curator's Spotlight
                  </span>
                  <span className="text-xs text-vibe-ink-muted">
                    {SPOTLIGHT_BOOK.firstPublishYear} · {SPOTLIGHT_BOOK.categoryLabel}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-vibe-ink tracking-tight group-hover:text-vibe-accent transition-colors">
                    {SPOTLIGHT_BOOK.title}
                  </h2>
                  <p className="text-sm sm:text-base text-vibe-ink-secondary font-medium">
                    by {SPOTLIGHT_BOOK.author}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-vibe-ink-muted leading-relaxed max-w-lg">
                  {SPOTLIGHT_BOOK.tagline}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onViewBookDetails({
                      title: SPOTLIGHT_BOOK.title,
                      author: SPOTLIGHT_BOOK.author,
                      coverImageUrl: SPOTLIGHT_BOOK.coverImageUrl,
                      firstPublishYear: SPOTLIGHT_BOOK.firstPublishYear,
                      workKey: SPOTLIGHT_BOOK.workKey,
                      description: SPOTLIGHT_BOOK.description || SPOTLIGHT_BOOK.tagline,
                    })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Read 5–10 Min Summary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartTimer(SPOTLIGHT_BOOK.title, SPOTLIGHT_BOOK.author, SPOTLIGHT_BOOK.coverImageUrl)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-vibe-card border border-vibe-border text-vibe-ink hover:border-vibe-accent transition-all active:scale-95 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-vibe-accent" />
                    <span>Start Timer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Browse by Category Filter Pills Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-vibe-ink">
                <Filter className="w-3.5 h-3.5 text-vibe-accent" />
                <span>Explore by Category</span>
              </div>
              <span className="text-[11px] text-vibe-ink-muted font-mono">
                {CURATED_CATEGORIES.length - 1} Genres Available
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CURATED_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-vibe-accent text-white shadow-xs font-semibold'
                        : 'bg-vibe-card border border-vibe-border text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              HORIZONTAL SHELVES: Rich, Scrollable, Not Restricted to 4 Books
              ========================================================================= */}
          <div className="space-y-12 sm:space-y-14">
            {CATEGORY_CONFIGS.map((config) => {
              const starterBooks = getInitialShelfBooks(config.name);
              return (
                <HorizontalBookShelf
                  key={config.id}
                  title={config.shelfTitle}
                  category={config.name}
                  subjectSlug={config.subjectSlug}
                  icon={getCategoryIcon(config.iconName)}
                  initialBooks={starterBooks}
                  onSeeAll={(cat) => setSelectedCategory(cat)}
                  onViewBookDetails={onViewBookDetails}
                  onStartTimer={onStartTimer}
                />
              );
            })}
          </div>

          {/* Looking for a specific book? Card with Integrated Search Bar */}
          <div className="rounded-3xl border border-vibe-border bg-vibe-card p-6 sm:p-8 md:p-10 text-center space-y-5 shadow-soft relative overflow-visible mt-8">
            <div className="space-y-2">
              <Sparkles className="w-6 h-6 text-vibe-accent mx-auto" />
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-vibe-ink tracking-tight">
                Looking for a specific book or author?
              </h3>
              <p className="text-xs sm:text-sm text-vibe-ink-muted max-w-md mx-auto">
                Search across millions of verified literary editions indexed from Open Library.
              </p>
            </div>

            <div ref={searchContainerRef} className="max-w-xl mx-auto relative text-left">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-vibe-ink-muted absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    pageCacheRef.current.clear();
                    setCurrentPage(1);
                    setShowResults(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setShowResults(true);
                  }}
                  placeholder="Search by title, author, or keyword (e.g. Sapiens, Virginia Woolf)..."
                  className="w-full h-12 pl-11 pr-11 rounded-2xl bg-vibe-card-subtle border border-vibe-border text-xs sm:text-sm text-vibe-ink placeholder:text-vibe-ink-muted focus:outline-none focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/20 transition-all shadow-xs"
                />
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-vibe-accent animate-spin absolute right-4 pointer-events-none" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-3.5 p-1 rounded-full text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* Quick Dropdown preview */}
              {showResults && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-vibe-border bg-vibe-card shadow-2xl overflow-hidden max-h-80 overflow-y-auto backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2.5 bg-vibe-card-subtle/90 border-b border-vibe-border flex items-center justify-between text-xs text-vibe-ink-muted font-medium">
                    {isOffline ? (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                        <WifiOff className="w-3.5 h-3.5" />
                        Offline Search
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-vibe-ink font-semibold">
                        <BookOpen className="w-4 h-4 text-vibe-accent" />
                        Quick Results
                      </span>
                    )}
                    {totalFound > 0 && (
                      <span className="text-[11px] text-vibe-ink-muted">
                        {totalFound.toLocaleString()} {totalFound === 1 ? 'book' : 'books'} found
                      </span>
                    )}
                  </div>

                  {isSearching && suggestions.length === 0 ? (
                    <div className="p-2 space-y-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-2.5 flex items-center gap-3 animate-pulse">
                          <div className="w-10 h-14 rounded-md bg-vibe-border/60 flex-shrink-0" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-3.5 bg-vibe-border/60 rounded-md w-3/5" />
                            <div className="h-2.5 bg-vibe-border/40 rounded-md w-2/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="divide-y divide-vibe-border/50">
                      {suggestions.map((book) => (
                        <div
                          key={book.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectBook(book)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectBook(book);
                            }
                          }}
                          className="p-3 hover:bg-vibe-card-subtle/80 flex items-center justify-between gap-3 transition-colors group cursor-pointer outline-none focus-visible:bg-vibe-card-subtle text-left"
                          title={`View book details for "${book.title}"`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-14 rounded-md overflow-hidden bg-vibe-border/30 flex-shrink-0 border border-vibe-border shadow-xs flex items-center justify-center">
                              {book.coverThumbnailUrl ? (
                                <img
                                  src={book.coverThumbnailUrl}
                                  alt={book.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              ) : (
                                <BookOpen className="w-4 h-4 text-vibe-ink-muted" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-vibe-ink truncate group-hover:text-vibe-accent transition-colors">
                                {book.title}
                              </p>
                              <p className="text-[11px] text-vibe-ink-muted truncate">
                                by {book.author}
                                {book.firstPublishYear && (
                                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-vibe-card-subtle border border-vibe-border">
                                    {book.firstPublishYear}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 pr-1 text-vibe-ink-muted group-hover:text-vibe-accent transition-colors">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-vibe-ink-muted space-y-1">
                      <p className="font-semibold text-vibe-ink">No books found for "{searchQuery}"</p>
                      <p className="text-[11px] text-vibe-ink-muted/80">Try checking the spelling or searching another title or author.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
