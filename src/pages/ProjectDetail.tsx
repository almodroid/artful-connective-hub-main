import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Share2, MessageCircle, Eye, Link as LinkIcon, ArrowLeft, ArrowRight, Edit, Trash2, MoreVertical } from "lucide-react";
import { fetchProjectById, deleteProject, updateProject } from "@/services/project.service";
import { ProjectDetails, CreateProjectInput } from "@/types/project.types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagInput } from "@/components/ui-custom/TagInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isRtl } = useTranslation();
  const { user } = useAuth();
  const { incrementViews } = useProjects();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  // Edit and delete states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CreateProjectInput>>({
    title: "",
    description: "",
    tags: [],
    external_link: "",
    cover_image: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Check if the current user is the owner of the project
  const isOwner = user && project && user.id === project.user_id;

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const projectData = await fetchProjectById(id);
        if (projectData) {
          setProject(projectData);
          
          // Set initial edit form data
          setEditFormData({
            title: projectData.title,
            description: projectData.description,
            tags: projectData.tags,
            external_link: projectData.external_link || ""
          });

          // Set image preview if there's a cover image
          if (projectData.cover_image_url) {
            setImagePreview(projectData.cover_image_url);
          }
          
          // The incrementViews function will handle the ownership check internally
          // and only increment if the user is not the owner
          incrementViews(id);
          
          // We don't need to update the UI here as the state will be handled by the query cache
        } else {
          navigate("/projects");
          toast.error(t("projectNotFound"));
        }
      } catch (error) {
        console.error("Error loading project:", error);
        toast.error(t("errorLoadingProject"));
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, navigate, t, incrementViews]);

  const handleLike = async () => {
    if (!user) {
      toast.error(t("loginToLikeProjects"));
      return;
    }
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: project?.title,
        text: project?.description,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("imageSizeLimitError"));
        return;
      }
      
      setEditFormData({...editFormData, cover_image: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !id) return;
    
    if (!editFormData.title?.trim()) {
      toast.error(t("enterProjectTitle"));
      return;
    }
    
    try {
      setIsSubmitting(true);
      const updatedProject = await updateProject(
        id,
        user.id,
        editFormData
      );
      
      if (updatedProject) {
        setProject(updatedProject);
        setIsEditDialogOpen(false);
        toast.success(t("projectUpdatedSuccess"));
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(t("errorUpdatingProject"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !project || !id) return;
    
    try {
      setIsSubmitting(true);
      const success = await deleteProject(id, user.id);
      
      if (success) {
        setIsDeleteDialogOpen(false);
        toast.success(t("projectDeletedSuccess"));
        navigate("/projects");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(t("errorDeletingProject"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-96 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button and actions */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/projects")}
            >
              {isRtl ? (
                <ArrowRight className="h-4 w-4 ml-2" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2" />
              )}
              {t("backToProjects")}
            </Button>
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("editProject")}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deleteProject")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-4 ${isRtl ? "text-right" : "text-left"}`}>{project.title}</h1> 
            <div className="flex items-center gap-2 justify-start ">
             
            {/* Stats */}
            <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{project.views} {t("views")}</span>
              </div>
             {/* Tags */}
             <div className={`flex flex-wrap gap-2`}>
                {project.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

            </div>

          </div>
          {/* Project image */}
          <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden">
            <img
              src={project.cover_image_url || project.image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000"}
              alt={project.title}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Project header */}
          <div className="mb-8 flex justify-between">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={project.user.avatar_url} />
                <AvatarFallback>
                  {project.user.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{project.user.display_name}</p>
                <p className="text-sm text-muted-foreground">@{project.user.username}</p>
              </div>
            </div>
          {/* Actions */}
              <div className="space-y-2 flex gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={handleLike}
                  >
                    <Heart className={cn(
                      `h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`,
                      isLiked ? "text-red-500 fill-red-500" : ""
                    )} />
                    {isLiked ? t("unlike") : t("like")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={handleShare}
                  >
                    <Share2 className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                    {t("share")}
                  </Button>
                  {project.external_link && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a
                      href={project.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                      {t("visitProject")}
                    </a>
                  </Button>
                )}
                </div>
                
              </div>
          </div>

          {/* Project content */}
          <div className="flex flex-col md:flex-row gap-2">
            {/* Sidebar */}
            <div className=" space-y-6 flex w-full justify-between">
              

              

              
            </div>
          </div>
          <div className="w-full">
              <div className="prose max-w-none mb-8">
                <p className={`text-lg ${isRtl ? "text-right" : "text-left"} text-muted-foreground`}>{project.description}</p>
              </div>

              {/* Content blocks */}
              {project.content_blocks?.map((block, index) => (
                <div key={index} className="mb-8">
                  {block.type === "image" && (
                    <img
                      src={block.url}
                      alt={`${t("projectContent")} ${index + 1}`}
                      className="rounded-lg w-full"
                    />
                  )}
                  {block.type === "text" && (
                    <p className="text-muted-foreground">{block.content}</p>
                  )}
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t("editProject")}</DialogTitle>
              <DialogDescription>
                {t("editProjectDescription")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  {t("projectTitle")}
                </label>
                <Input
                  id="title"
                  value={editFormData.title || ""}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  placeholder={t("projectTitlePlaceholder")}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  {t("projectDescription")}
                </label>
                <Textarea
                  id="description"
                  value={editFormData.description || ""}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  placeholder={t("projectDescriptionPlaceholder")}
                  className="min-h-20"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="tags" className="text-sm font-medium">
                  {t("tags")}
                </label>
                <TagInput
                  value={editFormData.tags || []}
                  onChange={(tags) => setEditFormData({...editFormData, tags})}
                  placeholder={t("tagsPlaceholder")}
                  maxTags={5}
                />
                <p className="text-xs text-muted-foreground">
                  {t("tagsLimit")}
                </p>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="external_link" className="text-sm font-medium">
                  {t("externalLink")}
                </label>
                <Input
                  id="external_link"
                  value={editFormData.external_link || ""}
                  onChange={(e) => setEditFormData({...editFormData, external_link: e.target.value})}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  {t("projectCoverImage")}
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="project-image"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("project-image")?.click()}
                    disabled={isSubmitting}
                  >
                    {t("chooseImage")}
                  </Button>
                  
                  {imagePreview && (
                    <div className="relative mt-2 rounded-md overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt={t("projectPreview")} 
                        className="max-h-48 w-full object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !editFormData.title?.trim()}
              >
                {isSubmitting ? t("saving") : t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteProjectWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default ProjectDetail; 