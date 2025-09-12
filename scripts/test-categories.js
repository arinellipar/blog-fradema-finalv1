// scripts/test-categories.js - Script para testar categorias

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testCategories() {
  console.log("🔍 Testando categorias no banco de dados...\n");

  try {
    // Buscar todas as categorias
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    console.log(`✅ Total de categorias encontradas: ${categories.length}\n`);

    if (categories.length === 0) {
      console.log("❌ Nenhuma categoria encontrada! Execute o seed:");
      console.log("   npx tsx prisma/seed.ts\n");
      return;
    }

    // Mostrar categorias
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.slug})`);
      console.log(`   ID: ${category.id}`);
      console.log(`   Descrição: ${category.description || "N/A"}`);
      console.log(`   Posts publicados: ${category._count.posts}`);
      console.log("");
    });

    // Verificar as 4 principais
    const mainCategories = [
      "francisco-arrighi",
      "atualizacoes-tributarias",
      "imposto-renda",
      "reforma-tributaria",
    ];

    console.log("🎯 Verificando as 4 categorias principais:");
    mainCategories.forEach((slug) => {
      const found = categories.find((cat) => cat.slug === slug);
      if (found) {
        console.log(`   ✅ ${found.name} (${slug})`);
      } else {
        console.log(`   ❌ Categoria não encontrada: ${slug}`);
      }
    });

    console.log("\n📊 Resumo:");
    console.log(`   Total: ${categories.length} categorias`);
    console.log(
      `   Principais: ${
        mainCategories.filter((slug) =>
          categories.find((cat) => cat.slug === slug)
        ).length
      }/4`
    );
  } catch (error) {
    console.error("❌ Erro ao buscar categorias:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategories();
