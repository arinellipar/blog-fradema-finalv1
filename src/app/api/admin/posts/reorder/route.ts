import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authGuard as getAuthGuard } from "@/lib/auth";

// Função para limpar o cache de posts
async function clearPostsCache() {
  try {
    // Fazer uma requisição para a API pública para forçar atualização do cache
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

export async function PUT(request: NextRequest) {
  const correlationId = crypto.randomUUID().slice(0, 8);
  console.log(
    `\n\n🟢🟢🟢 [${correlationId}] PUT /api/admin/posts/reorder INICIADO 🟢🟢🟢\n`
  );

  try {
    console.log(`[${correlationId}] 1️⃣ Verificando autenticação...`);

    // Verificar autenticação e permissões de admin
    const authResult = await getAuthGuard(request);
    console.log(`[${correlationId}] 2️⃣ Auth result:`, {
      isAuthenticated: authResult.isAuthenticated,
      hasUser: !!authResult.user,
      role: authResult.user?.role,
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      console.log(`[${correlationId}] ❌ Não autenticado - retornando 401`);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      console.log(`[${correlationId}] ❌ Não é admin - retornando 403`);
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    console.log(`[${correlationId}] 3️⃣ Lendo body da requisição...`);
    const body = await request.json();
    console.log(
      `[${correlationId}] 4️⃣ Body recebido com ${
        Object.keys(body).length
      } chaves`
    );

    const { postOrders } = body as {
      postOrders: { id: string; order: number }[];
    };

    if (!postOrders || !Array.isArray(postOrders)) {
      console.log(`[${correlationId}] ❌ postOrders inválido`);
      return NextResponse.json(
        { error: "postOrders inválido" },
        { status: 400 }
      );
    }

    console.log(
      `[${correlationId}] 🔄 Reordenando ${postOrders.length} posts...`
    );

    // Atualizar a ordem de cada post em uma transação
    await prisma.$transaction(
      postOrders.map((item) =>
        prisma.post.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    console.log(`[${correlationId}] ✅ Posts reordenados com sucesso!`);

    console.log(`[${correlationId}] 🧹 Limpando cache de posts...`);
    // Limpar o cache de posts
    await clearPostsCache();

    console.log(`[${correlationId}] 📤 Preparando resposta JSON...`);
    const response = NextResponse.json({
      success: true,
      message: "Ordem dos posts atualizada com sucesso",
    });

    console.log(`[${correlationId}] 🟢 Retornando resposta de sucesso!\n\n`);
    return response;
  } catch (error) {
    console.error(`[${correlationId}] ❌ Erro ao reordenar posts:`, error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
