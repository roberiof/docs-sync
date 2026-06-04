/**
 * Database types for the Supabase Postgres schema.
 *
 * Hand-authored to match supabase/migrations/*. Once the project is linked,
 * regenerate with:
 *   supabase gen types typescript --linked > src/lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CollaboratorRole = "editor" | "viewer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title?: string;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_collaborators: {
        Row: {
          document_id: string;
          user_id: string;
          role: CollaboratorRole;
          created_at: string;
        };
        Insert: {
          document_id: string;
          user_id: string;
          role?: CollaboratorRole;
          created_at?: string;
        };
        Update: {
          document_id?: string;
          user_id?: string;
          role?: CollaboratorRole;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_document_owner: {
        Args: { doc_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
