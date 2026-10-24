import React from 'react';
import { Plus, Sparkles, TrendingUp, Clock, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useFeedStore } from '../../stores/feedStore';
import { getUserAvatar } from '../../utils/avatar';
import { PostCard } from './PostCard';

interface FeedContainerProps {
  searchQuery?: string;
  onOpenCreateModal: () => void;
  onSelectBookForTimer?: (title: string, author: string, cover?: string) => void;
  onViewBookDetails?: (title: string, author: string, cover?: string) => void;
}

export const FeedContainer: React.FC<FeedContainerProps> = ({
  searchQuery = '',
  onOpenCreateModal,
  onSelectBookForTimer,
  onViewBookDetails,
}) => {
  const { user, isGuest, isAuthenticated } = useAuthStore();
  const { posts, feedTab, setFeedTab, sortBy, setSortBy, isLoading } = useFeedStore();

  const filteredPosts = posts.filter((p) => {
    if (feedTab === 'following') {
      // "Following" = your own posts plus posts from authors you interact with.
      return user ? p.userId === user.id : false;
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.bookTitle?.toLowerCase().includes(q);
      const matchAuthor = p.bookAuthor?.toLowerCase().includes(q);
      const matchQuote = p.quoteText?.toLowerCase().includes(q);
      const matchTag = p.tag?.toLowerCase().includes(q);
      const matchCreator = p.authorName?.toLowerCase().includes(q);
      const matchRec = p.recommendationText?.toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchQuote || matchTag || matchCreator || matchRec;
    }

    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'top') {
      return b.upvotesCount - a.upvotesCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const isRealUser = isAuthenticated && !isGuest && !!user?.fullName && user.fullName !== 'Guest Explorer';
  const userFirstName = isRealUser ? user.fullName.trim().split(' ')[0] : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-6">

      {/* Page header */}
      <div className="pt-1 pb-1">
        <p className="font-sans text-[10.5px] font-medium tracking-wider uppercase text-vibe-ink-muted/80 mb-1">
          Today's Reading Feed
        </p>
        <h1 className="font-display text-xl sm:text-3xl font-normal tracking-tight text-vibe-ink leading-tight">
          A good day for a good book.
        </h1>
      </div>

      {/* Share bar / write prompt */}
      <div
        className="bg-vibe-card border border-vibe-border rounded-2xl p-3 sm:p-4 shadow-soft flex items-center gap-2.5 sm:gap-3 hover:border-vibe-accent/30 transition-all group cursor-pointer"
        onClick={onOpenCreateModal}
      >
        <img
          src={getUserAvatar(user)}
          alt={isRealUser ? (user?.fullName ?? 'User avatar') : 'Liread avatar'}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-vibe-border"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-vibe-ink transition-colors truncate">
            {userFirstName ? (
              <>
                What are you reading, <span className="font-medium text-vibe-ink">{userFirstName}</span>?
              </>
            ) : (
              'What are you reading?'
            )}
          </p>
          <p className="text-[11px] sm:text-xs text-vibe-ink-muted mt-0.5 truncate">Share a passage, a rating, or a reflection...</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenCreateModal(); }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-vibe-accent hover:bg-vibe-accent-hover text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Share</span>
        </button>
      </div>

      {/* Feed navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-vibe-card border border-vibe-border rounded-xl p-1 shadow-xs">
          <button
            onClick={() => setFeedTab('for_you')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              feedTab === 'for_you'
                ? 'bg-vibe-accent text-white shadow-xs'
                : 'text-vibe-ink-secondary hover:text-vibe-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span>For you</span>
          </button>
          <button
            onClick={() => setFeedTab('following')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              feedTab === 'following'
                ? 'bg-vibe-accent text-white shadow-xs'
                : 'text-vibe-ink-secondary hover:text-vibe-ink'
            }`}
          >
            <span>Mine</span>
          </button>
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortBy(sortBy === 'latest' ? 'top' : 'latest')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-vibe-ink-secondary hover:text-vibe-ink hover:bg-vibe-card-subtle border border-vibe-border transition-colors"
        >
          {sortBy === 'latest' ? (
            <><Clock className="w-3.5 h-3.5" strokeWidth={1.75} />Latest</>
          ) : (
            <><TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />Top</>
          )}
        </button>
      </div>

      {/* Post stream with Staggered Cascading Entrance */}
      <div key={`${feedTab}-${sortBy}`} className="space-y-4 sm:space-y-5">
        {isLoading && posts.length === 0 && (
          <div className="py-12 text-center text-sm text-vibe-ink-muted">Loading the feed…</div>
        )}

        {!isLoading && sortedPosts.length === 0 && (
          <div className="rounded-3xl p-12 text-center border border-vibe-border bg-vibe-card space-y-3 shadow-soft feed-card-stagger">
            <div className="w-12 h-12 rounded-2xl bg-vibe-accent-subtle text-vibe-accent flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-vibe-ink">
              {searchQuery.trim()
                ? `No results for "${searchQuery}"`
                : feedTab === 'following'
                ? 'Nothing posted yet'
                : 'The feed is empty'}
            </h3>
            <p className="text-xs text-vibe-ink-muted leading-relaxed max-w-sm mx-auto">
              {searchQuery.trim()
                ? 'Try searching for another book title, author, or passage keyword.'
                : feedTab === 'following'
                ? 'Your own reading moments will appear here once you share one.'
                : isGuest
                ? 'No readers have shared yet. Be the first by creating an account.'
                : 'No one has shared a reading moment yet. Share the first passage from the book you are reading.'}
            </p>
            {isGuest && !searchQuery.trim() && (
              <p className="text-[11px] text-vibe-ink-muted">Signing in lets you publish to the community.</p>
            )}
          </div>
        )}

        {sortedPosts.map((post, index) => (
          <div
            key={post.id}
            className="feed-card-stagger"
            style={{ animationDelay: `${Math.min(index * 65, 390)}ms` }}
          >
            <PostCard
              post={post}
              onSelectBookForTimer={onSelectBookForTimer}
              onViewBookDetails={onViewBookDetails}
            />
          </div>
        ))}
      </div>

      {/* End of feed */}
      {sortedPosts.length > 0 && (
        <div className="py-10 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-8 h-px bg-vibe-border" />
            <p className="text-xs text-vibe-ink-muted font-medium">
              You're all caught up — time for another chapter.
            </p>
            <div className="w-8 h-px bg-vibe-border" />
          </div>
        </div>
      )}

    </div>
  );
};
