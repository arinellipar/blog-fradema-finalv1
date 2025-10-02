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
      orderBy: {
        publishedAt: "desc",
      },
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

  // Se já tem tags HTML estruturadas (não apenas <br>), retornar sem processar
  if (
    content.includes("</p>") ||
    content.includes("<ul>") ||
    content.includes("<ol>")
  ) {
    return content;
  }

  // Log para debug
  console.log("📝 Processando conteúdo...");
  console.log("Tamanho original:", content.length);
  console.log("Primeiros 200 chars:", content.substring(0, 200));

  // Apenas normalizar quebras de linha (Windows/Mac para Unix)
  // Preservando TODOS os caracteres especiais do Word
  const normalizedContent = content
    .replace(/\r\n/g, "\n") // Windows
    .replace(/\r/g, "\n"); // Mac antigo

  // Dividir por quebras de linha
  const lines = normalizedContent.split("\n");
  console.log("Total de linhas:", lines.length);

  // Processar linhas agrupando em blocos (parágrafos, listas, etc)
  const blocks: string[] = [];
  let currentParagraph: string[] = [];
  let currentList: string[] = [];
  let listType: "ul" | "ol" | null = null;

  // Detectar se parece uma lista (várias linhas curtas consecutivas)
  const detectListPattern = () => {
    let shortLines = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (
        line.length > 0 &&
        line.length < 60 &&
        !line.endsWith(".") &&
        !line.endsWith("?") &&
        !line.endsWith(":")
      ) {
        shortLines++;
      }
    }
    return shortLines >= 3; // Se tiver 3+ linhas curtas, provavelmente é lista
  };

  const looksLikeList = detectListPattern();
  let consecutiveShortLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Detectar itens de lista (bullets ou números)
    const isBulletItem =
      /^[•●○■▪▫➢➣➤➥►▶◆◇✓✔✗✘⚬⚫⚪▸▹◈◉◊◘◙◦◯⦿⦾⦿⦾⦿⦾⦿⦾]\s+/.test(trimmedLine) ||
      /^[-–—*+]\s+/.test(trimmedLine);
    const isNumberItem = /^\d+[\.\)]\s+/.test(trimmedLine);

    // Detectar linha curta que parece item de lista (sem pontuação final)
    const isShortLine =
      trimmedLine.length > 0 &&
      trimmedLine.length < 60 &&
      !trimmedLine.endsWith(".") &&
      !trimmedLine.endsWith("?") &&
      !trimmedLine.endsWith(":") &&
      !trimmedLine.endsWith(",");

    if (isShortLine) {
      consecutiveShortLines++;
    } else if (trimmedLine === "") {
      consecutiveShortLines = 0;
    }

    // Se detectar padrão de lista, tratar linhas curtas como itens
    const shouldBeListItem =
      isBulletItem ||
      isNumberItem ||
      (looksLikeList && isShortLine && consecutiveShortLines >= 1);

    if (shouldBeListItem) {
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
        blocks.push(`<${listType}>\n${currentList.join("\n")}\n</${listType}>`);
        currentList = [];
      }

      listType = newListType || "ul"; // Default para ul se não for número

      // Remover marcador se houver e adicionar item
      const itemText = trimmedLine
        .replace(/^[•●○■▪▫➢➣➤➥►▶◆◇✓✔✗✘⚬⚫⚪▸▹◈◉◊◘◙◦◯⦿⦾⦿⦾⦿⦾⦿⦾\-–—*+]\s+/, "")
        .replace(/^\d+[\.\)]\s+/, "");
      currentList.push(`  <li>${itemText}</li>`);
    } else if (trimmedLine === "") {
      // Linha vazia

      // Finalizar lista se houver
      if (currentList.length > 0 && listType) {
        blocks.push(`<${listType}>\n${currentList.join("\n")}\n</${listType}>`);
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
        blocks.push(`<${listType}>\n${currentList.join("\n")}\n</${listType}>`);
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

  const result = blocks.join("\n\n");
  console.log("✅ Total de blocos gerados:", blocks.length);
  console.log("Resultado (primeiros 500 chars):", result.substring(0, 500));

  return result;
};

// POST /api/posts - Criar novo post
export async function POST(request: NextRequest) {
  console.log("\n\n🚀🚀🚀 API POST /api/posts CHAMADA! 🚀🚀🚀\n");

  try {
    // Verificar autenticação
    const authResult = await getAuthGuard(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      console.log("❌ Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    // Verificar se o slug já existe
    const existingPost = await prisma.post.findFirst({
      where: { slug },
    });

    let uniqueSlug = slug;
    if (existingPost) {
      uniqueSlug = `${slug}-${Date.now()}`;
    }

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

    // Criar o post
    const post = await prisma.post.create({
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
