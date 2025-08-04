// src/app/api/upload/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Configuração do upload local
const UPLOAD_DIR = join(process.cwd(), "public/uploads");

/**
 * Upload local de imagem
 */
async function uploadLocal(file: File) {
  // Garantir que o diretório existe
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  // Gerar nome único
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split(".").pop();
  const fileName = `${timestamp}-${randomString}.${fileExtension}`;
  const filePath = join(UPLOAD_DIR, fileName);

  // Converter e salvar arquivo
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filePath, buffer);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    url: `/uploads/${fileName}`,
    path: fileName,
  };
}

/**
 * Upload de imagem (sempre local por enquanto)
 * Suporta JPG, PNG, WebP, GIF
 */
export async function POST(request: NextRequest) {
  console.log("🔄 API /api/upload/image chamada");
  console.log("📋 Headers:", Object.fromEntries(request.headers.entries()));

  try {
    console.log("🚀 Iniciando upload de imagem...");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ Nenhum arquivo fornecido");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📁 Arquivo recebido:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Tipo de arquivo inválido:", file.type);
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("❌ Arquivo muito grande:", file.size, "bytes");
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    console.log("📁 Usando upload local");

    const imageData = await uploadLocal(file);

    const response = {
      success: true,
      image: imageData,
    };

    console.log("✅ Upload local concluído:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erro no upload:", error);

    // Log detalhado do erro
    if (error instanceof Error) {
      console.error("📝 Mensagem de erro:", error.message);
      console.error("📚 Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Deletar imagem local
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Iniciando deleção de imagem...");

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      console.error("❌ Caminho do arquivo não fornecido");
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }

    // Deletar arquivo local
    const fs = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), "public", filePath);

    try {
      await fs.unlink(fullPath);
      console.log("✅ Arquivo local deletado:", filePath);
    } catch (error) {
      console.log("⚠️ Arquivo local não encontrado:", filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro na deleção:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
