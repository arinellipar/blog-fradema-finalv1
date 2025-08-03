// scripts/create-test-user.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("🔧 Criando usuário de teste...");

    // Verificar se já existe um usuário admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      console.log("✅ Usuário admin já existe:", existingAdmin.email);
      return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash("admin123", 12);

    // Criar usuário admin
    const user = await prisma.$transaction(async (tx) => {
      // Criar usuário
      const newUser = await tx.user.create({
        data: {
          email: "admin@fradema.com.br",
          name: "Administrador",
          passwordHash,
          role: "ADMIN",
          emailVerified: true, // Verificado para facilitar testes
        },
      });

      // Criar preferências
      await tx.userPreferences.create({
        data: {
          userId: newUser.id,
          theme: "system",
          language: "pt-BR",
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          newsletterSubscribed: false,
        },
      });

      // Criar metadata
      await tx.userMetadata.create({
        data: {
          userId: newUser.id,
          loginCount: 0,
          registrationSource: "script",
        },
      });

      return newUser;
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("📧 Email: admin@fradema.com.br");
    console.log("🔑 Senha: admin123");
    console.log("🆔 ID:", user.id);
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
