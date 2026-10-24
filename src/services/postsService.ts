import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Post } from '../types';
import { DEFAULT_USER_AVATAR } from '../data/defaults';

interface FetchPostsOptions {
  currentUserId?: string;
  sortBy?: 'latest' | 'top';
  tag?: string;
}

export const postsService = {
  /**
   * Fetch community posts from Supabase with author profile data
   */
  async getPosts(options: FetchPostsOptions = {}): Promise<Post[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `);

    if (options.tag && options.tag !== 'All') {
      query = query.eq('tag', options.tag);
    }

    if (options.sortBy === 'top') {
      query = query.order('upvotes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to fetch posts from Supabase:', error.message);
      throw error;
    }

    if (!data) return [];

    // If user is authenticated, query their upvotes and saves for quick flag lookup
    let upvotedPostIds = new Set<string>();
    let savedPostIds = new Set<string>();

    if (options.currentUserId) {
      const [upvotesRes, savesRes] = await Promise.all([
        supabase.from('post_upvotes').select('post_id').eq('user_id', options.currentUserId),
        supabase.from('saved_posts').select('post_id').eq('user_id', options.currentUserId),
      ]);

      if (upvotesRes.data) {
        upvotedPostIds = new Set(upvotesRes.data.map((r) => r.post_id));
      }
      if (savesRes.data) {
        savedPostIds = new Set(savesRes.data.map((r) => r.post_id));
      }
    }

    return data.map((item: any): Post => {
      const profile = item.profiles;
      const createdAtDate = new Date(item.created_at);
      const timeDiffMinutes = Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60));
      
      let timeAgo = 'Just now';
      if (timeDiffMinutes >= 1440) {
        timeAgo = `${Math.floor(timeDiffMinutes / 1440)}d ago`;
      } else if (timeDiffMinutes >= 60) {
        timeAgo = `${Math.floor(timeDiffMinutes / 60)}h ago`;
      } else if (timeDiffMinutes > 1) {
        timeAgo = `${timeDiffMinutes}m ago`;
      }

      return {
        id: item.id,
        userId: item.user_id,
        authorName: profile?.full_name || profile?.username || 'Fellow Reader',
        authorAvatar: profile?.avatar_url || DEFAULT_USER_AVATAR,
        actionText: item.post_type === 'finished_book' ? 'finished a book' : 'shared a passage',
        timeAgo,
        tag: item.tag || 'General',
        bookTitle: item.book_title,
        bookAuthor: item.book_author,
        coverImageUrl: item.cover_image_url || undefined,
        quoteText: item.quote_text || undefined,
        pageNumber: item.page_number || undefined,
        recommendationText: item.recommendation_text || undefined,
        rating: item.rating || undefined,
        upvotesCount: item.upvotes_count || 0,
        commentsCount: item.comments_count || 0,
        isUpvoted: upvotedPostIds.has(item.id),
        isSaved: savedPostIds.has(item.id),
        postType: item.post_type,
        createdAt: item.created_at,
      };
    });
  },

  /**
   * Create a new post in Supabase
   */
  async createPost(post: Partial<Post>, userId: string): Promise<Post> {
    const newPostRecord = {
      user_id: userId,
      book_title: post.bookTitle || 'Untitled Book',
      book_author: post.bookAuthor || 'Unknown Author',
      cover_image_url: post.coverImageUrl || null,
      quote_text: post.quoteText || null,
      recommendation_text: post.recommendationText || null,
      page_number: typeof post.pageNumber === 'number' ? post.pageNumber : null,
      rating: post.rating || null,
      tag: post.tag || 'General',
      post_type: post.postType || 'passage',
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(newPostRecord)
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    const profile = (data as any).profiles;
    return {
      id: data.id,
      userId: data.user_id,
      authorName: profile?.full_name || profile?.username || 'You',
      authorAvatar: profile?.avatar_url || DEFAULT_USER_AVATAR,
      actionText: data.post_type === 'finished_book' ? 'finished a book' : 'shared a passage',
      timeAgo: 'Just now',
      tag: data.tag,
      bookTitle: data.book_title,
      bookAuthor: data.book_author,
      coverImageUrl: data.cover_image_url || undefined,
      quoteText: data.quote_text || undefined,
      pageNumber: data.page_number || undefined,
      recommendationText: data.recommendation_text || undefined,
      rating: data.rating || undefined,
      upvotesCount: 0,
      commentsCount: 0,
      isUpvoted: false,
      isSaved: false,
      postType: data.post_type,
      createdAt: data.created_at,
    };
  },

  /**
   * Toggle upvote for a post in Supabase
   */
  async toggleUpvote(postId: string, userId: string): Promise<{ isUpvoted: boolean }> {
    if (!isSupabaseConfigured()) {
      return { isUpvoted: false };
    }

    // Check if currently upvoted
    const { data: existing } = await supabase
      .from('post_upvotes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Remove upvote
      await supabase
        .from('post_upvotes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      return { isUpvoted: false };
    } else {
      // Add upvote
      await supabase
        .from('post_upvotes')
        .insert({ post_id: postId, user_id: userId });
      return { isUpvoted: true };
    }
  },

  /**
   * Toggle bookmark/saved status for a post in Supabase
   */
  async toggleSavePost(postId: string, userId: string): Promise<{ isSaved: boolean }> {
    if (!isSupabaseConfigured()) {
      return { isSaved: false };
    }

    const { data: existing } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      return { isSaved: false };
    } else {
      await supabase
        .from('saved_posts')
        .insert({ post_id: postId, user_id: userId });
      return { isSaved: true };
    }
  },

  /**
   * Subscribe to live Realtime updates on posts table
   */
  subscribeToFeed(onInsertOrUpdate: () => void) {
    if (!isSupabaseConfigured()) return { unsubscribe: () => {} };

    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          onInsertOrUpdate();
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  /**
   * Delete a post authored by the user from Supabase
   */
  async deletePost(postId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return true;
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to delete post from Supabase:', error.message);
      throw error;
    }

    return true;
  },
};
