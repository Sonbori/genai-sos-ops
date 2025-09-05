import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          type: 'government' | 'private' | 'ngo' | 'campus' | 'event'
          region: string | null
          contact_email: string | null
          contact_phone: string | null
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'government' | 'private' | 'ngo' | 'campus' | 'event'
          region?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'government' | 'private' | 'ngo' | 'campus' | 'event'
          region?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          role: 'admin' | 'operator' | 'user'
          full_name: string | null
          phone: string | null
          emergency_contact: string | null
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          role?: 'admin' | 'operator' | 'user'
          full_name?: string | null
          phone?: string | null
          emergency_contact?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          role?: 'admin' | 'operator' | 'user'
          full_name?: string | null
          phone?: string | null
          emergency_contact?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          organization_id: string | null
          category: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'active' | 'processing' | 'resolved' | 'closed'
          title: string
          description: string | null
          location_name: string | null
          location_coordinates: any | null
          location_accuracy: number | null
          ai_analysis: any | null
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          category: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status?: 'active' | 'processing' | 'resolved' | 'closed'
          title: string
          description?: string | null
          location_name?: string | null
          location_coordinates?: any | null
          location_accuracy?: number | null
          ai_analysis?: any | null
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          category?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'active' | 'processing' | 'resolved' | 'closed'
          title?: string
          description?: string | null
          location_name?: string | null
          location_coordinates?: any | null
          location_accuracy?: number | null
          ai_analysis?: any | null
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          incident_id: string | null
          organization_id: string | null
          reporter_id: string | null
          type: 'voice' | 'text' | 'image' | 'video' | 'multimodal'
          content: string | null
          media_urls: string[] | null
          location_coordinates: any | null
          location_accuracy: number | null
          confidence_score: number | null
          ai_summary: string | null
          ai_classification: any | null
          is_offline: boolean
          sync_status: 'pending' | 'synced' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          incident_id?: string | null
          organization_id?: string | null
          reporter_id?: string | null
          type: 'voice' | 'text' | 'image' | 'video' | 'multimodal'
          content?: string | null
          media_urls?: string[] | null
          location_coordinates?: any | null
          location_accuracy?: number | null
          confidence_score?: number | null
          ai_summary?: string | null
          ai_classification?: any | null
          is_offline?: boolean
          sync_status?: 'pending' | 'synced' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          incident_id?: string | null
          organization_id?: string | null
          reporter_id?: string | null
          type?: 'voice' | 'text' | 'image' | 'video' | 'multimodal'
          content?: string | null
          media_urls?: string[] | null
          location_coordinates?: any | null
          location_accuracy?: number | null
          confidence_score?: number | null
          ai_summary?: string | null
          ai_classification?: any | null
          is_offline?: boolean
          sync_status?: 'pending' | 'synced' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
