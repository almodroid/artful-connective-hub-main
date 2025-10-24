export interface Post {
  id: string;
  createdAt: string | null;
  content: string;
  image_url?: string | null;
  user_id: string;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
    display_name?: string | null;
  };
  likes: number | null;
  comments_count: number | null;
  isLiked: boolean;
  comments: Comment[];
  media_urls?: string[] | null;
  tags?: string[] | null;
  title?: string | null;
  updated_at?: string | null;
}

export interface Comment {
  id: string;
  createdAt: string | null;
  content: string;
  user_id: string;
  likes_count: number | null;
  users: {
    id: string;
    username: string;
    avatar?: string | null;
    display_name?: string | null;
  };
}