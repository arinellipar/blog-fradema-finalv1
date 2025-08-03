// src/app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyEmailVerificationToken } from "@/lib/auth";
import { AuthErrorCode } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.VALIDATION_ERROR,
            message: "Token é obrigatório",
          },
        },
        { status: 400 }
      );
    }

    // Verificar token
    const user = await verifyEmailVerificationToken(token);
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

    return NextResponse.json({
      message: "Email verificado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Erro na verificação de email:", error);

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
