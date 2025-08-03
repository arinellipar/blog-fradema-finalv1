import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/posts/[slug]/view - Registrar visualização do post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Obter IP do usuário
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";

    // Obter user ID se estiver autenticado
    const authHeader = request.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        // Aqui você pode implementar a lógica para extrair o user ID do token
        // Por enquanto, vamos usar null para usuários não autenticados
        userId = null;
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
      }
    }

    // Verificar se já existe uma visualização recente do mesmo IP
    const existingView = await prisma.postView.findFirst({
      where: {
        postId: post.id,
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        },
      },
    });

    if (existingView) {
      return NextResponse.json(
        { message: "Visualização já registrada" },
        { status: 200 }
      );
    }

    // Criar nova visualização usando o ID do post
    await prisma.postView.create({
      data: {
        postId: post.id,
        userId,
        ipAddress,
      },
    });

    return NextResponse.json(
      { message: "Visualização registrada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao registrar visualização:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
