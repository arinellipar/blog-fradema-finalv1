// src/app/api/upload/route.ts - API para upload de arquivos para AWS S3 ou local

import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Configuração do AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "blog-images";
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN;

// Configuração do upload
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

// Configuração do upload local
const UPLOAD_DIR = join(process.cwd(), "public/uploads");

/**
 * Verificar se o AWS S3 está configurado e acessível
 */
async function isS3Available() {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return false;
    }

    const headBucketCommand = new HeadBucketCommand({
      Bucket: BUCKET_NAME,
    });
    await s3Client.send(headBucketCommand);
    return true;
  } catch (error) {
    console.log("⚠️ S3 não disponível, usando fallback local");
    return false;
  }
}

/**
 * Upload local como fallback
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
    filename: fileName,
    originalName: file.name,
    size: file.size,
    type: file.type,
    url: `/uploads/${fileName}`,
    path: fileName,
  };
}

// Gerar nome único para o arquivo
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${fileExtension}`;
}

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Tipo de arquivo não permitido",
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando upload de arquivo...");

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

    console.log("📁 Arquivo recebido:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Tentar usar S3 primeiro
    const s3Available = await isS3Available();

    if (s3Available) {
      console.log("✅ Usando AWS S3");

      // Gerar nome único
      const filename = generateUniqueFilename(file.name);

      // Path no S3: attachments/{year}/{month}/{filename}
      const date = new Date();
      const storagePath = `attachments/${date.getFullYear()}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${filename}`;

      console.log("📂 Path no S3:", storagePath);

      // Converter arquivo para buffer
      const bytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);

      // Upload para o AWS S3
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storagePath,
        Body: uint8Array,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000", // 1 ano
        ACL: "public-read",
      });

      console.log("🚀 Enviando para S3...");
      await s3Client.send(uploadCommand);
      console.log("✅ Upload S3 concluído!");

      // Gerar URL pública
      let publicUrl: string;
      if (CLOUDFRONT_DOMAIN) {
        // Usar CloudFront se configurado
        publicUrl = `https://${CLOUDFRONT_DOMAIN}/${storagePath}`;
        console.log("🌐 URL CloudFront:", publicUrl);
      } else {
        // Usar URL direta do S3
        publicUrl = `https://${BUCKET_NAME}.s3.${
          process.env.AWS_REGION || "us-east-1"
        }.amazonaws.com/${storagePath}`;
        console.log("🌐 URL S3:", publicUrl);
      }

      const response = {
        success: true,
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: storagePath,
        message: "Arquivo enviado com sucesso",
      };

      console.log("✅ Resposta final:", response);
      return NextResponse.json(response);
    } else {
      console.log("📁 Usando upload local");

      const fileData = await uploadLocal(file);

      const response = {
        success: true,
        ...fileData,
        message: "Arquivo enviado com sucesso",
      };

      console.log("✅ Upload local concluído:", response);
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("❌ Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Método DELETE para remover arquivos
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Iniciando deleção de arquivo...");

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      console.error("❌ Caminho do arquivo não fornecido");
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }

    // Verificar se é um arquivo local ou S3
    if (filePath.startsWith("/uploads/") || !filePath.includes("/")) {
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
    } else {
      // Deletar do S3
      const s3Available = await isS3Available();
      if (s3Available) {
        console.log("🗑️ Deletando do S3:", filePath);
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: filePath,
        });
        await s3Client.send(deleteCommand);
        console.log("✅ Arquivo S3 deletado com sucesso!");
      } else {
        console.log("⚠️ S3 não disponível, arquivo pode não ter sido deletado");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro na deleção:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
