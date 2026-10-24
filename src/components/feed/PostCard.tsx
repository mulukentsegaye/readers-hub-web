import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  MoreHorizontal, 
  Star, 
  BookOpen, 
  Copy, 
  Check, 
  Timer, 
  Share2, 
  Trash2 
} from 'lucide-react';
import { Post } from '../../types';
import { useFeedStore } from '../../stores/feedStore';
import { useAuthStore } from '../../stores/authStore';
import { useNoticeStore, toast } from '../../stores/noticeStore';
import { AnimatedCounter } from '../ui/AnimatedCounter';

interface PostCardProps {
  post: Post;
  onSelectBookForTimer?: (title: string, author: string, cover?: string) => void;
  onViewBookDetails?: (title: string, author: string, cover?: string) => void;
}

// Deterministic cover color from book title
function bookCoverColor(title: string): string {
  const colors = [
    '#1a3a4a', '#2d4a3e', '#3a2d4a', '#4a2d2d', '#2d3a4a',
    '#3a4a2d', '#4a3a2d', '#2d2d4a', '#4a2d3a', '#3a2d3a',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % colors.length;
  }
  return colors[Math.abs(hash)];
}

function bookCoverAccent(title: string): string {
  const accents = [
    '#7fb5c8', '#7dc4a0', '#a697c8', '#c87a7a', '#7a97c8',
    '#a0c87a', '#c8a07a', '#7a7ac8', '#c87aa0', '#a07ac8',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % accents.length;
  }
  return accents[Math.abs(hash)];
}

export const PostCard: React.FC<PostCardProps> = ({ post, onSelectBookForTimer, onViewBookDetails }) => {
  const { toggleUpvote, toggleSave, deletePost } = useFeedStore();
  const { user } = useAuthStore();
  const [isBouncing, setIsBouncing] = useState(false);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const coverBg = bookCoverColor(post.bookTitle);
  const coverAccent = bookCoverAccent(post.bookTitle);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 480);

    if (!post.isUpvoted) {
      setShowPlusOne(true);
      setTimeout(() => setShowPlusOne(false), 700);
    }
    toggleUpvote(post.id, user?.id);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const citation = `"${post.quoteText || post.bookTitle}"\n— ${post.bookTitle} by ${post.bookAuthor}${post.pageNumber ? ` (p. ${post.pageNumber})` : ''}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(citation);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      toast.success(`Copied passage from "${post.bookTitle}" to clipboard.`, 'Copied to Clipboard');
    } else {
      toast.info(citation, 'Passage');
    }
    setIsMenuOpen(false);
  };

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onSelectBookForTimer) {
      onSelectBookForTimer(post.bookTitle, post.bookAuthor, post.coverImageUrl);
      toast.success(`Loaded "${post.bookTitle}" into your reading timer session.`, 'Timer Ready');
    }
  };

  const handleViewBookDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onViewBookDetails) {
      onViewBookDetails(post.bookTitle, post.bookAuthor, post.coverImageUrl);
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    toggleSave(post.id, user?.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const textToShare = `"${post.quoteText || post.bookTitle}" — ${post.bookTitle} by ${post.bookAuthor}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Passage from ${post.bookTitle}`,
          text: textToShare,
          url: window.location.href,
        });
        return;
      } catch {
        // Ignored if user dismissed native share sheet
      }
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`${textToShare}\n${window.location.href}`);
      toast.success('Passage and app link copied to clipboard.', 'Share Ready');
    }
  };

  const isOwnPost = Boolean(
    user?.id && (user.id === post.userId || post.authorName === user.fullName)
  );

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    useNoticeStore.getState().showAlertModal({
      type: 'warning',
      title: 'Delete this passage?',
      message: `Are you sure you want to remove your shared note for "${post.bookTitle}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      onConfirm: () => {
        deletePost(post.id, user?.id);
      },
    });
  };

  return (
    <article className="bg-vibe-card border border-vibe-border rounded-2xl relative shadow-soft hover:shadow-float transition-shadow duration-200 group">

      {/* Author header */}
      <div className="flex items-center justify-between px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-vibe-border"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans text-[13.5px] font-medium text-vibe-ink truncate">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[11px] text-vibe-ink-muted">{post.timeAgo}</span>
              <span className="text-vibe-border">·</span>
              <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-vibe-accent bg-vibe-accent-subtle px-2 py-0.5 rounded-full">
                {post.tag}
              </span>
            </div>
          </div>
        </div>

        {/* Three dots overflow menu with Copy and contextual passage actions */}
        <div className="relative flex-shrink-0 ml-2">
          <button
            ref={buttonRef}
            type="button"
            aria-label="Passage options"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            title="More options"
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isMenuOpen
                ? 'bg-vibe-card-subtle text-vibe-ink'
                : 'text-vibe-ink-muted hover:text-vibe-ink hover:bg-vibe-card-subtle'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {/* Floating Dropdown Options Menu */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              role="menu"
              aria-label="Passage options menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-vibe-card border border-vibe-border shadow-elevated p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 select-none text-left"
            >
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-vibe-ink-muted">
                Passage Options
              </div>

              {/* 1. Copy Passage */}
              <button
                type="button"
                role="menuitem"
                onClick={handleCopy}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center justify-between text-vibe-ink cursor-pointer group/item"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {hasCopied ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-vibe-ink-muted group-hover/item:text-vibe-ink flex-shrink-0" />
                  )}
                  <span className="truncate">{hasCopied ? 'Copied to Clipboard!' : 'Copy Passage'}</span>
                </div>
                <span className="text-[10px] font-mono text-vibe-ink-muted ml-2">⌘C</span>
              </button>

              {/* 2. Read with Timer */}
              {onSelectBookForTimer && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleStartTimer}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center gap-2.5 text-vibe-ink cursor-pointer group/item"
                >
                  <Timer className="w-4 h-4 text-vibe-ink-muted group-hover/item:text-vibe-accent flex-shrink-0" />
                  <span className="truncate">Read with Timer</span>
                </button>
              )}

              {/* 3. View Book Details */}
              {onViewBookDetails && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleViewBookDetails}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center gap-2.5 text-vibe-ink cursor-pointer group/item"
                >
                  <BookOpen className="w-4 h-4 text-vibe-ink-muted group-hover/item:text-vibe-accent flex-shrink-0" />
                  <span className="truncate">View Book Details</span>
                </button>
              )}

              {/* 4. Bookmark / Save to Sanctuary */}
              <button
                type="button"
                role="menuitem"
                onClick={handleToggleBookmark}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center gap-2.5 text-vibe-ink cursor-pointer group/item"
              >
                <Bookmark
                  className={`w-4 h-4 flex-shrink-0 ${
                    post.isSaved
                      ? 'fill-vibe-accent text-vibe-accent'
                      : 'text-vibe-ink-muted group-hover/item:text-vibe-ink'
                  }`}
                />
                <span className="truncate">{post.isSaved ? 'Remove from Saved' : 'Save to Sanctuary'}</span>
              </button>

              {/* 5. Share Passage */}
              <button
                type="button"
                role="menuitem"
                onClick={handleShare}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-vibe-card-subtle transition-colors flex items-center gap-2.5 text-vibe-ink cursor-pointer group/item"
              >
                <Share2 className="w-4 h-4 text-vibe-ink-muted group-hover/item:text-vibe-ink flex-shrink-0" />
                <span className="truncate">Share Passage</span>
              </button>

              {/* 6. Delete Post (if author) */}
              {isOwnPost && (
                <>
                  <div className="my-1 border-t border-vibe-border-subtle" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDeletePost}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Delete Passage</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Book + Quote block */}
      <div className="px-3.5 sm:px-5 pt-3 sm:pt-4">
        <div className="flex gap-3 sm:gap-4 items-stretch">

          {/* Book cover & info trigger */}
          <div
            className="flex-shrink-0 w-[72px] cursor-pointer group/cover"
            onClick={() => onViewBookDetails?.(post.bookTitle, post.bookAuthor, post.coverImageUrl)}
            title={`View "${post.bookTitle}" details`}
          >
            {post.coverImageUrl ? (
              <div className="relative w-[72px] h-[100px] rounded-lg overflow-hidden shadow-md ring-1 ring-black/10 group-hover/cover:shadow-lg transition-shadow duration-300">
                <img
                  src={post.coverImageUrl}
                  alt={post.bookTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="relative w-[72px] h-[100px] rounded-lg shadow-md ring-1 ring-black/10 flex flex-col items-center justify-between p-2.5 group-hover/cover:shadow-lg transition-shadow duration-300 overflow-hidden"
                style={{ backgroundColor: coverBg }}
              >
                {/* Spine line */}
                <div className="absolute left-2 top-0 bottom-0 w-px opacity-30" style={{ backgroundColor: coverAccent }} />
                <span className="text-[9px] font-semibold tracking-wide text-center leading-tight line-clamp-3 z-10" style={{ color: coverAccent }}>
                  {post.bookTitle.toUpperCase()}
                </span>
                <span className="text-[8px] opacity-60 text-center z-10" style={{ color: coverAccent }}>
                  {post.bookAuthor}
                </span>
              </div>
            )}
            <p
              className="text-[10px] text-vibe-ink-muted group-hover/cover:text-vibe-accent text-center mt-1.5 leading-tight line-clamp-2 transition-colors cursor-pointer block w-full group-hover/cover:underline"
            >
              {post.bookTitle}
            </p>
          </div>

          {/* Quote block */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              {/* Opening mark */}
              <span className="font-display text-2xl leading-none text-vibe-accent/40 block -mb-1 select-none" aria-hidden>
                "
              </span>
              <blockquote className="font-display italic font-normal text-base sm:text-[18px] text-vibe-ink leading-relaxed break-words">
                {post.quoteText}
              </blockquote>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-vibe-border-subtle">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-vibe-ink-muted" strokeWidth={1.75} />
                <span className="text-[11px] text-vibe-ink-muted font-medium truncate max-w-[120px] sm:max-w-[180px]">
                  {post.bookAuthor}
                </span>
              </div>
              {post.pageNumber && (
                <span className="font-mono text-[11px] text-vibe-ink-muted flex-shrink-0">
                  p.{post.pageNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Star rating */}
      {post.rating && (
        <div className="px-3.5 sm:px-5 pt-2.5 sm:pt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < (post.rating || 0) ? 'fill-vibe-secondary text-vibe-secondary' : 'text-vibe-border'}`}
              strokeWidth={1.5}
            />
          ))}
          <span className="ml-1.5 font-mono text-xs font-medium text-vibe-ink-muted">{post.rating}.0</span>
        </div>
      )}

      {/* Recommendation text */}
      {post.recommendationText && (
        <div className="px-3.5 sm:px-5 pt-2.5 sm:pt-3">
          <p className="text-xs sm:text-sm text-vibe-ink-secondary leading-relaxed">
            {post.recommendationText}
          </p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-3.5 sm:px-5 pt-2.5 sm:pt-3 pb-3 sm:pb-3.5 mt-1 border-t border-vibe-border-subtle">
        <div className="flex items-center gap-1">
          {/* Heart / upvote with Spring Bounce & Animated Counter */}
          <button
            onClick={handleUpvote}
            aria-label="Like post"
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-90 ${
              post.isUpvoted
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'
                : 'text-vibe-ink-muted hover:bg-vibe-card-subtle hover:text-vibe-ink'
            }`}
          >
            {/* Spring Bounce Heart Icon */}
            <span className={`inline-flex items-center justify-center ${isBouncing ? 'animate-spring-bounce' : ''}`}>
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${post.isUpvoted ? 'fill-current' : ''}`}
                strokeWidth={1.75}
              />
            </span>

            {/* Animated Counter Transition */}
            <AnimatedCounter value={post.upvotesCount} />

            {/* Floating +1 Pop Badge */}
            {showPlusOne && (
              <span className="absolute -top-3.5 left-3 text-[10px] font-bold text-rose-500 dark:text-rose-400 pointer-events-none animate-float-badge select-none">
                +1
              </span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={() => toast.info(`Community discussion threads for "${post.bookTitle}" are opening soon!`, 'Discussion')}
            aria-label="Comment"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-vibe-ink-muted hover:bg-vibe-card-subtle hover:text-vibe-ink transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{post.commentsCount}</span>
          </button>
        </div>

        {/* Save */}
        <button
            onClick={() => toggleSave(post.id, user?.id)}
          aria-label="Save passage"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            post.isSaved
              ? 'bg-vibe-accent-subtle text-vibe-accent'
              : 'text-vibe-ink-muted hover:bg-vibe-card-subtle hover:text-vibe-ink'
          }`}
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${post.isSaved ? 'fill-current' : ''}`}
            strokeWidth={1.75}
          />
          <span>{post.isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

    </article>
  );
};
