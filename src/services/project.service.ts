import { supabase } from "@/integrations/supabase/client";
import { Project, CreateProjectInput, ProjectDetails } from "@/types/project.types";
import { toast } from "sonner";
import { createProjectNotification } from "./notification.service";

// Extended project type with user information
export interface ProjectWithUser extends Project {
  user: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

// Fetch all projects with user information
export const fetchProjects = async (): Promise<ProjectWithUser[]> => {
  try {
    const { data, error } = await supabase
      .from("projects")
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
      console.error("Error fetching projects:", error);
      throw error;
    }

    // Explicitly type the mapped result to ProjectWithUser[]
    const projectsWithUser: ProjectWithUser[] = data.map(project => {
      // Ensure profile data is handled safely
      const profileData = project.profiles as { username?: string; display_name?: string; avatar_url?: string } | null;
      
      return {
        id: project.id,
        title: project.title,
        description: project.description || "",
        tags: project.tags || [],
        image_url: project.image_url || "",
        cover_image_url: project.cover_image_url || "",
        // Explicitly cast content_blocks to any[] if it exists, otherwise default to empty array
        content_blocks: (project.content_blocks as any[] | null) || [],
        external_link: project.external_link || null,
        views: project.views || 0,
        user_id: project.user_id,
        created_at: project.created_at || new Date().toISOString(),
        updated_at: project.updated_at || new Date().toISOString(),
        user: {
          username: profileData?.username || "",
          display_name: profileData?.display_name || "",
          avatar_url: profileData?.avatar_url || ""
        }
      };
    });
    
    return projectsWithUser;
  } catch (error) {
    console.error("Error in fetchProjects:", error);
    return [];
  }
};

// Fetch a single project by ID
export const fetchProjectById = async (id: string): Promise<ProjectDetails | null> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      throw error;
    }

    if (!data) return null;

    const profile = data.profiles || {};
    return {
      id: data.id,
      title: data.title,
      description: data.description || "",
      tags: data.tags || [],
      image_url: data.image_url || "",
      cover_image_url: data.cover_image_url || "",
      content_blocks: (Array.isArray(data.content_blocks) ? data.content_blocks : []) as any[],
      external_link: data.external_link || null,
      views: data.views || 0,
      user_id: data.user_id,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      user: {
        username: (profile as any)?.username || "",
        display_name: (profile as any)?.display_name || "",
        avatar_url: (profile as any)?.avatar_url || ""
      }
    };
  } catch (error) {
    console.error("Error in fetchProjectById:", error);
    return null;
  }
};

// Create a new project
export const createProject = async (
  userId: string,
  { title, description, tags, external_link, cover_image }: CreateProjectInput
): Promise<ProjectWithUser> => {
  try {
    // Handle image upload if provided
    let coverImageUrl = null;
    if (cover_image) {
      console.log("Starting image upload process");
      
      // Better file extension handling
      const fileNameParts = cover_image.name.split('.');
      const fileExt = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : 'jpg';
      
      // Create a more unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `${userId}_${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`; // Simplified path without 'projects/' prefix

      console.log(`Preparing to upload file: ${filePath} to project_images bucket`);
      
      try {
        // Try direct upload first with simplified path
        const { error: uploadError, data: uploadData } = await supabase.storage
        .from('project_images')
          .upload(filePath, cover_image, {
            cacheControl: '3600',
            upsert: true // Set to true to overwrite if file exists
          });

      if (uploadError) {
          console.error("Error uploading with simplified path:", uploadError);
          console.log("Attempting upload with different path structure...");
          
          // Try again with a different path structure
          const altFilePath = fileName; // Just the filename without any folder structure
          const { error: altUploadError, data: altUploadData } = await supabase.storage
            .from('project_images')
            .upload(altFilePath, cover_image, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (altUploadError) {
            console.error("Error with alternate upload path:", altUploadError);
            throw new Error(`Upload error: ${altUploadError.message}`);
          }
          
          // Get URL for the alternate path
          const { data: publicUrlData } = supabase.storage
            .from('project_images')
            .getPublicUrl(altFilePath);
            
          coverImageUrl = publicUrlData?.publicUrl;
          console.log("Successfully uploaded with alternate path. URL:", coverImageUrl);
        } else {
          // Get public URL for original upload
      const { data: publicUrlData } = supabase.storage
        .from('project_images')
        .getPublicUrl(filePath);

          coverImageUrl = publicUrlData?.publicUrl;
          console.log("Image upload successful, URL:", coverImageUrl);
        }
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }

    // Sanitize tags to ensure it's an array
    const sanitizedTags = Array.isArray(tags) ? tags : [];

    console.log("Creating project with data:", {
      title,
      descriptionLength: description?.length,
      tagsCount: sanitizedTags.length,
      hasImage: !!coverImageUrl
    });

    // Create project
    const { data, error } = await supabase
      .from("projects")
      .insert({
        title,
        description: description || "",
        tags: sanitizedTags,
        external_link: external_link || null,
        cover_image_url: coverImageUrl,
        image_url: coverImageUrl,
        user_id: userId
      })
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error("Error creating project in database:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned from project creation");
    }

    // Get user profile for the created project
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.warn("Could not fetch profile data:", profileError);
    }

    const profile = profileData || {};
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || "",
      tags: data.tags || [],
      image_url: data.image_url || "",
      cover_image_url: data.cover_image_url || "",
      content_blocks: (Array.isArray(data.content_blocks) ? data.content_blocks : []) as any[],
      external_link: data.external_link || null,
      views: data.views || 0,
      user_id: data.user_id,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      user: {
        username: (profile as any)?.username || "",
        display_name: (profile as any)?.display_name || "",
        avatar_url: (profile as any)?.avatar_url || ""
      }
    };
  } catch (error) {
    console.error("Error in createProject:", error);
    throw error;
  }
};

// Update an existing project
export const updateProject = async (
  projectId: string,
  userId: string,
  { title, description, tags, external_link, cover_image }: Partial<CreateProjectInput>
): Promise<ProjectDetails | null> => {
  try {
    // Create update object with existing fields
    const updateData: any = {
      title,
      description,
      tags,
      external_link,
      updated_at: new Date().toISOString()
    };

    // Handle image upload if provided
    if (cover_image) {
      // Better file extension handling
      const fileNameParts = cover_image.name.split('.');
      const fileExt = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : 'jpg';
      
      // Create a more unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `${userId}_${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log(`Preparing to upload file for update: ${filePath}`);
      
      try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('project_images')
          .upload(filePath, cover_image, {
            cacheControl: '3600',
            upsert: true
          });

      if (uploadError) {
          console.error("Error uploading image for update:", uploadError);
          
          // Try alternate path
          const altFilePath = fileName;
          const { error: altUploadError } = await supabase.storage
            .from('project_images')
            .upload(altFilePath, cover_image, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (altUploadError) {
            console.error("Error with alternate update path:", altUploadError);
            throw new Error(`Update upload error: ${altUploadError.message}`);
          }
          
          // Get URL for the alternate path
          const { data: publicUrlData } = supabase.storage
            .from('project_images')
            .getPublicUrl(altFilePath);
            
          updateData.cover_image_url = publicUrlData?.publicUrl;
          updateData.image_url = publicUrlData?.publicUrl; // Also update image_url
        } else {
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('project_images')
        .getPublicUrl(filePath);

          updateData.cover_image_url = publicUrlData?.publicUrl;
          updateData.image_url = publicUrlData?.publicUrl; // Also update image_url
        }
      } catch (error) {
        console.error("Error uploading update image:", error);
        throw error;
      }
    }

    // Update project
    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .eq("user_id", userId) // Ensure the user owns the project
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }

    if (!data) return null;

    const profile = data.profiles || {};
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || "",
      tags: data.tags || [],
      image_url: data.image_url || "",
      cover_image_url: data.cover_image_url || "",
      content_blocks: (Array.isArray(data.content_blocks) ? data.content_blocks : []) as any[],
      external_link: data.external_link || null,
      views: data.views || 0,
      user_id: data.user_id,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      user: {
        username: (profile as any)?.username || "",
        display_name: (profile as any)?.display_name || "",
        avatar_url: (profile as any)?.avatar_url || ""
      }
    };
  } catch (error) {
    console.error("Error in updateProject:", error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId: string, userId: string): Promise<boolean> => {
  try {
    // Delete the project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId); // Ensure the user owns the project

    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteProject:", error);
    throw error;
  }
};

// Increment project views
export const incrementProjectViews = async (projectId: string, userId?: string): Promise<boolean> => {
  try {
    // First check if the project exists and get the owner ID
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, views")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error checking project:", projectError);
      throw projectError;
    }

    // Don't increment if the viewer is the owner
    if (userId && userId === project.user_id) {
      console.log("Skipping view increment for owner");
      return false;
    }

    // Use RPC function to increment views atomically
    const { error } = await supabase.rpc('increment_project_views', {
      project_id: projectId
    });

    if (error) {
      console.error("Error incrementing views:", error);
      throw error;
    }

    // Only send notification if we have a logged-in user who isn't the owner
    if (userId && userId !== project.user_id) {
      // Get viewer info for notification
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        // Send notification for view - but only if the project has fewer than 50 views
        // to avoid spamming the owner with notifications for popular projects
        if (project.views < 50) {
          await createProjectNotification(
            project.user_id,
            userId,
            projectId,
            "view",
            userData.display_name || "أحد المستخدمين"
          );
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error in incrementProjectViews:", error);
    return false;
  }
};

// Like a project
export const likeProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    // Check if the project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error checking project:", projectError);
      throw projectError;
    }

    // Check if the user has already liked the project
    const { data: existingLike, error: likeError } = await supabase
      .from("project_likes")
      .select()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (likeError) {
      console.error("Error checking existing like:", likeError);
      throw likeError;
    }

    if (existingLike) {
      // User already liked this project
      return;
    }

    // Add like
    const { error } = await supabase
      .from("project_likes")
      .insert({
        project_id: projectId,
        user_id: userId
      });

    if (error) {
      console.error("Error adding like:", error);
      throw error;
    }

    // Get user info for notification
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error getting user data for notification:", userError);
    } else {
      // Send notification to project owner
      const recipientId = project.user_id;
      const senderName = userData?.display_name || "أحد المستخدمين";
      
      // Only send notification if it's not the user's own project
      if (recipientId !== userId) {
        await createProjectNotification(
          recipientId,
          userId,
          projectId,
          "like",
          senderName
        );
      }
    }
  } catch (error) {
    console.error("Error in likeProject:", error);
    throw error;
  }
};

// Unlike a project
export const unlikeProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    // Delete like
    const { error } = await supabase
      .from("project_likes")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing like:", error);
      throw error;
    }

    // No notification for unlike action
  } catch (error) {
    console.error("Error in unlikeProject:", error);
    throw error;
  }
};

// Check if user has liked a project
export const hasUserLikedProject = async (projectId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("project_likes")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      console.error("Error checking like status:", error);
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error in hasUserLikedProject:", error);
    return false;
  }
};

// Fetch projects by user ID
export const fetchProjectsByUserId = async (userId: string): Promise<ProjectWithUser[]> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user projects:", error);
      throw error;
    }

    return data.map(project => {
      // Ensure profile is treated as potentially nullable or provide a default structure
      const profile = project.profiles as { username?: string; display_name?: string; avatar_url?: string } | null;
      return {
        id: project.id,
        title: project.title,
        description: project.description || "",
        tags: project.tags || [],
        image_url: project.image_url || "",
        cover_image_url: project.cover_image_url || "",
        // Cast content_blocks to any[] or a more specific type if known
        content_blocks: (Array.isArray(project.content_blocks) ? project.content_blocks : []) as any[], 
        external_link: project.external_link || null,
        views: project.views || 0,
        user_id: project.user_id,
        created_at: project.created_at || new Date().toISOString(),
        updated_at: project.updated_at || new Date().toISOString(),
        user: {
          username: (profile as any)?.username || "",
          display_name: (profile as any)?.display_name || "",
          avatar_url: (profile as any)?.avatar_url || ""
        }
      };
    });
  } catch (error) {
    console.error("Error in fetchProjectsByUserId:", error);
    return [];
  }
};

/**
 * Add a comment to a project
 */
export const addProjectComment = async (
  projectId: string,
  userId: string,
  content: string
): Promise<any> => {
  try {
    // Get project details first to get the owner for notification
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error fetching project for comment:", projectError);
      throw projectError;
    }

    // Insert the comment
    const { data, error } = await supabase
      .from("project_comments")
      .insert({
        project_id: projectId,
        user_id: userId,
        content
      })
      .select("*, profiles:user_id (username, display_name, avatar_url)")
      .single();

    if (error) {
      console.error("Error adding project comment:", error);
      throw error;
    }

    // Get commenter info for notification
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error getting user data for notification:", userError);
    } else {
      // Send notification to project owner
      const recipientId = project.user_id;
      const senderName = userData?.display_name || "أحد المستخدمين";
      
      // Only send notification if it's not the user's own project
      if (recipientId !== userId) {
        await createProjectNotification(
          recipientId,
          userId,
          projectId,
          "comment",
          senderName
        );
      }
    }

    return data;
  } catch (error) {
    console.error("Error in addProjectComment:", error);
    throw error;
  }
};
