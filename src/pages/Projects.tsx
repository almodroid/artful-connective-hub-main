import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Link as LinkIcon, Plus, GalleryHorizontalEnd, X, Grid2X2, Grid3X3, Grid, Rows } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { TagInput } from "@/components/ui-custom/TagInput";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const Projects = () => {
  const { t, isRtl } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { projects, isLoading, createProject, isCreatingProject, incrementViews } = useProjects();
  const navigate = useNavigate();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    tags: [] as string[],
    external_link: "",
    image: null as File | null,
    gallery_images: [] as File[]
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryLayout, setGalleryLayout] = useState<'grid-2' | 'grid-3' | 'grid-4' | 'rows'>('grid-3');
  
  // Function to get top tags from projects
  const getTopTags = () => {
    if (!projects || projects.length === 0) return [];
    
    // Count occurrences of each tag
    const tagCount: Record<string, number> = {};
    projects.forEach(project => {
      project.tags.forEach(tag => {
        // Normalize tags (lowercase)
        const normalizedTag = tag.toLowerCase();
        tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1;
      });
    });
    
    // Sort tags by frequency and get top 5
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  };
  
  // Get the top tags
  const topTags = getTopTags();
  
  // Filter projects based on active filter
  const filteredProjects = projects.filter(project => {
    // First apply search filter if any
    const matchesSearch = searchTerm === "" || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Then apply tag filter
    if (activeFilter === "all") {
      return matchesSearch;
    } else {
      return matchesSearch && project.tags.some(tag => 
        tag.toLowerCase() === activeFilter.toLowerCase()
      );
    }
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميغابايت" : "Image file must be less than 5MB");
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(isRtl ? "نوع الملف غير مدعوم. يرجى استخدام JPG، PNG، GIF أو WEBP" : "Unsupported file type. Please use JPG, PNG, GIF or WEBP");
        return;
      }
      
      setNewProject({...newProject, image: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate each file
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(isRtl ? "حجم الصورة يجب أن يكون أقل من 5 ميغابايت" : "Image file must be less than 5MB");
          return false;
        }
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          toast.error(isRtl ? "نوع الملف غير مدعوم. يرجى استخدام JPG، PNG، GIF أو WEBP" : "Unsupported file type. Please use JPG, PNG, GIF or WEBP");
          return false;
        }
        return true;
      });

      setNewProject(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...validFiles]
      }));

      // Create previews for new images
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeGalleryImage = (index: number) => {
    setNewProject(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const resetForm = () => {
    setNewProject({
      title: "",
      description: "",
      tags: [],
      external_link: "",
      image: null,
      gallery_images: []
    });
    setImagePreview(null);
    setGalleryPreviews([]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProject.title.trim()) {
      toast.error(isRtl ? "يرجى إدخال عنوان للمشروع" : "Please enter a project title");
      return;
    }
    
    // Check if at least an image or description is provided
    if (!newProject.description.trim() && !newProject.image) {
      toast.error(isRtl ? "يرجى إضافة وصف أو صورة للمشروع" : "Please add a description or image for your project");
      return;
    }
    
    try {
      setUploadFailed(false);
      const toastId = toast.loading(isRtl ? "جاري إنشاء المشروع..." : "Creating project...");
      
      await createProject({
        title: newProject.title,
        description: newProject.description,
        tags: newProject.tags,
        external_link: newProject.external_link,
        cover_image: newProject.image,
        gallery_images: newProject.gallery_images
      });
      
      toast.dismiss(toastId);
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating project:", error);
      
      let errorMessage = error?.message || (isRtl ? "حدث خطأ أثناء إنشاء المشروع" : "Error creating project");
      
      // Handle specific error cases with more user-friendly messages
      if (errorMessage.includes("Bucket not found") || errorMessage.includes("No suitable storage bucket")) {
        errorMessage = isRtl 
          ? "لا يمكن رفع الصورة حالياً. سيتم تحديث النظام قريباً، يرجى المحاولة مرة أخرى لاحقاً أو إنشاء المشروع بدون صورة."
          : "Unable to upload image at this time. The system will be updated soon. Please try again later or create your project without an image.";
        
        setUploadFailed(true);
      }
      
      toast.error(errorMessage);
    }
  };
  
  // Create project without image if upload failed
  const createProjectWithoutImage = async () => {
    try {
      const toastId = toast.loading(isRtl ? "جاري إنشاء المشروع بدون صورة..." : "Creating project without image...");
      
      await createProject({
        title: newProject.title,
        description: newProject.description,
        tags: newProject.tags,
        external_link: newProject.external_link,
        cover_image: null, // Explicitly set to null
        gallery_images: []
      });
      
      toast.dismiss(toastId);
      resetForm();
      setIsDialogOpen(false);
      setUploadFailed(false);
    } catch (error: any) {
      console.error("Error creating project without image:", error);
      toast.error(isRtl ? "حدث خطأ أثناء إنشاء المشروع" : "Error creating project");
    }
  };

  const GalleryLayoutSelector = ({ value, onChange, disabled }: { 
    value: 'grid-2' | 'grid-3' | 'grid-4' | 'rows', 
    onChange: (value: 'grid-2' | 'grid-3' | 'grid-4' | 'rows') => void,
    disabled?: boolean 
  }) => {
    const { t } = useTranslation();
    
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={value === 'grid-2' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('grid-2')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Grid2X2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={value === 'grid-3' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('grid-3')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={value === 'grid-4' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('grid-4')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={value === 'rows' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('rows')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Rows className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("projectsPage")}</h1>
          
          {isAuthenticated && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>{t("createProject")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{t("createProject")}</DialogTitle>
                    <DialogDescription>
                      {t("addProjectDetails")}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        {t("title")}
                      </label>
                      <Input
                        id="title"
                        value={newProject.title}
                        onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                        placeholder={t("projectTitlePlaceholder")}
                        disabled={isCreatingProject}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        {t("description")}
                      </label>
                      <Textarea
                        id="description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                        placeholder={t("projectDescriptionPlaceholder")}
                        className="min-h-20"
                        disabled={isCreatingProject}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="tags" className="text-sm font-medium">
                        {t("tags")}
                      </label>
                      <TagInput
                        value={newProject.tags}
                        onChange={(tags) => setNewProject({...newProject, tags})}
                        placeholder={t("tagsPlaceholder")}
                        maxTags={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("maxTagsInfo")}
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="external_link" className="text-sm font-medium">
                        {t("externalLink")}
                      </label>
                      <Input
                        id="external_link"
                        value={newProject.external_link}
                        onChange={(e) => setNewProject({...newProject, external_link: e.target.value})}
                        placeholder="https://example.com"
                        disabled={isCreatingProject}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        {t("projectImage")}
                      </label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          id="project-image"
                          className="hidden"
                          onChange={handleImageChange}
                          disabled={isCreatingProject}
                        />
                        <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("project-image")?.click()}
                          disabled={isCreatingProject}
                        >
                            {t("chooseImage")}
                          </Button>
                          
                          {newProject.image && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setNewProject({...newProject, image: null});
                                setImagePreview(null);
                              }}
                              disabled={isCreatingProject}
                            >
                              {t("removeImage")}
                        </Button>
                          )}
                        </div>
                        
                        {newProject.image && (
                          <p className="text-xs text-muted-foreground">
                            {newProject.image.name} ({Math.round(newProject.image.size / 1024)} KB)
                          </p>
                        )}
                        
                        {uploadFailed && newProject.image && (
                          <div className="mt-2 p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 rounded-md">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              {isRtl 
                                ? "فشل تحميل الصورة بسبب مشكلة في الخادم. يمكنك إنشاء المشروع بدون صورة أو المحاولة لاحقاً." 
                                : "Image upload failed due to a server issue. You can create the project without an image or try again later."}
                            </p>
                          </div>
                        )}
                        
                        {imagePreview && (
                          <div className="relative mt-2 rounded-md overflow-hidden">
                            <img 
                              src={imagePreview} 
                              alt="Project preview" 
                              className="max-h-48 w-full object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">
                          {t("projectGallery")}
                        </label>
                        <GalleryLayoutSelector 
                          value={galleryLayout} 
                          onChange={setGalleryLayout}
                          disabled={isCreatingProject}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          id="project-gallery"
                          className="hidden"
                          onChange={handleGalleryChange}
                          multiple
                          disabled={isCreatingProject}
                        />
                        
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("project-gallery")?.click()}
                            disabled={isCreatingProject}
                            className="gap-2"
                          >
                            <GalleryHorizontalEnd className="h-4 w-4" />
                            {t("addToGallery")}
                          </Button>
                        </div>

                        {galleryPreviews.length > 0 && (
                          <div className={cn(
                            "mt-2 gap-2",
                            galleryLayout === 'grid-2' && "grid grid-cols-2",
                            galleryLayout === 'grid-3' && "grid grid-cols-3",
                            galleryLayout === 'grid-4' && "grid grid-cols-4",
                            galleryLayout === 'rows' && "flex flex-col"
                          )}>
                            {galleryPreviews.map((preview, index) => (
                              <div 
                                key={index} 
                                className={cn(
                                  "relative group",
                                  galleryLayout === 'rows' ? "aspect-[16/9]" : "aspect-square"
                                )}
                              >
                                <img
                                  src={preview}
                                  alt={`Gallery image ${index + 1}`}
                                  className="object-cover w-full h-full rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(index)}
                                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isCreatingProject}
                    >
                      {t("cancel")}
                    </Button>
                    
                    {uploadFailed && newProject.image && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={createProjectWithoutImage}
                        disabled={isCreatingProject}
                      >
                        {t("createWithoutImage")}
                      </Button>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={isCreatingProject || !newProject.title.trim() || (!newProject.description.trim() && !newProject.image)}
                    >
                      {isCreatingProject ? t("loading") : t("createProject")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Search bar */}
        <div className="mb-4">
          <Input
            placeholder={t("searchProjects")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {/* Dynamic tabs based on popular tags */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-8" dir={isRtl ? "rtl" : "ltr"}>
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="all">{t("allProjects")}</TabsTrigger>
            
            {topTags.map(tag => (
              <TabsTrigger key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-0" dir={isRtl ? "rtl" : "ltr"}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={project.cover_image_url || "https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?q=80&w=1000"} 
                        alt={project.title} 
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => {
                          navigate(`/projects/${project.id}`);
                        }}
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <p className="text-muted-foreground line-clamp-2">{project.description}</p>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => setActiveFilter(tag.toLowerCase())}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{project.views} {t("views")}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                {searchTerm || activeFilter !== "all" ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">{t("noResults")}</h3>
                    <p className="text-muted-foreground mb-6">{t("tryDifferentSearch")}</p>
                    <Button onClick={() => {setSearchTerm(""); setActiveFilter("all");}}>
                      {t("clearFilters")}
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">{t("noProjectsYet")}</h3>
                    <p className="text-muted-foreground mb-6">{t("beFirstToAdd")}</p>
                {isAuthenticated && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 me-2" />
                        {t("addProject")}
                  </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Dynamic tab content for each tag */}
          {topTags.map(tag => (
            <TabsContent key={tag} value={tag} className="mt-0">
              {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                          src={project.cover_image_url || "https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?q=80&w=1000"} 
                      alt={project.title} 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => {
                            navigate(`/projects/${project.id}`);
                          }}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                        <p className="text-muted-foreground line-clamp-2">{project.description}</p>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary"
                              className="cursor-pointer hover:bg-secondary/80"
                              onClick={() => setActiveFilter(tag.toLowerCase())}
                            >
                              {tag}
                            </Badge>
                      ))}
                    </div>
                  </CardContent>
                      <CardFooter className="flex justify-end">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                          <span>{project.views} {t("views")}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  {searchTerm || activeFilter !== "all" ? (
                    <>
                      <h3 className="text-lg font-medium mb-2">{t("noResults")}</h3>
                      <p className="text-muted-foreground mb-6">{t("tryDifferentSearch")}</p>
                      <Button onClick={() => {setSearchTerm(""); setActiveFilter("all");}}>
                        {t("clearFilters")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">{t("noProjectsYet")}</h3>
                      <p className="text-muted-foreground mb-6">{t("beFirstToAdd")}</p>
                      {isAuthenticated && (
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <Plus className="h-4 w-4 me-2" />
                          {t("addProject")}
                    </Button>
                      )}
                    </>
                  )}
            </div>
              )}
          </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Projects;
