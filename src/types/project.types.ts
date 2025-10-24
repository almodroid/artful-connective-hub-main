import { Json } from '@/types/supabase';

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_urls: string[];
  cover_image_url: string;
  content_blocks: Json;
  external_link: string;
  views: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  is_liked_by_user?: boolean;
  project_url?: string;
  github_url?: string;
  profiles?: { username: string; display_name?: string; avatar_url?: string };
  avatar_url?: {avatar_url: string};
  display_name?: {display_name: string};
}

export interface CreateProjectInput {
  title: string;
  description: string;
  tags: string[];
  external_link?: string;
  cover_image?: File | null;
  gallery_images?: File[];
  content_blocks?: Json;
}

export interface ProjectDetails extends Project {
  user: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  likes_count: number;
  is_liked_by_user: boolean;
}

// Types for post/comment interactions
export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface ProjectLike {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
}

export interface ProjectCardType extends Project {
  comments: number;
  likes: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
}
