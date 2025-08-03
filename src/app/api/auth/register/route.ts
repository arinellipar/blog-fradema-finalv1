// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashPassword, validateEmail, validatePassword, generateAccessToken } from "@/lib/auth";
import { AuthErrorCode } from "@/types/auth";

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID().slice(0, 8);
  const startTime = performance.now();

  try {
    // 1. Parse e validação do body
    const body = await request.json();
    const { email, password, name, acceptTerms = false } = body;

    console.log(
      `[AUTH:${correlationId}] Register attempt for email: ${email?.substring(
        0,
        3
      )}***`
    );

    // 2. Validações básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Email, senha e nome são obrigatórios",
            correlationId,
          },
        },
        { status: 400 }
      );
    }

    // 3. Validar formato do email
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Email inválido",
            field: "email",
            correlationId,
          },
        },
        { status: 400 }
      );
    }

    // 4. Validar força da senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.WEAK_PASSWORD,
            message: "Senha muito fraca",
            field: "password",
            details: passwordValidation.errors,
            correlationId,
          },
        },
        { status: 400 }
      );
    }

    // 5. Verificar se email já existe
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
            message: "Email já está em uso",
            field: "email",
            correlationId,
          },
        },
        { status: 409 }
      );
    }

    // 6. Criar hash da senha
    const passwordHash = await hashPassword(password);

    // 7. Verificar se é o primeiro usuário registrado via interface (será administrador)
    // Buscar usuários que não foram criados via seed
    const nonSeedUsers = await db.user.count({
      where: {
        metadata: {
          registrationSource: {
            not: "seed",
          },
        },
      },
    });

    const isFirstRealUser = nonSeedUsers === 0;
    const userRole = isFirstRealUser ? "ADMIN" : "SUBSCRIBER";

    console.log(
      `[REGISTER] Usuários não-seed: ${nonSeedUsers}, será ${userRole}`
    );

    // 8. Criar usuário com transação
    const user = await db.$transaction(async (tx) => {
      // Criar usuário
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          passwordHash,
          role: userRole, // ADMIN se for o primeiro, SUBSCRIBER caso contrário
          emailVerified: isFirstRealUser, // Primeiro usuário já é verificado
        },
      });

      // Criar preferências padrão
      await tx.userPreferences.create({
        data: {
          userId: newUser.id,
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
          userId: newUser.id,
          loginCount: 0,
          registrationSource: "web",
        },
      });

      return newUser;
    });

    // 8. Buscar usuário completo com relações
    const userWithRelations = await db.user.findUnique({
      where: { id: user.id },
      include: {
        preferences: true,
        metadata: true,
      },
    });

    if (!userWithRelations) {
      throw new Error("Erro ao criar usuário");
    }

    // 9. Preparar resposta do usuário (sem dados sensíveis)
    const userResponse = {
      id: userWithRelations.id,
      email: userWithRelations.email,
      name: userWithRelations.name,
      avatar: userWithRelations.avatar,
      role: userWithRelations.role,
      createdAt: userWithRelations.createdAt,
      updatedAt: userWithRelations.updatedAt,
      emailVerified: userWithRelations.emailVerified,
      preferences: userWithRelations.preferences,
    };

    // 10. Gerar token de acesso
    const accessToken = await generateAccessToken({
      sub: userWithRelations.id,
      email: userWithRelations.email,
      role: userWithRelations.role,
    });

    // 11. Log de sucesso e métricas
    const executionTime = performance.now() - startTime;
    console.log(
      `[AUTH:${correlationId}] Registration successful for user: ${
        user.id
      } (${executionTime.toFixed(2)}ms)`
    );

    return NextResponse.json({
      user: userResponse,
      accessToken,
      message: "Usuário criado com sucesso",
      correlationId,
    });
  } catch (error) {
    const executionTime = performance.now() - startTime;

    console.error(`[AUTH:${correlationId}] Registration error:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      executionTime: `${executionTime.toFixed(2)}ms`,
    });

    return NextResponse.json(
      {
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: "Erro interno do servidor",
          correlationId,
        },
      },
      { status: 500 }
    );
  }
}
