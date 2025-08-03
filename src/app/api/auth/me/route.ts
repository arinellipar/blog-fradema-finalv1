import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // 1. Extrair token do cookie
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
      console.log("[ME] Nenhum token encontrado");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // 2. Verificar token JWT
    let decoded: { sub: string; email: string; role: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret-key"
      ) as { sub: string; email: string; role: string };
    } catch (error) {
      console.log("[ME] Token inválido:", error);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // 3. Buscar usuário
    const user = await db.user.findUnique({
      where: { id: decoded.sub },
      include: {
        preferences: true,
        metadata: true,
      },
    });

    if (!user) {
      console.log("[ME] Usuário não encontrado:", decoded.sub);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    // 4. Verificar se a sessão ainda existe
    const session = await db.session.findFirst({
      where: {
        userId: user.id,
        token: token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      console.log("[ME] Sessão expirada ou não encontrada");
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    // 5. Retornar dados do usuário
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      preferences: user.preferences,
      metadata: user.metadata,
    };

    console.log(`[ME] Usuário autenticado: ${user.email} (${user.role})`);
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("[ME] Erro durante verificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
