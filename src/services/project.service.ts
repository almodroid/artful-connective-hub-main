import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/types/supabase';
import { Project, CreateProjectInput, ProjectDetails } from "@/types/project.types";
import { toast } from "sonner";
import { createProjectNotification } from "./notification.service";
import { Database } from '@/types/supabase';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

// Add a local type for migration compatibility
type ProjectRowWithImages = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url?: string;
  image_urls?: string[];
  cover_image_url: string;
  content_blocks: Json;
  external_link: string;
  views: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  project_likes?: { count: number }[];
};

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
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:user_id(username, display_name, avatar_url),
      project_likes:project_likes(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const projects: ProjectWithUser[] = (data as ProjectRowWithImages[]).map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    tags: project.tags,
    image_urls: project.image_urls || (project.image_url ? [project.image_url] : []),
    cover_image_url: project.cover_image_url,
    content_blocks: project.content_blocks,
    external_link: project.external_link,
    views: project.views,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    user: {
      username: project.profiles?.username || 'anonymous',
      display_name: project.profiles?.display_name || 'Anonymous User',
      avatar_url: project.profiles?.avatar_url || ""
    },
    likes_count: project.project_likes?.[0]?.count || 0,
    is_liked_by_user: false // This will be updated by the hook
  }));
  return projects;
};

// Fetch a single project by ID
export const fetchProjectById = async (id: string): Promise<ProjectDetails> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:user_id(username, display_name, avatar_url),
      project_likes:project_likes(count)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Project not found');

  const project = data as ProjectRowWithImages;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    tags: project.tags,
    image_urls: project.image_urls || (project.image_url ? [project.image_url] : []),
    cover_image_url: project.cover_image_url,
    content_blocks: project.content_blocks,
    external_link: project.external_link,
    views: project.views,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    user: {
      username: project.profiles?.username || 'anonymous',
      display_name: project.profiles?.display_name || 'Anonymous User',
      avatar_url: project.profiles?.avatar_url || ""
    },
    likes_count: project.project_likes?.[0]?.count || 0,
    is_liked_by_user: false // This will be updated by the hook
  };
};

// Create a new project
export const createProject = async (input: CreateProjectInput, userId: string): Promise<ProjectDetails> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Upload cover image if provided
  let cover_image_url = '';
  if (input.cover_image) {
    const fileBuffer = await input.cover_image.arrayBuffer();
    const { data: coverData, error: coverError } = await supabase.storage
      .from('project_images')
      .upload(`${user.id}/cover/${Date.now()}-${input.cover_image.name}`, fileBuffer, {
        contentType: input.cover_image.type
      });
    
    if (coverError) throw coverError;
    const { data: { publicUrl } } = supabase.storage
      .from('project_images')
      .getPublicUrl(coverData.path);
    cover_image_url = publicUrl;
  }

  // Upload gallery images if provided
  let image_urls: string[] = [];
  if (input.gallery_images && input.gallery_images.length > 0) {
    const uploadPromises = input.gallery_images.map(async (file) => {
      const fileBuffer = await file.arrayBuffer();
      const { data: imageData, error: imageError } = await supabase.storage
        .from('project_images')
        .upload(`${user.id}/gallery/${Date.now()}-${file.name}`, fileBuffer, {
          contentType: file.type
        });
      
      if (imageError) throw imageError;
      const { data: { publicUrl } } = supabase.storage
        .from('project_images')
        .getPublicUrl(imageData.path);
      return publicUrl;
    });

    image_urls = await Promise.all(uploadPromises);
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: input.title,
      description: input.description,
      tags: input.tags,
      image_urls: image_urls,
      cover_image_url: cover_image_url,
      content_blocks: input.content_blocks,
      external_link: input.external_link || '',
      user_id: userId,
      views: 0
    })
    .select(`
      *,
      profiles:user_id(username, display_name, avatar_url),
      project_likes:project_likes(count)
    `)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create project');

  const project = data as ProjectRowWithImages;
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    tags: project.tags,
    image_urls: project.image_urls || (project.image_url ? [project.image_url] : []),
    cover_image_url: project.cover_image_url,
    content_blocks: project.content_blocks,
    external_link: project.external_link,
    views: project.views,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    user: {
      username: project.profiles?.username || 'anonymous',
      display_name: project.profiles?.display_name || 'Anonymous User',
      avatar_url: project.profiles?.avatar_url || ""
    },
    likes_count: project.project_likes?.[0]?.count || 0,
    is_liked_by_user: false
  };
};

// Update an existing project
export const updateProject = async (id: string, input: CreateProjectInput, userId: string): Promise<ProjectDetails> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Handle cover image update if provided
  let cover_image_url = undefined;
  if (input.cover_image) {
    const fileBuffer = await input.cover_image.arrayBuffer();
    const { data: coverData, error: coverError } = await supabase.storage
      .from('project_images')
      .upload(`${user.id}/cover/${Date.now()}-${input.cover_image.name}`, fileBuffer, {
        contentType: input.cover_image.type
      });
    
    if (coverError) throw coverError;
    const { data: { publicUrl } } = supabase.storage
      .from('project_images')
      .getPublicUrl(coverData.path);
    cover_image_url = publicUrl;
  }

  // Handle gallery images update if provided
  let image_urls = undefined;
  if (input.gallery_images && input.gallery_images.length > 0) {
    const uploadPromises = input.gallery_images.map(async (file) => {
      const fileBuffer = await file.arrayBuffer();
      const { data: imageData, error: imageError } = await supabase.storage
        .from('project_images')
        .upload(`${user.id}/gallery/${Date.now()}-${file.name}`, fileBuffer, {
          contentType: file.type
        });
      
      if (imageError) throw imageError;
      const { data: { publicUrl } } = supabase.storage
        .from('project_images')
        .getPublicUrl(imageData.path);
      return publicUrl;
    });

    image_urls = await Promise.all(uploadPromises);
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      title: input.title,
      description: input.description,
      tags: input.tags,
      image_urls: image_urls,
      cover_image_url: cover_image_url,
      content_blocks: input.content_blocks,
      external_link: input.external_link || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      *,
      profiles:user_id(username, display_name, avatar_url),
      project_likes:project_likes(count)
    `)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Project not found or unauthorized');

  const project = data as ProjectRowWithImages;
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    tags: project.tags,
    image_urls: project.image_urls || (project.image_url ? [project.image_url] : []),
    cover_image_url: project.cover_image_url,
    content_blocks: project.content_blocks,
    external_link: project.external_link,
    views: project.views,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    user: {
      username: project.profiles?.username || 'anonymous',
      display_name: project.profiles?.display_name || 'Anonymous User',
      avatar_url: project.profiles?.avatar_url || ""
    },
    likes_count: project.project_likes?.[0]?.count || 0,
    is_liked_by_user: false
  };
};

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
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
export const likeProject = async (projectId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('project_likes')
    .insert({
      project_id: projectId,
      user_id: user.id
    });

  if (error) throw error;
};

// Unlike a project
export const unlikeProject = async (projectId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('project_likes')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id);

  if (error) throw error;
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
        ),
        project_likes:project_likes(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user projects:", error);
      throw error;
    }

    return (data as ProjectRowWithImages[]).map(project => ({
      ...project,
      image_urls: project.image_urls || (project.image_url ? [project.image_url] : []),
      user: {
        username: project.profiles?.username || 'anonymous',
        display_name: project.profiles?.display_name || 'Anonymous User',
        avatar_url: project.profiles?.avatar_url || ""
      },
      likes_count: project.project_likes?.[0]?.count || 0
    })) as ProjectWithUser[];
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
