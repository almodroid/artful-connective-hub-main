
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";

// Define post type
export interface Post {
  id: string;
  title?: string;
  content: string;
  media_urls: string[];
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
      // Handle media uploads (images or GIF)
      let mediaUrls: string[] = [];
      let mediaType: 'images' | 'gif' | null = null;

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

          const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(filePath, image);

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

      // Create post record
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title,
          content,
          media_urls: mediaUrls,
          media_type: mediaType,
          link,
          tags,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newPost: Post = {
        ...data,
        likes_count: 0,
        comments_count: 0,
        user: {
          username: profileData?.username || "unknown",
          display_name: profileData?.display_name || "Unknown User",
          avatar_url: profileData?.avatar_url || undefined,
        },
      };

      return newPost;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    } finally {
      setUploading(false);
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

  // Like a post
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

      // Add like to post_likes table
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

      // Optimistically update likes count
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts) =>
        oldPosts?.map((post) =>
          post.id === postId ? { ...post, likes_count: (post.likes_count || 0) + 1 } : post
        ) || []
      );

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  };

  // Mutation hook for liking a post
  const likePostMutation = useMutation({
    mutationFn: likePost,
    onError: (error: Error) => {
      toast.error(`Failed to like post: ${error.message}`);
    },
  });

  return {
    posts,
    isLoading,
    error,
    uploading,
    createPost: createPostMutation.mutateAsync,
    likePost: likePostMutation.mutateAsync,
  };
}
