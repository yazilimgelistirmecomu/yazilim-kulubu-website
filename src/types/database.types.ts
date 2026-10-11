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
      applications: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          status?: string | null
          type?: string
        }
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          title: string
          type: 'featured' | 'upcoming' | 'past'
          capacity: number | null
          registration_url: string | null
          gallery_urls: string[] | null
          is_homepage_featured: boolean
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title: string
          type?: 'featured' | 'upcoming' | 'past'
          capacity?: number | null
          registration_url?: string | null
          gallery_urls?: string[] | null
          is_homepage_featured?: boolean
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title?: string
          type?: 'featured' | 'upcoming' | 'past'
          capacity?: number | null
          registration_url?: string | null
          gallery_urls?: string[] | null
          is_homepage_featured?: boolean
          slug?: string | null
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_order: number
          department: string | null
          first_name: string | null
          github_url: string | null
          id: string
          instagram_url: string | null
          is_public: boolean
          last_name: string | null
          linkedin_url: string | null
          position: string | null
          role: 'member' | 'admin' | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_order?: number
          department?: string | null
          first_name?: string | null
          github_url?: string | null
          id: string
          instagram_url?: string | null
          is_public?: boolean
          last_name?: string | null
          linkedin_url?: string | null
          position?: string | null
          role?: 'member' | 'admin' | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_order?: number
          department?: string | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean
          last_name?: string | null
          linkedin_url?: string | null
          position?: string | null
          role?: 'member' | 'admin' | null
        }
      }
      developers: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          email: string | null
          linkedin_url: string | null
          github_url: string | null
          website_url: string | null
          instagram_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          avatar_url?: string | null
          email?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          instagram_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          email?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          instagram_url?: string | null
          created_at?: string
        }
      }
      project_developers: {
        Row: {
          id: string
          project_id: string
          developer_id: string | null
          profile_id: string | null
          role: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          developer_id?: string | null
          profile_id?: string | null
          role?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          developer_id?: string | null
          profile_id?: string | null
          role?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          profile_id: string | null
          project_id: string | null
          role: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          project_id?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          project_id?: string | null
          role?: string | null
        }
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          demo_url: string | null
          description: string
          github_url: string | null
          id: string
          image_url: string | null
          is_club_project: boolean | null
          show_on_homepage: boolean
          homepage_order: number | null
          slug: string | null
          summary: string | null
          content_md: string | null
          is_featured_club_project: boolean
          status: 'pending' | 'approved' | 'rejected' | null
          tech_stack: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          demo_url?: string | null
          description: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_club_project?: boolean | null
          show_on_homepage?: boolean
          homepage_order?: number | null
          slug?: string | null
          summary?: string | null
          content_md?: string | null
          is_featured_club_project?: boolean
          status?: 'pending' | 'approved' | 'rejected' | null
          tech_stack?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          demo_url?: string | null
          description?: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_club_project?: boolean | null
          show_on_homepage?: boolean
          homepage_order?: number | null
          slug?: string | null
          summary?: string | null
          content_md?: string | null
          is_featured_club_project?: boolean
          status?: 'pending' | 'approved' | 'rejected' | null
          tech_stack?: string[] | null
          title?: string
        }
      }
    }
  }
}
