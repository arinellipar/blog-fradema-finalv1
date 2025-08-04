// src/app/api/test-production/route.ts

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Teste de produção iniciado");

    const testData = {
      environment: process.env.NODE_ENV,
      currentDir: process.cwd(),
      uploadDir: join(process.cwd(), "public/uploads"),
      nodeVersion: process.version,
      platform: process.platform,
    };

    console.log("📋 Dados do ambiente:", testData);

    // Testar criação de diretório
    const uploadDir = join(process.cwd(), "public/uploads");
    console.log("📁 Testando criação de diretório:", uploadDir);

    if (!existsSync(uploadDir)) {
      console.log("📁 Criando diretório de upload...");
      await mkdir(uploadDir, { recursive: true });
      console.log("✅ Diretório criado com sucesso");
    } else {
      console.log("✅ Diretório já existe");
    }

    // Testar escrita de arquivo
    const testFile = join(uploadDir, "test-production.txt");
    const testContent = `Teste de produção - ${new Date().toISOString()}`;

    console.log("📄 Testando escrita de arquivo:", testFile);
    await writeFile(testFile, testContent);
    console.log("✅ Arquivo de teste criado com sucesso");

    // Verificar se o arquivo foi criado
    const fs = await import("fs/promises");
    const stats = await fs.stat(testFile);

    console.log("📊 Estatísticas do arquivo:", {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    });

    return NextResponse.json({
      success: true,
      message: "Teste de produção concluído",
      data: testData,
      fileCreated: true,
      fileSize: stats.size,
    });
  } catch (error) {
    console.error("❌ Erro no teste de produção:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV,
        currentDir: process.cwd(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Teste de upload em produção");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📁 Arquivo recebido:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Testar upload simples
    const uploadDir = join(process.cwd(), "public/uploads");
    const timestamp = Date.now();
    const fileName = `test-${timestamp}.txt`;
    const filePath = join(uploadDir, fileName);

    // Garantir que o diretório existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Converter e salvar
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    console.log("✅ Arquivo de teste salvo:", filePath);

    return NextResponse.json({
      success: true,
      message: "Upload de teste concluído",
      file: {
        name: file.name,
        size: file.size,
        savedAs: fileName,
        path: filePath,
      },
    });
  } catch (error) {
    console.error("❌ Erro no upload de teste:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
