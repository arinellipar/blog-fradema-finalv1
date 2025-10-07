// src/app/api/admin/posts/route.ts
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

// GET /api/admin/posts - Listar todos os posts para administração
export async function GET(request: NextRequest) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    console.log("🔍 Buscando todos os posts para admin...");

    const posts = await db.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            PostView: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    console.log(`✅ Encontrados ${posts.length} posts no banco de dados`);
    console.log(
      "Posts IDs:",
      posts.map((p) => ({ id: p.id, title: p.title, published: p.published }))
    );

    // Transformar dados para o formato esperado
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      mainImage: post.mainImage,
      published: post.published,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      readingTime: post.readingTime,
      wordCount: post.wordCount,
      order: post.order,
      author: post.author,
      categories: post.categories.map((pc) => pc.category),
      tags: post.tags.map((pt) => pt.tag),
      commentsCount: post._count.comments,
      approvedCommentsCount: 0, // Calcular se necessário
      pendingCommentsCount: 0, // Calcular se necessário
      views: {
        total: post._count.PostView,
        thisMonth: 0, // Calcular se necessário
        thisWeek: 0, // Calcular se necessário
        today: 0, // Calcular se necessário
      },
      engagement: {
        avgTimeOnPage: 120, // Valor simulado
        bounceRate: 0.3, // Valor simulado
        shareCount: 0, // Valor simulado
      },
    }));

    // Calcular estatísticas
    const stats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p) => p.published).length,
      draftPosts: posts.filter((p) => !p.published).length,
      totalComments: posts.reduce((sum, p) => sum + p._count.comments, 0),
      approvedComments: 0, // Calcular se necessário
      pendingComments: 0, // Calcular se necessário
      totalViews: posts.reduce((sum, p) => sum + p._count.PostView, 0),
      avgViewsPerPost:
        posts.length > 0
          ? Math.round(
              posts.reduce((sum, p) => sum + p._count.PostView, 0) /
                posts.length
            )
          : 0,
    };

    return NextResponse.json({
      posts: formattedPosts,
      stats,
    });
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return NextResponse.json(
      { error: { message: "Erro interno do servidor" } },
      { status: 500 }
    );
  }
}

// DELETE - Deletar post (apenas admins)
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAdmin(request);

  if (authResult.error) {
    return NextResponse.json(
      { error: { message: authResult.error } },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: { message: "ID do post é obrigatório" } },
        { status: 400 }
      );
    }

    // Verificar se o post existe
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: { message: "Post não encontrado" } },
        { status: 404 }
      );
    }

    // Deletar post (cascade irá remover dados relacionados)
    await db.post.delete({
      where: { id: postId },
    });

    console.log(`✅ Post deletado: ${postId}`);

    return NextResponse.json({
      message: "Post deletado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar post:", error);
    return NextResponse.json(
      { error: { message: "Erro interno do servidor" } },
      { status: 500 }
    );
  }
}
