// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { UserRole } from "@/types/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Middleware para verificar se é admin
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return { error: "Token não encontrado", status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };
    const user = await db.user.findUnique({
      where: { id: decoded.sub },
      include: { metadata: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return { error: "Acesso negado", status: 403 };
    }

    return { user };
  } catch (error) {
    return { error: "Token inválido", status: 401 };
  }
}

// GET /api/admin/users - Listar todos os usuários
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    const users = await db.user.findMany({
      include: {
        preferences: true,
        metadata: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remover dados sensíveis
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.metadata?.lastLoginAt,
      loginCount: user.metadata?.loginCount || 0,
      postsCount: user._count.posts,
      commentsCount: user._count.comments,
      activeSessions: user._count.sessions,
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      total: users.length,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: { message: "Erro interno do servidor" } },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Criar novo usuário (admin)
export async function POST(request: NextRequest) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    const { name, email, role, emailVerified } = await request.json();

    // Validações básicas
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: { message: "Dados obrigatórios não fornecidos" } },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { message: "Email já está em uso" } },
        { status: 409 }
      );
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Criar usuário
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as UserRole,
        passwordHash,
        emailVerified: emailVerified || false,
        preferences: {
          create: {
            theme: "system",
            language: "pt-BR",
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            newsletterSubscribed: false,
          },
        },
        metadata: {
          create: {
            loginCount: 0,
            registrationSource: "admin",
          },
        },
      },
      include: {
        preferences: true,
        metadata: true,
      },
    });

    // Remover senha da resposta
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        tempPassword, // Enviar senha temporária para o admin
        message: "Usuário criado com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: { message: "Erro ao criar usuário" } },
      { status: 500 }
    );
  }
}
