const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestComment() {
  try {
    // Primeiro, vamos verificar se há usuários e posts
    const users = await prisma.user.findMany({
      take: 1,
    });

    const posts = await prisma.post.findMany({
      take: 1,
    });

    if (users.length === 0) {
      console.log("❌ Nenhum usuário encontrado. Crie um usuário primeiro.");
      return;
    }

    if (posts.length === 0) {
      console.log("❌ Nenhum post encontrado. Crie um post primeiro.");
      return;
    }

    const user = users[0];
    const post = posts[0];

    console.log(`👤 Usando usuário: ${user.name} (${user.email})`);
    console.log(`📝 Usando post: ${post.title}`);

    // Criar um comentário de teste
    const comment = await prisma.comment.create({
      data: {
        content:
          "Este é um comentário de teste para verificar se a funcionalidade de comentários está funcionando corretamente. Muito interessante este post!",
        postId: post.id,
        authorId: user.id,
        approved: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    console.log(
      "✅ Comentário de teste criado:",
      comment.content.substring(0, 50) + "..."
    );
    console.log("📊 Detalhes:", {
      id: comment.id,
      author: comment.author.name,
      postId: comment.postId,
      approved: comment.approved,
    });

    // Criar uma resposta de teste
    const reply = await prisma.comment.create({
      data: {
        content:
          "Esta é uma resposta de teste ao comentário anterior. Concordo com o que foi dito!",
        postId: post.id,
        authorId: user.id,
        parentId: comment.id,
        approved: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    console.log(
      "✅ Resposta de teste criada:",
      reply.content.substring(0, 50) + "..."
    );
    console.log("📊 Detalhes da resposta:", {
      id: reply.id,
      author: reply.author.name,
      parentId: reply.parentId,
      approved: reply.approved,
    });
  } catch (error) {
    console.error("❌ Erro ao criar comentário de teste:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestComment();
