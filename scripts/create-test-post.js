const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestPost() {
  try {
    // Primeiro, vamos verificar se há usuários
    const users = await prisma.user.findMany({
      take: 1,
    });

    if (users.length === 0) {
      console.log("❌ Nenhum usuário encontrado. Crie um usuário primeiro.");
      return;
    }

    const user = users[0];
    console.log(`👤 Usando usuário: ${user.name} (${user.email})`);

    // Criar um post de teste
    const post = await prisma.post.create({
      data: {
        title: "Teste de Post - Reforma Tributária 2024",
        slug: "teste-post-reforma-tributaria-2024",
        content:
          "Este é um post de teste para verificar se a funcionalidade de criação e exibição de posts está funcionando corretamente. A reforma tributária representa uma das maiores transformações do sistema fiscal brasileiro em décadas.",
        excerpt:
          "Análise completa das principais mudanças propostas na reforma tributária e seus impactos no cenário empresarial brasileiro.",
        mainImage:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
        published: true,
        authorId: user.id,
        readingTime: 5,
        wordCount: 150,
        publishedAt: new Date(),
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
      },
    });

    console.log("✅ Post criado com sucesso!");
    console.log("📝 Detalhes do post:");
    console.log(`   - ID: ${post.id}`);
    console.log(`   - Título: ${post.title}`);
    console.log(`   - Slug: ${post.slug}`);
    console.log(`   - Autor: ${post.author.name}`);
    console.log(`   - Publicado: ${post.published}`);
    console.log(`   - Data de criação: ${post.createdAt}`);
  } catch (error) {
    console.error("❌ Erro ao criar post:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPost();
