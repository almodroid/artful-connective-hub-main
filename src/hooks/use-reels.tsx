import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsApi } from "@/hooks/use-notifications-api";
import { createReelNotification } from "@/services/notification.service";

// Define reel type
export interface Reel {
  id: string;
  caption?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface ReelWithUser {
  id: string;
  caption?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface ReelCommentWithUser {
  id: string;
  reelId: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
}

interface CreateReelInput {
  caption?: string;
  video: File;
  thumbnail?: Blob;
}

const REELS_PER_PAGE = 8;

export function useReels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(0);
  const { sendInteractionNotification } = useNotificationsApi();

  // Fetch all reels with pagination
  const fetchReels = async (): Promise<{ reels: Reel[]; hasMore: boolean }> => {
    const from = page * REELS_PER_PAGE;
    const to = from + REELS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from("reels")
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching reels:", error);
      throw error;
    }

    // Transform the data to match our Reel interface
    const transformedReels = (data || []).map((reel) => {
      const profile = reel.profiles || {};
      
      return {
        ...reel,
        caption: reel.caption || "",
        likes_count: reel.likes_count || 0,
        comments_count: reel.comments_count || 0,
        views_count: reel.views_count || 0,
        user: {
          username: (profile as any).username || "unknown",
          display_name: (profile as any).display_name || "Unknown User",
          avatar_url: (profile as any).avatar_url || undefined,
        },
      };
    });

    return {
      reels: transformedReels,
      hasMore: count ? from + REELS_PER_PAGE < count : false
    };
  };

  // Create new reel
  const createReel = async ({
    caption = "", 
    video,
    thumbnail
  }: CreateReelInput): Promise<Reel | null> => {
    if (!user) {
      toast.error("You must be logged in to create a reel");
      return null;
    }

    try {
      setUploading(true);
      
      // Upload video
      const fileExt = video.name.split(".").pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

      // Try to upload directly first
      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(filePath, video, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        // If upload fails with bucket not found, try to create the bucket
        if (uploadError.message.includes("Bucket not found")) {
          console.log("Reels bucket not found, attempting to create it...");
          const { error: createBucketError } = await supabase.storage.createBucket("reels", {
            public: true,
          });
          
          if (createBucketError) {
            console.error("Error creating reels bucket:", createBucketError);
            toast.error(`Failed to initialize storage: ${createBucketError.message}`);
            setUploading(false);
            return null;
          }

          // Retry upload after bucket creation
          const { error: retryUploadError } = await supabase.storage
            .from("reels")
            .upload(filePath, video, {
              cacheControl: "3600",
              upsert: false
            });

          if (retryUploadError) {
            console.error("Error uploading video after bucket creation:", retryUploadError);
            toast.error(`Failed to upload video: ${retryUploadError.message}`);
            setUploading(false);
            return null;
          }
        } else {
          console.error("Error uploading video:", uploadError);
          if (uploadError.message.includes("duplicate")) {
            toast.error("A reel with this name already exists. Please try again.");
          } else {
            toast.error(`Failed to upload video: ${uploadError.message}`);
          }
          setUploading(false);
          return null;
        }
      }

      // Get the public URL for the uploaded video
      const { data: urlData } = supabase.storage.from("reels").getPublicUrl(filePath);
      if (!urlData?.publicUrl) {
        toast.error("Failed to get video URL. Please try again.");
        setUploading(false);
        return null;
      }
      const videoUrl = urlData.publicUrl;

      // Upload thumbnail if provided
      let thumbnailUrl = "";
      if (thumbnail) {
        const thumbnailPath = `${user.id}/${uuidv4()}.jpg`;
        const { error: thumbnailError } = await supabase.storage
          .from("reel_thumbnails")
          .upload(thumbnailPath, thumbnail, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/jpeg"
          });

        if (thumbnailError) {
          console.error("Error uploading thumbnail:", thumbnailError);
          // Not critical, can continue without thumbnail
        } else {
          const { data: thumbnailUrlData } = supabase.storage
            .from("reel_thumbnails")
            .getPublicUrl(thumbnailPath);
          
          if (thumbnailUrlData?.publicUrl) {
            thumbnailUrl = thumbnailUrlData.publicUrl;
          }
        }
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
        toast.error(`Failed to fetch user data: ${profileError.message}`);
        setUploading(false);
        return null;
      }

      // Create reel record
      const { data: reelData, error: insertError } = await supabase
        .from("reels")
        .insert({
          caption,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating reel record:", insertError);
        // Try to clean up the uploaded video if the database insert fails
        await supabase.storage.from("reels").remove([filePath]);
        toast.error(`Failed to create reel: ${insertError.message}`);
        setUploading(false);
        return null;
      }

      const newReel: Reel = {
        ...reelData,
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        user: {
          username: profileData?.username || "unknown",
          display_name: profileData?.display_name || "Unknown User",
          avatar_url: profileData?.avatar_url || undefined,
        },
      };

      toast.success("Reel created successfully!");
      setUploading(false);
      return newReel;
    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploading(false);
      return null;
    }
  };

  // Like a reel
  const likeReel = async (reelId: string): Promise<void> => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول للإعجاب بالفيديوهات");
      return;
    }

    try {
      // Check if this reel exists
      const { data: reel, error: reelError } = await supabase
        .from("reels")
        .select("user_id")
        .eq("id", reelId)
        .single();

      if (reelError) {
        console.error("Error fetching reel:", reelError);
        throw reelError;
      }

      // Check if already liked
      const { data: existingLike, error: likeCheckError } = await supabase
        .from("reel_likes")
        .select()
        .eq("reel_id", reelId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (likeCheckError) {
        console.error("Error checking like status:", likeCheckError);
        throw likeCheckError;
      }

      if (existingLike) {
        // Already liked, so unlike
        const { error: unlikeError } = await supabase
          .from("reel_likes")
          .delete()
          .eq("reel_id", reelId)
          .eq("user_id", user.id);

        if (unlikeError) {
          console.error("Error unliking reel:", unlikeError);
          throw unlikeError;
        }

        // Don't send notification for unlike action

        // Update local state in React Query cache
        queryClient.setQueryData<{ reels: Reel[]; hasMore: boolean }>(
          ["reels"],
          (old) => {
            if (!old) return { reels: [], hasMore: false };
            
            return {
              ...old,
              reels: old.reels.map(r => 
                r.id === reelId 
                  ? { ...r, likes_count: (r.likes_count || 0) - 1 } 
                  : r
              )
            };
          }
        );
      } else {
        // Not liked yet, add like
        const { error: likeError } = await supabase
          .from("reel_likes")
          .insert({
            reel_id: reelId,
            user_id: user.id
          });

        if (likeError) {
          console.error("Error liking reel:", likeError);
          throw likeError;
        }

        // Send notification if not liking own reel
        if (reel.user_id !== user.id) {
          // Get user info for notification
          const { data: userData } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();

          // Send notification
          try {
            await createReelNotification(
              reel.user_id,
              user.id,
              reelId,
              "like",
              userData?.display_name || user.displayName || "أحد المستخدمين"
            );
          } catch (notifyError) {
            console.error("Error sending like notification:", notifyError);
            // Continue even if notification fails
          }
        }

        // Update local state in React Query cache
        queryClient.setQueryData<{ reels: Reel[]; hasMore: boolean }>(
          ["reels"],
          (old) => {
            if (!old) return { reels: [], hasMore: false };
            
            return {
              ...old,
              reels: old.reels.map(r => 
                r.id === reelId 
                  ? { ...r, likes_count: (r.likes_count || 0) + 1 } 
                  : r
              )
            };
          }
        );
      }

      // Invalidate the specific reel query if it exists
      queryClient.invalidateQueries({ queryKey: ["reel", reelId] });
    } catch (error) {
      console.error("Error in likeReel:", error);
      toast.error("حدث خطأ أثناء تحديث الإعجاب");
    }
  };

  // Increment view count for a reel
  const viewReel = async (reelId: string): Promise<void> => {
    try {
      // Check if the reel exists and get the owner
      const { data: reel, error: reelError } = await supabase
        .from("reels")
        .select("user_id, views_count")
        .eq("id", reelId)
        .single();
      
      if (reelError) {
        console.error("Error fetching reel for view:", reelError);
        return;
      }
      
      // Don't increment views or send notification if viewer is the owner
      if (user && user.id === reel.user_id) {
        console.log("Skipping view increment for owner's own reel");
        return;
      }
      
      // Use the increment_reel_views RPC function
      const { error } = await supabase.rpc('increment_reel_views', {
        reel_id: reelId
      });
      
      if (error) {
        console.error("Error incrementing reel views:", error);
        return;
      }
      
      // Only send notification if we have a logged-in user who isn't the owner
      // and if the reel hasn't been viewed too many times (to avoid notification spam)
      if (user && user.id !== reel.user_id && (reel.views_count || 0) < 50) {
        try {
          // Get user info for notification
          const { data: userData } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();
            
          // Send view notification
          await createReelNotification(
            reel.user_id,
            user.id,
            reelId,
            "view",
            userData?.display_name || user.displayName || "أحد المستخدمين"
          );
        } catch (notifyError) {
          console.error("Error sending view notification:", notifyError);
          // Continue even if notification fails
        }
      }
      
      // Update local cache optimistically
      queryClient.setQueryData<{ reels: Reel[]; hasMore: boolean }>(
        ["reels"],
        (old) => {
          if (!old) return { reels: [], hasMore: false };
          
          return {
            ...old,
            reels: old.reels.map(r => 
              r.id === reelId 
                ? { ...r, views_count: (r.views_count || 0) + 1 } 
                : r
            )
          };
        }
      );
    } catch (error) {
      console.error("Error in viewReel:", error);
    }
  };

  // Fetch comments for a specific reel
  const fetchReelComments = async (reelId: string): Promise<ReelCommentWithUser[]> => {
    const { data, error } = await supabase
      .from("reel_comments")
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("reel_id", reelId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching reel comments:", error);
      throw error;
    }

    // Transform the data to match our ReelCommentWithUser interface
    const transformedComments = (data || []).map((comment) => {
      const profile = comment.profiles || {};
      
      return {
        id: comment.id,
        reelId: comment.reel_id,
        content: comment.content,
        createdAt: new Date(comment.created_at),
        user: {
          id: comment.user_id,
          username: (profile as any).username || "unknown",
          displayName: (profile as any).display_name || "Unknown User",
          avatar: (profile as any).avatar_url || "",
        },
      };
    });

    return transformedComments;
  };

  // Add a comment to a reel
  const addReelComment = async (reelId: string, content: string): Promise<void> => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول للتعليق");
      return;
    }

    try {
      // Check if this reel exists and get owner ID
      const { data: reel, error: reelError } = await supabase
        .from("reels")
        .select("user_id, comments_count")
        .eq("id", reelId)
        .single();

      if (reelError) {
        console.error("Error fetching reel:", reelError);
        throw reelError;
      }

      // Create comment
      const { data, error } = await supabase
        .from("reel_comments")
        .insert({
          reel_id: reelId,
          user_id: user.id,
          content
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding comment:", error);
        throw error;
      }

      // Send notification if not commenting on own reel
      if (reel.user_id !== user.id) {
        // Get user info for notification
        const { data: userData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        // Send notification
        try {
          await createReelNotification(
            reel.user_id,
            user.id,
            reelId,
            "comment",
            userData?.display_name || user.displayName || "أحد المستخدمين"
          );
        } catch (notifyError) {
          console.error("Error sending comment notification:", notifyError);
          // Continue even if notification fails
        }
      }

      // Update comments count in the reel
      const { error: updateError } = await supabase
        .from("reels")
        .update({
          comments_count: (reel.comments_count || 0) + 1
        })
        .eq("id", reelId);

      if (updateError) {
        console.error("Error updating comments count:", updateError);
        // Don't throw, just log the error
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["reel", reelId] });
      queryClient.invalidateQueries({ queryKey: ["reel-comments", reelId] });
    } catch (error) {
      console.error("Error in addReelComment:", error);
      toast.error("Failed to add comment. Please try again.");
      throw error;
    }
  };

  // Delete a comment
  const deleteReelComment = async (commentId: string, reelId: string): Promise<void> => {
    if (!user) {
      toast.error("You must be logged in to delete a comment");
      return;
    }

    try {
      const { error } = await supabase
        .from("reel_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment. Please try again.");
        return;
      }

      // Invalidate queries to refresh comments
      queryClient.invalidateQueries({ queryKey: ["reelComments", reelId] });
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error in deleteReelComment:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Use React Query for data fetching
  const {
    data: reelsData = { reels: [], hasMore: false },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reels", page],
    queryFn: fetchReels,
  });

  // Use React Query to fetch comments for a specific reel
  const useReelComments = (reelId: string) => {
    const { 
      data: comments = [], 
      isLoading: commentsLoading,
      isError: commentsError,
      refetch: refetchComments
    } = useQuery({
      queryKey: ["reelComments", reelId],
      queryFn: () => fetchReelComments(reelId),
      enabled: !!reelId,
    });

    return {
      comments,
      commentsLoading,
      commentsError,
      refetchComments
    };
  };

  // Mutation hook for creating a reel
  const createReelMutation = useMutation({
    mutationFn: createReel,
    onSuccess: () => {
      // Invalidate and refetch reels after successful creation
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      toast.success("Reel created successfully!");
    },
    onError: (error: Error) => {
      console.error("Error creating reel:", error);
      toast.error("Failed to create reel");
    },
  });

  // Add a function to check if a specific reel is liked by the current user
  const checkIfReelLiked = async (reelId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("reel_likes")
        .select()
        .eq("reel_id", reelId)
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking if reel is liked:", error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error("Error in checkIfReelLiked:", error);
      return false;
    }
  };

  // Load more reels
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Delete a reel owned by the user
  const deleteReel = async (reelId: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to delete a reel");
      return false;
    }

    try {
      // First check if the user owns this reel
      const { data: reelData, error: checkError } = await supabase
        .from("reels")
        .select("user_id, video_url")
        .eq("id", reelId)
        .single();

      if (checkError) {
        console.error("Error checking reel ownership:", checkError);
        toast.error("Could not verify reel ownership");
        return false;
      }

      if (reelData.user_id !== user.id) {
        toast.error("You can only delete your own reels");
        return false;
      }

      // Delete the reel from the database
      const { error: deleteError } = await supabase
        .from("reels")
        .delete()
        .eq("id", reelId);

      if (deleteError) {
        console.error("Error deleting reel:", deleteError);
        toast.error("Failed to delete reel");
        return false;
      }

      // Try to delete the video file from storage
      if (reelData.video_url) {
        // Extract the path from the URL
        const videoPath = reelData.video_url.split('/').slice(-2).join('/');
        if (videoPath) {
          await supabase.storage
            .from("reels")
            .remove([videoPath]);
        }
      }

      // Invalidate queries to refresh the reels list
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      
      toast.success("Reel deleted successfully");
      return true;
    } catch (error) {
      console.error("Error in deleteReel:", error);
      toast.error("Something went wrong. Please try again.");
      return false;
    }
  };

  // Report a reel
  const reportReel = async (reelId: string, reason: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to report a reel");
      return false;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for reporting");
      return false;
    }

    try {
      // Check if the user has already reported this reel
      const { data: existingReport, error: checkError } = await supabase
        .from("reel_reports")
        .select()
        .eq("reel_id", reelId)
        .eq("reporter_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing report:", checkError);
        toast.error("Could not check report status");
        return false;
      }

      if (existingReport) {
        toast.info("You have already reported this reel");
        return false;
      }

      // Create a report
      const { error: reportError } = await supabase
        .from("reel_reports")
        .insert({
          reel_id: reelId,
          reporter_id: user.id,
          reason: reason.trim(),
          status: "pending"
        });

      if (reportError) {
        console.error("Error reporting reel:", reportError);
        toast.error("Failed to report reel");
        return false;
      }

      toast.success("Reel reported successfully. Our team will review it.");
      return true;
    } catch (error) {
      console.error("Error in reportReel:", error);
      toast.error("Something went wrong. Please try again.");
      return false;
    }
  };

  return {
    reels: reelsData.reels,
    hasMore: reelsData.hasMore,
    isLoading,
    error,
    createReel: createReelMutation.mutate,
    likeReel,
    viewReel,
    uploading,
    checkIfReelLiked,
    loadMore,
    addReelComment,
    deleteReelComment,
    useReelComments,
    deleteReel,
    reportReel,
  };
}