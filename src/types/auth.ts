// src/types/auth.ts

/**
 * Interface principal do usuário autenticado
 * Representa a estrutura de dados completa do usuário no sistema
 *
 * @interface User
 * @remarks
 * Esta interface segue o padrão de dados JWT com campos adicionais
 * para gerenciamento de perfil e permissões granulares
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  preferences?: UserPreferences;
  metadata?: UserMetadata;
}

/**
 * Enum de roles de usuário
 * Define níveis de acesso hierárquicos no sistema
 *
 * @enum {string}
 */
export enum UserRole {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  AUTHOR = "AUTHOR",
  SUBSCRIBER = "SUBSCRIBER",
}

/**
 * Interface de preferências do usuário
 * Armazena configurações personalizadas
 */
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  newsletterSubscribed: boolean;
}

/**
 * Metadados adicionais do usuário
 * Informações de tracking e analytics
 */
export interface UserMetadata {
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginCount: number;
  registrationSource?: string;
  referralCode?: string;
}

/**
 * Payload de registro de novo usuário
 * Dados necessários para criar uma conta
 *
 * @interface RegisterPayload
 */
export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  acceptTerms: boolean;
  newsletterOptIn?: boolean;
  referralCode?: string;
}

/**
 * Payload de login
 * Credenciais para autenticação
 *
 * @interface LoginPayload
 */
export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Resposta de autenticação do servidor
 * Contém tokens e dados do usuário
 *
 * @interface AuthResponse
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Estado de autenticação do contexto
 * Gerencia estado global de auth
 *
 * @interface AuthState
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Ações disponíveis no contexto de autenticação
 * API para operações de auth
 *
 * @interface AuthContextActions
 */
export interface AuthContextActions {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>; // ✅ Corrigido para retornar boolean
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>; // ✅ Corrigido para retornar boolean
  resetPassword: (email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void; // ✅ Adicionado método clearError
}

/**
 * Tipo do contexto de autenticação completo
 * União de estado e ações
 */
export type AuthContextType = AuthState & AuthContextActions;

/**
 * Erro de autenticação tipado
 * Padroniza tratamento de erros
 *
 * @interface AuthError
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
  details?: unknown;
}

/**
 * Códigos de erro de autenticação
 * Enumera possíveis falhas no processo
 *
 * @enum {string}
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ACCOUNT_DISABLED = "ACCOUNT_DISABLED",
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  INSUFFICIENT_PRIVILEGES = "INSUFFICIENT_PRIVILEGES",
  RATE_LIMITED = "RATE_LIMITED",
  DATABASE_ERROR = "DATABASE_ERROR",
}

/**
 * Regras de validação de senha
 * Define critérios de segurança
 *
 * @interface PasswordValidation
 */
export interface PasswordValidation {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
}

/**
 * Configuração padrão de validação de senha
 * Implementa OWASP guidelines
 */
export const DEFAULT_PASSWORD_VALIDATION: PasswordValidation = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
};

/**
 * Interface para token decodificado
 * Estrutura do payload JWT
 *
 * @interface DecodedToken
 */
export interface DecodedToken {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number; // issued at
  exp: number; // expiration
  jti?: string; // JWT ID for revocation
}

/**
 * Status de operação de autenticação
 * Usado para indicar sucesso/falha de operações que podem ter resultados diferentes
 *
 * @interface AuthOperationResult
 */
export interface AuthOperationResult {
  success: boolean;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

/**
 * Configurações de sessão
 * Define parâmetros de duração e comportamento de sessões
 *
 * @interface SessionConfig
 */
export interface SessionConfig {
  accessTokenExpiry: number; // em segundos
  refreshTokenExpiry: number; // em segundos
  rememberMeExpiry: number; // em segundos
  maxConcurrentSessions: number;
}

/**
 * Configuração padrão de sessão
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  accessTokenExpiry: 3600, // 1 hora
  refreshTokenExpiry: 604800, // 7 dias
  rememberMeExpiry: 2592000, // 30 dias
  maxConcurrentSessions: 5,
};
