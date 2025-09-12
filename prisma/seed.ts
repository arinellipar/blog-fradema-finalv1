// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userMetadata.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();

  // Criar categorias
  const categories = await Promise.all([
    // 4 categorias principais do blog
    prisma.category.create({
      data: {
        name: "Francisco Arrighi",
        slug: "francisco-arrighi",
        description: "Artigos e insights do especialista Francisco Arrighi",
      },
    }),
    prisma.category.create({
      data: {
        name: "Atualizações Tributárias",
        slug: "atualizacoes-tributarias",
        description: "Últimas novidades e mudanças na legislação tributária",
      },
    }),
    prisma.category.create({
      data: {
        name: "Imposto de Renda",
        slug: "imposto-renda",
        description: "Guias e dicas sobre Imposto de Renda",
      },
    }),
    prisma.category.create({
      data: {
        name: "Reforma Tributária",
        slug: "reforma-tributaria",
        description: "Análises e impactos da Reforma Tributária",
      },
    }),
    // Outras categorias importantes
    prisma.category.create({
      data: {
        name: "Tributário",
        slug: "tributario",
        description: "Artigos sobre direito tributário e fiscal",
      },
    }),
    prisma.category.create({
      data: {
        name: "Fiscal",
        slug: "fiscal",
        description: "Conteúdo sobre obrigações fiscais e compliance",
      },
    }),
    prisma.category.create({
      data: {
        name: "Contábil",
        slug: "contabil",
        description: "Temas relacionados à contabilidade empresarial",
      },
    }),
    prisma.category.create({
      data: {
        name: "Legislação",
        slug: "legislacao",
        description: "Atualizações e análises de legislação",
      },
    }),
    prisma.category.create({
      data: {
        name: "Planejamento Tributário",
        slug: "planejamento",
        description: "Estratégias de planejamento fiscal",
      },
    }),
    prisma.category.create({
      data: {
        name: "Compliance",
        slug: "compliance",
        description: "Conformidade e boas práticas empresariais",
      },
    }),
  ]);

  // Criar tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: "ICMS", slug: "icms" },
    }),
    prisma.tag.create({
      data: { name: "ISS", slug: "iss" },
    }),
    prisma.tag.create({
      data: { name: "PIS/COFINS", slug: "pis-cofins" },
    }),
    prisma.tag.create({
      data: { name: "Lucro Presumido", slug: "lucro-presumido" },
    }),
    prisma.tag.create({
      data: { name: "Lucro Real", slug: "lucro-real" },
    }),
    prisma.tag.create({
      data: { name: "Simples Nacional", slug: "simples-nacional" },
    }),
    prisma.tag.create({
      data: { name: "MEI", slug: "mei" },
    }),
    prisma.tag.create({
      data: { name: "Imposto de Renda", slug: "imposto-renda" },
    }),
  ]);

  // Criar usuários
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const editorPassword = await bcrypt.hash("Editor123!", 12);
  const userPassword = await bcrypt.hash("User123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@fradema.com.br",
      name: "Administrador",
      role: "ADMIN",
      passwordHash: adminPassword,
      emailVerified: true,
      preferences: {
        create: {
          theme: "system",
          language: "pt-BR",
          emailNotifications: true,
          pushNotifications: true,
          newsletterSubscribed: true,
        },
      },
      metadata: {
        create: {
          loginCount: 0,
          registrationSource: "seed",
        },
      },
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: "editor@fradema.com.br",
      name: "Editor do Blog",
      role: "EDITOR",
      passwordHash: editorPassword,
      emailVerified: true,
      preferences: {
        create: {
          theme: "light",
          language: "pt-BR",
          emailNotifications: true,
          pushNotifications: true,
          newsletterSubscribed: true,
        },
      },
      metadata: {
        create: {
          loginCount: 0,
          registrationSource: "seed",
        },
      },
    },
  });

  const author = await prisma.user.create({
    data: {
      email: "autor@fradema.com.br",
      name: "Autor do Blog",
      role: "AUTHOR",
      passwordHash: userPassword,
      emailVerified: true,
      preferences: {
        create: {
          theme: "light",
          language: "pt-BR",
          emailNotifications: true,
          pushNotifications: false,
          newsletterSubscribed: false,
        },
      },
      metadata: {
        create: {
          loginCount: 0,
          registrationSource: "seed",
        },
      },
    },
  });

  // Criar posts de exemplo
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: "Reforma Tributária 2024: O que muda para as empresas",
        slug: "reforma-tributaria-2024",
        content: `
          <p>A reforma tributária aprovada em 2024 traz mudanças significativas para o cenário empresarial brasileiro. Neste artigo, vamos analisar os principais impactos e como se preparar para as novas regras.</p>

          <h2>Principais mudanças</h2>
          <p>Entre as principais alterações, destacam-se:</p>
          <ul>
            <li>Unificação de impostos sobre consumo</li>
            <li>Criação do IVA (Imposto sobre Valor Agregado)</li>
            <li>Simplificação das obrigações acessórias</li>
            <li>Novo regime de tributação para serviços</li>
          </ul>

          <h2>Impactos para empresas</h2>
          <p>As empresas precisarão se adaptar às novas regras, especialmente no que se refere a:</p>
          <ul>
            <li>Sistemas de gestão fiscal</li>
            <li>Processos internos de compliance</li>
            <li>Capacitação de equipes</li>
            <li>Revisão de contratos e preços</li>
          </ul>

          <h2>Cronograma de implementação</h2>
          <p>A implementação será gradual, começando em 2025 com as primeiras mudanças estruturais.</p>
        `,
        excerpt:
          "A reforma tributária aprovada em 2024 traz mudanças significativas para o cenário empresarial brasileiro.",
        published: true,
        publishedAt: new Date(),
        authorId: author.id,
        readingTime: 5,
        wordCount: 350,
        metaTitle: "Reforma Tributária 2024: Impactos para Empresas",
        metaDescription:
          "Análise completa da reforma tributária e seus impactos no ambiente empresarial brasileiro.",
        categories: {
          create: {
            categoryId: categories[0].id, // Tributário
          },
        },
        tags: {
          create: [
            { tagId: tags[7].id }, // Imposto de Renda
            { tagId: tags[4].id }, // Lucro Real
          ],
        },
      },
    }),

    prisma.post.create({
      data: {
        title: "Como reduzir a carga tributária legalmente",
        slug: "como-reduzir-carga-tributaria",
        content: `
          <p>O planejamento tributário é uma ferramenta essencial para empresas que buscam otimizar sua carga fiscal de forma legal e eficiente.</p>

          <h2>Estratégias de planejamento</h2>
          <p>Algumas estratégias eficazes incluem:</p>
          <ul>
            <li>Escolha do regime tributário adequado</li>
            <li>Aproveitamento de incentivos fiscais</li>
            <li>Estruturação societária otimizada</li>
            <li>Gestão eficiente de custos dedutíveis</li>
          </ul>

          <h2>Regime tributário</h2>
          <p>A escolha do regime tributário é fundamental e deve considerar:</p>
          <ul>
            <li>Faturamento anual da empresa</li>
            <li>Margem de lucro</li>
            <li>Tipo de atividade</li>
            <li>Estrutura de custos</li>
          </ul>

          <h2>Incentivos fiscais</h2>
          <p>Diversos incentivos estão disponíveis para empresas que se enquadram nos critérios estabelecidos.</p>
        `,
        excerpt:
          "O planejamento tributário é uma ferramenta essencial para empresas que buscam otimizar sua carga fiscal.",
        published: true,
        publishedAt: new Date(Date.now() - 86400000), // 1 dia atrás
        authorId: author.id,
        readingTime: 4,
        wordCount: 280,
        metaTitle: "Como Reduzir a Carga Tributária Legalmente",
        metaDescription:
          "Estratégias eficazes de planejamento tributário para reduzir a carga fiscal da sua empresa.",
        categories: {
          create: {
            categoryId: categories[4].id, // Planejamento Tributário
          },
        },
        tags: {
          create: [
            { tagId: tags[3].id }, // Lucro Presumido
            { tagId: tags[4].id }, // Lucro Real
            { tagId: tags[5].id }, // Simples Nacional
          ],
        },
      },
    }),

    prisma.post.create({
      data: {
        title: "Obrigações do MEI: Guia completo para 2024",
        slug: "obrigacoes-mei-2024",
        content: `
          <p>O Microempreendedor Individual (MEI) possui obrigações específicas que devem ser cumpridas para manter a regularidade fiscal.</p>

          <h2>Obrigações mensais</h2>
          <p>Todo MEI deve cumprir mensalmente:</p>
          <ul>
            <li>Pagamento da DAS-MEI até o dia 20</li>
            <li>Emissão de notas fiscais quando necessário</li>
            <li>Controle de receitas e despesas</li>
          </ul>

          <h2>Obrigações anuais</h2>
          <p>Anualmente, o MEI deve:</p>
          <ul>
            <li>Entregar a DASN-SIMEI até 31 de maio</li>
            <li>Verificar se não ultrapassou o limite de faturamento</li>
            <li>Atualizar dados cadastrais se necessário</li>
          </ul>

          <h2>Limites e restrições</h2>
          <p>É importante estar atento aos limites estabelecidos para o MEI em 2024.</p>
        `,
        excerpt:
          "O Microempreendedor Individual (MEI) possui obrigações específicas que devem ser cumpridas para manter a regularidade fiscal.",
        published: true,
        publishedAt: new Date(Date.now() - 172800000), // 2 dias atrás
        authorId: editor.id,
        readingTime: 3,
        wordCount: 200,
        metaTitle: "Obrigações do MEI: Guia Completo 2024",
        metaDescription:
          "Guia completo sobre as obrigações fiscais do MEI em 2024 e como manter sua regularidade.",
        categories: {
          create: {
            categoryId: categories[1].id, // Fiscal
          },
        },
        tags: {
          create: [
            { tagId: tags[6].id }, // MEI
            { tagId: tags[5].id }, // Simples Nacional
          ],
        },
      },
    }),
  ]);

  // Criar comentários de exemplo
  const subscriber = await prisma.user.create({
    data: {
      email: "usuario@exemplo.com",
      name: "Usuário Exemplo",
      role: "SUBSCRIBER",
      passwordHash: userPassword,
      emailVerified: true,
      preferences: {
        create: {
          theme: "system",
          language: "pt-BR",
          emailNotifications: false,
          pushNotifications: false,
          newsletterSubscribed: true,
        },
      },
      metadata: {
        create: {
          loginCount: 0,
          registrationSource: "seed",
        },
      },
    },
  });

  await prisma.comment.create({
    data: {
      content:
        "Excelente artigo! Muito esclarecedor sobre as mudanças da reforma tributária.",
      postId: posts[0].id,
      authorId: subscriber.id,
      approved: true,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Gostaria de saber mais sobre o cronograma de implementação.",
      postId: posts[0].id,
      authorId: subscriber.id,
      approved: true,
    },
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log("👤 Usuários criados:");
  console.log("   - Admin: admin@fradema.com.br (Admin123!)");
  console.log("   - Editor: editor@fradema.com.br (Editor123!)");
  console.log("   - Autor: autor@fradema.com.br (User123!)");
  console.log("   - Usuário: usuario@exemplo.com (User123!)");
  console.log("📚 Categorias criadas:", categories.length);
  console.log("🏷️ Tags criadas:", tags.length);
  console.log("📝 Posts criados:", posts.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
