// src/app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { extractTokenFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Extrair token da sessão
    const sessionToken = request.cookies.get("session_token")?.value;

    if (sessionToken) {
      // Revogar sessão no banco
      await db.session.deleteMany({
        where: { token: sessionToken },
      });
    }

    // Configurar resposta
    const response = NextResponse.json({
      message: "Logout realizado com sucesso",
    });

    // Limpar cookies
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no logout:", error);

    return NextResponse.json(
      {
        error: {
          message: "Erro interno do servidor",
        },
      },
      { status: 500 }
    );
  }
}
