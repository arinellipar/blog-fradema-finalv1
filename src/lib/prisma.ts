// src/lib/prisma.ts - VERSÃO CORRIGIDA COM TYPE SAFETY

import { PrismaClient, Prisma } from "@prisma/client";
import * as crypto from "crypto";

/**
 * Prisma Client com Type Safety Completa
 *
 * @architecture
 * - Singleton pattern para evitar múltiplas conexões
 * - Type-safe sem usar extensões problemáticas
 * - Operações diretas sem wrapper methods complexos
 * - Error handling robusto
 */

// Configuração de log condicional
const logConfig: Prisma.LogLevel[] =
  process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"];

// Singleton global para evitar múltiplas instâncias
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cliente Prisma configurado
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Exportação como 'db' para compatibilidade
export const db = prisma;

/**
 * Utility functions para operações comuns
 * Implementadas como funções puras, não como extensões
 */
export const dbUtils = {
  /**
   * Buscar usuário por email com relações
   */
  async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          preferences: true,
          metadata: true,
        },
      });
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  },

  /**
   * Criar usuário com preferências e metadata padrão
   */
  async createUserWithDefaults(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: "ADMIN" | "EDITOR" | "AUTHOR" | "SUBSCRIBER";
    avatar?: string;
    registrationSource?: string;
    referralCode?: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verificar se email já existe
        const existingUser = await tx.user.findUnique({
          where: { email: data.email.toLowerCase().trim() },
        });

        if (existingUser) {
          throw new Error("EMAIL_ALREADY_EXISTS");
        }

        // Criar usuário
        const user = await tx.user.create({
          data: {
            email: data.email.toLowerCase().trim(),
            name: data.name.trim(),
            passwordHash: data.passwordHash,
            role: data.role || "SUBSCRIBER",
            avatar: data.avatar,
            emailVerified: false,
          },
        });

        // Criar preferências
        await tx.userPreferences.create({
          data: {
            userId: user.id,
            theme: "system",
            language: "pt-BR",
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            newsletterSubscribed: false,
          },
        });

        // Criar metadata
        await tx.userMetadata.create({
          data: {
            userId: user.id,
            loginCount: 0,
            registrationSource: data.registrationSource || "web",
            referralCode: data.referralCode,
          },
        });

        // Retornar usuário completo
        return await tx.user.findUnique({
          where: { id: user.id },
          include: {
            preferences: true,
            metadata: true,
          },
        });
      });
    } catch (error) {
      console.error("Error creating user with defaults:", error);
      throw error;
    }
  },

  /**
   * Incrementar contador de login
   */
  async incrementLoginCount(userId: string, ipAddress?: string) {
    try {
      return await prisma.userMetadata.upsert({
        where: { userId },
        update: {
          loginCount: { increment: 1 },
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
        create: {
          userId,
          loginCount: 1,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
          registrationSource: "unknown",
        },
      });
    } catch (error) {
      console.error("Error incrementing login count:", error);
      throw error;
    }
  },

  /**
   * Criar sessão
   */
  async createSession(data: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt?: Date;
  }) {
    try {
      const token = generateSecureToken();
      const expiresAt =
        data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return await prisma.session.create({
        data: {
          userId: data.userId,
          token,
          expiresAt,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
        },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  },

  /**
   * Buscar sessão válida
   */
  async findValidSession(token: string) {
    try {
      return await prisma.session.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              preferences: true,
              metadata: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error finding valid session:", error);
      return null;
    }
  },

  /**
   * Limpar sessões expiradas
   */
  async cleanupExpiredSessions() {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired sessions`);
      }

      return result.count;
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
      return 0;
    }
  },

  /**
   * Criar token de verificação
   */
  async createVerificationToken(
    userId: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "MAGIC_LINK",
    expiresIn: number = 24 * 60 * 60 * 1000
  ) {
    try {
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + expiresIn);

      return await prisma.verificationToken.create({
        data: {
          userId,
          token,
          type,
          expiresAt,
          used: false,
        },
      });
    } catch (error) {
      console.error("Error creating verification token:", error);
      throw error;
    }
  },

  /**
   * Buscar token de verificação válido
   */
  async findValidVerificationToken(
    token: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "MAGIC_LINK"
  ) {
    try {
      return await prisma.verificationToken.findFirst({
        where: {
          token,
          type,
          used: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              preferences: true,
              metadata: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error finding valid verification token:", error);
      return null;
    }
  },

  /**
   * Limpar tokens expirados
   */
  async cleanupExpiredTokens() {
    try {
      const result = await prisma.verificationToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
        },
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired/used tokens`);
      }

      return result.count;
    } catch (error) {
      console.error("Error cleaning up tokens:", error);
      return 0;
    }
  },
};

/**
 * Gerar token seguro
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Cleanup automático a cada hora
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  const cleanupInterval = setInterval(async () => {
    try {
      await Promise.all([
        dbUtils.cleanupExpiredSessions(),
        dbUtils.cleanupExpiredTokens(),
      ]);
    } catch (error) {
      console.error("Error in scheduled cleanup:", error);
    }
  }, 60 * 60 * 1000); // 1 hora

  // Combined shutdown handler for interval and Prisma disconnect
  if (typeof process !== "undefined" && typeof process.on === "function") {
    process.on("beforeExit", async () => {
      clearInterval(cleanupInterval);
      await prisma.$disconnect();
    });
  }
}

export default db;
