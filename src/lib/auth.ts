// src/lib/auth.ts - FUNÇÕES DE AUTENTICAÇÃO PARA ADMIN

import { NextRequest } from "next/server";
import * as jose from "jose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/prisma";
import { AuthErrorCode, UserRole, type DecodedToken } from "@/types/auth";

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Log para debug
console.log("JWT_SECRET configurado:", JWT_SECRET ? "Sim" : "Não");
console.log("JWT_EXPIRES_IN:", JWT_EXPIRES_IN);

/**
 * Extrai token de acesso do cookie da requisição
 */
export function extractTokenFromCookie(request: NextRequest): string | null {
  const accessToken = request.cookies.get("access_token")?.value;
  return accessToken || null;
}

/**
 * Verifica e decodifica o token JWT
 */
export async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      iat: payload.iat as number,
      exp: payload.exp as number,
      jti: payload.jti as string,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Gera token de acesso JWT
 */
export async function generateAccessToken(payload: {
  sub: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .setJti(crypto.randomUUID())
    .sign(secret);

  return token;
}

/**
 * Cria hash da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcryptjs.hash(password, saltRounds);
}

/**
 * Verifica senha usando bcrypt
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcryptjs.compare(password, hash);
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida força da senha
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  score: number;
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Verificações básicas
  if (password.length < 8) {
    errors.push("Senha deve ter pelo menos 8 caracteres");
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
    suggestions.push("Adicione letras minúsculas");
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
    suggestions.push("Adicione letras maiúsculas");
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um número");
    suggestions.push("Adicione números");
  } else {
    score += 1;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um caractere especial");
    suggestions.push("Adicione caracteres especiais (!@#$%^&*)");
  } else {
    score += 1;
  }

  // Verificar senhas comuns
  const commonPasswords = [
    "password",
    "123456",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Esta senha é muito comum");
    suggestions.push("Use uma senha mais única");
    score = Math.max(0, score - 2);
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
    score,
  };
}

/**
 * Cria sessão de usuário
 */
export async function createUserSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
  options?: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt?: Date;
  }
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt =
    options?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: userAgent || "Unknown",
      ipAddress: ipAddress || "Unknown",
    },
  });

  return token;
}

/**
 * Cria token de verificação de email
 */
export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  await db.verificationToken.create({
    data: {
      userId,
      token,
      type: "EMAIL_VERIFICATION",
      expiresAt,
      used: false,
    },
  });

  return token;
}

/**
 * Verifica token de verificação de email
 */
export async function verifyEmailVerificationToken(token: string) {
  const verificationToken = await db.verificationToken.findFirst({
    where: {
      token,
      type: "EMAIL_VERIFICATION",
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  if (!verificationToken) {
    return null;
  }

  // Marcar token como usado e verificar email
  await db.$transaction([
    db.verificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    }),
    db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    }),
  ]);

  return verificationToken.user;
}

/**
 * Cria token de reset de senha
 */
export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await db.verificationToken.create({
    data: {
      userId,
      token,
      type: "PASSWORD_RESET",
      expiresAt,
      used: false,
    },
  });

  return token;
}

/**
 * Verifica token de reset de senha
 */
export async function verifyPasswordResetToken(token: string) {
  const verificationToken = await db.verificationToken.findFirst({
    where: {
      token,
      type: "PASSWORD_RESET",
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  return verificationToken?.user || null;
}

/**
 * Atualiza senha do usuário
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string,
  resetToken?: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);

  await db.$transaction(async (tx) => {
    // Atualizar senha
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Marcar token como usado se fornecido
    if (resetToken) {
      await tx.verificationToken.updateMany({
        where: {
          token: resetToken,
          userId,
          type: "PASSWORD_RESET",
        },
        data: { used: true },
      });
    }

    // Invalidar todas as sessões ativas
    await tx.session.deleteMany({
      where: { userId },
    });
  });
}

/**
 * Obtém IP do cliente
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Obtém User-Agent da requisição
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Middleware de autenticação para verificar se é admin
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const token = extractTokenFromCookie(request);

    if (!token) {
      return {
        success: false,
        error: "Token não encontrado",
      };
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return {
        success: false,
        error: "Token inválido",
      };
    }

    if (payload.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Acesso negado - apenas administradores",
      };
    }

    // Buscar dados completos do usuário
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Usuário não encontrado",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Erro na verificação de admin:", error);
    return {
      success: false,
      error: "Erro interno",
    };
  }
}

/**
 * Middleware de autenticação para verificar se o usuário está autenticado
 */
export async function authGuard(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const token = extractTokenFromCookie(request);

    if (!token) {
      return {
        isAuthenticated: false,
        error: "Token não encontrado",
      };
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return {
        isAuthenticated: false,
        error: "Token inválido",
      };
    }

    // Buscar dados completos do usuário
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return {
        isAuthenticated: false,
        error: "Usuário não encontrado",
      };
    }

    return {
      isAuthenticated: true,
      user,
    };
  } catch (error) {
    console.error("Erro na verificação de autenticação:", error);
    return {
      isAuthenticated: false,
      error: "Erro interno",
    };
  }
}
