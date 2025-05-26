import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/use-translation";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from "./ShareModal";

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

  return (
    <div 
      className="bg-card rounded-lg border p-4 space-y-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3  text-start">
        <Link to={`/profile/${project.user.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={project.user.avatar} alt={project.user.displayName} />
            <AvatarFallback>{project.user.displayName[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link 
            to={`/profile/${project.user.username}`}
            className="font-medium hover:underline"
          >
            {project.user.displayName}
          </Link>
          <div className="text-sm text-muted-foreground">
            @{project.user.username} • {formatDistanceToNow(project.createdAt, { 
              addSuffix: true,
              locale: isRtl ? ar : undefined
            })}
          </div>
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <img
          src={project.thumbnail_url}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-start">{project.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 text-start">{project.description}</p>
        
        <div className="flex gap-2">
          {project.project_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {isRtl ? "عرض المشروع" : "View Project"}
              </a>
            </Button>
          )}
          {project.github_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={async () => {
            if (!isAuthenticated) {
              toast.error(isRtl ? "يرجى تسجيل الدخول للإعجاب" : "Please login to like");
              return;
            }
            
            // Optimistic update
            const wasLiked = localIsLiked;
            setLocalIsLiked(!wasLiked);
            setLocalLikes(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
            
            try {
              if (wasLiked) {
                // Unlike the project
                const { error } = await supabase
                  .from('project_likes')
                  .delete()
                  .eq('project_id', project.id)
                  .eq('user_id', user?.id);
                  
                if (error) throw error;
                toast.success(isRtl ? 'تم إزالة الإعجاب بنجاح' : 'Successfully unliked');
              } else {
                // Like the project
                const { error } = await supabase
                  .from('project_likes')
                  .upsert(
                    { 
                      project_id: project.id, 
                      user_id: user?.id,
                      created_at: new Date().toISOString()
                    },
                    { onConflict: 'project_id,user_id' }
                  );
                  
                if (error) throw error;
                toast.success(isRtl ? 'تم تسجيل الإعجاب بنجاح' : 'Successfully liked');
              }
            } catch (error) {
              // Revert optimistic update on error
              setLocalIsLiked(wasLiked);
              setLocalLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
              toast.error(isRtl ? 'حدث خطأ أثناء تحديث الإعجاب' : 'Error updating like status');
              console.error('Like error:', error);
            }
          }}
        >
          <motion.div 
            whileTap={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Heart 
              className="h-4 w-4" 
              fill={localIsLiked ? "currentColor" : "none"}
              style={{ color: localIsLiked ? "#3b82f6" : "currentColor" }}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={localLikes}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {localLikes}
            </motion.span>
          </AnimatePresence>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onComment?.(project.id)}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{project.comments}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
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
    </div>
  );
} 