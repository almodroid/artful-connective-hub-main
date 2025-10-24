import { supabase } from "../integrations/supabase/client";

export const bookmarkService = {
  async addBookmark(userId: string, postId: string) {
    const { data, error } = await supabase
      .from("bookmarked_posts")
      .insert([{ user_id: userId, post_id: postId }]);

    if (error) throw error;
    return data;
  },

  async removeBookmark(userId: string, postId: string) {
    const { data, error } = await supabase
      .from("bookmarked_posts")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (error) throw error;
    return data;
  },

  async isBookmarked(userId: string, postId: string) {
    const { data, error } = await supabase
      .from("bookmarked_posts")
      .select("*")
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (error) throw error;
    return data.length > 0;
  },

  async getBookmarkedPosts(userId: string) {
      const { data: bookmarkedPostIds, error: bookmarkError } = await supabase
        .from("bookmarked_posts")
        .select("post_id")
        .eq("user_id", userId);

      if (bookmarkError) {
        console.error("Error fetching bookmarked post IDs:", bookmarkError);
        throw bookmarkError;
      }

      const postIds = bookmarkedPostIds.map((item) => item.post_id);

      if (postIds.length === 0) {
        return [];
      }

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles(*)
        `)
        .in("id", postIds);

    if (postsError) {
        console.error("Error fetching bookmarked posts:", postsError);
        throw postsError;
      }

      const bookmarkedPosts = postsData.map((post: any) => {
        return {
          id: post.id,
          createdAt: post.created_at,
        content: post.content,
        media_urls: post.media_urls || [],
        user_id: post.user_id,
        user: {
          id: post.profiles.id,
          username: post.profiles.username,
          avatar: post.profiles.avatar_url,
          display_name: post.profiles.display_name
        },
        likes: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        isLiked: false, // Placeholder, will be implemented later
        comments: [], // Placeholder, will be implemented later
        title: post.title,
        updated_at: post.updated_at,
        tags: post.tags || []
      };
    }).filter(Boolean); // Filter out any nulls if a post was not found

    return bookmarkedPosts;
  },
};