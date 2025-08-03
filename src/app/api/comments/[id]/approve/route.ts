import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authGuard as getAuthGuard } from "@/lib/auth";

// PUT /api/comments/[id]/approve - Aprovar comentário (apenas admins)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar autenticação e permissões
    const authResult = await getAuthGuard(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas administradores podem aprovar comentários
    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verificar se o comentário existe
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    // Aprovar o comentário
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { approved: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      comment: updatedComment,
      message: "Comentário aprovado com sucesso",
    });
  } catch (error) {
    console.error("Error approving comment:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id]/approve - Rejeitar comentário (apenas admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar autenticação e permissões
    const authResult = await getAuthGuard(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas administradores podem rejeitar comentários
    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verificar se o comentário existe
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    // Deletar o comentário (rejeitar)
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Comentário rejeitado e removido",
    });
  } catch (error) {
    console.error("Error rejecting comment:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
