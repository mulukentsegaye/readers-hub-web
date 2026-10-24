export type RankTier = 
  | 'Novice Reader'
  | 'Bookworm'
  | 'Avid Reader'
  | 'Literary Scholar'
  | 'Master of Tomes';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  subtitle?: string;
  bio?: string;
  location?: string;
  favoriteGenres?: string[];
  currentlyReadingBook?: string;
  currentlyReadingAuthor?: string;
  currentlyReadingProgress?: number;
  followersCount?: number;
  followingCount?: number;
  isPrivate?: boolean;
  joinedDate?: string;
  totalMinutesRead: number;
  currentStreak: number;
  dailyGoalMinutes: number;
  rankTier: RankTier;
  bookshelfCount: number;
  savedPassagesCount: number;
}

export type PostType = 'passage' | 'finished_book' | 'recommendation';

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  actionText: string; // e.g. "shared a passage", "finished a book"
  timeAgo: string;    // e.g. "2 hours ago"
  tag: string;        // e.g. "Creativity", "Fiction"
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string;
  coverBgColor?: string;
  quoteText?: string;
  pageNumber?: number | string;
  recommendationText?: string;
  rating?: number;    // 1 - 5 stars
  upvotesCount: number;
  commentsCount: number;
  isUpvoted?: boolean;
  isSaved?: boolean;
  postType: PostType;
  createdAt: string;
}

export interface ConsistentReader {
  userId: string;
  username: string;
  fullName: string;
  initials: string;
  avatarUrl?: string;
  dailyGoalMinutes: number;
  todayMinutesRead: number;
  goalCompletionPercent: number; // e.g. 100, 115
  currentStreak: number;          // e.g. 14 for 14d streak
  isCurrentlyReading: boolean;
  currentlyReadingBook?: string;
  currentlyReadingAuthor?: string;
  bookmarksReceived: number;
  isCurrentUser?: boolean;
}

export interface LiveCoReader {
  userId: string;
  username: string;
  fullName: string;
  initials: string;
  avatarUrl?: string;
  bookTitle: string;
  bookAuthor?: string;
  sessionStartedMinutesAgo: number;
  isCurrentUser?: boolean;
}

export interface WeeklyCuratorInsight {
  id: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  bookTitle: string;
  bookAuthor: string;
  quoteOrInsight: string;
  actionableApplication?: string; // "How I'm Applying This"
  savedCount: number;             // bookmarks/saves received
  createdAt: string;
}

export interface PrivateInsight {
  id: string;
  userId?: string;
  bookTitle: string;
  bookAuthor?: string;
  quoteOrInsight: string;
  actionableApplication?: string;
  createdAt: string;
}

export interface LeaderboardEntry extends ConsistentReader {
  rank?: number;
  minutesRead?: number;
  formattedTime?: string;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookTitle: string;
  bookAuthor?: string;
  durationMinutes: number;
  durationSeconds: number;
  sessionDate: string;
  createdAt: string;
}

export interface TimerSessionData {
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string;
  pageNote?: string;
}

export interface BookDetailsData {
  title: string;
  author: string;
  coverImageUrl?: string;
  firstPublishYear?: number;
  workKey?: string;
  isbn?: string;
  description?: string;
  subjects?: string[];
  pageCount?: number;
  ratingAverage?: number;
  telegramMessageId?: number | string;
}

export interface BookSummaryData {
  bookTitle: string;
  bookAuthor: string;
  readTimeMinutes: number;
  oneSentenceTakeaway: string;
  keyIdeas: Array<{
    title: string;
    description: string;
  }>;
  fullSummaryMarkdown: string;
  notableQuotes: string[];
  generatedAt?: string;
  cached?: boolean;
}

