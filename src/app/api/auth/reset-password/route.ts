// src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  validateEmail,
  createPasswordResetToken,
  verifyPasswordResetToken,
  updateUserPassword,
} from "@/lib/auth";
import { AuthErrorCode } from "@/types/auth";

// Solicitar reset de senha
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
          "Se o email existir, você receberá instruções para redefinir a senha",
      });
    }

    // Criar token de reset
    const resetToken = await createPasswordResetToken(user.id);

    // TODO: Enviar email com link de reset
    // await sendPasswordResetEmail(user.email, resetToken)

    return NextResponse.json({
      message:
        "Se o email existir, você receberá instruções para redefinir a senha",
    });
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);

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

// Confirmar reset de senha
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Token e nova senha são obrigatórios",
          },
        },
        { status: 400 }
      );
    }

    // Verificar token
    const user = await verifyPasswordResetToken(token);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: "Token inválido ou expirado",
          },
        },
        { status: 400 }
      );
    }

    // Atualizar senha
    await updateUserPassword(user.id, newPassword, token);

    return NextResponse.json({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

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
