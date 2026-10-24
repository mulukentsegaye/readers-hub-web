import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, BookOpen, Flame, X, Loader2, ChevronRight, WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getUserAvatar } from '../../utils/avatar';
import { VibeTriggerButton } from '../theme/VibeTriggerButton';
import { LireadLogo } from '../ui/LireadLogo';
import { bookSearchService, SuggestedBook, isOfflineOrNetworkError } from '../../services/bookSearchService';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onSeeAll?: (query: string) => void;
  onGoToLanding?: () => void;
  onGoToLogin?: () => void;
  onViewProfile?: () => void;
  onViewSanctuary?: () => void;
  onSelectBookForTimer?: (title: string, author: string, cover?: string) => void;
  onShareBook?: (book: { title: string; author: string; coverImageUrl?: string }) => void;
  onViewBookDetails?: (book: SuggestedBook) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onSeeAll,
  onGoToLanding, 
  onGoToLogin,
  onViewProfile,
  onViewSanctuary,
  onSelectBookForTimer,
  onShareBook,
  onViewBookDetails,
}) => {
  const { user, isAuthenticated, isGuest } = useAuthStore();
  const [searchVal, setSearchVal] = useState('');
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  // Open Library interactive search state
  const [suggestions, setSuggestions] = useState<SuggestedBook[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Core search execution logic
  const executeSearch = useCallback(async (query: string, signal: AbortSignal) => {
    // If the browser already knows it is offline, bypass network call immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      const localMatches = bookSearchService.searchLocalCuratedBooks(query);
      setSuggestions(localMatches);
      setTotalFound(localMatches.length);
      setIsSearching(false);
      return;
    }

    try {
      const { books, totalFound: count } = await bookSearchService.searchBooks(query, signal);
      setSuggestions(books);
      setTotalFound(count);
      setIsOffline(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (isOfflineOrNetworkError(err)) {
        setIsOffline(true);
        const localMatches = bookSearchService.searchLocalCuratedBooks(query);
        setSuggestions(localMatches);
        setTotalFound(localMatches.length);
      } else {
        setSuggestions([]);
        setTotalFound(0);
        setIsOffline(false);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search on searchVal change
  useEffect(() => {
    const query = searchVal.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setTotalFound(0);
      setIsSearching(false);
      setShowDropdown(false);
      setIsOffline(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(() => {
      executeSearch(query, controller.signal);
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchVal, executeSearch]);

  // Network connectivity listener: auto-retry when coming back online
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      const query = searchVal.trim();
      if (query.length >= 2 && showDropdown) {
        setIsSearching(true);
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        executeSearch(query, controller.signal);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      const query = searchVal.trim();
      if (query.length >= 2) {
        const localMatches = bookSearchService.searchLocalCuratedBooks(query);
        setSuggestions(localMatches);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [searchVal, showDropdown, executeSearch]);

  // Click outside to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const clickedDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(target);
      const clickedMobile = mobileSearchRef.current && mobileSearchRef.current.contains(target);

      if (!clickedDesktop && !clickedMobile) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    onSearch?.(val);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    setSuggestions([]);
    setTotalFound(0);
    setShowDropdown(false);
    setIsOffline(false);
    onSearch?.('');
  };

  const handleRetrySearch = () => {
    const query = searchVal.trim();
    if (query.length < 2) return;
    setIsSearching(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    executeSearch(query, controller.signal);
  };

  const handleSeeAll = () => {
    const trimmed = searchVal.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    setMobileSearchOpen(false);
    if (onSeeAll) {
      onSeeAll(trimmed);
    } else if (onSearch) {
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSeeAll();
    }
  };

  const handleViewDetails = (book: SuggestedBook) => {
    setShowDropdown(false);
    onViewBookDetails?.(book);
  };

  const renderSuggestionsDropdown = () => {
    if (!showDropdown || searchVal.trim().length < 2) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-vibe-border bg-vibe-card shadow-2xl overflow-hidden max-h-[65vh] sm:max-h-96 overflow-y-auto overscroll-contain backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="px-3.5 py-2.5 bg-vibe-card-subtle/90 border-b border-vibe-border flex items-center justify-between text-xs text-vibe-ink-muted font-medium">
          {isOffline ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <WifiOff className="w-4 h-4" />
              Offline Search
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-vibe-ink font-semibold">
              <BookOpen className="w-4 h-4 text-vibe-accent" />
              Book Suggestions
            </span>
          )}

          {isOffline ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {suggestions.length > 0
                ? `${suggestions.length} offline ${suggestions.length === 1 ? 'match' : 'matches'}`
                : 'Offline'}
            </span>
          ) : totalFound > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-vibe-ink-muted font-medium">
                {totalFound.toLocaleString()} {totalFound === 1 ? 'book' : 'books'} found
              </span>
              <button
                type="button"
                onClick={handleSeeAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-vibe-accent text-white hover:bg-vibe-accent-hover shadow-xs transition-all active:scale-95 cursor-pointer"
                title={`See all ${totalFound.toLocaleString()} books for "${searchVal}"`}
              >
                <span>See all</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Loading state: subtle, tranquil skeleton placeholders without duplicate spinners */}
        {isSearching && suggestions.length === 0 ? (
          <div className="p-2 space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-2.5 flex items-center gap-3 animate-pulse">
                <div className="w-9 h-12 rounded-md bg-vibe-border/60 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3.5 bg-vibe-border/60 rounded-md w-3/5" />
                  <div className="h-2.5 bg-vibe-border/40 rounded-md w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : isOffline ? (
          /* Offline Mode State */
          suggestions.length > 0 ? (
            <div>
              {/* Informational notice when offline but local catalog matches */}
              <div className="px-3.5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="truncate">You are offline. Showing matching offline books.</span>
                </span>
                <button
                  type="button"
                  onClick={handleRetrySearch}
                  className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>

              {/* Book cards */}
              <div className="divide-y divide-vibe-border/50">
                {suggestions.map((book) => (
                  <div
                    key={book.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewDetails(book)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleViewDetails(book);
                      }
                    }}
                    className="p-3 hover:bg-vibe-card-subtle/80 flex items-center justify-between gap-3 transition-colors group cursor-pointer outline-none focus-visible:bg-vibe-card-subtle"
                    title={`View dedicated book page for "${book.title}"`}
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
            </div>
          ) : (
            /* Offline and no local match: Inform user clearly that they are offline */
            <div className="p-6 text-center text-xs space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-xs">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-vibe-ink text-sm">You are offline</p>
                <p className="text-[11px] text-vibe-ink-muted max-w-xs mx-auto leading-relaxed">
                  Connect to the internet to search for <span className="font-semibold text-vibe-ink">"{searchVal}"</span>.
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRetrySearch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-vibe-accent text-white hover:bg-vibe-accent/90 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Search
                </button>
              </div>
            </div>
          )
        ) : suggestions.length > 0 ? (
          /* Normal online suggestions list */
          <div className="divide-y divide-vibe-border/50">
            {suggestions.map((book) => (
              <div
                key={book.id}
                role="button"
                tabIndex={0}
                onClick={() => handleViewDetails(book)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewDetails(book);
                  }
                }}
                className="p-3 hover:bg-vibe-card-subtle/80 flex items-center justify-between gap-3 transition-colors group cursor-pointer outline-none focus-visible:bg-vibe-card-subtle"
                title={`View dedicated book page for "${book.title}"`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Book cover thumbnail */}
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

                  {/* Book metadata */}
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

                {/* Subtle affordance chevron indicating dedicated book page */}
                <div className="flex-shrink-0 pr-1 text-vibe-ink-muted group-hover:text-vibe-accent transition-colors">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}

            {/* Bottom "See all" action button for seamless UX navigation */}
            {totalFound > suggestions.length && (
              <div className="p-2 border-t border-vibe-border bg-vibe-card-subtle/80 sticky bottom-0 backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleSeeAll}
                  className="w-full py-2 px-3 rounded-xl bg-vibe-accent/10 hover:bg-vibe-accent text-vibe-accent hover:text-white border border-vibe-accent/20 text-xs font-semibold flex items-center justify-between transition-all group cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <span className="truncate">
                    See all <span className="font-bold underline decoration-vibe-accent/30">{totalFound.toLocaleString()}</span> books for "{searchVal}"
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[11px] flex-shrink-0 ml-2">
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Normal online: no books found */
          <div className="p-6 text-center text-xs text-vibe-ink-muted space-y-1">
            <p className="font-semibold text-vibe-ink">No books found for "{searchVal}"</p>
            <p className="text-[11px] text-vibe-ink-muted/80">Try checking the spelling or searching another title or author.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-hidden border-b border-vibe-border bg-vibe-card/95 backdrop-blur-md">
      <div className="w-full px-2.5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-0 flex items-center h-14 sm:h-15 gap-2 sm:gap-4">

        {/* Brand / Logo */}
        <button
          type="button"
          onClick={onGoToLanding}
          className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 group outline-none cursor-pointer"
          title="Liread — Home"
        >
          <LireadLogo size="md" className="transition-transform group-hover:scale-105 group-active:scale-95" />
          <span className="font-display text-lg sm:text-xl font-semibold tracking-tight text-vibe-ink hidden sm:block">
            Liread
          </span>
        </button>

        {/* Center Search Bar (md+) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-auto relative" ref={desktopSearchRef}>
          <div className="relative w-full flex items-center">
            {isOffline ? (
              <WifiOff className="absolute left-3.5 w-4 h-4 text-amber-500 pointer-events-none" strokeWidth={1.75} />
            ) : (
              <Search className="absolute left-3.5 w-4 h-4 text-vibe-ink-muted pointer-events-none" strokeWidth={1.75} />
            )}
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 || searchVal.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
              placeholder={isOffline ? "Search offline books & authors..." : "Search books, authors, passages..."}
              className={`w-full bg-vibe-bg text-sm text-vibe-ink placeholder:text-vibe-ink-muted pl-10 pr-9 py-2 rounded-xl border focus:outline-none transition-all ${
                isOffline 
                  ? 'border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
                  : 'border-vibe-border focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/15'
              }`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 w-4 h-4 text-vibe-accent animate-spin" />
            ) : searchVal ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 p-1 rounded-lg text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {renderSuggestionsDropdown()}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">

          {/* Theme Toggle */}
          <VibeTriggerButton variant="header" />

          {!isAuthenticated && !isGuest && onGoToLogin && (
            <button
              type="button"
              onClick={onGoToLogin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-vibe-accent text-white hover:bg-vibe-accent-hover transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(!isMobileSearchOpen);
              if (!isMobileSearchOpen && searchVal.trim().length >= 2) {
                setShowDropdown(true);
              }
            }}
            aria-label="Search"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors cursor-pointer"
          >
            {isMobileSearchOpen ? (
              <X className="w-4.5 h-4.5" strokeWidth={2} />
            ) : (
              <Search className="w-4.5 h-4.5" strokeWidth={1.75} />
            )}
          </button>

          {/* Streak badge (mobile - clickable to Sanctuary) */}
          <button
            type="button"
            onClick={onViewSanctuary || onViewProfile}
            aria-label={`Current streak: ${user?.currentStreak ?? 0} days`}
            className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-lg bg-vibe-accent-subtle border border-vibe-accent/20 text-vibe-accent active:scale-95 transition-transform cursor-pointer"
            title="View reading streak in Sanctuary"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono text-xs font-semibold leading-none">{user?.currentStreak ?? 0}</span>
          </button>

          {/* Streak badge (desktop - clickable to Sanctuary) */}
          <button
            type="button"
            onClick={onViewSanctuary || onViewProfile}
            aria-label={`Current streak: ${user?.currentStreak ?? 0} days`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-vibe-accent-subtle border border-vibe-accent/20 text-vibe-accent hover:border-vibe-accent/40 active:scale-95 transition-all cursor-pointer"
            title="View reading streak in Sanctuary"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono text-xs font-semibold">{user?.currentStreak ?? 0}d</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-vibe-secondary ring-1 ring-vibe-card" />
            </button>

            {isNotificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-vibe-card border border-vibe-border shadow-vibe-elevated p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-vibe-border">
                    <span className="font-sans text-xs font-medium uppercase tracking-wider text-vibe-ink">Notifications</span>
                    <span className="text-[10px] text-vibe-ink-muted">All caught up</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-vibe-card-subtle border border-vibe-border/60">
                      <p className="font-medium text-vibe-ink">Welcome to Liread</p>
                      <p className="text-vibe-ink-muted text-[11px] mt-0.5 leading-relaxed">
                        Start your reading timer today to log your first streak session and join the Consistent Circle.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile avatar */}
          <button
            type="button"
            onClick={onViewProfile || onGoToLogin}
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-vibe-accent/40 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            title={`${user?.fullName ?? 'Guest'} — View profile`}
          >
            <img
              src={getUserAvatar(user)}
              alt={user?.fullName ?? 'User avatar'}
              className="w-full h-full object-cover"
            />
          </button>

        </div>
      </div>

      {/* Mobile search drawer */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-vibe-border-subtle relative" ref={mobileSearchRef}>
          <div className="relative flex items-center mt-2">
            {isOffline ? (
              <WifiOff className="absolute left-3.5 w-4 h-4 text-amber-500 pointer-events-none" strokeWidth={1.75} />
            ) : (
              <Search className="absolute left-3.5 w-4 h-4 text-vibe-ink-muted pointer-events-none" strokeWidth={1.75} />
            )}
            <input
              type="text"
              autoFocus
              value={searchVal}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 || searchVal.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
              placeholder={isOffline ? "Search offline books & authors..." : "Search books, authors, passages..."}
              className={`w-full bg-vibe-bg text-sm text-vibe-ink placeholder:text-vibe-ink-muted pl-10 pr-9 py-2.5 rounded-xl border focus:outline-none transition-all ${
                isOffline 
                  ? 'border-amber-500/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
                  : 'border-vibe-border focus:border-vibe-accent focus:ring-2 focus:ring-vibe-accent/15'
              }`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 w-4 h-4 text-vibe-accent animate-spin" />
            ) : searchVal ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 p-1 rounded-lg text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {renderSuggestionsDropdown()}
        </div>
      )}
    </header>
  );
};
