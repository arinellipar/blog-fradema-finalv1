// scripts/clear-seed-users.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clearSeedUsers() {
  console.log("🧹 Limpando usuários criados via seed...");

  try {
    // Primeiro, deletar posts que referenciam usuários de seed
    const deletedPosts = await prisma.post.deleteMany({
      where: {
        author: {
          metadata: {
            registrationSource: "seed",
          },
        },
      },
    });

    console.log(`📝 ${deletedPosts.count} posts removidos`);

    // Deletar comentários que referenciam usuários de seed
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        author: {
          metadata: {
            registrationSource: "seed",
          },
        },
      },
    });

    console.log(`💬 ${deletedComments.count} comentários removidos`);

    // Agora deletar usuários que foram criados via seed
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        metadata: {
          registrationSource: "seed",
        },
      },
    });

    console.log(`✅ ${deletedUsers.count} usuários de seed removidos`);
    console.log("📝 Agora o próximo usuário registrado será criado como ADMIN");
  } catch (error) {
    console.error("❌ Erro ao limpar usuários:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSeedUsers();
