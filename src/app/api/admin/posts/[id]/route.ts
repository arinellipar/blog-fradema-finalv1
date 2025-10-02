// src/app/api/admin/posts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyToken, extractTokenFromCookie } from "@/lib/auth";
import { AuthErrorCode } from "@/types/auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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

      // Se já tem tags HTML, retornar sem processar
      if (content.includes("<p>") || content.includes("<br>")) {
        return content;
      }

      // Preservar formatação original ao colar texto
      // Dividir por quebras de linha simples primeiro
      const lines = content.split(/\n/);
      
      // Agrupar linhas em parágrafos (linhas vazias separam parágrafos)
      const paragraphs: string[] = [];
      let currentParagraph: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === "") {
          // Linha vazia - finalizar parágrafo atual se houver conteúdo
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join("<br>"));
            currentParagraph = [];
          }
        } else {
          // Adicionar linha ao parágrafo atual
          currentParagraph.push(trimmedLine);
        }
      }
      
      // Adicionar último parágrafo se houver
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join("<br>"));
      }
      
      // Envolver cada parágrafo em tags <p>
      const processedParagraphs = paragraphs
        .filter(p => p.length > 0)
        .map(p => `<p>${p}</p>`);

      return processedParagraphs.join("\n\n");
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
