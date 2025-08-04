// src/app/api/upload/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// AWS S3
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const UPLOAD_DIR = join(process.cwd(), "public/uploads");

function isVercel() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function isS3Configured() {
  return (
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_ACCESS_KEY &&
    !!process.env.AWS_REGION &&
    !!process.env.AWS_S3_BUCKET_NAME
  );
}

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function getS3Bucket() {
  return process.env.AWS_S3_BUCKET_NAME!;
}

function getS3PublicUrl(key: string) {
  if (process.env.AWS_CLOUDFRONT_DOMAIN) {
    return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${getS3Bucket()}.s3.${
    process.env.AWS_REGION
  }.amazonaws.com/${key}`;
}

async function uploadToS3(file: File) {
  const s3 = getS3Client();
  const bucket = getS3Bucket();
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split(".").pop();
  const fileName = `${timestamp}-${randomString}.${fileExtension}`;
  const key = fileName;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });
  await s3.send(putCommand);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    url: getS3PublicUrl(key),
    path: key,
  };
}

async function uploadLocal(file: File) {
  if (isVercel()) {
    throw new Error(
      "Upload local não é suportado no Vercel. Configure AWS S3."
    );
  }
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split(".").pop();
  const fileName = `${timestamp}-${randomString}.${fileExtension}`;
  const filePath = join(UPLOAD_DIR, fileName);
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // S3 em produção, local em dev
    if (isS3Configured() && isVercel()) {
      try {
        const imageData = await uploadToS3(file);
        return NextResponse.json({ success: true, image: imageData });
      } catch (err) {
        return NextResponse.json(
          {
            error: "Erro ao enviar para o S3",
            details: (err as Error).message,
          },
          { status: 500 }
        );
      }
    } else {
      // Local
      try {
        const imageData = await uploadLocal(file);
        return NextResponse.json({ success: true, image: imageData });
      } catch (err) {
        return NextResponse.json(
          { error: "Erro no upload local", details: (err as Error).message },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload image", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    if (!filePath) {
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }
    if (isS3Configured() && isVercel()) {
      // S3
      const s3 = getS3Client();
      const bucket = getS3Bucket();
      const delCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });
      await s3.send(delCommand);
      return NextResponse.json({ success: true });
    } else {
      // Local
      const fs = await import("fs/promises");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), "public", filePath);
      try {
        await fs.unlink(fullPath);
      } catch {}
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete image", details: (error as Error).message },
      { status: 500 }
    );
  }
}
