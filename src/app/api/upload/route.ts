// src/app/api/upload/route.ts - API para upload de arquivos para AWS S3

import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

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
    // Verificar se o AWS S3 está configurado
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "AWS S3 not configured" },
        { status: 503 }
      );
    }

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

    // Gerar nome único
    const filename = generateUniqueFilename(file.name);

    // Path no S3: attachments/{year}/{month}/{filename}
    const date = new Date();
    const storagePath = `attachments/${date.getFullYear()}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${filename}`;

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

    await s3Client.send(uploadCommand);

    // Gerar URL pública
    let publicUrl: string;
    if (CLOUDFRONT_DOMAIN) {
      // Usar CloudFront se configurado
      publicUrl = `https://${CLOUDFRONT_DOMAIN}/${storagePath}`;
    } else {
      // Usar URL direta do S3
      publicUrl = `https://${BUCKET_NAME}.s3.${
        process.env.AWS_REGION || "us-east-1"
      }.amazonaws.com/${storagePath}`;
    }

    return NextResponse.json({
      success: true,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      path: storagePath,
      message: "Arquivo enviado com sucesso",
    });
  } catch (error) {
    console.error("Erro no upload S3:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Método DELETE para remover arquivos
export async function DELETE(request: NextRequest) {
  try {
    // Verificar se o AWS S3 está configurado
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "AWS S3 not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }

    // Remover do AWS S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("S3 delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
