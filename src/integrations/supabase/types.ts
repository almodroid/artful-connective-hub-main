export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      reels: {
        Row: {
          id: string
          caption: string | null
          video_url: string
          thumbnail_url: string | null
          duration: number | null
          likes_count: number | null
          comments_count: number | null
          views_count: number | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caption?: string | null
          video_url: string
          thumbnail_url?: string | null
          duration?: number | null
          likes_count?: number | null
          comments_count?: number | null
          views_count?: number | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caption?: string | null
          video_url?: string
          thumbnail_url?: string | null
          duration?: number | null
          likes_count?: number | null
          comments_count?: number | null
          views_count?: number | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_comments: {
        Row: {
          id: string
          reel_id: string | null
          user_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          reel_id?: string | null
          user_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          reel_id?: string | null
          user_id?: string
          content?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          id: string
          reel_id: string | null
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          reel_id?: string | null
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          reel_id?: string | null
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_link: string | null
          action_type: string | null
          created_at: string
          id: string
          is_global: boolean
          message: string
          read: boolean
          sender_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_link?: string | null
          action_type?: string | null
          created_at?: string
          id?: string
          is_global?: boolean
          message: string
          read?: boolean
          sender_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_link?: string | null
          action_type?: string | null
          created_at?: string
          id?: string
          is_global?: boolean
          message?: string
          read?: boolean
          sender_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          media_urls: string[] | null
          likes_count: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          header_image: string | null
          id: string
          is_admin: boolean
          location: string | null
          username: string
          website: string | null
          followers_count?: number
          following_count?: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          header_image?: string | null
          id: string
          is_admin?: boolean
          location?: string | null
          username: string
          website?: string | null
          followers_count?: number
          following_count?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          header_image?: string | null
          id?: string
          is_admin?: boolean
          location?: string | null
          username?: string
          website?: string | null
          followers_count?: number
          following_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          content_blocks: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          external_link: string | null
          id: string
          image_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          content_blocks?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          content_blocks?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            referencedRelation: "post_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      followers: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reel_reports: {
        Row: {
          id: string
          reel_id: string
          reporter_id: string
          reason: string
          status: string
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          reel_id: string
          reporter_id: string
          reason: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          reel_id?: string
          reporter_id?: string
          reason?: string
          status?: string
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_reports_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_following: {
        Args: {
          follower_id: string
          following_id: string
        }
        Returns: boolean
      }
      increment_project_views: {
        Args: {
          project_id: string
        }
        Returns: void
      }
      increment_reel_views: {
        Args: {
          reel_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
