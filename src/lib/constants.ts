// src/lib/constants.ts

/**
 * Constantes da aplicação
 * Define valores constantes utilizados em toda a aplicação
 */

import { UserRole } from "@/types/auth";

/**
 * Constantes de autenticação e segurança
 */
export const AUTH_CONSTANTS = {
  // Limites de tentativas
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_PASSWORD_RESET_ATTEMPTS: 3,
  MAX_EMAIL_VERIFICATION_ATTEMPTS: 3,

  // Durações (em milliseconds)
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos antes do expire
  SESSION_CHECK_INTERVAL: 60 * 1000, // 1 minuto

  // Comprimentos de token
  VERIFICATION_TOKEN_LENGTH: 32,
  RESET_TOKEN_LENGTH: 32,
  SESSION_TOKEN_LENGTH: 64,

  // Cookies
  COOKIE_NAMES: {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    SESSION_TOKEN: "session_token",
    REMEMBER_ME: "remember_me",
  },
} as const;

/**
 * Constantes de validação
 */
export const VALIDATION_CONSTANTS = {
  // Usuário
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 254,
    BIO_MAX_LENGTH: 500,
  },

  // Senha
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS: '!@#$%^&*(),.?":{}|<>',
  },

  // Posts
  POST: {
    TITLE_MIN_LENGTH: 5,
    TITLE_MAX_LENGTH: 200,
    EXCERPT_MAX_LENGTH: 300,
    CONTENT_MIN_LENGTH: 100,
    CONTENT_MAX_LENGTH: 50000,
    SLUG_MAX_LENGTH: 100,
    META_TITLE_MAX_LENGTH: 60,
    META_DESCRIPTION_MAX_LENGTH: 160,
  },

  // Comentários
  COMMENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },

  // Categorias e Tags
  CATEGORY: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 200,
  },

  TAG: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 30,
  },
} as const;

/**
 * Regex patterns para validação
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  CEP: /^\d{5}-?\d{3}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{12,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

/**
 * Mensagens de erro padronizadas
 */
export const ERROR_MESSAGES = {
  // Autenticação
  AUTH: {
    INVALID_CREDENTIALS: "Email ou senha incorretos",
    EMAIL_NOT_VERIFIED: "Por favor, verifique seu email antes de fazer login",
    ACCOUNT_DISABLED:
      "Sua conta foi desativada. Entre em contato com o suporte",
    TOKEN_EXPIRED: "Sessão expirada. Faça login novamente",
    TOKEN_INVALID: "Token inválido ou expirado",
    UNAUTHORIZED: "Você precisa estar logado para acessar esta página",
    FORBIDDEN: "Você não tem permissão para acessar este recurso",
    ADMIN_REQUIRED: "Apenas administradores podem acessar esta funcionalidade",
    RATE_LIMIT_EXCEEDED: "Muitas tentativas. Tente novamente em alguns minutos",
  },

  // Validação
  VALIDATION: {
    REQUIRED_FIELD: "Este campo é obrigatório",
    INVALID_EMAIL: "Email inválido",
    INVALID_PHONE: "Telefone inválido. Use o formato (11) 99999-9999",
    INVALID_CPF: "CPF inválido",
    INVALID_CNPJ: "CNPJ inválido",
    INVALID_CEP: "CEP inválido",
    WEAK_PASSWORD:
      "Senha muito fraca. Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos",
    PASSWORDS_DONT_MATCH: "As senhas não coincidem",
    EMAIL_ALREADY_EXISTS: "Este email já está cadastrado",
    INVALID_FILE_TYPE: "Tipo de arquivo não permitido",
    FILE_TOO_LARGE: "Arquivo muito grande",
    INVALID_DATE: "Data inválida",
    FUTURE_DATE_NOT_ALLOWED: "Data futura não é permitida",
  },

  // Operações
  OPERATION: {
    SAVE_ERROR: "Erro ao salvar. Tente novamente",
    DELETE_ERROR: "Erro ao excluir. Tente novamente",
    UPDATE_ERROR: "Erro ao atualizar. Tente novamente",
    LOAD_ERROR: "Erro ao carregar dados. Tente novamente",
    NETWORK_ERROR: "Erro de conexão. Verifique sua internet",
    SERVER_ERROR: "Erro interno do servidor. Tente novamente mais tarde",
    NOT_FOUND: "Recurso não encontrado",
    CONFLICT: "Conflito de dados. Atualize a página e tente novamente",
  },

  // Upload
  UPLOAD: {
    FAILED: "Falha no upload do arquivo",
    INVALID_FORMAT: "Formato de arquivo não suportado",
    TOO_LARGE: "Arquivo muito grande. Máximo permitido: {size}MB",
    TOO_MANY_FILES: "Muitos arquivos selecionados. Máximo: {count}",
  },
} as const;

/**
 * Mensagens de sucesso padronizadas
 */
export const SUCCESS_MESSAGES = {
  // Autenticação
  AUTH: {
    LOGIN_SUCCESS: "Login realizado com sucesso!",
    LOGOUT_SUCCESS: "Logout realizado com sucesso!",
    REGISTER_SUCCESS: "Conta criada com sucesso! Verifique seu email",
    EMAIL_VERIFIED: "Email verificado com sucesso!",
    PASSWORD_RESET_SENT: "Instruções de reset enviadas para seu email",
    PASSWORD_CHANGED: "Senha alterada com sucesso!",
    PROFILE_UPDATED: "Perfil atualizado com sucesso!",
  },

  // Operações
  OPERATION: {
    SAVED: "Dados salvos com sucesso!",
    UPDATED: "Dados atualizados com sucesso!",
    DELETED: "Item excluído com sucesso!",
    CREATED: "Item criado com sucesso!",
    PUBLISHED: "Publicado com sucesso!",
    UNPUBLISHED: "Despublicado com sucesso!",
  },

  // Email
  EMAIL: {
    SENT: "Email enviado com sucesso!",
    VERIFIED: "Email verificado com sucesso!",
    SUBSCRIBED: "Inscrição realizada com sucesso!",
    UNSUBSCRIBED: "Inscrição cancelada com sucesso!",
  },
} as const;

/**
 * Constantes específicas do domínio tributário
 */
export const TAX_CONSTANTS = {
  // Regimes tributários
  TAX_REGIMES: [
    { value: "simples_nacional", label: "Simples Nacional", color: "#10B981" },
    { value: "lucro_presumido", label: "Lucro Presumido", color: "#3B82F6" },
    { value: "lucro_real", label: "Lucro Real", color: "#8B5CF6" },
    { value: "mei", label: "MEI", color: "#F59E0B" },
  ],

  // Tipos de empresa
  COMPANY_TYPES: [
    { value: "mei", label: "MEI - Microempreendedor Individual" },
    { value: "me", label: "ME - Microempresa" },
    { value: "epp", label: "EPP - Empresa de Pequeno Porte" },
    {
      value: "eireli",
      label: "EIRELI - Empresa Individual de Responsabilidade Limitada",
    },
    { value: "ltda", label: "LTDA - Sociedade Limitada" },
    { value: "sa", label: "SA - Sociedade Anônima" },
  ],

  // Impostos
  TAXES: [
    {
      code: "ICMS",
      name: "ICMS",
      description: "Imposto sobre Circulação de Mercadorias e Serviços",
    },
    { code: "ISS", name: "ISS", description: "Imposto sobre Serviços" },
    { code: "PIS", name: "PIS", description: "Programa de Integração Social" },
    {
      code: "COFINS",
      name: "COFINS",
      description: "Contribuição para o Financiamento da Seguridade Social",
    },
    {
      code: "IRPJ",
      name: "IRPJ",
      description: "Imposto de Renda Pessoa Jurídica",
    },
    {
      code: "CSLL",
      name: "CSLL",
      description: "Contribuição Social sobre o Lucro Líquido",
    },
    {
      code: "IPI",
      name: "IPI",
      description: "Imposto sobre Produtos Industrializados",
    },
    {
      code: "INSS",
      name: "INSS",
      description: "Instituto Nacional do Seguro Social",
    },
  ],

  // Obrigações acessórias
  OBLIGATIONS: [
    { code: "SPED_FISCAL", name: "SPED Fiscal", frequency: "MONTHLY" },
    { code: "SPED_CONTABIL", name: "SPED Contábil", frequency: "ANNUAL" },
    {
      code: "ECF",
      name: "ECF - Escrituração Contábil Fiscal",
      frequency: "ANNUAL",
    },
    {
      code: "DEFIS",
      name: "DEFIS - Declaração de Informações Socioeconômicas e Fiscais",
      frequency: "ANNUAL",
    },
    {
      code: "RAIS",
      name: "RAIS - Relação Anual de Informações Sociais",
      frequency: "ANNUAL",
    },
    {
      code: "CAGED",
      name: "CAGED - Cadastro Geral de Empregados e Desempregados",
      frequency: "MONTHLY",
    },
  ],
} as const;

/**
 * Status e estados da aplicação
 */
export const STATUS_CONSTANTS = {
  // Status de posts
  POST_STATUS: {
    DRAFT: { value: "draft", label: "Rascunho", color: "gray" },
    PUBLISHED: { value: "published", label: "Publicado", color: "green" },
    SCHEDULED: { value: "scheduled", label: "Agendado", color: "blue" },
    ARCHIVED: { value: "archived", label: "Arquivado", color: "yellow" },
  },

  // Status de usuários
  USER_STATUS: {
    ACTIVE: { value: "active", label: "Ativo", color: "green" },
    INACTIVE: { value: "inactive", label: "Inativo", color: "gray" },
    SUSPENDED: { value: "suspended", label: "Suspenso", color: "red" },
    PENDING: { value: "pending", label: "Pendente", color: "yellow" },
  },

  // Status de comentários
  COMMENT_STATUS: {
    PENDING: { value: "pending", label: "Pendente", color: "yellow" },
    APPROVED: { value: "approved", label: "Aprovado", color: "green" },
    REJECTED: { value: "rejected", label: "Rejeitado", color: "red" },
    SPAM: { value: "spam", label: "Spam", color: "red" },
  },

  // Status de verificação
  VERIFICATION_STATUS: {
    VERIFIED: { value: "verified", label: "Verificado", color: "green" },
    UNVERIFIED: { value: "unverified", label: "Não Verificado", color: "red" },
    PENDING: { value: "pending", label: "Pendente", color: "yellow" },
  },
} as const;

/**
 * Configurações de UI e UX
 */
export const UI_CONSTANTS = {
  // Breakpoints (deve coincidir com Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    "2XL": 1536,
  },

  // Delays e durações
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
  },

  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },

  // Tamanhos
  SIZES: {
    AVATAR: {
      SM: 32,
      MD: 40,
      LG: 48,
      XL: 64,
    },
    ICON: {
      SM: 16,
      MD: 20,
      LG: 24,
      XL: 32,
    },
  },

  // Limites de paginação
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    POSTS_PER_PAGE: 12,
    COMMENTS_PER_PAGE: 20,
    USERS_PER_PAGE: 25,
  },
} as const;

/**
 * Constantes de tempo
 */
export const TIME_CONSTANTS = {
  // Milliseconds
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,

  // Durações específicas
  TOKEN_EXPIRY: {
    ACCESS: 60 * 60 * 1000, // 1 hora
    REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 dias
    VERIFICATION: 24 * 60 * 60 * 1000, // 24 horas
    RESET: 60 * 60 * 1000, // 1 hora
  },

  // Timeouts
  TIMEOUT: {
    API_REQUEST: 30 * 1000, // 30 segundos
    FILE_UPLOAD: 5 * 60 * 1000, // 5 minutos
    SEARCH_DEBOUNCE: 300, // 300ms
    TOAST_DISPLAY: 5 * 1000, // 5 segundos
  },
} as const;

/**
 * Roles e permissões
 */
export const ROLE_CONSTANTS = {
  // Definição de roles com metadados
  ROLES: {
    [UserRole.SUBSCRIBER]: {
      label: "Assinante",
      description: "Usuário básico com acesso de leitura",
      color: "gray",
      priority: 1,
      permissions: ["read:published"],
    },
    [UserRole.AUTHOR]: {
      label: "Autor",
      description: "Pode criar e editar seus próprios posts",
      color: "green",
      priority: 2,
      permissions: ["read:all", "write:own_posts", "edit:own_posts"],
    },
    [UserRole.EDITOR]: {
      label: "Editor",
      description: "Pode moderar conteúdo e gerenciar posts",
      color: "blue",
      priority: 3,
      permissions: [
        "read:all",
        "write:posts",
        "edit:posts",
        "moderate:comments",
      ],
    },
    [UserRole.ADMIN]: {
      label: "Administrador",
      description: "Acesso total ao sistema",
      color: "red",
      priority: 4,
      permissions: ["*"],
    },
  },

  // Hierarquia de roles
  ROLE_HIERARCHY: [
    UserRole.SUBSCRIBER,
    UserRole.AUTHOR,
    UserRole.EDITOR,
    UserRole.ADMIN,
  ],

  // Permissões disponíveis
  PERMISSIONS: [
    "read:published",
    "read:all",
    "write:own_posts",
    "write:posts",
    "edit:own_posts",
    "edit:posts",
    "delete:own_posts",
    "delete:posts",
    "moderate:comments",
    "manage:users",
    "manage:system",
    "access:admin",
  ],
} as const;

/**
 * Configurações de arquivo e upload
 */
export const FILE_CONSTANTS = {
  // Tipos de arquivo permitidos
  ALLOWED_TYPES: {
    IMAGES: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ],
    DOCUMENTS: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    VIDEOS: ["video/mp4", "video/webm", "video/ogg"],
    AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg"],
  },

  // Tamanhos máximos (em bytes)
  MAX_SIZES: {
    AVATAR: 2 * 1024 * 1024, // 2MB
    POST_IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
  },

  // Dimensões de imagem
  IMAGE_DIMENSIONS: {
    AVATAR: { width: 400, height: 400 },
    THUMBNAIL: { width: 300, height: 200 },
    MEDIUM: { width: 800, height: 600 },
    LARGE: { width: 1200, height: 900 },
  },
} as const;

/**
 * Configurações específicas do blog
 */
export const BLOG_CONSTANTS = {
  // Categorias com metadados
  CATEGORIES: [
    {
      id: "tributario",
      name: "Tributário",
      slug: "tributario",
      description: "Artigos sobre direito tributário e fiscal",
      color: "#3B82F6",
      icon: "⚖️",
    },
    {
      id: "fiscal",
      name: "Fiscal",
      slug: "fiscal",
      description: "Conteúdo sobre obrigações fiscais e compliance",
      color: "#10B981",
      icon: "📊",
    },
    {
      id: "contabil",
      name: "Contábil",
      slug: "contabil",
      description: "Temas relacionados à contabilidade empresarial",
      color: "#F59E0B",
      icon: "💰",
    },
    {
      id: "legislacao",
      name: "Legislação",
      slug: "legislacao",
      description: "Atualizações e análises de legislação",
      color: "#8B5CF6",
      icon: "📜",
    },
    {
      id: "planejamento",
      name: "Planejamento Tributário",
      slug: "planejamento",
      description: "Estratégias de planejamento fiscal",
      color: "#EF4444",
      icon: "🎯",
    },
  ],

  // Tags populares
  POPULAR_TAGS: [
    "ICMS",
    "ISS",
    "PIS/COFINS",
    "Lucro Presumido",
    "Lucro Real",
    "Simples Nacional",
    "MEI",
    "Imposto de Renda",
    "Reforma Tributária",
    "Compliance",
    "Auditoria",
    "Contabilidade",
    "Planejamento",
    "SPED",
    "ECF",
    "NFe",
    "Escrituração",
    "Elisão Fiscal",
  ],

  // Configurações de conteúdo
  CONTENT: {
    WORDS_PER_MINUTE: 200, // Para cálculo de tempo de leitura
    EXCERPT_LENGTH: 160,
    RELATED_POSTS_COUNT: 4,
    POPULAR_POSTS_COUNT: 5,
    RECENT_POSTS_COUNT: 10,
  },
} as const;

/**
 * Configurações de notificação
 */
export const NOTIFICATION_CONSTANTS = {
  // Tipos de notificação
  TYPES: {
    INFO: { value: "info", label: "Informação", color: "blue" },
    SUCCESS: { value: "success", label: "Sucesso", color: "green" },
    WARNING: { value: "warning", label: "Aviso", color: "yellow" },
    ERROR: { value: "error", label: "Erro", color: "red" },
  },

  // Posições do toast
  POSITIONS: {
    TOP_LEFT: "top-left",
    TOP_RIGHT: "top-right",
    BOTTOM_LEFT: "bottom-left",
    BOTTOM_RIGHT: "bottom-right",
    TOP_CENTER: "top-center",
    BOTTOM_CENTER: "bottom-center",
  },

  // Durações
  DURATIONS: {
    SHORT: 3000,
    NORMAL: 5000,
    LONG: 8000,
    PERSISTENT: Infinity,
  },
} as const;

/**
 * Export de todas as constantes em um objeto único
 */
export const CONSTANTS = {
  AUTH: AUTH_CONSTANTS,
  VALIDATION: VALIDATION_CONSTANTS,
  REGEX: REGEX_PATTERNS,
  ERRORS: ERROR_MESSAGES,
  SUCCESS: SUCCESS_MESSAGES,
  TAX: TAX_CONSTANTS,
  STATUS: STATUS_CONSTANTS,
  UI: UI_CONSTANTS,
  TIME: TIME_CONSTANTS,
  ROLES: ROLE_CONSTANTS,
  FILES: FILE_CONSTANTS,
  BLOG: BLOG_CONSTANTS,
  NOTIFICATIONS: NOTIFICATION_CONSTANTS,
} as const;

/**
 * Type helpers para as constantes
 */
export type AuthConstants = typeof AUTH_CONSTANTS;
export type ValidationConstants = typeof VALIDATION_CONSTANTS;
export type TaxConstants = typeof TAX_CONSTANTS;
export type StatusConstants = typeof STATUS_CONSTANTS;
export type UIConstants = typeof UI_CONSTANTS;
export type AllConstants = typeof CONSTANTS;

/**
 * Função utilitária para obter mensagem de erro formatada
 */
export function getErrorMessage(
  category: keyof typeof ERROR_MESSAGES,
  key: string,
  replacements?: Record<string, string | number>
): string {
  const messages = ERROR_MESSAGES[category] as Record<string, string>;
  let message = messages[key] || "Erro desconhecido";

  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      message = message.replace(`{${placeholder}}`, String(value));
    });
  }

  return message;
}

/**
 * Função utilitária para obter informações de role
 */
export function getRoleInfo(role: UserRole) {
  return ROLE_CONSTANTS.ROLES[role];
}

/**
 * Função utilitária para verificar se uma role tem prioridade maior que outra
 */
export function hasHigherPriority(role1: UserRole, role2: UserRole): boolean {
  const info1 = getRoleInfo(role1);
  const info2 = getRoleInfo(role2);
  return info1.priority > info2.priority;
}

/**
 * Função utilitária para obter categoria do blog por slug
 */
export function getBlogCategory(slug: string) {
  return BLOG_CONSTANTS.CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Função utilitária para formatar tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Função utilitária para verificar se um tipo de arquivo é permitido
 */
export function isFileTypeAllowed(
  fileType: string,
  category: keyof typeof FILE_CONSTANTS.ALLOWED_TYPES
): boolean {
  return (FILE_CONSTANTS.ALLOWED_TYPES[category] as readonly string[]).includes(fileType);
}

/**
 * Função utilitária para calcular tempo de leitura
 */
export function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(
    wordCount / BLOG_CONSTANTS.CONTENT.WORDS_PER_MINUTE
  );
  return Math.max(1, readingTime);
}

// Congelar objetos para prevenir mutação acidental
Object.freeze(CONSTANTS);
Object.freeze(AUTH_CONSTANTS);
Object.freeze(VALIDATION_CONSTANTS);
Object.freeze(REGEX_PATTERNS);
Object.freeze(ERROR_MESSAGES);
Object.freeze(SUCCESS_MESSAGES);
Object.freeze(TAX_CONSTANTS);
Object.freeze(STATUS_CONSTANTS);
Object.freeze(UI_CONSTANTS);
Object.freeze(TIME_CONSTANTS);
Object.freeze(ROLE_CONSTANTS);
Object.freeze(FILE_CONSTANTS);
Object.freeze(BLOG_CONSTANTS);
Object.freeze(NOTIFICATION_CONSTANTS);
