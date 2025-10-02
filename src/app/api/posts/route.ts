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

  // Se já tem tags HTML, retornar sem processar
  if (content.includes("<p>") || content.includes("<br>")) {
    return content;
  }

  // Apenas normalizar quebras de linha (Windows/Mac para Unix)
  // Preservando TODOS os caracteres especiais do Word
  const normalizedContent = content
    .replace(/\r\n/g, "\n") // Windows
    .replace(/\r/g, "\n"); // Mac antigo

  // Dividir por quebras de linha (mantendo linhas vazias)
  const lines = normalizedContent.split("\n");
 
  // Agrupar linhas em parágrafos
  // Linhas vazias (ou apenas com espaços) separam parágrafos
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
 
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Verificar se a linha está completamente vazia (sem nenhum caractere)
    if (line.length === 0 || (line.trim() === "" && i > 0 && i < lines.length - 1 && lines[i-1].trim() === "")) {
      // Linha vazia dupla - finalizar parágrafo atual se houver conteúdo
      if (currentParagraph.length > 0) {
        // Juntar linhas com <br>, preservando TODOS os espaços
        paragraphs.push(currentParagraph.join("<br>"));
        currentParagraph = [];
      }
    } else if (line.trim() === "") {
      // Linha com apenas espaços - adicionar como linha vazia no parágrafo
      if (currentParagraph.length > 0) {
        currentParagraph.push("");
      }
    } else {
      // Adicionar linha ao parágrafo atual preservando espaços à esquerda e direita
      currentParagraph.push(line);
    }
  }

  // Adicionar último parágrafo se houver
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join("<br>"));
  }

  // Envolver cada parágrafo em tags <p>
  const processedParagraphs = paragraphs
    .filter((p) => p.trim().length > 0) // Só filtrar parágrafos completamente vazios
    .map((p) => `<p>${p}</p>`);

  return processedParagraphs.join("\n\n");
};

// POST /api/posts - Criar novo post
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await getAuthGuard(request);
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    // Criar o post
    const post = await prisma.post.create({
      data: {
        title,
        slug: uniqueSlug,
        content: processContentForStorage(content),
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
