import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, MessageCircle, Share2, ExternalLink, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from "./ShareModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useProjects } from "@/hooks/use-projects";
import type { TablesInsert } from '@/integrations/supabase/types';

export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  project_url?: string;
  github_url?: string;
  technologies: string[];
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  comments: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
}

interface ProjectCardProps {
  project: Project;
  onLike?: (projectId: string) => Promise<void>;
  onComment?: (projectId: string) => void;
}

export function ProjectCard({ project, onLike, onComment }: ProjectCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { t, isRtl } = useTranslation();
  const navigate = useNavigate();
  const [localLikes, setLocalLikes] = useState(project.likes);
  const [localIsLiked, setLocalIsLiked] = useState(project.isLiked);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { reportProject } = useProjects();
  const isOwner = isAuthenticated && user?.id === project.user.id;

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('input'))
    ) {
      return;
    }
    navigate(`/projects/${project.id}`);
  };

  // Unified report function for projects
  const reportProjectUnified = async (projectId: string, reason: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      toast.error(t('report') + ': ' + (isRtl ? "يجب تسجيل الدخول للإبلاغ عن مشروع" : "You must be logged in to report a project"));
      return false;
    }
    if (!reason.trim()) {
      toast.error(t('report') + ': ' + t('reportReason'));
      return false;
    }
    try {
      // Check if the user has already reported this project
      const { data: existingReport, error: checkError } = await supabase
        .from("reports")
        .select()
        .eq("content_type", "project")
        .eq("content_id", projectId)
        .eq("reporter_id", user.id)
        .maybeSingle();
      if (checkError) {
        console.error("Error checking existing report:", checkError);
        toast.error(t('report') + ': ' + (isRtl ? "تعذر التحقق من حالة البلاغ" : "Could not check report status"));
        return false;
      }
      if (existingReport) {
        toast.info(t('alreadyReported'));
        return false;
      }
      // Create a report
      const reportPayload: TablesInsert<'reports'> = {
        reporter_id: user.id,
        reported_id: project.user.id,
        content_type: "project",
        content_id: projectId,
        reason: reason.trim(),
        status: "pending"
      };
      const { error: reportError } = await supabase
        .from("reports")
        .insert(reportPayload);
      if (reportError) {
        console.error("Error reporting project:", reportError);
        toast.error(t('report') + ': ' + (isRtl ? "فشل الإبلاغ عن المشروع" : "Failed to report project"));
        return false;
      }
      toast.success(t('reportSuccess'));
      return true;
    } catch (error) {
      console.error("Error in reportProject:", error);
      toast.error(t('report') + ': ' + (isRtl ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again."));
      return false;
    }
  };

  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="bg-card rounded-lg border p-4 space-y-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        {!project.thumbnail_url || imgError ? (
          <div className="p-8 opacity-20 grayscale brightness-150">
            <img src='/assets/logo.png' alt="Placeholder" className="h-16 w-auto object-contain" />
          </div>
        ) : (
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <h3 className="text-lg font-semibold text-start">{project.title}</h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-start min-w-0">
          <Link to={`/profile/${project.user.username}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={project.user.avatar} alt={project.user.displayName} />
              <AvatarFallback>{project.user.displayName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              to={`/profile/${project.user.username}`}
              className="font-medium text-sm hover:underline block truncate"
            >
              {project.user.displayName}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-purple-600/80">
            <Heart className={cn("h-3 w-3", localIsLiked ? "fill-purple-600 text-purple-600" : "text-purple-500")} />
            <span>{localLikes}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-600/80">
            <MessageCircle className="h-3 w-3 text-purple-500" />
            <span>{project.comments}</span>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={`${window.location.origin}/projects/${project.id}`}
        title={project.title}
        description={project.description}
        type="project"
        author={project.user}
        image={project.thumbnail_url}
      />
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? "الإبلاغ عن مشروع" : "Report Project"}</DialogTitle>
            <DialogDescription>{isRtl ? "يرجى اختيار سبب الإبلاغ عن هذا المشروع. سيقوم فريقنا بمراجعته." : "Please select a reason for reporting this project. Our team will review it."}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <select
              className="w-full border rounded p-2 mb-2 dark:bg-muted dark:text-foreground dark:border-muted"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              disabled={isSubmittingReport}
            >
              <option value="">{isRtl ? "اختر السبب" : "Select reason"}</option>
              <option value="spam">{isRtl ? "سبام / محتوى مزعج" : "Spam"}</option>
              <option value="theft">{isRtl ? "سرقة / محتوى مسروق" : "Theft"}</option>
              <option value="other">{isRtl ? "أخرى" : "Other"}</option>
            </select>
            {reportReason === "other" && (
              <textarea
                className="w-full border rounded p-2 mb-2 dark:bg-muted dark:text-foreground dark:border-muted"
                placeholder={isRtl ? "يرجى توضيح السبب..." : "Please specify..."}
                value={reportReason === "other" ? reportReason : ""}
                onChange={e => setReportReason(e.target.value)}
                disabled={isSubmittingReport}
              />
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{isRtl ? "إلغاء" : "Cancel"}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={async () => {
              setIsSubmittingReport(true);
              await reportProjectUnified(project.id, reportReason);
              setIsSubmittingReport(false);
              setIsReportDialogOpen(false);
            }} disabled={isSubmittingReport || !reportReason}>
              {isSubmittingReport ? (isRtl ? "جارٍ الإبلاغ..." : "Reporting...") : (isRtl ? "إبلاغ" : "Report")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}