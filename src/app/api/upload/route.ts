// src/app/api/upload/route.ts - API para upload de arquivos

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Configuração do upload
const UPLOAD_DIR = join(process.cwd(), "public/uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Garantir que o diretório de upload existe
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Gerar nome único para o arquivo
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Validar arquivo
function validateFile(file: File): { valid: boolean; error?: string } {
  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB`,
    };
  }

  // Verificar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_TYPES.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se é multipart/form-data
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type deve ser multipart/form-data" },
        { status: 400 }
      );
    }

    // Extrair dados do formulário
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 }
      );
    }

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Garantir que o diretório existe
    await ensureUploadDir();

    // Gerar nome único
    const filename = generateUniqueFilename(file.name);
    const filepath = join(UPLOAD_DIR, filename);

    // Converter arquivo para buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL pública do arquivo
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      message: "Arquivo enviado com sucesso",
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Método GET para listar arquivos (opcional)
export async function GET() {
  try {
    await ensureUploadDir();

    return NextResponse.json({
      message: "API de upload funcionando",
      maxFileSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      allowedTypes: ALLOWED_TYPES,
    });
  } catch (error) {
    console.error("Erro na API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
