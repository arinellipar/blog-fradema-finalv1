// scripts/test-admin-creation.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testAdminCreation() {
  console.log("🧪 Testando criação de usuário ADMIN...");

  try {
    // Verificar quantos usuários não-seed existem
    const nonSeedUsers = await prisma.user.count({
      where: {
        metadata: {
          registrationSource: {
            not: "seed",
          },
        },
      },
    });

    console.log(`📊 Usuários não-seed atuais: ${nonSeedUsers}`);

    if (nonSeedUsers === 0) {
      console.log("✅ O próximo usuário registrado será criado como ADMIN");
    } else {
      console.log("❌ Já existem usuários não-seed, o próximo será SUBSCRIBER");
    }

    // Listar todos os usuários
    const allUsers = await prisma.user.findMany({
      include: {
        metadata: true,
      },
    });

    console.log("\n👥 Usuários no banco:");
    allUsers.forEach((user) => {
      console.log(
        `  - ${user.email} (${user.role}) - Source: ${
          user.metadata?.registrationSource || "N/A"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminCreation();
