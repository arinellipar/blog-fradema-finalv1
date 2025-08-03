import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse do body
    const body = await request.json();
    const { email, password } = body;

    console.log(`[LOGIN] Tentativa de login para: ${email}`);

    // 2. Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // 3. Buscar usuário
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        preferences: true,
        metadata: true,
      },
    });

    if (!user) {
      console.log(`[LOGIN] Usuário não encontrado: ${email}`);
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // 4. Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log(`[LOGIN] Senha inválida para usuário: ${email}`);
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // 5. Gerar token JWT
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "1h" }
    );

    // 6. Criar sessão
    const session = await db.session.create({
      data: {
        userId: user.id,
        token: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        userAgent: request.headers.get("user-agent") || "",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
      },
    });

    // 7. Atualizar metadata do usuário
    await db.userMetadata.upsert({
      where: { userId: user.id },
      update: {
        lastLoginAt: new Date(),
        lastLoginIp:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        loginCount: { increment: 1 },
      },
      create: {
        userId: user.id,
        lastLoginAt: new Date(),
        lastLoginIp:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        loginCount: 1,
        registrationSource: "api",
      },
    });

    // 8. Preparar resposta
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      },
      { status: 200 }
    );

    // 9. Configurar cookie
    response.cookies.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hora
      path: "/",
    });

    console.log(`[LOGIN] Login bem-sucedido para: ${email} (${user.role})`);
    return response;
  } catch (error) {
    console.error("[LOGIN] Erro durante login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
