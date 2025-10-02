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

      // Se já tem tags HTML estruturadas (não apenas <br>), retornar sem processar
      if (
        content.includes("</p>") ||
        content.includes("<ul>") ||
        content.includes("<ol>")
      ) {
        return content;
      }

      // Apenas normalizar quebras de linha (Windows/Mac para Unix)
      // Preservando TODOS os caracteres especiais do Word
      const normalizedContent = content
        .replace(/\r\n/g, "\n") // Windows
        .replace(/\r/g, "\n"); // Mac antigo

      // Dividir por quebras de linha
      const lines = normalizedContent.split("\n");

      // Processar linhas agrupando em blocos (parágrafos, listas, etc)
      const blocks: string[] = [];
      let currentParagraph: string[] = [];
      let currentList: string[] = [];
      let listType: "ul" | "ol" | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Detectar itens de lista (bullets ou números)
        const isBulletItem =
          /^[•●○■▪▫➢➣➤➥►▶◆◇✓✔✗✘⚬⚫⚪▸▹◈◉◊◘◙◦◯⦿⦾⦿⦾⦿⦾⦿⦾]\s+/.test(trimmedLine) ||
          /^[-–—*+]\s+/.test(trimmedLine);
        const isNumberItem = /^\d+[\.\)]\s+/.test(trimmedLine);

        if (isBulletItem || isNumberItem) {
          // Item de lista encontrado

          // Se estava em parágrafo, finalizar
          if (currentParagraph.length > 0) {
            blocks.push(`<p>${currentParagraph.join("<br>")}</p>`);
            currentParagraph = [];
          }

          // Determinar tipo de lista
          const newListType = isNumberItem ? "ol" : "ul";

          // Se mudou o tipo de lista, finalizar lista anterior
          if (listType && listType !== newListType && currentList.length > 0) {
            blocks.push(
              `<${listType}>\n${currentList.join("\n")}\n</${listType}>`
            );
            currentList = [];
          }

          listType = newListType;

          // Remover marcador e adicionar item
          const itemText = trimmedLine
            .replace(/^[•●○■▪▫➢➣➤➥►▶◆◇✓✔✗✘⚬⚫⚪▸▹◈◉◊◘◙◦◯⦿⦾⦿⦾⦿⦾⦿⦾\-–—*+]\s+/, "")
            .replace(/^\d+[\.\)]\s+/, "");
          currentList.push(`  <li>${itemText}</li>`);
        } else if (trimmedLine === "") {
          // Linha vazia

          // Finalizar lista se houver
          if (currentList.length > 0 && listType) {
            blocks.push(
              `<${listType}>\n${currentList.join("\n")}\n</${listType}>`
            );
            currentList = [];
            listType = null;
          }

          // Finalizar parágrafo se houver
          if (currentParagraph.length > 0) {
            blocks.push(`<p>${currentParagraph.join("<br>")}</p>`);
            currentParagraph = [];
          }
        } else {
          // Linha normal

          // Se estava em lista, finalizar
          if (currentList.length > 0 && listType) {
            blocks.push(
              `<${listType}>\n${currentList.join("\n")}\n</${listType}>`
            );
            currentList = [];
            listType = null;
          }

          // Adicionar ao parágrafo atual
          currentParagraph.push(line);
        }
      }

      // Finalizar blocos pendentes
      if (currentList.length > 0 && listType) {
        blocks.push(`<${listType}>\n${currentList.join("\n")}\n</${listType}>`);
      }
      if (currentParagraph.length > 0) {
        blocks.push(`<p>${currentParagraph.join("<br>")}</p>`);
      }

      return blocks.join("\n\n");
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
