// src/lib/config.ts - Configuração Robusta com Separação Client/Server

/**
 * Configuração centralizada com separação clara entre client e server
 * Evita erros de timing e validação desnecessária no client-side
 */

// ===== TIPOS =====

interface DatabaseConfig {
  url: string;
  directUrl: string;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
}

interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  isConfigured: boolean;
}

interface UploadConfig {
  folder: string;
  maxFileSize: number;
}

interface EnvironmentConfig {
  nodeEnv: "development" | "production" | "test";
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isClient: boolean;
  isServer: boolean;
}

interface UrlsConfig {
  nextAuth: string;
  app: string;
}

// ===== HELPERS =====

/**
 * Detecta se está rodando no cliente ou servidor
 */
const isClientSide = typeof window !== "undefined";
const isServerSide = !isClientSide;

/**
 * Obtém variável de ambiente com fallback seguro
 * Não lança erros, apenas retorna valor padrão
 */
function getEnvVar(key: string, defaultValue: string = ""): string {
  // No cliente, apenas variáveis NEXT_PUBLIC_* estão disponíveis
  if (isClientSide && !key.startsWith("NEXT_PUBLIC_")) {
    return defaultValue;
  }

  // Durante build, retorna valor padrão
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return defaultValue;
  }

  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
}

/**
 * Obtém configuração do ambiente atual
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || "development") as
    | "development"
    | "production"
    | "test";

  return {
    nodeEnv,
    isDevelopment: nodeEnv === "development",
    isProduction: nodeEnv === "production",
    isTest: nodeEnv === "test",
    isClient: isClientSide,
    isServer: isServerSide,
  };
}

// ===== CONFIGURAÇÕES DO SERVIDOR (apenas server-side) =====

/**
 * Configurações que só devem existir no servidor
 */
const serverConfig = {
  database: (): DatabaseConfig => ({
    url: getEnvVar("DATABASE_URL", "postgresql://localhost:5432/fradema"),
    directUrl: getEnvVar("DIRECT_URL", "postgresql://localhost:5432/fradema"),
  }),

  auth: (): AuthConfig => ({
    jwtSecret: getEnvVar(
      "JWT_SECRET",
      "development-secret-change-in-production"
    ),
    jwtExpiresIn: getEnvVar("JWT_EXPIRES_IN", "1h"),
    refreshTokenExpiresIn: getEnvVar("REFRESH_TOKEN_EXPIRES_IN", "7d"),
  }),

  email: (): EmailConfig => {
    const smtp = {
      host: getEnvVar("SMTP_HOST", "smtp.gmail.com"),
      port: parseInt(getEnvVar("SMTP_PORT", "587"), 10),
      user: getEnvVar("SMTP_USER", ""),
      password: getEnvVar("SMTP_PASSWORD", ""),
      from: getEnvVar("SMTP_FROM", "noreply@fradema.com.br"),
    };

    return {
      smtp,
      isConfigured: !!smtp.user && !!smtp.password,
    };
  },

  supabaseServiceKey: (): string => {
    return getEnvVar("SUPABASE_SERVICE_ROLE_KEY", "");
  },
};

// ===== CONFIGURAÇÕES DO CLIENTE (client-side safe) =====

/**
 * Configurações que podem ser acessadas no cliente
 */
const clientConfig = {
  supabase: {
    url: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", ""),
    anonKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
  },

  urls: {
    app: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  },

  upload: {
    folder: "uploads",
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};

// Configurações do Cloudinary
export const CLOUDINARY_CONFIG = {
  cloudName:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// ===== CONFIGURAÇÃO PRINCIPAL =====

/**
 * Configuração unificada com proteção client/server
 */
class Configuration {
  private env: EnvironmentConfig;

  constructor() {
    this.env = getEnvironmentConfig();
  }

  // Configurações sempre disponíveis
  get environment() {
    return this.env;
  }

  get urls() {
    return {
      ...clientConfig.urls,
      nextAuth: isServerSide
        ? getEnvVar("NEXTAUTH_URL", "http://localhost:3000")
        : clientConfig.urls.app,
    };
  }

  get upload() {
    return clientConfig.upload;
  }

  // Configurações apenas client-side
  get supabase() {
    return {
      url: clientConfig.supabase.url,
      anonKey: clientConfig.supabase.anonKey,
      // Service key só no servidor
      serviceRoleKey: isServerSide
        ? serverConfig.supabaseServiceKey()
        : undefined,
    };
  }

  // Configurações apenas server-side
  get database() {
    if (isClientSide) {
      throw new Error("Database config is only available on the server");
    }
    return serverConfig.database();
  }

  get auth() {
    if (isClientSide) {
      throw new Error("Auth config is only available on the server");
    }
    return serverConfig.auth();
  }

  get email() {
    if (isClientSide) {
      throw new Error("Email config is only available on the server");
    }
    return serverConfig.email();
  }

  // Helpers
  isConfigured(service: "supabase" | "email" | "database"): boolean {
    switch (service) {
      case "supabase":
        return !!this.supabase.url && !!this.supabase.anonKey;
      case "email":
        return isServerSide ? this.email.isConfigured : false;
      case "database":
        return isServerSide ? !!this.database.url : false;
      default:
        return false;
    }
  }

  /**
   * Valida configuração (apenas no servidor e desenvolvimento)
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Só valida no servidor
    if (isClientSide) {
      return { isValid: true, errors: [] };
    }

    // Só valida em desenvolvimento
    if (!this.env.isDevelopment) {
      return { isValid: true, errors: [] };
    }

    // Validações server-side
    if (!this.database.url) {
      errors.push("DATABASE_URL is not configured");
    }

    if (
      !this.auth.jwtSecret ||
      this.auth.jwtSecret === "development-secret-change-in-production"
    ) {
      errors.push("JWT_SECRET should be changed for production");
    }

    if (!this.supabase.url || !this.supabase.anonKey) {
      errors.push("Supabase configuration is incomplete");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// ===== EXPORT SINGLETON =====

const CONFIG = new Configuration();

// Validação apenas em desenvolvimento e no servidor
if (isServerSide && CONFIG.environment.isDevelopment) {
  const validation = CONFIG.validate();
  if (!validation.isValid) {
    console.warn("⚠️ Configuration warnings:");
    validation.errors.forEach((error) => console.warn(`   - ${error}`));
  }
}

export { CONFIG };

// Export helpers para uso direto
export const isServer = isServerSide;
export const isClient = isClientSide;
export const isDevelopment = CONFIG.environment.isDevelopment;
export const isProduction = CONFIG.environment.isProduction;

// Export types
export type {
  DatabaseConfig,
  SupabaseConfig,
  AuthConfig,
  EmailConfig,
  UploadConfig,
  EnvironmentConfig,
  UrlsConfig,
};
