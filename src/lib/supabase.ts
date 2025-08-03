// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Verificar se o Supabase está configurado
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Cliente Supabase (só criado se configurado)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client para operações servidor-side (só criado se configurado)
export const supabaseAdmin =
  isSupabaseConfigured && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// Função para verificar se o Supabase está disponível
export const isSupabaseAvailable = () => {
  return !!supabase && !!supabaseAdmin;
};

// Função para obter o cliente Supabase com verificação
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }
  return supabase;
};

// Função para obter o cliente admin do Supabase com verificação
export const getSupabaseAdminClient = () => {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase admin not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }
  return supabaseAdmin;
};

// Tipos para database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar: string | null;
          role: "ADMIN" | "EDITOR" | "AUTHOR" | "SUBSCRIBER";
          password_hash: string;
          created_at: string;
          updated_at: string;
          email_verified: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar?: string | null;
          role?: "ADMIN" | "EDITOR" | "AUTHOR" | "SUBSCRIBER";
          password_hash: string;
          created_at?: string;
          updated_at?: string;
          email_verified?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar?: string | null;
          role?: "ADMIN" | "EDITOR" | "AUTHOR" | "SUBSCRIBER";
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
          email_verified?: boolean;
        };
      };
    };
  };
};

// Configurações de autenticação
export const authConfig = {
  // Configurações de sessão
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // 24 horas
  },

  // Configurações de token
  token: {
    accessTokenExpiry: 60 * 60, // 1 hora
    refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 dias
    verificationTokenExpiry: 24 * 60 * 60, // 24 horas
  },

  // Configurações de senha
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
};
