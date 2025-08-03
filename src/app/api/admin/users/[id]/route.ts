// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { UserRole } from "@/types/auth";
import jwt from "jsonwebtoken";

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

// GET /api/admin/users/[id] - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "Usuário não encontrado" } },
        { status: 404 }
      );
    }

    // Remover dados sensíveis
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: { message: "Erro interno do servidor" } },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;
    const { name, role, emailVerified } = await request.json();

    // Verificar se o usuário existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: { message: "Usuário não encontrado" } },
        { status: 404 }
      );
    }

    // Prevenir que admin remova sua própria permissão
    const currentAdminId = authResult.user?.id;
    if (
      id === currentAdminId &&
      existingUser.role === UserRole.ADMIN &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        {
          error: {
            message:
              "Você não pode remover sua própria permissão de administrador",
          },
        },
        { status: 400 }
      );
    }

    // Atualizar usuário
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name: name?.trim(),
        role: role as UserRole,
        emailVerified: emailVerified,
      },
      include: {
        preferences: true,
        metadata: true,
      },
    });

    // Remover senha da resposta
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      user: userWithoutPassword,
      message: "Usuário atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: { message: "Erro ao atualizar usuário" } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    const { id } = await params;

    // Verificar se o usuário existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: { message: "Usuário não encontrado" } },
        { status: 404 }
      );
    }

    // Prevenir que admin delete sua própria conta
    const currentAdminId = authResult.user?.id;
    if (id === currentAdminId) {
      return NextResponse.json(
        { error: { message: "Você não pode deletar sua própria conta" } },
        { status: 400 }
      );
    }

    // Deletar usuário (cascade vai remover dados relacionados)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Usuário removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: { message: "Erro ao deletar usuário" } },
      { status: 500 }
    );
  }
}
