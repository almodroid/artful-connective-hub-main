export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_urls: string[];
  cover_image_url?: string;
  content_blocks?: any[];
  external_link?: string | null;
  views: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  tags: string[];
  external_link?: string;
  cover_image?: File | null;
  gallery_images?: File[];
  content_blocks?: any[];
}

export interface ProjectDetails extends Project {
  user: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
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
