// src/app/api/admin/posts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyToken, extractTokenFromCookie } from "@/lib/auth";
import { AuthErrorCode } from "@/types/auth";
import { fixQuillListsBeforeSave } from "@/lib/fix-quill-lists";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// Função para limpar o cache de posts
async function clearPostsCache() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/posts?clearCache=true`, {
      method: "GET",
      cache: "no-store",
    });
    console.log("🧹 Cache de posts limpo");
  } catch (error) {
    console.error("⚠️ Erro ao limpar cache:", error);
  }
}

// PUT - Atualizar post (apenas admins)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const { id } = params;

    // Verificar autenticação
    const accessToken = extractTokenFromCookie(request);
    if (!accessToken) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: "Token de acesso não encontrado",
          },
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: "Token de acesso inválido",
          },
        },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message:
              "Acesso negado. Apenas administradores podem atualizar posts.",
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, published, excerpt, mainImage, content } = body;

    // Função para processar o conteúdo e converter para HTML
    const processContentForStorage = (content: string) => {
      if (!content) return "";

      let processedContent = content;

      // Se já tem tags HTML estruturadas
      if (
        content.includes("</p>") ||
        content.includes("<ul>") ||
        content.includes("<ol>") ||
        content.includes("<div")
      ) {
        // Usar a função utilitária para corrigir listas
        return fixQuillListsBeforeSave(processedContent);
      }

      // Normalizar quebras de linha (Windows/Mac para Unix)
      const normalizedContent = processedContent
        .replace(/\r\n/g, "\n") // Windows
        .replace(/\r/g, "\n"); // Mac antigo

      // Preservar linhas vazias convertendo-as em &nbsp; para não colapsar
      const finalContent = normalizedContent
        .split("\n")
        .map((line) => line || "&nbsp;") // Linhas vazias viram &nbsp;
        .join("\n");

      // Envolver em div com white-space: pre-line para preservar quebras de linha
      return `<div style="white-space: pre-line; line-height: 1.75;">${finalContent}</div>`;
    };

    // Verificar se o post existe
    const existingPost = await db.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: "Post não encontrado",
          },
        },
        { status: 404 }
      );
    }

    // Atualizar post
    const updatedPost = await db.post.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(excerpt && { excerpt }),
        ...(typeof mainImage === "string" && { mainImage }),
        ...(content && { content: processContentForStorage(content) }),
        ...(typeof published === "boolean" && {
          published,
          publishedAt: published
            ? existingPost.publishedAt || new Date()
            : null,
        }),
        updatedAt: new Date(),
      },
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
          },
        },
      },
    });

    // Limpar o cache de posts
    await clearPostsCache();

    return NextResponse.json({
      post: updatedPost,
      message: "Post atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar post:", error);
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

// DELETE - Deletar post específico (apenas admins)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const { id } = params;

    // Verificar autenticação
    const accessToken = extractTokenFromCookie(request);
    if (!accessToken) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: "Token de acesso não encontrado",
          },
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: "Token de acesso inválido",
          },
        },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (payload.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message:
              "Acesso negado. Apenas administradores podem deletar posts.",
          },
        },
        { status: 403 }
      );
    }

    // Verificar se o post existe
    const existingPost = await db.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          error: {
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: "Post não encontrado",
          },
        },
        { status: 404 }
      );
    }

    // Deletar post (cascade irá remover dados relacionados)
    await db.post.delete({
      where: { id },
    });

    // Limpar o cache de posts
    await clearPostsCache();

    return NextResponse.json({
      message: "Post deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar post:", error);
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
