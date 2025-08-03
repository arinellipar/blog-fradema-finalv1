import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authGuard as getAuthGuard } from "@/lib/auth";

// GET /api/comments/pending - Listar comentários pendentes (apenas admins)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authResult = await getAuthGuard(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas administradores podem ver comentários pendentes
    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    // Buscar comentários pendentes
    const pendingComments = await prisma.comment.findMany({
      where: {
        approved: false,
        ...(postId && { postId }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        replies: {
          where: {
            approved: false,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pendingComments);
  } catch (error) {
    console.error("Error fetching pending comments:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
