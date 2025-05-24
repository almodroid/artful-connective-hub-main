export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          description: string
          tags: string[]
          image_urls: string[]
          cover_image_url: string
          content_blocks: Json
          external_link: string
          views: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          tags: string[]
          image_urls: string[]
          cover_image_url: string
          content_blocks?: Json
          external_link: string
          views?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          tags?: string[]
          image_urls?: string[]
          cover_image_url?: string
          content_blocks?: Json
          external_link?: string
          views?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_likes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}
