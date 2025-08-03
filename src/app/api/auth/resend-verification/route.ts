// src/app/api/auth/resend-verification/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { validateEmail, createEmailVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { AuthErrorCode } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Email é obrigatório",
          },
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Email inválido",
          },
        },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      // Por segurança, não revelar se o email existe
      return NextResponse.json({
        message:
          "Se o email existir e não estiver verificado, um novo link será enviado",
      });
    }

    // Verificar se já está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Este email já está verificado",
          },
        },
        { status: 400 }
      );
    }

    // Verificar rate limiting (máximo 3 envios por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await db.verificationToken.count({
      where: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentTokens >= 3) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Muitos emails enviados. Aguarde 1 hora.",
          },
        },
        { status: 429 }
      );
    }

    // Invalidar tokens antigos
    await db.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Criar novo token
    const verificationToken = await createEmailVerificationToken(user.id);

    // Enviar email (se configurado)
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      // Não falhar a operação se email não puder ser enviado
    }

    return NextResponse.json({
      message:
        "Se o email existir e não estiver verificado, um novo link será enviado",
    });
  } catch (error) {
    console.error("Erro ao reenviar verificação:", error);

    return NextResponse.json(
      {
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: "Erro interno do servidor",
        },
      },
      { status: 500 }
    );
  }
}
