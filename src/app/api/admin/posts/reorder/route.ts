import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authGuard as getAuthGuard } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação e permissões de admin
    const authResult = await getAuthGuard(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { postOrders } = body as {
      postOrders: { id: string; order: number }[];
    };

    if (!postOrders || !Array.isArray(postOrders)) {
      return NextResponse.json(
        { error: "postOrders inválido" },
        { status: 400 }
      );
    }

    console.log(`🔄 Reordenando ${postOrders.length} posts...`);

    // Atualizar a ordem de cada post em uma transação
    await prisma.$transaction(
      postOrders.map((item) =>
        prisma.post.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    console.log("✅ Posts reordenados com sucesso!");

    return NextResponse.json({
      success: true,
      message: "Ordem dos posts atualizada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao reordenar posts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
