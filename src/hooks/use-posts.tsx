import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";
import { formatTag } from '@/utils/tag-utils';

// Define post type
export interface Post {
  id: string;
  title?: string;
  content: string;
  media_urls: string[];
  media_type?: 'images' | 'video' | 'gif' | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  likes_count?: number;
  comments_count?: number;
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface PostWithUser {
  id: string;
  title?: string;
  content: string;
  media_urls?: string[];
  media_type?: 'images' | 'video' | 'gif' | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface CreatePostInput {
  content: string;
  images?: File[];
  videos?: File[];
  gifUrl?: string | null;
  link?: string;
  title?: string;
  tags?: string[];
}

export function usePosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch all posts
  const fetchPosts = async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    // Transform the data to match our Post interface
    return (data || []).map((post) => {
      const profile = post.profiles || {};
      
      return {
        ...post,
        title: post.title || "",
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        user: {
          username: (profile as any).username || "unknown",
          display_name: (profile as any).display_name || "Unknown User",
          avatar_url: (profile as any).avatar_url || undefined,
        },
      };
    });
  };

  // Create new post
  const createPost = async ({
    content, 
    images, 
    videos,
    gifUrl,
    link,
    title = "",
    tags = []
  }: CreatePostInput): Promise<Post | null> => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return null;
    }

    try {
      // Handle media uploads (images, videos or GIF)
      let mediaUrls: string[] = [];
      let mediaType: 'images' | 'video' | 'gif' | null = null;

      if (images && images.length > 0) {
        setUploading(true);
        mediaType = 'images';

        // Check if the bucket exists
        const { data: bucketExists } = await supabase.storage.getBucket("posts");
        if (!bucketExists) {
          await supabase.storage.createBucket("posts", {
            public: true,
          });
        }

        // Upload all images
        for (const image of images) {
          const fileExt = image.name.split(".").pop();
          const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

          // Convert image file to ArrayBuffer for direct upload
          const arrayBuffer = await image.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(filePath, arrayBuffer, {
              contentType: image.type,  // Set the correct content type
              cacheControl: "3600",
              upsert: false
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage.from("posts").getPublicUrl(filePath);
          mediaUrls.push(data.publicUrl);
        }
      } else if (videos && videos.length > 0) {
        setUploading(true);
        mediaType = 'video';

        // Check if the bucket exists
        const { data: bucketExists } = await supabase.storage.getBucket("posts");
        if (!bucketExists) {
          await supabase.storage.createBucket("posts", {
            public: true,
          });
        }

        // Upload all videos
        for (const video of videos) {
          const fileExt = video.name.split(".").pop();
          const filePath = `${user.id}/videos/${uuidv4()}.${fileExt}`;

          // Convert video file to ArrayBuffer for direct upload
          const arrayBuffer = await video.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(filePath, arrayBuffer, {
              contentType: video.type,  // Set the correct content type
              cacheControl: "3600",
              upsert: false
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage.from("posts").getPublicUrl(filePath);
          mediaUrls.push(data.publicUrl);
        }
      } else if (gifUrl) {
        mediaType = 'gif';
        mediaUrls = [gifUrl];
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
      }

      // Create post record (without tags array)
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          title,
          content,
          media_urls: mediaUrls,
          media_type: mediaType,
          link,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Handle tags using normalized system
      if (tags.length > 0) {
        const tagPromises = tags.map(async (tagName) => {
          // Normalize tag name
          const normalizedTag = tagName.toLowerCase().trim();
          
          // Insert or get tag
          const { data: tag, error: tagError } = await supabase
            .from("tags")
            .upsert({
              name: normalizedTag,
              type: "post"
            }, {
              onConflict: 'name,type'
            })
            .select()
            .single();

          if (tagError) throw tagError;

          // Create post-tag relationship
          const { error: relationError } = await supabase
            .from("posts_tags")
            .insert({
              post_id: post.id,
              tag_id: tag.id
            });

          if (relationError) throw relationError;
        });

        await Promise.all(tagPromises);
      }

      return post;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  };

  // Use React Query for data fetching
  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  // Mutation hook for creating a post
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Invalidate and refetch posts after successful creation
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });

  // Like or unlike a post
  const likePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a post");
      return;
    }

    try {
      // First check if post exists
      const { count, error: checkError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("id", postId);
        
      if (checkError) {
        console.error("Error checking post existence:", checkError);
        return;
      }

      if (count === 0) {
        console.error("Post not found");
        return;
      }

      // Check if the user has already liked this post
      const { data: existingLike, error: likeCheckError } = await supabase
        .from("post_likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (likeCheckError) {
        console.error("Error checking like status:", likeCheckError);
        return;
      }

      let likeDelta = 0;
      
      if (existingLike) {
        // User already liked the post, so unlike it
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
          
        if (error) {
          console.error("Error unliking post:", error);
          throw error;
        }
        
        likeDelta = -1;
      } else {
        // User hasn't liked the post yet, so like it
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id
          });
          
        if (error) {
          console.error("Error liking post:", error);
          throw error;
        }
        
        likeDelta = 1;
      }

      // Optimistically update likes count
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts) =>
        oldPosts?.map((post) => {
          if (post.id === postId) {
            const newCount = Math.max(0, (post.likes_count || 0) + likeDelta);
            return { ...post, likes_count: newCount };
          }
          return post;
        }) || []
      );

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error) {
      console.error("Error toggling post like:", error);
      toast.error("Failed to update post like status");
    }
  };

  // Mutation hook for liking a post
  const likePostMutation = useMutation({
    mutationFn: likePost,
    onError: (error: Error) => {
      toast.error(`Failed to like post: ${error.message}`);
    },
  });

  // Add these functions to usePosts hook
  const getTopTags = async (limit = 10) => {
    const { data, error } = await supabase
      .from("tags")
      .select(`
        name,
        posts_tags (count)
      `)
      .eq("type", "post")
      .order("posts_tags.count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching top tags:", error);
      return [];
    }

    return data;
  };

  const getPostsByTag = async (tagName: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        ),
        posts_tags!inner (
          tags!inner (
            name
          )
        )
      `)
      .eq("posts_tags.tags.name", tagName)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts by tag:", error);
      return [];
    }

    return data;
  };

  return {
    posts,
    isLoading,
    error,
    uploading,
    createPost: createPostMutation.mutateAsync,
    likePost: likePostMutation.mutateAsync,
    getTopTags,
    getPostsByTag,
  };
}
