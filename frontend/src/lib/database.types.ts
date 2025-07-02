export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      payment_links: {
        Row: {
          id: string;
          invoice_id: string;
          customer_name: string;
          phone: string;
          amount: number;
          payment_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          customer_name: string;
          phone: string;
          amount: number;
          payment_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          customer_name?: string;
          phone?: string;
          amount?: number;
          payment_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "user";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: "admin" | "user";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "admin" | "user";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
