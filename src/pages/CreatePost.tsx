import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui-custom/TagInput";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function CreatePost() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[],
    image: null as File | null
  });

  // Redirect if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(t("enterPostTitle"));
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Implement post creation API call
      
      toast.success(t("postCreatedSuccess"));
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(t("errorCreatingPost"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        <h1 className="text-3xl font-bold mb-8">{t("createNewPost")}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              {t("title")}
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("enterTitle")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              {t("description")}
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("enterDescription")}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              {t("tags")}
            </label>
            <TagInput
              id="tags"
              value={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
              placeholder={t("enterTags")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">
              {t("image")}
            </label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > 5 * 1024 * 1024) {
                  toast.error(t("imageSizeLimitError"));
                  return;
                }
                setFormData({ ...formData, image: file });
              }}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("create")}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}