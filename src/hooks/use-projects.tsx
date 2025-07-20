import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Project, CreateProjectInput, ProjectDetails } from "@/types/project.types";
import { 
  fetchProjects, 
  createProject, 
  incrementProjectViews,
  likeProject as likeProjectService,
  unlikeProject as unlikeProjectService,
  fetchProjectById
} from "@/services/project.service";
import { supabase } from "@/integrations/supabase/client";

export type ProjectWithUser = Project & {
  user: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
};

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { isRtl } = useTranslation();
    
  // Fetch all projects
  const {
    data: projects,
    isLoading,
    error
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects
  });
  
  // Create a new project
  const createProjectMutation = useMutation({
    mutationFn: async ({ title, description, tags, external_link, cover_image, gallery_images }: CreateProjectInput) => {
      if (!user) {
        throw new Error("User must be logged in to create a project");
      }
      
      console.log("Starting project creation for user:", user.id);
      
      // Set uploading state if there's an image
      if (cover_image || (gallery_images && gallery_images.length > 0)) {
        setIsUploadingImage(true);
        
        // Validate cover image if present
        if (cover_image) {
          if (cover_image.size > 5 * 1024 * 1024) {
            setIsUploadingImage(false);
            throw new Error(isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميغابايت" : "Image size should be less than 5MB");
          }
          
          const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!validTypes.includes(cover_image.type)) {
            setIsUploadingImage(false);
            throw new Error(isRtl ? "نوع الملف غير مدعوم. يرجى استخدام JPG، PNG، GIF أو WEBP" : "File type not supported. Please use JPG, PNG, GIF or WEBP");
          }
        }

        // Validate gallery images if present
        if (gallery_images && gallery_images.length > 0) {
          const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          for (const file of gallery_images) {
            if (file.size > 5 * 1024 * 1024) {
              setIsUploadingImage(false);
              throw new Error(isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميغابايت" : "Image size should be less than 5MB");
            }
            if (!validTypes.includes(file.type)) {
              setIsUploadingImage(false);
              throw new Error(isRtl ? "نوع الملف غير مدعوم. يرجى استخدام JPG، PNG، GIF أو WEBP" : "File type not supported. Please use JPG, PNG, GIF or WEBP");
            }
          }
        }
      }
      
      try {
        // Log for debugging
        console.log("Sending project data:", { 
          title, 
          descriptionLength: description?.length || 0,
          tagsCount: tags?.length || 0,
          hasImage: !!cover_image || (gallery_images && gallery_images.length > 0),
          imageSize: cover_image?.size || 0
        });
        
        const result = await createProject({
          title,
          description: description || "",
          tags: tags || [],
          external_link: external_link || "",
          cover_image,
          gallery_images
        }, user.id);
        
        console.log("Project created successfully:", result);
        return result;
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      } finally {
        if (cover_image || (gallery_images && gallery_images.length > 0)) {
          setIsUploadingImage(false);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isRtl ? "تم إنشاء المشروع بنجاح" : "Project created successfully");
    },
    onError: (error: any) => {
      console.error("Error creating project:", error);
      const errorMessage = error?.message || (isRtl ? "حدث خطأ أثناء إنشاء المشروع" : "Error creating project");
      toast.error(errorMessage);
    }
  });
  
  // Increment project views
  const incrementViewsMutation = useMutation({
    mutationFn: async (projectId: string) => {
      try {
        console.log(`Incrementing views for project: ${projectId}`);
        
        // We removed the ownership check here, since it's now handled by the service
        // Both checks were causing issues - now we rely only on the service check
        
        // The service function now handles the ownership check
        const result = await incrementProjectViews(projectId, user?.id);
        console.log(`View increment result: ${result}`);
        return result; // Return true if incremented, false if skipped
      } catch (error) {
        console.error("Error incrementing view count:", error);
        throw error;
      }
    },
    onSuccess: (incremented, projectId) => {
      // Only update caches if views were actually incremented
      if (!incremented) return;
      
      // Update the project's views in the projects cache
      queryClient.setQueryData(["projects"], (oldData: ProjectWithUser[] | undefined) => {
        if (!oldData) return [];
        
        return oldData.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              views: (project.views || 0) + 1
            };
          }
          return project;
        });
      });
      
      // Also update any individual project detail cache
      queryClient.setQueryData(["project", projectId], (oldData: ProjectDetails | undefined) => {
        if (!oldData) return undefined;
        
        return {
          ...oldData,
          views: (oldData.views || 0) + 1
        };
      });
    }
  });
  
  // Like a project
  const likeProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        throw new Error("User must be logged in to like a project");
      }
      await likeProjectService(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
  
  // Unlike a project
  const unlikeProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) {
        throw new Error("User must be logged in to unlike a project");
      }
      await unlikeProjectService(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
  
  // Report a project
  const reportProject = async (projectId: string, reason: string): Promise<boolean> => {
    if (!user) {
      toast.error(isRtl ? "يجب تسجيل الدخول للإبلاغ عن مشروع" : "You must be logged in to report a project");
      return false;
    }
    if (!reason.trim()) {
      toast.error(isRtl ? "يرجى تقديم سبب للإبلاغ" : "Please provide a reason for reporting");
      return false;
    }
    try {
      // Check if the user has already reported this project
      const { data: existingReport, error: checkError } = await supabase
        .from("project_reports")
        .select()
        .eq("project_id", projectId)
        .eq("reporter_id", user.id)
        .maybeSingle();
      if (checkError) {
        console.error("Error checking existing report:", checkError);
        toast.error(isRtl ? "تعذر التحقق من حالة البلاغ" : "Could not check report status");
        return false;
      }
      if (existingReport) {
        toast.info(isRtl ? "لقد أبلغت بالفعل عن هذا المشروع" : "You have already reported this project");
        return false;
      }
      // Create a report
      const { error: reportError } = await supabase
        .from("project_reports")
        .insert({
          project_id: projectId,
          reporter_id: user.id,
          reason: reason.trim(),
          status: "pending"
        });
      if (reportError) {
        console.error("Error reporting project:", reportError);
        toast.error(isRtl ? "فشل الإبلاغ عن المشروع" : "Failed to report project");
        return false;
      }
      toast.success(isRtl ? "تم الإبلاغ عن المشروع بنجاح. سيقوم فريقنا بمراجعته." : "Project reported successfully. Our team will review it.");
      return true;
    } catch (error) {
      console.error("Error in reportProject:", error);
      toast.error(isRtl ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again.");
      return false;
    }
  };
  
  return {
    projects: projects || [],
    isLoading,
    error,
    createProject: createProjectMutation.mutate,
    isCreatingProject: createProjectMutation.isPending || isUploadingImage,
    incrementViews: incrementViewsMutation.mutate,
    likeProject: likeProjectMutation.mutate,
    unlikeProject: unlikeProjectMutation.mutate,
    reportProject,
  };
}
