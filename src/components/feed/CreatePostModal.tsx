import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Star, ArrowLeft, Search, BookOpen, Loader2, CheckCircle2, WifiOff } from 'lucide-react';
import { useFeedStore } from '../../stores/feedStore';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../stores/noticeStore';
import { PostType } from '../../types';
import { getUserAvatar } from '../../utils/avatar';
import { bookSearchService, SuggestedBook, isOfflineOrNetworkError } from '../../services/bookSearchService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBook?: {
    title: string;
    author: string;
    coverImageUrl?: string;
    quoteText?: string;
    pageNumber?: number | string;
  } | null;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, initialBook }) => {
  const { addPost } = useFeedStore();
  const { user } = useAuthStore();

  const [postType, setPostType] = useState<PostType>('passage');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(undefined);
  const [quoteText, setQuoteText] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [tag, setTag] = useState('Creativity');
  const [recommendationText, setRecommendationText] = useState('');
  const [rating, setRating] = useState(5);

  // Open Library Book Search & Auto-Suggest state
  const [suggestions, setSuggestions] = useState<SuggestedBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedBook, setSelectedBook] = useState<SuggestedBook | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pre-fill initialBook if passed (e.g. from header search or feed action)
  useEffect(() => {
    if (isOpen && initialBook) {
      setBookTitle(initialBook.title);
      setBookAuthor(initialBook.author);
      setCoverImageUrl(initialBook.coverImageUrl);
      if (initialBook.quoteText) {
        setQuoteText(initialBook.quoteText);
        setPostType('passage');
      }
      if (initialBook.pageNumber) {
        setPageNumber(String(initialBook.pageNumber));
      }
      setSelectedBook({
        id: initialBook.title,
        title: initialBook.title,
        author: initialBook.author,
        coverImageUrl: initialBook.coverImageUrl,
      });
      setShowSuggestions(false);
    }
  }, [isOpen, initialBook]);

  // Debounced search on bookTitle change
  useEffect(() => {
    const query = bookTitle.trim();

    // If query is empty or too short, reset suggestions
    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setIsOffline(false);
      return;
    }

    // If title matches currently selected book, don't trigger search
    if (selectedBook && selectedBook.title.toLowerCase() === query.toLowerCase()) {
      return;
    }

    setIsSearching(true);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check offline immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      const localMatches = bookSearchService.searchLocalCuratedBooks(query);
      setSuggestions(localMatches);
      setShowSuggestions(true);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { books } = await bookSearchService.searchBooks(query, controller.signal);
        setSuggestions(books);
        setIsOffline(false);
        setShowSuggestions(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          if (isOfflineOrNetworkError(err)) {
            setIsOffline(true);
            const localMatches = bookSearchService.searchLocalCuratedBooks(query);
            setSuggestions(localMatches);
            setShowSuggestions(true);
          } else {
            console.warn('Search error in CreatePostModal:', err);
          }
        }
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [bookTitle, selectedBook]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleSelectBook = (book: SuggestedBook) => {
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setCoverImageUrl(book.coverImageUrl);
    setSelectedBook(book);
    setShowSuggestions(false);
  };

  const handleRemoveCover = () => {
    setCoverImageUrl(undefined);
    setSelectedBook(null);
  };

  const handleClose = () => {
    setShowSuggestions(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      toast.warning('Please enter a book title to publish your post.', 'Title Required');
      return;
    }

    addPost(
      {
        postType,
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim() || 'Unknown Author',
        coverImageUrl: coverImageUrl || undefined,
        quoteText: quoteText.trim() || undefined,
        pageNumber: pageNumber ? parseInt(pageNumber, 10) : undefined,
        tag,
        recommendationText: recommendationText.trim() || undefined,
        rating: postType === 'finished_book' ? rating : undefined,
        authorName: user?.fullName,
        authorAvatar: getUserAvatar(user),
      },
      user?.id
    );

    setBookTitle('');
    setBookAuthor('');
    setCoverImageUrl(undefined);
    setSelectedBook(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setQuoteText('');
    setPageNumber('');
    setRecommendationText('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="w-full h-full sm:h-auto sm:max-w-lg rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-vibe-card border border-vibe-border text-vibe-ink shadow-vibe-elevated flex flex-col justify-between overflow-y-auto max-h-screen sm:max-h-[90vh] transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-vibe-border pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                aria-label="Back"
                className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full border border-vibe-border bg-vibe-card text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle transition-all active:scale-95 shadow-xs group"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center gap-2 text-vibe-accent">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <h2 className="font-heading text-lg sm:text-xl font-semibold text-vibe-ink">
                  Share a Reading Moment
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close modal"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post Type Selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPostType('passage')}
              className={`min-h-[44px] py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                postType === 'passage'
                  ? 'bg-vibe-accent-subtle border-vibe-accent text-vibe-accent shadow-xs'
                  : 'bg-vibe-card border-vibe-border text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              Passage Quote
            </button>
            <button
              type="button"
              onClick={() => setPostType('finished_book')}
              className={`min-h-[44px] py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                postType === 'finished_book'
                  ? 'bg-vibe-accent-subtle border-vibe-accent text-vibe-accent shadow-xs'
                  : 'bg-vibe-card border-vibe-border text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              Finished Book
            </button>
            <button
              type="button"
              onClick={() => setPostType('recommendation')}
              className={`min-h-[44px] py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                postType === 'recommendation'
                  ? 'bg-vibe-accent-subtle border-vibe-accent text-vibe-accent shadow-xs'
                  : 'bg-vibe-card border-vibe-border text-vibe-ink-muted hover:text-vibe-ink'
              }`}
            >
              Recommend
            </button>
          </div>

          <form id="create-post-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Book Title & Author Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Book Title with Open Library Auto-Suggest */}
              <div className="relative" ref={searchContainerRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10.5px] font-medium uppercase tracking-wider text-vibe-ink-muted/80">
                    Book Title *
                  </label>
                  <span className="text-[10px] text-vibe-accent font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-Suggest
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => {
                      setBookTitle(e.target.value);
                      if (selectedBook && e.target.value !== selectedBook.title) {
                        setSelectedBook(null);
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Type title (e.g. The Creative Act)..."
                    className="w-full text-xs sm:text-sm p-3 pr-9 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:outline-none transition-all"
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-vibe-ink-muted pointer-events-none">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-vibe-accent" />
                    ) : selectedBook ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Search className="w-4 h-4 text-vibe-ink-muted" />
                    )}
                  </div>
                </div>

                {/* Auto-suggest dropdown */}
                {showSuggestions && bookTitle.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-vibe-border bg-vibe-card shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                    <div className="px-3 py-2 bg-vibe-card-subtle/90 border-b border-vibe-border flex items-center justify-between text-[11px] text-vibe-ink-muted font-medium">
                      {isOffline ? (
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                          <WifiOff className="w-3.5 h-3.5" />
                          Offline Search
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-vibe-ink">
                          <BookOpen className="w-3.5 h-3.5 text-vibe-accent" />
                          Book Suggestions
                        </span>
                      )}
                      {isOffline ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          {suggestions.length > 0 ? `${suggestions.length} offline matches` : 'Offline'}
                        </span>
                      ) : suggestions.length > 0 ? (
                        <span className="text-[10px] text-vibe-ink-muted">
                          {suggestions.length} found
                        </span>
                      ) : null}
                    </div>

                    {/* Loading state: subtle, tranquil skeleton placeholders without duplicate spinners */}
                    {isSearching && suggestions.length === 0 ? (
                      <div className="p-2 space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-2 flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-11 rounded-md bg-vibe-border/60 flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="h-3 bg-vibe-border/60 rounded-md w-3/5" />
                              <div className="h-2 bg-vibe-border/40 rounded-md w-2/5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="divide-y divide-vibe-border/50">
                        {suggestions.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => handleSelectBook(book)}
                            className="w-full p-2.5 sm:p-3 text-left hover:bg-vibe-card-subtle flex items-center gap-3 transition-colors group cursor-pointer"
                          >
                            {/* Thumbnail */}
                            <div className="w-9 h-12 rounded-md overflow-hidden bg-vibe-border/30 flex-shrink-0 border border-vibe-border shadow-xs flex items-center justify-center">
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

                            {/* Details */}
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

                            {/* Cover status indicator */}
                            <div className="flex-shrink-0 text-[10px] hidden sm:block">
                              {book.coverImageUrl ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Cover
                                </span>
                              ) : (
                                <span className="text-vibe-ink-muted">Text only</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : isOffline ? (
                      <div className="p-4 text-center text-xs space-y-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                          <WifiOff className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-vibe-ink">You are currently offline</p>
                          <p className="text-[11px] mt-0.5 text-vibe-ink-muted leading-relaxed">
                            Book auto-suggest is unavailable offline. You can still type the author manually below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-vibe-ink-muted">
                        <p>No matching books found.</p>
                        <p className="text-[11px] mt-1 text-vibe-ink-muted/80">You can type the author manually below.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Author Input */}
              <div>
                <label className="block text-[10.5px] font-medium uppercase tracking-wider mb-1 text-vibe-ink-muted/80">
                  Author
                </label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="e.g. Rick Rubin"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Auto-Fetched Cover Preview Card */}
            {coverImageUrl && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-vibe-card-subtle border border-vibe-border flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-16 rounded-lg overflow-hidden border border-vibe-border shadow-md flex-shrink-0 bg-vibe-card">
                    <img
                      src={coverImageUrl}
                      alt={bookTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Edition cover found</span>
                    </div>
                    <p className="text-xs font-bold text-vibe-ink truncate">{bookTitle || 'Selected Book'}</p>
                    <p className="text-[11px] text-vibe-ink-muted truncate">by {bookAuthor || 'Unknown Author'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="text-[11px] font-medium text-rose-500 hover:text-rose-600 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors flex-shrink-0"
                >
                  Remove Cover
                </button>
              </div>
            )}

            {/* Quote Section */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-vibe-ink-muted">
                Favorite Passage or Quote
              </label>
              <textarea
                rows={3}
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="“The object isn't to make art, it's to be in that wonderful state...”"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:outline-none font-display italic font-normal"
              />
            </div>

            {/* Page Number & Tag */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-medium uppercase tracking-wider mb-1 text-vibe-ink-muted/80">
                  Page #
                </label>
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  placeholder="e.g. 19"
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium uppercase tracking-wider mb-1 text-vibe-ink-muted/80">
                  Genre / Tag
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink focus:border-vibe-accent focus:outline-none"
                >
                  <option value="Creativity">Creativity</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Memoir">Memoir</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Poetry">Poetry</option>
                </select>
              </div>
            </div>

            {/* Star Rating */}
            {postType === 'finished_book' && (
              <div>
                <label className="block text-[10.5px] font-medium uppercase tracking-wider mb-1 text-vibe-ink-muted/80">
                  Your Rating
                </label>
                <div className="flex items-center gap-2 text-vibe-secondary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'opacity-25'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection / Thoughts */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-vibe-ink-muted">
                Your Thoughts & Reflections
              </label>
              <textarea
                rows={3}
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
                placeholder="What made this passage stay with you?"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-vibe-border bg-vibe-card-subtle text-vibe-ink placeholder:text-vibe-ink-muted focus:border-vibe-accent focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vibe-border mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-medium text-vibe-ink-muted hover:text-vibe-ink transition-colors"
          >
            Cancel
          </button>
          <button
            form="create-post-form"
            type="submit"
            className="min-h-[44px] px-6 py-2.5 text-xs sm:text-sm font-medium rounded-full bg-vibe-accent hover:bg-vibe-accent-hover text-white shadow-xs transition-colors active:scale-95"
          >
            Publish Moment
          </button>
        </div>

      </div>
    </div>
  );
};
