import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authGuard as getAuthGuard } from "@/lib/auth";

// Cache simples em memória
let postsCache: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// GET /api/posts - Listar posts (com cache)
export async function GET(request: NextRequest) {
  try {
    // Verificar se o cache ainda é válido
    const now = Date.now();
    if (postsCache && now - cacheTimestamp < CACHE_DURATION) {
      console.log("📦 Retornando posts do cache");
      return NextResponse.json(postsCache);
    }

    console.log("🔍 Buscando posts publicados do banco...");

    const posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        mainImage: true,
        publishedAt: true,
        createdAt: true,
        readingTime: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            PostView: true,
            comments: {
              where: {
                approved: true,
              },
            },
          },
        },
      },
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
      take: 50, // Limitar para os 50 posts mais recentes
    });

    // Atualizar cache
    postsCache = posts;
    cacheTimestamp = now;

    console.log(`✅ Encontrados ${posts.length} posts publicados (cached)`);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função para processar o conteúdo e converter para HTML
const processContentForStorage = (content: string) => {
  if (!content) return "";

  console.log("📝 Processando conteúdo do editor rico");
  console.log("Tamanho original:", content.length);
  console.log("Primeiros 200 chars:", content.substring(0, 200));

  // O Quill já gera HTML formatado, apenas retornar diretamente
  return content;
};

// POST /api/posts - Criar novo post
export async function POST(request: NextRequest) {
  console.log("\n\n🚀🚀🚀 API POST /api/posts CHAMADA! 🚀🚀🚀\n");

  try {
    // Verificar se há cookie de autenticação
    const cookies = request.cookies.getAll();
    console.log("🍪 Cookies recebidos:", cookies.map((c) => c.name).join(", "));

    const accessToken = request.cookies.get("access_token");
    console.log("🔑 Access token presente:", accessToken ? "Sim" : "Não");

    // Verificar autenticação
    const authResult = await getAuthGuard(request);
    console.log("🔐 Resultado da autenticação:", {
      isAuthenticated: authResult.isAuthenticated,
      user: authResult.user?.name,
      error: authResult.error,
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      console.log("❌ Usuário não autenticado:", authResult.error);
      return NextResponse.json(
        {
          error: "Não autorizado. Por favor, faça login novamente.",
          details: authResult.error,
        },
        { status: 401 }
      );
    }

    console.log("✅ Usuário autenticado:", authResult.user.name);

    const body = await request.json();
    const {
      title,
      content,
      description,
      mainImage,
      categories,
      tags,
      published = false,
    } = body;

    console.log("📦 Dados recebidos:");
    console.log("- Título:", title);
    console.log("- Descrição:", description?.substring(0, 50));
    console.log("- Conteúdo (tamanho):", content?.length || 0);

    // Validações básicas
    if (!title || !content) {
      return NextResponse.json(
        { error: "Título e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar slug a partir do título
    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") // Remove múltiplos hífens seguidos
      .replace(/^-|-$/g, ""); // Remove hífens no início e fim

    console.log("📝 Base slug gerado:", baseSlug);

    // Verificar se o slug já existe e gerar um único
    // Primeiro, buscar todos os slugs que começam com o baseSlug
    const existingSlugs = await prisma.post.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: {
        slug: true,
      },
    });

    console.log(
      `📊 Encontrados ${existingSlugs.length} posts com slug similar:`,
      existingSlugs.map((p) => p.slug)
    );

    let uniqueSlug = baseSlug;

    // Se o slug base já existe, encontrar o próximo número disponível
    if (existingSlugs.some((p) => p.slug === baseSlug)) {
      let counter = 1;
      let found = false;

      // Procurar o próximo número disponível
      while (!found && counter < 100) {
        const testSlug = `${baseSlug}-${counter}`;
        if (!existingSlugs.some((p) => p.slug === testSlug)) {
          uniqueSlug = testSlug;
          found = true;
          console.log(`✅ Slug disponível encontrado: ${uniqueSlug}`);
        } else {
          counter++;
        }
      }

      // Fallback: usar timestamp se não encontrou em 100 tentativas
      if (!found) {
        uniqueSlug = `${baseSlug}-${Date.now()}`;
        console.log(`🔄 Usando slug com timestamp: ${uniqueSlug}`);
      }
    } else {
      console.log(`✅ Slug base disponível: ${uniqueSlug}`);
    }

    console.log("✅ Slug final único:", uniqueSlug);

    console.log("==============================================");
    console.log("🔵 NOVO POST - Conteúdo ANTES do processamento:");
    console.log("Tamanho:", content?.length || 0);
    console.log("Primeiros 300 chars:", content?.substring(0, 300) || "vazio");
    console.log("==============================================");

    const processedContent = processContentForStorage(content);

    console.log("==============================================");
    console.log("🟢 NOVO POST - Conteúdo DEPOIS do processamento:");
    console.log("Tamanho:", processedContent?.length || 0);
    console.log(
      "Primeiros 300 chars:",
      processedContent?.substring(0, 300) || "vazio"
    );
    console.log("==============================================");

    console.log("🚀 Tentando criar post no banco de dados...");
    console.log("📊 Dados do post:");
    console.log("  - Título:", title);
    console.log("  - Slug:", uniqueSlug);
    console.log("  - Autor:", authResult.user.id);
    console.log("  - Categorias:", categories?.length || 0);
    console.log("  - Tags:", tags?.length || 0);
    console.log("  - Publicado:", published);

    // Criar o post com tratamento de erro de slug duplicado
    let post;
    let createAttempts = 0;
    const maxCreateAttempts = 3;

    while (createAttempts < maxCreateAttempts) {
      try {
        post = await prisma.post.create({
          data: {
            title,
            slug: uniqueSlug,
            content: processedContent,
            excerpt: description || "",
            mainImage,
            published,
            authorId: authResult.user.id,
            categories: categories?.length
              ? {
                  create: categories.map((categoryId: string) => ({
                    category: {
                      connect: { id: categoryId },
                    },
                  })),
                }
              : undefined,
            tags: tags?.length
              ? {
                  create: tags.map((tagName: string) => ({
                    tag: {
                      connectOrCreate: {
                        where: { name: tagName },
                        create: {
                          name: tagName,
                          slug: tagName.toLowerCase().replace(/\s+/g, "-"),
                        },
                      },
                    },
                  })),
                }
              : undefined,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
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
          },
        });

        console.log("✅ Post criado com sucesso:", post.id);
        break; // Sucesso, sair do loop
      } catch (error: any) {
        createAttempts++;

        // Verificar se é erro de slug duplicado
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("slug") &&
          createAttempts < maxCreateAttempts
        ) {
          // Tentar com um novo slug usando timestamp
          const timestamp = Date.now();
          uniqueSlug = `${baseSlug}-${timestamp}`;
          console.log(
            `⚠️ Slug duplicado detectado, tentando novamente com: ${uniqueSlug} (tentativa ${createAttempts}/${maxCreateAttempts})`
          );
          continue; // Tentar novamente
        }

        // Se não for erro de slug ou esgotou tentativas, lançar erro
        throw error;
      }
    }

    if (!post) {
      throw new Error(
        "Não foi possível criar o post após múltiplas tentativas"
      );
    }

    // Limpar cache após criar post
    postsCache = null;

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating post:", error);
    console.error("❌ Error name:", error?.name);
    console.error("❌ Error message:", error?.message);
    console.error("❌ Error code:", error?.code);
    console.error("❌ Error meta:", JSON.stringify(error?.meta, null, 2));
    console.error("❌ Error stack:", error?.stack);

    // Tratar erro específico de constraint única do Prisma
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0] || "campo";
      return NextResponse.json(
        {
          error: `Já existe um post com este ${field}. Por favor, tente novamente ou use um título diferente.`,
          code: "DUPLICATE_ENTRY",
          field: field,
        },
        { status: 409 }
      );
    }

    // Retornar mensagem de erro mais detalhada
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
