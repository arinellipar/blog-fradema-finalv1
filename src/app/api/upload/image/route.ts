// src/app/api/upload/image/route.ts

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
    name: file.name,
    size: file.size,
    type: file.type,
    url: `/uploads/${fileName}`,
    path: fileName,
  };
}

/**
 * Upload de imagem para o AWS S3 ou local
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

    // Tentar usar S3 primeiro
    const s3Available = await isS3Available();

    if (s3Available) {
      console.log("✅ Usando AWS S3");

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;

      // Path no S3: images/{year}/{month}/{filename}
      const date = new Date();
      const storagePath = `images/${date.getFullYear()}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${fileName}`;

      console.log("📂 Path no S3:", storagePath);

      // Converter File para ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log("📦 Buffer criado, tamanho:", uint8Array.length);

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
      console.log("✅ Upload S3 concluído com sucesso!");

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
        image: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          path: storagePath,
        },
      };

      console.log("✅ Resposta final:", response);
      return NextResponse.json(response);
    } else {
      console.log("📁 Usando upload local");

      const imageData = await uploadLocal(file);

      const response = {
        success: true,
        image: imageData,
      };

      console.log("✅ Upload local concluído:", response);
      return NextResponse.json(response);
    }
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
 * Deletar imagem do AWS S3 ou local
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

    // Verificar se é um arquivo local ou S3
    if (filePath.startsWith("/uploads/")) {
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
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
