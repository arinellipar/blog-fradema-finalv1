// src/app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/categories - Buscar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    // Ordenar categorias priorizando os 4 cards principais do blog
    const categoryOrder = [
      // 4 cards principais do blog
      "francisco-arrighi",
      "atualizacoes-tributarias",
      "imposto-renda",
      "reforma-tributaria",
      // Outras categorias importantes
      "tributario",
      "fiscal",
      "contabil",
      "legislacao",
      "planejamento",
      "compliance",
    ];

    const sortedCategories = categories.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.slug);
      const bIndex = categoryOrder.indexOf(b.slug);

      // Se ambas estão na lista de prioridade, usar a ordem da lista
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // Se apenas uma está na lista, ela vem primeiro
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Se nenhuma está na lista, ordenar alfabeticamente
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(sortedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Criar nova categoria (apenas para admins)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      );
    }

    // Criar slug a partir do nome
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    // Verificar se já existe uma categoria com este slug
    const existingCategory = await prisma.category.findFirst({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
