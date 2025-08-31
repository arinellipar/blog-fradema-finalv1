import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authGuard as getAuthGuard } from "@/lib/auth";

// GET /api/comments - Listar comentários de um post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId é obrigatório" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        approved: true, // Apenas comentários aprovados
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        replies: {
          where: {
            approved: true,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/comments - Criar novo comentário
export async function POST(request: NextRequest) {
  try {
    console.log("📝 Tentativa de criar comentário");
    console.log(
      "🍪 Cookies recebidos:",
      request.cookies.getAll().map((c) => c.name)
    );

    // Verificar autenticação
    const authResult = await getAuthGuard(request);
    console.log("🔐 Resultado da autenticação:", {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.user?.id,
      userEmail: authResult.user?.email,
      userRole: authResult.user?.role,
      error: authResult.error,
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      console.log("❌ Usuário não autenticado");
      return NextResponse.json(
        {
          error: "Não autorizado",
          details:
            authResult.error || "Usuário deve estar logado para comentar",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, postId, parentId } = body;

    // Validações básicas
    if (!content || !postId) {
      return NextResponse.json(
        { error: "Conteúdo e postId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Se for uma resposta, verificar se o comentário pai existe
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Comentário pai não encontrado" },
          { status: 404 }
        );
      }
    }

    // Criar o comentário
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: authResult.user.id,
        parentId: parentId || null,
        approved: authResult.user.role === "ADMIN", // Apenas admins podem auto-aprovar
      },
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

    console.log("✅ Comentário criado com sucesso:", {
      id: comment.id,
      userRole: authResult.user.role,
      approved: authResult.user.role === "ADMIN",
      content: comment.content.substring(0, 50) + "...",
    });

    return NextResponse.json(
      {
        comment,
        message:
          authResult.user.role === "ADMIN"
            ? "Comentário publicado com sucesso"
            : "Comentário enviado e aguardando aprovação",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
